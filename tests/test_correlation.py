import pytest
from fastapi.testclient import TestClient
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))
from backend.main import app

client = TestClient(app)

def test_get_heatmap():
    response = client.get("/api/correlation/heatmap")
    if response.status_code == 200:
        data = response.json()
        assert "states" in data
        assert "pearson_r" in data
    elif response.status_code == 404:
        pytest.skip("JSON not generated yet")
    else:
        assert False, f"Unexpected status code {response.status_code}"

def test_get_scatter():
    response = client.get("/api/correlation/scatter?state=Maharashtra")
    if response.status_code == 200:
        data = response.json()
        assert "points" in data
    elif response.status_code == 404:
        pytest.skip("JSON not generated yet")
    else:
        assert False, f"Unexpected status code {response.status_code}"
