import { sleep, withBackoff } from './util';

export type Job = { id: string; type: string; payload: any; status: 'pending' | 'done' | 'failed'; attempts: number; lastError?: string };

const KEY = 'job_queue_v1';

async function load(): Promise<Job[]> {
  const { [KEY]: jobs = [] } = await chrome.storage.local.get(KEY);
  return jobs as Job[];
}
async function save(jobs: Job[]) {
  await chrome.storage.local.set({ [KEY]: jobs });
}

export async function enqueueJobs(type: string, payloads: any[]): Promise<number> {
  const jobs = await load();
  const now = Date.now();
  for (const p of payloads) {
    jobs.push({ id: `${type}:${now}:${Math.random().toString(36).slice(2)}`, type, payload: p, status: 'pending', attempts: 0 });
  }
  await save(jobs);
  return payloads.length;
}

export type Processor = (payload: any) => Promise<void>;

export async function runJobs(processors: Record<string, Processor>, opts?: { maxAttempts?: number }) {
  const maxAttempts = opts?.maxAttempts ?? 5;
  while (true) {
    const jobs = await load();
    const idx = jobs.findIndex(j => j.status === 'pending');
    if (idx === -1) break;
    const job = jobs[idx];
    const proc = processors[job.type];
    if (!proc) {
      job.status = 'failed';
      job.lastError = 'No processor';
      await save(jobs);
      continue;
    }
    try {
      await withBackoff(() => proc(job.payload), { retries: 2 });
      job.status = 'done';
      job.lastError = undefined;
      await save(jobs);
      // tiny delay to yield event loop
      await sleep(50);
    } catch (e: any) {
      job.attempts++;
      job.lastError = String(e?.message ?? e);
      if (job.attempts >= maxAttempts) job.status = 'failed';
      await save(jobs);
      await sleep(200);
    }
  }
}

export async function clearCompletedJobs() {
  const jobs = await load();
  const pending = jobs.filter(j => j.status === 'pending');
  await save(pending);
}
