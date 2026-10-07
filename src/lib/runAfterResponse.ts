import { after } from 'next/server';

// Runs `task` AFTER the answer has been sent back to the browser/extension, so the person never waits for it.
// (Vercel keeps the function alive until the task finishes.) Any error is logged, never thrown.
// Kept in its own tiny file so the tests can swap it for a version that runs the task straight away.
export function runAfterResponse(task: () => Promise<void>) {
  const safe = async () => {
    try { await task(); } catch (e: any) { console.error('[after-save] failed:', e?.message); }
  };
  try {
    after(safe);
  } catch {
    // `after` only works inside a real request. If it is ever called elsewhere, just start the task.
    void safe();
  }
}
