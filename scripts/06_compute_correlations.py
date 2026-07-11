import os
import sys
import json
import sqlite3
import numpy as np
from scipy import stats
from pathlib import Path

# Add backend to path to import config
sys.path.append(str(Path(__file__).resolve().parent.parent))
from backend.config import DB_PATH, PRECOMPUTED_DIR

def run():
    print("Running 06_compute_correlations...")
    corr_dir = PRECOMPUTED_DIR / "correlation"
    scatter_dir = corr_dir / "scatter"
    corr_dir.mkdir(parents=True, exist_ok=True)
    scatter_dir.mkdir(parents=True, exist_ok=True)
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # We need JJAS ONI and JJAS rainfall anomaly
    # ONI is monthly. We can average JJAS ONI for each year.
    oni_jjas = {}
    rows = cursor.execute("SELECT year_month, oni, phase FROM oni_monthly").fetchall()
    for row in rows:
        ym = row[0]
        oni = row[1]
        phase = row[2]
        
        if oni is None:
            continue
            
        year = int(ym[:4])
        month = int(ym[5:])
        if 6 <= month <= 9:
            if year not in oni_jjas:
                oni_jjas[year] = []
            oni_jjas[year].append((oni, phase))
            
    # Calculate mean ONI for JJAS per year
    oni_yearly = {}
    for y, vals in oni_jjas.items():
        if len(vals) == 4:
            mean_oni = sum([v[0] for v in vals]) / 4
            # majority phase
            phases = [v[1] for v in vals]
            majority_phase = max(set(phases), key=phases.count)
            oni_yearly[y] = {"oni": mean_oni, "phase": majority_phase}
            
    # Read rainfall anomalies
    anomaly_dir = PRECOMPUTED_DIR / "rainfall" / "anomaly"
    state_years = {}
    for y in range(2000, 2025):
        fp = anomaly_dir / f"{y}.json"
        if not fp.exists():
            continue
        with open(fp, "r") as f:
            data = json.load(f)
            for s in data["states"]:
                st = s["state"]
                dev = s["deviation_pct"]
                if st not in state_years:
                    state_years[st] = []
                state_years[st].append({"year": y, "anomaly": dev})
                
    heatmap_data = []
    
    for state, data_points in state_years.items():
        # Match with ONI
        x_oni = []
        y_anom = []
        points = []
        
        for dp in data_points:
            y = dp["year"]
            a = dp["anomaly"]
            if y in oni_yearly:
                o = oni_yearly[y]["oni"]
                p = oni_yearly[y]["phase"]
                x_oni.append(o)
                y_anom.append(a)
                points.append({
                    "year": y,
                    "oni": round(o, 2),
                    "anomaly_pct": round(a, 2),
                    "phase": p
                })
                
        if len(x_oni) > 2:
            r, p_val = stats.pearsonr(x_oni, y_anom)
            slope, intercept = np.polyfit(x_oni, y_anom, 1)
            
            heatmap_data.append({
                "state": state,
                "r": round(float(r), 2),
                "p_value": round(float(p_val), 3)
            })
            
            with open(scatter_dir / f"{state}.json", "w") as f:
                json.dump({
                    "state": state,
                    "pearson_r": round(float(r), 2),
                    "p_value": round(float(p_val), 3),
                    "regression": {"slope": round(float(slope), 2), "intercept": round(float(intercept), 2)},
                    "points": points
                }, f)
                
    with open(corr_dir / "heatmap.json", "w") as f:
        json.dump({
            "states": [h["state"] for h in heatmap_data],
            "pearson_r": heatmap_data
        }, f)
        
    print("Correlations computed.")

if __name__ == "__main__":
    run()
