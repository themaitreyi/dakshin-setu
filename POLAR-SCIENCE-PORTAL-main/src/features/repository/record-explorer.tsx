import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Download, ExternalLink, FileJson, FileText, MapPin, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface CatalogueRecord {
  id: string;
  kind?: string;
  title: string;
  verification: string;
  evidence_summary?: string;
  source_url?: string;
  document_url?: string | null;
  record_json_url?: string;
  record_pdf_url?: string;
  has_original?: boolean;
  abstract?: string;
  summary?: string;
  citation?: string;
  licence?: string;
  authors?: string[];
  journal?: string;
  year?: number;
  station?: string | null;
  region?: string;
  coordinates?: { lat: number; lon: number; elevation_m?: number; depth_m?: number };
  geographic_bbox?: { west: number; east: number; south: number; north: number };
  temporal_range?: { start?: string; end?: string };
  formats?: string[];
  [key: string]: unknown;
}

type PreviewMode = "json" | "pdf" | "original" | null;

function apiUrl(kind: string, id: string, format: "json" | "pdf") {
  return `/api/v1/record-${format}/${kind}/${id.split("/").map(encodeURIComponent).join("/")}`;
}

export function RecordExplorer({
  record,
  kind,
  compact = false,
}: {
  record: CatalogueRecord;
  kind: string;
  compact?: boolean;
}) {
  const [mode, setMode] = useState<PreviewMode>(null);
  const [json, setJson] = useState("");
  const [error, setError] = useState("");
  const jsonUrl = record.record_json_url || apiUrl(kind, record.id, "json");
  const pdfUrl = record.record_pdf_url || apiUrl(kind, record.id, "pdf");

  useEffect(() => {
    if (mode !== "json" || json) return;
    setError("");
    fetch(jsonUrl, { headers: { "X-Requested-With": "Dakshinsetu" } })
      .then(async (response) => {
        if (!response.ok) throw new Error("The JSON record could not be loaded.");
        return JSON.stringify(await response.json(), null, 2);
      })
      .then(setJson)
      .catch((reason: unknown) =>
        setError(reason instanceof Error ? reason.message : "The JSON record could not be loaded."),
      );
  }, [json, jsonUrl, mode]);

  const explanation =
    record.evidence_summary ||
    record.abstract ||
    record.summary ||
    "This catalogue entry contains descriptive metadata. Consult the source and verification label before reuse.";
  const coordinates = record.coordinates;
  const bbox = record.geographic_bbox;
  const mapPoint = coordinates
    ? { lat: coordinates.lat, lon: coordinates.lon }
    : bbox
      ? { lat: (bbox.south + bbox.north) / 2, lon: (bbox.west + bbox.east) / 2 }
      : null;

  return (
    <div className={compact ? "mt-4" : "mt-6"}>
      <section
        className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4"
        aria-label="Evidence summary"
      >
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.16em] text-cyan-800">
          <ShieldCheck className="size-4" /> Evidence first
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-700">{explanation}</p>
        <dl className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
          <div>
            <dt className="font-semibold text-slate-800">Verification</dt>
            <dd>{record.verification.replaceAll("-", " ")}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-800">Available file</dt>
            <dd>
              {record.has_original
                ? "Stored original plus record exports"
                : "Record exports; original not stored"}
            </dd>
          </div>
          {coordinates && (
            <div>
              <dt className="font-semibold text-slate-800">Exact coordinates</dt>
              <dd>
                {coordinates.lat.toFixed(4)}°, {coordinates.lon.toFixed(4)}°
              </dd>
            </div>
          )}
          {bbox && (
            <div>
              <dt className="font-semibold text-slate-800">Geographic bounds</dt>
              <dd>
                {bbox.south}°–{bbox.north}° lat · {bbox.west}°–{bbox.east}° lon
              </dd>
            </div>
          )}
        </dl>
      </section>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Action
          icon={<FileJson />}
          label="Preview JSON"
          description="Inspect the complete record, media links, credits and evidence labels before downloading it."
          onClick={() => setMode(mode === "json" ? null : "json")}
        />
        <Action
          icon={<FileText />}
          label="Preview record PDF"
          description="Open a readable brief containing the record information, an available photo and media links."
          onClick={() => setMode(mode === "pdf" ? null : "pdf")}
        />
        {record.document_url && (
          <Action
            icon={<FileText />}
            label="Preview stored original"
            description="View the locally stored original without leaving Dakshinsetu."
            onClick={() => setMode(mode === "original" ? null : "original")}
          />
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button asChild size="sm" variant="outline">
          <a
            href={jsonUrl}
            download={`${record.id.replaceAll("/", "-")}.json`}
            title="Download the structured evidence record as JSON"
          >
            <Download /> Download JSON
          </a>
        </Button>
        <Button asChild size="sm" variant="outline">
          <a
            href={pdfUrl}
            download={`${record.id.replaceAll("/", "-")}-record.pdf`}
            title="Download a generated PDF of the displayed record"
          >
            <Download /> Download record PDF
          </a>
        </Button>
        {record.document_url && (
          <Button asChild size="sm">
            <a href={record.document_url} download title="Download the stored original file">
              <Download /> Download original
            </a>
          </Button>
        )}
        {record.source_url && (
          <Button asChild size="sm" variant="ghost">
            <a
              href={record.source_url}
              target="_blank"
              rel="noreferrer"
              title="Open the authoritative external source in a new tab"
            >
              <ExternalLink /> Authoritative source
            </a>
          </Button>
        )}
        {mapPoint && (
          <Button asChild size="sm" variant="ghost">
            <a
              href={`/observatory?lat=${mapPoint.lat}&lon=${mapPoint.lon}&label=${encodeURIComponent(record.title)}`}
              title="Open the centre of this record's coordinates on the 3D globe"
            >
              <MapPin /> View on globe
            </a>
          </Button>
        )}
      </div>
      {!record.has_original && (
        <p className="mt-3 text-xs leading-5 text-amber-800">
          “Record PDF” is a Dakshinsetu metadata export, not the original publication. The portal
          never substitutes it for an unavailable source file.
        </p>
      )}
      <p className="mt-2 text-xs leading-5 text-slate-500">
        JSON exports contain full media metadata and local preview links. PDFs include an available
        photo; videos are linked because playback inside downloaded PDFs is not consistently
        supported by browsers and document viewers.
      </p>

      {mode && (
        <section
          className="mt-5 overflow-hidden rounded-2xl border bg-white shadow-sm"
          aria-label={`${mode} preview`}
        >
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div>
              <h4 className="font-semibold">
                {mode === "json"
                  ? "Structured JSON"
                  : mode === "original"
                    ? "Stored original"
                    : "Record PDF"}
              </h4>
              <p className="text-xs text-slate-500">
                Previewed inside Dakshinsetu before download.
              </p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setMode(null)}
              aria-label="Close preview"
              title="Close this preview"
            >
              <X />
            </Button>
          </div>
          {mode === "json" ? (
            <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap break-words bg-slate-950 p-5 text-xs leading-5 text-sky-100">
              {error || json || "Loading JSON evidence…"}
            </pre>
          ) : (
            <iframe
              title={`${record.title} ${mode} preview`}
              src={mode === "original" ? record.document_url || "" : pdfUrl}
              className="h-[min(70vh,720px)] w-full bg-slate-100"
              sandbox="allow-same-origin"
            />
          )}
        </section>
      )}
    </div>
  );
}

function Action({
  icon,
  label,
  description,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={description}
      className="min-h-24 rounded-xl border bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
    >
      <span className="flex items-center gap-2 font-semibold text-slate-900">
        {icon}
        {label}
      </span>
      <span className="mt-2 block text-xs leading-5 text-slate-500">{description}</span>
    </button>
  );
}
