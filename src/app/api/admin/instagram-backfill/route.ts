import { backfillDryRun, backfillApply } from '@/lib/snapshotBackfill';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Finds the poster's handle for older Instagram bookmarks. GET = dry run, POST = next batch of 10.
// Most rows are fixed from what was saved; Instagram is only asked when nothing else has the handle.
export const GET = () => backfillDryRun('instagram');
export const POST = () => backfillApply('instagram');
