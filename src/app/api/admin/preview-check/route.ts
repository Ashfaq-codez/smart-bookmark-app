import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { isAdmin } from '@/lib/admin';
import { findPreview } from '@/lib/linkPreview';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Owner only. /api/admin/preview-check?url=<address>: tries every way of getting a picture for that page and
// reports each step and why it failed. Nothing is saved (a picture it makes is deleted again).
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const url = new URL(request.url).searchParams.get('url') || '';
  if (!/^https?:\/\//.test(url) || url.length > 2048) return NextResponse.json({ error: 'Add ?url=https://… to the address' }, { status: 400 });

  const started = Date.now();
  try {
    const { stored, steps } = await findPreview(supabase, user.id, { url, image_url: null }, true);
    return NextResponse.json({ url, picture: stored ? 'found (deleted again, this is only a check)' : 'none', steps, seconds: (Date.now() - started) / 1000, node: process.version },
      { headers: { 'Cache-Control': 'no-store' } });
  } catch (e: any) {
    return NextResponse.json({ url, error: String(e?.message || e), node: process.version }, { status: 500 });
  }
}
