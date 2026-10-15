import type { XPost, XPostCore, XEntity, XAuthor, XPhoto, XVideo, XLinkCard, XCounts } from '@/types';
import { safeFetch } from '@/utils/safeFetch';

// Reads one X post from the free sources and turns it into our own trimmed snapshot (bookmarks.post_data).
//   1. X's embed data (cdn.syndication.twimg.com, what react-tweet uses): author, entities, media, quoted post, link card.
//   2. vxtwitter: the full text of long posts, repost counts, and the fallback when (1) fails.
// Only addresses are kept, never X's files. Read with our own raw types so nothing (like `card`) is dropped.

// ---------- raw shapes (only the parts we read) ----------
type RawIndices = { indices: [number, number] };
type RawUser = {
  name?: string; screen_name?: string; profile_image_url_https?: string;
  verified?: boolean; is_blue_verified?: boolean; verified_type?: string;
};
type RawVariant = { content_type?: string; url?: string; bitrate?: number };
type RawMedia = {
  type?: 'photo' | 'video' | 'animated_gif'; media_url_https?: string; ext_alt_text?: string;
  original_info?: { width?: number; height?: number };
  video_info?: { aspect_ratio?: [number, number]; duration_millis?: number; variants?: RawVariant[] };
};
type RawBinding = { string_value?: string; image_value?: { url?: string } };
type RawCard = { name?: string; url?: string; binding_values?: Record<string, RawBinding | undefined> };
export type RawSyndicationTweet = {
  __typename?: string;
  id_str?: string;
  text?: string;
  display_text_range?: [number, number];
  created_at?: string;
  entities?: {
    urls?: (RawIndices & { url?: string; expanded_url?: string; display_url?: string })[];
    user_mentions?: (RawIndices & { screen_name?: string })[];
    hashtags?: (RawIndices & { text?: string })[];
    symbols?: (RawIndices & { text?: string })[];
    media?: RawIndices[];
  };
  user?: RawUser;
  mediaDetails?: RawMedia[];
  quoted_tweet?: RawSyndicationTweet;
  card?: RawCard;
  note_tweet?: unknown;          // present when the post is longer than the shown text
  favorite_count?: number;
  conversation_count?: number;
  tombstone?: unknown;
};
type RawVxMedia = { type?: string; url?: string; thumbnail_url?: string; altText?: string | null; size?: { width?: number; height?: number }; duration_millis?: number };
export type RawVxTweet = {
  tweetID?: string; text?: string; date_epoch?: number;
  user_name?: string; user_screen_name?: string; user_profile_image_url?: string;
  likes?: number; replies?: number; retweets?: number;
  media_extended?: RawVxMedia[];
  qrt?: RawVxTweet | null;
};

// ---------- helpers ----------
const HANDLE = /^[A-Za-z0-9_]{1,15}$/;
const MAX_TEXT = 25_000;

const isHttps = (u: unknown): u is string => {
  if (typeof u !== 'string' || u.length > 2048) return false;
  try { return new URL(u).protocol === 'https:'; } catch { return false; }
};
const num = (n: unknown) => (typeof n === 'number' && Number.isFinite(n) && n >= 0 ? Math.floor(n) : undefined);
const str = (s: unknown, max = 500) => (typeof s === 'string' && s.trim() ? s.trim().slice(0, max) : null);

const ENTITY_MAP: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&apos;': "'" };

// X sends text with &amp; &lt; &gt; encoded, and entity offsets counted in characters of that encoded text.
// Decodes the text and moves every offset along, so offsets match the decoded text.
function decodeWithOffsets(chars: string[], entities: XEntity[]): { text: string; entities: XEntity[] } {
  const out: string[] = [];
  const map: number[] = [];          // old index -> new index
  for (let i = 0; i < chars.length;) {
    map[i] = out.length;
    let matched = false;
    if (chars[i] === '&') {
      for (const [k, v] of Object.entries(ENTITY_MAP)) {
        if (chars.slice(i, i + k.length).join('') === k) {
          for (let j = 1; j < k.length; j++) map[i + j] = out.length;
          out.push(v);
          i += k.length;
          matched = true;
          break;
        }
      }
    }
    if (!matched) { out.push(chars[i]); i++; }
  }
  map[chars.length] = out.length;
  return {
    text: out.join(''),
    entities: entities.map((e) => ({ ...e, start: map[e.start], end: map[e.end] })),
  };
}

const decodeText = (s: string) => decodeWithOffsets(Array.from(s), []).text;

function author(u: RawUser | undefined): XAuthor | null {
  const handle = u?.screen_name;
  if (!handle || !HANDLE.test(handle)) return null;
  const avatar = isHttps(u.profile_image_url_https) ? u.profile_image_url_https.replace(/_normal(\.\w+)$/, '_200x200$1') : null;
  const vt = (u.verified_type || '').toLowerCase();
  const verified_type: XAuthor['verified_type'] =
    vt === 'business' ? 'business' : vt === 'government' ? 'government' : u.is_blue_verified ? 'blue' : u.verified ? 'legacy' : null;
  return { name: str(u.name, 100) || handle, handle, avatar, verified: verified_type !== null, verified_type };
}

// Best mp4 for playing in a card: the sharpest one up to ~720p (keeps the viewer's data use sane), never the m3u8 playlist.
function bestMp4(variants: RawVariant[] = []): string | null {
  const mp4 = variants.filter((v) => v.content_type === 'video/mp4' && isHttps(v.url));
  if (!mp4.length) return null;
  mp4.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
  return (mp4.find((v) => (v.bitrate || 0) <= 2_500_000) || mp4[mp4.length - 1]).url!;
}

function media(list: RawMedia[] = []): { photos: XPhoto[]; video: XVideo | null } {
  const photos: XPhoto[] = [];
  let video: XVideo | null = null;
  for (const m of list) {
    if (m.type === 'photo' && isHttps(m.media_url_https)) {
      photos.push({ url: m.media_url_https, width: num(m.original_info?.width) || 1, height: num(m.original_info?.height) || 1, alt: str(m.ext_alt_text, 1000) });
    } else if ((m.type === 'video' || m.type === 'animated_gif') && !video && isHttps(m.media_url_https)) {
      const ar = m.video_info?.aspect_ratio;
      video = {
        poster: m.media_url_https,
        mp4: bestMp4(m.video_info?.variants),
        aspect: ar && num(ar[0]) && num(ar[1]) ? [ar[0], ar[1]] : [num(m.original_info?.width) || 16, num(m.original_info?.height) || 9],
        duration_ms: m.type === 'video' ? num(m.video_info?.duration_millis) ?? null : null,
        gif: m.type === 'animated_gif',
      };
    }
  }
  return { photos: photos.slice(0, 4), video };
}

function linkCard(card: RawCard | undefined, urls: { url?: string; expanded_url?: string }[] = []): XLinkCard | null {
  if (!card?.binding_values) return null;
  // Polls, app cards and players are not link previews.
  if (!/^summary/.test(card.name || '')) return null;
  const b = card.binding_values;
  const sv = (k: string) => str(b[k]?.string_value, 500);
  const tco = sv('card_url') || card.url || '';
  const expanded = urls.find((u) => u.url === tco)?.expanded_url;
  const url = isHttps(expanded) ? expanded : isHttps(tco) ? tco : null;
  if (!url) return null;
  const image = [b.summary_photo_image_large, b.photo_image_full_size_large, b.thumbnail_image_large, b.thumbnail_image]
    .map((x) => x?.image_value?.url).find(isHttps) || null;
  return { url, title: sv('title'), description: sv('description'), domain: sv('vanity_url') || sv('domain'), image };
}

// Entities from X's data, limited to the shown range and moved so offsets start at 0.
function syndicationEntities(t: RawSyndicationTweet, start: number, end: number): XEntity[] {
  const out: XEntity[] = [];
  const inRange = (i: [number, number] | undefined): i is [number, number] =>
    Array.isArray(i) && i[0] >= start && i[1] <= end && i[0] < i[1];
  for (const u of t.entities?.urls || []) {
    if (inRange(u.indices) && isHttps(u.expanded_url)) out.push({ type: 'url', start: u.indices[0] - start, end: u.indices[1] - start, url: u.expanded_url, display: str(u.display_url, 200) || u.expanded_url });
  }
  for (const m of t.entities?.user_mentions || []) {
    if (inRange(m.indices) && m.screen_name && HANDLE.test(m.screen_name)) out.push({ type: 'mention', start: m.indices[0] - start, end: m.indices[1] - start, handle: m.screen_name });
  }
  for (const h of t.entities?.hashtags || []) {
    if (inRange(h.indices) && h.text) out.push({ type: 'hashtag', start: h.indices[0] - start, end: h.indices[1] - start, tag: h.text.slice(0, 140) });
  }
  for (const s of t.entities?.symbols || []) {
    if (inRange(s.indices) && s.text) out.push({ type: 'symbol', start: s.indices[0] - start, end: s.indices[1] - start, tag: s.text.slice(0, 20) });
  }
  return out.sort((a, b) => a.start - b.start);
}

// Mentions, hashtags and links found in plain text (vxtwitter has no entities). Offsets in characters.
export function entitiesFromText(text: string): XEntity[] {
  const chars = Array.from(text);
  const out: XEntity[] = [];
  const re = /https?:\/\/[^\s]+|(?<![\w@])@[A-Za-z0-9_]{1,15}|(?<![\w#])#[\p{L}\p{N}_]+/gu;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const start = Array.from(text.slice(0, m.index)).length;
    const end = start + Array.from(m[0]).length;
    if (end > chars.length) break;
    const v = m[0];
    if (v.startsWith('@')) out.push({ type: 'mention', start, end, handle: v.slice(1) });
    else if (v.startsWith('#')) out.push({ type: 'hashtag', start, end, tag: v.slice(1) });
    else if (/^https?:\/\/[^\s]+$/.test(v)) out.push({ type: 'url', start, end, url: v, display: v.replace(/^https?:\/\/(www\.)?/, '').slice(0, 40) });
  }
  return out;
}

const postUrl = (handle: string, id: string) => `https://x.com/${handle}/status/${id}`;

// ---------- parsers ----------
function parseSyndicationCore(t: RawSyndicationTweet): XPostCore | null {
  if (!t || t.__typename === 'TweetTombstone' || t.tombstone) return null;
  const id = t.id_str;
  const a = author(t.user);
  if (!id || !/^\d{1,25}$/.test(id) || !a || typeof t.text !== 'string') return null;

  const all = Array.from(t.text);
  const range = Array.isArray(t.display_text_range) ? t.display_text_range : [0, all.length];
  const start = range[0];
  let end = Math.min(range[1], all.length);
  // Older posts count the trailing media link as shown text: cut it (and the space before it) off.
  for (const m of t.entities?.media || []) {
    if (Array.isArray(m.indices) && m.indices[0] >= start && m.indices[0] < end && all.slice(m.indices[1], end).join('').trim() === '') end = m.indices[0];
  }
  while (end > start && /\s/.test(all[end - 1])) end--;
  // The shown text only: no leading "@reply" handles, no trailing pic.x.com media link.
  const decoded = decodeWithOffsets(all.slice(start, end), syndicationEntities(t, start, end));
  const { photos, video } = media(t.mediaDetails);
  const counts: XCounts = {};
  if (num(t.conversation_count) !== undefined) counts.replies = num(t.conversation_count);
  if (num(t.favorite_count) !== undefined) counts.likes = num(t.favorite_count);

  return {
    id,
    url: postUrl(a.handle, id),
    author: a,
    text: decoded.text.slice(0, MAX_TEXT),
    entities: decoded.entities,
    full_text: null,
    truncated: !!t.note_tweet,
    created_at: t.created_at && !isNaN(Date.parse(t.created_at)) ? new Date(t.created_at).toISOString() : '',
    photos,
    video,
    card: linkCard(t.card, t.entities?.urls),
    counts,
  };
}

export function parseSyndication(raw: unknown): XPost | null {
  const t = raw as RawSyndicationTweet;
  const core = parseSyndicationCore(t);
  if (!core) return null;
  const quoted = t.quoted_tweet ? parseSyndicationCore(t.quoted_tweet) : null;
  return { v: 1, source: 'syndication', ...core, quoted };
}

function parseVxCore(t: RawVxTweet): XPostCore | null {
  const handle = t?.user_screen_name;
  const id = t?.tweetID;
  if (!handle || !HANDLE.test(handle) || !id || !/^\d{1,25}$/.test(id) || typeof t.text !== 'string') return null;
  const text = decodeText(t.text).slice(0, MAX_TEXT);
  const photos: XPhoto[] = [];
  let video: XVideo | null = null;
  for (const m of t.media_extended || []) {
    const w = num(m.size?.width) || 1;
    const h = num(m.size?.height) || 1;
    if (m.type === 'image' && isHttps(m.url)) photos.push({ url: m.url, width: w, height: h, alt: str(m.altText, 1000) });
    else if ((m.type === 'video' || m.type === 'gif') && !video && isHttps(m.thumbnail_url)) {
      video = { poster: m.thumbnail_url, mp4: isHttps(m.url) && /\.mp4(\?|$)/.test(m.url) ? m.url : null, aspect: [w, h], duration_ms: num(m.duration_millis) ?? null, gif: m.type === 'gif' };
    }
  }
  const counts: XCounts = {};
  if (num(t.replies) !== undefined) counts.replies = num(t.replies);
  if (num(t.retweets) !== undefined) counts.reposts = num(t.retweets);
  if (num(t.likes) !== undefined) counts.likes = num(t.likes);
  return {
    id,
    url: postUrl(handle, id),
    author: {
      name: str(t.user_name, 100) || handle,
      handle,
      avatar: isHttps(t.user_profile_image_url) ? t.user_profile_image_url.replace(/_normal(\.\w+)$/, '_200x200$1') : null,
      verified: false,
      verified_type: null,
    },
    text,
    entities: entitiesFromText(text),
    full_text: null,
    truncated: false,
    created_at: num(t.date_epoch) ? new Date(t.date_epoch! * 1000).toISOString() : '',
    photos: photos.slice(0, 4),
    video,
    card: null,
    counts,
  };
}

export function parseVx(raw: unknown): XPost | null {
  const t = raw as RawVxTweet;
  const core = parseVxCore(t);
  if (!core) return null;
  return { v: 1, source: 'vxtwitter', ...core, quoted: t.qrt ? parseVxCore(t.qrt) : null };
}

// The embed snapshot, improved with vxtwitter: the whole text of a long post and the repost count.
export function mergeWithVx(post: XPost, vx: XPost | null): XPost {
  if (!vx || vx.id !== post.id) return post;
  const merged: XPost = { ...post, counts: { ...post.counts, ...vx.counts } };
  if (post.truncated) {
    const shown = post.text.replace(/\s+/g, ' ').trim().replace(/…$/, '');
    const whole = vx.text;
    if (whole.length > post.text.length && whole.replace(/\s+/g, ' ').startsWith(shown.slice(0, 40))) {
      merged.full_text = whole;
      merged.truncated = false;
    }
  }
  return merged;
}

// "Name on X: first line of the post"
export function xTitle(p: XPost): string {
  const first = (p.full_text || p.text).split('\n').map((l) => l.replace(/https?:\/\/\S+/g, '').trim()).find(Boolean) || '';
  const short = first.length > 100 ? `${first.slice(0, 99).trimEnd()}…` : first;
  return short ? `${p.author.name} on X: ${short}` : `${p.author.name} on X`;
}

// ---------- fetching ----------
// The token react-tweet sends with the embed request (made from the post id).
export function syndicationToken(id: string): string {
  return ((Number(id) / 1e15) * Math.PI).toString(6 ** 2).replace(/(0+|\.)/g, '');
}

export type SnapshotResult =
  | { ok: true; post: XPost }
  | { ok: false; reason: 'deleted' | 'unavailable' };

async function getJson(url: string): Promise<unknown | null> {
  try {
    const res = await safeFetch(url, { signal: AbortSignal.timeout(6000), headers: { Accept: 'application/json' } });
    if (!res.ok) return res.status === 404 ? { __typename: 'TweetTombstone' } : null;
    return await res.json();
  } catch {
    return null;
  }
}

// Reads post `id`. Never throws.
export async function fetchXSnapshot(id: string): Promise<SnapshotResult> {
  if (!/^\d{1,25}$/.test(id)) return { ok: false, reason: 'unavailable' };
  const [synRaw, vxRaw] = await Promise.all([
    getJson(`https://cdn.syndication.twimg.com/tweet-result?id=${id}&lang=en&token=${syndicationToken(id)}`),
    getJson(`https://api.vxtwitter.com/i/status/${id}`),
  ]);
  const vx = vxRaw ? parseVx(vxRaw) : null;
  const syn = synRaw ? parseSyndication(synRaw) : null;
  if (syn) return { ok: true, post: mergeWithVx(syn, vx) };
  // A deleted / private post: the embed says so; vxtwitter can't read it either.
  const tomb = (synRaw as RawSyndicationTweet | null)?.__typename === 'TweetTombstone';
  if (vx && !tomb) return { ok: true, post: vx };
  return { ok: false, reason: tomb ? 'deleted' : 'unavailable' };
}
