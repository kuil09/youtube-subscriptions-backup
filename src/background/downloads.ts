import { toCsv } from './util';

function toDataUrl(mime: string, content: string) {
  return `data:${mime};charset=utf-8,${encodeURIComponent(content)}`;
}

export async function exportAsCsv(filename: string, rows: Record<string, string>[]) {
  const csv = toCsv(rows);
  // MV3 service worker doesn't always support URL.createObjectURL; fall back to data: URL.
  const canBlobUrl = typeof (URL as any)?.createObjectURL === 'function';
  if (canBlobUrl) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    try {
      await chrome.downloads.download({ url, filename, saveAs: true });
    } finally {
      URL.revokeObjectURL(url);
    }
    return;
  }
  const url = toDataUrl('text/csv', csv);
  await chrome.downloads.download({ url, filename, saveAs: true });
}

export async function exportAsJson(filename: string, data: unknown) {
  const json = JSON.stringify(data, null, 2);
  const canBlobUrl = typeof (URL as any)?.createObjectURL === 'function';
  if (canBlobUrl) {
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    try {
      await chrome.downloads.download({ url, filename, saveAs: true });
    } finally {
      URL.revokeObjectURL(url);
    }
    return;
  }
  const url = toDataUrl('application/json', json);
  await chrome.downloads.download({ url, filename, saveAs: true });
}
