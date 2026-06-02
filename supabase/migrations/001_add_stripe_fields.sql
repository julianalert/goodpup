-- Migration 001 — Add Stripe payment fields to submissions
-- Run this if you already created the table from schema.sql
-- (If you're starting fresh, schema.sql already includes these columns)

ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS stripe_session_id       TEXT,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;

CREATE INDEX IF NOT EXISTS submissions_stripe_session_idx
  ON submissions (stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;
