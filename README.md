# Veteran Görsel Oluşturucu

Karabük Akademi Veteranlar için sosyal medya görselleri (1600×2000 JPEG): **İlk 11**, **Kamp Kadrosu**, **Maç Günü**.
Her şey tarayıcıda çizilir; yüklenen fotoğraf ve logolar hiçbir sunucuya gönderilmez.

## Geliştirme

```bash
npm install
npm run dev
```

## Şablonları güncelleme

Şablonlar Safranboluspor panelindeki "Berkay Özel" grubundan gelir. `src/studio/` ve
`public/images/design/berkay-ozel/` elle düzenlenmez; panelde yapılan değişiklikler şu komutla alınır:

```bash
npm run sync            # varsayılan: ../safranboluspor-frontend
npm run sync -- /yol/safranboluspor-frontend
```

Yeni bir şablon eklendiyse `src/templates.ts` listesine de eklenir.

## Yayın

`main` dalına yapılan her push, GitHub Actions ile GitHub Pages'e yayınlanır (`.github/workflows/deploy.yml`).
