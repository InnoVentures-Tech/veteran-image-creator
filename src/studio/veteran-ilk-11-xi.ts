import { CANVAS_HEIGHT as H, CANVAS_WIDTH as W, drawContain, drawCover, sizeForCap, upper, type ImageTemplate } from "./engine";
import { DEFAULT_LINEUP } from "./veteran-ilk-11";
import { checkLineup, orderedPlayers, parseLineup } from "./veteran-kadro";
import { OPPONENTS, VENUES, homeAway, logoSrc } from "./veteran-logos";

// Karabük Akademi Veteranlar için İlk 11 (XI): tam sayfa arka plan, üstte iki beyaz logo ve "XI", ortada alt alta
// oyuncu adları, altta teknik direktör. Yerleşim 1080x1350 örnek tasarımdan ölçülüp 1600x2000'e (x1.4815) taşınmıştır.

/** Arka planlar public/images/bg/<n>.jpeg (1, 2, 3 …); yeni görsel eklendiğinde sayı artırılır */
const BACKGROUND_COUNT = 9;
const BACKGROUNDS = Array.from({ length: BACKGROUND_COUNT }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }));
const bgSrc = (n: string) => `/images/bg/${n}.jpeg`;

const CX = W / 2;
const FAMILY = '"Archivo", "Helvetica Neue", Arial, sans-serif';
/** Örnekteki yazı geniş (extended) bir grotesk; Archivo'nun %125 genişliği kullanılır */
const font = (weight: number) => (size: number) => `${weight} expanded ${size}px ${FAMILY}`;
const nameFont = font(300);
const tdLabelFont = font(800);
const tdNameFont = font(300);
const vsFont = font(400);
const teamFont = font(600);

/** Logolar XI'in iki yanında, ortadan 274 px uzakta; beyaz sürüm */
const LOGOS = { offsetX: 280, cy: 200, size: 158 };

/**
 * XI işareti: kalın X çizgisi (sol üstten sağ alta), ince ters çapraz ve dikey I.
 * Koordinatlar örnekten ölçülmüştür; x değerleri tuval ortasına göredir.
 */
const XI = {
  top: 102,
  bottom: 304,
  thick: { topLeft: -103, topRight: -62, bottomLeft: 17, bottomRight: 58 },
  thin: { x0: -105, x1: 52, width: 2.6 },
  bar: { left: 78, right: 108 },
};
/** "vs. RAKİP": XI'in altında ortalı, harf aralıklı */
const VS = { baseline: 345, cap: 20, spacing: 0.18, gap: 0.5 };

/** Oyuncu adları: ortalı, ilk taban çizgisi 514, 101 px aralık */
const NAMES = { baseline: 514, pitch: 101.2, cap: 37, spacing: 0.02, maxWidth: 900 };
const TD = { baseline: 1687, cap: 24, spacing: 0.01, gap: 0.45, maxWidth: 1100 };
/**
 * Yedekler en altta (örnekte beIN logosunun yerinde): "YEDEKLER:" kalın, adlar ince ve virgülle ayrılır.
 * Satırlar ortalanır; sığmazsa punto en fazla maxLines satıra inene kadar küçülür.
 */
const SUBS = { baseline: 1812, cap: 22, minCap: 16, pitch: 1.75, spacing: 0.01, gap: 0.45, maxWidth: 1240, maxLines: 3 };

const DEFAULT_COACH = "Coşkun Uzunçelebi";

/** Harf aralıklı metnin genişliği (son harften sonra boşluk yok) */
const spacedWidth = (ctx: CanvasRenderingContext2D, text: string, spacing: number) =>
  ctx.measureText(text).width + Math.max(0, [...text].length - 1) * spacing;

/** Metni harf aralığıyla, x'ten başlayarak çizer */
const drawSpaced = (ctx: CanvasRenderingContext2D, text: string, x: number, baseline: number, spacing: number) => {
  let cursor = x;
  for (const ch of text) {
    ctx.fillText(ch, cursor, baseline);
    cursor += ctx.measureText(ch).width + spacing;
  }
};

/**
 * Yan yana birden fazla parçayı (farklı fontlarla) ortalayarak tek satırda çizer; maxWidth'e sığmazsa yatayda daraltır.
 * Her parça: metin, font, büyük harf yüksekliği, harf aralığı (punto oranı) ve kendinden sonraki boşluk (punto oranı).
 */
const drawCenteredLine = (
  ctx: CanvasRenderingContext2D,
  parts: { text: string; fontAt: (size: number) => string; cap: number; spacing: number; after?: number }[],
  baseline: number,
  maxWidth = Infinity,
) => {
  const sized = parts.map((p) => {
    const size = sizeForCap(ctx, p.fontAt, p.cap);
    ctx.font = p.fontAt(size);
    const spacing = p.spacing * size;
    return { ...p, font: ctx.font, spacing, width: spacedWidth(ctx, p.text, spacing), after: (p.after ?? 0) * size };
  });
  const total = sized.reduce((sum, p) => sum + p.width + p.after, 0);
  const scale = Math.min(1, maxWidth / total);
  ctx.save();
  ctx.translate(CX, baseline);
  ctx.scale(scale, 1);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  let x = -total / 2;
  for (const p of sized) {
    ctx.font = p.font;
    drawSpaced(ctx, p.text, x, 0, p.spacing);
    x += p.width + p.after;
  }
  ctx.restore();
};

/** Yedekleri satırlara böler: satır sonu yalnızca virgülden sonra; ilk satırda "YEDEKLER:" etiketi de yer kaplar */
const subLines = (ctx: CanvasRenderingContext2D, names: string[], cap: number) => {
  const labelSize = sizeForCap(ctx, tdLabelFont, cap);
  ctx.font = tdLabelFont(labelSize);
  const labelWidth = spacedWidth(ctx, "YEDEKLER:", SUBS.spacing * labelSize) + SUBS.gap * labelSize;
  const nameSize = sizeForCap(ctx, tdNameFont, cap);
  ctx.font = tdNameFont(nameSize);
  const lines: string[] = [];
  let line = "";
  names.forEach((name, i) => {
    const item = i < names.length - 1 ? `${name},` : name;
    const next = line ? `${line} ${item}` : item;
    const room = SUBS.maxWidth - (lines.length ? 0 : labelWidth);
    if (line && spacedWidth(ctx, next, SUBS.spacing * nameSize) > room) {
      lines.push(line);
      line = item;
    } else line = next;
  });
  if (line) lines.push(line);
  return lines;
};

const drawXi = (ctx: CanvasRenderingContext2D) => {
  const { top, bottom, thick, thin, bar } = XI;
  ctx.beginPath();
  ctx.moveTo(CX + thick.topLeft, top);
  ctx.lineTo(CX + thick.topRight, top);
  ctx.lineTo(CX + thick.bottomRight, bottom);
  ctx.lineTo(CX + thick.bottomLeft, bottom);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(CX + bar.left, top, bar.right - bar.left, bottom - top);
  ctx.save();
  ctx.lineWidth = thin.width;
  ctx.lineCap = "butt";
  ctx.strokeStyle = ctx.fillStyle;
  ctx.beginPath();
  ctx.moveTo(CX + thin.x0, bottom);
  ctx.lineTo(CX + thin.x1, top);
  ctx.stroke();
  ctx.restore();
};

/**
 * Örnek tasarımlardaki gibi arka plan bulanık ve koyu çizilir; beyaz yazılar parlak bayrak görsellerinde de okunur.
 * Bulanıklık kenarlarda saydamlık bırakmasın diye görsel biraz taşırılarak çizilir.
 */
const SHADE = { blur: 7, bleed: 40, darken: 0.38, vignette: 0.55 };

const drawBackground = (ctx: CanvasRenderingContext2D, img: HTMLImageElement) => {
  ctx.save();
  ctx.filter = `blur(${SHADE.blur}px)`;
  drawCover(ctx, img, -SHADE.bleed, -SHADE.bleed, W + 2 * SHADE.bleed, H + 2 * SHADE.bleed);
  ctx.restore();
  ctx.fillStyle = `rgba(0, 0, 0, ${SHADE.darken})`;
  ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(CX, H / 2, H * 0.3, CX, H / 2, H * 0.75);
  g.addColorStop(0, "rgba(0, 0, 0, 0)");
  g.addColorStop(1, `rgba(0, 0, 0, ${SHADE.vignette})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
};

/** Arka plan görseli yoksa (henüz eklenmemişse) koyu lacivert zemin */
const drawFallback = (ctx: CanvasRenderingContext2D) => {
  const g = ctx.createRadialGradient(CX, H * 0.45, 100, CX, H * 0.45, H * 0.8);
  g.addColorStop(0, "#173A7A");
  g.addColorStop(1, "#050B1C");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
};

export const veteranIlk11Xi: ImageTemplate = {
  id: "veteran-ilk-11-xi",
  name: "İlk 11",
  description: "Karabük Akademi Veteranlar ilk 11'i; oyuncu adları alt alta, üstte iki takımın beyaz logosu ve XI, en altta yedekler.",
  dynamicImages: ({ values }) => ({
    background: bgSrc(values.arkaPlan || BACKGROUNDS[0].value),
    ...Object.fromEntries(
      homeAway(values.evDeplasman, values.rakip).flatMap((team, i) =>
        team ? [[i === 0 ? "homeLogo" : "awayLogo", logoSrc(team, "beyaz")]] : [],
      ),
    ),
  }),
  fonts: {
    stylesheet: "https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@125,300;125,400;125,600;125,800&display=swap",
    faces: [nameFont(100), tdLabelFont(100), vsFont(100), teamFont(100)],
  },
  fields: [
    { key: "arkaPlan", label: "Arka plan", type: "select", default: BACKGROUNDS[0].value, options: BACKGROUNDS },
    { key: "rakip", label: "Rakip", type: "select", default: "ataspor", options: OPPONENTS },
    { key: "evDeplasman", label: "Karabük Akademi", type: "radio", default: "home", options: VENUES },
    { key: "teknikDirektor", label: "Teknik direktör", type: "text", default: DEFAULT_COACH, maxLength: 32 },
    { key: "kadro", label: "Kadro", type: "veteranLineup", default: DEFAULT_LINEUP },
  ],
  inlineRows: [
    ["arkaPlan", "rakip"],
    ["evDeplasman", "teknikDirektor"],
  ],
  // Bu tasarımda kaptan gösterilmez: kaptan kuralı dışındaki kurallar denetlenir
  validate: ({ values }) => {
    const failed = checkLineup(parseLineup(values.kadro)).find((c) => !c.ok && !c.label.startsWith("Kaptan"));
    return failed ? `${failed.label}: ${failed.detail}` : null;
  },
  fileLabel: ({ values }) => `veteran-xi-${values.rakip || ""}`,
  draw: (ctx, { values: v }, { statics }) => {
    if (statics.background) drawBackground(ctx, statics.background);
    else drawFallback(ctx);

    ctx.fillStyle = "#FFFFFF";
    const half = LOGOS.size / 2;
    if (statics.homeLogo) drawContain(ctx, statics.homeLogo, CX - LOGOS.offsetX - half, LOGOS.cy - half, LOGOS.size, LOGOS.size);
    if (statics.awayLogo) drawContain(ctx, statics.awayLogo, CX + LOGOS.offsetX - half, LOGOS.cy - half, LOGOS.size, LOGOS.size);

    drawXi(ctx);
    const opponent = OPPONENTS.find((o) => o.value === v.rakip)?.label;
    if (opponent)
      drawCenteredLine(
        ctx,
        [
          { text: "vs.", fontAt: vsFont, cap: VS.cap, spacing: VS.spacing, after: VS.gap },
          { text: upper(opponent), fontAt: teamFont, cap: VS.cap, spacing: VS.spacing },
        ],
        VS.baseline,
        W - 200,
      );

    // Kaleci en üstte, diğerleri forma numarasına göre (İlk 11 - Oyunculu ile aynı sıra)
    const lineup = parseLineup(v.kadro);
    orderedPlayers(lineup.starters, lineup.numbers)
      .slice(0, 11)
      .forEach((player, i) =>
        drawCenteredLine(
          ctx,
          [{ text: upper(player.ad), fontAt: nameFont, cap: NAMES.cap, spacing: NAMES.spacing }],
          NAMES.baseline + i * NAMES.pitch,
          NAMES.maxWidth,
        ),
      );

    const coach = (v.teknikDirektor ?? "").trim();
    if (coach)
      drawCenteredLine(
        ctx,
        [
          { text: "TD:", fontAt: tdLabelFont, cap: TD.cap, spacing: TD.spacing, after: TD.gap },
          { text: upper(coach), fontAt: tdNameFont, cap: TD.cap, spacing: TD.spacing },
        ],
        TD.baseline,
        TD.maxWidth,
      );

    const subs = orderedPlayers(lineup.subs).map((p) => upper(p.ad));
    if (!subs.length) return;
    let cap = SUBS.cap;
    let lines = subLines(ctx, subs, cap);
    while (lines.length > SUBS.maxLines && cap > SUBS.minCap) lines = subLines(ctx, subs, --cap);
    lines.forEach((line, i) =>
      drawCenteredLine(
        ctx,
        [
          ...(i === 0 ? [{ text: "YEDEKLER:", fontAt: tdLabelFont, cap, spacing: SUBS.spacing, after: SUBS.gap }] : []),
          { text: line, fontAt: tdNameFont, cap, spacing: SUBS.spacing },
        ],
        SUBS.baseline + i * cap * SUBS.pitch,
        SUBS.maxWidth,
      ),
    );
  },
};
