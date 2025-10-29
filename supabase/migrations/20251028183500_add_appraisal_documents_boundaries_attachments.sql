/* Appraisal: property documents, boundaries, services, attachments */

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appraisals' AND column_name='deed_number') THEN
    ALTER TABLE appraisals ADD COLUMN deed_number text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appraisals' AND column_name='deed_date') THEN
    ALTER TABLE appraisals ADD COLUMN deed_date date;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appraisals' AND column_name='doc_building_license_no') THEN
    ALTER TABLE appraisals ADD COLUMN doc_building_license_no text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appraisals' AND column_name='doc_building_license_date') THEN
    ALTER TABLE appraisals ADD COLUMN doc_building_license_date date;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appraisals' AND column_name='boundary_north') THEN
    ALTER TABLE appraisals ADD COLUMN boundary_north text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appraisals' AND column_name='boundary_south') THEN
    ALTER TABLE appraisals ADD COLUMN boundary_south text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appraisals' AND column_name='boundary_east') THEN
    ALTER TABLE appraisals ADD COLUMN boundary_east text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appraisals' AND column_name='boundary_west') THEN
    ALTER TABLE appraisals ADD COLUMN boundary_west text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appraisals' AND column_name='public_services') THEN
    ALTER TABLE appraisals ADD COLUMN public_services jsonb DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appraisals' AND column_name='health_services') THEN
    ALTER TABLE appraisals ADD COLUMN health_services jsonb DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appraisals' AND column_name='attachments') THEN
    ALTER TABLE appraisals ADD COLUMN attachments jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

