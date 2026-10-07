import React from 'react'
import { Bookmark } from '@/types'
import { hostIs, detectSiteType } from '@/lib/urlTools'

// The host name of an address (lowercase, no www.), or '' when it is not an address
const hostOf = (url: string) => {
  try { return new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`).hostname.toLowerCase().replace(/^www\./, '') } catch { return '' }
}

export const isVideoMedia = (url?: string | null) => {
  if (!url) return false;
  const l = url.toLowerCase();
  if (l.includes('.jpg') || l.includes('.jpeg') || l.includes('.png') || l.includes('.webp') || l.includes('format=jpg') || l.includes('format=png') || l.includes('thumb')) return false;
  return l.includes('.mp4') || l.includes('.webm') || l.includes('.mov') || l.includes('.m3u8');
};

export const isGoogleSearchUrl = (url?: string) => {
  if (!url) return false;
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    return (u.hostname === 'google.com' || u.hostname === 'www.google.com' || u.hostname.endsWith('.google.com') || u.hostname.includes('google.co.')) && (u.pathname.includes('/search') || u.searchParams.has('q'));
  } catch { return false; }
};

export const getGoogleQuery = (url?: string) => {
  if (!url) return '';
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    const q = u.searchParams.get('q');
    return q ? decodeURIComponent(q).replace(/\+/g, ' ') : '';
  } catch { return ''; }
};

export const getYouTubeId = (url: string) => {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([^?&/]{11})/);
  return match ? match[1] : '';
}

export const getTwitterAuthor = (url: string) => {
  if (!hostIs(hostOf(url), 'twitter.com') && !hostIs(hostOf(url), 'x.com')) return 'unknown';
  const match = url.match(/(?:twitter\.com|x\.com)\/([^/?#]+)/);
  return match ? match[1] : 'unknown';
}

export const formatDate = (dateString: string) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export const formatDateTime = (dateString: string) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' at ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export const deriveDisplayType = (b: Bookmark) => {
  // A saved label is trusted only if the address really is that site. Old saves made by the earlier
  // "contains x.com" check were stored as X posts even for dropbox.com, netflix.com...
  let storedType = b.type;
  if (storedType && ['twitter', 'instagram', 'youtube', 'tiktok', 'pinterest', 'github'].includes(storedType) && b.url) {
    const real = storedType === 'tiktok' ? (hostIs(hostOf(b.url), 'tiktok.com') ? 'tiktok' : null) : detectSiteType(b.url);
    if (real !== storedType) storedType = 'link';
  }
  if (['twitter', 'instagram', 'youtube', 'tiktok', 'pinterest', 'github', 'note', 'pdf', 'image', 'video'].includes(storedType || '')) return storedType;
  if (b.url) {
    if (isGoogleSearchUrl(b.url)) return 'google';
    const url = b.url.toLowerCase();
    // Match the real site (x.com, www.x.com, mobile.twitter.com...), never just "contains" (dropbox.com is not x.com)
    const site = detectSiteType(b.url);
    if (site === 'twitter' || site === 'instagram' || site === 'pinterest' || site === 'youtube' || site === 'github') return site;
    if (hostIs(hostOf(b.url), 'tiktok.com')) return 'tiktok';
    if (url.endsWith('.pdf') || b.file_type === 'application/pdf') return 'pdf';
  }
  return storedType || 'link';
}

export const getInstaMeta = (b: Bookmark) => {
  let username = 'instagram_user'; let likes = '1,248'; let caption = '';
  const fullText = (b.description || '') + ' ' + (b.title || '');

  if (fullText.includes(' on Instagram:')) {
    const parts = fullText.split(' on Instagram:');
    const metaPart = parts[0];
    const userMatch = metaPart.match(/-\s+([a-zA-Z0-9_.]+)\s*$/) || metaPart.match(/^([a-zA-Z0-9_.]+)$/);
    if (userMatch) username = userMatch[1].trim();
    
    const likesMatch = metaPart.match(/([\d,KMB]+)\s+likes?/i);
    if (likesMatch) likes = likesMatch[1];

    caption = parts.slice(1).join(' on Instagram:').trim();
    if ((caption.startsWith('"') && caption.endsWith('"')) || (caption.startsWith("'") && caption.endsWith("'"))) {
      caption = caption.substring(1, caption.length - 1).trim();
    }
  } else {
    caption = (b.description && b.description !== b.title) ? b.description : '';
  }

  if (caption.toLowerCase() === 'instagram' || caption.toLowerCase().includes('instagram photos and videos') || caption.includes('Create an account')) caption = '';
  
  if (username === 'instagram_user' && b.url) {
    const urlMatch = b.url.match(/instagram\.com\/([^/]+)/);
    if (urlMatch && !['p','reel','reels','tv','explore'].includes(urlMatch[1])) username = urlMatch[1];
  }
  if (username.length > 30) username = username.substring(0, 30);
  return { username, likes, caption };
}

export const renderInstagramText = (text: string) => {
  if (!text) return null;
  const parts = text.split(/(#[a-zA-Z0-9_]+|@[a-zA-Z0-9_.]+)/g);
  return parts.map((part, i) => {
    if (part.startsWith('#')) return <a key={i} href={`https://www.instagram.com/explore/tags/${part.slice(1)}/`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-[#00376B] dark:text-[#E0F1FF] hover:underline">{part}</a>;
    if (part.startsWith('@')) return <a key={i} href={`https://www.instagram.com/${part.slice(1)}/`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-[#00376B] dark:text-[#E0F1FF] hover:underline font-medium">{part}</a>;
    return <span key={i}>{part}</span>;
  });
};

export const renderTwitterText = (text: string, isExpanded: boolean = false) => {
  if (!text) return null;
  const parts = text.split(/(https?:\/\/(?:twitter\.com|x\.com)\/\w+\/status\/\d+(?:\?[^\s]*)?)/g);
  return parts.map((part, i) => {
    const quoteMatch = part.match(/https?:\/\/(?:twitter\.com|x\.com)\/(\w+)\/status\/(\d+)/);
    if (quoteMatch) {
      return (
        <div key={i} className="mt-3 mb-1 w-full rounded-xl overflow-hidden border border-black/[0.04] dark:border-white/[0.04] bg-gray-50 dark:bg-black pointer-events-auto relative z-20" onPointerDown={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
           <iframe src={`https://platform.twitter.com/embed/Tweet.html?dnt=true&theme=dark&id=${quoteMatch[2]}`} className={`w-full border-none bg-transparent ${isExpanded ? 'h-[350px] overflow-y-auto custom-scrollbar' : 'h-[200px]'}`} title="Nested X Post" scrolling={isExpanded ? "yes" : "no"} />
        </div>
      );
    }
    const subParts = part.split(/(https?:\/\/[^\s]+|@\w+|#\w+)/g);
    return subParts.map((sub, j) => {
      if (sub.match(/^(https?:\/\/[^\s]+|@\w+|#\w+)$/)) {
        return <a key={`${i}-${j}`} href={sub.startsWith('http') ? sub : `https://x.com/${sub}`} target="_blank" rel="noreferrer" onPointerDown={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} className="text-[#1DA1F2] hover:underline relative z-20 pointer-events-auto">{sub}</a>;
      }
      return <span key={`${i}-${j}`}>{sub}</span>;
    });
  });
};

// ADD THESE TO THE BOTTOM OF src/utils/bookmarkHelpers.tsx

export const getPlatformMeta = (url: string) => {
  if (!url) return { name: 'Website', color: 'transparent' };
  try {
    const host = new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace('www.', '');
    if (hostIs(host, 'spotify.com')) return { name: 'Spotify', color: '#1DB954' };
    if (hostIs(host, 'reddit.com')) return { name: 'Reddit', color: '#FF4500' };
    if (hostIs(host, 'figma.com')) return { name: 'Figma', color: '#F24E1E' };
    if (hostIs(host, 'vimeo.com')) return { name: 'Vimeo', color: '#1AB7EA' };
    if (hostIs(host, 'codepen.io')) return { name: 'CodePen', color: '#000000' };
    if (hostIs(host, 'soundcloud.com')) return { name: 'SoundCloud', color: '#FF3300' };
    if (hostIs(host, 'github.com')) return { name: 'GitHub', color: '#24292e' };
    if (hostIs(host, 'codesandbox.io')) return { name: 'CodeSandbox', color: '#151515' };
    if (hostIs(host, 'linkedin.com')) return { name: 'LinkedIn', color: '#0A66C2' };
    if (hostIs(host, 'dribbble.com')) return { name: 'Dribbble', color: '#EA4C89' };
    if (hostIs(host, 'behance.net')) return { name: 'Behance', color: '#1769FF' };
    if (hostIs(host, 'notion.so') || hostIs(host, 'notion.site')) return { name: 'Notion', color: '#000000' };
    return { name: host, color: 'transparent' };
  } catch {
    return { name: 'Website', color: 'transparent' };
  }
}

export const getUniversalEmbedUrl = (url: string): string | null => {
  if (!url) return null;
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    const host = u.hostname.replace('www.', '');

    if (host === 'open.spotify.com') return url.replace(/\/(track|album|playlist|episode|show)\//, '/embed/$1/');
    if (host === 'vimeo.com') {
      const match = u.pathname.match(/^\/(\d+)$/);
      if (match) return `https://player.vimeo.com/video/${match[1]}`;
    }
    if (host === 'figma.com') return `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(url)}`;
    if (host === 'codepen.io') return url.replace('/pen/', '/embed/preview/');
    if (host === 'reddit.com') return `${url.replace(/\/$/, '')}/embed`;
    if (host === 'soundcloud.com') return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&auto_play=false&visual=true`;
    if (host === 'codesandbox.io') return url.replace('/s/', '/embed/');
    
    return null; // Return null if no interactive embed exists, which triggers standard fallback
  } catch { return null; }
}