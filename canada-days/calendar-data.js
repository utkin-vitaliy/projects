// Static 2026–2027 holiday dates. Each regional list is tied to its own
// employment-standards or public-service source; it is not a national rule.
const row = (date, name, photo = "winter", noteKey = "") => [date, name, photo, noteKey || undefined];
const late2026 = {
  remembrance: row("2026-11-11", "Remembrance Day", "remembrance"),
  christmas: row("2026-12-25", "Christmas Day", "winter"),
  boxing: row("2026-12-26", "Boxing Day", "winter"),
};

const dates2027 = {
  newYear: row("2027-01-01", "New Year’s Day", "newYear"),
  family: row("2027-02-15", "Family Day", "family"),
  goodFriday: row("2027-03-26", "Good Friday", "spring"),
  easterMonday: row("2027-03-29", "Easter Monday", "spring"),
  easterSunday: row("2027-03-28", "Easter Sunday", "spring"),
  victoria: row("2027-05-24", "Victoria Day", "spring"),
  canada: row("2027-07-01", "Canada Day", "canada"),
  labour: row("2027-09-06", "Labour Day", "picnic"),
  truth: row("2027-09-30", "National Day for Truth and Reconciliation", "reconciliation"),
  thanksgiving: row("2027-10-11", "Thanksgiving", "autumn"),
  remembrance: row("2027-11-11", "Remembrance Day", "remembrance"),
  christmas: row("2027-12-25", "Christmas Day", "winter"),
  christmasMonday: row("2027-12-27", "Christmas Day", "winter", "observedNote"),
  boxing: row("2027-12-26", "Boxing Day", "winter"),
  boxingTuesday: row("2027-12-28", "Boxing Day", "winter", "observedNote"),
};

const source = {
  employment: {
    BC: "https://www2.gov.bc.ca/gov/content/employment-business/employment-standards-advice/employment-standards/statutory-holidays",
    AB: "https://www.alberta.ca/alberta-general-holidays",
    SK: "https://www.saskatchewan.ca/business/employment-standards/public-statutory-holidays/list-of-saskatchewan-public-holidays",
    MB: "https://www.gov.mb.ca/labour/standards/print,doc,quick_guide,factsheet.html",
    ON: "https://www.ontario.ca/document/your-guide-employment-standards-act-0/public-holidays",
    QC: "https://www.cnesst.gouv.qc.ca/en/working-conditions/leave/statutory-holidays/statutory-holidays",
    NB: "https://www.gnb.ca/en/topic/jobs-workplaces/labour-market-workforce/employment-standards/holiday-vacation.html",
    NS: "https://novascotia.ca/lae/employmentrights/holidaychart.asp",
    PE: "https://www.princeedwardisland.ca/en/information/workforce-and-advanced-learning/paid-holidays",
    NL: "https://www.gov.nl.ca/gs/files/Your-Rights-At-Work.pdf",
    YT: "https://yukon.ca/doing-business/employer-responsibilities/find-yukon-statutory-holiday",
    NT: "https://www.ece.gov.nt.ca/en/services/employment-standards/frequently-asked-questions",
    NU: "https://www.gov.nu.ca/en/employment-training-and-career-development/labour-and-employment-standards-nunavut",
  },
  publicService: {
    BC: "https://www2.gov.bc.ca/gov/content/careers-myhr/all-employees/leave-time-off/vacations-holidays/statutory-holidays",
    AB: "https://www.alberta.ca/paid-holidays-directive",
    SK: "https://taskroom.saskatchewan.ca/employee-resources/709-designated-holidays",
    MB: "https://web2.gov.mb.ca/laws/regs/current/011-2022.php",
    ON: "https://www.ontario.ca/laws/regulation/900977",
    QC: "https://www.quebec.ca/gouvernement/travailler-gouvernement/remuneration-avantages-sociaux/conditions-travail/jours-feries",
    NB: "https://www2.gnb.ca/content/gnb/en/departments/finance/human_resources/content/policies_and_guidelines/leave_policies/statutory_public_holidays.html",
    NS: "https://novascotia.ca/just/regulations/regs/csgen.htm",
    PE: "https://www.princeedwardisland.ca/en/information/public-service-commission/office-hours",
    NL: "https://www.gov.nl.ca/exec/tbs/2027-paid-holidays/",
    YT: "https://yukon.ca/en/collective-agreements-hr-policies",
    NT: "https://my.hr.gov.nt.ca/employees/leave-time/statutory-holidays",
    NU: "https://www.gov.nu.ca/en/staff-resources/public-service-holidays",
  },
};

const regionalEmployment = {
  BC: [late2026.remembrance, late2026.christmas, dates2027.newYear, dates2027.family, dates2027.goodFriday, dates2027.victoria, dates2027.canada, row("2027-08-02", "B.C. Day", "summer"), dates2027.labour, dates2027.truth, dates2027.thanksgiving, dates2027.remembrance, dates2027.christmas],
  AB: [late2026.remembrance, late2026.christmas, dates2027.newYear, dates2027.family, dates2027.goodFriday, dates2027.victoria, dates2027.canada, dates2027.labour, dates2027.thanksgiving, dates2027.remembrance, dates2027.christmas],
  SK: [late2026.remembrance, late2026.christmas, dates2027.newYear, dates2027.family, dates2027.goodFriday, dates2027.victoria, dates2027.canada, row("2027-08-02", "Saskatchewan Day", "summer"), dates2027.labour, dates2027.thanksgiving, dates2027.remembrance, dates2027.christmas],
  MB: [late2026.christmas, dates2027.newYear, row("2027-02-15", "Louis Riel Day", "family"), dates2027.goodFriday, dates2027.victoria, dates2027.canada, dates2027.labour, dates2027.truth, dates2027.thanksgiving, dates2027.christmas],
  ON: [late2026.christmas, late2026.boxing, dates2027.newYear, dates2027.family, dates2027.goodFriday, dates2027.victoria, dates2027.canada, dates2027.labour, dates2027.thanksgiving, dates2027.christmas, dates2027.boxing],
  // The employer must choose Good Friday or Easter Monday in Québec; omit the date until that workplace-specific choice is known.
  QC: [late2026.christmas, dates2027.newYear, row("2027-05-24", "National Patriots’ Day", "spring"), row("2027-06-24", "Québec National Holiday", "summer"), dates2027.canada, dates2027.labour, dates2027.thanksgiving, dates2027.christmas],
  NB: [late2026.remembrance, late2026.christmas, dates2027.newYear, dates2027.family, dates2027.goodFriday, dates2027.canada, row("2027-08-02", "New Brunswick Day", "summer"), dates2027.labour, dates2027.remembrance, dates2027.christmas],
  NS: [late2026.christmas, dates2027.newYear, row("2027-02-15", "Nova Scotia Heritage Day", "family"), dates2027.goodFriday, dates2027.canada, dates2027.labour, dates2027.christmas],
  PE: [late2026.remembrance, late2026.christmas, dates2027.newYear, row("2027-02-15", "Islander Day", "family"), dates2027.goodFriday, dates2027.canada, dates2027.labour, dates2027.truth, dates2027.remembrance, dates2027.christmas],
  NL: [late2026.remembrance, late2026.christmas, dates2027.newYear, dates2027.goodFriday, dates2027.canada, dates2027.labour, dates2027.remembrance, dates2027.christmas],
  YT: [late2026.remembrance, late2026.christmas, dates2027.newYear, dates2027.goodFriday, dates2027.victoria, row("2027-06-21", "National Indigenous Peoples Day", "summer"), dates2027.canada, row("2027-08-16", "Discovery Day", "summer"), dates2027.labour, dates2027.truth, dates2027.thanksgiving, dates2027.remembrance, dates2027.christmas],
  NT: [late2026.remembrance, late2026.christmas, dates2027.newYear, dates2027.goodFriday, dates2027.victoria, row("2027-06-21", "National Indigenous Peoples Day", "summer"), dates2027.canada, row("2027-08-02", "Civic Holiday", "summer"), dates2027.labour, dates2027.truth, dates2027.thanksgiving, dates2027.remembrance, dates2027.christmas],
  NU: [late2026.remembrance, late2026.christmas, dates2027.newYear, dates2027.goodFriday, dates2027.victoria, dates2027.canada, row("2027-07-09", "Nunavut Day", "summer"), row("2027-08-02", "Civic Holiday", "summer"), dates2027.labour, dates2027.truth, dates2027.thanksgiving, dates2027.remembrance, dates2027.christmas],
};

// Regional government service calendars follow the cited central policy or
// published schedule. The UI also states where collective agreements or local
// schedules can differ; these are not calendars for all public-sector workers.
const regionalPublicService = {
  BC: [late2026.remembrance, late2026.christmas, late2026.boxing, dates2027.newYear, dates2027.family, dates2027.goodFriday, dates2027.easterMonday, dates2027.victoria, dates2027.canada, row("2027-08-02", "B.C. Day", "summer"), dates2027.labour, dates2027.truth, dates2027.thanksgiving, dates2027.remembrance, dates2027.christmas, dates2027.boxing],
  AB: [late2026.remembrance, row("2026-12-24", "Christmas Floater", "winter"), late2026.christmas, row("2026-12-28", "Boxing Day", "winter", "observedNote"), dates2027.newYear, dates2027.family, dates2027.goodFriday, dates2027.easterMonday, dates2027.victoria, dates2027.canada, dates2027.labour, dates2027.thanksgiving, dates2027.remembrance, row("2027-12-24", "Christmas Floater", "winter"), dates2027.christmasMonday, dates2027.boxingTuesday],
  SK: [late2026.remembrance, late2026.christmas, row("2026-12-28", "Boxing Day", "winter", "observedNote"), dates2027.newYear, dates2027.family, dates2027.goodFriday, dates2027.victoria, dates2027.canada, row("2027-08-02", "Saskatchewan Day", "summer"), dates2027.labour, dates2027.thanksgiving, dates2027.remembrance, dates2027.christmasMonday, dates2027.boxingTuesday],
  MB: [late2026.remembrance, late2026.christmas, row("2026-12-28", "Boxing Day", "winter", "observedNote"), dates2027.newYear, row("2027-02-15", "Louis Riel Day", "family"), dates2027.goodFriday, dates2027.easterMonday, dates2027.victoria, dates2027.canada, row("2027-08-02", "Terry Fox Day", "summer"), dates2027.labour, dates2027.truth, dates2027.thanksgiving, dates2027.remembrance, dates2027.christmasMonday, dates2027.boxingTuesday],
  ON: [late2026.remembrance, late2026.christmas, row("2026-12-28", "Boxing Day", "winter", "observedNote"), dates2027.newYear, dates2027.goodFriday, dates2027.easterMonday, dates2027.victoria, dates2027.canada, row("2027-08-02", "Civic Holiday", "summer"), dates2027.labour, dates2027.thanksgiving, dates2027.remembrance, dates2027.christmasMonday, dates2027.boxingTuesday],
  QC: [row("2026-12-24", "Christmas Eve", "winter"), late2026.christmas, late2026.boxing, row("2026-12-31", "New Year’s Eve", "newYear"), dates2027.newYear, row("2027-01-04", "Day after New Year’s Day", "newYear", "observedNote"), dates2027.goodFriday, dates2027.easterMonday, row("2027-05-24", "National Patriots’ Day", "spring"), row("2027-06-24", "Québec National Holiday", "summer"), dates2027.canada, dates2027.labour, dates2027.thanksgiving, row("2027-12-24", "Christmas Eve", "winter"), dates2027.christmasMonday, dates2027.boxingTuesday, row("2027-12-31", "New Year’s Eve", "newYear")],
  NB: [late2026.remembrance, late2026.christmas, row("2026-12-28", "Boxing Day", "winter", "observedNote"), dates2027.newYear, dates2027.family, dates2027.goodFriday, dates2027.easterMonday, dates2027.victoria, dates2027.canada, row("2027-08-02", "New Brunswick Day", "summer"), dates2027.labour, dates2027.thanksgiving, dates2027.remembrance, dates2027.christmasMonday, dates2027.boxingTuesday],
  NS: [late2026.remembrance, late2026.christmas, late2026.boxing, dates2027.newYear, row("2027-02-15", "Nova Scotia Heritage Day", "family"), dates2027.goodFriday, dates2027.easterMonday, dates2027.victoria, dates2027.canada, dates2027.labour, dates2027.truth, dates2027.thanksgiving, dates2027.remembrance, dates2027.christmasMonday, dates2027.boxingTuesday],
  PE: [late2026.remembrance, late2026.christmas, row("2026-12-28", "Boxing Day", "winter", "observedNote"), dates2027.newYear, row("2027-02-15", "Islander Day", "family"), dates2027.goodFriday, dates2027.victoria, dates2027.canada, dates2027.labour, dates2027.truth, dates2027.thanksgiving, dates2027.remembrance, dates2027.christmasMonday, dates2027.boxingTuesday],
  NL: [late2026.remembrance, late2026.christmas, dates2027.newYear, row("2027-03-15", "St. Patrick’s Day", "spring"), dates2027.goodFriday, row("2027-04-26", "St. George’s Day", "spring"), dates2027.victoria, row("2027-06-21", "June Holiday", "summer"), row("2027-07-01", "Memorial Day", "canada"), row("2027-07-12", "Orangeman’s Day", "summer"), dates2027.labour, dates2027.truth, dates2027.thanksgiving, dates2027.remembrance, dates2027.christmasMonday, dates2027.boxingTuesday],
  YT: [late2026.remembrance, late2026.christmas, dates2027.newYear, dates2027.goodFriday, dates2027.victoria, row("2027-06-21", "National Indigenous Peoples Day", "summer"), dates2027.canada, row("2027-08-16", "Discovery Day", "summer"), dates2027.labour, dates2027.truth, dates2027.thanksgiving, dates2027.remembrance, dates2027.christmas],
  NT: [late2026.remembrance, late2026.christmas, late2026.boxing, dates2027.newYear, dates2027.goodFriday, dates2027.easterMonday, dates2027.victoria, row("2027-06-21", "National Indigenous Peoples Day", "summer"), dates2027.canada, row("2027-08-02", "Civic Holiday", "summer"), dates2027.labour, dates2027.truth, dates2027.thanksgiving, dates2027.remembrance, dates2027.christmasMonday, dates2027.boxingTuesday],
  NU: [late2026.remembrance, late2026.christmas, late2026.boxing, dates2027.newYear, dates2027.goodFriday, dates2027.easterMonday, dates2027.victoria, dates2027.canada, row("2027-07-09", "Nunavut Day", "summer"), row("2027-08-02", "Civic Holiday", "summer"), dates2027.labour, dates2027.truth, dates2027.thanksgiving, dates2027.remembrance, dates2027.christmas, dates2027.boxing],
};

const federalEmployment = [late2026.remembrance, late2026.christmas, late2026.boxing, dates2027.newYear, dates2027.goodFriday, dates2027.victoria, dates2027.canada, dates2027.labour, dates2027.truth, dates2027.thanksgiving, dates2027.remembrance, dates2027.christmas, dates2027.boxing];
const federalPublicService = [late2026.remembrance, late2026.christmas, row("2026-12-28", "Boxing Day", "winter", "observedNote"), dates2027.newYear, dates2027.goodFriday, dates2027.easterMonday, dates2027.victoria, dates2027.canada, dates2027.labour, dates2027.truth, dates2027.thanksgiving, dates2027.remembrance, dates2027.christmasMonday, dates2027.boxingTuesday];


for (const dates of [...Object.values(regionalEmployment), ...Object.values(regionalPublicService), federalEmployment, federalPublicService]) {
  dates.sort((left, right) => left[0].localeCompare(right[0]));
}

export const calendarData = {
  sources: source,
  regionalEmployment,
  regionalPublicService,
  federalEmployment,
  federalPublicService,
};
