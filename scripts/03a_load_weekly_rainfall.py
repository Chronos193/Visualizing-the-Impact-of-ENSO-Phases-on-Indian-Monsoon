import os
import sys
import sqlite3
import rasterio
import geopandas as gpd
from rasterstats import zonal_stats
from pathlib import Path
import datetime

# Add backend to path to import config
sys.path.append(str(Path(__file__).resolve().parent.parent))
from backend.config import RAW_DIR, DB_PATH

def run():
    print("Running 03a_load_weekly_rainfall...")
    tif_path = RAW_DIR / "rainfall" / "CHIRPS_India_Weekly_Rainfall_5km.tif"
    geojson_path = RAW_DIR / "rainfall" / "india_states.geojson"
    
    # Load India states
    states_gdf = gpd.read_file(geojson_path)
    if 'shapeName' not in states_gdf.columns:
        print("Error: shapeName column not found in geojson.")
        return
        
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create weekly_rainfall table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS weekly_rainfall (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        state       TEXT    NOT NULL,
        year        INTEGER NOT NULL,
        start_date  DATE    NOT NULL,
        week_num    INTEGER NOT NULL,
        rainfall_mm REAL    NOT NULL,
        UNIQUE(state, start_date)
    );
    """)
    cursor.execute("DELETE FROM weekly_rainfall")
    
    # Start date for the weekly data
    current_date = datetime.date(2000, 1, 1)
    
    with rasterio.open(tif_path) as src:
        total_bands = src.count
        print(f"Total weekly bands found: {total_bands}")
        
        # We process band by band
        for band_idx in range(1, total_bands + 1):
            year = current_date.year
            # Week number calculation (1 to 53)
            # isocalendar()[1] gives ISO week number, which works nicely
            week_num = current_date.isocalendar()[1]
            date_str = current_date.strftime("%Y-%m-%d")
            
            data = src.read(band_idx)
            nodata = src.nodata
            if nodata is not None:
                data[data == nodata] = 0.0
            data[data < -9000] = 0.0
            
            stats = zonal_stats(states_gdf, data, affine=src.transform, stats="mean", nodata=nodata)
            
            records = []
            for i, stat in enumerate(stats):
                state_name = states_gdf.iloc[i]['shapeName']
                mean_rain = stat['mean']
                if mean_rain is None:
                    mean_rain = 0.0
                records.append((state_name, year, date_str, week_num, float(mean_rain)))
            
            cursor.executemany(
                "INSERT INTO weekly_rainfall (state, year, start_date, week_num, rainfall_mm) VALUES (?, ?, ?, ?, ?)",
                records
            )
            
            # Move to next week
            current_date += datetime.timedelta(days=7)
            
            if band_idx % 100 == 0:
                print(f"Processed {band_idx}/{total_bands} bands...")
                conn.commit()

    conn.commit()
    conn.close()
    print("Weekly rainfall data loaded successfully.")

if __name__ == "__main__":
    run()
