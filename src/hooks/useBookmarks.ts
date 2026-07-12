// src/hooks/useBookmarks.ts
import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Bookmark } from '@/types';
import toast from 'react-hot-toast';

export const useBookmarks = (initialBookmarks: Bookmark[]) => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks);
  const supabase = createClient();

  // Add Single Bookmark Logic
  const addBookmark = async (newBookmark: Omit<Bookmark, 'id' | 'created_at' | 'user_id'>) => {
    const { data, error } = await supabase.from('bookmarks').insert([newBookmark]).select();
    if (error) {
      toast.error("Failed to save bookmark");
      return;
    }
    setBookmarks((prev) => [...prev, ...data]);
    toast.success("Bookmark saved!");
  };

  // Add Bulk Bookmarks Logic
  const addBulkBookmarks = async (newBookmarks: Omit<Bookmark, 'id' | 'created_at' | 'user_id'>[]) => {
    const { data, error } = await supabase.from('bookmarks').insert(newBookmarks).select();
    if (error) {
      toast.error("Failed to save bulk bookmarks");
      return;
    }
    setBookmarks((prev) => [...prev, ...data]);
    toast.success(`${data.length} bookmarks saved!`);
  };

  // Delete Bookmark Logic
  const deleteBookmark = async (id: number) => {
    const { error } = await supabase.from('bookmarks').delete().eq('id', id);
    if (error) {
      toast.error("Failed to delete");
      return;
    }
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
    toast.success("Bookmark removed");
  };

  // Update Bookmark Logic
  const updateBookmark = async (id: number, updates: Partial<Bookmark>) => {
    const { error } = await supabase.from('bookmarks').update(updates).eq('id', id);
    if (error) {
      toast.error("Failed to update");
      return;
    }
    setBookmarks((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)));
    toast.success("Bookmark updated!");
  };

  return { 
    bookmarks, 
    addBookmark, 
    addBulkBookmarks, 
    deleteBookmark, 
    updateBookmark 
  };
};