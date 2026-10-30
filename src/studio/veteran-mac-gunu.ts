import { drawContain, drawCover, upper, type ImageTemplate } from "./engine";
import { sizeForCap } from "./kamp-kadrosu";
import { LOGO_STYLES, OPPONENTS, OUR_TEAM, logoSrc } from "./veteran-logos";

// Karabük Akademi Veteranlar için Maç Günü (Safranboluspor dışı, yalnızca superadmin görür).
// Çerçeve hazır tasarımdan alınmıştır: "MAÇ GÜNÜ" yazısı görselin içindedir, fotoğraf alanı saydamdır,
// logolar ile tarih/saha yazısı silinmiştir. Ölçüler o tasarımdan (1600x2000) ölçülmüştür.

const FRAME = "/images/design/berkay-ozel/mac-gunu-cerceve.webp";

/** Çerçevedeki saydam fotoğraf alanının sınırları */
const PHOTO = { x: 387, y: 186, w: 1214, h: 1632 };
/** "GÜNÜ" panelinin altındaki iki logo kutusu: solda ev sahibi, sağda deplasman */
const LOGOS = [
  { key: "logoSol", x: 77, y: 1480, w: 130, h: 140 },
  { key: "logoSag", x: 213, y: 1480, w: 130, h: 140 },
];
const VENUES = [
  { value: "home", label: "İç saha" },
  { value: "away", label: "Deplasman" },
];
const DATE = { x: 119, baseline: 1803, cap: 50, maxWidth: 880, spacing: 1.8 };
const VENUE = { x: 119, baseline: 1865, cap: 34, maxWidth: 880, spacing: -0.8 };

const sans = (weight: number) => (size: number) => `${weight} ${size}px "Montserrat", Arial, sans-serif`;
const dateFont = sans(700);
const venueFont = sans(500);

/** Metni sola hizalı çizer; genişliğe sığmazsa puntoyu küçültür. */
const drawLine = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  baseline: number,
  fontAt: (size: number) => string,
  cap: number,
  maxWidth: number,
  spacing = 0,
) => {
  let size = sizeForCap(ctx, fontAt, cap);
  ctx.letterSpacing = `${spacing}px`;
  ctx.font = fontAt(size);
  while (size > 16 && ctx.measureText(text).width > maxWidth) {
    size -= 1;
    ctx.font = fontAt(size);
  }
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(text, x, baseline);
  ctx.letterSpacing = "0px";
};

export const veteranMacGunu: ImageTemplate = {
  id: "veteran-mac-gunu",
  name: "Maç Günü",
  description: "Karabük Akademi Veteranlar maç günü; fotoğraf, rakip, tarih, saat ve saha seçilir.",
  staticImages: { frame: FRAME },
  dynamicImages: ({ values: v }) => {
    const [home, away] = v.evDeplasman === "away" ? [v.rakip, OUR_TEAM] : [OUR_TEAM, v.rakip];
    return {
      ...(home ? { logoSol: logoSrc(home, v.logoStili) } : {}),
      ...(away ? { logoSag: logoSrc(away, v.logoStili) } : {}),
    };
  },
  fonts: {
    stylesheet: "https://fonts.googleapis.com/css2?family=Montserrat:wght@500;700&display=swap",
    faces: [dateFont(100), venueFont(100)],
  },
  fields: [
    { key: "fotograf", label: "Fotoğraf", type: "image", hint: "Sağdaki alanı kaplar; dikey bir maç fotoğrafı önerilir." },
    { key: "rakip", label: "Rakip", type: "select", default: OPPONENTS[0].value, options: OPPONENTS },
    { key: "evDeplasman", label: "Maç", type: "radio", default: "home", options: VENUES },
    { key: "logoStili", label: "Logolar", type: "radio", default: "renkli", options: LOGO_STYLES },
    { key: "tarih", label: "Tarih", type: "text", default: "18 Ekim 2026", placeholder: "18 Ekim 2026", maxLength: 24 },
    { key: "saat", label: "Saat", type: "text", default: "20:30", placeholder: "20:30", maxLength: 5 },
    {
      key: "saha",
      label: "Saha",
      type: "text",
      default: "5000 Evler Futbol Sahası",
      placeholder: "5000 Evler Futbol Sahası",
      maxLength: 40,
    },
  ],
  inlineRows: [
    ["evDeplasman", "logoStili"],
    ["tarih", "saat"],
  ],
  fileLabel: ({ values }) => `veteran-mac-gunu-${values.tarih || ""}`,
  draw: (ctx, { values: v }, { images, statics }) => {
    const photo = images.fotograf;
    if (photo) drawCover(ctx, photo, PHOTO.x, PHOTO.y, PHOTO.w, PHOTO.h);
    else {
      ctx.fillStyle = "#2B3A4F";
      ctx.fillRect(PHOTO.x, PHOTO.y, PHOTO.w, PHOTO.h);
    }
    if (statics.frame) ctx.drawImage(statics.frame, 0, 0);

    for (const box of LOGOS) {
      const logo = statics[box.key];
      if (logo) drawContain(ctx, logo, box.x, box.y, box.w, box.h);
    }

    ctx.fillStyle = "#FFFFFF";
    const when = [v.tarih, v.saat].map((s) => (s ?? "").trim()).filter(Boolean).join(" - ");
    if (when) drawLine(ctx, upper(when), DATE.x, DATE.baseline, dateFont, DATE.cap, DATE.maxWidth, DATE.spacing);
    const venue = upper((v.saha ?? "").trim());
    if (venue) drawLine(ctx, venue, VENUE.x, VENUE.baseline, venueFont, VENUE.cap, VENUE.maxWidth, VENUE.spacing);
  },
};
