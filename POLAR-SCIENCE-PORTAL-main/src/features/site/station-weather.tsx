import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Snowflake, Wind, Droplets, Gauge, RefreshCw } from "lucide-react";
import { catalogue } from "@/lib/offline-catalogue";
import type { KnowledgeResource } from "@/lib/knowledge";
const stations = [
  { name: "Bharati", region: "Antarctica", lat: -69.408, lon: 76.187 },
  { name: "Maitri", region: "Antarctica", lat: -70.77, lon: 11.73 },
  { name: "Himadri", region: "Arctic", lat: 78.923, lon: 11.923 },
  { name: "Himansh", region: "Himalayas", lat: 32.4, lon: 77.6 },
];
type Weather = {
  temperature_2m: number;
  wind_speed_10m: number;
  relative_humidity_2m: number;
  surface_pressure: number;
  time: string;
};
export function StationWeather() {
  const [selected, setSelected] = useState(0),
    [refresh, setRefresh] = useState(0),
    [weather, setWeather] = useState<Weather | null>(null),
    [state, setState] = useState("Loading weather…"),
    [items, setItems] = useState<KnowledgeResource[] | null>(null);
  const station = stations[selected] ?? stations[0]!;
  useEffect(() => {
    catalogue()
      .then(setItems)
      .catch(() => {});
  }, []);
  useEffect(() => {
    const abort = new AbortController();
    const timeout = setTimeout(() => abort.abort(), 12000);
    setWeather(null);
    setState("Loading weather…");
    fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=" +
        station.lat +
        "&longitude=" +
        station.lon +
        "&current=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m&timezone=GMT",
      { signal: abort.signal },
    )
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then((data) => {
        const c = data.current;
        if (
          !c ||
          !["temperature_2m", "relative_humidity_2m", "surface_pressure", "wind_speed_10m"].every(
            (k) => typeof c[k] === "number",
          )
        )
          throw Error();
        setWeather(c);
        setState("");
      })
      .catch(() => {
        if (!abort.signal.aborted) setState("Weather connection unavailable. Try refresh.");
        else setState("Weather request timed out. Try refresh.");
      })
      .finally(() => clearTimeout(timeout));
    return () => {
      abort.abort();
      clearTimeout(timeout);
    };
  }, [selected, refresh, station.lat, station.lon]);
  const count = (kind: string) =>
    items ? items.filter((x) => x.resource_type === kind).length : "—";
  const stats = [
    { label: "Expedition records", value: count("expedition"), to: "/expeditions" },
    { label: "Scientific datasets", value: count("dataset"), to: "/datasets" },
    { label: "Publications", value: count("publication"), to: "/publications" },
    { label: "Station locations", value: stations.length, to: "/observatory" },
    { label: "Catalogue records", value: items?.length ?? "—", to: "/repository" },
    {
      label: "Photos & videos",
      value: items ? items.filter((x) => ["photo", "video"].includes(x.resource_type)).length : "—",
      to: "/media",
    },
  ];
  return (
    <section
      aria-label="Station weather and collection statistics"
      className="mx-auto max-w-7xl px-5 py-12"
    >
      <div className="weather-sculpture relative overflow-hidden rounded-[28px] p-6 text-white sm:p-9">
        <div
          className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full border border-white/10 bg-white/5"
          aria-hidden="true"
        />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[.2em] text-sky-200">
            Station-area weather
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-7">
            <div>
              <div className="flex items-center gap-3">
                <Snowflake className="size-12 text-cyan-300" />
                <h2 className="text-3xl font-bold">{station.name}</h2>
                <span className="text-sky-200">{station.region}</span>
              </div>
              <p className="my-5 text-6xl font-bold tracking-tight sm:text-7xl">
                {weather ? weather.temperature_2m.toFixed(1) + "°C" : "— °C"}
              </p>
              <p role="status" className="text-sm text-sky-100">
                {state || "Current model estimate at the selected location"}
              </p>
            </div>
            <div className="flex flex-wrap gap-6 text-lg text-sky-100">
              {[
                { Icon: Wind, value: weather?.wind_speed_10m, unit: "km/h", label: "Wind" },
                {
                  Icon: Droplets,
                  value: weather?.relative_humidity_2m,
                  unit: "%",
                  label: "Humidity",
                },
                {
                  Icon: Gauge,
                  value: weather?.surface_pressure,
                  unit: "hPa",
                  label: "Surface pressure",
                },
              ].map(({ Icon, value, unit, label }) => {
                return (
                  <div key={label}>
                    <p className="mb-2 text-xs uppercase tracking-wider">{label}</p>
                    <p className="flex items-center gap-2">
                      <Icon className="size-5" />
                      {value ?? "—"} {unit}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-white/15 pt-5">
            <div className="flex flex-wrap gap-2">
              {stations.map((s, i) => (
                <button
                  key={s.name}
                  aria-pressed={selected === i}
                  onClick={() => setSelected(i)}
                  className={
                    "rounded-full px-4 py-2 text-sm transition-colors " +
                    (selected === i
                      ? "bg-white font-bold text-blue-900"
                      : "bg-white/10 hover:bg-white/20")
                  }
                >
                  {s.name}
                </button>
              ))}
            </div>
            <button
              onClick={() => setRefresh((x) => x + 1)}
              className="flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-sm hover:bg-white/10"
            >
              <RefreshCw className="size-4" />
              Refresh
            </button>
          </div>
          <p className="mt-4 text-xs leading-6 text-sky-200">
            {weather ? "Valid " + weather.time.replace("T", " ") + " UTC · " : ""}
            <a href="https://open-meteo.com/" className="underline">
              Open-Meteo
            </a>{" "}
            · Modelled conditions near station coordinates, not a station instrument feed.
          </p>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <Link
            key={s.label}
            to={s.to}
            className="polar-stat rounded-2xl border border-sky-100 bg-white px-4 py-6 text-center"
          >
            <strong className="block text-3xl font-bold text-blue-900">{s.value}</strong>
            <span className="mt-2 block text-xs font-semibold uppercase tracking-wide text-slate-600">
              {s.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
