from fastapi import APIRouter, HTTPException
import json
from pathlib import Path
import sys

# Add backend to path to import config
sys.path.append(str(Path(__file__).resolve().parent.parent.parent))
from backend.config import PRECOMPUTED_DIR

router = APIRouter()

@router.get("/regional")
def get_regional(region: str = "south"):
    path = PRECOMPUTED_DIR / "ndvi" / "regional" / f"{region.lower()}.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail="Regional NDVI not found")
    with open(path, "r") as f:
        return json.load(f)

@router.get("/national")
def get_national():
    path = PRECOMPUTED_DIR / "ndvi" / "national_kharif.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail="National NDVI not found")
    with open(path, "r") as f:
        return json.load(f)
