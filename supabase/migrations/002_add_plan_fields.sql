-- Migration 002 — Add plan generation fields to submissions
-- Run this in Supabase SQL Editor if you already ran schema.sql
-- (If starting fresh, add these columns to the CREATE TABLE in schema.sql)

ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS plan_html   TEXT,
  ADD COLUMN IF NOT EXISTS plan_status TEXT NOT NULL DEFAULT 'pending';

-- plan_status values:
--   'pending'    — payment received, generation not yet started
--   'generating' — Claude is running
--   'ready'      — plan_html is populated and ready to display
--   'failed'     — generation failed, can be retried

CREATE INDEX IF NOT EXISTS submissions_plan_status_idx
  ON submissions (plan_status)
  WHERE plan_status IN ('pending', 'generating');
