import type { ClassifiedSuggestion, WatchLaterVideo } from './types';

export async function classifyVideosWithAI(videos: WatchLaterVideo[], existingPlaylists: string[]): Promise<ClassifiedSuggestion[]> {
  const hasAI = typeof (globalThis as any).ai !== 'undefined' || typeof (globalThis as any).window?.ai !== 'undefined';
  if (!hasAI) {
    return heuristicClassify(videos, existingPlaylists);
  }

  const ai: any = (globalThis as any).ai ?? (globalThis as any).window?.ai;
  const suggestions: ClassifiedSuggestion[] = [];

  for (const v of videos) {
    try {
      const prompt = buildPrompt(v, existingPlaylists);
      const resultText = await ai.prompt?.prompt?.(prompt)
        ?? await ai.writer?.write?.({ task: prompt })
        ?? await ai.summarizer?.summarize?.(prompt);
      const parsed = parseResult(String(resultText));
      suggestions.push({ videoId: v.videoId, suggestedPlaylistTitle: parsed.title, confidence: parsed.confidence, rationale: parsed.rationale });
    } catch {
      const h = heuristicClassify([v], existingPlaylists)[0];
      suggestions.push(h);
    }
  }
  return suggestions;
}

function buildPrompt(v: WatchLaterVideo, playlists: string[]): string {
  return [
    'You are categorizing a YouTube video into one of the user\'s playlists.',
    `Title: ${v.title}`,
    `Channel: ${v.channelName ?? ''}`,
    `Duration: ${v.durationText ?? ''}`,
    `Published: ${v.publishedText ?? ''}`,
    `Existing playlists: ${playlists.join(' | ')}`,
    'Respond as JSON: {"title":"<best playlist title or new title>","confidence":0..1,"rationale":"<short>"}'
  ].join('\n');
}

function parseResult(text: string): { title: string; confidence: number; rationale?: string } {
  try {
    const j = JSON.parse(text);
    const title = String(j.title ?? '').slice(0, 120) || 'Uncategorized';
    const confidence = Math.max(0, Math.min(1, Number(j.confidence ?? 0.5)));
    const rationale = typeof j.rationale === 'string' ? j.rationale : undefined;
    return { title, confidence, rationale };
  } catch {
    return { title: 'Uncategorized', confidence: 0.3 };
  }
}

function heuristicClassify(videos: WatchLaterVideo[], playlists: string[]): ClassifiedSuggestion[] {
  const lowerPlaylists = playlists.map(p => p.toLowerCase());
  return videos.map(v => {
    const title = v.title.toLowerCase();
    const candidates: string[] = [];
    if (/react|frontend|javascript|typescript|web/.test(title)) candidates.push('Frontend / React');
    if (/interview|talk|podcast|long|2h|90min|120min/.test(title)) candidates.push('긴 영상 / 인터뷰');
    if (/econom|finance|stock|news|macro|market|fed|cpi/.test(title)) candidates.push('시사·경제');
    const preferred = candidates.find(c => lowerPlaylists.includes(c.toLowerCase())) ?? candidates[0] ?? 'Uncategorized';
    return { videoId: v.videoId, suggestedPlaylistTitle: preferred, confidence: candidates.length ? 0.75 : 0.3 };
  });
}
