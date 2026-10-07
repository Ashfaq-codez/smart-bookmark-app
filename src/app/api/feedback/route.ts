import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Kept in step with the checks in supabase/migrations/0007_feedback.sql
const FEEDBACK_TYPES = new Set(['idea', 'problem', 'other']);
const MAX_FEEDBACK_CHARS = 2000;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 });
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const type = typeof body?.type === 'string' ? body.type : '';
    const message = typeof body?.message === 'string' ? body.message.trim() : '';

    if (!FEEDBACK_TYPES.has(type)) {
      return NextResponse.json({ error: 'Pick Idea, Problem or Other.' }, { status: 400 });
    }
    if (!message) {
      return NextResponse.json({ error: 'Please write a message.' }, { status: 400 });
    }
    if (message.length > MAX_FEEDBACK_CHARS) {
      return NextResponse.json({ error: `Please keep it under ${MAX_FEEDBACK_CHARS} characters.` }, { status: 413 });
    }

    const userAgent = (request.headers.get('user-agent') || '').slice(0, 300) || null;

    const { error } = await supabase
      .from('feedback')
      .insert({ user_id: user.id, type, message, user_agent: userAgent });

    if (error) {
      // Raised by the spam-limit trigger in the database (5 messages per 10 minutes).
      if (error.message?.includes('feedback_rate_limited')) {
        return NextResponse.json(
          { error: 'You have sent a lot of feedback just now. Please try again in a few minutes.' },
          { status: 429, headers: { 'Retry-After': '600' } }
        );
      }
      throw error;
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    // Shows up in Vercel -> your project -> Logs.
    console.error('[feedback] failed:', error?.code, error?.message);
    return NextResponse.json({ error: 'Could not send feedback. Please try again.' }, { status: 500 });
  }
}