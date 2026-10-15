export type Bookmark = {
  id: number;
  title: string;
  url: string;
  category: string;
  sub_category?: string | null;
  created_at: string;
  updated_at?: string;
  user_id: string;
  description?: string | null;
  // Full note body. NOT present on cards in the list; it is loaded when a bookmark is opened.
  content?: string | null; 
  // Trimmed copy of the note body made by the database, used by the cards in the list.
  content_preview?: string | null;
  image_url?: string | null;
  tags?: string[];
  // Expanded types to support native social media cards
  type?: 'link' | 'note' | 'image' | 'video' | 'pdf' | 'file' | 'twitter' | 'instagram' | 'youtube' | 'pinterest' | 'github' | 'linkedin' | string;
  file_path?: string | null; 
  file_type?: string | null;
  // Set when the save is pinned to the top; the time it was pinned. null / missing = not pinned.
  pinned_at?: string | null;
  // X posts: stored snapshot of the post (see XPost). null = not read yet. Added by migration 0005.
  post_data?: XPost | null;
  post_data_fetched_at?: string | null;
  post_data_failed_at?: string | null;
};

// ---------- X post snapshot (bookmarks.post_data) ----------
// A trimmed copy of the post, read once from X's free embed data. Only addresses, never X's files.
export type XEntity =
  | { type: 'url'; start: number; end: number; url: string; display: string }   // t.co link -> real address
  | { type: 'mention'; start: number; end: number; handle: string }
  | { type: 'hashtag'; start: number; end: number; tag: string }
  | { type: 'symbol'; start: number; end: number; tag: string }
  | { type: 'media'; start: number; end: number };                              // trailing pic.x.com link, hidden

export type XAuthor = {
  name: string;
  handle: string;
  avatar: string | null;
  verified: boolean;                                   // any check mark
  verified_type: 'blue' | 'business' | 'government' | 'legacy' | null;
};

export type XPhoto = { url: string; width: number; height: number; alt: string | null };

export type XVideo = {
  poster: string;
  mp4: string | null;                                  // best mp4 (never the m3u8 playlist)
  aspect: [number, number];
  duration_ms: number | null;
  gif: boolean;                                        // animated GIF: loops silently
};

export type XLinkCard = { url: string; title: string | null; description: string | null; domain: string | null; image: string | null };

export type XCounts = { replies?: number; reposts?: number; likes?: number; quotes?: number; bookmarks?: number; views?: number };

export type XPostCore = {
  id: string;
  url: string;                                         // https://x.com/<handle>/status/<id>
  author: XAuthor;
  text: string;                                        // display text (may be cut for long posts)
  entities: XEntity[];                                 // offsets in characters (code points) of `text`
  full_text: string | null;                            // whole text of a long post, when known (no entities)
  truncated: boolean;                                  // text is cut and full_text is unknown: show "Show more on X"
  created_at: string;
  photos: XPhoto[];
  video: XVideo | null;
  card: XLinkCard | null;
  counts: XCounts;
};

export type XPost = XPostCore & {
  v: 1;                                                // snapshot format version
  source: 'syndication' | 'vxtwitter';
  quoted: XPostCore | null;                            // one level only
};