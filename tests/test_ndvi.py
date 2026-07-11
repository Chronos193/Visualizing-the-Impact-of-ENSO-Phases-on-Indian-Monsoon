import pytest
from fastapi.testclient import TestClient
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))
from backend.main import app

client = TestClient(app)

def test_get_regional_ndvi():
    response = client.get("/api/ndvi/regional?region=south")
    if response.status_code == 200:
        data = response.json()
        assert "data" in data
    elif response.status_code == 404:
        pytest.skip("JSON not generated yet")
    else:
        assert False, f"Unexpected status code {response.status_code}"

def test_get_national_ndvi():
    response = client.get("/api/ndvi/national")
    if response.status_code == 200:
        data = response.json()
        assert "data" in data
    elif response.status_code == 404:
        pytest.skip("JSON not generated yet")
    else:
        assert False, f"Unexpected status code {response.status_code}"
