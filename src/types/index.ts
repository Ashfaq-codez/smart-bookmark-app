export type Bookmark = {
  id: number;
  title: string;
  url: string;
  category: string;
  sub_category?: string | null;
  created_at: string;
  user_id: string;
  // Newly added fields for the universal capture engine
  description?: string | null;
  image_url?: string | null;
  tags?: string[];
  type?: string;
}