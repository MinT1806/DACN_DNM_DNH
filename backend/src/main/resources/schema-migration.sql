-- Add missing columns to test_sessions table if they don't exist
-- This runs automatically on Spring Boot startup

DO $$
BEGIN
    -- Add auto_submitted column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'test_sessions' AND column_name = 'auto_submitted') THEN
        ALTER TABLE test_sessions ADD COLUMN auto_submitted BOOLEAN DEFAULT FALSE;
    END IF;

    -- Add section_progress_json column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'test_sessions' AND column_name = 'section_progress_json') THEN
        ALTER TABLE test_sessions ADD COLUMN section_progress_json TEXT;
    END IF;

    -- Add section_time_seconds column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'test_sessions' AND column_name = 'section_time_seconds') THEN
        ALTER TABLE test_sessions ADD COLUMN section_time_seconds INTEGER DEFAULT 0;
    END IF;

    -- Add current_section column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'test_sessions' AND column_name = 'current_section') THEN
        ALTER TABLE test_sessions ADD COLUMN current_section VARCHAR(50) DEFAULT 'INFO';
    END IF;

    -- Add answered_count column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'test_sessions' AND column_name = 'answered_count') THEN
        ALTER TABLE test_sessions ADD COLUMN answered_count INTEGER DEFAULT 0;
    END IF;

    -- Add expired_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'test_sessions' AND column_name = 'expired_at') THEN
        ALTER TABLE test_sessions ADD COLUMN expired_at TIMESTAMP;
    END IF;

    -- Add timed column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'test_sessions' AND column_name = 'timed') THEN
        ALTER TABLE test_sessions ADD COLUMN timed BOOLEAN DEFAULT TRUE;
    END IF;

    -- Add has_sections column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'test_sessions' AND column_name = 'has_sections') THEN
        ALTER TABLE test_sessions ADD COLUMN has_sections BOOLEAN DEFAULT FALSE;
    END IF;

    -- Fix existing NULL values
    UPDATE test_sessions SET auto_submitted = false WHERE auto_submitted IS NULL;
    UPDATE test_sessions SET timed = true WHERE timed IS NULL;
    UPDATE test_sessions SET has_sections = false WHERE has_sections IS NULL;
    UPDATE test_sessions SET section_time_seconds = 0 WHERE section_time_seconds IS NULL;
    UPDATE test_sessions SET answered_count = 0 WHERE answered_count IS NULL;
    UPDATE test_sessions SET current_section = 'INFO' WHERE current_section IS NULL;

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Migration skipped or failed: %', SQLERRM;
END $$;
