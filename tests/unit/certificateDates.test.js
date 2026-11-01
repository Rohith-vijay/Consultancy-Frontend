import test from "node:test";
import assert from "node:assert/strict";
import { localDateInput, formatCertificateDate } from "../../src/utils/certificateDates.js";

test("date input values use local calendar components and zero padding", () => {
  assert.equal(localDateInput(new Date(2026, 0, 3, 23, 59)), "2026-01-03");
  assert.equal(localDateInput(new Date(2026, 10, 1, 0, 1)), "2026-11-01");
});

test("certificate service dates preserve the calendar day across time zones", () => {
  const original = process.env.TZ;
  try {
    for (const zone of ["Asia/Kolkata", "America/Los_Angeles"]) {
      process.env.TZ = zone;
      assert.equal(formatCertificateDate("2026-10-01"), "1 Oct 2026");
    }
  } finally {
    if (original === undefined) delete process.env.TZ; else process.env.TZ = original;
  }
});

test("missing and invalid certificate dates have a readable fallback", () => {
  for (const value of [null, "", "invalid", "2026-02-31"]) assert.equal(formatCertificateDate(value), "Not available");
});
