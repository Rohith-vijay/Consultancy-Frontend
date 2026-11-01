export function localDateInput(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatCertificateDate(value) {
  if (!value) return "Not available";
  const calendarDate = /^\d{4}-\d{2}-\d{2}$/.test(value);
  // Parsing date-only strings as UTC can display the previous day in western time zones.
  const date = new Date(calendarDate ? `${value}T12:00:00` : value);
  if (Number.isNaN(date.getTime()) || (calendarDate && localDateInput(date) !== value)) return "Not available";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
