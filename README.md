# Visualizing the Impact of ENSO Phases on Indian Monsoon

This project explores the relationships between the El Niño-Southern Oscillation (ENSO) phases and the Indian Summer Monsoon Rainfall. It provides a full-stack, highly interactive web dashboard to analyze historical Sea Surface Temperatures (SST), Oceanic Niño Index (ONI), Rainfall anomalies, and Vegetation (NDVI) across India.

## Repository Structure
- `/Frontend` - React/Vite web application with Recharts and D3 maps.
- `/backend` - FastAPI Python server delivering optimized precomputed data.
- `/scripts` - Python scripts for the raw data processing pipeline.

*(Note: Large raw datasets and precomputed data files are intentionally excluded from this repository.)*

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