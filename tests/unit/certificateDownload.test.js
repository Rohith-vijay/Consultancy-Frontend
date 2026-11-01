import test from "node:test";
import assert from "node:assert/strict";
import { certificateDownloadError } from "../../src/utils/certificateDownload.js";

test("PDF request failures preserve JSON errors returned as blobs", async () => {
  const error = { response: { data: new Blob([JSON.stringify({ message: "This certificate belongs to another account." })]) } };
  assert.equal(await certificateDownloadError(error), "This certificate belongs to another account.");
});

test("plain API errors are readable and malformed responses use a safe fallback", async () => {
  assert.equal(await certificateDownloadError({ response: { data: { message: "Certificate not found" } } }), "Certificate not found");
  for (const error of [undefined, {}, { response: { data: new Blob(["<html>unavailable</html>"]) } }]) {
    assert.equal(await certificateDownloadError(error), "Unable to download this certificate. Please try again.");
  }
});
