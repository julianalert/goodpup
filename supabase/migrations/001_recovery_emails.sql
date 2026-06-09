-- ============================================================
-- Migration 001: Abandoned-cart recovery email tracking
-- Run in Supabase SQL Editor (Database > SQL Editor)
-- ============================================================

-- How many recovery emails have been sent (0 = none, 1 = email 1 sent, etc.)
ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS recovery_emails_sent INTEGER NOT NULL DEFAULT 0;

-- Set to true when user pays (stops further recovery emails)
-- Also used for manual unsubscribes
ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS recovery_suppressed BOOLEAN NOT NULL DEFAULT FALSE;

-- Index for the cron query: find submissions due for the next email
CREATE INDEX IF NOT EXISTS submissions_recovery_idx
  ON submissions (recovery_emails_sent, recovery_suppressed, status, created_at)
  WHERE email IS NOT NULL;
