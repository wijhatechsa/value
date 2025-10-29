/*
  Move reception detail fields from intake_records to inspections
  - Add fields to inspections (editable by inspector)
  - Drop those fields from intake_records to avoid duplication
*/

-- Add columns to inspections if not exist
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inspections' AND column_name='building_license_no') THEN
    ALTER TABLE inspections ADD COLUMN building_license_no text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inspections' AND column_name='plan_no') THEN
    ALTER TABLE inspections ADD COLUMN plan_no text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inspections' AND column_name='land_use') THEN
    ALTER TABLE inspections ADD COLUMN land_use text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inspections' AND column_name='onsite_services') THEN
    ALTER TABLE inspections ADD COLUMN onsite_services jsonb DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inspections' AND column_name='parcel_no') THEN
    ALTER TABLE inspections ADD COLUMN parcel_no text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inspections' AND column_name='neighbor_built') THEN
    ALTER TABLE inspections ADD COLUMN neighbor_built boolean;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inspections' AND column_name='land_nature') THEN
    ALTER TABLE inspections ADD COLUMN land_nature text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inspections' AND column_name='is_occupied') THEN
    ALTER TABLE inspections ADD COLUMN is_occupied boolean;
  END IF;
END $$;

-- Drop columns from intake_records if they exist
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='intake_records' AND column_name='building_license_no') THEN
    ALTER TABLE intake_records DROP COLUMN building_license_no;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='intake_records' AND column_name='plan_no') THEN
    ALTER TABLE intake_records DROP COLUMN plan_no;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='intake_records' AND column_name='land_use') THEN
    ALTER TABLE intake_records DROP COLUMN land_use;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='intake_records' AND column_name='onsite_services') THEN
    ALTER TABLE intake_records DROP COLUMN onsite_services;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='intake_records' AND column_name='parcel_no') THEN
    ALTER TABLE intake_records DROP COLUMN parcel_no;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='intake_records' AND column_name='neighbor_built') THEN
    ALTER TABLE intake_records DROP COLUMN neighbor_built;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='intake_records' AND column_name='land_nature') THEN
    ALTER TABLE intake_records DROP COLUMN land_nature;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='intake_records' AND column_name='is_occupied') THEN
    ALTER TABLE intake_records DROP COLUMN is_occupied;
  END IF;
END $$;

