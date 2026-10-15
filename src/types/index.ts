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
  // Stored snapshot of a social post (X, Instagram or YouTube). null = not read yet. Added by migration 0005.
  // ALWAYS read it through the getters in src/lib/postData.ts (src/lib/postData.ts), which check the platform.
  post_data?: PostData | null;
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
  platform?: 'x';                                      // missing on X snapshots stored before Instagram ones existed
  source: 'syndication' | 'vxtwitter';
  quoted: XPostCore | null;                            // one level only
};

// ---------- Instagram snapshot (bookmarks.post_data with platform 'instagram') ----------
export type InstagramPost = {
  v: 1;
  platform: 'instagram';
  handle: string;                                      // checked: letters, digits, . and _, max 30
  handle_source: 'extension' | 'url' | 'page';         // where the handle came from (see src/lib/instagramMeta.ts)
  caption: string | null;
  is_video: boolean;
};

// ---------- YouTube snapshot (bookmarks.post_data with platform 'youtube') ----------
export type YouTubePost = {
  v: 1;
  platform: 'youtube';
  id: string;                                          // the 11-character video id
  title: string;
  channel: string | null;
};

// ---------- Reddit snapshot (bookmarks.post_data with platform 'reddit') ----------
export type RedditPost = {
  v: 1;
  platform: 'reddit';
  id: string;                                          // post id without the t3_ prefix
  subreddit: string;                                   // name without r/
  subreddit_icon: string | null;
  author: string | null;                               // name without u/
  title: string;
  body: string | null;                                 // plain text of a text post (shortened)
  image: string | null;                                // picture of an image post / link preview
  link: string | null;                                 // the outside address of a link post
  kind: 'text' | 'image' | 'video' | 'link' | 'gallery' | 'other';
  nsfw: boolean;                                       // the card never shows its picture
  score: number | null;
  created_at: string | null;
};

// ---------- Article snapshot: Substack / Medium (bookmarks.post_data with platform 'substack' | 'medium') ----------
export type ArticlePost = {
  v: 1;
  platform: 'substack' | 'medium';
  title: string;
  subtitle: string | null;
  author: string | null;
  publication: string | null;                          // newsletter / publication name
  image: string | null;
  published_at: string | null;
  read_minutes: number | null;
};

// ---------- Substack Note snapshot (bookmarks.post_data with platform 'substack-note') ----------
// A short Substack post (substack.com/@handle/note/c-<id>), shown like a social post, not an article.
export type SubstackNotePost = {
  v: 1;
  platform: 'substack-note';
  id: string;
  author: { name: string; handle: string | null; avatar: string | null };
  text: string;
  images: { url: string; width: number; height: number }[];
  created_at: string | null;
  likes: number | null;
  restacks: number | null;
  replies: number | null;
};

export type PostData = XPost | InstagramPost | YouTubePost | RedditPost | ArticlePost | SubstackNotePost;
