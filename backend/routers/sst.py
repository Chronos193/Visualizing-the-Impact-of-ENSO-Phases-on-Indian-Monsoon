from fastapi import APIRouter, HTTPException
import json
from pathlib import Path
import sys

# Add backend to path to import config
sys.path.append(str(Path(__file__).resolve().parent.parent.parent))
from backend.config import PRECOMPUTED_DIR

router = APIRouter()

@router.get("/grid")
def get_sst_grid(dataset: str = "ersst", event: str = "nov_2015"):
    path = PRECOMPUTED_DIR / "sst" / dataset / f"{event}.json"
            
    if not path.exists():
        raise HTTPException(status_code=404, detail="Grid data not found")
        
    with open(path, "r") as f:
        data = json.load(f)
        return data

@router.get("/grid-year")
def get_sst_grid_year(year: int):
    event = f"nov_{year}"
    path = PRECOMPUTED_DIR / "sst" / "ersst" / f"{event}.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail="Grid data not found")
    with open(path, "r") as f:
        data = json.load(f)
        data["date"] = f"{year}-11-01" 
        return data
