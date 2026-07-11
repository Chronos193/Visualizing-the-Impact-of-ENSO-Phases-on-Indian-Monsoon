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
    print("Running 03_load_rainfall...")
    tif_path = RAW_DIR / "rainfall" / "CHIRPS_India_Monthly_Rainfall_5km.tif"
    geojson_path = RAW_DIR / "rainfall" / "india_states.geojson"
    
    # Load India states
    states_gdf = gpd.read_file(geojson_path)
    
    # Check if 'shapeName' is the state column
    if 'shapeName' not in states_gdf.columns:
        print("Error: shapeName column not found in geojson.")
        return
        
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM daily_rainfall")
    cursor.execute("DELETE FROM rainfall_lpa")
    
    # CHIRPS custom TIFF provided has 300 bands (2000-2024).
    # Band 1 = Jan 2000
    
    start_year = 2000
    end_year = 2024
    start_band = (start_year - 2000) * 12 + 1
    end_band = (end_year - 2000 + 1) * 12
    
    # Process the full 2000-2024 timeframe as requested
    proc_start_year = 2000
    proc_end_year = 2024
    proc_start_band = (proc_start_year - 2000) * 12 + 1
    proc_end_band = (proc_end_year - 2000 + 1) * 12
    
    with rasterio.open(tif_path) as src:
        # We will iterate year by year, month by month
        band_idx = proc_start_band
        for year in range(proc_start_year, proc_end_year + 1):
            for month in range(1, 13):
                if band_idx > src.count:
                    break
                    
                date_str = f"{year}-{month:02d}-01"
                
                # Use rasterstats for zonal mean
                data = src.read(band_idx)
                # handle nodata
                nodata = src.nodata
                if nodata is not None:
                    data[data == nodata] = 0.0 # or np.nan, CHIRPS missing is usually -9999
                data[data < -9000] = 0.0
                
                stats = zonal_stats(states_gdf, data, affine=src.transform, stats="mean", nodata=nodata)
                
                records = []
                for i, stat in enumerate(stats):
                    state_name = states_gdf.iloc[i]['shapeName']
                    mean_rain = stat['mean']
                    if mean_rain is None:
                        mean_rain = 0.0
                    records.append((state_name, date_str, float(mean_rain)))
                
                cursor.executemany(
                    "INSERT INTO daily_rainfall (state, date, rainfall_mm) VALUES (?, ?, ?)",
                    records
                )
                
                band_idx += 1
            print(f"Processed rainfall for {year}")

    # Compute LPA: group by (state, month), take mean
    print("Computing LPA...")
    cursor.execute("""
        INSERT INTO rainfall_lpa (state, month, lpa_mm)
        SELECT state, strftime('%m', date) as month, AVG(rainfall_mm)
        FROM daily_rainfall
        GROUP BY state, strftime('%m', date)
    """)
    
    conn.commit()
    conn.close()
    print("Rainfall data loaded successfully.")

if __name__ == "__main__":
    run()
