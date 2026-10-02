// Small date/time helpers. All use the browser's local time zone.

const pad = (n) => String(n).padStart(2, "0");

// Local "YYYY-MM-DD", so a late-night check-in is filed under the right day.
export function todayIso(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// 24h "HH:MM" -> "7:00 AM". Returns the input unchanged if it can't be parsed.
export function formatTime(value) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value ?? "");
  if (!match) return value || "";
  const hours = Number(match[1]);
  const period = hours < 12 ? "AM" : "PM";
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${match[2]} ${period}`;
}

// "2026-10-02" -> "Fri, 2 Oct" (locale-dependent).
export function formatShortDate(iso) {
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}

export function greetingFor(hour) {
  if (hour < 5) return "Still up";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
