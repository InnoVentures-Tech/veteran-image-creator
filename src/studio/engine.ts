// Görsel oluşturucu çizim altyapısı: şablonlar 1600x2000 bir canvas'a çizilir ve JPEG olarak indirilir.
// Yeni şablon eklemek için src/templates.ts'e bir ImageTemplate nesnesi eklemek yeterlidir.

export const CANVAS_WIDTH = 1600;
export const CANVAS_HEIGHT = 2000;
export const JPEG_QUALITY = 0.92;

export const FONTS = {
  display: '"Bebas Neue", "Arial Narrow", sans-serif',
};

export type ScalarField =
  | { key: string; label: string; type: "text"; default: string; placeholder?: string; maxLength?: number }
  | { key: string; label: string; type: "textarea"; default: string; placeholder?: string; maxLength?: number }
  | { key: string; label: string; type: "select"; default: string; options: { value: string; label: string }[] }
  /** Seçenekler radyo düğmesi olarak yan yana gösterilir (az seçenekli, sık değişen alanlar için) */
  | { key: string; label: string; type: "radio"; default: string; options: { value: string; label: string }[] }
  /** Kullanıcının bilgisayarından seçtiği görsel (data URL olarak tutulur, sunucuya gönderilmez) */
  | { key: string; label: string; type: "image"; hint?: string }
  /**
   * Checkbox listesinden çoklu oyuncu seçimi; değer alfabetik sıralı, satır satır value'lardır.
   * label listede görünen metindir ("21 - Ramazan Ç."); seçilenler options sırasıyla gösterilir.
   */
  | {
      key: string;
      label: string;
      type: "players";
      default: string;
      hint?: string;
      options: { value: string; label: string }[];
    }
  /** İlk 11, yedekler ve kaptan (JSON, bkz. veteran-kadro.ts); kadrodan seçilir */
  | { key: string; label: string; type: "veteranLineup"; default: string };

/** "players" alanının değerini alfabetik sıralı listeye çevirir */
export const parseNames = (value: string | undefined) =>
  (value ?? "")
    .split("\n")
    .map((name) => name.trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "tr"));

/** Tekrarlanabilir satırlar (örn. gol atanlar) */
export interface ListField {
  key: string;
  label: string;
  type: "list";
  /** Satır başlığı: "Gol" -> "+ Gol ekle" */
  itemLabel: string;
  min: number;
  max: number;
  fields: Exclude<ScalarField, { type: "image" | "players" | "veteranLineup" }>[];
  defaultItems: Row[];
}

export type TemplateField = ScalarField | ListField;

export type Row = Record<string, string>;
export type TemplateValues = Row;

export interface TemplateData {
  values: TemplateValues;
  lists: Record<string, Row[]>;
}

export interface TemplateAssets {
  /** image alanlarının yüklenmiş görselleri (boşsa null) */
  images: Record<string, HTMLImageElement | null>;
  /** Şablonun sabit ve veriye göre değişen görselleri (staticImages, dynamicImages) */
  statics: Record<string, HTMLImageElement | null>;
}

export interface ImageTemplate {
  id: string;
  name: string;
  description: string;
  fields: TemplateField[];
  /** Şablonla gelen sabit görseller (ad -> adres), çizimden önce yüklenir */
  staticImages?: Record<string, string>;
  /** Veriye göre değişen görseller (ad -> adres; örn. arka plan, takım logoları), statics'e yüklenir */
  dynamicImages?: (data: TemplateData) => Record<string, string>;
  /** Yalnızca bu şablonun kullandığı fontlar: Google Fonts CSS adresi ve çizimden önce yüklenecek yüzler */
  fonts?: { stylesheet: string; faces: string[] };
  /** İndirilen dosyanın adına eklenecek kısa etiket (örn. hafta) */
  fileLabel?: (data: TemplateData) => string;
  /** Formda yan yana (tek satırda) gösterilecek alan grupları; grup ilk alanın yerinde çizilir */
  inlineRows?: string[][];
  /** İndirmeden önce kontrol: sorun varsa kullanıcıya gösterilecek mesaj, yoksa null */
  validate?: (data: TemplateData) => string | null;
  draw: (ctx: CanvasRenderingContext2D, data: TemplateData, assets: TemplateAssets) => void;
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

const imageCache = new Map<string, Promise<HTMLImageElement>>();

export const loadImage = (src: string) => {
  let pending = imageCache.get(src);
  if (!pending) {
    pending = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => resolve(img);
      img.onerror = () => {
        imageCache.delete(src);
        reject(new Error("Görsel yüklenemedi"));
      };
      // Site alt klasörde (GitHub Pages) yayınlandığı için kök adresli görseller sitenin adresine göre çözülür
      img.src = src.startsWith("/") ? import.meta.env.BASE_URL + src.slice(1) : src;
    });
    imageCache.set(src, pending);
  }
  return pending;
};

// Canvas, font yüklenmeden çizerse yedek fonta düşer; Türkçe harflerin bulunduğu alt kümeler de yüklenir.
let fontsReady: Promise<unknown> | null = null;
const ensureFonts = () => {
  fontsReady ??= document.fonts.load(`400 100px ${FONTS.display}`, "AaĞğÜüŞşİıÖöÇç0123456789").catch(() => undefined);
  return fontsReady;
};

// Şablona özel fontlar yalnızca o şablon çizilirken eklenir.
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

export const upper = (text: string) => text.toLocaleUpperCase("tr-TR");

// Büyük harf yüksekliği / punto oranı fonta bağlıdır; "H" ölçülerek bulunur.
export const sizeForCap = (ctx: CanvasRenderingContext2D, fontAt: (size: number) => string, cap: number) => {
  ctx.font = fontAt(100);
  const ascent = ctx.measureText("H").actualBoundingBoxAscent || 72;
  return (cap / ascent) * 100;
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

export const renderTemplate = async (canvas: HTMLCanvasElement, template: ImageTemplate, data: TemplateData) => {
  await Promise.all([ensureFonts(), ensureTemplateFonts(template.fonts)]);
  const tryLoad = (src: string | null | undefined) => (src ? loadImage(src).catch(() => null) : Promise.resolve(null));

  const images: Record<string, HTMLImageElement | null> = {};
  const statics: Record<string, HTMLImageElement | null> = {};
  await Promise.all([
    ...template.fields
      .filter((f) => f.type === "image")
      .map(async (f) => {
        images[f.key] = await tryLoad(data.values[f.key]);
      }),
    ...Object.entries({ ...template.staticImages, ...template.dynamicImages?.(data) }).map(async ([key, src]) => {
      statics[key] = await tryLoad(src);
    }),
  ]);

  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Tarayıcınız görsel oluşturmayı desteklemiyor.");
  ctx.save();
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  // JPEG'de saydamlık olmadığı için zemin her zaman doldurulur
  ctx.fillStyle = "#08122C";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  template.draw(ctx, data, { images, statics });
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
