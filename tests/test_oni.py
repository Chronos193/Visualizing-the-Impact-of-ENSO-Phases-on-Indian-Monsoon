import pytest
from fastapi.testclient import TestClient
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))
from backend.main import app

client = TestClient(app)

def test_get_oni_timeseries():
    response = client.get("/api/oni/timeseries")
    assert response.status_code == 200
    data = response.json()
    assert "data" in data
    assert isinstance(data["data"], list)

def test_get_oni_details():
    response = client.get("/api/oni/details?start=2015-06&end=2015-12")
    assert response.status_code == 200
    data = response.json()
    assert "data" in data
    assert isinstance(data["data"], list)

def test_get_phase_summary():
    response = client.get("/api/oni/phase-summary?start=2015-06&end=2015-12")
    assert response.status_code == 200
    data = response.json()
    assert "phases" in data
    assert isinstance(data["phases"], list)

