export interface MediaItem {
  id: string;
  kind: "photo" | "video" | "report";
  title: string;
  credit: string;
  captured: string;
  location: string;
  expeditionCode: string;
  description: string;
  tags: string[];
  license: string;
  hue: number;
  imageUrl?: string;
  downloadUrl?: string;
}

/**
 * Only verified source records belong here. Media remains on the owner site;
 * Dakshinsetu lists and attributes it instead of copying unknown-licence files.
 */
export const mediaItems: MediaItem[] = [
  {
    id: "official-stations-gallery",
    kind: "photo",
    title: "Indian Antarctic stations gallery",
    credit: "National Centre for Polar and Ocean Research",
    captured: "Date not supplied",
    location: "Antarctica",
    expeditionCode: "NCPOR archive",
    description:
      "The official NCPOR/National Centre for Antarctic and Ocean Research gallery lists photographs of Bharati, Dakshin Gangotri and Maitri.",
    tags: ["Bharati", "Dakshin Gangotri", "Maitri"],
    license: "Copyright and reuse terms: see source",
    hue: 205,
    downloadUrl: "https://ncps.ncpor.res.in/expedition/pic_gallery.php?album=STATIONS",
  },
  {
    id: "official-himadri-page",
    kind: "photo",
    title: "Himadri station in winter",
    credit: "National Centre for Polar and Ocean Research",
    captured: "Date not supplied",
    location: "Ny-Ålesund, Svalbard",
    expeditionCode: "Indian Arctic Programme",
    description:
      "Official NCPOR station page describing Himadri and presenting its winter station photograph.",
    tags: ["Himadri", "Arctic", "station"],
    license: "Copyright and reuse terms: see source",
    hue: 190,
    downloadUrl: "https://www.ncpor.res.in/pages/view/340-himadristation",
  },
  {
    id: "official-arctic-report-2024",
    kind: "report",
    title: "Indian Arctic Expedition 2023–24 Report",
    credit: "NCPOR Arctic Expedition Logistics section",
    captured: "2024-07-27",
    location: "Svalbard, Arctic",
    expeditionCode: "Indian Arctic Expedition 2023–24",
    description:
      "Official expedition report covering India's Arctic programme and Himadri research infrastructure.",
    tags: ["report", "Arctic", "Himadri"],
    license: "Copyright and reuse terms: see report",
    hue: 220,
    downloadUrl:
      "https://www.ncpor.res.in/files/14-Arctic_Expedition-2023-24_Report-Low_Resolution.pdf",
  },
  {
    id: "official-ncpor-video-channel",
    kind: "video",
    title: "NCPOR official video channel",
    credit: "NCPOR, Goa",
    captured: "Continuously updated",
    location: "India and polar field programmes",
    expeditionCode: "NCPOR outreach",
    description:
      "Official NCPOR video channel for institutional and polar-science outreach material.",
    tags: ["video", "outreach", "NCPOR"],
    license: "Individual video terms apply",
    hue: 175,
    downloadUrl: "https://www.youtube.com/channel/UC1h2xM-VmB1opmtTa4IreQQ",
  },
];

export const mediaKinds = ["photo", "video", "report"] as const;
