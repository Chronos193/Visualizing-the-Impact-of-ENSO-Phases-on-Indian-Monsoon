# ENSO-Monsoon Analytics Backend

This is the backend API for the ENSO-Monsoon Analytics dashboard. It serves precomputed spatial and temporal weather data (Rainfall, Sea Surface Temperatures, NDVI, and Oceanic Niño Index) to the frontend via a high-performance FastAPI server.

## Tech Stack
- FastAPI (Python)
- Uvicorn

## Precomputed Data Pipeline
Instead of querying raw gigabyte-scale NetCDF and GeoTIFF datasets at runtime, all data is pre-processed using the `scripts/` directory. This creates optimized JSON and SQLite outputs inside the `data/` directory, which FastAPI then serves to the frontend efficiently.

## Setup and Running
To run the backend API locally:
1. Ensure you have Python installed and the required dependencies.
2. We use `uv` for dependency management. Install dependencies (or use `pip install fastapi uvicorn sqlite3`).
3. Start the Uvicorn server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
