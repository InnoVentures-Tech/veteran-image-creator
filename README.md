# Veteran Image Creator

Social media images (1600×2000 JPEG) for Karabük Akademi Veterans: **Starting XI** (İlk 11), **Camp Squad** (Kamp Kadrosu), **Match Day** (Maç Günü) and **Match Result** (Maç Sonucu).
Everything is drawn in the browser; uploaded photos are never sent to a server.

## Development

```bash
npm install
npm run dev
```

## Structure

- `src/studio/engine.ts`: drawing engine plus template and field types
- `src/studio/veteran-*.ts`: templates; a new template is added to the list in `src/templates.ts`
- `src/studio/veteran-kadro.ts`: team roster (shirt number, name, goalkeeper); when the squad changes, only this file is updated
- `src/studio/veteran-logos.ts`: opponent teams and their logos
- `public/images/`: backgrounds and frames; team logos live in `public/images/logos/` in colour (`<team>.webp`) and white (`<team>-beyaz.webp`) versions

## Deployment

Every push to `main` is published to GitHub Pages by GitHub Actions (`.github/workflows/deploy.yml`).
