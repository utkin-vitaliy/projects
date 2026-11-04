# GitHub feedback form design

## Intent

Let Capsule Shelf visitors send a structured product comment from the app footer without adding a backend to the static GitHub Pages site.

## Approaches

- **GitHub Issue Form (selected):** opens a repository-hosted form, keeps feedback trackable, and requires no app server. The repository already has Issues enabled. Posts are public and users need to use GitHub to submit them.
- **GitHub Discussions:** better for community conversation, but Discussions are currently disabled and ideas are harder to track as actionable requests.
- **External form service:** can accept responses outside GitHub, but adds a provider, a separate data store, and privacy/spam decisions.

## Design

- Add a localized footer link for English, Russian, and French that opens the matching GitHub issue form in a new tab.
- Display a short localized notice that the submission opens GitHub and will be public. The form itself warns users not to include private information.
- Each form asks for feedback type, required description, and optional app area and browser/device details. Do not request email or personal inventory data.
- Keep form definitions and chooser configuration in the repository-root `.github/ISSUE_TEMPLATE/` folder, where GitHub expects them.

## Constraints and non-goals

- GitHub Pages remains static: no API tokens, backend, external form provider, anonymous submission, automatic pull request, or wiki workflow.
- The app's existing English/Russian/French locale switch determines which form URL the footer opens.
- Feedback issues are public and tied to the submitter's GitHub account.

## Success criteria

- The footer link has a correct locale-specific issue-form URL and opens externally.
- The public visibility notice is visible and translated for all three locales.
- GitHub recognizes the three localized issue forms from the repository root.
