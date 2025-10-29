/* Extend full_reports to include appraisal documents, boundaries, services, and attachments */

CREATE OR REPLACE VIEW full_reports AS
SELECT
  a.id                         AS appraisal_id,
  p.id                         AS property_id,
  p.user_id                    AS owner_id,
  -- Property
  p.property_address,
  p.property_type,
  p.area_sqm,
  p.bedrooms,
  p.bathrooms,
  p.year_built,
  p.owner_name,
  p.owner_contact,
  p.status                     AS property_status,
  p.created_at                 AS property_created_at,
  p.updated_at                 AS property_updated_at,
  -- Inspection (may be null)
  i.id                         AS inspection_id,
  i.inspection_date,
  i.structural_condition,
  i.interior_condition,
  i.exterior_condition,
  i.amenities,
  i.defects,
  i.photos,
  i.notes                      AS inspection_notes,
  i.status                     AS inspection_status,
  i.created_at                 AS inspection_created_at,
  i.completed_at               AS inspection_completed_at,
  i.building_license_no,
  i.plan_no,
  i.land_use,
  i.onsite_services,
  i.parcel_no,
  i.neighbor_built,
  i.land_nature,
  i.is_occupied,
  -- Appraisal core
  a.appraiser_id,
  a.market_value,
  a.land_value,
  a.building_value,
  a.valuation_method,
  a.comparable_properties,
  a.adjustments,
  a.final_value,
  a.confidence_level,
  a.notes                      AS appraisal_notes,
  a.status                     AS appraisal_status,
  a.created_at                 AS appraisal_created_at,
  a.completed_at               AS appraisal_completed_at,
  -- Appraisal terms
  a.purpose,
  a.value_basis,
  a.method_used,
  a.currency,
  a.ownership_type,
  a.assignment_date,
  a.inspection_date_ro,
  a.inspection_time_ro,
  a.assumptions,
  a.info_source_user_id,
  -- Appraisal documents & boundaries & services & attachments
  a.deed_number,
  a.deed_date,
  a.doc_building_license_no,
  a.doc_building_license_date,
  a.boundary_north,
  a.boundary_south,
  a.boundary_east,
  a.boundary_west,
  a.public_services,
  a.health_services,
  a.attachments,
  -- Review (latest)
  r.id                         AS review_id,
  r.reviewer_id,
  r.review_status,
  r.comments,
  r.requested_changes,
  r.created_at                 AS review_created_at,
  r.completed_at               AS review_completed_at,
  -- Delivery (required for full report)
  d.id                         AS delivery_id,
  d.delivered_by,
  d.delivery_method,
  d.recipient_email,
  d.report_url,
  d.delivered_at,
  d.created_at                 AS delivery_created_at
FROM appraisals a
JOIN properties p ON p.id = a.property_id
LEFT JOIN inspections i ON i.id = a.inspection_id
LEFT JOIN LATERAL (
  SELECT r1.*
  FROM reviews r1
  WHERE r1.appraisal_id = a.id
  ORDER BY r1.created_at DESC
  LIMIT 1
) r ON TRUE
JOIN deliveries d ON d.appraisal_id = a.id
WHERE a.status = 'completed';

GRANT SELECT ON full_reports TO authenticated;

