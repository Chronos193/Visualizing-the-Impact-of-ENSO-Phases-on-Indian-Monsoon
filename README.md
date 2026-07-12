# Visualizing the Impact of ENSO Phases on Indian Monsoon

This project explores the relationships between the El Niño-Southern Oscillation (ENSO) phases and the Indian Summer Monsoon Rainfall. It provides a full-stack, highly interactive web dashboard to analyze historical Sea Surface Temperatures (SST), Oceanic Niño Index (ONI), Rainfall anomalies, and Vegetation (NDVI) across India.

## Repository Structure
- `/Frontend` - React/Vite web application with Recharts and D3 maps.
- `/backend` - FastAPI Python server delivering optimized precomputed data.
- `/scripts` - Python scripts for the raw data processing pipeline.

*(Note: Large raw datasets and precomputed data files are intentionally excluded from this repository.)*

## Data Setup & Preprocessing

The raw and precomputed datasets required for this project are hosted on Hugging Face.

1. **Download the Datasets**:
   Download the datasets from [https://huggingface.co/datasets/Chronos19/IndianMonsoon_ENSO_Impact/tree/main/db](https://huggingface.co/datasets/Chronos19/IndianMonsoon_ENSO_Impact/).
   
   Create a huggingface token to download the datasets with higher rate limit.
   First export the token
   ```bash
   export HF_TOKEN='your_token_here'
   ```
   Then run the download command to download the datasets.
   ```bash
   hf download Chronos19/IndianMonsoon_ENSO_Impact \
    --repo-type dataset \
    --local-dir data
   ```

2. **Place the Data**:
   Extract and place the downloaded folders/files into the root `data/` directory keeping the following structure:
   - `data/raw/` (raw netCDF and GeoTIFF files)
   - `data/db/` (location for the SQLite database)
   - `data/precomputed/` (precomputed JSON files for the API endpoints)

3. **Run Preprocessing Pipeline (Optional)**:
   If you wish to re-run the processing pipeline from raw data, execute the scripts sequentially:
   ```bash
   # Using uv (recommended)
   uv run scripts/00_init_db.py
   uv run scripts/01_parse_ersst.py
   uv run scripts/02_parse_oisst.py
   uv run scripts/03_load_rainfall.py
   uv run scripts/03a_load_weekly_rainfall.py
   uv run scripts/04_compute_oni.py
   uv run scripts/05_compute_rainfall_anomalies.py
   uv run scripts/06_compute_correlations.py
   uv run scripts/07_parse_ndvi.py

   # Or using standard pip
   pip install .
   python scripts/00_init_db.py
   python scripts/01_parse_ersst.py
   # ... continue through all 07_parse_ndvi.py scripts
   ```

## How to Spin Up the Server Locally

To run the full stack locally, you need two terminal windows.

### 1. Start the Backend API (Terminal 1)
```bash
cd backend
# Install dependencies (fastapi, uvicorn)
pip install fastapi uvicorn
# Start the server on port 8000
uvicorn main:app --reload --port 8000
```
*(The backend should now be listening at http://127.0.0.1:8000)*

### 2. Start the Frontend App (Terminal 2)
```bash
cd Frontend
# Install NPM dependencies
npm install
# Start the Vite development server
npm run dev
```
*(The frontend should automatically open at http://localhost:5173)*

### How they connect
The frontend uses a Vite proxy (`vite.config.ts`) to forward all API calls matching `/api/*` directly to the backend at `http://127.0.0.1:8000`. You do not need to configure CORS or change any URLs!


## Team Members

- Aayush Gajeshwar
- Shubham Kumar Patel
- Sourabh Sankhala
- Dev Prakash
- Prakhar Gupta
- Deepak Kumar
- Vishvas Patel