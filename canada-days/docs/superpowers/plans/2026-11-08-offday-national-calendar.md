# Offday national calendar implementation plan

1. Move holiday data into a separately testable static data module. Represent all 13 regional employment calendars, all 13 regional public-service calendars, and both federal calendars for November–December 2026 and 2027. Attach official source links and coverage notes.
2. Extend event-name translations to cover regional holiday variants in English, French, and Russian. Preserve the current photography and fallback behavior.
3. Replace the three-tab selector with four accessible tabs. Persist calendar and region independently; calculate the active event list from the selected scope and selected region.
4. Keep geolocation as a one-time region suggestion. Remove the Ontario-only limitations and make region selection available for all 13 jurisdictions.
5. Add Node tests for supported-region coverage, source metadata, chronological dates, unique IDs, correct category separation, and known jurisdiction-specific differences.
6. Update the Offday README with run instructions, calendar scope, data boundaries, sources, and annual review guidance. Update the root README and Pages workflow to publish and list Offday.
7. Run Offday tests, Capsule Shelf tests/build, inspect the Pages artifact paths, and review the final diff. Commit and push the approved static project to `main` so GitHub Pages can deploy it.
