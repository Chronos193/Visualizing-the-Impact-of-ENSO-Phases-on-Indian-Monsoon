# ENSO-Monsoon Analytics Frontend

This is the frontend application for the ENSO-Monsoon Analytics dashboard. It is built using React, Vite, and Tailwind CSS. It visualizes the impact of El Niño-Southern Oscillation (ENSO) phases on the Indian Monsoon using highly interactive charts and maps.

## Tech Stack
- React 18
- Vite
- Tailwind CSS
- Recharts (for charts)
- D3 (for maps & geo data processing)

## Setup and Running
To run the frontend locally:
1. Make sure you have Node.js installed.
2. Install the dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

By default, the Vite proxy will forward API requests starting with `/api` to `http://127.0.0.1:8000`, so make sure your backend is running there!