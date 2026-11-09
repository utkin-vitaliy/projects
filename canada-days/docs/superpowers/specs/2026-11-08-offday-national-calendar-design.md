# Offday national calendar design

## Goal

Expand the Offday proof of concept into a static Canadian holiday calendar with verified 2026–2027 entries for all 13 provinces and territories. Preserve the approved visual direction, compact header, language switch (English, French, Russian), approximate location suggestion, and large upcoming-date card.

## Calendar modes

The selector has four separate tabs:

1. **Regional employment standards** — minimum public/statutory/general holidays for the selected province or territory.
2. **Federal employment standards** — Canada Labour Code general holidays for federally regulated workplaces.
3. **Regional public service** — the central government service calendar or policy for the selected province or territory.
4. **Federal public service** — designated federal public-service holidays.

The selected work region is stored independently from the selected calendar tab. Changing the region updates the regional employment and regional public-service calendars. The federal employment calendar is Canada-wide. Federal public-service agreements include a designated provincial/civic holiday. Since the selector does not collect a municipality, show a region-level candidate date and clearly tell users to verify the actual locality-specific date with their employer or collective agreement.

## User experience

- Support all provinces and territories: BC, AB, SK, MB, ON, QC, NB, NS, PE, NL, YT, NT, and NU.
- Keep the existing compact region control and location suggestion. Geolocation only suggests a region; the user confirms or chooses their work region manually. Coordinates are not saved or transmitted.
- Retain the current hero card, upcoming holiday list, photo treatment, and EN/FR/RU language controls.
- On mobile, keep all four short tab labels visible in one compact row; show full labels and descriptions to assistive technology and in the tab subtitles on larger screens.
- Persist language, region, and selected calendar locally.
- Show a source link and an applicability note for the active calendar.

## Data and accuracy

- Keep the app fully static: checked dates and sources ship with the project; no runtime API or server is required.
- Keep separate datasets for the four legal/employment scopes. Never infer a public-service calendar by copying the corresponding private-sector list.
- Each regional calendar records its official source, coverage group, and caveat. Public-service sources commonly apply to a defined core civil service, a bargaining group, or office closures, rather than every public-sector worker.
- Store legal/statutory dates separately from dates observed by a named government policy. Do not apply a Canada-wide “weekend means Monday” rule. Where the official source makes the date depend on a work schedule, location, department, or collective agreement, mark that dependency in the event note.
- Dates cover the remainder of 2026 and calendar year 2027. Do not add optional, retail-closing, school, municipal, or local civic days as statutory holidays. Optional/conditional public-service days are included only when the relevant official public-service source supports them and are labeled.
- Include a “planning guide, not an employer guarantee” notice. The app does not calculate eligibility, pay, shift work, substitute days, or employer closures.

## Official source register

| Region | Employment standards | Regional public service |
|---|---|---|
| BC | [BC statutory holidays](https://www2.gov.bc.ca/gov/content/employment-business/employment-standards-advice/employment-standards/statutory-holidays) | [BC Public Service holidays](https://www2.gov.bc.ca/gov/content/careers-myhr/all-employees/leave-time-off/vacations-holidays/statutory-holidays) |
| AB | [Alberta general holidays](https://www.alberta.ca/alberta-general-holidays) | [Alberta paid holidays directive](https://www.alberta.ca/paid-holidays-directive) |
| SK | [Saskatchewan public holidays](https://www.saskatchewan.ca/business/employment-standards/public-statutory-holidays/list-of-saskatchewan-public-holidays) | [PS709 designated holidays](https://taskroom.saskatchewan.ca/employee-resources/709-designated-holidays) |
| MB | [Manitoba general holidays](https://www.gov.mb.ca/labour/standards/print,doc,quick_guide,factsheet.html) | [Manitoba Public Service Regulation](https://web2.gov.mb.ca/laws/regs/current/011-2022.php) |
| ON | [Ontario ESA public holidays](https://www.ontario.ca/document/your-guide-employment-standards-act-0/public-holidays) | [Ontario Regulation 977](https://www.ontario.ca/laws/regulation/900977) |
| QC | [CNESST statutory holidays](https://www.cnesst.gouv.qc.ca/en/working-conditions/leave/statutory-holidays/statutory-holidays) | [Québec public-service holidays](https://www.quebec.ca/gouvernement/travailler-gouvernement/remuneration-avantages-sociaux/conditions-travail/jours-feries) |
| NB | [New Brunswick paid public holidays](https://www.gnb.ca/en/topic/jobs-workplaces/labour-market-workforce/employment-standards/holiday-vacation.html) | [GNB statutory/public holidays policy](https://www2.gnb.ca/content/gnb/en/departments/finance/human_resources/content/policies_and_guidelines/leave_policies/statutory_public_holidays.html) |
| NS | [Nova Scotia holiday chart](https://novascotia.ca/lae/employmentrights/holidaychart.asp) | [Nova Scotia civil-service regulations](https://novascotia.ca/just/regulations/regs/csgen.htm) |
| PE | [PEI paid holidays](https://www.princeedwardisland.ca/en/information/workforce-and-advanced-learning/paid-holidays) | [PEI public-service office closures](https://www.princeedwardisland.ca/en/information/public-service-commission/office-hours) |
| NL | [NL employee rights guide](https://www.gov.nl.ca/gs/files/Your-Rights-At-Work.pdf) | [NL 2026 holiday calendar](https://www.gov.nl.ca/exec/tbs/2026-paid-holidays-2/) · [2027 calendar](https://www.gov.nl.ca/exec/tbs/2027-paid-holidays/) |
| YT | [Yukon statutory holidays](https://yukon.ca/doing-business/employer-responsibilities/find-yukon-statutory-holiday) | [Yukon HR policies and agreements](https://yukon.ca/en/collective-agreements-hr-policies) |
| NT | [NWT Employment Standards FAQ](https://www.ece.gov.nt.ca/en/services/employment-standards/frequently-asked-questions) | [GNWT statutory holidays](https://my.hr.gov.nt.ca/employees/leave-time/statutory-holidays) |
| NU | [Nunavut labour standards](https://www.gov.nu.ca/en/employment-training-and-career-development/labour-and-employment-standards-nunavut) | [Nunavut public-service holidays](https://www.gov.nu.ca/en/staff-resources/public-service-holidays) |

The national tabs use the Government of Canada’s [federally regulated workplace holiday guide](https://www.canada.ca/en/services/jobs/workplace/federal-labour-standards/vacations-holidays.html) and [federal public-service holiday pay guidance](https://www.canada.ca/en/public-services-procurement/services/pay-pension/pay-administration/access-update-pay-details/pay-changes-in-your-life/taking-leave/statutory-holiday-pay.html).

## Risks and limitations

- Public-service terms differ by employee group and collective agreement. A “regional public service” tab is a central reference calendar, not a claim about every school, hospital, municipality, agency, or shift worker.
- Some jurisdictions have no single universal published 2026–2027 public-service date table. Dates derived from a current policy must be identified as policy-derived and linked to that policy; agreement-dependent extras must remain caveated.
- Provincial and federal workers in the same region can have different holiday lists and observance rules.
- Future years require an annual source review. The displayed source review date must be updated with each data refresh.

## Acceptance criteria

- All 13 regions can be selected and persist after refresh.
- Four tabs are available and persist independently of region; changing region updates both regional calendars.
- All displayed 2026–2027 dates are backed by a linked official source and sort chronologically.
- Federal employment, federal public service, regional employment, and regional public service remain distinct datasets.
- Eligibility, schedule-dependent substitution, and public-service coverage caveats are visible and translated.
- The existing visual system remains intact and the four-tab selector remains usable at phone widths.
- The GitHub Pages workflow publishes Offday at `/projects/canada-days/` and adds it to the English root project index.
