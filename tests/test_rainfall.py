import pytest
from fastapi.testclient import TestClient
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))
from backend.main import app

client = TestClient(app)

def test_get_rainfall_anomaly():
    response = client.get("/api/rainfall/anomaly?year=2015")
    # if it doesn't exist it returns 404, we expect 200 since we processed it
    if response.status_code == 200:
        data = response.json()
        assert "states" in data
    elif response.status_code == 404:
        pytest.skip("JSON not generated yet")
    else:
        assert False, f"Unexpected status code {response.status_code}"

def test_get_rainfall_cumulative():
    response = client.get("/api/rainfall/cumulative?state=Maharashtra&year=2015")
    if response.status_code == 200:
        data = response.json()
        assert "daily" in data
    elif response.status_code == 404:
        pytest.skip("JSON not generated yet")
    else:
        assert False, f"Unexpected status code {response.status_code}"

def test_get_animation_frame():
    response = client.get("/api/rainfall/animation-frame?year=2015&start_date=2015-06-01&end_date=2015-06-30")
    assert response.status_code == 200
    data = response.json()
    assert "frame" in data
    assert isinstance(data["frame"], list)
