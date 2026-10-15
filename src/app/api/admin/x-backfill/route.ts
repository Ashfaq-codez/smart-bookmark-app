import { backfillDryRun, backfillApply } from '@/lib/snapshotBackfill';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Reads snapshots for older X bookmarks. GET = dry run, POST = next batch of 10. See src/lib/snapshotBackfill.ts.
export const GET = () => backfillDryRun('twitter');
export const POST = () => backfillApply('twitter');
