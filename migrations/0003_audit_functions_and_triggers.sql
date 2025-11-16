-- Create or replace the update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or replace the record_audit function for audit logging
CREATE OR REPLACE FUNCTION public.record_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_old jsonb;
  v_new jsonb;
  v_user_id uuid;
BEGIN
  -- Pull user_id from session variable if set
  BEGIN
    v_user_id := current_setting('app.current_user_id')::uuid;
  EXCEPTION WHEN OTHERS THEN
    v_user_id := '00000000-0000-0000-0000-000000000000'::uuid; -- system UUID fallback
  END;

  IF TG_OP = 'DELETE' THEN
    v_old := to_jsonb(OLD);
    v_new := NULL;
  ELSIF TG_OP = 'UPDATE' THEN
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);
  ELSE
    v_old := NULL;
    v_new := to_jsonb(NEW);
  END IF;

  INSERT INTO public.audit_log (
    id,
    action_timestamp,
    action,
    schema_name,
    table_name,
    record_id,
    user_id,
    old_data,
    new_data
  ) VALUES (
    gen_random_uuid(),
    NOW(),
    TG_OP::public.audit_action,
    TG_TABLE_SCHEMA,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    v_user_id,
    v_old,
    v_new
  );

  RETURN NEW;
END;
$$;

-- Create or replace the apply_audit_trigger helper function
CREATE OR REPLACE FUNCTION public.apply_audit_trigger(target_table text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  EXECUTE format(
    'CREATE TRIGGER %I_audit_trigger
     AFTER INSERT OR UPDATE OR DELETE ON %I
     FOR EACH ROW EXECUTE FUNCTION public.record_audit();',
    target_table,
    target_table
  );
END;
$$;

-- Apply update_updated_at_column triggers to tables with updated_at columns
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN 
    SELECT table_name 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND column_name = 'updated_at'
  LOOP
    -- Drop trigger if exists to avoid conflicts
    EXECUTE format('DROP TRIGGER IF EXISTS %I_update_timestamp ON %I', tbl, tbl);
    
    -- Create the trigger
    EXECUTE format(
      'CREATE TRIGGER %I_update_timestamp
       BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();',
      tbl,
      tbl
    );
  END LOOP;
END;
$$;

-- Apply audit triggers to all relevant tables (except audit_log itself)
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND table_name != 'audit_log'
    AND table_name != 'sessions'
    AND table_name != 'verification_tokens'
  LOOP
    -- Drop trigger if exists to avoid conflicts
    EXECUTE format('DROP TRIGGER IF EXISTS %I_audit_trigger ON %I', tbl, tbl);
    
    -- Create the audit trigger
    EXECUTE format(
      'CREATE TRIGGER %I_audit_trigger
       AFTER INSERT OR UPDATE OR DELETE ON %I
       FOR EACH ROW EXECUTE FUNCTION public.record_audit();',
      tbl,
      tbl
    );
  END LOOP;
END;
$$;
