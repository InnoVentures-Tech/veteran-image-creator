import { parseNames } from "./engine";

// Karabük Akademi Veteranlar 2026-2027 kadrosu (kadro afişinden). İlk 11 ve Kamp Kadrosu oyuncuları buradan seçilir;
// İlk 11'de forma numaraları (JSON), Kamp Kadrosu'nda adlar saklanır; numara, ad ve kaleci bilgisi buradan gelir. Kadro değişince yalnızca bu liste güncellenir.

export interface VeteranPlayer {
  numara: string;
  ad: string;
  kaleci?: boolean;
  /** Gençler: ilk 11'de en fazla MAX_YOUTH_STARTERS tanesi oynar, yedekte sınır yok */
  genc?: boolean;
}

export const ROSTER: VeteranPlayer[] = [
  { numara: "1", ad: "C.Berkay", kaleci: true },
  { numara: "2", ad: "Sadık" },
  { numara: "3", ad: "Ahmet" },
  { numara: "4", ad: "Ümit" },
  { numara: "6", ad: "Hüseyin" },
  { numara: "7", ad: "Emrullah" },
  { numara: "8", ad: "İlker" },
  { numara: "9", ad: "Bayram" },
  { numara: "10", ad: "Mustafa" },
  { numara: "11", ad: "Abdurrahim" },
  { numara: "12", ad: "Namjo", kaleci: true },
  { numara: "14", ad: "Sercan" },
  { numara: "18", ad: "Aydın", genc: true },
  { numara: "19", ad: "Murat Y." },
  { numara: "20", ad: "Sinan" },
  { numara: "21", ad: "Ramazan Ç." },
  { numara: "23", ad: "Ramazan Y." },
  { numara: "24", ad: "Emre", kaleci: true },
  { numara: "25", ad: "Ali Topçu" },
  { numara: "27", ad: "Okan" },
  { numara: "33", ad: "Ali Türk" },
  { numara: "34", ad: "Murat L.", kaleci: true },
  { numara: "35", ad: "Alper" },
  { numara: "41", ad: "Emrah", kaleci: true },
  { numara: "53", ad: "Şahin" },
  { numara: "54", ad: "Serhan" },
  { numara: "61", ad: "Caner" },
  { numara: "65", ad: "Etem" },
  { numara: "67", ad: "Uğur", genc: true },
  { numara: "77", ad: "Ersan" },
  { numara: "78", ad: "Mehmet Ali" },
  { numara: "83", ad: "Yüksel" },
  { numara: "89", ad: "Şafak", genc: true },
  { numara: "99", ad: "Öner" },
];

export const findPlayer = (numara: string | undefined) => ROSTER.find((p) => p.numara === (numara ?? "").trim());

/** Çoklu seçim (players alanı) seçenekleri: ad saklanır, listede forma numarasıyla görünür; forma numarası sırasıyla */
export const PLAYER_CHOICES = ROSTER.map((p) => ({ value: p.ad, label: `${p.numara} - ${p.ad}` }));

/** Çoklu seçimin değerindeki (satır satır adlar) oyuncular; kadroda olmayan adlar atlanır */
export const playersByName = (value: string | undefined) =>
  parseNames(value).flatMap((name) => {
    const player = ROSTER.find((p) => p.ad === name);
    return player ? [player] : [];
  });

/** İlk 11 düzenleyicisinin değeri: kadro numaraları (oyuncu kimliği), kaptanın kadro numarası ve elle değiştirilen forma numaraları */
export interface VeteranLineup {
  starters: string[];
  subs: string[];
  captain: string;
  /** Kadro numarası -> bu maçta giydiği forma numarası (kadrodakiyle aynıysa tutulmaz) */
  numbers: Record<string, string>;
}

export const MAX_STARTERS = 11;
/** İlk 11'de oynayabilecek en fazla genç oyuncu */
export const MAX_YOUTH_STARTERS = 2;
/** Görseldeki yedekler alanına sığan en fazla yedek */
export const MAX_SUBS = 12;

export const parseLineup = (value: string | undefined): VeteranLineup => {
  try {
    const parsed = JSON.parse(value || "{}") as Partial<VeteranLineup>;
    const list = (v: unknown) => (Array.isArray(v) ? v.map(String) : []);
    const numbers = Object.fromEntries(
      Object.entries(parsed.numbers && typeof parsed.numbers === "object" ? parsed.numbers : {}).map(([k, n]) => [k, String(n)]),
    );
    return { starters: list(parsed.starters), subs: list(parsed.subs), captain: String(parsed.captain ?? ""), numbers };
  } catch {
    return { starters: [], subs: [], captain: "", numbers: {} };
  }
};

/** Oyuncunun bu maçtaki forma numarası: elle girilmişse o, yoksa kadrodaki */
export const shirtNumber = (player: VeteranPlayer, numbers: Record<string, string> = {}) =>
  numbers[player.numara]?.trim() || player.numara;

export const serializeLineup = (lineup: VeteranLineup) => JSON.stringify(lineup);

/**
 * Numaralardaki kadro oyuncuları: kaleci önce, sonra (elle girilenler dahil) forma numarasına göre;
 * kadroda olmayanlar atlanır
 */
export const orderedPlayers = (ids: string[], numbers: Record<string, string> = {}) =>
  ids
    .flatMap((n) => {
      const player = findPlayer(n);
      return player ? [player] : [];
    })
    .sort(
      (a, b) =>
        Number(!!b.kaleci) - Number(!!a.kaleci) ||
        Number(shirtNumber(a, numbers)) - Number(shirtNumber(b, numbers)),
    );

export interface RuleCheck {
  label: string;
  ok: boolean;
  detail: string;
}

/** İlk 11'in kurallara göre durumu (düzenleyicide gösterilir, ilk sağlanmayan kural indirmeyi durdurur) */
export const checkLineup = (lineup: VeteranLineup): RuleCheck[] => {
  const starters = orderedPlayers(lineup.starters);
  const subs = orderedPlayers(lineup.subs);
  const shirts = starters.map((p) => shirtNumber(p, lineup.numbers));
  const dupes = [...new Set(shirts.filter((n, i) => shirts.indexOf(n) !== i))];
  const keepers = starters.filter((p) => p.kaleci).length;
  const youth = starters.filter((p) => p.genc);
  const hasCaptain = starters.some((p) => p.numara === lineup.captain);
  return [
    { label: "İlk 11 tamam", ok: starters.length === MAX_STARTERS, detail: `${starters.length}/${MAX_STARTERS} oyuncu` },
    {
      label: "İlk 11'de bir kaleci",
      ok: keepers === 1,
      detail: keepers === 1 ? "1 kaleci" : keepers === 0 ? "Kaleci seçilmedi" : `${keepers} kaleci var`,
    },
    {
      label: `İlk 11'de en fazla ${MAX_YOUTH_STARTERS} genç`,
      ok: youth.length <= MAX_YOUTH_STARTERS,
      detail: youth.length ? `${youth.length} genç (${youth.map((p) => p.ad).join(", ")})` : "Genç yok",
    },
    {
      label: "Forma numaraları farklı",
      ok: !dupes.length,
      detail: dupes.length ? `Aynı numara: ${dupes.join(", ")}` : "Her oyuncunun numarası farklı",
    },
    { label: "Kaptan seçildi", ok: hasCaptain, detail: hasCaptain ? "İlk 11'den" : "İlk 11'den bir kaptan seçin" },
    { label: `Yedekler en fazla ${MAX_SUBS} kişi`, ok: subs.length <= MAX_SUBS, detail: `${subs.length}/${MAX_SUBS} oyuncu` },
  ];
};
