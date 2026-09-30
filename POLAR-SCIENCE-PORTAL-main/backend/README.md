# Dakshinsetu knowledge API

Run with Python 3.11+:

```bash
python -m venv .venv
pip install -r requirements.txt
uvicorn app.main:app --reload --port 4000
```

Set `GEMINI_API_KEY` only in the backend environment. The API defaults to a deterministic local evidence response when no key is present. The catalogue lists source-owned datasets and access methods; it does not copy restricted or offline files without authorization.

The bundled `polar_production_core` is indexed at startup into separate catalogue tables. Its
verification registry is preserved per record; missing audits remain `verification-not-recorded`.
Permitted local media is exposed only when both the storage manifest and rights registry allow it.

```text
GET /api/v1/catalog/summary
GET /api/v1/catalog/{station|vessel|expedition|dataset|publication|report|media}
GET /api/v1/catalog/{kind}/{id}
GET /api/v1/media-assets/{media_id}
GET /api/v1/document-assets/{record_id}
GET /api/v1/record-json/{kind}/{record_id}
GET /api/v1/record-pdf/{kind}/{record_id}
```

Record JSON and record PDF routes provide locally generated, clearly labelled catalogue exports.
They are not substitutes for an original publication. `document-assets` serves an original only
when it is explicitly listed in the production-core storage manifest. This keeps preview and
download traffic on the portal and avoids dependence on third-party document viewers.
