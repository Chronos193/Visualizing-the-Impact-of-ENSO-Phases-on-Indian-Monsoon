import os
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
RAW_DIR = DATA_DIR / "raw"
DB_PATH = DATA_DIR / "db" / "climate.db"
PRECOMPUTED_DIR = DATA_DIR / "precomputed"

# Ensure directories exist
PRECOMPUTED_DIR.mkdir(parents=True, exist_ok=True)
(DATA_DIR / "db").mkdir(parents=True, exist_ok=True)
