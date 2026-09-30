import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  Cloud,
  ExternalLink,
  Globe2,
  Map,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
  Snowflake,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { stations as fallbackStations } from "@/features/expeditions/data";
import { Button } from "@/components/ui/button";
import { knowledge } from "@/lib/knowledge";
import { RecordExplorer } from "@/features/repository/record-explorer";
const EarthScene = lazy(() =>
  import("./earth-scene").then((module) => ({ default: module.EarthScene })),
);
const views = [
  { name: "India / Himalayas", lat: 26, lon: 78 },
  { name: "Antarctica", lat: -70, lon: 35 },
  { name: "Arctic", lat: 76, lon: 15 },
];

interface StationMedia {
  id: string;
  type: "photo" | "video";
  caption: string;
  file_url: string | null;
  credit_line: string;
  licence: string;
  source: string;
}

interface GlobeStation {
  id: string;
  name: string;
  region: string;
  lat: number;
  lon: number;
  established: number;
  description: string;
  sourceUrl?: string | undefined;
  verification?: string;
  media?: StationMedia[];
}

interface ProductionStation {
  id: string;
  name: string;
  region: string;
  coordinates: { lat: number; lon: number };
  inaugurated?: string;
  status: string;
  location_description: string;
  official_source?: string;
  source_url?: string;
  verification: string;
}

const initialStations: GlobeStation[] = fallbackStations.map((station) => ({ ...station }));

function requestedMapLocation(): GlobeStation | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  if (!params.has("lat") || !params.has("lon")) return null;
  const lat = Number(params.get("lat"));
  const lon = Number(params.get("lon"));
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180)
    return null;
  return {
    id: "REQUESTED_LOCATION",
    name: params.get("label") || "Requested location",
    region: "Catalogue coordinates",
    lat,
    lon,
    established: 1981,
    description:
      "Coordinate supplied by the selected catalogue record. Inspect that record for its geographic scope and provenance.",
    verification: "coordinate-from-catalogue-record",
  };
}

export function PolarGlobe() {
  const [requested] = useState(requestedMapLocation);
  const [view, setView] = useState({ lat: 26, lon: 78 });
  const [zoom, setZoom] = useState(1);
  const [mode, setMode] = useState("globe");
  const [clouds, setClouds] = useState(true);
  const [snow, setSnow] = useState(true);
  const [spin, setSpin] = useState(false);
  const [stationList, setStationList] = useState<GlobeStation[]>(initialStations);
  const [selected, setSelected] = useState("himansh");
  const [showDetails, setShowDetails] = useState(false);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());
  const drag = useRef<{ x: number; y: number } | null>(null);
  const transition = useRef(0);
  const detailsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visible = stationList.filter((s) => s.established <= year);
  const active = visible.find((s) => s.id === selected);
  useEffect(() => {
    knowledge<{ items: ProductionStation[] }>("/catalog/station?limit=100")
      .then(({ items }) => {
        const mapped = items.map((item) => {
          const coordinates = item.coordinates;
          return {
            id: String(item.id),
            name: String(item.name),
            region: String(item.region),
            lat: coordinates.lat,
            lon: coordinates.lon,
            established: Number(String(item.inaugurated || "1981").slice(0, 4)),
            description: `${String(item.status)} · ${String(item.location_description)}`,
            sourceUrl: String(item.official_source || item.source_url || ""),
            verification: item.verification,
          } satisfies GlobeStation;
        });
        if (mapped.length) {
          const locations = requested ? [requested, ...mapped] : mapped;
          setStationList(locations);
          const preferred =
            requested || mapped.find((item) => item.id === "STN_HIMANSH") || mapped[0]!;
          setSelected(preferred.id);
          setView({ lat: preferred.lat, lon: preferred.lon });
          if (requested) {
            setZoom(2.8);
            setShowDetails(true);
          }
        }
      })
      .catch(() => undefined);
  }, [requested]);
  useEffect(() => {
    if (!spin || mode !== "globe" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setView((v) => ({ ...v, lon: (v.lon + 0.18) % 360 })), 40);
    return () => clearInterval(id);
  }, [spin, mode]);
  useEffect(
    () => () => {
      cancelAnimationFrame(transition.current);
      if (detailsTimer.current) clearTimeout(detailsTimer.current);
    },
    [],
  );
  function move(lat: number, lon: number, targetZoom = zoom) {
    cancelAnimationFrame(transition.current);
    setSpin(false);
    const start = view;
    const startZoom = zoom;
    const begin = performance.now();
    const delta = ((lon - start.lon + 540) % 360) - 180;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const step = (now: number) => {
      const t = reduced ? 1 : Math.min(1, (now - begin) / 900);
      const ease = 1 - (1 - t) ** 3;
      setView({ lat: start.lat + (lat - start.lat) * ease, lon: start.lon + delta * ease });
      setZoom(startZoom + (targetZoom - startZoom) * ease);
      if (t < 1) transition.current = requestAnimationFrame(step);
    };
    transition.current = requestAnimationFrame(step);
  }
  function select(id: string) {
    const station = visible.find((s) => s.id === id);
    if (station) {
      if (detailsTimer.current) clearTimeout(detailsTimer.current);
      setSelected(id);
      setShowDetails(false);
      setMediaLoading(true);
      move(station.lat, station.lon, 2.8);
      knowledge<GlobeStation & { media?: StationMedia[]; source_url?: string }>(
        `/catalog/station/${encodeURIComponent(id)}`,
      )
        .then((detail) =>
          setStationList((items) =>
            items.map((item) =>
              item.id === id
                ? {
                    ...item,
                    media: detail.media || [],
                    sourceUrl: detail.source_url || item.sourceUrl,
                  }
                : item,
            ),
          ),
        )
        .catch(() => undefined)
        .finally(() => setMediaLoading(false));
      detailsTimer.current = setTimeout(() => setShowDetails(true), 950);
    }
  }
  function resetGlobe() {
    if (detailsTimer.current) clearTimeout(detailsTimer.current);
    setShowDetails(false);
    setSelected("");
    move(26, 78, 1);
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={mode === "globe" ? "default" : "outline"}
          onClick={() => setMode("globe")}
        >
          <Globe2 className="mr-1 size-4" />
          3D Earth
        </Button>
        <Button
          size="sm"
          variant={mode === "map" ? "default" : "outline"}
          onClick={() => setMode("map")}
        >
          <Map className="mr-1 size-4" />
          Satellite map
        </Button>
        <Button
          size="sm"
          variant="outline"
          aria-pressed={clouds}
          onClick={() => setClouds(!clouds)}
        >
          <Cloud className="mr-1 size-4" />
          Clouds {clouds ? "on" : "off"}
        </Button>
        <Button size="sm" variant="outline" aria-pressed={snow} onClick={() => setSnow(!snow)}>
          <Snowflake className="mr-1 size-4" />
          Snow {snow ? "on" : "off"}
        </Button>
      </div>
      <div className="relative overflow-hidden rounded-3xl border border-sky-100 bg-[radial-gradient(ellipse_at_center,#dceefa,#f8fcff_70%)]">
        {mode === "globe" ? (
          <div
            role="group"
            aria-label="3D globe. Drag or use arrow keys to rotate."
            tabIndex={0}
            className="touch-pan-y cursor-grab active:cursor-grabbing"
            onPointerDown={(e) => {
              cancelAnimationFrame(transition.current);
              drag.current = { x: e.clientX, y: e.clientY };
              setSpin(false);
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (!drag.current) return;
              const dx = e.clientX - drag.current.x,
                dy = e.clientY - drag.current.y;
              setView((v) => ({
                lon: v.lon - dx * 0.4,
                lat: Math.max(-85, Math.min(85, v.lat + dy * 0.4)),
              }));
              drag.current = { x: e.clientX, y: e.clientY };
            }}
            onPointerUp={() => {
              drag.current = null;
            }}
            onPointerCancel={() => {
              drag.current = null;
            }}
            onKeyDown={(e) => {
              if (!e.key.startsWith("Arrow")) return;
              e.preventDefault();
              setSpin(false);
              setView((v) => ({
                lon: v.lon + (e.key === "ArrowRight" ? 5 : e.key === "ArrowLeft" ? -5 : 0),
                lat: Math.max(
                  -85,
                  Math.min(85, v.lat + (e.key === "ArrowUp" ? 5 : e.key === "ArrowDown" ? -5 : 0)),
                ),
              }));
            }}
          >
            <Suspense
              fallback={
                <div className="aspect-square grid place-items-center text-sm">
                  Loading 3D Earth…
                </div>
              }
            >
              <EarthScene
                {...view}
                zoom={zoom}
                clouds={clouds}
                pins={visible}
                selected={selected}
                select={select}
              />
            </Suspense>
          </div>
        ) : (
          <div className="relative aspect-[2/1] overflow-hidden">
            <div
              className="absolute inset-0 transition-transform duration-500"
              style={{
                transform: `translate(${(50 - ((((view.lon + 180) % 360) + 360) % 360) / 3.6) * (Math.max(1, zoom * 1.5) - 1)}%,${(50 - (90 - view.lat) / 1.8) * (Math.max(1, zoom * 1.5) - 1)}%) scale(${Math.max(1, zoom * 1.5)})`,
              }}
            >
              <img
                src="/textures/earth-hd.jpg"
                alt="Satellite composite of Earth's land, oceans and ice"
                className="size-full"
              />
              {clouds && (
                <img
                  src="/textures/clouds.png"
                  alt=""
                  className="pointer-events-none absolute inset-0 size-full opacity-45 mix-blend-screen"
                />
              )}
              {visible.map((s) => (
                <button
                  key={s.id}
                  title={s.name}
                  aria-label={`Select ${s.name}`}
                  onClick={() => select(s.id)}
                  style={{ left: `${(s.lon + 180) / 3.6}%`, top: `${(90 - s.lat) / 1.8}%` }}
                  className="absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-orange-400 shadow-lg"
                />
              ))}
            </div>
          </div>
        )}
        {snow && (
          <div className="polar-snow pointer-events-none absolute inset-0" aria-hidden>
            {Array.from({ length: 22 }, (_, i) => (
              <i
                key={i}
                style={{
                  left: `${(i * 47) % 100}%`,
                  animationDelay: `-${i * 0.7}s`,
                  animationDuration: `${8 + (i % 6)}s`,
                  width: 2 + (i % 3),
                  height: 2 + (i % 3),
                }}
              />
            ))}
          </div>
        )}
        {active && showDetails && (
          <aside className="absolute inset-x-3 bottom-3 z-10 max-h-[72%] overflow-y-auto rounded-2xl border border-white/60 bg-white/95 p-4 backdrop-blur-xl sm:inset-y-4 sm:left-auto sm:right-4 sm:w-[min(390px,42%)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-cyan-700">
                  Selected location
                </p>
                <h3 className="mt-1 font-display text-xl font-semibold text-slate-950">
                  {active.name}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  {active.region} · {active.lat.toFixed(4)}°, {active.lon.toFixed(4)}°
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDetails(false)}
                aria-label="Close station details"
              >
                <X />
              </Button>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">{active.description}</p>
            {mediaLoading && <p className="mt-4 text-sm text-slate-500">Loading verified media…</p>}
            {!!active.media?.length && (
              <div className="mt-4 space-y-4">
                {active.media.map((item) => (
                  <figure key={item.id} className="overflow-hidden rounded-xl border bg-slate-50">
                    {item.file_url && item.type === "photo" && (
                      <img
                        src={item.file_url}
                        alt={item.caption}
                        className="aspect-video w-full object-cover"
                      />
                    )}
                    {item.file_url && item.type === "video" && (
                      <video
                        src={item.file_url}
                        controls
                        preload="metadata"
                        className="aspect-video w-full bg-slate-950 object-contain"
                        aria-label={item.caption}
                      />
                    )}
                    <figcaption className="p-3 text-xs leading-5 text-slate-600">
                      <p>{item.caption}</p>
                      <p className="mt-2 font-medium text-slate-800">{item.credit_line}</p>
                      <p>{item.licence}</p>
                    </figcaption>
                  </figure>
                ))}
              </div>
            )}
            {!mediaLoading && !active.media?.length && (
              <p className="mt-4 rounded-xl bg-sky-50 p-3 text-xs leading-5 text-slate-600">
                No locally licensed station photograph is registered yet. The portal will not
                substitute an unrelated image.
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {active.sourceUrl && (
                <Button asChild size="sm" variant="outline">
                  <a href={active.sourceUrl} target="_blank" rel="noreferrer">
                    <ExternalLink /> Official source
                  </a>
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={resetGlobe}>
                <RotateCcw /> Back to globe
              </Button>
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-500">
              <ShieldCheck className="size-3" /> Media is shown only when redistribution permission
              is registered.
            </p>
            <details className="mt-4 border-t pt-4">
              <summary className="cursor-pointer text-sm font-semibold text-primary">
                View location evidence, JSON and PDF
              </summary>
              <RecordExplorer
                record={{
                  id: active.id,
                  title: active.name,
                  verification: active.verification || "verification-not-recorded",
                  evidence_summary: active.description,
                  ...(active.sourceUrl ? { source_url: active.sourceUrl } : {}),
                  coordinates: { lat: active.lat, lon: active.lon },
                  region: active.region,
                }}
                kind="station"
                compact
              />
            </details>
          </aside>
        )}
        <span className="absolute bottom-3 left-3 rounded-full bg-white/85 px-3 py-1 text-[10px] font-semibold text-slate-600 backdrop-blur">
          SATELLITE COMPOSITE · NOT LIVE WEATHER
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {views.map((v) => (
          <Button
            key={v.name}
            size="sm"
            variant="secondary"
            onClick={() => {
              setShowDetails(false);
              move(v.lat, v.lon, 1);
            }}
          >
            {v.name}
          </Button>
        ))}
        <Button
          size="icon"
          variant="outline"
          aria-label={spin ? "Pause rotation" : "Rotate globe"}
          title={spin ? "Pause the globe rotation" : "Start a slow globe rotation"}
          disabled={mode !== "globe"}
          onClick={() => setSpin(!spin)}
        >
          {spin ? <Pause className="size-4" /> : <Play className="size-4" />}
        </Button>
        <Button
          size="icon"
          variant="outline"
          aria-label="Zoom in"
          title="Zoom closer to the selected coordinates"
          onClick={() => setZoom((z) => Math.min(3.4, z + 0.2))}
        >
          <ZoomIn className="size-4" />
        </Button>
        <Button
          size="icon"
          variant="outline"
          aria-label="Zoom out"
          title="Zoom away from the selected coordinates"
          onClick={() => setZoom((z) => Math.max(0.8, z - 0.15))}
        >
          <ZoomOut className="size-4" />
        </Button>
        <Button
          size="icon"
          variant="outline"
          aria-label="Reset globe"
          title="Reset the globe to the India overview"
          onClick={resetGlobe}
        >
          <RotateCcw className="size-4" />
        </Button>
      </div>
      <label className="flex items-center gap-3 text-xs">
        Facilities established by {year}
        <input
          className="min-w-0 flex-1"
          type="range"
          min={1981}
          max={new Date().getFullYear()}
          value={year}
          onChange={(e) => setYear(+e.target.value)}
        />
      </label>
      {active && (
        <article className="rounded-2xl border bg-white p-4">
          <h3 className="font-semibold">
            {active.name}{" "}
            <span className="text-xs font-normal text-muted-foreground">{active.region}</span>
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">{active.description}</p>
          <p className="mt-2 text-xs">
            {active.lat.toFixed(4)}° latitude · {active.lon.toFixed(4)}° longitude
          </p>
        </article>
      )}
      <div className="flex flex-wrap gap-2">
        {visible.map((s) => (
          <button
            key={s.id}
            aria-pressed={selected === s.id}
            onClick={() => select(s.id)}
            className={`rounded-full border px-3 py-2 text-xs ${selected === s.id ? "bg-sky-100 border-sky-300" : "bg-white"}`}
          >
            {s.name}
          </button>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground">
        Surface imagery: NASA Blue Marble Next Generation, 5400 × 2700 satellite composite. Clouds
        and snow are visual layers; the globe is geographic context, not live imagery or a survey
        map.
      </p>
    </div>
  );
}
