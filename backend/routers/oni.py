from fastapi import APIRouter, HTTPException, Depends
import json
from pathlib import Path
import sys

# Add backend to path to import config
sys.path.append(str(Path(__file__).resolve().parent.parent.parent))
from backend.config import PRECOMPUTED_DIR
from backend.database import get_db_connection

router = APIRouter()

@router.get("/timeseries")
def get_oni_timeseries():
    path = PRECOMPUTED_DIR / "oni" / "oni_timeseries.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail="ONI timeseries not found")
    with open(path, "r") as f:
        return json.load(f)

@router.get("/details")
def get_oni_details(start: str, end: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    rows = cursor.execute(
        "SELECT * FROM oni_monthly WHERE year_month BETWEEN ? AND ? ORDER BY year_month",
        (start, end)
    ).fetchall()
    conn.close()
    return {"data": [dict(r) for r in rows]}

@router.get("/phase-summary")
def get_phase_summary(start: str, end: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    rows = cursor.execute(
        "SELECT phase, COUNT(*) as count FROM oni_monthly "
        "WHERE year_month BETWEEN ? AND ? GROUP BY phase",
        (start, end)
    ).fetchall()
    conn.close()
    return {"phases": [dict(r) for r in rows]}

