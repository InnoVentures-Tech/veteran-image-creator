import { CANVAS_HEIGHT as H, CANVAS_WIDTH as W, drawContain, drawCover, sizeForCap, type ImageTemplate } from "./engine";
import { PLAYER_CHOICES, findPlayer, playersByName, type VeteranPlayer } from "./veteran-kadro";
import { LOGO_STYLES, OPPONENTS, VENUES, homeAway, logoSrc } from "./veteran-logos";

// Karabük Akademi Veteranlar için Kamp Kadrosu.
// Arka planlar hazır tasarımdan yazılar ve logolar silinerek alınmıştır; "KAMP" başlığı ve köşe çizgileri görselin içindedir.
// Ölçüler ve renkler o tasarımdan (1500x2000, canvas'a 1600x2000 kırpılarak) ölçülmüştür. Tüm arka planlar aynı
// boş zeminden üretilir (oyuncu fotoğrafı dekupe edilip sola yerleştirilir), bu yüzden yerleşim ortaktır.

const NUMBER_BLUE = "#4F95EE";
const GK_GRAY = "#A9B1BD";

/** Arka plan seçenekleri: yeni oyuncu fotoğrafı geldiğinde buraya eklenir */
const BACKGROUNDS = [
  { value: "aydin", label: "Aydın - Mavi Forma" },
  { value: "alper", label: "Alper - Mavi Forma" },
  { value: "huseyin", label: "Hüseyin - Beyaz Forma" },
];
const bgSrc = (key: string) => `/images/veteran-kamp-${key}.webp`;

/**
 * Logolar sol üstteki köşe çizgilerinin (x 92–272, y 190–529) içinde: üstte ev sahibi, altta misafir.
 * Her logo kutu yüksekliğinin ~%42'si kadar, genişliğe sığdırılarak çizilir.
 */
const LOGOS = { cx: 182, homeCy: 280, awayCy: 440, height: 142, maxWidth: 146 };

const FAMILY = '"Figtree", "Nunito Sans", Arial, sans-serif';
const font = (weight: number) => (size: number) => `${weight} ${size}px ${FAMILY}`;
const lightFont = font(300);
const numberFont = font(400);
const nameFont = font(800);
/** Tasarımdaki yazı Figtree'den dar: tüm metinler yatayda bu oranda daraltılır */
const SQUEEZE = 0.9;

const HEADER = { x: 654, baseline: 67, cap: 22, maxWidth: 1500 - 654 };
/** Oyuncu listesi iki sütun: sol sütun ilk yarı; satırlar 55 px aralıkla iner, adların büyük harf üstü 1041'de başlar */
const LIST = { top: 1041, pitch: 55.1, maxBottom: 1640, nameCap: 32, numCap: 24, gkCap: 21, gkGap: 10 };
const COLUMNS = [
  { numCenterX: 909, nameX: 961, maxRight: 1250 },
  { numCenterX: 1285, nameX: 1332, maxRight: 1560 },
];
const COACH = { centerX: 1186, baseline: 1735, cap: 34, maxWidth: 700 };
const FOOTER = { baseline: 1975, cap: 19, dateX: 94, venueRight: 1503 };

/** Görsele sığan en fazla oyuncu */
const MAX_PLAYERS = 24;

/** Varsayılan kamp kadrosu: kadrodaki (veteran-kadro.ts) forma numaraları */
const DEFAULT_SQUAD = ["1", "4", "6", "7", "10", "12", "18", "19", "21", "25", "33", "41", "53", "54", "61", "65", "77", "78", "89", "99"]
  .map((numara) => findPlayer(numara)?.ad ?? "")
  .join("\n");

/** Forma numarasına göre sıralar */
const byNumber = (a: VeteranPlayer, b: VeteranPlayer) => Number.parseInt(a.numara, 10) - Number.parseInt(b.numara, 10);

/** Metni büyük harf yüksekliğine göre, yatayda daraltarak çizer; maxWidth'e sığmazsa daha da daraltır. Çizilen genişliği döner. */
const drawText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  baseline: number,
  fontAt: (size: number) => string,
  cap: number,
  align: CanvasTextAlign = "left",
  maxWidth = Infinity,
) => {
  ctx.font = fontAt(sizeForCap(ctx, fontAt, cap));
  const width = ctx.measureText(text).width * SQUEEZE;
  ctx.save();
  ctx.translate(x, baseline);
  ctx.scale(Math.min(SQUEEZE, (SQUEEZE * maxWidth) / width), 1);
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(text, 0, 0);
  ctx.restore();
  return Math.min(width, maxWidth);
};

export const veteranKampKadrosu: ImageTemplate = {
  id: "veteran-kamp-kadrosu",
  name: "Kamp Kadrosu",
  description: "Karabük Akademi Veteranlar kamp kadrosu; oyuncular kadrodan seçilir, görselde forma numarasına göre sıralanır.",
  dynamicImages: ({ values }) => ({
    background: bgSrc(values.arkaPlan || BACKGROUNDS[0].value),
    ...Object.fromEntries(
      homeAway(values.evDeplasman, values.rakip).flatMap((team, i) =>
        team ? [[i === 0 ? "homeLogo" : "awayLogo", logoSrc(team, values.logoStili)]] : [],
      ),
    ),
  }),
  fonts: {
    stylesheet: "https://fonts.googleapis.com/css2?family=Figtree:wght@300;400;800&display=swap",
    faces: [lightFont(100), numberFont(100), nameFont(100)],
  },
  fields: [
    { key: "arkaPlan", label: "Arka plan", type: "select", default: BACKGROUNDS[0].value, options: BACKGROUNDS },
    { key: "rakip", label: "Rakip", type: "select", default: OPPONENTS[0].value, options: OPPONENTS },
    { key: "evDeplasman", label: "Karabük Akademi", type: "radio", default: "home", options: VENUES },
    { key: "logoStili", label: "Logolar", type: "radio", default: "renkli", options: LOGO_STYLES },
    { key: "hafta", label: "Hafta", type: "text", default: "TMVFL BATI KARADENİZ BÖLGESİ 1. HAFTA", maxLength: 60 },
    { key: "tarih", label: "Tarih ve saat", type: "text", default: "11.10.2026  15:00", placeholder: "11.10.2026  15:00", maxLength: 24 },
    { key: "saha", label: "Saha", type: "text", default: "Karabük 5000 Evler Futbol Sahası", maxLength: 50 },
    { key: "teknikDirektor", label: "Teknik direktör", type: "text", default: "Coşkun Uzunçelebi", maxLength: 32 },
    {
      key: "kadro",
      label: "Kamp kadrosu",
      type: "players",
      default: DEFAULT_SQUAD,
      options: PLAYER_CHOICES,
      hint: `Takım kadrosundaki oyuncular; seçilenler görselde forma numarasına göre listelenir (en fazla ${MAX_PLAYERS}).`,
    },
  ],
  validate: ({ values }) => {
    const count = playersByName(values.kadro).length;
    if (!count) return "Kamp kadrosu için en az bir oyuncu seçin.";
    return count > MAX_PLAYERS ? `Kamp kadrosu en fazla ${MAX_PLAYERS} oyuncu olabilir; şu an ${count} oyuncu seçili.` : null;
  },
  fileLabel: ({ values }) => `veteran-kamp-${values.arkaPlan || ""}`,
  inlineRows: [
    ["arkaPlan", "rakip"],
    ["evDeplasman", "logoStili"],
    ["hafta", "tarih"],
    ["saha", "teknikDirektor"],
  ],
  draw: (ctx, { values: v }, { statics }) => {
    if (statics.background) drawCover(ctx, statics.background, 0, 0, W, H);
    else {
      ctx.fillStyle = "#06122B";
      ctx.fillRect(0, 0, W, H);
    }

    for (const [img, cy] of [
      [statics.homeLogo, LOGOS.homeCy],
      [statics.awayLogo, LOGOS.awayCy],
    ] as const) {
      if (img) drawContain(ctx, img, LOGOS.cx - LOGOS.maxWidth / 2, cy - LOGOS.height / 2, LOGOS.maxWidth, LOGOS.height);
    }

    ctx.fillStyle = "#FFFFFF";
    const week = (v.hafta ?? "").trim();
    if (week) drawText(ctx, week, HEADER.x, HEADER.baseline, lightFont, HEADER.cap, "left", HEADER.maxWidth);
    const date = (v.tarih ?? "").trim();
    if (date) drawText(ctx, date, FOOTER.dateX, FOOTER.baseline, lightFont, FOOTER.cap);
    const venue = (v.saha ?? "").trim();
    if (venue) drawText(ctx, venue, FOOTER.venueRight, FOOTER.baseline, lightFont, FOOTER.cap, "right", 700);

    const players = playersByName(v.kadro).sort(byNumber).slice(0, MAX_PLAYERS);
    const perColumn = Math.ceil(players.length / 2);
    // 11 satıra kadar tasarımdaki aralık; fazlasında satırlar teknik direktörün üstüne sığacak kadar sıklaşır
    const pitch = Math.min(LIST.pitch, (LIST.maxBottom - LIST.top - LIST.nameCap) / Math.max(1, perColumn - 1));
    const scale = Math.min(1, pitch / LIST.pitch);
    players.forEach((player, i) => {
      const col = COLUMNS[i < perColumn ? 0 : 1];
      const capTop = LIST.top + (i % perColumn) * pitch;
      const nameCap = LIST.nameCap * scale;
      const middle = capTop + nameCap / 2;

      ctx.fillStyle = NUMBER_BLUE;
      drawText(ctx, player.numara, col.numCenterX, middle + (LIST.numCap * scale) / 2, numberFont, LIST.numCap * scale, "center");

      const isGk = !!player.kaleci;
      ctx.font = lightFont(sizeForCap(ctx, lightFont, LIST.gkCap * scale));
      const gkWidth = isGk ? LIST.gkGap + ctx.measureText("(GK)").width * SQUEEZE : 0;
      ctx.fillStyle = "#FFFFFF";
      const width = drawText(ctx, player.ad, col.nameX, capTop + nameCap, nameFont, nameCap, "left", col.maxRight - col.nameX - gkWidth);
      if (!isGk) return;
      ctx.fillStyle = GK_GRAY;
      drawText(ctx, "(GK)", col.nameX + width + LIST.gkGap, capTop + nameCap, lightFont, LIST.gkCap * scale);
    });

    const coach = (v.teknikDirektor ?? "").trim();
    if (coach) {
      ctx.fillStyle = "#FFFFFF";
      drawText(ctx, coach, COACH.centerX, COACH.baseline, nameFont, COACH.cap, "center", COACH.maxWidth);
    }
  },
};
