import { CANVAS_HEIGHT as H, CANVAS_WIDTH as W, FONTS, drawCover, upper, sizeForCap, type ImageTemplate } from "./engine";
import { checkLineup, orderedPlayers, parseLineup, serializeLineup, shirtNumber } from "./veteran-kadro";

// Karabük Akademi Veteranlar için İlk 11.
// Arka planlar hazır tasarımdan, soldaki liste silinerek alınmıştır; "İLK 11" başlığı görselin içindedir.
// Ölçüler ve renkler o tasarımdan (1600x2000) ölçülmüştür.

const NAVY = "#08122C";
const BLUE = "#063F9A";

/** Arka plan seçenekleri: yeni oyuncu fotoğrafı geldiğinde buraya eklenir */
const BACKGROUNDS = [
  { value: "cahit-berkay", label: "C.Berkay - Mavi Forma" },
  { value: "caner-ozcan", label: "Caner Özcan - Beyaz Forma" },
  { value: "etem-inci", label: "Etem İnci - Beyaz Forma" },
  { value: "ali-turk", label: "Ali Türk - Beyaz Forma" },
  { value: "mustafa-karaca", label: "Mustafa Karaca - Beyaz Forma" },
  { value: "emrullah", label: "Emrullah - Mavi Forma" },
  { value: "ilker", label: "İlker - Mavi Forma" },
];
const bgSrc = (key: string) => `/images/veteran-ilk-11-${key}.webp`;

const font = (size: number) => `400 ${size}px ${FONTS.display}`;

/** Tasarımdaki yazı tasarımdaki fonttan daha dar; "CAHİT BERKAY" 83 px büyük harfle 440 px genişlikte */
const NARROW = { sample: "CAHİT BERKAY", cap: 83, width: 440 };
/** Kontur kalınlığı / büyük harf yüksekliği */
const EMBOLDEN = 0.035;

/** İlk 11 satırları: taban çizgisi 580'den başlar, 103.7 px aralıkla iner */
const ROWS = { baseline: 580, pitch: 103.7, nameX: 182, nameCap: 81, nameMaxRight: 640, numCenterX: 97, numCap: 58 };
/** Kaptan rozeti: adın sağında, büyük harf yüksekliğine ortalı siyah yuvarlak kare */
const BADGE = { gap: 27, w: 49, h: 65, radius: 10, cap: 40 };
const DIVIDER = { y: 1655, x0: 62, x1: 545, width: 2 };
const SUBS_TITLE = { x: 62, baseline: 1738, cap: 52 };
const SUBS = { x: 63, baseline: 1802, pitch: 63, cap: 43, maxWidth: 482, maxLines: 3 };

/** Varsayılan ilk 11, yedekler ve kaptan: kadrodaki (veteran-kadro.ts) forma numaraları */
const DEFAULT_LINEUP = serializeLineup({
  starters: ["1", "21", "6", "67", "14", "65", "7", "61", "9", "18", "54"],
  subs: ["41", "25", "4", "10", "89", "99", "77"],
  captain: "61",
  numbers: {},
});

/** Metni yatayda daraltarak (ve gerekirse maxWidth'e sığdırarak) çizer; çizilen genişliği döner. */
const drawNarrow = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  baseline: number,
  cap: number,
  squeeze: number,
  align: "left" | "center" = "left",
  maxWidth = Infinity,
) => {
  ctx.font = font(sizeForCap(ctx, font, cap));
  const natural = ctx.measureText(text).width * squeeze;
  const scale = Math.min(squeeze, (squeeze * maxWidth) / natural);
  ctx.save();
  ctx.translate(x, baseline);
  ctx.scale(scale, 1);
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(text, 0, 0);
  // Tasarımdaki yazı Bebas Neue'dan biraz kalın: aynı renkte ince kontur
  ctx.lineJoin = "round";
  ctx.lineWidth = cap * EMBOLDEN;
  ctx.strokeStyle = ctx.fillStyle;
  ctx.strokeText(text, 0, 0);
  ctx.restore();
  return Math.min(natural, maxWidth);
};

/** Yedekler virgülle ayrılır; satır sonu yalnızca virgülden sonra gelir, "ALİ TOPÇU" gibi adlar bölünmez. */
const subLines = (ctx: CanvasRenderingContext2D, names: string[], maxWidth: number, squeeze: number) => {
  const lines: string[] = [];
  let line = "";
  names.forEach((name, i) => {
    const item = i < names.length - 1 ? `${name},` : name;
    const next = line ? `${line} ${item}` : item;
    if (line && ctx.measureText(next).width * squeeze > maxWidth) {
      lines.push(line);
      line = item;
    } else line = next;
  });
  if (line) lines.push(line);
  return lines;
};

export const veteranIlk11: ImageTemplate = {
  id: "veteran-ilk-11",
  name: "İlk 11",
  description: "Karabük Akademi Veteranlar ilk 11'i; oyuncular, kaptan ve yedekler kadrodan seçilir.",
  dynamicImages: ({ values }) => ({ background: bgSrc(values.arkaPlan || BACKGROUNDS[0].value) }),
  fields: [
    { key: "arkaPlan", label: "Arka plan", type: "select", default: BACKGROUNDS[0].value, options: BACKGROUNDS },
    { key: "kadro", label: "Kadro", type: "veteranLineup", default: DEFAULT_LINEUP },
  ],
  validate: ({ values }) => {
    const failed = checkLineup(parseLineup(values.kadro)).find((c) => !c.ok);
    return failed ? `${failed.label}: ${failed.detail}` : null;
  },
  fileLabel: ({ values }) => `veteran-${values.arkaPlan || ""}`,
  draw: (ctx, { values: v }, { statics }) => {
    if (statics.background) drawCover(ctx, statics.background, 0, 0, W, H);
    else {
      ctx.fillStyle = "#EEF3FA";
      ctx.fillRect(0, 0, W, H);
    }

    ctx.font = font(sizeForCap(ctx, font, NARROW.cap));
    const squeeze = NARROW.width / ctx.measureText(NARROW.sample).width;

    // İlk 11 kaleci en üstte, diğerleri forma numarasına göre; yedekler de aynı sırayla
    const lineup = parseLineup(v.kadro);
    const captain = lineup.captain;
    orderedPlayers(lineup.starters, lineup.numbers).slice(0, 11).forEach((player, i) => {
      const baseline = ROWS.baseline + i * ROWS.pitch;
      const number = shirtNumber(player, lineup.numbers);
      const name = upper(player.ad);
      ctx.fillStyle = NAVY;
      if (number) drawNarrow(ctx, number, ROWS.numCenterX, baseline - (ROWS.nameCap - ROWS.numCap) / 2, ROWS.numCap, squeeze, "center");
      if (!name) return;

      const isCaptain = !!captain && player.numara === captain;
      const maxWidth = ROWS.nameMaxRight - ROWS.nameX - (isCaptain ? BADGE.gap + BADGE.w : 0);
      ctx.fillStyle = BLUE;
      const width = drawNarrow(ctx, name, ROWS.nameX, baseline, ROWS.nameCap, squeeze, "left", maxWidth);
      if (!isCaptain) return;

      const bx = ROWS.nameX + width + BADGE.gap;
      const by = baseline - ROWS.nameCap / 2 - BADGE.h / 2;
      ctx.fillStyle = NAVY;
      ctx.beginPath();
      ctx.roundRect(bx, by, BADGE.w, BADGE.h, BADGE.radius);
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      drawNarrow(ctx, "C", bx + BADGE.w / 2, by + BADGE.h / 2 + BADGE.cap / 2, BADGE.cap, squeeze, "center");
    });

    const subs = orderedPlayers(lineup.subs).map((p) => upper(p.ad));
    if (!subs.length) return;

    ctx.fillStyle = BLUE;
    ctx.fillRect(DIVIDER.x0, DIVIDER.y, DIVIDER.x1 - DIVIDER.x0, DIVIDER.width);
    ctx.fillStyle = NAVY;
    drawNarrow(ctx, "YEDEKLER", SUBS_TITLE.x, SUBS_TITLE.baseline, SUBS_TITLE.cap, squeeze);

    // Sığmayan yedek listesi için punto, satırlar maxLines'a inene kadar küçülür
    let cap = SUBS.cap;
    let lines: string[];
    for (;;) {
      ctx.font = font(sizeForCap(ctx, font, cap));
      lines = subLines(ctx, subs, SUBS.maxWidth, squeeze);
      if (lines.length <= SUBS.maxLines || cap <= 26) break;
      cap -= 2;
    }
    const pitch = SUBS.pitch * (cap / SUBS.cap);
    ctx.fillStyle = BLUE;
    lines.forEach((line, i) => drawNarrow(ctx, line, SUBS.x, SUBS.baseline + i * pitch, cap, squeeze, "left", SUBS.maxWidth));
  },
};
