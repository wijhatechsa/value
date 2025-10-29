import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'admin' | 'appraiser' | 'inspector' | 'reviewer' | 'client';

export interface UserProfile {
  id: string;
  full_name: string;
  role: UserRole;
  phone: string | null;
  created_at: string;
  // Optional UI language preference
  locale?: 'ar' | 'en' | null;
}

export interface Property {
  id: string;
  user_id: string;
  property_address: string;
  property_type: string;
  area_sqm: number;
  bedrooms: number | null;
  bathrooms: number | null;
  year_built: number | null;
  owner_name: string;
  owner_contact: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Inspection {
  id: string;
  property_id: string;
  inspector_id: string | null;
  inspection_date: string | null;
  structural_condition: string | null;
  interior_condition: string | null;
  exterior_condition: string | null;
  amenities: any[];
  defects: any[];
  photos: any[];
  notes: string | null;
  status: string;
  created_at: string;
  completed_at: string | null;
  // Added editable fields for inspector
  building_license_no?: string | null;
  plan_no?: string | null;
  land_use?: string | null;
  onsite_services?: any[] | null;
  parcel_no?: string | null;
  neighbor_built?: boolean | null;
  land_nature?: string | null;
  is_occupied?: boolean | null;
}

export interface Appraisal {
  id: string;
  property_id: string;
  inspection_id: string | null;
  appraiser_id: string | null;
  market_value: number | null;
  land_value: number | null;
  building_value: number | null;
  valuation_method: string | null;
  comparable_properties: any[];
  adjustments: any[];
  final_value: number | null;
  confidence_level: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  completed_at: string | null;
  // assumptions & terms
  purpose?: string | null;
  value_basis?: string | null;
  method_used?: string | null;
  currency?: string | null;
  ownership_type?: string | null;
  assignment_date?: string | null; // date
  inspection_date_ro?: string | null; // date
  inspection_time_ro?: string | null; // time
  assumptions?: string | null;
  info_source_user_id?: string | null;
  // documents & boundaries & services & attachments
  deed_number?: string | null;
  deed_date?: string | null;
  doc_building_license_no?: string | null;
  doc_building_license_date?: string | null;
  boundary_north?: string | null;
  boundary_south?: string | null;
  boundary_east?: string | null;
  boundary_west?: string | null;
  public_services?: any[] | null;
  health_services?: any[] | null;
  attachments?: any[] | null;
}

export interface Review {
  id: string;
  appraisal_id: string;
  reviewer_id: string;
  review_status: string;
  comments: string | null;
  requested_changes: any[];
  created_at: string;
  completed_at: string | null;
}

export interface Delivery {
  id: string;
  appraisal_id: string;
  delivered_by: string;
  delivery_method: string;
  recipient_email: string;
  report_url: string | null;
  delivered_at: string;
  created_at: string;
}
