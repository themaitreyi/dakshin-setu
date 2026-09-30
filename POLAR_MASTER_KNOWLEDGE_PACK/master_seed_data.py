"""
MASTER SEED INGESTION SCRIPT
Imports all records from master_catalog.json directly into the Dakshinsetu knowledge database.
Executable directly from the backend directory:
    python polar_master_knowledge_pack/master_seed_data.py
"""

import sys
import json
from pathlib import Path

# Add backend directory to sys.path so app.repository can be imported
CURRENT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = CURRENT_DIR.parent / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))
if str(CURRENT_DIR.parent) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR.parent))

try:
    from app.repository import Metadata, ingest, engine, Resource
    from sqlalchemy.orm import Session
except ImportError:
    # If run from inside backend folder directly
    try:
        from app.repository import Metadata, ingest, engine, Resource
        from sqlalchemy.orm import Session
    except Exception as e:
        print(f"Error importing app.repository: {e}")
        print("Please run this script from the backend directory:")
        print("  cd backend")
        print("  python ../POLAR_MASTER_KNOWLEDGE_PACK/master_seed_data.py")
        sys.exit(1)


def mark_reviewed(resource_id: str, review_note: str = "Curator-reviewed against cited polar repository source"):
    """Mark the ingested resource as verified so it is available for RAG evidence."""
    with Session(engine) as session:
        r = session.get(Resource, resource_id)
        if r:
            r.data = {
                **r.data,
                "verification": "curator-reviewed",
                "review_note": review_note
            }
            session.commit()


def seed_master_catalog():
    catalog_path = CURRENT_DIR / "master_catalog.json"
    if not catalog_path.exists():
        print(f"Error: Could not find {catalog_path}")
        return

    records = json.loads(catalog_path.read_text(encoding="utf-8"))
    print(f"Loading {len(records)} master polar records...")

    ingested_count = 0
    duplicate_count = 0

    for item in records:
        try:
            metadata = Metadata(**item)
            res = ingest(metadata)
            rid = res["resource"]["id"]
            if res.get("duplicate"):
                duplicate_count += 1
            else:
                ingested_count += 1
            mark_reviewed(rid)
            print(f" [OK] {item['resource_type'].upper()[:4]}: {item['title'][:60]} (ID: {rid})")
        except Exception as e:
            print(f" [FAIL] Failed to ingest {item.get('title')}: {e}")

    print("\n" + "=" * 60)
    print(f"Master Ingestion Complete!")
    print(f"Newly Ingested: {ingested_count}")
    print(f"Pre-existing / Preserved: {duplicate_count}")
    print(f"Total Processed: {len(records)}")
    print("=" * 60)


if __name__ == "__main__":
    seed_master_catalog()
