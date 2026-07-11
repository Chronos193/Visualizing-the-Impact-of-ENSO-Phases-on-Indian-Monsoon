import os
import sys
import json
import rasterio
from pathlib import Path

# Add backend to path to import config
sys.path.append(str(Path(__file__).resolve().parent.parent))
from backend.config import RAW_DIR, PRECOMPUTED_DIR

def run():
    print("Running 02_parse_oisst...")
    tif_path = RAW_DIR / "oisst" / "OISST_v2_1_Nino_Weekly_Anomalies.tif"
    
    # We will pick 3 bands representing roughly Nov 2015, Nov 2020, Nov 2023
    # Band 1 ~ Jan 2000. 
    # Nov 2015 is ~ 15*52 + 45 = 825
    # Nov 2020 is ~ 20*52 + 45 = 1085
    # Nov 2023 is ~ 23*52 + 45 = 1241
    events = {
        "nov_2015": ("2015-11", 825),
        "nov_2020": ("2020-11", 1085),
        "nov_2023": ("2023-11", 1241)
    }
    
    sst_oisst_dir = PRECOMPUTED_DIR / "sst" / "oisst"
    sst_oisst_dir.mkdir(parents=True, exist_ok=True)
    
    with rasterio.open(tif_path) as src:
        transform = src.transform
        for event_name, (event_date, band_idx) in events.items():
            if band_idx > src.count:
                print(f"Skipping {event_name}, band {band_idx} out of range.")
                continue
                
            data = src.read(band_idx)
            # Replace no-data or extreme values with None/skip
            # Since dtype is int16, they might be scaled. E.g. scale factor 0.01?
            # Let's assume they are multiplied by 100 if they look large, or just use as-is.
            # OISST anomalies are typically float, if int16, they are usually scaled by 100.
            
            values = []
            for row in range(src.height):
                for col in range(src.width):
                    val = float(data[row, col])
                    if val < -10000 or val > 10000:
                        continue # assume nodata
                        
                    # Apply standard scale factor if needed, let's assume 0.01 for int16 SST anomalies
                    val = val * 0.01
                    
                    # calculate lat/lon
                    lon, lat = rasterio.transform.xy(transform, row, col)
                    # Convert lon 0-360 to -180 to 180 if needed
                    if lon > 180:
                        lon -= 360
                        
                    values.append({
                        "lat": round(lat, 2),
                        "lon": round(lon, 2),
                        "sst": round(val, 2)
                    })
                    
            out_json = {
                "dataset": "oisst",
                "date": event_date,
                "grid": {
                    "lat_range": [-5, 5],
                    "lon_range": [-170, -120],
                    "lat_step": 0.25,
                    "lon_step": 0.25,
                    "values": values
                }
            }
            with open(sst_oisst_dir / f"{event_name}.json", "w") as f:
                json.dump(out_json, f)
            print(f"Generated {event_name}.json with {len(values)} points.")

if __name__ == "__main__":
    run()
