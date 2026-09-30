export interface ExampleVisual {
  src: string;
  alt: string;
  caption: string;
  credit: string;
  source: string;
  evidenceRole: "record media" | "illustrative context";
}

export const exampleVisuals: ExampleVisual[] = [
  {
    src: "/example-media/maitri-station.jpg",
    alt: "Maitri research station in Antarctica",
    caption: "Maitri research station",
    credit: "Prakash Khatarkar / Wikimedia Commons, CC BY-SA 4.0",
    source:
      "https://commons.wikimedia.org/wiki/File:%E0%A4%AE%E0%A5%88%E0%A4%A4%E0%A5%8D%E0%A4%B0%E0%A5%80,_%E0%A4%AD%E0%A4%BE%E0%A4%B0%E0%A4%A4%E0%A5%80%E0%A4%AF_%E0%A4%B8%E0%A5%8D%E0%A4%9F%E0%A5%87%E0%A4%B6%E0%A4%A8_%E0%A4%85%E0%A4%82%E0%A4%9F%E0%A4%BE%E0%A4%B0%E0%A5%8D%E0%A4%95%E0%A4%9F%E0%A4%BF%E0%A4%95_%E0%A4%AE%E0%A4%B9%E0%A4%BE%E0%A4%A6%E0%A5%8D%E0%A4%B5%E0%A5%80%E0%A4%AA.jpg",
    evidenceRole: "record media",
  },
  {
    src: "/example-media/dakshin-gangotri-station.jpg",
    alt: "Dakshin Gangotri station after construction",
    caption: "Dakshin Gangotri station",
    credit: "Pavan Nair / Wikimedia Commons, CC BY-SA 4.0",
    source: "https://commons.wikimedia.org/wiki/File:Dakshin_Gangotri_station.jpg",
    evidenceRole: "record media",
  },
  {
    src: "/example-media/himadri-inauguration.jpg",
    alt: "Opening of Himadri Arctic research station",
    caption: "Himadri station inauguration",
    credit: "Government of India / PIB, GODL-India",
    source:
      "https://commons.wikimedia.org/wiki/File:The_Union_Minister_for_Science_%26_Technology_and_Earth_Sciences_Shri_Kapil_Sibal_inaugurating_%E2%80%9CHimadri%E2%80%9D_the_new_Indian_Research_Center_in_the_Arctic_on_1st_July_2008.jpg",
    evidenceRole: "record media",
  },
  {
    src: "/example-media/bharati-larsemann-context.jpg",
    alt: "Weathered rock in Larsemann Hills, Antarctica",
    caption: "Larsemann Hills near the Bharati region — not the station building",
    credit: "Tsy1980 / Wikimedia Commons, CC BY 4.0",
    source: "https://commons.wikimedia.org/wiki/File:Weathered_rock_-_Larsemann_Hills.jpg",
    evidenceRole: "illustrative context",
  },
  {
    src: "/example-media/himansh-chandra-context.jpg",
    alt: "Chandra River valley in Lahaul-Spiti",
    caption: "Chandra basin regional context — not the Himansh facility",
    credit: "ADARSHluck / Wikimedia Commons, CC BY-SA 4.0",
    source:
      "https://commons.wikimedia.org/wiki/File:Chandra_river_bed,_Batal,_Lahaul_and_Spiti_Dist.,_HP,_India._Elev._4,000m_D35_7218_01.jpg",
    evidenceRole: "illustrative context",
  },
  {
    src: "/example-media/indarc-kongsfjorden-context.jpg",
    alt: "Kongsfjorden and Conwaybreen in Svalbard",
    caption: "Kongsfjorden environmental context — not the underwater IndARC mooring",
    credit: "Bjoertvedt / Wikimedia Commons, CC BY-SA 3.0",
    source: "https://commons.wikimedia.org/wiki/File:Kongsfjorden_Conwaybreen_IMG_6663.JPG",
    evidenceRole: "illustrative context",
  },
  {
    src: "/example-media/arctic-sea-ice.jpg",
    alt: "Scientific visualisation of Arctic sea ice",
    caption: "Arctic seasonal sea-ice visualisation",
    credit: "NASA/GSFC Scientific Visualization Studio",
    source: "https://svs.gsfc.nasa.gov/3698/",
    evidenceRole: "illustrative context",
  },
  {
    src: "/example-media/penguin-beach.jpg",
    alt: "Penguins on a beach near Punta Arenas",
    caption: "Operation IceBridge field-deployment context",
    credit: "NASA / Maria-Jose Vinas",
    source: "https://www.nasa.gov/image-article/penguin-beach/",
    evidenceRole: "illustrative context",
  },
  {
    src: "/example-media/paper-preview.png",
    alt: "Ocean Science graphical abstract preview",
    caption: "Southern Ocean hydrographic publication preview",
    credit: "Katsumata et al. / Copernicus Publications, CC BY 4.0",
    source: "https://doi.org/10.5194/os-21-419-2025",
    evidenceRole: "record media",
  },
];

export function visualForId(id: string): ExampleVisual {
  let hash = 0;
  for (const character of id) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return exampleVisuals[hash % exampleVisuals.length]!;
}
