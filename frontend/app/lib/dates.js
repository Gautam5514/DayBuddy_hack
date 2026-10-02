// Small date/time helpers. All use the browser's local time zone.

const pad = (n) => String(n).padStart(2, "0");

// Local "YYYY-MM-DD", so a late-night check-in is filed under the right day.
export function todayIso(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export const minutesOfDay = (date) => date.getHours() * 60 + date.getMinutes();

// 24h "HH:MM" -> minutes since midnight, or null.
export function parseTime24(value) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value ?? "");
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

// 12h "7:30 AM" -> minutes since midnight, or null. Plan items use this format.
export function parseClock(value) {
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(String(value ?? "").trim());
  if (!match) return null;
  const hours = (Number(match[1]) % 12) + (match[3].toUpperCase() === "PM" ? 12 : 0);
  return hours * 60 + Number(match[2]);
}

// 135 -> "2h 15m", 40 -> "40m".
export function formatDuration(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
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
