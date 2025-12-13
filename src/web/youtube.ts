import { sleep, withBackoff } from '../shared/util';
import type { SubscriptionItem } from '../shared/types';

const YT_BASE = 'https://www.googleapis.com/youtube/v3';

async function ytFetch(token: string, url: string, init?: RequestInit): Promise<any> {
  const resp = await withBackoff(() => fetch(url, {
    ...init,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(init?.headers || {})
    }
  }));

  if (!resp.ok) {
    const text = await resp.text();
    try {
      const data = JSON.parse(text);
      const reason = data?.error?.details?.[0]?.metadata?.reason ?? data?.error?.details?.[0]?.reason;
      const activationUrl = data?.error?.details?.[0]?.metadata?.activationUrl;
      const service = data?.error?.details?.[0]?.metadata?.service;
      if (resp.status === 403 && (reason === 'SERVICE_DISABLED' || String(data?.error?.errors?.[0]?.reason) === 'accessNotConfigured')) {
        throw new Error(
          [
            `YouTube Data API v3가 비활성화되어 있습니다(SERVICE_DISABLED).`,
            `GCP 프로젝트에서 YouTube Data API v3를 Enable 한 뒤 다시 시도하세요.`,
            activationUrl ? `Enable 링크: ${activationUrl}` : '',
            service ? `service: ${service}` : '',
          ].filter(Boolean).join('\n')
        );
      }
    } catch {
      // ignore JSON parse errors; fall back to raw text
    }
    throw new Error(`YouTube API error ${resp.status}: ${text}`);
  }

  return resp.json();
}

export async function listAllSubscriptions(token: string): Promise<SubscriptionItem[]> {
  const items: SubscriptionItem[] = [];
  let pageToken: string | undefined;
  do {
    const url = new URL(`${YT_BASE}/subscriptions`);
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('mine', 'true');
    url.searchParams.set('maxResults', '50');
    if (pageToken) url.searchParams.set('pageToken', pageToken);
    const data = await ytFetch(token, url.toString());
    for (const it of data.items ?? []) {
      items.push({
        subscriptionId: String(it.id ?? ''),
        channelId: String(it.snippet?.resourceId?.channelId ?? ''),
        channelTitle: String(it.snippet?.title ?? ''),
      });
    }
    pageToken = data.nextPageToken;
  } while (pageToken);
  return items.filter(x => x.subscriptionId && x.channelId);
}

export async function bulkUnsubscribe(token: string, subscriptionIds: string[]) {
  const failures: Array<{ subscriptionId: string; error: string }> = [];
  for (const id of subscriptionIds) {
    try {
      const url = new URL(`${YT_BASE}/subscriptions`);
      url.searchParams.set('id', id);
      const resp = await withBackoff(() => fetch(url.toString(), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      }));
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    } catch (e: any) {
      failures.push({ subscriptionId: id, error: String(e?.message ?? e) });
    } finally {
      await sleep(100);
    }
  }
  return { attempted: subscriptionIds.length, failed: failures };
}

export async function subscribeToChannel(token: string, channelId: string): Promise<{ subscriptionId: string }> {
  const url = new URL(`${YT_BASE}/subscriptions`);
  url.searchParams.set('part', 'snippet');

  const data = await ytFetch(token, url.toString(), {
    method: 'POST',
    body: JSON.stringify({
      snippet: {
        resourceId: {
          kind: 'youtube#channel',
          channelId
        }
      }
    })
  });

  const subscriptionId = String(data?.id ?? '');
  if (!subscriptionId) throw new Error('Subscribe failed: missing subscription id in response.');
  return { subscriptionId };
}

