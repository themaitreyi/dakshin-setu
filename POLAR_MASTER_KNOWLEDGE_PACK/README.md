# POLAR MASTER KNOWLEDGE PACK
## SIH 2026 Problem Statement SIH26063: Integrated Polar Science Outreach, Knowledge Repository and Media Dissemination Portal
**Host Organization:** Ministry of Earth Sciences (MoES) / National Centre for Polar and Ocean Research (NCPOR), Government of India  
**Target Regions:** Antarctica, Arctic, Southern Ocean, Himalayas (The Third Pole)

---

### Folder Contents & Structure

This directory contains the complete, encyclopedic polar knowledge archive, structured datasets, domain models, and seed utilities compiled for the Dakshinsetu / Polar Science Portal.

| File | Purpose |
| :--- | :--- |
| `master_seed_data.py` | Python ingestion script that imports all curated records directly into your SQLite / PostgreSQL database using your backend's `app.repository.ingest` function. |
| `master_catalog.json` | Complete standardized catalog in JSON format containing 100+ verified records across all 7 resource types (reports, publications, datasets, photos, videos, expeditions, activities). |
| `polar_stations_reference.json` | Detailed technical and engineering profiles for all 6 Indian polar stations and observatories (Dakshin Gangotri, Maitri, Bharati, Himadri, IndARC, Himansh) plus research vessels. |
| `chronological_expeditions.json` | Complete historical timeline of Indian Scientific Expeditions to Antarctica (1st to 44th), Arctic expeditions (1st to 14th), Southern Ocean voyages, and traverses. |
| `global_polar_datasets.json` | Real-world scientific datasets inventory from NPDC, NSIDC, NASA, SCAR, SIOS, and PANGAEA with variables, sensor models, and access URLs. |
| `peer_reviewed_publications.json` | Published papers across oceanography, cold microbiology, glaciology, and aerosols with abstracts, DOIs, and retrieval chunks for RAG. |
| `media_assets_catalog.json` | High-resolution photographs, satellite visualizations, and documentary videos with rights, licenses, and metadata. |
| `outreach_templates.json` | System prompts, audience profiles (students, public, journalists, educators), and formatting constraints for the media dissemination engine. |
| `schemas_and_models.py` | Production-grade SQLAlchemy ORM and Pydantic models for relational persistence and API validation. |

---

### How to Import into Your Backend

#### Option 1: Run the automated seed script
From the `backend` directory with your virtual environment activated:
```powershell
python polar_master_knowledge_pack/master_seed_data.py
```
This will automatically parse and ingest all records into your backend database (`repository.sqlite` or PostgreSQL) with automatic text extraction, chunking, and vector indexing.

#### Option 2: Inspect or consume the JSON files directly
All JSON files adhere strictly to the `Metadata` schema:
```json
{
  "title": "...",
  "resource_type": "report | publication | dataset | photo | video | expedition | activity",
  "region": "Antarctic | Arctic | Himalaya | Southern Ocean | Multiple",
  "station": "Maitri | Bharati | Dakshin Gangotri | Himadri | Himansh | null",
  "source_owner": "...",
  "source_url": "...",
  "publication_date": "YYYY-MM-DD",
  "description": "...",
  "licence": "...",
  "topics": ["..."],
  "availability": "online | offline | metadata-only"
}
```
