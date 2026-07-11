// src/hooks/useBookmarks.ts
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Bookmark } from '@/types';
import toast from 'react-hot-toast';

export const useBookmarks = (initialBookmarks: Bookmark[]) => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks);
  const supabase = createClient();

  // Add Bookmark Logic
  const addBookmark = async (newBookmark: Omit<Bookmark, 'id' | 'created_at' | 'user_id'>) => {
    const { data, error } = await supabase.from('bookmarks').insert([newBookmark]).select();
    if (error) {
      toast.error("Failed to save bookmark");
      return;
    }
    setBookmarks([...bookmarks, ...data]);
    toast.success("Bookmark saved!");
  };

  // Delete Bookmark Logic
  const deleteBookmark = async (id: number) => {
    const { error } = await supabase.from('bookmarks').delete().eq('id', id);
    if (error) {
      toast.error("Failed to delete");
      return;
    }
    setBookmarks(bookmarks.filter(b => b.id !== id));
    toast.success("Bookmark removed");
  };

  // Update Bookmark Logic
  const updateBookmark = async (id: number, updates: Partial<Bookmark>) => {
    const { error } = await supabase.from('bookmarks').update(updates).eq('id', id);
    if (error) {
      toast.error("Failed to update");
      return;
    }
    setBookmarks(bookmarks.map(b => b.id === id ? { ...b, ...updates } : b));
    toast.success("Updated!");
  };

  return { bookmarks, addBookmark, deleteBookmark, updateBookmark };
};