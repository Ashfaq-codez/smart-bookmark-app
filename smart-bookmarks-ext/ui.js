// The "save to inntoit" card: one build for both places it appears.
//   - panel.js: drawn straight onto the page inside a closed shadow root (no frame, so even sites with strict
//     security rules, like Reddit, can't block it)
//   - popup.html: Chrome's normal popup, for pages extensions can't draw on (chrome://, Web Store, PDF viewer)
// Every text is set with textContent and every icon is built as DOM nodes: never innerHTML.
// Needs extract.js loaded first. Safe to load more than once.
(function (root) {
  const CSS = `
    .app {
      --bg: #FAF9F5; --card: #FFFFFF; --ink: #171A17; --muted: #737B73; --line: rgba(0,0,0,0.07);
      --field: #F4F1EA; --brand: #4D6A51; --brand-ink: #FFFFFF; --brand-soft: #E8EFE5;
      --warn-bg: #FDF6E3; --warn-ink: #6B4E16; --warn-line: rgba(217,119,6,0.22);
      --info-bg: #FEF3C7; --info-ink: #92400E; --err-bg: #FEE2E2; --err-ink: #991B1B;
      --shadow: 0 6px 24px rgba(0,0,0,0.05);
      box-sizing: border-box; padding: 14px; background: var(--bg); color: var(--ink);
      font: 13px/1.45 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      -webkit-font-smoothing: antialiased; text-align: left; letter-spacing: normal;
    }
    @media (prefers-color-scheme: dark) {
      .app {
        --bg: #0F120F; --card: #1A1D1A; --ink: #ECEDEA; --muted: #9AA39A; --line: rgba(255,255,255,0.07);
        --field: #232723; --brand: #7FA184; --brand-ink: #0F120F; --brand-soft: #1F2A20;
        --warn-bg: #2B2414; --warn-ink: #F2D69B; --warn-line: rgba(217,119,6,0.32);
        --info-bg: #2B2414; --info-ink: #F2D69B; --err-bg: #2D1717; --err-ink: #F5B4B4;
        --shadow: 0 6px 24px rgba(0,0,0,0.35);
      }
    }
    .app *, .app *::before, .app *::after { box-sizing: border-box; margin: 0; padding: 0; }
    .app [hidden] { display: none !important; }
    .app svg.i { width: 16px; height: 16px; flex-shrink: 0; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }

    .head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
    .brand { display: flex; align-items: center; gap: 8px; }
    .brand img { width: 22px; height: 22px; border-radius: 6px; }
    .brand span { font: 500 19px/1 Georgia, "Times New Roman", serif; letter-spacing: -0.01em; color: var(--ink); }
    .head-actions { display: flex; gap: 2px; }
    .icon-btn { display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 9px;
      border: none; cursor: pointer; background: transparent; color: var(--muted); transition: background .15s ease, color .15s ease; }
    .icon-btn:hover { background: var(--field); color: var(--ink); }
    .app button:focus-visible, .app textarea:focus-visible { outline: 2px solid var(--brand); outline-offset: 2px; }

    .card { background: var(--card); border: 1px solid var(--line); border-radius: 16px; padding: 12px; box-shadow: var(--shadow);
      display: flex; flex-direction: column; gap: 10px; }
    .page { display: flex; align-items: center; gap: 10px; min-width: 0; }
    .fav { width: 34px; height: 34px; border-radius: 10px; background: var(--field); display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; overflow: hidden; color: var(--muted); }
    .fav img { width: 18px; height: 18px; }
    .page-text { min-width: 0; flex: 1; }
    .page-title { font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--ink); }
    .page-sub { display: flex; align-items: center; gap: 6px; color: var(--muted); font-size: 11.5px; min-width: 0; }
    .domain { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .chip { display: inline-flex; align-items: center; flex-shrink: 0; padding: 1px 7px; border-radius: 999px; background: var(--brand-soft);
      color: var(--brand); font-size: 10.5px; font-weight: 600; }

    .notice { display: flex; gap: 10px; padding: 10px 11px; border-radius: 12px; background: var(--warn-bg); color: var(--warn-ink); border: 1px solid var(--warn-line); }
    .notice svg.i { margin-top: 1px; }
    .notice b { display: block; font-size: 12.5px; margin-bottom: 2px; }
    .notice p { font-size: 12px; line-height: 1.45; }
    .steps { display: flex; align-items: center; gap: 6px; margin-top: 7px; font-size: 11.5px; font-weight: 600; flex-wrap: wrap; }
    .kbd { padding: 1px 6px; border-radius: 6px; background: rgba(0,0,0,0.06); }
    @media (prefers-color-scheme: dark) { .kbd { background: rgba(255,255,255,0.08); } }

    .app textarea { display: block; width: 100%; min-height: 72px; max-height: 180px; padding: 9px 11px; resize: none;
      font: 13px/1.5 Georgia, serif; color: var(--ink); background: var(--field); border: 1px solid transparent; border-radius: 11px; outline: none;
      transition: border-color .15s ease, background .15s ease; scrollbar-width: thin; scrollbar-color: var(--line) transparent; }
    .app textarea::-webkit-scrollbar { width: 6px; }
    .app textarea::-webkit-scrollbar-thumb { background: var(--line); border-radius: 6px; }
    .app textarea::placeholder { color: var(--muted); font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
    .app textarea:focus { border-color: var(--brand); background: var(--card); }
    .hint { display: flex; justify-content: flex-end; color: var(--muted); font-size: 10.5px; margin-top: 4px; }

    .save { width: 100%; height: 40px; border: none; border-radius: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 7px;
      background: var(--brand); color: var(--brand-ink); font: 600 13px/1 -apple-system, BlinkMacSystemFont, sans-serif;
      transition: transform .12s ease, opacity .15s ease; }
    .save:hover:not(:disabled) { opacity: .92; }
    .save:active:not(:disabled) { transform: scale(.985); }
    .save:disabled { cursor: default; }
    .spin { animation: inntoit-spin .8s linear infinite; }
    @keyframes inntoit-spin { to { transform: rotate(360deg); } }

    .status { display: flex; align-items: center; gap: 8px; padding: 9px 11px; border-radius: 11px; font-size: 12.5px; font-weight: 500;
      animation: inntoit-rise .18s ease-out both; }
    .status.ok { background: var(--brand-soft); color: var(--brand); }
    .status.dup { background: var(--info-bg); color: var(--info-ink); }
    .status.err { background: var(--err-bg); color: var(--err-ink); }
    .status button { margin-left: auto; border: none; background: none; color: inherit; font: 700 12px/1 inherit; cursor: pointer;
      text-decoration: underline; text-underline-offset: 2px; }
    @keyframes inntoit-rise { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
    @media (prefers-reduced-motion: reduce) { .spin, .status { animation: none; } }
  `;

  // lucide icons (paths from lucide.dev)
  const ICONS = {
    bookmarkPlus: ['M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z', 'M12 7v6', 'M9 10h6'],
    loader: ['M21 12a9 9 0 1 1-6.219-8.56'],
    check: ['M20 6 9 17l-5-5'],
    bookmarkCheck: ['m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z', 'm9 10 2 2 4-4'],
    alert: ['M12 8v4', 'M12 16h.01', 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0'],
    triangle: ['m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3', 'M12 9v4', 'M12 17h.01'],
    clock: ['M12 6v6l4 2', 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0'],
    logIn: ['m10 17 5-5-5-5', 'M15 12H3', 'M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4'],
    external: ['M15 3h6v6', 'M10 14 21 3', 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6'],
    close: ['M18 6 6 18', 'm6 6 12 12'],
    globe: ['M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0', 'M12 3a14.5 14.5 0 0 0 0 18 14.5 14.5 0 0 0 0-18', 'M3 12h18'],
    pointer: ['M14 4.1 12 6', 'm5.1 8-2.9-.8', 'm6 12-1.9 2', 'M7.2 2.2 8 5.1', 'M9.037 9.69a.498.498 0 0 1 .653-.653l11 4.5a.5.5 0 0 1-.074.949l-4.349 1.041a1 1 0 0 0-.74.739l-1.04 4.35a.5.5 0 0 1-.95.074z'],
  };

  const SITE_NAMES = { twitter: 'X', instagram: 'Instagram', youtube: 'YouTube', pinterest: 'Pinterest', reddit: 'Reddit' };
  const NOTICES = {
    'instagram-not-post': { title: 'This is the Instagram feed, not a post', text: 'Saving here would only save the feed address. Open a post, or right-click the post you want.' },
    'x-not-post': { title: 'This X page is not a single post', text: 'Saving here would only save the timeline. Open the post, or right-click the post you want.' },
  };

  function buildSaveUI(container, env) {
    const ex = root.inntoitExtract;
    const doc = container.ownerDocument;
    const NS = 'http://www.w3.org/2000/svg';
    const el = (tag, cls, text) => { const n = doc.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
    const icon = (name, extra = '') => {
      const svg = doc.createElementNS(NS, 'svg');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('class', `i ${extra}`.trim());
      svg.setAttribute('aria-hidden', 'true');
      for (const d of ICONS[name]) { const p = doc.createElementNS(NS, 'path'); p.setAttribute('d', d); svg.appendChild(p); }
      return svg;
    };
    const fill = (node, iconName, text, iconClass) => node.replaceChildren(icon(iconName, iconClass), doc.createTextNode(text));

    // ---------- layout ----------
    const app = el('div', 'app');
    const head = el('div', 'head');
    const brand = el('div', 'brand');
    const logo = el('img'); logo.src = env.logoUrl; logo.alt = '';
    brand.append(logo, el('span', null, 'inntoit'));
    const actions = el('div', 'head-actions');
    const openBtn = el('button', 'icon-btn'); openBtn.type = 'button'; openBtn.title = 'Open inntoit'; openBtn.setAttribute('aria-label', 'Open inntoit'); openBtn.append(icon('external'));
    actions.append(openBtn);
    if (env.showClose) {
      const closeBtn = el('button', 'icon-btn'); closeBtn.type = 'button'; closeBtn.title = 'Close (Esc)'; closeBtn.setAttribute('aria-label', 'Close'); closeBtn.append(icon('close'));
      closeBtn.addEventListener('click', () => env.close());
      actions.append(closeBtn);
    }
    head.append(brand, actions);

    const card = el('div', 'card');
    const page = el('div', 'page');
    const fav = el('div', 'fav'); fav.append(icon('globe'));
    const pageText = el('div', 'page-text');
    const pageTitle = el('div', 'page-title');
    const pageSub = el('div', 'page-sub');
    const chip = el('span', 'chip'); chip.hidden = true;
    const domain = el('span', 'domain');
    pageSub.append(chip, domain);
    pageText.append(pageTitle, pageSub);
    page.append(fav, pageText);

    const notice = el('div', 'notice'); notice.hidden = true; notice.setAttribute('role', 'status');
    const noticeBody = el('div');
    const noticeTitle = el('b'); const noticeText = el('p');
    const steps = el('div', 'steps');
    const kbd = el('span', 'kbd', 'Save inntoit');
    steps.append(icon('pointer'), el('span', null, 'Right-click a post'), el('span', null, '→'), kbd);
    noticeBody.append(noticeTitle, noticeText, steps);
    notice.append(icon('triangle'), noticeBody);

    const note = el('div');
    const textarea = el('textarea'); textarea.placeholder = 'Add a note or thought (optional)…'; textarea.setAttribute('aria-label', 'Note');
    const hint = el('div', 'hint', `${/Mac/i.test(navigator.platform) ? '⌘' : 'Ctrl'} + Enter to save`);
    note.append(textarea, hint);

    const btn = el('button', 'save'); btn.type = 'button';
    fill(btn, 'bookmarkPlus', 'Save to inntoit');
    const status = el('div', 'status'); status.hidden = true; status.setAttribute('role', 'status');

    card.append(page, notice, note, btn, status);
    app.append(head, card);
    container.append(app);

    openBtn.addEventListener('click', () => env.openApp('/dashboard'));

    // ---------- what is being saved ----------
    const { url, title, favIconUrl } = env.tab;
    pageTitle.textContent = ex.cleanTitle(title) || url || 'This tab';
    try { domain.textContent = new URL(url).hostname.replace(/^www\./, ''); } catch (e) { /* chrome:// pages etc. */ }
    if (favIconUrl && /^(https:|data:image\/)/.test(favIconUrl)) {
      const img = el('img'); img.alt = ''; img.src = favIconUrl;
      img.addEventListener('error', () => img.remove());
      img.addEventListener('load', () => fav.replaceChildren(img));
    }
    const site = ex.siteOf(url);
    if (SITE_NAMES[site]) { chip.textContent = SITE_NAMES[site]; chip.hidden = false; }

    // Feed / timeline: explain instead of saving the wrong address.
    const problem = /^https?:/.test(url) ? ex.pageProblem(url) : null;
    if (problem) {
      noticeTitle.textContent = NOTICES[problem].title;
      noticeText.textContent = NOTICES[problem].text;
      notice.hidden = false; note.hidden = true; btn.hidden = true;
      return { app, focus: () => {} };
    }
    if (!/^https?:/.test(url)) {
      note.hidden = true; btn.disabled = true;
      fill(btn, 'alert', 'This page can’t be saved');
      return { app, focus: () => {} };
    }

    // ---------- note ----------
    const grow = () => { textarea.style.height = 'auto'; textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`; };
    textarea.addEventListener('input', grow);
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); if (!btn.disabled) save(); }
    });

    function showStatus(kind, iconName, text, action) {
      status.className = `status ${kind}`;
      status.replaceChildren(icon(iconName), doc.createTextNode(text));
      if (action) {
        const a = el('button', null, action.label); a.type = 'button';
        a.addEventListener('click', action.onClick);
        status.append(a);
      }
      status.hidden = false;
    }

    async function save() {
      btn.disabled = true;
      fill(btn, 'loader', 'Saving…', 'spin');
      status.hidden = true;

      // Same rules as right-click: a clean address, no title and no type (the server decides).
      const igPost = ex.instagramPostUrl(url, url);
      const capture = igPost ? await env.captureInstagram() : null;
      const pageMeta = !igPost && !site ? await env.capturePage() : null;
      const personalNote = textarea.value.trim();
      const payload = {
        url: igPost || ex.cleanUrl(url),
        ...(personalNote && { content: personalNote }),
        ...(capture && { capture }),
        ...(pageMeta && { page: pageMeta }),
      };

      try {
        const { status: code, data } = await env.send(payload);
        if (code >= 200 && code < 300) {
          fill(btn, 'check', 'Saved');
          const id = data && data.data && data.data.id;
          showStatus('ok', 'check', 'Added to inntoit', { label: 'Open', onClick: () => env.openApp(id ? `/dashboard?b=${id}` : '/dashboard') });
          setTimeout(() => env.close(), 1600);
        } else if (code === 409) {
          fill(btn, 'bookmarkCheck', 'Already saved');
          const id = data && data.existing && data.existing.id;
          showStatus('dup', 'bookmarkCheck', 'This is already in inntoit', { label: 'Open', onClick: () => env.openApp(id ? `/dashboard?b=${id}` : '/dashboard') });
        } else if (code === 401) {
          btn.disabled = false; fill(btn, 'bookmarkPlus', 'Try again');
          showStatus('err', 'logIn', 'Sign in to inntoit first', { label: 'Sign in', onClick: () => env.openApp('/login') });
        } else if (code === 429) {
          btn.disabled = false; fill(btn, 'bookmarkPlus', 'Try again');
          showStatus('dup', 'clock', 'Too many saves. Wait a minute.');
        } else {
          throw new Error('failed');
        }
      } catch (e) {
        btn.disabled = false; fill(btn, 'bookmarkPlus', 'Try again');
        showStatus('err', 'alert', navigator.onLine ? 'Could not save. Try again.' : 'You are offline.');
      }
    }

    btn.addEventListener('click', save);
    return { app, focus: () => textarea.focus() };
  }

  root.inntoitUI = { CSS, buildSaveUI };
})(typeof globalThis !== 'undefined' ? globalThis : this);
