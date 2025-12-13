// Content script that runs on Watch Later page

function extractVideoIdFromHref(href: string): string | undefined {
  try {
    const url = new URL(href, location.origin);
    return url.searchParams.get('v') ?? undefined;
  } catch {
    return undefined;
  }
}

function scrapeOnce() {
  const items: any[] = [];
  // Modern WL uses ytd-playlist-video-list-renderer > ytd-playlist-video-renderer
  const nodes = document.querySelectorAll('ytd-playlist-video-renderer');
  nodes.forEach((n) => {
    const titleEl = n.querySelector('#video-title');
    const href = (titleEl as HTMLAnchorElement | null)?.href ?? '';
    const videoId = extractVideoIdFromHref(href);
    const title = titleEl?.textContent?.trim() ?? '';
    const channelName = (n.querySelector('ytd-channel-name a') as HTMLAnchorElement | null)?.textContent?.trim() ?? '';
    const durationText = (n.querySelector('span.ytd-thumbnail-overlay-time-status-renderer') as HTMLElement | null)?.textContent?.trim() ?? '';
    const publishedText = (n.querySelector('#metadata-line span:nth-child(2)') as HTMLElement | null)?.textContent?.trim() ?? '';
    if (videoId) {
      items.push({ videoId, title, channelName, durationText, publishedText });
    }
  });
  return items;
}

function post() {
  const videos = scrapeOnce();
  if (videos.length) {
    chrome.runtime.sendMessage({ type: 'WL_SCRAPED', payload: { videos } });
  }
}

const observer = new MutationObserver(() => {
  post();
});

window.addEventListener('load', () => {
  post();
  observer.observe(document.body, { childList: true, subtree: true });
});

// Also run after 2s idle
setTimeout(post, 2000);

// Best-effort removal from Watch Later by videoId
async function removeFromWatchLater(videoId: string): Promise<boolean> {
  const selector = `ytd-playlist-video-renderer a#video-title[href*="v=${videoId}"]`;
  const titleLink = document.querySelector(selector) as HTMLAnchorElement | null;
  if (!titleLink) return false;
  const root = titleLink.closest('ytd-playlist-video-renderer') as HTMLElement | null;
  if (!root) return false;
  // Open action menu
  const menuButton = root.querySelector('button[aria-label*=\"Action\"], ytd-menu-renderer button') as HTMLButtonElement | null;
  if (!menuButton) return false;
  menuButton.click();
  // Wait a bit for menu to render
  await new Promise(r => setTimeout(r, 300));
  // Find remove item (labels vary, try contains text)
  const items = Array.from(document.querySelectorAll('ytd-menu-service-item-renderer, tp-yt-paper-item')) as HTMLElement[];
  const target = items.find(el => /remove/i.test(el.textContent || '') && /watch later/i.test(el.textContent || ''));
  if (!target) return false;
  (target as HTMLElement).click();
  return true;
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    if (msg.type === 'WL_REMOVE_VIDEO') {
      const ok = await removeFromWatchLater(msg.videoId);
      sendResponse({ ok });
      return;
    }
  })();
  return true;
});
