// src/hooks/useBookmarks.ts
import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Bookmark } from '@/types';
import { normalizeUrl } from '@/utils/normalizeUrl';
import toast from 'react-hot-toast';

// Realtime keeps the list in sync while the tab is open. A full re-fetch is only a safety net
// for when the tab slept long enough that the websocket may have missed events.
const STALE_AFTER_MS = 5 * 60 * 1000;

export const useBookmarks = (initialBookmarks: Bookmark[]) => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks);

  // Memoize the client to prevent infinite WebSocket reconnects on every render
  const supabase = useMemo(() => createClient(), []);

  // ---> BACKGROUND SYNC ENGINE (Realtime + long-sleep revalidation) <---
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let hiddenAt: number | null = null;
    let revalidating = false;

    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      channel = supabase
        .channel(`realtime_bookmarks_${user.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'bookmarks', filter: `user_id=eq.${user.id}` },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              const newItem = payload.new as Bookmark;
              setBookmarks((prev) => {
                const idExists = prev.some((b) => b.id === newItem.id);
                if (idExists) return prev;

                if (newItem.type === 'link' || !newItem.type) {
                  const targetUrl = normalizeUrl(newItem.url);
                  const urlExists = prev.some(
                    (b) => (b.type === 'link' || !b.type) && normalizeUrl(b.url) === targetUrl
                  );
                  if (urlExists) return prev;
                }

                return [newItem, ...prev];
              });
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
    };

    setupRealtime();

    const revalidate = async () => {
      if (revalidating) return;
      revalidating = true;
      try {
        const { data, error } = await supabase
          .from('bookmarks')
          .select('*')
          .order('created_at', { ascending: false });
        if (data && !error) setBookmarks(data);
      } finally {
        revalidating = false;
      }
    };

    // Previously this re-downloaded EVERY bookmark on every window focus AND every visibility change
    // (two full fetches per tab switch). Now: only after the tab was hidden for a long time.
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now();
        return;
      }
      if (hiddenAt !== null && Date.now() - hiddenAt > STALE_AFTER_MS) revalidate();
      hiddenAt = null;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (channel) supabase.removeChannel(channel);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [supabase]);

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
    deleteBookmark,
    updateBookmark,
  };
};