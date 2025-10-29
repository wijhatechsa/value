/*
  Intake records for reception step
  - Stores reception-only metadata per property
  - Readable by all staff roles (admin, inspector, appraiser, reviewer)
  - Not visible to clients
  - Writable by admins (can extend later)
*/

CREATE TABLE IF NOT EXISTS intake_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid UNIQUE NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  reference_no text,
  received_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  received_at timestamptz DEFAULT now(),
  contact_verified boolean DEFAULT false,
  documents jsonb DEFAULT '[]'::jsonb,
  -- New reception fields (added later via ALTER too for idempotency)
  building_license_no text,
  plan_no text,
  land_use text,
  onsite_services jsonb DEFAULT '[]'::jsonb,
  parcel_no text,
  neighbor_built boolean,
  land_nature text,
  is_occupied boolean,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE intake_records ENABLE ROW LEVEL SECURITY;

-- Helper: is_staff (role in user_profiles and not client)
-- Policies

-- Read: staff only (admin, inspector, appraiser, reviewer). Clients cannot read.
CREATE POLICY "Staff can read intake records"
  ON intake_records FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.role IN ('admin', 'inspector', 'appraiser', 'reviewer')
    )
  );

-- Insert: admin only
CREATE POLICY "Admin can insert intake records"
  ON intake_records FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.role = 'admin'
    )
  );

-- Update: admin only
CREATE POLICY "Admin can update intake records"
  ON intake_records FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.role = 'admin'
    )
  );

-- Optional: index
CREATE INDEX IF NOT EXISTS idx_intake_records_property_id ON intake_records(property_id);

-- Idempotent alters (in case table existed before this migration was applied)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'intake_records' AND column_name = 'building_license_no'
  ) THEN
    ALTER TABLE intake_records ADD COLUMN building_license_no text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'intake_records' AND column_name = 'plan_no'
  ) THEN
    ALTER TABLE intake_records ADD COLUMN plan_no text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'intake_records' AND column_name = 'land_use'
  ) THEN
    ALTER TABLE intake_records ADD COLUMN land_use text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'intake_records' AND column_name = 'onsite_services'
  ) THEN
    ALTER TABLE intake_records ADD COLUMN onsite_services jsonb DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'intake_records' AND column_name = 'parcel_no'
  ) THEN
    ALTER TABLE intake_records ADD COLUMN parcel_no text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'intake_records' AND column_name = 'neighbor_built'
  ) THEN
    ALTER TABLE intake_records ADD COLUMN neighbor_built boolean;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'intake_records' AND column_name = 'land_nature'
  ) THEN
    ALTER TABLE intake_records ADD COLUMN land_nature text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'intake_records' AND column_name = 'is_occupied'
  ) THEN
    ALTER TABLE intake_records ADD COLUMN is_occupied boolean;
  END IF;
END $$;
