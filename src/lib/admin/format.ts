export const naira = (value: number, compact = false) =>
  compact
    ? `₦${new Intl.NumberFormat("en-NG", { notation: "compact", maximumFractionDigits: 1 }).format(value)}`
    : `₦${new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 }).format(value)}`;

export const pct = (raised: number, target: number) =>
  target <= 0 ? 0 : Math.min(100, Math.round((raised / target) * 100));

export const shortDate = (value: string) => {
  const d = new Date(value.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" });
};

export const dateTime = (value: string) => {
  const d = new Date(value.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return value;
  return `${d.toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" })}, ${d.toLocaleTimeString(
    "en-NG",
    { hour: "2-digit", minute: "2-digit" },
  )}`;
};

export const nowStamp = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

export const today = () => nowStamp().slice(0, 10);
