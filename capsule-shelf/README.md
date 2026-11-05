# Capsule Shelf

Capsule Shelf is a small, static web app for tracking a personal Nespresso Original capsule collection. Keep an eye on stock, mark favorite coffees, set a low-stock threshold for each variety, and save tasting notes and recipe ideas.

**Live app:** [utkin-vitaliy.github.io/projects/capsule-shelf](https://utkin-vitaliy.github.io/projects/capsule-shelf/)

## Features

- Browse a manually maintained catalog of Nespresso Original varieties sold in Canada.
- Track capsule quantities, favorites, and per-variety restock thresholds.
- Search capsule names and tasting profiles in English, Russian, or French.
- Add personal ratings, tasting notes, recipe ideas, and notes about which drinks a variety suits.
- Browse 67 Original-compatible recipes, search across translated names and capsule names, filter by hot or cold drinks, and save favorite recipes.
- Switch between English, Russian, and French. The app uses the browser's preferred language on the first visit.
- Export all settings as one JSON backup and import them on another browser or device.
- Optionally sync settings between devices using a private JSON file in the connected user's Google Drive app data.

## Run locally

Requirements: Node.js 22 or a compatible current LTS release, and npm.

```bash
npm ci
npm run dev
```

Vite prints a local URL, usually `http://localhost:5173/`. To create and preview a production build:

```bash
npm run build
npm run preview
```

Run the automated tests with:

```bash
npm test -- --run
```

## Your settings and privacy

Capsule quantities, capsule favorites, restock thresholds, capsule notes, recipe favorites, and language preference are stored in the browser. The app remains static and has no application server or database. If you connect Google Drive, the app requests a short-lived Google access token in the current page and reads or writes one `capsule-shelf-settings.json` file in Google's hidden `appDataFolder`. The token is kept in memory and is not saved. Local settings remain available if Drive is disconnected or unavailable. When copies differ, the app asks which copy to use and preserves the unselected copy.

Use **Download settings** to save a JSON backup. It includes inventory, notes, favorites, and language. Use **Upload settings** to restore that backup elsewhere. Importing replaces settings in the current browser after confirmation. Keep backup files private: they may contain personal notes and inventory details.

### Configure Google Drive sync

1. In Google Cloud Console, create a project, enable the Google Drive API, and create an OAuth client ID for a Web application.
2. Add the app origins to the OAuth client's authorized JavaScript origins: `http://localhost:5173`, `http://localhost:5175`, `http://localhost:5177`, and `https://utkin-vitaliy.github.io` for GitHub Pages. Local development uses port `5177`; Vite is configured to fail if that port is occupied instead of silently switching to an unauthorized one. Do not create or expose a client secret for this browser-only app.
3. In the GitHub repository settings, add the Actions variable `VITE_GOOGLE_CLIENT_ID` with the OAuth client ID. The Pages workflow injects it at build time.
4. For local use, copy `.env.example` to `.env.local`, add the client ID, and restart Vite. Do not commit `.env.local`.

Apple/iCloud sync is not included in this version.

## Catalog and images

The catalog is a manually maintained snapshot of 40 Nespresso Original varieties from the [Nespresso Canada Original catalog](https://www.nespresso.com/ca/en/order/capsules/original). Product availability can change; the app does not automatically sync with Nespresso.

Capsule and recipe card photographs are bundled locally under [`public/images`](public/images/README.md), so the deployed site does not depend on Nespresso's image servers at runtime. Eleven additional recipe-book photographs are included under [`public/recipe-book`](public/recipe-book/README.md). Their original sources and attribution notes are documented alongside the assets. Product names, images, and trademarks belong to their respective owners.

Capsule Shelf is an independent personal project and is not affiliated with, endorsed by, or sponsored by Nestlé Nespresso S.A.

## GitHub Pages deployment

In the `utkin-vitaliy/projects` repository, the app lives in `capsule-shelf/`. The [Pages workflow](https://github.com/utkin-vitaliy/projects/blob/main/.github/workflows/pages.yml) runs tests, builds the app from that directory, and publishes the static output under `/projects/capsule-shelf/`. A push to `main` or a manual run from GitHub Actions starts deployment. The same workflow generates the static-project index at `/projects/`.

The app uses the repository Pages base path during the workflow build. For a local production build, Vite uses its default root path.
