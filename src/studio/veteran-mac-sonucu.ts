import { CANVAS_HEIGHT as H, CANVAS_WIDTH as W, drawContain, drawCover, upper, verticalShade, type ImageTemplate, type Row } from "./engine";
import { sizeForCap } from "./kamp-kadrosu";
import { OPPONENTS, OUR_TEAM, logoSrc } from "./veteran-logos";

// Karabük Akademi Veteranlar için Maç Sonucu (Safranboluspor dışı, yalnızca superadmin görür).
// Tam sayfa fotoğraf; üstte lig ve hafta, altta "MAÇ SONUCU", altında beyaz logo kartları arasında lacivert skor
// kutusu, en altta logoların altında gol atanlar. Ölçüler hazır tasarımdan (1600x2000) alınmıştır.

const TITLE = { baseline: 102, cap: 55, maxWidth: 1400 };
/** Ortadaki skor kutusu ve iki yanındaki logo kartları (kutu kartlardan biraz daha uzundur) */
const BOX = { x: 600, y: 1610, w: 400, h: 222 };
const TILES = [
  { key: "logoSol", x: 400, y: 1621, w: 200, h: 200 },
  { key: "logoSag", x: 1000, y: 1621, w: 200, h: 200 },
];
const TILE_PAD = 12;
const SCORE = { cap: 145 };
const RESULT = { baseline: 1577, cap: 74, maxWidth: 600 };
/** Gol atanlar logoların altında: solda ev sahibi (sağa hizalı), sağda deplasman (sola hizalı); top ilk satırın taban çizgisi */
const SCORERS = { top: 1883, bottom: 1975, step: 54, cap: 32, leftX: 568, rightX: 1045, maxWidth: 380 };
/** Tasarımdaki başlık ve gol yazıları Barlow Condensed'den dar: yatayda bu oranda daraltılır */
const SQUEEZE = 0.68;

const VENUES = [
  { value: "home", label: "İç saha" },
  { value: "away", label: "Deplasman" },
];
const SIDES = [
  { value: "biz", label: "Karabük Akademi" },
  { value: "rakip", label: "Rakip" },
];

const condensed = (size: number) => `italic 700 ${size}px "Barlow Condensed", "Arial Narrow", sans-serif`;
const scoreFont = (size: number) => `800 ${size}px "Montserrat", Arial, sans-serif`;

/** Metni hizalayarak, yatayda squeeze oranında daraltıp çizer; genişliğe sığmazsa puntoyu küçültür. */
const drawFitted = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  baseline: number,
  fontAt: (size: number) => string,
  cap: number,
  maxWidth: number,
  align: CanvasTextAlign,
  squeeze = 1,
) => {
  let size = sizeForCap(ctx, fontAt, cap);
  ctx.font = fontAt(size);
  while (size > 12 && ctx.measureText(text).width * squeeze > maxWidth) {
    size -= 1;
    ctx.font = fontAt(size);
  }
  ctx.save();
  ctx.translate(x, baseline);
  ctx.scale(squeeze, 1);
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(text, 0, 0);
  ctx.restore();
};

/** "25", "25'" ve "90+2" girişlerini "25’" biçimine getirir */
const minuteText = (value: string | undefined) => {
  const m = (value ?? "").trim().replace(/['’′]+$/, "");
  return m ? `${m}’` : "";
};

/** Dakikaya göre sıralı gol satırları ("45+2" 45 sayılır) */
const goalsOf = (rows: Row[], side: string) =>
  rows
    .filter((r) => r.takim === side && (r.oyuncu ?? "").trim())
    .sort((a, b) => (parseInt(a.dakika, 10) || 0) - (parseInt(b.dakika, 10) || 0));

export const veteranMacSonucu: ImageTemplate = {
  id: "veteran-mac-sonucu",
  name: "Maç Sonucu",
  description: "Karabük Akademi Veteranlar maç sonucu; fotoğraf, hafta, rakip, skor ve gol atanlar girilir.",
  dynamicImages: ({ values: v }) => {
    const [home, away] = v.evDeplasman === "away" ? [v.rakip, OUR_TEAM] : [OUR_TEAM, v.rakip];
    return {
      ...(home ? { logoSol: logoSrc(home, "renkli") } : {}),
      ...(away ? { logoSag: logoSrc(away, "renkli") } : {}),
    };
  },
  fonts: {
    stylesheet:
      "https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@1,700&family=Montserrat:wght@800&display=swap",
    faces: [condensed(100), scoreFont(100)],
  },
  fields: [
    { key: "fotograf", label: "Fotoğraf", type: "image", hint: "Tüm görseli kaplar; dikey bir maç fotoğrafı önerilir." },
    { key: "lig", label: "Lig", type: "text", default: "TMVFL Batı Karadeniz", placeholder: "TMVFL Batı Karadeniz", maxLength: 40 },
    { key: "hafta", label: "Hafta", type: "text", default: "3", placeholder: "3", maxLength: 3 },
    { key: "rakip", label: "Rakip", type: "select", default: "muzekent", options: OPPONENTS },
    { key: "evDeplasman", label: "Maç", type: "radio", default: "home", options: VENUES },
    { key: "evSkor", label: "Ev sahibi skoru", type: "text", default: "1", placeholder: "0", maxLength: 2 },
    { key: "depSkor", label: "Deplasman skoru", type: "text", default: "2", placeholder: "0", maxLength: 2 },
    {
      key: "goller",
      label: "Gol atanlar",
      type: "list",
      itemLabel: "Gol",
      columns: 3,
      min: 0,
      max: 12,
      fields: [
        { key: "dakika", label: "Dakika", type: "text", default: "", placeholder: "25", maxLength: 5 },
        { key: "oyuncu", label: "Oyuncu", type: "text", default: "", placeholder: "Serhan Dinçer", maxLength: 30 },
        { key: "takim", label: "Takım", type: "select", default: "biz", options: SIDES },
      ],
      columnSpan: { oyuncu: 1 },
      defaultItems: [
        { dakika: "5", oyuncu: "Serhan Dinçer", takim: "biz" },
        { dakika: "18", oyuncu: "Serdar", takim: "rakip" },
        { dakika: "42", oyuncu: "Gökmen", takim: "rakip" },
      ],
    },
  ],
  inlineRows: [
    ["lig", "hafta"],
    ["rakip", "evDeplasman"],
    ["evSkor", "depSkor"],
  ],
  fileLabel: ({ values: v }) => `veteran-mac-sonucu-${v.hafta || ""}-hafta`,
  draw: (ctx, { values: v, lists }, { images, statics }) => {
    const photo = images.fotograf;
    if (photo) drawCover(ctx, photo, 0, 0, W, H);
    else {
      ctx.fillStyle = "#2B3A4F";
      ctx.fillRect(0, 0, W, H);
    }
    // Üstte başlık, altta skor ve gol atanlar okunsun diye fotoğraf iki uçtan koyulaşır
    verticalShade(ctx, [[0, "rgba(0,0,0,0.6)"], [1, "rgba(0,0,0,0)"]], 0, 320);
    verticalShade(ctx, [[0, "rgba(0,0,0,0)"], [0.4, "rgba(0,0,0,0.55)"], [1, "rgba(0,0,0,0.95)"]], 1000, H - 1000);

    ctx.fillStyle = "#FFFFFF";
    const week = (v.hafta ?? "").trim();
    const title = [(v.lig ?? "").trim(), week ? `${week}. Hafta` : ""].filter(Boolean).join(" ");
    if (title) drawFitted(ctx, upper(title), W / 2, TITLE.baseline, condensed, TITLE.cap, TITLE.maxWidth, "center", SQUEEZE);

    for (const tile of TILES) {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(tile.x, tile.y, tile.w, tile.h);
      const logo = statics[tile.key];
      if (logo) drawContain(ctx, logo, tile.x + TILE_PAD, tile.y + TILE_PAD, tile.w - TILE_PAD * 2, tile.h - TILE_PAD * 2);
    }

    const box = ctx.createLinearGradient(0, BOX.y, 0, BOX.y + BOX.h);
    box.addColorStop(0, "#1238A8");
    box.addColorStop(1, "#0A1B66");
    ctx.fillStyle = box;
    ctx.fillRect(BOX.x, BOX.y, BOX.w, BOX.h);

    ctx.fillStyle = "#FFFFFF";
    const score = `${(v.evSkor ?? "").trim() || "0"}-${(v.depSkor ?? "").trim() || "0"}`;
    const scoreSize = sizeForCap(ctx, scoreFont, SCORE.cap);
    ctx.font = scoreFont(scoreSize);
    const glyph = ctx.measureText(score);
    // Rakamların görünen yüksekliğine göre kutuda dikey ortalanır
    const scoreBaseline = BOX.y + BOX.h / 2 + (glyph.actualBoundingBoxAscent - glyph.actualBoundingBoxDescent) / 2;
    drawFitted(ctx, score, BOX.x + BOX.w / 2, scoreBaseline, scoreFont, SCORE.cap, BOX.w - 40, "center");

    drawFitted(ctx, "MAÇ SONUCU", W / 2, RESULT.baseline, condensed, RESULT.cap, RESULT.maxWidth, "center", SQUEEZE);

    const rows = lists.goller ?? [];
    const [homeSide, awaySide] = v.evDeplasman === "away" ? ["rakip", "biz"] : ["biz", "rakip"];
    const columns = [
      { goals: goalsOf(rows, homeSide), x: SCORERS.leftX, align: "right" as const },
      { goals: goalsOf(rows, awaySide), x: SCORERS.rightX, align: "left" as const },
    ];
    // Gol çoksa satırlar sıklaşır ve birlikte küçülür
    const most = Math.max(1, ...columns.map((c) => c.goals.length));
    const step = Math.min(SCORERS.step, (SCORERS.bottom - SCORERS.top) / Math.max(1, most - 1));
    const cap = Math.min(SCORERS.cap, step * 0.58);
    for (const { goals, x, align } of columns)
      goals.forEach((g, i) => {
        const name = upper(g.oyuncu.trim());
        const minute = minuteText(g.dakika);
        const text = !minute ? name : align === "right" ? `${name}  ${minute}` : `${minute}  ${name}`;
        drawFitted(ctx, text, x, SCORERS.top + i * step, condensed, cap, SCORERS.maxWidth, align, SQUEEZE);
      });
  },
};
