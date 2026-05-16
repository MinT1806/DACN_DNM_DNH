-- Add auto_submitted column to test_sessions table
-- This column tracks if a test was auto-submitted when time ran out

ALTER TABLE test_sessions ADD COLUMN IF NOT EXISTS auto_submitted BOOLEAN DEFAULT FALSE;
ALTER TABLE test_sessions ADD COLUMN IF NOT EXISTS timed BOOLEAN DEFAULT TRUE;
ALTER TABLE test_sessions ADD COLUMN IF NOT EXISTS has_sections BOOLEAN DEFAULT FALSE;

-- Also add other columns that might be missing
ALTER TABLE test_sessions ADD COLUMN IF NOT EXISTS section_progress_json TEXT;
ALTER TABLE test_sessions ADD COLUMN IF NOT EXISTS section_time_seconds INTEGER DEFAULT 0;
ALTER TABLE test_sessions ADD COLUMN IF NOT EXISTS current_section VARCHAR(50) DEFAULT 'INFO';
ALTER TABLE test_sessions ADD COLUMN IF NOT EXISTS answered_count INTEGER DEFAULT 0;
ALTER TABLE test_sessions ADD COLUMN IF NOT EXISTS expired_at TIMESTAMP;
