import sqlite3
import os
import sys
from pathlib import Path

# Add backend to path to import config
sys.path.append(str(Path(__file__).resolve().parent.parent))
from backend.config import DB_PATH

def init_db():
    print(f"Initializing database at {DB_PATH}")
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Create daily_rainfall table (used for monthly data on 1st of month)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS daily_rainfall (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        state       TEXT    NOT NULL,
        date        DATE    NOT NULL,
        rainfall_mm REAL    NOT NULL,
        UNIQUE(state, date)
    );
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_rainfall_state_date ON daily_rainfall(state, date);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_rainfall_date ON daily_rainfall(date);")

    # Create oni_monthly table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS oni_monthly (
        year_month      TEXT    PRIMARY KEY,  -- "2015-06"
        sst_raw         REAL    NOT NULL,
        climatology     REAL    NOT NULL,
        anomaly         REAL    NOT NULL,
        oni             REAL    NOT NULL,
        phase           TEXT    NOT NULL
    );
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_oni_phase ON oni_monthly(phase);")

    # Create ndvi_regional table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS ndvi_regional (
        region          TEXT    NOT NULL,
        composite_start DATE    NOT NULL,
        composite_end   DATE    NOT NULL,
        mean_ndvi       REAL    NOT NULL,
        ndvi_anomaly    REAL,
        PRIMARY KEY (region, composite_start)
    );
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_ndvi_region ON ndvi_regional(region);")

    # Create rainfall_lpa table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS rainfall_lpa (
        state       TEXT    NOT NULL,
        month       INTEGER NOT NULL,
        lpa_mm      REAL    NOT NULL,
        PRIMARY KEY (state, month)
    );
    """)

    conn.commit()
    conn.close()
    print("Database initialized successfully.")

if __name__ == "__main__":
    init_db()
