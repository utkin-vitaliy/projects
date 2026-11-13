# Capsule Shelf

Capsule Shelf is a static web app for tracking a personal Nespresso Original and Vertuo capsule collection. Manage stock, favorites, restock thresholds, tasting notes, and coffee recipes in English, French, or Russian.

**Live app:** [utkin-vitaliy.github.io/projects/capsule-shelf](https://utkin-vitaliy.github.io/projects/capsule-shelf/)

## Features

- Browse separate Original and Vertuo capsule catalogs, with product links and locally bundled photos.
- Track quantities, favorite varieties, and a low-stock threshold for each capsule.
- Search capsule names and tasting profiles in English, French, or Russian.
- Save capsule ratings, tasting notes, recipe ideas, and notes about suitable or unsuitable drinks.
- Browse recipes for the selected coffee system, search translated recipe and capsule names, filter recipes, and save recipe favorites.
- Edit any recipe in the current language. Changes are saved automatically; reset an edited recipe to its catalog version at any time.
- Switch between English, French, and Russian. The browser language is used on the first visit when supported.
- Export settings to a JSON file and import them on another browser or device.
- Optionally sync settings with one private JSON file in the connected Google account's Drive `appDataFolder`.

## Run locally

Requirements: Node.js 22 and npm.

```bash
npm ci
npm run dev
```

Vite serves the app at [http://localhost:5177/](http://localhost:5177/). The development server uses port 5177 and exits if that port is busy rather than silently switching ports.

Create a production build and preview it locally with:

```bash
npm run build
npm run preview
```

Run the automated test suite with:

```bash
npm test -- --run
```

## Settings, backups, and privacy

Capsule quantities, favorites, thresholds, notes, recipe favorites and edits, selected coffee system, filters, and language are stored in the current browser. The app is static and does not use an application server or database. The published site uses Google Analytics 4 for page views and general site interactions; advertising signals and ad personalization are disabled. See the [privacy notice](https://utkin-vitaliy.github.io/projects/capsule-shelf/privacy.html) for details.

Use **Export** in the footer to download a JSON backup. Use **Import** to restore it in the current browser; importing replaces that browser's settings after confirmation. Backups can include personal notes and inventory information, so keep them private.

Google Drive sync is optional. When connected, the app saves settings in the browser immediately and sends changes to a single `capsule-shelf-settings.json` file in Google Drive's hidden `appDataFolder` after a short pause. The Google access token stays in memory and is not saved. After reloading the page, click the Drive sync control to resume syncing. If the browser and Drive copies differ, Capsule Shelf asks which copy to keep and updates the other one.

### Configure Google Drive sync

1. In Google Cloud Console, create a project, enable the Google Drive API, and create an OAuth client ID for a Web application.
2. Add these authorized JavaScript origins to the OAuth client: `http://localhost:5177` and `https://utkin-vitaliy.github.io`. Origins do not include the `/projects/capsule-shelf/` path. Do not create or expose an OAuth client secret for this browser-only app.
3. In the GitHub repository settings, add an Actions variable named `VITE_GOOGLE_CLIENT_ID` with the OAuth client ID. The Pages workflow injects it at build time.
4. For local development, copy `.env.example` to `.env.local`, set `VITE_GOOGLE_CLIENT_ID`, and restart Vite. Keep `.env.local` out of Git.

Apple/iCloud sync is not included.

## Catalog and images

The catalogs are manually maintained from the [Nespresso Canada Original catalog](https://www.nespresso.com/ca/en/order/capsules/original) and [Vertuo catalog](https://www.nespresso.com/ca/en/order/capsules/vertuo). Product availability can change; Capsule Shelf does not automatically sync catalog updates from Nespresso.

Capsule and recipe photographs are bundled locally under [`public/images`](public/images/README.md), so the deployed app does not depend on Nespresso image servers at runtime. Additional recipe-book photographs are documented under [`public/recipe-book`](public/recipe-book/README.md). Product names, images, and trademarks belong to their respective owners.

Capsule Shelf is an independent personal project and is not affiliated with, endorsed by, or sponsored by Nestlé Nespresso S.A.

## GitHub Pages deployment

The app source lives in `capsule-shelf/` in the [`utkin-vitaliy/projects`](https://github.com/utkin-vitaliy/projects) repository. The [Pages workflow](https://github.com/utkin-vitaliy/projects/blob/main/.github/workflows/pages.yml) runs the tests, builds the app, and publishes it under `/projects/capsule-shelf/`. A push to `main` or a manual workflow run deploys the site. The same workflow creates the project index at `/projects/`.

The workflow sets Vite's Pages base path during deployment. A normal local build uses the root path instead.
