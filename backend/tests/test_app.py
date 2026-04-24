import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.backend.api.routes import create_app


def build_test_app(tmp_path):
  os.environ["DATABASE_PATH"] = str(tmp_path / "mysafepass-test.db")
  os.environ["DATABASE_ENCRYPTION_KEY"] = "test-encryption-key-32-characters"
  os.environ["SECRET_KEY"] = "test-secret-key"
  os.environ["JWT_SECRET_KEY"] = "test-jwt-secret-key"
  return create_app()


def test_health_endpoint_returns_status(tmp_path):
  app = build_test_app(tmp_path)
  client = app.test_client()

  response = client.get("/api/health")

  assert response.status_code == 200
  assert response.get_json()["status"] == "healthy"


def test_version_endpoint_returns_metadata(tmp_path):
  app = build_test_app(tmp_path)
  client = app.test_client()

  response = client.get("/api/version")

  assert response.status_code == 200
  assert response.get_json()["name"] == "MySafePass Backend"
