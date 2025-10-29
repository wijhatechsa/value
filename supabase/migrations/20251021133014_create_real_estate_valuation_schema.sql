/*
  # Real Estate Valuation System Schema

  ## Overview
  This migration creates a complete database schema for a real estate valuation workflow system
  that handles: intake → inspection → appraisal → review → delivery

  ## New Tables

  ### 1. `properties`
  Stores property information submitted during intake
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid) - Reference to auth.users
  - `property_address` (text) - Full property address
  - `property_type` (text) - Type: residential, commercial, industrial, land
  - `area_sqm` (numeric) - Area in square meters
  - `bedrooms` (int) - Number of bedrooms (nullable for non-residential)
  - `bathrooms` (int) - Number of bathrooms (nullable)
  - `year_built` (int) - Construction year
  - `owner_name` (text) - Property owner name
  - `owner_contact` (text) - Owner contact information
  - `status` (text) - Current workflow status
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. `inspections`
  Stores inspection reports and findings
  - `id` (uuid, primary key) - Unique identifier
  - `property_id` (uuid) - Reference to properties table
  - `inspector_id` (uuid) - Reference to auth.users (inspector)
  - `inspection_date` (date) - Date of inspection
  - `structural_condition` (text) - Assessment of structural condition
  - `interior_condition` (text) - Assessment of interior condition
  - `exterior_condition` (text) - Assessment of exterior condition
  - `amenities` (jsonb) - List of amenities found
  - `defects` (jsonb) - List of defects identified
  - `photos` (jsonb) - Array of photo URLs
  - `notes` (text) - Additional inspector notes
  - `status` (text) - Inspection status
  - `created_at` (timestamptz) - Creation timestamp
  - `completed_at` (timestamptz) - Completion timestamp

  ### 3. `appraisals`
  Stores property appraisals and valuations
  - `id` (uuid, primary key) - Unique identifier
  - `property_id` (uuid) - Reference to properties table
  - `inspection_id` (uuid) - Reference to inspections table
  - `appraiser_id` (uuid) - Reference to auth.users (appraiser)
  - `market_value` (numeric) - Estimated market value
  - `land_value` (numeric) - Land value component
  - `building_value` (numeric) - Building value component
  - `valuation_method` (text) - Method used for valuation
  - `comparable_properties` (jsonb) - Comparable property data
  - `adjustments` (jsonb) - Value adjustments made
  - `final_value` (numeric) - Final appraised value
  - `confidence_level` (text) - Confidence in appraisal
  - `notes` (text) - Appraiser notes
  - `status` (text) - Appraisal status
  - `created_at` (timestamptz) - Creation timestamp
  - `completed_at` (timestamptz) - Completion timestamp

  ### 4. `reviews`
  Stores review comments and approvals
  - `id` (uuid, primary key) - Unique identifier
  - `appraisal_id` (uuid) - Reference to appraisals table
  - `reviewer_id` (uuid) - Reference to auth.users (reviewer)
  - `review_status` (text) - approved, rejected, needs_revision
  - `comments` (text) - Review comments
  - `requested_changes` (jsonb) - List of requested changes
  - `created_at` (timestamptz) - Creation timestamp
  - `completed_at` (timestamptz) - Completion timestamp

  ### 5. `deliveries`
  Stores final delivery information
  - `id` (uuid, primary key) - Unique identifier
  - `appraisal_id` (uuid) - Reference to appraisals table
  - `delivered_by` (uuid) - Reference to auth.users
  - `delivery_method` (text) - Method of delivery
  - `recipient_email` (text) - Recipient email address
  - `report_url` (text) - URL to final report
  - `delivered_at` (timestamptz) - Delivery timestamp
  - `created_at` (timestamptz) - Creation timestamp

  ### 6. `user_profiles`
  Extended user information and roles
  - `id` (uuid, primary key) - References auth.users(id)
  - `full_name` (text) - User's full name
  - `role` (text) - User role: admin, appraiser, inspector, client
  - `phone` (text) - Phone number
  - `created_at` (timestamptz) - Creation timestamp

  ## Security
  - Enable RLS on all tables
  - Policies ensure users can only access their own data or assigned tasks
  - Inspectors can only view/edit inspections assigned to them
  - Appraisers can only view/edit appraisals assigned to them
  - Reviewers can view all appraisals for review
  - Clients can only view their own properties and reports

  ## Important Notes
  1. All timestamps use timestamptz for timezone awareness
  2. Status fields use text for flexibility (can be converted to enums later)
  3. JSONB fields allow flexible storage of arrays and complex data
  4. Foreign key constraints ensure referential integrity
  5. Indexes added on frequently queried columns for performance
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'client',
  phone text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create properties table
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  property_address text NOT NULL,
  property_type text NOT NULL,
  area_sqm numeric NOT NULL,
  bedrooms int,
  bathrooms int,
  year_built int,
  owner_name text NOT NULL,
  owner_contact text NOT NULL,
  status text NOT NULL DEFAULT 'intake',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Create inspections table
CREATE TABLE IF NOT EXISTS inspections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  inspector_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  inspection_date date,
  structural_condition text,
  interior_condition text,
  exterior_condition text,
  amenities jsonb DEFAULT '[]'::jsonb,
  defects jsonb DEFAULT '[]'::jsonb,
  photos jsonb DEFAULT '[]'::jsonb,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;

-- Create appraisals table
CREATE TABLE IF NOT EXISTS appraisals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  inspection_id uuid REFERENCES inspections(id) ON DELETE SET NULL,
  appraiser_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  market_value numeric,
  land_value numeric,
  building_value numeric,
  valuation_method text,
  comparable_properties jsonb DEFAULT '[]'::jsonb,
  adjustments jsonb DEFAULT '[]'::jsonb,
  final_value numeric,
  confidence_level text,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE appraisals ENABLE ROW LEVEL SECURITY;

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appraisal_id uuid REFERENCES appraisals(id) ON DELETE CASCADE NOT NULL,
  reviewer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  review_status text NOT NULL DEFAULT 'pending',
  comments text,
  requested_changes jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Create deliveries table
CREATE TABLE IF NOT EXISTS deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appraisal_id uuid REFERENCES appraisals(id) ON DELETE CASCADE NOT NULL,
  delivered_by uuid REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  delivery_method text NOT NULL,
  recipient_email text NOT NULL,
  report_url text,
  delivered_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_properties_user_id ON properties(user_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_inspections_property_id ON inspections(property_id);
CREATE INDEX IF NOT EXISTS idx_inspections_inspector_id ON inspections(inspector_id);
CREATE INDEX IF NOT EXISTS idx_appraisals_property_id ON appraisals(property_id);
CREATE INDEX IF NOT EXISTS idx_appraisals_appraiser_id ON appraisals(appraiser_id);
CREATE INDEX IF NOT EXISTS idx_reviews_appraisal_id ON reviews(appraisal_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_appraisal_id ON deliveries(appraisal_id);

-- RLS Policies for user_profiles
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- RLS Policies for properties
CREATE POLICY "Users can view their own properties"
  ON properties FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Staff can view all properties"
  ON properties FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'inspector', 'appraiser', 'reviewer')
    )
  );

CREATE POLICY "Users can insert their own properties"
  ON properties FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own properties"
  ON properties FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for inspections
CREATE POLICY "Inspectors can view assigned inspections"
  ON inspections FOR SELECT
  TO authenticated
  USING (
    auth.uid() = inspector_id OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'reviewer')
    ) OR
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = inspections.property_id
      AND properties.user_id = auth.uid()
    )
  );

CREATE POLICY "Inspectors can insert inspections"
  ON inspections FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'inspector')
    )
  );

CREATE POLICY "Inspectors can update their assigned inspections"
  ON inspections FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = inspector_id OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() = inspector_id OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- RLS Policies for appraisals
CREATE POLICY "Appraisers can view assigned appraisals"
  ON appraisals FOR SELECT
  TO authenticated
  USING (
    auth.uid() = appraiser_id OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'reviewer')
    ) OR
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = appraisals.property_id
      AND properties.user_id = auth.uid()
    )
  );

CREATE POLICY "Appraisers can insert appraisals"
  ON appraisals FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'appraiser')
    )
  );

CREATE POLICY "Appraisers can update their assigned appraisals"
  ON appraisals FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = appraiser_id OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() = appraiser_id OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- RLS Policies for reviews
CREATE POLICY "Reviewers can view all reviews"
  ON reviews FOR SELECT
  TO authenticated
  USING (
    auth.uid() = reviewer_id OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'reviewer')
    ) OR
    EXISTS (
      SELECT 1 FROM appraisals a
      JOIN properties p ON p.id = a.property_id
      WHERE a.id = reviews.appraisal_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Reviewers can insert reviews"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'reviewer')
    )
  );

CREATE POLICY "Reviewers can update their reviews"
  ON reviews FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = reviewer_id OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() = reviewer_id OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- RLS Policies for deliveries
CREATE POLICY "Users can view deliveries for their properties"
  ON deliveries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM appraisals a
      JOIN properties p ON p.id = a.property_id
      WHERE a.id = deliveries.appraisal_id
      AND p.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'reviewer')
    )
  );

CREATE POLICY "Staff can insert deliveries"
  ON deliveries FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'reviewer')
    )
  );