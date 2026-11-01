const fallback = "Unable to download this certificate. Please try again.";

export async function certificateDownloadError(error) {
  let body = error?.response?.data;
  if (body instanceof Blob) {
    try { body = JSON.parse(await body.text()); }
    catch { return fallback; }
  }
  return typeof body?.message === "string" && body.message.trim() ? body.message : fallback;
}
