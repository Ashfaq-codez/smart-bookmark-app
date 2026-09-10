import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Bookmark } from '@/types';
import toast from 'react-hot-toast';

export const useBookmarks = (initialBookmarks: Bookmark[]) => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks);
  const supabase = createClient();

  // ---> BACKGROUND SYNC ENGINE (Realtime + Focus Revalidation) <---
  useEffect(() => {
    // 1. The Realtime Subscription (Catches updates if the tab is active/awake)
    const channel = supabase
      .channel('realtime_bookmarks')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookmarks' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setBookmarks((prev) => {
              // Deduplicate: Don't add if it already exists in state
              if (prev.some((b) => b.id === payload.new.id)) return prev;
              return [payload.new as Bookmark, ...prev];
            });
            toast.success('Saved to Hub!');
          } else if (payload.eventType === 'DELETE') {
            setBookmarks((prev) => prev.filter((b) => b.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            setBookmarks((prev) => prev.map((b) => b.id === payload.new.id ? { ...b, ...payload.new as Bookmark } : b));
          }
        }
      )
      .subscribe();

    // 2. FOCUS REVALIDATION: Fetches fresh data when returning to a sleeping tab
    const revalidateOnFocus = async () => {
      const { data, error } = await supabase
        .from('bookmarks')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (data && !error) {
        setBookmarks(data);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        revalidateOnFocus();
      }
    };

    // Attach listeners
    window.addEventListener('focus', revalidateOnFocus);
    window.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup listeners and subscription on unmount
    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('focus', revalidateOnFocus);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [supabase]);

  // Add Single Bookmark Logic
  const addBookmark = async (newBookmark: Omit<Bookmark, 'id' | 'created_at' | 'user_id'>) => {
    const { data, error } = await supabase.from('bookmarks').insert([newBookmark]).select();
    if (error) {
      toast.error("Failed to save bookmark");
      return;
    }
    
    setBookmarks((prev) => {
      // Deduplicate in case Realtime beat us to it
      if (prev.some((b) => b.id === data[0].id)) return prev;
      return [data[0], ...prev];
    });
    toast.success("Bookmark saved!");
  };

  // Add Bulk Bookmarks Logic
  const addBulkBookmarks = async (newBookmarks: Omit<Bookmark, 'id' | 'created_at' | 'user_id'>[]) => {
    const { data, error } = await supabase.from('bookmarks').insert(newBookmarks).select();
    if (error) {
      toast.error("Failed to save bulk bookmarks");
      return;
    }
    
    setBookmarks((prev) => {
      // Filter out any that Realtime already added
      const newItems = data.filter((d) => !prev.some((p) => p.id === d.id));
      return [...newItems, ...prev];
    });
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
    // Removed the toast here since your BookmarkCard update logic already throws a success toast!
  };

  return { 
    bookmarks, 
    addBookmark, 
    addBulkBookmarks, 
    deleteBookmark, 
    updateBookmark 
  };
};