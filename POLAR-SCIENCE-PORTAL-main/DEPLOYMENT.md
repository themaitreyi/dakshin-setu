# Dakshinsetu — run and deployment notes

## Current implementation

- Light photo hero, scroll reveals, pointer tilt, textured Three.js Earth, snow/cloud controls, station selection, camera transitions and matching equirectangular satellite map.
- Persistent SQLAlchemy/SQLite resource catalogue, original-file storage, SHA-256 duplicate detection, PDF page extraction, text chunks, source metadata and curator review.
- PDF/TXT/MD/CSV/image/MP4 ingestion up to 30 MB. Images and videos are metadata-indexed; there is no image understanding or speech transcription.
- Local BGE-small 384-dimensional CPU embeddings with BM25 hybrid ranking. Model weights must be prepared once; queries then use local files only. Explicit lexical fallback if unavailable.
- Evidence gating, server-side Gemini connector, local source-excerpt fallback, stored outreach drafts, in-site evidence/file/media viewing, review queue, coverage counts and stored private enquiries.
- Local researcher/admin accounts with scrypt password hashes, expiring HttpOnly sessions, role authorization, login throttling and custom-header CSRF protection. Optional operator token remains supported. No institutional SSO or email verification.

## Local development (Windows PowerShell)

From the project directory:

```powershell
npm ci
npm run dev -- --port 8081
```

In a second terminal, in `backend` (Python 3.12):

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe seed.py
.\.venv\Scripts\python.exe prepare_model.py
$env:CURATOR_TOKEN = '<strong random operator token>'
$env:GEMINI_API_KEY = '<your server-side Gemini key>'
$env:GEMINI_MODEL = 'gemini-3.8-flash'
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 4000
```

Do not paste real keys into chat or commit them. The Python process reads its environment, not the frontend `.env` automatically. Gemini is optional; without a working key/provider, the result is labelled as an extractive fallback. Gemini calls transmit the question and selected source chunks to Google. Only upload material permitted for that use.

The existing local `backend/storage` contains 16 records: 13 Himadri dataset listings, one NCPOR report metadata record, and two reusable NASA visualization media files. It is not an exhaustive worldwide dataset inventory. Raw Himadri measurements have not been mirrored. The NCPOR report in `backend/imports` is a private inspection copy, not publicly served. Do not expose that directory.

`seed.py` is idempotent. It registers media when the permitted originals exist in `backend/imports`. Keep source attributions. NASA assets: https://svs.gsfc.nasa.gov/3698/ ; reuse policy https://svs.gsfc.nasa.gov/help/ . NCPOR listings: https://data.ncpor.res.in/newhtml/3 . NCPOR copyright: https://www.ncpor.res.in/pages/display/33-copyright-policy . Globe textures are local copies from Three.js examples; verify their upstream asset rights before public launch.

## Production build

For local development, `app.main` also loads `backend/.gemini.local` (JSON keys
`GEMINI_API_KEY` and `GEMINI_MODEL`). Existing environment variables take precedence.
This credential file is ignored by Git and excluded from Docker builds. Never serve,
share, or commit it; use deployment environment secrets in production. Rotate any
credential that has been shared in chat before public deployment.

```powershell
npx tsc --noEmit
npm run build
node .output/server/index.mjs
```

The Node server proxies `/api/v1` to `POLAR_API_URL` (default `http://127.0.0.1:4000`). Run the Python service alongside it. The production target is Node, not a Cloudflare-only worker.

## Container deployment

Dockerfiles and `compose.yaml` are included. Docker was not installed in the development environment, so the container build has not been exercised here. Create a local `.env` using `.env.example`, supply a strong `CURATOR_TOKEN`, then:

```sh
docker compose up --build -d
```

Gateway binds to **127.0.0.1:8080**. Put a TLS reverse proxy in front before public use; this configuration intentionally does not expose the service to the network by itself. SQLite/files are bind-mounted from `backend/storage`, model files from `backend/models`. On Linux ensure the storage folder is writable by the container's `portal` user. Back up the database and files together. Do not mount `backend/imports` publicly. Keep Gemini quotas low and monitor usage; application/gateway throttling is per-process, not a distributed billing cap.

For PostgreSQL, install `psycopg[binary]`, set a `postgresql+psycopg://` SQLAlchemy URL, migrate records and test before switching. PostgreSQL/pgvector indexing is **not** implemented or verified; the current embedding index is a local in-memory cache rebuilt from stored chunks. SQLite and the files are the source of truth.

## Verification

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest -q -p no:cacheprovider
```

Tests use a separate in-memory database and temporary files. They cover original-file integrity, provenance, duplicate ingestion, authorization, unsupported-file/rights rejection, refusal, draft persistence, PDF page indexing, private enquiries, rate limiting and uncited generation rejection.

## Before a public SIH deployment

1. Supply your own rotated Gemini key. Direct generation was verified during development; provider failures may produce labelled local excerpts. The release ZIP excludes all credentials.
2. Review all displayed scientific content, station metadata, learning drafts and redistribution rights. Source authenticity does not establish scientific truth. Thresholds reduce unsupported responses but are not a hallucination-proof guarantee.
3. Add licensed Indian photos/videos and permitted dataset files; scan with an antivirus service. Current checks validate file formats, not malware. Scanned PDFs need OCR, which is not implemented.
4. Extend local accounts with institutional SSO, email verification, password recovery and per-user audit trails for institutional production use. Set COOKIE_SECURE=1 behind HTTPS; local HTTP testing requires COOKIE_SECURE=0.
5. Benchmark retrieval on a representative Indian polar corpus; tune cosine/coverage thresholds and evaluate citation entailment. The present gate is deliberately conservative.
6. Test Docker/TLS, backups/restore, upload quotas, concurrency and mobile accessibility on the chosen host.

This is a working local SIH prototype with deployment scaffolding, not a claim that every online/offline dataset is stored or every production requirement has been completed.
