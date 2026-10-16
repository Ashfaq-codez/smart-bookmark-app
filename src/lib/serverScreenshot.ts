import { isSafeUrl } from '@/utils/safeFetch';

// Our own screenshot of a page, taken by a headless Chrome running inside the app (no outside service).
// Used for pages with no preview picture that the extension didn't capture (phone saves, older cards).
// Every address the page loads is checked first, so a saved page can never reach private or local addresses.
// Never throws: null when the page can't be shown, refuses us, or shows a "blocked" page.

const WIDTH = 1280;
const HEIGHT = 960;
const MIN_TEXT = 250;   // characters of visible text a real page has at the very least
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';

// Titles of the "are you a robot?" pages some sites show servers: a picture of those is worse than none.
const BLOCK_TITLE = /^(just a moment|attention required|access denied|forbidden|403|404|not found|are you a robot|security check|please verify|captcha)/i;

export function looksBlocked(status: number | null, title: string): boolean {
  if (status != null && status >= 400) return true;
  return BLOCK_TITLE.test(title.trim());
}

export type ShotResult = { shot: Buffer | null; reason: string };

export async function takeScreenshot(url: string): Promise<Buffer | null> {
  return (await screenshotWithReason(url)).shot;
}

// The screenshot plus, when there is none, why (shown by the owner's check page).
export async function screenshotWithReason(url: string): Promise<ShotResult> {
  if (!(await isSafeUrl(url))) return { shot: null, reason: 'not a public web address' };
  let browser: { close(): Promise<void> } | null = null;
  try {
    // Loaded only when needed: a problem with Chrome can never break saving.
    const chromium = (await import('@sparticuz/chromium')).default;
    const puppeteer = (await import('puppeteer-core')).default;
    const b = await puppeteer.launch({
      args: await puppeteer.defaultArgs({ args: chromium.args, headless: 'shell' }),
      // CHROME_PATH: only for running the app on your own computer (a local Chrome); Vercel uses the bundled one.
      executablePath: process.env.CHROME_PATH || (await chromium.executablePath()),
      headless: 'shell',
    });
    browser = b;
    const page = await b.newPage();
    await page.setUserAgent({ userAgent: UA });
    await page.setViewport({ width: WIDTH, height: HEIGHT });

    // Only public web addresses; no video or audio (not needed for a picture, and slow).
    const safeHosts = new Map<string, Promise<boolean>>();
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const target = req.url();
      if (target.startsWith('data:') || target.startsWith('blob:')) { req.continue().catch(() => {}); return; }
      if (req.resourceType() === 'media') { req.abort().catch(() => {}); return; }
      let host: string;
      try {
        const u = new URL(target);
        if (u.protocol !== 'https:' && u.protocol !== 'http:') { req.abort().catch(() => {}); return; }
        host = `${u.protocol}//${u.host}`;
      } catch { req.abort().catch(() => {}); return; }
      if (!safeHosts.has(host)) safeHosts.set(host, isSafeUrl(`${host}/`).catch(() => false));
      safeHosts.get(host)!.then((ok) => (ok ? req.continue() : req.abort())).catch(() => {});
    });

    const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 12_000 });
    await page.waitForNetworkIdle({ idleTime: 500, timeout: 3_000 }).catch(() => {});
    const status = res?.status() ?? null;
    const title = await page.title().catch(() => '');
    if (looksBlocked(status, title)) return { shot: null, reason: `the site showed a blocked page (status ${status}, title "${title.slice(0, 60)}")` };
    // Almost no text (Amazon's "continue shopping" robot check, an empty app shell): not worth a picture.
    const words = await page.evaluate(() => (document.body?.innerText || '').trim().length).catch(() => 0);
    if (words < MIN_TEXT) return { shot: null, reason: `the page was almost empty (${words} characters of text)` };

    const shot = await page.screenshot({ type: 'jpeg', quality: 80, clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT } });
    return { shot: Buffer.from(shot), reason: 'ok' };
  } catch (e: any) {
    console.error('[server-screenshot] failed:', e?.message);
    return { shot: null, reason: `Chrome error: ${String(e?.message || e).slice(0, 300)}` };
  } finally {
    await browser?.close().catch(() => {});
  }
}
