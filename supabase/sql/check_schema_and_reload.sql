/*
  Quick schema check and PostgREST cache reload

  - Verifies existence of:
      • inspections.building_license_no
      • appraisals.assignment_date
  - Emits clear NOTICES with the result
  - Triggers PostgREST schema cache reload

  Usage:
  - Supabase Studio SQL editor: paste and run
  - psql: psql "$DATABASE_URL" -f supabase/sql/check_schema_and_reload.sql
*/

-- Show current timestamp and DB
SELECT now() AS ran_at, current_database() AS database;

-- Check columns and raise NOTICES
DO $$
DECLARE
  has_building_license_no boolean;
  has_assignment_date boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'inspections'
      AND column_name = 'building_license_no'
  ) INTO has_building_license_no;

  IF has_building_license_no THEN
    RAISE NOTICE 'OK: public.inspections.building_license_no exists';
  ELSE
    RAISE NOTICE 'MISSING: public.inspections.building_license_no not found';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'appraisals'
      AND column_name = 'assignment_date'
  ) INTO has_assignment_date;

  IF has_assignment_date THEN
    RAISE NOTICE 'OK: public.appraisals.assignment_date exists';
  ELSE
    RAISE NOTICE 'MISSING: public.appraisals.assignment_date not found';
  END IF;
END $$;

-- Show a compact result row as well
SELECT
  (SELECT EXISTS (
     SELECT 1 FROM information_schema.columns
     WHERE table_schema='public' AND table_name='inspections' AND column_name='building_license_no')) AS inspections_building_license_no,
  (SELECT EXISTS (
     SELECT 1 FROM information_schema.columns
     WHERE table_schema='public' AND table_name='appraisals' AND column_name='assignment_date')) AS appraisals_assignment_date;

-- Trigger PostgREST schema cache reload (safe to run even if PostgREST not listening)
NOTIFY pgrst, 'reload schema';

-- Optional: surface that NOTIFY was sent
RAISE NOTICE 'NOTIFY pgrst, "reload schema" sent';

