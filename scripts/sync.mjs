// Safranboluspor panelindeki "Berkay Özel" şablonlarını ve görsellerini bu projeye kopyalar.
// Şablon dosyaları olduğu gibi alınır; yalnızca çizim altyapısı (engine.ts) bu projede çalışacak şekilde yamanır.
//   node scripts/sync.mjs [safranboluspor-frontend klasörü]
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(process.argv[2] ?? join(root, "../safranboluspor-frontend"));
const studio = join(source, "src/pages/admin/image-studio");
const assets = join(source, "public/images/design/berkay-ozel");
if (!existsSync(studio)) throw new Error(`Şablon klasörü bulunamadı: ${studio}`);

const target = join(root, "src/studio");
mkdirSync(target, { recursive: true });

const templates = readdirSync(studio).filter((f) => /^veteran-.*\.ts$/.test(f));
for (const file of readdirSync(target)) if (/^veteran-.*\.ts$/.test(file) && !templates.includes(file)) rmSync(join(target, file));
for (const file of templates) cpSync(join(studio, file), join(target, file));

/** Yamanın uygulanacağı metin bulunamazsa sessizce geçmek yerine durur: engine değişmiş demektir. */
const patch = (text, from, to) => {
  if (!text.includes(from)) throw new Error(`engine.ts yaması uygulanamadı, metin bulunamadı:\n${from}`);
  return text.replace(from, to);
};
let engine = readFileSync(join(studio, "engine.ts"), "utf8");
engine = patch(engine, 'import type { CardOfferI } from "@/types/cardOffer";', "type CardOfferI = Record<string, unknown>;");
// Site alt klasörde (GitHub Pages) yayınlandığı için kök adresli görseller sitenin adresine göre çözülür
engine = patch(engine, "img.src = src;", 'img.src = src.startsWith("/") ? import.meta.env.BASE_URL + src.slice(1) : src;');
// Safranboluspor logoları bu projede yok; veteran şablonları kullanmaz
engine = patch(
  engine,
  'await Promise.all([loadImage(US_LOGO), loadImage("/logos/logo-white.webp")]);',
  'await Promise.all([US_LOGO, "/logos/logo-white.webp"].map((src) => loadImage(src).catch(() => new Image())));',
);
writeFileSync(join(target, "engine.ts"), engine);

// Şablonlar puntoyu büyük harf yüksekliğinden hesaplamak için kamp-kadrosu.ts'teki sizeForCap'i kullanır
const kamp = readFileSync(join(studio, "kamp-kadrosu.ts"), "utf8");
const sizeForCap = kamp.match(/\/\/ Büyük harf yüksekliği[\s\S]*?\n};\n/);
if (!sizeForCap) throw new Error("kamp-kadrosu.ts içinde sizeForCap bulunamadı");
writeFileSync(join(target, "kamp-kadrosu.ts"), sizeForCap[0]);

const publicAssets = join(root, "public/images/design/berkay-ozel");
rmSync(publicAssets, { recursive: true, force: true });
cpSync(assets, publicAssets, { recursive: true });

console.log(`Kopyalandı: ${templates.join(", ")} + engine.ts, kamp-kadrosu.ts (sizeForCap) ve görseller`);
