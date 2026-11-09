# Offday — Canada holiday calendar

Offday is a static, mobile-friendly calendar that helps people find the next listed holiday for their work region and employment category. It includes English, French, and Russian, a one-time approximate region suggestion, and official source links.

## Run locally

From this folder:

```sh
python3 -m http.server 5176
```

Open <http://localhost:5176/>. The project uses native browser modules and does not need a build step or runtime server beyond static file hosting.

Run the data checks with Node.js 22 or newer:

```sh
npm test
```

## Calendar types

The selected province or territory and calendar type are independent settings. Offday has four separate calendars:

1. **Regional employment standards** — public, statutory, or general holidays under the selected region’s employment standards.
2. **Federal employment standards** — general holidays for federally regulated workplaces under the Canada Labour Code.
3. **Regional public service** — the central government service calendar, policy, or published office-closure schedule for the selected region.
4. **Federal public service** — designated federal public-service holidays.

All 13 provinces and territories are included. Static dates cover November–December 2026 and 2027. The year range is updated manually after checking official sources.

## How to read the dates

The calendar is a planning reference, not a promise from an employer. A listed holiday does not establish an individual employee’s eligibility, paid leave, shift schedule, observed date, or employer closure. Those can depend on the applicable law, work schedule, employee group, department, collective agreement, and employer policy.

The federal public service may also designate a provincial or civic holiday based on the employee’s work locality and collective agreement. Offday does not guess that date from the province alone, so it is excluded until the work locality and applicable agreement are known. In Québec employment standards, the employer chooses Good Friday or Easter Monday; neither appears as a confirmed date in the list.

Regional public-service calendars refer to the central provincial or territorial government source listed below. They do not claim to cover every municipality, school, hospital, agency, public corporation, or bargaining group. Only fixed dates published by the cited government source are listed. Local/civic dates without a universally confirmed date, floating days, and partial-day closures are excluded. Published observed dates remain labeled. The app does not guess substitute days from a generic weekend rule.

Québec employment standards require an employer-selected day: Good Friday or Easter Monday. Because the province-level selector cannot determine that workplace choice, neither date is presented as a confirmed next day off. Québec public service follows its separate published government calendar.

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
