"""Typed, provenance-aware access to the bundled Polar Production Core.

The source JSON is preserved verbatim.  Records are indexed in SQLite/Postgres so
the API can filter them without pretending that every supplied claim has passed
the same level of review.
"""
from __future__ import annotations

import json
import hashlib
import io
import mimetypes
import os
import re
import textwrap
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw, ImageFont

from fastapi import HTTPException, Query
from fastapi.responses import FileResponse, Response
from sqlalchemy import Column, JSON, String, delete, select
from sqlalchemy.orm import Session

from . import repository as repo


CORE = Path(
    os.getenv(
        "POLAR_PRODUCTION_CORE_DIR",
        str(Path(__file__).resolve().parents[1] / "polar_production_core"),
    )
).resolve()


class CatalogEntity(repo.Base):
    __tablename__ = "catalog_entities"
    id = Column(String(160), primary_key=True)
    kind = Column(String(32), nullable=False, index=True)
    title = Column(String(400), nullable=False)
    verification = Column(String(64), nullable=False, default="verification-not-recorded")
    source_url = Column(String(1000), nullable=True)
    data = Column(JSON, nullable=False)


class CatalogRelation(repo.Base):
    __tablename__ = "catalog_relationships"
    id = Column(String(64), primary_key=True)
    data = Column(JSON, nullable=False)


def _read(name: str) -> dict[str, Any]:
    path = (CORE / name).resolve()
    if not path.is_relative_to(CORE) or not path.is_file():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def _verification() -> dict[str, str]:
    reviews = {
        str(row.get("record_id")): str(row.get("status", "verification-not-recorded"))
        for row in _read("source_verification.json").get("verification_audit", [])
    }
    # The supplied audit uses legacy identifiers for these two canonical records.
    aliases = {
        "PUB_OCEAN_SCIENCE_55E": "10.5194/os-21-419-2025",
        "DATA_MAITRI_AWS": "NPDC-MET-MAITRI-2023",
    }
    for legacy_id, canonical_id in aliases.items():
        if legacy_id in reviews:
            reviews[canonical_id] = reviews[legacy_id]
    return reviews


def _rows() -> list[tuple[str, str, str, str | None, dict[str, Any]]]:
    rows: list[tuple[str, str, str, str | None, dict[str, Any]]] = []

    stations = _read("verified_stations.json")
    for item in stations.get("stations", []):
        rows.append((item["id"], "station", item["name"], item.get("official_source"), item))
    for item in stations.get("vessels", []):
        rid = "VESSEL_" + item["name"].upper().replace(" ", "_")
        rows.append((rid, "vessel", item["name"], None, item))

    expeditions = _read("complete_expeditions.json")
    for group, items in expeditions.items():
        if group == "metadata" or not isinstance(items, list):
            continue
        prefix = "ISEA" if "antarctic" in group else "ARCTIC" if "arctic" in group else "SO"
        for item in items:
            number = item.get("expedition_number", item.get("year", len(rows)))
            rid = f"{prefix}_{number}"
            title = f"{item.get('program', group.replace('_', ' ').title())} {number}"
            data = {**item, "register": group}
            rows.append((rid, "expedition", title, expeditions.get("metadata", {}).get("official_url"), data))

    for item in _read("complete_datasets.json").get("datasets", []):
        rows.append((item["dataset_id"], "dataset", item["title"], item.get("direct_api_url"), item))
    for item in _read("complete_publications.json").get("publications", []):
        rows.append((item["doi"], "publication", item["title"], item.get("full_text_url"), item))
    for item in _read("reports_catalog.json").get("reports", []):
        rows.append((item["report_id"], "report", item["title"], item.get("official_url"), item))
    for item in _read("media_manifest.json").get("media_items", []):
        rows.append((item["media_id"], "media", item.get("caption", item["media_id"]), item.get("source"), item))
    return rows


def sync_catalog() -> None:
    if not CORE.is_dir():
        return
    repo.Base.metadata.create_all(repo.engine)
    reviews = _verification()
    rows = _rows()
    relations = _read("relationships.json").get("relationships", [])
    with Session(repo.engine) as session:
        session.execute(delete(CatalogEntity))
        session.execute(delete(CatalogRelation))
        for rid, kind, title, source_url, data in rows:
            session.add(
                CatalogEntity(
                    id=rid,
                    kind=kind,
                    title=title,
                    verification=reviews.get(rid, "verification-not-recorded"),
                    source_url=source_url,
                    data=data,
                )
            )
        for index, relation in enumerate(relations):
            session.add(CatalogRelation(id=f"REL_{index + 1:04}", data=relation))
        session.commit()


def _evidence_summary(kind: str, data: dict[str, Any]) -> str:
    if kind == "publication":
        return str(data.get("abstract") or data.get("citation") or "Bibliographic metadata record.")
    if kind == "dataset":
        variables = ", ".join(str(item.get("name")) for item in data.get("variables", [])[:6])
        coverage = data.get("temporal_range", {})
        return (
            f"Measures {variables or 'the variables listed in this record'}. "
            f"Temporal coverage: {coverage.get('start', 'not recorded')} to {coverage.get('end', 'not recorded')}."
        )
    if kind == "report":
        return str(data.get("summary") or "Official report catalogue metadata.")
    if kind == "station":
        return f"{data.get('status', 'Status not recorded')}. {data.get('location_description', '')}".strip()
    if kind == "expedition":
        return str(data.get("objectives_and_achievements") or data.get("status") or "Expedition register entry.")
    return str(data.get("caption") or data.get("role") or "Catalogue metadata record.")


def _document_registry() -> dict[str, dict[str, Any]]:
    return {
        row["primary_record"]: row
        for row in _read("storage_manifest.json").get("documents", [])
    }


def _public(row: CatalogEntity) -> dict[str, Any]:
    result = {
        "id": row.id,
        "kind": row.kind,
        "title": row.title,
        "verification": row.verification,
        "source_url": row.source_url,
        "evidence_summary": _evidence_summary(row.kind, row.data),
        **row.data,
    }
    stored = _document_registry().get(row.id)
    result["record_json_url"] = f"/api/v1/record-json/{row.kind}/{row.id}"
    result["record_pdf_url"] = f"/api/v1/record-pdf/{row.kind}/{row.id}"
    result["document_url"] = f"/api/v1/document-assets/{row.id}" if stored else None
    result["has_original"] = bool(stored)
    return result


def _entity(kind: str, item_id: str) -> CatalogEntity:
    with Session(repo.engine) as session:
        row = session.get(CatalogEntity, item_id)
        if row is None or row.kind != kind:
            raise HTTPException(404, "Catalogue record not found")
        session.expunge(row)
    return row


def _pdf_bytes(title: str, payload: dict[str, Any]) -> bytes:
    """Render a readable, self-contained PDF brief with one available photo."""
    width, height, margin = 1275, 1650, 76
    font = ImageFont.load_default(size=25)
    small = ImageFont.load_default(size=21)
    heading = ImageFont.load_default(size=42)
    lines = [
        "Dakshinsetu evidence record",
        f"Verification: {payload.get('verification', 'not recorded')}",
        f"Evidence summary: {payload.get('evidence_summary', 'Not recorded')}",
        f"Authoritative source: {payload.get('source_url') or 'Not recorded'}",
        "",
        "Record data",
    ]
    excluded = {"media", "relationships", "evidence_summary", "source_url", "title"}
    for key, value in payload.items():
        if key in excluded:
            continue
        rendered = json.dumps(value, ensure_ascii=False, default=str) if isinstance(value, (dict, list)) else str(value)
        lines.extend(textwrap.wrap(f"{key.replace('_', ' ').title()}: {rendered}", width=88) or [""])
    media = list(payload.get("media", []))
    if media:
        lines.extend(["", "Photos and videos"])
        for item in media:
            label = "Illustrative context" if item.get("evidence_role") == "illustrative-context" else "Record media"
            lines.extend(textwrap.wrap(f"{label}: {item.get('caption', item.get('title', 'Media item'))}", width=88))
            lines.extend(textwrap.wrap(f"Credit/licence: {item.get('credit_line', '')} · {item.get('licence', '')}", width=88))
            lines.extend(textwrap.wrap(f"Open media: {item.get('file_url') or item.get('source') or 'Unavailable'}", width=88))
    pages: list[Image.Image] = []
    remaining = lines
    first = True
    while remaining or first:
        page = Image.new("RGB", (width, height), "white")
        draw = ImageDraw.Draw(page)
        y = margin
        if first:
            for title_line in textwrap.wrap(title, width=48)[:3]:
                draw.text((margin, y), title_line, fill="#071a33", font=heading)
                y += 52
            y += 8
            photo_path = next((_local_media_path(item) for item in media if item.get("type") == "photo"), None)
            if photo_path:
                with Image.open(photo_path) as source:
                    photo = source.convert("RGB")
                    photo.thumbnail((width - margin * 2, 520))
                    page.paste(photo, (margin, y))
                    y += photo.height + 22
                caption = next((item.get("caption", "") for item in media if item.get("type") == "photo"), "")
                for caption_line in textwrap.wrap(str(caption), width=100)[:3]:
                    draw.text((margin, y), caption_line, fill="#385069", font=small)
                    y += 27
                y += 12
        capacity = max(5, (height - margin - y) // 34)
        page_lines, remaining = remaining[:capacity], remaining[capacity:]
        for line in page_lines:
            draw.text((margin, y), line, fill="#172438", font=font)
            y += 34
        pages.append(page)
        first = False
    output = io.BytesIO()
    pages[0].save(output, format="PDF", save_all=True, append_images=pages[1:], resolution=144.0)
    return output.getvalue()


def _safe_filename(value: str) -> str:
    return re.sub(r"[^A-Za-z0-9._-]+", "-", value).strip("-")[:120] or "record"


def _media_registry() -> tuple[dict[str, dict[str, Any]], dict[str, dict[str, Any]]]:
    storage = {
        row["primary_record"]: row
        for row in _read("storage_manifest.json").get("media", [])
    }
    permissions = {
        row["filename"]: row
        for row in _read("media_permissions.json").get("verified_permissions", [])
    }
    return storage, permissions


def _media_items() -> list[dict[str, Any]]:
    storage, permissions = _media_registry()
    items: list[dict[str, Any]] = []
    for raw in _read("media_manifest.json").get("media_items", []):
        item = dict(raw)
        stored = storage.get(item["media_id"])
        permission = permissions.get(str(item.get("filename", "")), {})
        item["id"] = item["media_id"]
        item["title"] = item.get("caption", item["media_id"])
        item["rights"] = permission
        item["file_url"] = (
            f"/api/v1/media-assets/{item['media_id']}"
            if stored and permission.get("redistribution_permitted")
            else None
        )
        item["evidence_role"] = item.get("evidence_role", "direct-record-media")
        items.append(item)
    return items


def _local_media_path(item: dict[str, Any]) -> Path | None:
    stored = _media_registry()[0].get(str(item.get("media_id") or item.get("id")))
    if not stored:
        return None
    path = (CORE / str(stored.get("storage_path", ""))).resolve()
    return path if path.is_relative_to(CORE) and path.is_file() else None


def _related_media(payload: dict[str, Any]) -> list[dict[str, Any]]:
    all_media = _media_items()
    if payload.get("kind") == "media":
        return [item for item in all_media if item["id"] == payload.get("id")]
    station = str(payload.get("name") or payload.get("station") or "").replace(" Station", "")
    direct = [item for item in all_media if station and item.get("related_station") == station]
    if direct:
        return direct[:3]
    # Every export receives one honest contextual visual; it is never labelled as record evidence.
    photos = [item for item in all_media if item.get("type") == "photo" and item.get("file_url")]
    if not photos:
        return []
    index = int(hashlib.sha256(str(payload.get("id", "")).encode()).hexdigest()[:8], 16) % len(photos)
    contextual = dict(photos[index])
    contextual["evidence_role"] = "illustrative-context"
    contextual["relation_note"] = "Context image selected for this export; it does not independently verify the record."
    return [contextual]


def _export_payload(kind: str, item_id: str) -> dict[str, Any]:
    payload = _public(_entity(kind, item_id))
    payload["media"] = _related_media(payload)
    payload["export_note"] = (
        "Photos and videos include rights, credit and evidence-role labels. "
        "Video files are linked because standard PDF viewers do not reliably play embedded video."
    )
    return payload


@repo.app.get("/api/v1/catalog/summary")
def catalog_summary():
    with Session(repo.engine) as session:
        rows = list(session.scalars(select(CatalogEntity)))
    counts: dict[str, int] = {}
    for row in rows:
        counts[row.kind] = counts.get(row.kind, 0) + 1
    return {
        "counts": counts,
        "total": len(rows),
        "reviewed": sum(row.verification != "verification-not-recorded" for row in rows),
        "scope": "Bundled production-core register; verification is reported per record.",
    }


@repo.app.get("/api/v1/catalog/{kind}")
def catalog_list(
    kind: str,
    q: str = Query(default="", max_length=200),
    region: str | None = Query(default=None, max_length=64),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
):
    allowed = {"station", "vessel", "expedition", "dataset", "publication", "report", "media"}
    if kind not in allowed:
        raise HTTPException(404, "Catalogue type not found")
    with Session(repo.engine) as session:
        rows = list(session.scalars(select(CatalogEntity).where(CatalogEntity.kind == kind)))
    needle = q.casefold().strip()
    filtered = [
        row
        for row in rows
        if (not needle or needle in json.dumps(row.data, ensure_ascii=False).casefold())
        and (not region or str(row.data.get("region", "")).casefold() == region.casefold())
    ]
    items = [_public(row) for row in filtered[offset : offset + limit]]
    if kind == "media":
        enriched = {item["id"]: item for item in _media_items()}
        for item in items:
            item.update(enriched.get(item["id"], {}))
            item["has_original"] = bool(item["file_url"])
            item["document_url"] = item["file_url"]
    return {"items": items, "count": len(filtered), "offset": offset, "limit": limit}


@repo.app.get("/api/v1/catalog/{kind}/{item_id:path}")
def catalog_detail(kind: str, item_id: str):
    with Session(repo.engine) as session:
        row = session.get(CatalogEntity, item_id)
        if row is None or row.kind != kind:
            raise HTTPException(404, "Catalogue record not found")
        relations = [
            relation.data
            for relation in session.scalars(select(CatalogRelation))
            if relation.data.get("from_id") == item_id or relation.data.get("to_id") == item_id
        ]
    result = _public(row)
    result["relationships"] = relations
    if kind == "station":
        station_name = str(result.get("name", "")).replace(" Station", "")
        result["media"] = [item for item in _media_items() if item.get("related_station") == station_name]
    return result


@repo.app.get("/api/v1/record-json/{kind}/{item_id:path}")
def record_json(kind: str, item_id: str):
    payload = _export_payload(kind, item_id)
    body = json.dumps(payload, ensure_ascii=False, indent=2, default=str).encode("utf-8")
    return Response(
        body,
        media_type="application/json",
        headers={
            "Content-Disposition": f'inline; filename="{_safe_filename(item_id)}.json"',
            "X-Content-Type-Options": "nosniff",
            "Cache-Control": "public, max-age=300",
        },
    )


@repo.app.get("/api/v1/record-pdf/{kind}/{item_id:path}")
def record_pdf(kind: str, item_id: str):
    payload = _export_payload(kind, item_id)
    return Response(
        _pdf_bytes(str(payload.get("title", item_id)), payload),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'inline; filename="{_safe_filename(item_id)}-record.pdf"',
            "X-Content-Type-Options": "nosniff",
            "Content-Security-Policy": "sandbox",
            "Cache-Control": "public, max-age=300",
        },
    )


@repo.app.get("/api/v1/document-assets/{item_id:path}")
def document_asset(item_id: str):
    stored = _document_registry().get(item_id)
    if not stored:
        raise HTTPException(404, "An original document is not stored for this record")
    path = (CORE / str(stored.get("storage_path", ""))).resolve()
    if not path.is_relative_to(CORE) or not path.is_file():
        raise HTTPException(404, "Stored document is unavailable")
    mime = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
    return FileResponse(
        path,
        media_type=mime,
        headers={
            "Content-Disposition": f'inline; filename="{path.name}"',
            "X-Content-Type-Options": "nosniff",
            "Content-Security-Policy": "sandbox",
            "Cache-Control": "public, max-age=3600",
        },
    )


@repo.app.get("/api/v1/media-assets/{media_id}")
def media_asset(media_id: str):
    storage, permissions = _media_registry()
    stored = storage.get(media_id)
    if not stored:
        raise HTTPException(404, "Media file not found")
    filename = str(stored.get("file", ""))
    permission = permissions.get(filename, {})
    if not permission.get("redistribution_permitted"):
        raise HTTPException(403, "Redistribution permission is not recorded")
    path = (CORE / str(stored.get("storage_path", ""))).resolve()
    if not path.is_relative_to(CORE) or not path.is_file():
        raise HTTPException(404, "Media file is unavailable")
    mime = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
    return FileResponse(
        path,
        media_type=mime,
        filename=path.name,
        headers={
            "X-Content-Type-Options": "nosniff",
            "Content-Security-Policy": "sandbox",
            "Cache-Control": "public, max-age=3600",
        },
    )


sync_catalog()
