import os
import sys
import json
import sqlite3
import unicodedata
from pathlib import Path

# Add backend to path to import config
sys.path.append(str(Path(__file__).resolve().parent.parent))
from backend.config import DB_PATH, PRECOMPUTED_DIR

def normalize_state(name):
    # Remove diacritics (macrons, etc.) and replace & with and
    n = unicodedata.normalize('NFD', name)
    n = ''.join(c for c in n if unicodedata.category(c) != 'Mn')
    return n.replace('&', 'and')

def run():
    print("Running 05_compute_rainfall_anomalies...")
    anomaly_dir = PRECOMPUTED_DIR / "rainfall" / "anomaly"
    cumulative_dir = PRECOMPUTED_DIR / "rainfall" / "cumulative"
    anomaly_dir.mkdir(parents=True, exist_ok=True)
    cumulative_dir.mkdir(parents=True, exist_ok=True)
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # 1. Calculate LPA from weekly_rainfall across all 25 years (JJAS approx weeks 22 to 40)
    lpa_rows = cursor.execute("""
        SELECT state, SUM(rainfall_mm) / 25.0 as lpa_mm
        FROM weekly_rainfall
        WHERE week_num BETWEEN 22 AND 40
        GROUP BY state
    """).fetchall()
    
    state_lpa = {r['state']: r['lpa_mm'] for r in lpa_rows}
    
    # 2. Anomaly per year
    for year in range(2000, 2025):
        rows = cursor.execute(f"""
            SELECT state, SUM(rainfall_mm) as actual_mm
            FROM weekly_rainfall
            WHERE year = {year} AND week_num BETWEEN 22 AND 40
            GROUP BY state
        """).fetchall()
        
        states_data = []
        for r in rows:
            state_raw = r['state']
            state_norm = normalize_state(state_raw)
            actual = r['actual_mm']
            lpa = state_lpa.get(state_raw, 0)
            if lpa > 0:
                dev = ((actual - lpa) / lpa) * 100
            else:
                dev = 0
            states_data.append({
                "state": state_norm,
                "actual_mm": round(actual, 2),
                "lpa_mm": round(lpa, 2),
                "deviation_pct": round(dev, 2)
            })
            
        with open(anomaly_dir / f"{year}.json", "w") as f:
            json.dump({
                "year": year,
                "season": "JJAS",
                "states": states_data
            }, f)
            
        # 3. Cumulative per state per year (June to Oct, approx weeks 22 to 43)
        states = cursor.execute("SELECT DISTINCT state FROM weekly_rainfall").fetchall()
        for s in states:
            state_raw = s['state']
            state_norm = normalize_state(state_raw)
            weekly_rows = cursor.execute(f"""
                SELECT start_date as date, rainfall_mm
                FROM weekly_rainfall
                WHERE state = ? AND year = {year} AND week_num BETWEEN 22 AND 43
                ORDER BY week_num
            """, (state_raw,)).fetchall()
            
            daily_data = []
            cum = 0
            for wr in weekly_rows:
                cum += wr['rainfall_mm']
                daily_data.append({
                    "date": wr['date'],
                    "daily_mm": round(wr['rainfall_mm'], 2), # actually weekly
                    "cumulative_mm": round(cum, 2)
                })
                
            with open(cumulative_dir / f"{state_norm}_{year}.json", "w") as f:
                json.dump({
                    "state": state_norm,
                    "year": year,
                    "daily": daily_data
                }, f)
                
    conn.close()
    print("Rainfall JSONs generated.")

if __name__ == "__main__":
    run()
