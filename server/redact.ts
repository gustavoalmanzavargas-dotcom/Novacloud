export function redact(value: any): any {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        /(password|secret|token|authorization|envVars|^env$)/i.test(key)
          ? "[redacted]"
          : redact(item),
      ]),
    );
  if (typeof value === "string" && /^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      url.username = "";
      url.password = "";
      for (const key of [...url.searchParams.keys()])
        if (/(token|key|secret|password)/i.test(key))
          url.searchParams.set(key, "[redacted]");
      return url.toString();
    } catch {}
  }
  return value;
}
