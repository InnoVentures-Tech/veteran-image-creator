import { parseNames, type Row } from "./engine";

// Karabük Akademi Veteranlar 2026-2027 kadrosu (kadro afişinden). İlk 11 ve Kamp Kadrosu oyuncuları buradan seçilir;
// İlk 11'de forma numarası, Kamp Kadrosu'nda ad saklanır; numara, ad ve kaleci bilgisi buradan gelir. Kadro değişince yalnızca bu liste güncellenir.

export interface VeteranPlayer {
  numara: string;
  ad: string;
  kaleci?: boolean;
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
  { numara: "18", ad: "Aydın" },
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
  { numara: "67", ad: "Uğur" },
  { numara: "77", ad: "Ersan" },
  { numara: "78", ad: "Mehmet Ali" },
  { numara: "83", ad: "Yüksel" },
  { numara: "89", ad: "Şafak" },
  { numara: "99", ad: "Öner" },
];

export const findPlayer = (numara: string | undefined) => ROSTER.find((p) => p.numara === (numara ?? "").trim());

/** Açılır liste seçenekleri: "21 - Ramazan Ç.", kaleciler "(Kaleci)" ile */
export const PLAYER_OPTIONS = [
  { value: "", label: "Oyuncu seçin" },
  ...ROSTER.map((p) => ({ value: p.numara, label: `${p.numara} - ${p.ad}${p.kaleci ? " (Kaleci)" : ""}` })),
];

/** Çoklu seçim (players alanı) seçenekleri: ad saklanır, listede forma numarasıyla görünür; forma numarası sırasıyla */
export const PLAYER_CHOICES = ROSTER.map((p) => ({ value: p.ad, label: `${p.numara} - ${p.ad}` }));

/** Çoklu seçimin değerindeki (satır satır adlar) oyuncular; kadroda olmayan adlar atlanır */
export const playersByName = (value: string | undefined) =>
  parseNames(value).flatMap((name) => {
    const player = ROSTER.find((p) => p.ad === name);
    return player ? [player] : [];
  });

/** Liste satırlarındaki (numara alanı) seçili oyuncular, satır sırasıyla; boş ve kadroda olmayan satırlar atlanır */
export const pickedPlayers = (rows: Row[] | undefined) =>
  (rows ?? []).flatMap((r) => {
    const player = findPlayer(r.numara);
    return player ? [player] : [];
  });

/** Birden fazla seçilen oyuncu varsa uyarı metni, yoksa null */
export const duplicateMessage = (players: VeteranPlayer[]) => {
  const seen = new Set<string>();
  const twice = players.filter((p) => (seen.has(p.numara) ? true : (seen.add(p.numara), false)));
  return twice.length ? `Aynı oyuncu birden fazla seçilmiş: ${[...new Set(twice.map((p) => p.ad))].join(", ")}` : null;
};
