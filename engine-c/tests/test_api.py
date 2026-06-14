"""Real endpoint tests against the artifact bundle. CI proves the served shapes."""

from fastapi.testclient import TestClient

from api.main import app

client = TestClient(app)

DECISIONS = {"clear", "lab-test", "divert"}


def test_healthz() -> None:
    r = client.get("/healthz")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert body["artifacts_present"] is True


def test_garments_shape() -> None:
    r = client.get("/garments")
    assert r.status_code == 200
    garments = r.json()
    assert len(garments) >= 1
    g = garments[0]
    assert {"id", "name", "archetype", "fiberComposition", "inSilico"} <= g.keys()


def test_classify_conforms_to_contract() -> None:
    r = client.get("/classify/carters-legging-blend")
    assert r.status_code == 200
    c = r.json()
    assert c["garmentId"] == "carters-legging-blend"
    assert c["decision"] in DECISIONS
    assert 0.0 <= c["probability"] <= 1.0
    assert c["inSilico"] is True


def test_passport_conforms_to_contract() -> None:
    r = client.get("/passport/carters-legging-blend")
    assert r.status_code == 200
    p = r.json()
    assert p["aromaticAmineRelease"] == "NONE"
    assert p["trl"] == "TRL 2-3"
    assert p["classification"]["decision"] in DECISIONS


def test_unknown_garment_404() -> None:
    assert client.get("/classify/not-a-real-garment").status_code == 404
