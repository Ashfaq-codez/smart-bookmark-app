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
};