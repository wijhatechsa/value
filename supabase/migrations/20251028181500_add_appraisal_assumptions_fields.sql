/* Appraisal assumptions and terms fields */

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appraisals' AND column_name='purpose') THEN
    ALTER TABLE appraisals ADD COLUMN purpose text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appraisals' AND column_name='value_basis') THEN
    ALTER TABLE appraisals ADD COLUMN value_basis text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appraisals' AND column_name='method_used') THEN
    ALTER TABLE appraisals ADD COLUMN method_used text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appraisals' AND column_name='currency') THEN
    ALTER TABLE appraisals ADD COLUMN currency text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appraisals' AND column_name='ownership_type') THEN
    ALTER TABLE appraisals ADD COLUMN ownership_type text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appraisals' AND column_name='assignment_date') THEN
    ALTER TABLE appraisals ADD COLUMN assignment_date date;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appraisals' AND column_name='inspection_date_ro') THEN
    ALTER TABLE appraisals ADD COLUMN inspection_date_ro date;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appraisals' AND column_name='inspection_time_ro') THEN
    ALTER TABLE appraisals ADD COLUMN inspection_time_ro time;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appraisals' AND column_name='assumptions') THEN
    ALTER TABLE appraisals ADD COLUMN assumptions text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appraisals' AND column_name='info_source_user_id') THEN
    ALTER TABLE appraisals ADD COLUMN info_source_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

