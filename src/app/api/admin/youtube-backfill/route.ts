import { backfillDryRun, backfillApply } from '@/lib/snapshotBackfill';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Reads the real title and channel for older YouTube bookmarks. GET = dry run, POST = next batch of 10.
export const GET = () => backfillDryRun('youtube');
export const POST = () => backfillApply('youtube');
