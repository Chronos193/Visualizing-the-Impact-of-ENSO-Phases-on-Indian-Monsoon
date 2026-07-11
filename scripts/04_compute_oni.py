import os
import sys
import json
import sqlite3
from pathlib import Path

# Add backend to path to import config
sys.path.append(str(Path(__file__).resolve().parent.parent))
from backend.config import DB_PATH, PRECOMPUTED_DIR

def run():
    print("Running 04_compute_oni...")
    oni_dir = PRECOMPUTED_DIR / "oni"
    oni_dir.mkdir(parents=True, exist_ok=True)
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Timeseries
    rows = cursor.execute("SELECT year_month, oni, phase FROM oni_monthly ORDER BY year_month").fetchall()
    timeseries_data = [{"year_month": r[0], "oni": round(r[1], 2), "phase": r[2]} for r in rows if r[1] is not None]
    
    with open(oni_dir / "oni_timeseries.json", "w") as f:
        json.dump({"data": timeseries_data}, f)
        
    # Phase Summary
    rows = cursor.execute("SELECT phase, COUNT(*) as count FROM oni_monthly GROUP BY phase").fetchall()
    phase_data = [{"phase": r[0], "count": r[1]} for r in rows]
    
    with open(oni_dir / "phase_summary.json", "w") as f:
        json.dump({"phases": phase_data}, f)
        
    conn.close()
    print("ONI precomputed JSONs generated.")

if __name__ == "__main__":
    run()
