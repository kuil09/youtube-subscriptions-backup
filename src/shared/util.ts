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

export function toCsv(rows: Record<string, string | number | undefined>[]): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const esc = (s: string) => '"' + s.replaceAll('"', '""') + '"';
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => esc(String(row[h] ?? ''))).join(','));
  }
  return lines.join('\n');
}

export function downloadTextFile(
  filename: string,
  text: string,
  mime: string,
  opts?: { revokeAfterMs?: number }
) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';

  // Some browsers require the anchor to be in the DOM.
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();

  // There is no reliable “download completed” event for <a download>.
  // Revoking too early can break large downloads, so use a conservative delay.
  const revokeAfterMs = opts?.revokeAfterMs ?? 60_000;
  setTimeout(() => URL.revokeObjectURL(url), revokeAfterMs);
}

export type CsvParseResult = { rows: Record<string, string>[]; errors: string[] };

// Minimal CSV parser that supports double-quote escaping.
export function parseCsv(text: string): CsvParseResult {
  const errors: string[] = [];
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = '';
  let inQuotes = false;

  const pushCell = () => {
    row.push(cur);
    cur = '';
  };
  const pushRow = () => {
    // ignore trailing empty row
    if (row.length === 1 && row[0] === '' && rows.length === 0) return;
    rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cur += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ',') {
      pushCell();
      continue;
    }
    if (ch === '\r') continue;
    if (ch === '\n') {
      pushCell();
      pushRow();
      continue;
    }
    cur += ch;
  }
  pushCell();
  if (inQuotes) errors.push('CSV parse warning: unterminated quote.');
  if (row.length) pushRow();

  if (!rows.length) return { rows: [], errors: ['CSV is empty.'] };
  const headers = rows[0].map(h => h.trim());
  const out: Record<string, string>[] = [];
  for (let r = 1; r < rows.length; r++) {
    const rr = rows[r];
    if (rr.every(v => String(v).trim() === '')) continue;
    const obj: Record<string, string> = {};
    for (let c = 0; c < headers.length; c++) {
      const key = headers[c] || `col_${c}`;
      obj[key] = rr[c] ?? '';
    }
    out.push(obj);
  }
  return { rows: out, errors };
}

