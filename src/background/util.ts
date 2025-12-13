export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withBackoff<T>(fn: () => Promise<T>, opts?: { retries?: number; baseMs?: number }) {
  const retries = opts?.retries ?? 5;
  const baseMs = opts?.baseMs ?? 500;
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (e: any) {
      attempt++;
      if (attempt > retries) throw e;
      const delay = baseMs * Math.pow(2, attempt - 1);
      await sleep(delay);
    }
  }
}

export function toCsv(rows: Record<string, string>[]): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const esc = (s: string) => '"' + s.replaceAll('"', '""') + '"';
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => esc(String(row[h] ?? ''))).join(','));
  }
  return lines.join('\n');
}
