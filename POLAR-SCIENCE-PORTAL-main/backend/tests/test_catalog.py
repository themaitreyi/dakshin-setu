from fastapi.testclient import TestClient

from app.main import app


def test_production_catalog_and_permitted_media():
    with TestClient(app) as client:
        summary = client.get("/api/v1/catalog/summary")
        stations = client.get("/api/v1/catalog/station")
        media = client.get("/api/v1/catalog/media")
        himadri = client.get("/api/v1/catalog/station/STN_HIMADRI")

        assert summary.status_code == 200
        assert summary.json()["total"] >= 60
        assert stations.json()["count"] == 6
        assert media.json()["count"] == 10
        assert himadri.json()["name"] == "Himadri Station"
        assert himadri.json()["media"][0]["file_url"]

        asset = client.get(himadri.json()["media"][0]["file_url"])
        assert asset.status_code == 200
        assert len(asset.content) > 1_000


def test_records_preview_before_download_and_original_document_streaming():
    with TestClient(app) as client:
        json_record = client.get("/api/v1/record-json/publication/10.5194/os-21-419-2025")
        pdf_record = client.get("/api/v1/record-pdf/publication/10.5194/os-21-419-2025")
        original = client.get("/api/v1/document-assets/10.5194/os-21-419-2025")

        assert json_record.status_code == 200
        assert json_record.json()["evidence_summary"]
        assert json_record.json()["has_original"] is True
        assert json_record.json()["media"][0]["file_url"]
        assert json_record.json()["media"][0]["evidence_role"]
        assert pdf_record.status_code == 200
        assert pdf_record.content.startswith(b"%PDF-")
        assert len(pdf_record.content) > 100_000
        assert original.status_code == 200
        assert original.headers["content-type"].startswith("application/pdf")


def test_station_photos_have_coordinates_rights_and_local_files():
    with TestClient(app) as client:
        maitri = client.get("/api/v1/catalog/station/STN_MAITRI").json()
        assert maitri["coordinates"] == {"lat": -70.7661, "lon": 11.7358, "elevation_m": 117}
        station_photo = next(item for item in maitri["media"] if item["id"] == "MED_STATION_MAITRI")
        assert station_photo["rights"]["redistribution_permitted"] is True
        assert client.get(station_photo["file_url"]).status_code == 200


def test_unknown_catalog_type_is_rejected():
    with TestClient(app) as client:
        assert client.get("/api/v1/catalog/unknown").status_code == 404
