# Veteran Görsel Oluşturucu

Karabük Akademi Veteranlar için sosyal medya görselleri (1600×2000 JPEG): **İlk 11**, **Kamp Kadrosu**, **Maç Günü**, **Maç Sonucu**.
Her şey tarayıcıda çizilir; yüklenen fotoğraflar hiçbir sunucuya gönderilmez.

## Geliştirme

```bash
npm install
npm run dev
```

## Yapı

- `src/studio/engine.ts`: çizim altyapısı ve şablon/alan tipleri
- `src/studio/veteran-*.ts`: şablonlar; yeni şablon `src/templates.ts` listesine eklenir
- `src/studio/veteran-kadro.ts`: takım kadrosu (forma numarası, ad, kaleci); kadro değişince yalnızca burası güncellenir
- `src/studio/veteran-logos.ts`: rakip takımlar ve logoları
- `public/images/`: arka planlar ve çerçeveler; takım logoları `public/images/logos/` altında renkli (`<takım>.webp`) ve beyaz (`<takım>-beyaz.webp`)

## Yayın

`main` dalına yapılan her push, GitHub Actions ile GitHub Pages'e yayınlanır (`.github/workflows/deploy.yml`).
