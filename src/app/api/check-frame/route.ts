import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) return NextResponse.json({ allowIframe: false })

  try {
    // We only fetch the HEAD (headers), not the whole website, so it is lightning fast!
    const response = await fetch(url, { 
      method: 'HEAD', 
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } 
    })
    
    const xFrameOptions = response.headers.get('x-frame-options')?.toLowerCase()
    const csp = response.headers.get('content-security-policy')?.toLowerCase()

    let allowIframe = true

    // Check if the site explicitly denies iframes
    if (xFrameOptions && (xFrameOptions.includes('deny') || xFrameOptions.includes('sameorigin'))) {
      allowIframe = false
    }
    if (csp && (csp.includes("frame-ancestors 'none'") || csp.includes("frame-ancestors 'self'"))) {
      allowIframe = false
    }

    return NextResponse.json({ allowIframe })
  } catch (error) {
    // If the site is down or blocks bots, assume we cannot iframe it
    return NextResponse.json({ allowIframe: false })
  }
}