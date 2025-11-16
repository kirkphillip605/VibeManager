-- Fix audit trigger to exclude user_sessions table
-- The user_sessions table created by connect-pg-simple doesn't have an id column
-- so the audit trigger fails when trying to access NEW.id or OLD.id

-- Drop the audit trigger on user_sessions if it exists
DROP TRIGGER IF EXISTS user_sessions_audit_trigger ON user_sessions;
