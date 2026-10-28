export async function request(url: string, method = "GET", body?: unknown) {
  const response = await fetch(url, {
    method,
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (response.status === 204) return null;
  const data = await response
    .json()
    .catch(() => ({ error: "Nova returned an invalid API response" }));
  if (!response.ok)
    throw new Error(data.error || `Request failed (${response.status})`);
  return data;
}
export function exportJson(filename: string, data: unknown) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
export const bytes = (value: unknown) => {
  if (value === null || value === undefined || !Number.isFinite(Number(value)))
    return "Not measured";
  const n = Number(value);
  if (n === 0) return "0 B";
  const i = Math.min(
    Math.max(Math.floor(Math.log(Math.abs(n)) / Math.log(1024)), 0),
    4,
  );
  return `${(n / 1024 ** i).toFixed(i ? 2 : 0)} ${["B", "KiB", "MiB", "GiB", "TiB"][i]}`;
};
export const date = (value: unknown) =>
  value ? new Date(String(value)).toLocaleString() : "—";
