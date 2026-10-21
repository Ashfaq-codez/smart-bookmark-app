import { imageBackfillDryRun, imageBackfillApply } from '@/lib/instagramImageBackfill';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Our own copy of the picture for older Instagram bookmarks. GET = dry run, POST = next batch.
// Pass 1 copies links that still work (no Instagram requests); pass 2 reads the post page for expired ones.
export const GET = () => imageBackfillDryRun();
export const POST = () => imageBackfillApply();
