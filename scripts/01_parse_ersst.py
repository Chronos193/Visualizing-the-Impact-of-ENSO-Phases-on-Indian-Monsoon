import os
import sys
import json
import sqlite3
import numpy as np
import xarray as xr
import pandas as pd
from pathlib import Path

# Add backend to path to import config
sys.path.append(str(Path(__file__).resolve().parent.parent))
from backend.config import RAW_DIR, DB_PATH, PRECOMPUTED_DIR

def run():
    print("Running 01_parse_ersst...")
    ersst_dir = RAW_DIR / "ersst"
    
    # 1. Open multi-file dataset
    # The files are named like ersst.v6.200001.nc
    # Usually ERSST variable is 'sst'
    ds = xr.open_mfdataset(str(ersst_dir / "*.nc"), combine='by_coords')
    
    # Ensure longitude is in -180 to 180 if needed, or 0-360.
    # ERSST usually uses 0-360 longitude. Niño 3.4 is 170W - 120W, which is 190 - 240 in 0-360 format.
    # Let's check longitude range
    lons = ds['lon'].values
    if lons.max() > 180:
        lon_min, lon_max = 190.0, 240.0
    else:
        lon_min, lon_max = -170.0, -120.0
        
    # 2. Define regions
    # Full Indo-Pacific for the frontend map: 60S - 66N, 100E - 283E (which is 77W)
    indo_lon_min, indo_lon_max = 100.0, 283.0
    indo_lat_min, indo_lat_max = -60.0, 66.0
    
    # Niño 3.4 for ONI: 5S - 5N, 190E - 240E (170W - 120W)
    nino_lon_min, nino_lon_max = 190.0, 240.0
    nino_lat_min, nino_lat_max = -5.0, 5.0
    
    lats = ds['lat'].values
    if lats[0] > lats[-1]:
        indo_pacific = ds.sel(lat=slice(indo_lat_max, indo_lat_min), lon=slice(indo_lon_min, indo_lon_max))
        nino34 = ds.sel(lat=slice(nino_lat_max, nino_lat_min), lon=slice(nino_lon_min, nino_lon_max))
    else:
        indo_pacific = ds.sel(lat=slice(indo_lat_min, indo_lat_max), lon=slice(indo_lon_min, indo_lon_max))
        nino34 = ds.sel(lat=slice(nino_lat_min, nino_lat_max), lon=slice(nino_lon_min, nino_lon_max))
        
    # Create directory for JSONs
    sst_ersst_dir = PRECOMPUTED_DIR / "sst" / "ersst"
    sst_ersst_dir.mkdir(parents=True, exist_ok=True)

    # 3. Extract grid for all months from 2000 to 2024
    import pandas as pd
    time_range = pd.date_range(start="2000-01-01", end="2024-12-31", freq="MS")
    
    for dt in time_range:
        event_name = f"{dt.strftime('%b').lower()}_{dt.year}"
        event_date = dt.strftime("%Y-%m")
        try:
            # select the specific month from the full Indo-Pacific grid
            grid = indo_pacific.sel(time=event_date)
            # handle cases where multiple times might be returned if time is not exactly monthly 1st
            if 'time' in grid.dims:
                grid = grid.isel(time=0)
            
            grid = grid.squeeze() # Remove extra dims like zlev
            
            sst_values = grid['sst'].values
            grid_lats = grid['lat'].values
            grid_lons = grid['lon'].values
            
            # Format lons to -180 to 180 for JSON if they were 0-360
            json_lons = [l if l <= 180 else l - 360 for l in grid_lons]
            
            values = []
            for i, lat in enumerate(grid_lats):
                for j, lon in enumerate(json_lons):
                    val = float(sst_values[i, j])
                    if not np.isnan(val):
                        values.append({"lat": float(lat), "lon": float(lon), "sst": val})
                        
            out_json = {
                "dataset": "ersst",
                "date": event_date,
                "grid": {
                    "lat_range": [-60, 66],
                    "lon_range": [100, 283],
                    "lat_step": 2.0,
                    "lon_step": 2.0,
                    "values": values
                }
            }
            with open(sst_ersst_dir / f"{event_name}.json", "w") as f:
                json.dump(out_json, f)
        except Exception as e:
            print(f"Warning: Could not process event {event_name}: {e}")

    # 4. Compute area-weighted monthly mean SST
    # Niño 3.4 region area weighting: weights = cos(lat)
    weights = np.cos(np.deg2rad(nino34.lat))
    weights.name = "weights"
    sst_mean = nino34['sst'].weighted(weights).mean(dim=["lon", "lat"])
    
    # Convert to pandas dataframe
    df = sst_mean.to_dataframe().reset_index()
    df['year_month'] = df['time'].dt.strftime('%Y-%m')
    df = df[['year_month', 'sst']].rename(columns={'sst': 'sst_raw'})
    df = df.dropna(subset=['sst_raw'])

    # 5. Compute climatology (2000-2024 base)
    df['year'] = df['year_month'].str[:4].astype(int)
    df['month'] = df['year_month'].str[5:].astype(int)
    
    base_period = df[(df['year'] >= 2000) & (df['year'] <= 2024)]
    climatology = base_period.groupby('month')['sst_raw'].mean().reset_index()
    climatology.rename(columns={'sst_raw': 'climatology'}, inplace=True)
    
    df = df.merge(climatology, on='month')
    
    # 6. Compute anomaly
    df['anomaly'] = df['sst_raw'] - df['climatology']
    
    # Sort chronologically before rolling mean
    df = df.sort_values('year_month').reset_index(drop=True)
    
    # 7. Compute 3-month running mean -> ONI
    df['oni'] = df['anomaly'].rolling(window=3, center=False).mean()
    
    # Drop rows where ONI is NaN (first 2 months)
    # Actually, to align with typical ONI (centered or not), we'll keep NaN or backfill.
    # NOAA ONI is typically a 3-month centered mean, but rolling(3) is usually trailing. 
    # Let's do a centered rolling mean:
    df['oni'] = df['anomaly'].rolling(window=3, center=True).mean()
    
    # 8. Classify phase
    # ONI ≥ +0.5 for 5+ consecutive months → El Niño
    # ONI ≤ −0.5 for 5+ consecutive months → La Niña
    # We will just do a simple classification per month based on threshold, since 
    # full NOAA definition requires 5 consecutive months, we can approximate or implement it.
    
    df['phase'] = "Neutral"
    
    # Helper to find consecutive runs
    is_el_nino = df['oni'] >= 0.5
    is_la_nina = df['oni'] <= -0.5
    
    def apply_consecutive_runs(series, threshold_series, phase_name):
        run_length = 0
        run_indices = []
        for i, val in enumerate(threshold_series):
            if val:
                run_length += 1
                run_indices.append(i)
            else:
                if run_length >= 5:
                    for idx in run_indices:
                        df.loc[idx, 'phase'] = phase_name
                run_length = 0
                run_indices = []
        if run_length >= 5:
            for idx in run_indices:
                df.loc[idx, 'phase'] = phase_name
                
    apply_consecutive_runs(df['phase'], is_el_nino, "El Nino")
    apply_consecutive_runs(df['phase'], is_la_nina, "La Nina")
    
    df['oni'] = df['oni'].fillna(df['anomaly']) # fallback for edges
    
    # 9. Insert into oni_monthly table
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM oni_monthly")
    
    records = df[['year_month', 'sst_raw', 'climatology', 'anomaly', 'oni', 'phase']].to_records(index=False)
    cursor.executemany(
        "INSERT INTO oni_monthly (year_month, sst_raw, climatology, anomaly, oni, phase) VALUES (?, ?, ?, ?, ?, ?)",
        records
    )
    conn.commit()
    conn.close()
    
    print(f"Processed ERSST and inserted {len(records)} rows into oni_monthly.")

if __name__ == "__main__":
    run()
