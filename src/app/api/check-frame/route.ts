import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { isSafeUrl, safeFetch } from '@/utils/safeFetch';

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return NextResponse.json({ error: 'URL required' }, { status: 400 });

  try {
    const isSafe = await isSafeUrl(targetUrl);
    if (!isSafe) {
      return NextResponse.json({ error: 'Access to internal or restricted network denied' }, { status: 403 });
    }

    const response = await safeFetch(targetUrl, {
      method: 'HEAD',
      signal: AbortSignal.timeout(3000)
    });

    const xFrameOptions = response.headers.get('x-frame-options');
    const csp = response.headers.get('content-security-policy');
    
    let allowIframe = true;
    if (xFrameOptions?.toUpperCase() === 'DENY' || xFrameOptions?.toUpperCase() === 'SAMEORIGIN') {
      allowIframe = false;
    }
    if (csp?.includes('frame-ancestors')) {
      allowIframe = false;
    }

    return NextResponse.json({ allowIframe });
  } catch (error) {
    return NextResponse.json({ allowIframe: false });
  }
}