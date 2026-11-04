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
- Export settings as a JSON backup and import them on another browser or device.

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

Capsule quantities, capsule favorites, restock thresholds, and capsule notes are stored in `localStorage` in the current browser. Recipe favorites are also stored locally, in a separate browser key. The app has no account system, database, or application server; settings do not sync between browsers or devices automatically. The JSON backup includes capsule inventory and notes; recipe favorites and language preference are not included.

Use **Download settings** to save a JSON backup. Use **Upload settings** to restore that backup elsewhere. Importing replaces the settings in the current browser after confirmation. Keep backup files private: they may contain personal notes and inventory details.

## Catalog and images

The catalog is a manually maintained snapshot of 40 Nespresso Original varieties from the [Nespresso Canada Original catalog](https://www.nespresso.com/ca/en/order/capsules/original). Product availability can change; the app does not automatically sync with Nespresso.

Capsule and recipe card photographs are bundled locally under [`public/images`](public/images/README.md), so the deployed site does not depend on Nespresso's image servers at runtime. Eleven additional recipe-book photographs are included under [`public/recipe-book`](public/recipe-book/README.md). Their original sources and attribution notes are documented alongside the assets. Product names, images, and trademarks belong to their respective owners.

Capsule Shelf is an independent personal project and is not affiliated with, endorsed by, or sponsored by Nestlé Nespresso S.A.

## GitHub Pages deployment

In the `utkin-vitaliy/projects` repository, the app lives in `capsule-shelf/`. The [Pages workflow](https://github.com/utkin-vitaliy/projects/blob/main/.github/workflows/pages.yml) runs tests, builds the app from that directory, and publishes the static output under `/projects/capsule-shelf/`. A push to `main` or a manual run from GitHub Actions starts deployment. The same workflow generates the static-project index at `/projects/`.

The app uses the repository Pages base path during the workflow build. For a local production build, Vite uses its default root path.
