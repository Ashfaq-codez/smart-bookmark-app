// src/hooks/useBookmarks.ts
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Bookmark } from '@/types';
import { normalizeUrl } from '@/utils/normalizeUrl';
import toast from 'react-hot-toast';

export const useBookmarks = (initialBookmarks: Bookmark[]) => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks);
  const supabase = createClient();

  // ---> BACKGROUND SYNC ENGINE (Realtime + Focus Revalidation) <---
  useEffect(() => {
    // 1. The Realtime Subscription (Syncs insertions, deletes, updates across tabs/devices)
    const channel = supabase
      .channel('realtime_bookmarks')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookmarks' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newItem = payload.new as Bookmark;
            setBookmarks((prev) => {
              // Deduplicate by ID
              const idExists = prev.some((b) => b.id === newItem.id);
              if (idExists) return prev;

              // Deduplicate by normalized URL if it's a link
              if (newItem.type === 'link' || !newItem.type) {
                const targetUrl = normalizeUrl(newItem.url);
                const urlExists = prev.some(
                  (b) => (b.type === 'link' || !b.type) && normalizeUrl(b.url) === targetUrl
                );
                if (urlExists) return prev;
              }

              return [newItem, ...prev];
            });
            toast.success('Saved to Hub!');
          } else if (payload.eventType === 'DELETE') {
            setBookmarks((prev) => prev.filter((b) => b.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            setBookmarks((prev) =>
              prev.map((b) => (b.id === payload.new.id ? { ...b, ...(payload.new as Bookmark) } : b))
            );
          }
        }
      )
      .subscribe();

    // 2. FOCUS REVALIDATION: Silently fetches fresh data when coming back to a sleeping tab
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

    window.addEventListener('focus', revalidateOnFocus);
    window.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('focus', revalidateOnFocus);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [supabase]);

  // Add Single Bookmark Logic
  const addBookmark = async (newBookmark: Omit<Bookmark, 'id' | 'created_at' | 'user_id'>) => {
    const isLink = newBookmark.type === 'link' || !newBookmark.type;
    const cleanUrl = newBookmark.url ? normalizeUrl(newBookmark.url) : '';

    // Pre-check client state
    if (isLink && cleanUrl) {
      const alreadyExists = bookmarks.some(
        (b) => (b.type === 'link' || !b.type) && normalizeUrl(b.url) === cleanUrl
      );
      if (alreadyExists) {
        toast.error('This bookmark already exists!');
        return;
      }
    }

    const payload = {
      ...newBookmark,
      url: cleanUrl || newBookmark.url,
    };

    const { data, error } = await supabase.from('bookmarks').insert([payload]).select();
    if (error) {
      // 23505 is PostgreSQL's unique constraint violation code
      if (error.code === '23505') {
        toast.error('This bookmark already exists!');
        return;
      }
      toast.error('Failed to save bookmark');
      return;
    }

    setBookmarks((prev) => {
      if (prev.some((b) => b.id === data[0].id)) return prev;
      return [data[0], ...prev];
    });
    toast.success('Bookmark saved!');
  };

  // Add Bulk Bookmarks Logic
  const addBulkBookmarks = async (newBookmarks: Omit<Bookmark, 'id' | 'created_at' | 'user_id'>[]) => {
    const existingUrlSet = new Set(
      bookmarks
        .filter((b) => b.type === 'link' || !b.type)
        .map((b) => normalizeUrl(b.url))
    );

    // Filter out items already in local state
    const uniqueToInsert = newBookmarks
      .map((item) => ({
        ...item,
        url: normalizeUrl(item.url),
      }))
      .filter((item) => !existingUrlSet.has(item.url));

    if (uniqueToInsert.length === 0) {
      toast.error('All bookmarks already exist in your hub!');
      return;
    }

    if (uniqueToInsert.length < newBookmarks.length) {
      toast(`Skipped ${newBookmarks.length - uniqueToInsert.length} duplicates.`, { icon: 'ℹ️' });
    }

    const { data, error } = await supabase.from('bookmarks').insert(uniqueToInsert).select();
    if (error) {
      toast.error('Failed to save bulk bookmarks');
      return;
    }

    setBookmarks((prev) => {
      const newItems = data.filter((d) => !prev.some((p) => p.id === d.id));
      return [...newItems, ...prev];
    });
    toast.success(`${data.length} bookmarks saved!`);
  };

  // Delete Bookmark Logic
  const deleteBookmark = async (id: number) => {
    const { error } = await supabase.from('bookmarks').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete');
      return;
    }
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
    toast.success('Bookmark removed');
  };

  // Update Bookmark Logic
  const updateBookmark = async (id: number, updates: Partial<Bookmark>) => {
    const payload = { ...updates };
    if (payload.url) {
      payload.url = normalizeUrl(payload.url);
    }

    const { error } = await supabase.from('bookmarks').update(payload).eq('id', id);
    if (error) {
      if (error.code === '23505') {
        toast.error('A bookmark with this URL already exists.');
        return;
      }
      toast.error('Failed to update');
      return;
    }
    setBookmarks((prev) => prev.map((b) => (b.id === id ? { ...b, ...payload } : b)));
  };

  return {
    bookmarks,
    addBookmark,
    addBulkBookmarks,
    deleteBookmark,
    updateBookmark,
  };
};