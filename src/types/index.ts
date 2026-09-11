export type Bookmark = {
  id: number;
  title: string;
  url: string;
  category: string;
  sub_category?: string | null;
  created_at: string;
  user_id: string;
  description?: string | null;
  content?: string | null; // <-- ADD THIS
  image_url?: string | null;
  tags?: string[];
  type?: string;
};