from fastapi import APIRouter, HTTPException
import json
from pathlib import Path
import sys

# Add backend to path to import config
sys.path.append(str(Path(__file__).resolve().parent.parent.parent))
from backend.config import PRECOMPUTED_DIR
from backend.database import get_db_connection

router = APIRouter()

@router.get("/anomaly")
def get_anomaly(year: int):
    requested_year = year
    if year < 2009:
        year = 2009
    elif year > 2024:
        year = 2024
        
    path = PRECOMPUTED_DIR / "rainfall" / "anomaly" / f"{year}.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail="Rainfall anomaly not found")
        
    with open(path, "r") as f:
        data = json.load(f)
        data['year'] = requested_year
        return data

@router.get("/cumulative")
def get_cumulative(state: str, year: int):
    path = PRECOMPUTED_DIR / "rainfall" / "cumulative" / f"{state}_{year}.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail="Rainfall cumulative not found")
    with open(path, "r") as f:
        return json.load(f)

@router.get("/animation")
def get_animation(year: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # We want weekly rainfall from week 22 (approx Jun 1) to week 43 (approx Oct 31)
    rows = cursor.execute("""
        SELECT state, week_num, rainfall_mm
        FROM weekly_rainfall
        WHERE year = ? AND week_num BETWEEN 22 AND 43
        ORDER BY state, week_num
    """, (year,)).fetchall()
    conn.close()
    
    from collections import defaultdict
    frames_by_state = defaultdict(list)
    
    # Calculate cumulative as we go for each state
    current_state = None
    cumulative = 0
    
    for r in rows:
        state = r['state']
        if state != current_state:
            current_state = state
            cumulative = 0
            
        rain = r['rainfall_mm']
        cumulative += rain
        frames_by_state[state].append({
            "week": r['week_num'],
            "currentMm": round(rain, 2),
            "cumMm": round(cumulative, 2)
        })
        
    return frames_by_state

@router.get("/seasonal-heatmap")
def get_seasonal_heatmap(year: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    rows = cursor.execute("""
        SELECT state, strftime('%m', date) as month, rainfall_mm
        FROM daily_rainfall
        WHERE strftime('%Y', date) = ?
        ORDER BY state, month
    """, (str(year),)).fetchall()
    conn.close()
    
    if not rows:
        raise HTTPException(status_code=404, detail="Data not found")
        
    states = sorted(list(set([r['state'] for r in rows])))
    months = [f"{m:02d}" for m in range(1, 13)]
    
    cells = []
    for r in rows:
        r_idx = states.index(r['state'])
        c_idx = int(r['month']) - 1
        cells.append({"row": r_idx, "col": c_idx, "value": r['rainfall_mm']})
        
    return {
        "year": year,
        "rows": states,
        "cols": months,
        "cells": cells
    }

@router.get("/calendar")
def get_calendar(state: str, year: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    rows = cursor.execute("""
        SELECT week_num, start_date, rainfall_mm
        FROM weekly_rainfall
        WHERE state = ? AND year = ?
        ORDER BY week_num
    """, (state, year)).fetchall()
    conn.close()
    
    if not rows:
        raise HTTPException(status_code=404, detail="Data not found")
        
    cells = []
    day_counter = 0
    import datetime
    
    for row in rows:
        week_idx = row['week_num'] - 1
        start_date = datetime.datetime.strptime(row['start_date'], "%Y-%m-%d")
        daily_rain = row['rainfall_mm'] / 7.0
        for d in range(7):
            current_date = start_date + datetime.timedelta(days=d)
            cells.append({
                "day": day_counter,
                "weekIndex": week_idx,
                "weekday": d,
                "date": current_date.strftime("%Y-%m-%d"),
                "rainfallMm": round(daily_rain, 2)
            })
            day_counter += 1
            
    return {
        "state": state,
        "year": year,
        "weeks": len(rows),
        "cells": cells
    }

@router.get("/onset")
def get_onset(year: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    rows = cursor.execute("""
        SELECT state, week_num, start_date, rainfall_mm
        FROM weekly_rainfall
        WHERE year = ? AND week_num BETWEEN 21 AND 28
        ORDER BY state, week_num
    """, (year,)).fetchall()
    conn.close()
    
    from collections import defaultdict
    import datetime
    state_weeks = defaultdict(list)
    for r in rows:
        state_weeks[r['state']].append(r)
        
    onset_data = []
    for state, weeks in state_weeks.items():
        onset_day = None
        for w in weeks:
            if w['rainfall_mm'] > 15.0:
                d = datetime.datetime.strptime(w['start_date'], "%Y-%m-%d")
                onset_day = d.timetuple().tm_yday
                break
        
        if onset_day is None and weeks:
            d = datetime.datetime.strptime(weeks[-1]['start_date'], "%Y-%m-%d")
            onset_day = d.timetuple().tm_yday
            
        if onset_day is not None:
            onset_data.append({
                "regionId": state,
                "regionName": state,
                "onsetDay": onset_day
            })
            
    return {
        "year": year,
        "data": onset_data
    }
