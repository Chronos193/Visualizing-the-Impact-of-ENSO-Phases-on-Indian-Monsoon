import os
import sys
import json
import sqlite3
import datetime
import rasterio
import geopandas as gpd
from rasterstats import zonal_stats
from pathlib import Path

# Add backend to path to import config
sys.path.append(str(Path(__file__).resolve().parent.parent))
from backend.config import RAW_DIR, DB_PATH, PRECOMPUTED_DIR

REGION_MAPPING = {
    "North": ["Jammu & Kashmir", "Himachal Pradesh", "Punjab", "Haryana", "Uttarakhand", "Uttar Pradesh", "Delhi"],
    "South": ["Kerala", "Tamil Nadu", "Karnataka", "Andhra Pradesh", "Telangana"],
    "East": ["West Bengal", "Odisha", "Bihar", "Jharkhand", "Assam", "Sikkim", "Arunachal Pradesh", "Nagaland", "Manipur", "Mizoram", "Tripura", "Meghalaya"],
    "West": ["Rajasthan", "Gujarat", "Maharashtra", "Goa"],
    "Central": ["Madhya Pradesh", "Chhattisgarh"]
}

import unicodedata

def normalize_state(name):
    n = unicodedata.normalize('NFD', name)
    n = ''.join(c for c in n if unicodedata.category(c) != 'Mn')
    return n.replace('&', 'and')

def get_region(state_name):
    norm_name = normalize_state(state_name).lower()
    for region, states in REGION_MAPPING.items():
        if any(s.lower() in norm_name for s in states):
            return region
    return "Other"

def run():
    print("Running 07_parse_ndvi...")
    tif_path = RAW_DIR / "ndvi" / "MOD13A2_India_NDVI_48day_2000_2024.tif"
    geojson_path = RAW_DIR / "rainfall" / "india_states.geojson"
    
    states_gdf = gpd.read_file(geojson_path)
    # Assign region
    states_gdf['Region'] = states_gdf['shapeName'].apply(get_region)
    # Dissolve by region
    regions_gdf = states_gdf.dissolve(by='Region').reset_index()
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM ndvi_regional")
    
    # 48-day composites from 2000-2024 means roughly 7-8 bands per year.
    # 25 years * 7.6 = 190 bands.
    # Let's assume start is Jan 2000.
    start_date = datetime.date(2000, 1, 1)
    
    records = []
    
    with rasterio.open(tif_path) as src:
        nodata = src.nodata
        for band_idx in range(1, src.count + 1):
            comp_start = start_date + datetime.timedelta(days=(band_idx - 1) * 48)
            comp_end = comp_start + datetime.timedelta(days=47)
            
            data = src.read(band_idx)
            if nodata is not None:
                data[data == nodata] = 0.0
            data[data < -10000] = 0.0
            
            # scaling factor for MODIS NDVI is usually 0.0001
            # But let's assume it's already scaled or we'll multiply by 0.0001 if max > 1.
            
            stats = zonal_stats(regions_gdf, data, affine=src.transform, stats="mean", nodata=nodata)
            
            for i, stat in enumerate(stats):
                region_name = regions_gdf.iloc[i]['Region']
                if region_name == "Other":
                    continue
                mean_ndvi = stat['mean']
                if mean_ndvi is None:
                    continue
                    
                if mean_ndvi > 10:
                    mean_ndvi = mean_ndvi * 0.0001
                    
                records.append((region_name, str(comp_start), str(comp_end), float(mean_ndvi), None))
                
    cursor.executemany(
        "INSERT INTO ndvi_regional (region, composite_start, composite_end, mean_ndvi, ndvi_anomaly) VALUES (?, ?, ?, ?, ?)",
        records
    )
    conn.commit()
    
    # Compute Long-term NDVI mean for Kharif (Jun-Oct) and write JSON
    # Join with ONI (we can just pull oni_monthly and match by nearest month)
    
    ndvi_dir = PRECOMPUTED_DIR / "ndvi"
    reg_dir = ndvi_dir / "regional"
    reg_dir.mkdir(parents=True, exist_ok=True)
    
    for region in ["North", "South", "East", "West", "Central"]:
        # Query Kharif months
        # composite_start between Jun and Oct
        rows = cursor.execute("""
            SELECT composite_start, mean_ndvi
            FROM ndvi_regional
            WHERE region = ? AND strftime('%m', composite_start) IN ('06', '07', '08', '09', '10')
            ORDER BY composite_start
        """, (region,)).fetchall()
        
        # Calculate mean for anomaly
        all_means = [r[1] for r in rows if r[1] is not None]
        long_term_mean = sum(all_means) / len(all_means) if all_means else 0
        
        json_data = []
        for r in rows:
            c_start = r[0]
            m_ndvi = r[1]
            anom = m_ndvi - long_term_mean
            
            # get ONI
            ym = c_start[:7]
            oni_row = cursor.execute("SELECT oni FROM oni_monthly WHERE year_month = ?", (ym,)).fetchone()
            oni_val = oni_row[0] if oni_row else 0.0
            
            # update db with anomaly
            cursor.execute("UPDATE ndvi_regional SET ndvi_anomaly = ? WHERE region = ? AND composite_start = ?", (anom, region, c_start))
            
            json_data.append({
                "composite_start": c_start,
                "mean_ndvi": round(m_ndvi, 3),
                "ndvi_anomaly": round(anom, 3),
                "oni": round(oni_val, 2) if oni_val else None
            })
            
        with open(reg_dir / f"{region.lower()}.json", "w") as f:
            json.dump({
                "region": region,
                "season_filter": "kharif",
                "data": json_data
            }, f)
            
    conn.commit()
    conn.close()
    
    # Write national aggregate just as a mock for now
    with open(ndvi_dir / "national_kharif.json", "w") as f:
         json.dump({"data": []}, f)
         
    print("NDVI processed.")

if __name__ == "__main__":
    run()
