# Offday — Canadian work calendar

Offday is a static, mobile-friendly reference to upcoming dates in Canadian work calendars. It separates regional and federal employment standards from public-service schedules and office-closure sources. It includes English, French, and Russian, a one-time approximate work-region suggestion, and links to official sources.

## Run locally

From this folder:

```sh
python3 -m http.server 5176
```

Open <http://localhost:5176/>. The project uses native browser modules and does not need a build step or runtime server beyond static file hosting.

## Publish

The GitHub Pages workflow at the repository root copies this directory into the Pages artifact at `/projects/canada-days/`. Push changes to `main` to run the deployment workflow. Keep links to scripts, styles, icons, and the manifest relative to this directory so they continue to work below the `/projects/canada-days/` path. The workflow creates a sitemap for the project index and both apps at `/projects/sitemap.xml`; submit that sitemap in Google Search Console if you use it. A sitemap helps crawlers discover URLs but does not guarantee indexing.

The page includes a canonical URL, a concise search description, social preview metadata, and structured WebApplication information. Language controls change text on the same URL, so the page does not advertise separate localized URLs with `hreflang` links.

## Mobile icons and feedback

The app uses `calendar-mark.svg` as its browser favicon and `app-icon.svg` as the source artwork for the Apple touch icon and Android home-screen icons. `manifest.webmanifest` declares Android install metadata and icon sizes. The localized **Leave feedback** link in the footer opens a prefilled GitHub issue form in a new tab; submissions are public.

The published site uses Google Analytics 4 to measure page views and general site interactions. Advertising signals and ad personalization are disabled. Analytics is not loaded on localhost. See the [privacy notice](privacy.html) for details.

Run the data checks with Node.js 22 or newer:

```sh
npm test
```

## Calendar types

The selected province or territory and calendar type are independent settings. Offday has four separate calendars:

1. **Regional employment standards** — dates listed under the selected province or territory’s employment standards.
2. **Federal employment standards** — general holidays for federally regulated workplaces under the Canada Labour Code.
3. **Regional public service** — dates based on the selected region’s cited government policy, published schedule, or office-closure information.
4. **Federal public service** — designated federal public-service holidays.

All 10 provinces and 3 territories are included. Static data covers November and December 2026 and all of 2027. The year range is updated manually after checking official sources.

## How to read the dates

The calendar is a planning reference, not a personal work schedule or a promise from an employer. A listed date does not establish an individual employee’s eligibility, paid leave, shift schedule, observed date, or workplace closure. Those can depend on applicable law, work location, schedule, employee group, department, collective agreement, and employer policy.

The federal public service may also designate a provincial or civic holiday based on the employee’s work locality and collective agreement. Offday does not infer that date from the province alone, so it is excluded until the work locality and applicable agreement are known. In Québec employment standards, the employer chooses Good Friday or Easter Monday; neither appears as a confirmed date in the list.

Regional public-service calendars follow the specific provincial or territorial policy, published schedule, or office-closure source listed below. They are not a universal entitlement calendar for every public servant and do not cover every municipality, school, hospital, agency, public corporation, or bargaining group. Dates are listed only when supported by the cited source; some are rule-derived or published as observed dates. Local or civic dates without a defensible region-level date, floating days, and partial-day closures are excluded. The app does not guess substitute days from a generic weekend rule.

Québec employment standards require an employer-selected day: Good Friday or Easter Monday. Because the province-level selector cannot determine that workplace choice, neither date is presented as a confirmed date for an individual employee. Québec public service follows its separate published government calendar.

The region selector is the work region. Geolocation is only a one-time suggestion: confirm the region manually. Coarse local bounds can overlap, and coordinates are not saved or sent to a geocoding service.

## Official sources

### Regional employment standards

- [British Columbia](https://www2.gov.bc.ca/gov/content/employment-business/employment-standards-advice/employment-standards/statutory-holidays)
- [Alberta](https://www.alberta.ca/alberta-general-holidays)
- [Saskatchewan](https://www.saskatchewan.ca/business/employment-standards/public-statutory-holidays/list-of-saskatchewan-public-holidays)
- [Manitoba](https://www.gov.mb.ca/labour/standards/print,doc,quick_guide,factsheet.html)
- [Ontario](https://www.ontario.ca/document/your-guide-employment-standards-act-0/public-holidays)
- [Quebec](https://www.cnesst.gouv.qc.ca/en/working-conditions/leave/statutory-holidays/statutory-holidays)
- [New Brunswick](https://www.gnb.ca/en/topic/jobs-workplaces/labour-market-workforce/employment-standards/holiday-vacation.html)
- [Nova Scotia](https://novascotia.ca/lae/employmentrights/holidaychart.asp)
- [Prince Edward Island](https://www.princeedwardisland.ca/en/information/workforce-and-advanced-learning/paid-holidays)
- [Newfoundland and Labrador](https://www.gov.nl.ca/gs/files/Your-Rights-At-Work.pdf)
- [Yukon](https://yukon.ca/doing-business/employer-responsibilities/find-yukon-statutory-holiday)
- [Northwest Territories](https://www.ece.gov.nt.ca/en/services/employment-standards/frequently-asked-questions)
- [Nunavut](https://www.gov.nu.ca/en/employment-training-and-career-development/labour-and-employment-standards-nunavut)

### Regional public service

- [British Columbia](https://www2.gov.bc.ca/gov/content/careers-myhr/all-employees/leave-time-off/vacations-holidays/statutory-holidays)
- [Alberta](https://www.alberta.ca/paid-holidays-directive)
- [Saskatchewan](https://taskroom.saskatchewan.ca/employee-resources/709-designated-holidays)
- [Manitoba — Public Service Regulation](https://web2.gov.mb.ca/laws/regs/current/011-2022.php)
- [Ontario](https://www.ontario.ca/laws/regulation/900977)
- [Quebec](https://www.quebec.ca/gouvernement/travailler-gouvernement/remuneration-avantages-sociaux/conditions-travail/jours-feries)
- [New Brunswick](https://www2.gnb.ca/content/gnb/en/departments/finance/human_resources/content/policies_and_guidelines/leave_policies/statutory_public_holidays.html)
- [Nova Scotia](https://novascotia.ca/just/regulations/regs/csgen.htm)
- [Prince Edward Island](https://www.princeedwardisland.ca/en/information/public-service-commission/office-hours)
- [Newfoundland and Labrador — 2026](https://www.gov.nl.ca/exec/tbs/2026-paid-holidays-2/) · [2027](https://www.gov.nl.ca/exec/tbs/2027-paid-holidays/)
- [Yukon](https://yukon.ca/en/collective-agreements-hr-policies)
- [Northwest Territories](https://my.hr.gov.nt.ca/employees/leave-time/statutory-holidays)
- [Nunavut](https://www.gov.nu.ca/en/staff-resources/public-service-holidays)

### Federal

- [Federally regulated workplaces](https://www.canada.ca/en/services/jobs/workplace/federal-labour-standards/vacations-holidays.html)
- [Federal public service](https://www.canada.ca/en/public-services-procurement/services/pay-pension/pay-administration/access-update-pay-details/pay-changes-in-your-life/taking-leave/statutory-holiday-pay.html)

## Images

Holiday photos are hosted by Unsplash and link to the photographer’s page. The photographer credit appears on the image. Each photo page identifies the photographer and states the photo is available under the [Unsplash License](https://unsplash.com/license).

## Updating the calendar

Each fall, review the applicable law, central government policy, and any published date tables for the next calendar year. Keep the four calendar scopes separate, note the exact coverage of each source, and verify all weekend/observed dates individually. Update `calendar-data.js`, this README, and the displayed source review date together. Run `npm test` and check the site at phone and desktop widths before publishing.
