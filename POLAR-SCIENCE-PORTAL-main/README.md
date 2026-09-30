# Dakshinsetu

India-focused polar knowledge and outreach project for SIH26. Independent student project;
not an official NCPOR or Government of India service.

**Start with [START-HERE.md](START-HERE.md)** for setup, account creation and release boundaries.
See [DEPLOYMENT.md](DEPLOYMENT.md) for production configuration and required checks.

React/TanStack Start frontend, Three.js globe, FastAPI backend, SQLAlchemy/SQLite storage,
local BGE embeddings with BM25 retrieval, and optional evidence-grounded Gemini generation.

The student hub is open; researchers sign in to submit sources; administrators review
records. Dataset, publication, media, programme, history and vessel pages read the same
persistent registry. The observatory plots real catalogue counts, not fabricated climate data.

The starter collection includes credited NASA media, an open-access oceanography paper,
and source-linked metadata. It is not an exhaustive collection of polar datasets. File
licences and credits appear in each record. No live AIS, institutional SSO or antivirus
service is bundled. See the deployment checklist before public launch.

Build: `npm run build`. Type check: `npx tsc --noEmit`.
Backend tests: from backend, `.\.venv\Scripts\python.exe -m pytest tests -q`.
Release archive: `backend\.venv\Scripts\python.exe scripts/build_release.py`.
The release builder uses a fresh public-only database and excludes credentials, accounts,
private enquiries, arbitrary uploads and the old placeholder expedition PDF.
