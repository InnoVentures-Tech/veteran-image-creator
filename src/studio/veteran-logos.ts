// Karabük Akademi Veteranlar şablonlarının ortak takım logoları. Her logonun renkli ve beyaz (tek renk monogram) sürümü
// public/images/design/berkay-ozel/logos/ altındadır: <takım>.webp ve <takım>-beyaz.webp

/** Bizim takım */
export const OUR_TEAM = "karabuk-akademi";

/** Rakip seçenekleri (lig logosu TMVFL listede yok) */
export const OPPONENTS = [
  { value: "5000-evler", label: "5000 Evler" },
  { value: "ataspor", label: "Ataspor" },
  { value: "bartin-cumhuriyet-masterlar", label: "Bartın Cumhuriyet Masterlar" },
  { value: "bartin-sehit-ugurakyer", label: "Bartın Şehit Uğur Akyer" },
  { value: "caycuma-veteranlar", label: "Çaycuma Veteranlar" },
  { value: "karabuk-aydinlikevler", label: "Karabük Aydınlıkevler" },
  { value: "karabuk-yasa-ve-yasat", label: "Karabük Yaşa ve Yaşat" },
  { value: "muzekent", label: "Müzekent" },
  { value: "safran-spor", label: "Safran Spor" },
  { value: "safranbolu-idmanyurdu", label: "Safranbolu İdmanyurdu" },
  { value: "safranbolu-masterlar", label: "Safranbolu Masterlar" },
];

export const LOGO_STYLES = [
  { value: "renkli", label: "Renkli" },
  { value: "beyaz", label: "Beyaz" },
];

export const logoSrc = (team: string, style: string) =>
  `/images/design/berkay-ozel/logos/${team}${style === "beyaz" ? "-beyaz" : ""}.webp`;
