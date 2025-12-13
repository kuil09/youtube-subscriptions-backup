export type ActionLog = {
  at: number;
  type: string;
  detail?: any;
};

const KEY = 'action_logs';

export async function logEvent(type: string, detail?: any) {
  const { [KEY]: logs = [] } = await chrome.storage.local.get(KEY);
  logs.push({ at: Date.now(), type, detail } as ActionLog);
  if (logs.length > 5000) logs.splice(0, logs.length - 5000);
  await chrome.storage.local.set({ [KEY]: logs });
}

export async function getLogs(): Promise<ActionLog[]> {
  const { [KEY]: logs = [] } = await chrome.storage.local.get(KEY);
  return logs as ActionLog[];
}

export async function clearLogs() {
  await chrome.storage.local.remove(KEY);
}
