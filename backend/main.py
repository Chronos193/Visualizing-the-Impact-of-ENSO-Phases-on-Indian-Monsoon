from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from .routers import sst, oni, rainfall, correlation, ndvi
import datetime

app = FastAPI(title="ENSO-Monsoon Analytics API")

@app.middleware("http")
async def log_requests(request: Request, call_next):
    with open("request_logs.txt", "a") as f:
        f.write(f"{datetime.datetime.now()} Request: {request.method} {request.url}\n")
    response = await call_next(request)
    with open("request_logs.txt", "a") as f:
        f.write(f"{datetime.datetime.now()} Response: {response.status_code} for {request.url}\n")
    return response

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sst.router,         prefix="/api/sst",         tags=["SST"])
app.include_router(oni.router,         prefix="/api/oni",         tags=["ONI"])
app.include_router(rainfall.router,    prefix="/api/rainfall",    tags=["Rainfall"])
app.include_router(correlation.router, prefix="/api/correlation", tags=["Correlation"])
app.include_router(ndvi.router,        prefix="/api/ndvi",        tags=["NDVI"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the ENSO-Monsoon Analytics API"}
