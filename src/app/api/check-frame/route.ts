import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

function isPrivateIP(hostname: string): boolean {
  return /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|169\.254\.)/.test(hostname);
}

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
    const parsedUrl = new URL(targetUrl);
    
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return NextResponse.json({ error: 'Invalid protocol' }, { status: 400 });
    }
    
    if (isPrivateIP(parsedUrl.hostname)) {
      return NextResponse.json({ error: 'Access to internal network denied' }, { status: 403 });
    }

    const response = await fetch(targetUrl, {
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