type CardOfferI = Record<string, unknown>;

// Görsel oluşturucu çizim altyapısı: şablonlar 1600x2000 bir canvas'a çizilir ve JPEG olarak indirilir.
// Yeni şablon eklemek için templates.ts'e bir ImageTemplate nesnesi eklemek yeterlidir.

export const CANVAS_WIDTH = 1600;
export const CANVAS_HEIGHT = 2000;
export const JPEG_QUALITY = 0.92;

export const BRAND = {
  purple: "#704685",
  purpleDark: "#4F2F5E",
  orange: "#EF7E1C",
  night: "#1A1A2E",
  plum: "#2E1D40",
  cream: "#F5EFE4",
  sand: "#EBE2D2",
  ink: "#1A1A2E",
  white: "#FFFFFF",
};

export const FONTS = {
  display: '"Bebas Neue", "Arial Narrow", sans-serif',
  serif: '"DM Serif Display", Georgia, serif',
  sans: '"Nunito Sans", Arial, sans-serif',
};

/** Kulüp: ad + logo adresi (fikstür ve puan durumu verisinden derlenir) */
export interface Club {
  name: string;
  logo: string | null;
  /** Yalnızca sponsorlarda: grup ("main" | "official" | "supplier") ve yayında olup olmadığı */
  tier?: string;
  published?: boolean;
}

/** Ana sponsor: ad + yüklenmiş logo (logo yoksa null, adı yazılır) */
export interface SponsorMark {
  name: string;
  logo: HTMLImageElement | null;
}

export const US_NAME = "Safranboluspor";
export const US_LOGO = "/logos/logo.webp";

export type ScalarField =
  | { key: string; label: string; type: "text"; default: string; placeholder?: string; maxLength?: number }
  | { key: string; label: string; type: "textarea"; default: string; placeholder?: string; maxLength?: number }
  | { key: string; label: string; type: "select"; default: string; options: { value: string; label: string }[] }
  /** Seçenekler radyo düğmesi olarak yan yana gösterilir (az seçenekli, sık değişen alanlar için) */
  | { key: string; label: string; type: "radio"; default: string; options: { value: string; label: string }[] }
  /** Kulüp seçimi; değer kulüp adıdır, logo otomatik gelir */
  | { key: string; label: string; type: "club"; default: string }
  /** Sponsorlar sayfasındaki firmalardan seçim; değer firma adıdır, logo otomatik gelir */
  | { key: string; label: string; type: "sponsor"; default: string }
  /** Kullanıcının bilgisayarından seçtiği görsel (data URL olarak tutulur, sunucuya gönderilmez) */
  | { key: string; label: string; type: "image"; hint?: string }
  /**
   * Taraftar Kart indirim listesinden (yalnız aktif) firma seçimi; değer firma kimliğidir. Seçilince şablonun
   * offerDefaults değerleri (logo, metin, oran…) diğer alanlara yazılır.
   */
  | { key: string; label: string; type: "cardOffer"; default: string; hint?: string }
  /** A Takım oyuncularından çoklu seçim; değer alfabetik sıralı, satır satır oyuncu adlarıdır */
  | { key: string; label: string; type: "players"; default: string; hint?: string }
  /**
   * Altyapı kadrosundan çoklu seçim (değer "players" gibi satır satır adlardır): categoryKey alanındaki
   * kategorinin (U17, U14) oyuncuları listelenir; kategori değişince rakip, fikstürdeki maçtan opponentKey'e yazılır.
   */
  | {
      key: string;
      label: string;
      type: "youthPlayers";
      default: string;
      categoryKey: string;
      opponentKey: string;
      hint?: string;
    }
  /**
   * A Takım puan durumundaki takımlardan seçim; değer takım adıdır. Boşsa A Takım fikstüründeki
   * sıradaki (oynanmamış ilk) maçın rakibiyle doldurulur.
   */
  | { key: string; label: string; type: "leagueClub"; default: string; hint?: string }
  /**
   * İlk 11 + yedekler + kaptan (JSON, bkz. lineup-rules.ts). Düzenleyici öne çıkan oyuncunun görselini
   * imageKey alanına, teknik direktörü coachKey alanına yazar.
   */
  | {
      key: string;
      label: string;
      type: "lineup";
      default: string;
      imageKey: string;
      coachKey: string;
      /** Öne çıkan oyuncu seçilince görselden tahmin edilen yerleşimin ("right" | "left") yazılacağı alan */
      layoutKey?: string;
      /** Öne çıkan oyuncu seçimiyle aynı satırda gösterilecek alan (örn. rakip takım) */
      besideFeatured?: string;
    }
  /**
   * Altyapı ilk 11'i (JSON, bkz. lineup-rules.ts): categoryKey alanındaki kategorinin (U17, U14) kadrosundan
   * seçilir; forma numaraları düzenleyicide girilir. Fikstürdeki maç rakip ve saha alanlarına yazılır.
   */
  | {
      key: string;
      label: string;
      type: "youthLineup";
      default: string;
      categoryKey: string;
      opponentKey: string;
      venueKey: string;
    };

/** "players" alanının değerini ada göre alfabetik sıralı listeye çevirir */
export const parseNames = (value: string | undefined) =>
  (value ?? "")
    .split("\n")
    .map((name) => name.trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "tr"));

/** Tekrarlanabilir satırlar (örn. haftanın maçları) */
export interface ListField {
  key: string;
  label: string;
  type: "list";
  /** Satır başlığı: "Maç" -> "Maç 1", "Maç 2" */
  itemLabel: string;
  min: number;
  max: number;
  fields: Exclude<
    ScalarField,
    { type: "image" | "players" | "youthPlayers" | "leagueClub" | "lineup" | "youthLineup" | "sponsor" | "cardOffer" }
  >[];
  defaultItems: Row[];
  /** Satır formundaki sütun sayısı (varsayılan 2); 3'te ilk sütun dar olur. Metin alanları tüm satırı kaplar. */
  columns?: 2 | 3;
  /** Alanın başlayacağı sütun (örn. skorları ilgili takımın altına hizalamak için) */
  columnStart?: Record<string, 2 | 3>;
  /** Alanın kaç sütun kaplayacağı; verilmezse metin alanları tüm satırı kaplar */
  columnSpan?: Record<string, 1 | 2>;
  /** Satırlar başlıksız ve açılıp kapanmadan, alanlar ve sil düğmesi tek satırda gösterilir (kısa satırlar için) */
  flat?: boolean;
}

export type TemplateField = ScalarField | ListField;

export type Row = Record<string, string>;
export type TemplateValues = Row;

export interface TemplateData {
  values: TemplateValues;
  lists: Record<string, Row[]>;
}

export interface TemplateAssets {
  /** Renkli kulüp logosu (1024px) */
  logo: HTMLImageElement;
  /** Beyaz kulüp logosu (1024px) */
  logoWhite: HTMLImageElement;
  /** image alanlarının yüklenmiş görselleri (boşsa null) */
  images: Record<string, HTMLImageElement | null>;
  /** Şablonun sabit görselleri (ImageTemplate.staticImages) */
  statics: Record<string, HTMLImageElement | null>;
  /** Seçilen kulübün logosu; bulunamazsa null */
  clubLogo: (name: string) => HTMLImageElement | null;
  /** Seçilen sponsorun logosu; bulunamazsa null */
  sponsorLogo: (name: string) => HTMLImageElement | null;
  /** Yayındaki ana sponsorlar, panel sırasıyla (yalnızca ImageTemplate.mainSponsors açıksa yüklenir) */
  mainSponsors: SponsorMark[];
}

/** A Takım fikstüründen şablona aktarılan maç: bugünkü maç, yoksa sıradaki (oynanmamış ilk) maç */
export interface CurrentMatch {
  opponent: string;
  venue: "home" | "away";
  competition: string;
}

export interface ImageTemplate {
  id: string;
  name: string;
  description: string;
  fields: TemplateField[];
  /** Şablonla gelen sabit görseller (ad -> adres), çizimden önce yüklenir */
  staticImages?: Record<string, string>;
  /** Veriye göre değişen görseller (ad -> adres; örn. oyuncu fotoğrafları), statics'e yüklenir */
  dynamicImages?: (data: TemplateData) => Record<string, string>;
  /** Yalnızca bu şablonun kullandığı fontlar: Google Fonts CSS adresi ve çizimden önce yüklenecek yüzler */
  fonts?: { stylesheet: string; faces: string[] };
  /**
   * Liste alanını fikstürden doldurma: listKey satırları, seasonKey sezon alanı ("2026-2027").
   * upcoming: haftanın maçları; results: haftanın oynanmış maçları ve skorları.
   */
  fixtureSource?: { listKey: string; seasonKey: string; mode: "upcoming" | "results" };
  /** Sponsorlar sayfasındaki yayındaki ana sponsorlar çizimden önce yüklensin */
  mainSponsors?: boolean;
  /** Rakip alanı fikstürden doldurulurken diğer alanlara yazılacak değerler (örn. iç saha/deplasman, maç türü) */
  matchDefaults?: (match: CurrentMatch) => TemplateValues;
  /** cardOffer alanında firma seçilince diğer alanlara yazılacak değerler */
  offerDefaults?: (offer: CardOfferI) => TemplateValues;
  /** İndirilen dosyanın adına eklenecek kısa etiket (örn. firma adı) */
  fileLabel?: (data: TemplateData) => string;
  /** Formda yan yana (tek satırda) gösterilecek alan grupları; grup ilk alanın yerinde çizilir */
  inlineRows?: string[][];
  /** İndirmeden önce kontrol: sorun varsa kullanıcıya gösterilecek mesaj, yoksa null */
  validate?: (data: TemplateData) => string | null;
  draw:(ctx: CanvasRenderingContext2D, data: TemplateData, assets: TemplateAssets) => void;
}

const scalarDefault = (f: ScalarField) => (f.type === "image" ? "" : f.default);

export const defaultData = (template: ImageTemplate): TemplateData => ({
  values: Object.fromEntries(
    template.fields.flatMap((f) => (f.type === "list" ? [] : [[f.key, scalarDefault(f)]])),
  ),
  lists: Object.fromEntries(
    template.fields.flatMap((f) => (f.type === "list" ? [[f.key, f.defaultItems.map((r) => ({ ...r }))]] : [])),
  ),
});

export const emptyRow = (field: ListField): Row =>
  Object.fromEntries(field.fields.map((f) => [f.key, f.default]));

const normalizeName = (name: string) => name.toLocaleLowerCase("tr-TR").replace(/[^a-z0-9çğıöşü]/g, "");
export const findClub = (clubs: Club[], name: string) => {
  const key = normalizeName(name);
  return clubs.find((c) => normalizeName(c.name) === key);
};

const imageCache = new Map<string, Promise<HTMLImageElement>>();

export const loadImage = (src: string) => {
  let pending = imageCache.get(src);
  if (!pending) {
    pending = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.decoding = "async";
      // Başka adresten (API) gelen logolar canvas'ı kirletmesin diye CORS ile istenir
      if (/^https?:\/\//.test(src) && !src.startsWith(window.location.origin)) img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => {
        imageCache.delete(src);
        reject(new Error("Görsel yüklenemedi"));
      };
      img.src = src.startsWith("/") ? import.meta.env.BASE_URL + src.slice(1) : src;
    });
    imageCache.set(src, pending);
  }
  return pending;
};

// Canvas, font yüklenmeden çizerse yedek fonta düşer; Türkçe harflerin bulunduğu alt kümeler de yüklenir.
let fontsReady: Promise<unknown> | null = null;
export const ensureFonts = () => {
  if (!fontsReady) {
    const sample = "AaĞğÜüŞşİıÖöÇç0123456789";
    fontsReady = Promise.all([
      document.fonts.load(`400 100px ${FONTS.display}`, sample),
      document.fonts.load(`400 100px ${FONTS.serif}`, sample),
      document.fonts.load(`400 100px ${FONTS.sans}`, sample),
      document.fonts.load(`800 100px ${FONTS.sans}`, sample),
      document.fonts.load(`900 100px ${FONTS.sans}`, sample),
    ]).catch(() => undefined);
  }
  return fontsReady;
};

// Şablona özel fontlar sitenin geneline yük olmasın diye yalnızca o şablon çizilirken eklenir.
const templateFonts = new Map<string, Promise<unknown>>();
const ensureTemplateFonts = (fonts: ImageTemplate["fonts"]) => {
  if (!fonts) return Promise.resolve();
  let pending = templateFonts.get(fonts.stylesheet);
  if (!pending) {
    pending = new Promise<void>((resolve) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = fonts.stylesheet;
      link.onload = () => resolve();
      link.onerror = () => resolve();
      document.head.appendChild(link);
    })
      .then(() => Promise.all(fonts.faces.map((face) => document.fonts.load(face, "AaĞğÜüŞşİıÖöÇç"))))
      .catch(() => undefined);
    templateFonts.set(fonts.stylesheet, pending);
  }
  return pending;
};

export const upper =(text: string) => text.toLocaleUpperCase("tr-TR");

/** Metni verilen genişliğe sığacak en büyük punto ile döner (maxSize..minSize). */
export const fitFontSize = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  font: (size: number) => string,
  maxSize: number,
  minSize = 12,
) => {
  let size = maxSize;
  ctx.font = font(size);
  while (size > minSize && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = font(size);
  }
  return size;
};

/** Metni kelime kelime satırlara böler; kullanıcının girdiği satır sonları korunur. */
export const wrapLines = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (!words.length) {
      lines.push("");
      continue;
    }
    let line = words[0];
    for (const word of words.slice(1)) {
      const next = `${line} ${word}`;
      if (ctx.measureText(next).width > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = next;
      }
    }
    lines.push(line);
  }
  return lines;
};

/** Satırları en fazla maxLines satıra ve verilen yüksekliğe sığacak punto ile çizer; kullanılan yüksekliği döner. */
export const drawWrapped = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  opts: {
    maxWidth: number;
    font: (size: number) => string;
    size: number;
    minSize?: number;
    lineHeight?: number;
    maxLines?: number;
    color: string;
    align?: CanvasTextAlign;
  },
) => {
  const { maxWidth, font, color, align = "left", lineHeight = 1.15, maxLines = 99, minSize = 24 } = opts;
  let size = opts.size;
  let lines: string[];
  for (;;) {
    ctx.font = font(size);
    lines = wrapLines(ctx, text, maxWidth);
    if (lines.length <= maxLines || size <= minSize) break;
    size -= 4;
  }
  lines = lines.slice(0, maxLines);
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = "top";
  lines.forEach((line, i) => ctx.fillText(line, x, y + i * size * lineHeight));
  return lines.length * size * lineHeight;
};

/** Görseli alanı tamamen kaplayacak şekilde (object-fit: cover) çizer. */
export const drawCover = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) => {
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const sw = w / scale;
  const sh = h / scale;
  ctx.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, x, y, w, h);
};

/** Görseli kutuya sığdırarak (object-fit: contain) ortalar. */
export const drawContain = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) => {
  const scale = Math.min(w / img.naturalWidth, h / img.naturalHeight);
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
};

/** Logo beyaza boyanır (bir kez): mor PGL logosu mor kutuda, sponsor logoları koyu zeminde görünsün diye */
const whiteCache = new WeakMap<HTMLImageElement, HTMLCanvasElement>();
export const whiteVersion = (img: HTMLImageElement) => {
  let canvas = whiteCache.get(img);
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const c = canvas.getContext("2d");
    if (c) {
      c.drawImage(img, 0, 0);
      c.globalCompositeOperation = "source-in";
      c.fillStyle = BRAND.white;
      c.fillRect(0, 0, canvas.width, canvas.height);
    }
    whiteCache.set(img, canvas);
  }
  return canvas;
};

/** Dikey koyulaştırma: fotoğraf üstündeki metinler okunsun diye */
export const verticalShade = (
  ctx: CanvasRenderingContext2D,
  stops: [number, string][],
  y = 0,
  h = CANVAS_HEIGHT,
) => {
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  stops.forEach(([at, color]) => g.addColorStop(at, color));
  ctx.fillStyle = g;
  ctx.fillRect(0, y, CANVAS_WIDTH, h);
};

/** Safranbolu evlerinin çatkısından esinlenen çapraz desenli şerit */
export const drawLatticeStrip = (
  ctx: CanvasRenderingContext2D,
  y: number,
  height: number,
  color: string,
  alpha = 0.35,
) => {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(CANVAS_WIDTH, y);
  ctx.moveTo(0, y + height);
  ctx.lineTo(CANVAS_WIDTH, y + height);
  for (let x = -height; x < CANVAS_WIDTH + height; x += height * 2) {
    ctx.moveTo(x, y + height);
    ctx.lineTo(x + height, y);
    ctx.lineTo(x + height * 2, y + height);
  }
  ctx.stroke();
  ctx.restore();
};

export const renderTemplate = async (
  canvas: HTMLCanvasElement,
  template: ImageTemplate,
  data: TemplateData,
  clubs: Club[] = [],
  sponsors: Club[] = [],
) => {
  await Promise.all([ensureFonts(), ensureTemplateFonts(template.fonts)]);
  const [logo, logoWhite] = await Promise.all([US_LOGO, "/logos/logo-white.webp"].map((src) => loadImage(src).catch(() => new Image())));
  const { values, lists } = data;
  const tryLoad = (src: string | null | undefined) => (src ? loadImage(src).catch(() => null) : Promise.resolve(null));

  const images: Record<string, HTMLImageElement | null> = {};
  const statics: Record<string, HTMLImageElement | null> = {};
  const clubImages = new Map<string, HTMLImageElement | null>();
  const clubNames = new Set<string>();
  const sponsorImages = new Map<string, HTMLImageElement | null>();
  const sponsorNames = new Set<string>();
  for (const f of template.fields) {
    if (f.type === "club" || f.type === "leagueClub") clubNames.add(values[f.key] ?? "");
    if (f.type === "sponsor") sponsorNames.add(values[f.key] ?? "");
    if (f.type === "list")
      for (const row of lists[f.key] ?? [])
        for (const sub of f.fields) if (sub.type === "club") clubNames.add(row[sub.key] ?? "");
  }
  await Promise.all([
    ...template.fields
      .filter((f) => f.type === "image")
      .map(async (f) => {
        images[f.key] = await tryLoad(values[f.key]);
      }),
    ...Object.entries({ ...template.staticImages, ...template.dynamicImages?.(data) }).map(async ([key, src]) => {
      statics[key] = await tryLoad(src);
    }),
    ...[...clubNames].filter(Boolean).map(async (name) => {
      const src = normalizeName(name) === normalizeName(US_NAME) ? US_LOGO : findClub(clubs, name)?.logo;
      clubImages.set(normalizeName(name), await tryLoad(src));
    }),
    ...[...sponsorNames].filter(Boolean).map(async (name) => {
      sponsorImages.set(normalizeName(name), await tryLoad(findClub(sponsors, name)?.logo));
    }),
  ]);
  const mainSponsors: SponsorMark[] = template.mainSponsors
    ? await Promise.all(
        sponsors
          .filter((s) => s.tier === "main" && s.published !== false)
          .map(async (s) => ({ name: s.name, logo: await tryLoad(s.logo) })),
      )
    : [];
  const clubLogo = (name: string) => clubImages.get(normalizeName(name)) ?? null;
  const sponsorLogo = (name: string) => sponsorImages.get(normalizeName(name)) ?? null;

  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Tarayıcınız görsel oluşturmayı desteklemiyor.");
  ctx.save();
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  // JPEG'de saydamlık olmadığı için zemin her zaman doldurulur
  ctx.fillStyle = BRAND.night;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  template.draw(ctx, data, { logo, logoWhite, images, statics, clubLogo, sponsorLogo, mainSponsors });
  ctx.restore();
};

export const canvasToJpeg = (canvas: HTMLCanvasElement) =>
  new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Görsel oluşturulamadı, lütfen tekrar deneyin."))),
      "image/jpeg",
      JPEG_QUALITY,
    ),
  );
