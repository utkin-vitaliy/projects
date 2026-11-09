import test from "node:test";
import assert from "node:assert/strict";
import { calendarData } from "./calendar-data.js";

const regions = ["BC", "AB", "SK", "MB", "ON", "QC", "NB", "NS", "PE", "NL", "YT", "NT", "NU"];
const photoKeys = new Set(["canada", "remembrance", "autumn", "newYear", "winter", "family", "spring", "summer", "reconciliation", "picnic"]);
const noteKeys = new Set(["observedNote", "localCivicNote", "qcEasterChoice", "partialDayNote"]);

test("all 13 regions have separate employment and public-service calendars and official sources", () => {
  for (const region of regions) {
    assert.ok(calendarData.regionalEmployment[region]?.length, `${region} employment dates missing`);
    assert.ok(calendarData.regionalPublicService[region]?.length, `${region} public-service dates missing`);
    assert.match(calendarData.sources.employment[region], /^https:\/\//, `${region} employment source missing`);
    assert.match(calendarData.sources.publicService[region], /^https:\/\//, `${region} public-service source missing`);
  }
  assert.deepEqual(Object.keys(calendarData.regionalEmployment).sort(), [...regions].sort());
  assert.deepEqual(Object.keys(calendarData.regionalPublicService).sort(), [...regions].sort());
});

test("calendar dates are valid, in the published range, sorted, and use known photos", () => {
  const calendars = [
    ...Object.values(calendarData.regionalEmployment),
    ...Object.values(calendarData.regionalPublicService),
    calendarData.federalEmployment,
    calendarData.federalPublicService,
  ];
  for (const dates of calendars) {
    assert.deepEqual(dates.map(([date]) => date), dates.map(([date]) => date).toSorted());
    const ids = new Set();
    for (const [date, name, photo, noteKey] of dates) {
      assert.match(date, /^(?:2026-1[12]-\d{2}|2027-\d{2}-\d{2})$/);
      assert.equal(new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10), date, `invalid date ${date}`);
      assert.ok(name.length, `holiday name missing for ${date}`);
      assert.ok(photoKeys.has(photo), `unknown photo key ${photo}`);
      assert.ok(!noteKey || noteKeys.has(noteKey), `unknown note key ${noteKey}`);
      const id = `${date}:${name}`;
      assert.ok(!ids.has(id), `duplicate holiday ${id}`);
      ids.add(id);
    }
  }
});

test("calendar scopes retain jurisdiction-specific distinctions", () => {
  const has = (events, name) => events.some(([, holiday]) => holiday === name);
  assert.equal(has(calendarData.regionalEmployment.BC, "Boxing Day"), false);
  assert.equal(has(calendarData.regionalPublicService.BC, "Boxing Day"), true);
  assert.equal(has(calendarData.regionalEmployment.SK, "Floating Holiday"), false);
  assert.equal(has(calendarData.regionalPublicService.SK, "Floating Holiday"), false);
  assert.equal(has(calendarData.federalEmployment, "Easter Monday"), false);
  assert.equal(has(calendarData.federalPublicService, "Easter Monday"), true);
  assert.equal(has(calendarData.regionalEmployment.QC, "Québec National Holiday"), true);
  assert.equal(has(calendarData.regionalEmployment.QC, "Good Friday"), false);
  assert.equal(has(calendarData.regionalEmployment.QC, "Easter Monday"), false);
  assert.equal(has(calendarData.regionalEmployment.AB, "Easter Monday"), false);
  assert.equal(has(calendarData.regionalPublicService.AB, "Easter Monday"), true);
  assert.equal(calendarData.regionalEmployment.ON.some(([date]) => date === "2026-11-11" || date === "2027-11-11"), false);
  assert.equal(has(calendarData.federalEmployment, "Remembrance Day"), true);
  assert.equal(has(calendarData.regionalPublicService.BC, "Christmas Eve"), false);
  const allDates = [
    ...Object.values(calendarData.regionalEmployment),
    ...Object.values(calendarData.regionalPublicService),
    calendarData.federalEmployment,
    calendarData.federalPublicService,
  ].flat();
  const conditionalNames = new Set(["Local civic holiday", "Provincial or civic holiday", "Floating Holiday", "Natal Day", "Gold Cup Parade Day or civic holiday"]);
  assert.equal(allDates.some(([, name]) => conditionalNames.has(name)), false);
  assert.equal(allDates.some(([, name]) => name === "Christmas Eve"), true); // Québec public-service full day
  assert.equal(allDates.some(([, , , note]) => note === "partialDayNote" || note === "localCivicNote" || note === "qcEasterChoice"), false);
  assert.equal(calendarData.regionalEmployment.NB.some(([, name]) => name === "Boxing Day"), false);
  assert.equal(calendarData.regionalPublicService.AB.some(([, name]) => name === "Local civic holiday"), false);
  assert.equal(calendarData.regionalPublicService.NS.some(([, name]) => name === "Christmas Eve" || name === "Natal Day"), false);
  assert.equal(calendarData.regionalPublicService.PE.some(([, name]) => name === "Christmas Eve" || name.includes("Gold Cup")), false);
  assert.equal(calendarData.regionalPublicService.NL.some(([, name]) => name === "Local civic holiday"), false);
  assert.equal(calendarData.federalPublicService.some(([, name]) => name === "Provincial or civic holiday"), false);
});
