-- Migration 006 — Daily reminders and the personal touches of the training space
-- Run this in the Supabase SQL Editor (Database > SQL Editor).
--
-- Safe to deploy the code before running this: until these columns exist, plans
-- generate and the training space works as before; only reminders, the reminder
-- settings and the dog photo stay off.

ALTER TABLE submissions
  -- When the plan became ready (the "plan is ready" email goes out then)
  ADD COLUMN IF NOT EXISTS plan_ready_at        TIMESTAMPTZ,
  -- Daily "today's session" email
  ADD COLUMN IF NOT EXISTS reminders_enabled    BOOLEAN  NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS reminder_hour        SMALLINT NOT NULL DEFAULT 8,   -- 0–23, in the customer's own timezone
  ADD COLUMN IF NOT EXISTS timezone             TEXT,                          -- e.g. 'America/Chicago'; set when they open their space
  ADD COLUMN IF NOT EXISTS last_reminder_at     TIMESTAMPTZ,
  -- Reminders sent since the customer last finished a day; reminders stop when this reaches the limit
  ADD COLUMN IF NOT EXISTS reminders_unanswered SMALLINT NOT NULL DEFAULT 0,
  -- Small square photo of the dog, as a data URL (resized in the browser before upload)
  ADD COLUMN IF NOT EXISTS dog_photo            TEXT;

-- The hourly reminder job only looks at paid orders with reminders on
CREATE INDEX IF NOT EXISTS submissions_reminders_idx
  ON submissions (reminder_hour)
  WHERE status = 'paid' AND plan_status = 'ready' AND reminders_enabled;
