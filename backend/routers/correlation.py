from fastapi import APIRouter, HTTPException
import json
from pathlib import Path
import sys

# Add backend to path to import config
sys.path.append(str(Path(__file__).resolve().parent.parent.parent))
from backend.config import PRECOMPUTED_DIR

router = APIRouter()

@router.get("/heatmap")
def get_heatmap():
    path = PRECOMPUTED_DIR / "correlation" / "heatmap.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail="Correlation heatmap not found")
    with open(path, "r") as f:
        return json.load(f)

@router.get("/scatter")
def get_scatter(state: str):
    path = PRECOMPUTED_DIR / "correlation" / "scatter" / f"{state}.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail="Correlation scatter not found")
    with open(path, "r") as f:
        return json.load(f)

@router.get("/lag-features")
def get_lag_features():
    return {
        "features": [
            {"id": "oni_lag_0", "label": "ONI (Lag 0)"},
            {"id": "oni_lag_1", "label": "ONI (Lag 1)"},
            {"id": "oni_lag_2", "label": "ONI (Lag 2)"},
            {"id": "rainfall", "label": "Rainfall Anomaly"}
        ],
        "cells": [
            {"xFeature": "oni_lag_0", "yFeature": "rainfall", "row": 0, "col": 3, "r": -0.45},
            {"xFeature": "oni_lag_1", "yFeature": "rainfall", "row": 1, "col": 3, "r": -0.32},
            {"xFeature": "oni_lag_2", "yFeature": "rainfall", "row": 2, "col": 3, "r": -0.15},
            {"xFeature": "oni_lag_0", "yFeature": "oni_lag_1", "row": 0, "col": 1, "r": 0.85},
            {"xFeature": "oni_lag_1", "yFeature": "oni_lag_2", "row": 1, "col": 2, "r": 0.81},
            {"xFeature": "oni_lag_0", "yFeature": "oni_lag_2", "row": 0, "col": 2, "r": 0.65}
        ],
        "series": {
            "oni_lag_0": [{"year": 2010, "value": -1.5}, {"year": 2015, "value": 2.6}, {"year": 2020, "value": -1.2}],
            "oni_lag_1": [{"year": 2010, "value": -1.2}, {"year": 2015, "value": 2.1}, {"year": 2020, "value": -0.9}],
            "oni_lag_2": [{"year": 2010, "value": -0.8}, {"year": 2015, "value": 1.5}, {"year": 2020, "value": -0.5}],
            "rainfall": [{"year": 2010, "value": 15.2}, {"year": 2015, "value": -18.4}, {"year": 2020, "value": 9.1}]
        },
        "years": [2010, 2015, 2020]
    }
