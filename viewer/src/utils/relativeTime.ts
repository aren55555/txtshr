const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export const relativeTime = (ts: number): string => {
  const s = Math.round((ts - Date.now()) / 1000);
  if (Math.abs(s) < 60) return rtf.format(Math.round(s), "second");
  if (Math.abs(s) < 3600) return rtf.format(Math.round(s / 60), "minute");
  if (Math.abs(s) < 86400) return rtf.format(Math.round(s / 3600), "hour");
  if (Math.abs(s) < 2592000) return rtf.format(Math.round(s / 86400), "day");
  return rtf.format(Math.round(s / 2592000), "month");
};
