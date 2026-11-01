import test from "node:test";
import assert from "node:assert/strict";
import { localDateInput } from "../../src/utils/certificateDates.js";

test("date input values use local calendar components and zero padding", () => {
  assert.equal(localDateInput(new Date(2026, 0, 3, 23, 59)), "2026-01-03");
  assert.equal(localDateInput(new Date(2026, 10, 1, 0, 1)), "2026-11-01");
});
