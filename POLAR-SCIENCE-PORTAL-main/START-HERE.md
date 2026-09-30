# Dakshinsetu — SIH26 working release

An independent student project, not an official NCPOR service.

## Start locally

1. Install Node 24 and Python 3.12.
2. In the project folder run `npm ci`, then `npm run dev -- --host 127.0.0.1 --port 8081`.
3. In a second terminal:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 4000
```

Open http://127.0.0.1:8081. The supplied storage contains only the public starter catalogue.
Student browsing is open. Use Login to register a researcher; registration does not verify
institutional affiliation. Researcher submissions are public pending-review records and
cannot be used for grounded generation until reviewed. Do not submit private material.

## Bundled browsing and downloads

The public catalogue also ships in public/catalogue. If the Python service is unavailable,
resource lists, details and text search fall back to these 31 source-linked records.
The included photos, video and research PDF have local download links. Metadata records
can be downloaded as JSON or printed/saved as PDF; metadata exports are not raw measurements.
Login, uploads, moderation and Gemini still require the backend. On this Windows machine,
Application Control currently blocks SQLAlchemy's compiled library; an authorised administrator
must resolve that environment restriction before live backend functions can run.

## Create an administrator

In the backend terminal run `.\.venv\Scripts\python.exe create_admin.py`.
The command prompts privately for a password. There are no shipped default accounts or
passwords. Sign in on the website to enter the administrator portal.

## Gemini

Set GEMINI_API_KEY and GEMINI_MODEL in the backend process environment, then restart.
Alternatively, create backend/.gemini.local with JSON keys GEMINI_API_KEY and GEMINI_MODEL.
Use gemini-3.8-flash unless your provider account requires another supported model.
The ZIP deliberately excludes credentials. Never use VITE_ variables for secrets.
Only reviewed repository evidence is sent to Gemini. Unsupported questions are refused;
provider failures produce explicitly labelled local excerpts.

## What is included

- Light photo-based landing page, 3D satellite-style Earth, clouds, snow, camera transitions,
  matching map, responsive navigation, card depth and reduced-motion support.
- Student, researcher and administrator portals; password hashing; role checks; expiring,
  revocable HttpOnly sessions. No institutional SSO, email verification or password-reset flow.
- Dataset, publication, media, activity, observatory, vessel and history pages.
- SQLite-backed records, original files, source/licence details, PDF page chunks, hybrid
  retrieval, evidence-gated answers and outreach drafts.
- NASA media and an 18-page CC BY oceanography paper stored locally. Restricted source data
  remain clearly labelled metadata-only; no invented environmental observations or live AIS.
- Local embedding model files, when present in the build environment, are bundled for offline
  retrieval. Gemini itself still requires Internet access. See backend/models for model credits.

## Before public deployment

Read DEPLOYMENT.md. Configure TLS and COOKIE_SECURE=1, rotate exposed keys, create your own
administrator, test the container deployment, set operator privacy/retention procedures,
and review content rights. Antivirus scanning, OCR, live vessel tracking, climate time-series
imports, exhaustive global datasets and production security certification are not included.
This is a tested project release, not a claim that every possible feature is complete.
