export interface DemoEntry {
  id: string;
  category: string;
  title: string;
  region: string;
  summary: string;
  details: string[];
}
export const demoEntries: DemoEntry[] = [
  {
    id: "station-weather",
    category: "dataset",
    title: "Station weather · sample observations",
    region: "Antarctic",
    summary: "Explore a small illustrative temperature and wind dataset.",
    details: [
      "Purpose: demonstrate tabular preview, charting and CSV download.",
      "Variables: day, temperature (°C), wind speed (m/s). All numbers are synthetic.",
      "This sample is not a measurement from Maitri or Bharati and must not be cited as scientific evidence.",
    ],
  },
  {
    id: "glacier-survey",
    category: "dataset",
    title: "Glacier survey · classroom dataset",
    region: "Himalaya",
    summary: "A synthetic glacier-monitoring example for learning data interpretation.",
    details: [
      "A classroom scenario showing how repeated observations can be organized.",
      "The chart and CSV use invented sample values to demonstrate the interface.",
      "No inference about a real Himalayan glacier can be made from this example.",
    ],
  },
  {
    id: "ocean-profile",
    category: "dataset",
    title: "Ocean observations · practice dataset",
    region: "Southern Ocean",
    summary: "Learn to inspect variables, units and data provenance.",
    details: [
      "Demonstration workflow: inspect metadata, preview records, download a CSV, then check the source.",
      "The provided weather series is a UI fixture, not a real CTD cast.",
      "Real oceanographic records remain in the evidence repository.",
    ],
  },
  {
    id: "science-brief",
    category: "publication",
    title: "From measurements to a science brief",
    region: "Multiple",
    summary: "A sample publication layout with abstract, methods and limitations.",
    details: [
      "Abstract: this illustrative brief demonstrates how to present scientific material without losing its evidence links.",
      "Methods: collect original sources, retain page references, and distinguish measurements from interpretation.",
      "Limitations: this is an authored demonstration, not a published or peer-reviewed paper.",
    ],
  },
  {
    id: "antarctic-journey",
    category: "expedition",
    title: "Antarctic field journey · demo itinerary",
    region: "Antarctic",
    summary: "Explore preparation, transit, station work and return stages.",
    details: [
      "Stage 1: prepare instruments, safety checks and a research plan.",
      "Stage 2: transit and station orientation. This is not a real voyage schedule.",
      "Stage 3: carry out observations, check quality and preserve original records.",
      "Stage 4: return, archive permitted records and draft source-linked outreach.",
    ],
  },
  {
    id: "arctic-campaign",
    category: "expedition",
    title: "Arctic science campaign · learning scenario",
    region: "Arctic",
    summary: "An example expedition information page for atmospheric research.",
    details: [
      "Practice planning an atmospheric observation campaign.",
      "Identify variables, calibration needs, sampling intervals and safety requirements.",
      "No dates, participants or observations in this scenario represent an actual expedition.",
    ],
  },
  {
    id: "classroom-workshop",
    category: "activity",
    title: "Polar science classroom workshop",
    region: "Multiple",
    summary: "A demonstration activity with a reusable session outline.",
    details: [
      "15 minutes: explore the globe and locate the three polar regions.",
      "20 minutes: inspect a record and identify its owner, licence and evidence.",
      "15 minutes: compare an outreach draft against the source.",
      "This is a sample activity plan, not an announced NCPOR event.",
    ],
  },
  {
    id: "data-clinic",
    category: "activity",
    title: "Research data clinic · demo programme",
    region: "Multiple",
    summary: "Practice metadata checks, duplicate detection and source review.",
    details: [
      "Bring a permitted source and describe its title, owner, location and rights.",
      "Inspect extraction results and identify missing metadata.",
      "A demonstration programme only; registration does not book a real event.",
    ],
  },
  {
    id: "demo-voyager",
    category: "vessel",
    title: "Demo Voyager · simulated voyage",
    region: "Southern Ocean",
    summary: "A fictional vessel profile demonstrating a route and voyage information.",
    details: [
      "Fictional vessel for interface demonstration; not part of any real fleet.",
      "Illustrative route: departure, open-ocean transit, observation area, return.",
      "Position, speed and ETA are not live AIS observations. Use the real vessel reference for sourced information.",
    ],
  },
];
export const sampleSeries = [
  { day: "Day 1", temperature: -12, wind: 5 },
  { day: "Day 2", temperature: -10, wind: 7 },
  { day: "Day 3", temperature: -14, wind: 4 },
  { day: "Day 4", temperature: -8, wind: 9 },
  { day: "Day 5", temperature: -9, wind: 6 },
  { day: "Day 6", temperature: -6, wind: 8 },
];
export function downloadDemoCsv() {
  const csv =
    "day,temperature_c,wind_m_s\n" +
    sampleSeries.map((r) => [r.day, r.temperature, r.wind].join(",")).join("\n");
  const url = URL.createObjectURL(
    new Blob(["# SYNTHETIC DEMONSTRATION DATA — NOT OBSERVATIONS\n" + csv], {
      type: "text/csv;charset=utf-8",
    }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "dakshinsetu-demo-data.csv";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
