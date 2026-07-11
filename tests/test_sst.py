import pytest
from fastapi.testclient import TestClient
import sys
from pathlib import Path

# Add backend to path to import app
sys.path.append(str(Path(__file__).resolve().parent.parent))
from backend.main import app

client = TestClient(app)

def test_get_sst_grid():
    response = client.get("/api/sst/grid?dataset=ersst&event=nov_2015")
    assert response.status_code == 200
    data = response.json()
    assert "dataset" in data
    assert "grid" in data
    assert "values" in data["grid"]

def test_get_sst_grid_oisst():
    response = client.get("/api/sst/grid?dataset=oisst&event=nov_2015")
    assert response.status_code == 200
    data = response.json()
    assert "dataset" in data
    assert "grid" in data
    assert "values" in data["grid"]

def test_get_sst_grid_not_found():
    response = client.get("/api/sst/grid?dataset=ersst&event=invalid_event")
    assert response.status_code == 404
