# GitHub Feedback Form Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let visitors open a public feedback issue form from the Capsule Shelf footer, localized to the app's current language.

**Architecture:** Keep the app static and link to GitHub's issue creation page with a locale-specific template query parameter. Store three Issue Forms and their chooser configuration at the repository root; add localized footer copy that discloses public posting.

**Tech Stack:** React, TypeScript, Vitest, GitHub Issue Forms (YAML), GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-11-04-github-feedback-form-design.md`

## Global Constraints

- No backend, API token in browser code, or external form provider.
- The English, Russian, and French app locales each open a corresponding issue form.
- The UI and forms disclose that submissions are public; forms do not request email or private inventory data.
- Issue form files live at repository-root `.github/ISSUE_TEMPLATE/`.

## Review Focus

- Each locale maps to the correct GitHub template URL; cover all three in the App test.
- Feedback UI stays understandable on a narrow screen; inspect the local page after implementation.
- Footer links must not expose user data or pass settings in the URL; assert only static template URLs.
- External navigation opens a separate tab and uses `rel="noreferrer"`; assert anchor attributes.
- YAML chooser does not permit blank public issues; validate form file names and YAML syntax.

---

### Task 1: Add localized GitHub feedback link and forms

**Files:**
- Modify: `src/App.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/i18n/locale.tsx`
- Create: `.github/ISSUE_TEMPLATE/config.yml` (repository root)
- Create: `.github/ISSUE_TEMPLATE/feedback-en.yml` (repository root)
- Create: `.github/ISSUE_TEMPLATE/feedback-ru.yml` (repository root)
- Create: `.github/ISSUE_TEMPLATE/feedback-fr.yml` (repository root)

**Interfaces:** The footer consumes the existing `locale` and `t()` values. Link URL is selected by locale: `feedback-en.yml`, `feedback-ru.yml`, or `feedback-fr.yml` on `https://github.com/utkin-vitaliy/projects/issues/new?template=...`.

- [x] **Step 1: Write the failing test**

Add a test that renders the app in Russian and asserts the footer includes the Russian public-feedback notice and an external feedback link with `?template=feedback-ru.yml`, `target="_blank"`, and `rel="noreferrer"`. Add parameterized coverage for English and French template links.

- [x] **Step 2: Run tests to verify they fail**

Run: `npm test -- --run src/App.test.tsx`
Expected: FAIL because the feedback link and translations do not exist yet.

- [x] **Step 3: Implement the localized footer link**

Add `feedbackLink` and `feedbackPrivacy` messages for `en`, `ru`, and `fr`. Render an external footer link using the current locale's template filename and include the translated privacy notice. Keep the destination static and omit user settings from the URL.

- [x] **Step 4: Run the focused test and full suite**

Run: `npm test -- --run src/App.test.tsx`, then `npm test -- --run`.
Expected: focused test and all tests PASS.

- [x] **Step 5: Add GitHub Issue Forms at repository root**

Create `config.yml` with `blank_issues_enabled: false`. Create the three localized forms, each with a required feedback-type dropdown and description, optional app-area and browser/device fields, and a public-posting/privacy warning. Do not request email, passwords, or capsule stock.

- [x] **Step 6: Validate, build, and review locally**

Run: `npm run build`; validate the four YAML files parse successfully; open the app at the local server and inspect the footer in all three locales. Confirm that the external links point to the matching forms.
