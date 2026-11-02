const TOURNAMENT_TIME_ZONE = "America/Toronto";

export function formatTournamentDate(
  value: Date | string,
  options: Intl.DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TOURNAMENT_TIME_ZONE,
    ...options,
  }).format(new Date(value));
}

export function toTorontoDateTimeLocal(value: Date | string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TOURNAMENT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));
  const values = Object.fromEntries(parts.map(({ type, value: partValue }) => [type, partValue]));
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
}

export function parseTorontoDateTimeLocal(value: string): Date {
  const [datePart, timePart] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  const desiredWallTime = Date.UTC(year, month - 1, day, hour, minute);
  let instant = new Date(desiredWallTime);

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: TOURNAMENT_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(instant);
    const values = Object.fromEntries(parts.map(({ type, value: partValue }) => [type, Number(partValue)]));
    const actualWallTime = Date.UTC(values.year, values.month - 1, values.day, values.hour, values.minute);
    instant = new Date(instant.getTime() + desiredWallTime - actualWallTime);
  }

  return instant;
}
