import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Property, Inspection, Appraisal, Review, Delivery } from '../lib/supabase';

interface FullReportRow {
  appraisal_id: string;
  property_id: string;
  owner_id: string;
  property_address: string;
  property_type: string;
  area_sqm: number;
  bedrooms: number | null;
  bathrooms: number | null;
  year_built: number | null;
  owner_name: string;
  owner_contact: string;
  property_status: string;
  property_created_at: string;
  property_updated_at: string;

  inspection_id: string | null;
  inspection_date: string | null;
  structural_condition: string | null;
  interior_condition: string | null;
  exterior_condition: string | null;
  amenities: any[] | null;
  defects: any[] | null;
  photos: any[] | null;
  inspection_notes: string | null;
  inspection_status: string | null;
  inspection_created_at: string | null;
  inspection_completed_at: string | null;
  building_license_no?: string | null;
  plan_no?: string | null;
  land_use?: string | null;
  onsite_services?: any[] | null;
  parcel_no?: string | null;
  neighbor_built?: boolean | null;
  land_nature?: string | null;
  is_occupied?: boolean | null;

  appraiser_id: string | null;
  market_value: number | null;
  land_value: number | null;
  building_value: number | null;
  valuation_method: string | null;
  comparable_properties: any[] | null;
  adjustments: any[] | null;
  final_value: number | null;
  confidence_level: string | null;
  appraisal_notes: string | null;
  appraisal_status: string;
  appraisal_created_at: string;
  appraisal_completed_at: string | null;

  review_id: string | null;
  reviewer_id: string | null;
  review_status: string | null;
  comments: string | null;
  requested_changes: any[] | null;
  review_created_at: string | null;
  review_completed_at: string | null;

  delivery_id: string;
  delivered_by: string | null;
  delivery_method: string;
  recipient_email: string;
  report_url: string | null;
  delivered_at: string;
  delivery_created_at: string;
  // Appraisal terms
  purpose?: string | null;
  value_basis?: string | null;
  method_used?: string | null;
  currency?: string | null;
  ownership_type?: string | null;
  assignment_date?: string | null;
  inspection_date_ro?: string | null;
  inspection_time_ro?: string | null;
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

export const FullReport: React.FC<{ appraisalId: string; onBack: () => void }> = ({ appraisalId, onBack }) => {
  const { user, profile } = useAuth();
  const [row, setRow] = useState<FullReportRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('full_reports')
        .select('*')
        .eq('appraisal_id', appraisalId)
        .maybeSingle();
      if (error) {
        // Fallback: if the view isn't visible to PostgREST yet, assemble from base tables
        const msg = `${error.message || ''}`.toLowerCase();
        if (msg.includes('schema cache') || msg.includes('full_reports') || msg.includes('not exist')) {
          try {
            const assembled = await loadFromBaseTables(appraisalId);
            if (assembled) setRow(assembled);
            else setError('لا يوجد تقرير متاح بعد لهذا الطلب');
          } catch (e: any) {
            setError(e?.message || 'تعذر تحميل التقرير من الجداول الأساسية');
          }
        } else {
          setError(error.message);
        }
      } else {
        let base = data as any;
        // Backfill boundaries/services/docs if the SQL view doesn't include them yet
        const needsBackfill =
          base.boundary_north === undefined ||
          base.boundary_south === undefined ||
          base.boundary_east === undefined ||
          base.boundary_west === undefined ||
          base.public_services === undefined ||
          base.health_services === undefined ||
          base.deed_number === undefined ||
          base.deed_date === undefined ||
          base.doc_building_license_no === undefined ||
          base.doc_building_license_date === undefined ||
          base.purpose === undefined ||
          base.value_basis === undefined ||
          base.method_used === undefined ||
          base.currency === undefined ||
          base.ownership_type === undefined ||
          base.assignment_date === undefined ||
          base.inspection_date_ro === undefined ||
          base.inspection_time_ro === undefined ||
          base.assumptions === undefined;

        if (needsBackfill) {
          try {
            const patched = await backfillFromAppraisal(appraisalId, base);
            setRow(patched);
          } catch {
            setRow(base);
          }
        } else {
          setRow(base);
        }
      }
      setLoading(false);
    })();
  }, [appraisalId]);

  const loadFromBaseTables = async (appraisalId: string): Promise<FullReportRow | null> => {
    // 1) appraisal
    const { data: appraisal, error: e1 } = await supabase
      .from('appraisals')
      .select('*')
      .eq('id', appraisalId)
      .maybeSingle<Appraisal>();
    if (e1 || !appraisal || appraisal.status !== 'completed') return null;

    // 2) delivery (must exist for a "full" report)
    const { data: delivery } = await supabase
      .from('deliveries')
      .select('*')
      .eq('appraisal_id', appraisalId)
      .maybeSingle<Delivery>();
    if (!delivery) return null;

    // 3) property
    const { data: property } = await supabase
      .from('properties')
      .select('*')
      .eq('id', appraisal.property_id)
      .maybeSingle<Property>();

    // 4) inspection (optional)
    const { data: inspection } = await supabase
      .from('inspections')
      .select('*')
      .eq('id', appraisal.inspection_id as any)
      .maybeSingle<Inspection>();

    // 5) latest review (optional)
    const { data: review } = await supabase
      .from('reviews')
      .select('*')
      .eq('appraisal_id', appraisalId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle<Review>();

    if (!property) return null;

    return {
      appraisal_id: appraisal.id,
      property_id: property.id,
      owner_id: property.user_id,
      property_address: property.property_address,
      property_type: property.property_type,
      area_sqm: Number(property.area_sqm as any),
      bedrooms: property.bedrooms ?? null,
      bathrooms: property.bathrooms ?? null,
      year_built: property.year_built ?? null,
      owner_name: property.owner_name,
      owner_contact: property.owner_contact,
      property_status: property.status,
      property_created_at: property.created_at,
      property_updated_at: property.updated_at,

      inspection_id: inspection?.id ?? null,
      inspection_date: inspection?.inspection_date ?? null as any,
      structural_condition: inspection?.structural_condition ?? null,
      interior_condition: inspection?.interior_condition ?? null,
      exterior_condition: inspection?.exterior_condition ?? null,
      amenities: (inspection as any)?.amenities ?? null,
      defects: (inspection as any)?.defects ?? null,
      photos: (inspection as any)?.photos ?? null,
      inspection_notes: inspection?.notes ?? null,
      inspection_status: inspection?.status ?? null,
      inspection_created_at: inspection?.created_at ?? null as any,
      inspection_completed_at: inspection?.completed_at ?? null as any,
      building_license_no: (inspection as any)?.building_license_no ?? null,
      plan_no: (inspection as any)?.plan_no ?? null,
      land_use: (inspection as any)?.land_use ?? null,
      onsite_services: (inspection as any)?.onsite_services ?? null,
      parcel_no: (inspection as any)?.parcel_no ?? null,
      neighbor_built: (inspection as any)?.neighbor_built ?? null,
      land_nature: (inspection as any)?.land_nature ?? null,
      is_occupied: (inspection as any)?.is_occupied ?? null,

      appraiser_id: appraisal.appraiser_id ?? null,
      market_value: (appraisal as any).market_value ?? null,
      land_value: (appraisal as any).land_value ?? null,
      building_value: (appraisal as any).building_value ?? null,
      valuation_method: appraisal.valuation_method ?? null,
      comparable_properties: (appraisal as any).comparable_properties ?? null,
      adjustments: (appraisal as any).adjustments ?? null,
      final_value: (appraisal as any).final_value ?? null,
      confidence_level: appraisal.confidence_level ?? null,
      appraisal_notes: appraisal.notes ?? null,
      appraisal_status: appraisal.status,
      appraisal_created_at: appraisal.created_at,
      appraisal_completed_at: appraisal.completed_at ?? null,

      review_id: review?.id ?? null,
      reviewer_id: review?.reviewer_id ?? null,
      review_status: review?.review_status ?? null,
      comments: review?.comments ?? null,
      requested_changes: (review as any)?.requested_changes ?? null,
      review_created_at: review?.created_at ?? null,
      review_completed_at: review?.completed_at ?? null,

      delivery_id: delivery.id,
      delivered_by: delivery.delivered_by ?? null,
      delivery_method: delivery.delivery_method,
      recipient_email: delivery.recipient_email,
      report_url: delivery.report_url ?? null,
      delivered_at: delivery.delivered_at,
      delivery_created_at: delivery.created_at,

      // backfill docs/boundaries/services from appraisal
      deed_number: (appraisal as any)?.deed_number ?? null,
      deed_date: (appraisal as any)?.deed_date ?? null,
      doc_building_license_no:
        (appraisal as any)?.doc_building_license_no ?? (inspection as any)?.building_license_no ?? null,
      doc_building_license_date: (appraisal as any)?.doc_building_license_date ?? null,
      boundary_north: (appraisal as any)?.boundary_north ?? null,
      boundary_south: (appraisal as any)?.boundary_south ?? null,
      boundary_east: (appraisal as any)?.boundary_east ?? null,
      boundary_west: (appraisal as any)?.boundary_west ?? null,
      public_services: (appraisal as any)?.public_services ?? null,
      health_services: (appraisal as any)?.health_services ?? null,

      // appraisal terms
      purpose: (appraisal as any)?.purpose ?? null,
      value_basis: (appraisal as any)?.value_basis ?? null,
      method_used: (appraisal as any)?.method_used ?? null,
      currency: (appraisal as any)?.currency ?? null,
      ownership_type: (appraisal as any)?.ownership_type ?? null,
      assignment_date: (appraisal as any)?.assignment_date ?? null,
      inspection_date_ro: (appraisal as any)?.inspection_date_ro ?? (inspection as any)?.inspection_date ?? null,
      inspection_time_ro: (appraisal as any)?.inspection_time_ro ?? null,
      assumptions: (appraisal as any)?.assumptions ?? null,
    } as FullReportRow;
  };

  const backfillFromAppraisal = async (appraisalId: string, base: any): Promise<FullReportRow> => {
    const { data: appraisal } = await supabase
      .from('appraisals')
      .select('*')
      .eq('id', appraisalId)
      .maybeSingle<Appraisal>();
    if (!appraisal) return base as FullReportRow;
    const patched: any = { ...base };
    const pickIfUndef = (k: string, v: any) => {
      if (patched[k] === undefined) patched[k] = v ?? null;
    };
    pickIfUndef('deed_number', (appraisal as any).deed_number);
    pickIfUndef('deed_date', (appraisal as any).deed_date);
    pickIfUndef('doc_building_license_no', (appraisal as any).doc_building_license_no);
    pickIfUndef('doc_building_license_date', (appraisal as any).doc_building_license_date);
    pickIfUndef('boundary_north', (appraisal as any).boundary_north);
    pickIfUndef('boundary_south', (appraisal as any).boundary_south);
    pickIfUndef('boundary_east', (appraisal as any).boundary_east);
    pickIfUndef('boundary_west', (appraisal as any).boundary_west);
    pickIfUndef('public_services', (appraisal as any).public_services);
    pickIfUndef('health_services', (appraisal as any).health_services);
    pickIfUndef('purpose', (appraisal as any).purpose);
    pickIfUndef('value_basis', (appraisal as any).value_basis);
    pickIfUndef('method_used', (appraisal as any).method_used);
    pickIfUndef('currency', (appraisal as any).currency);
    pickIfUndef('ownership_type', (appraisal as any).ownership_type);
    pickIfUndef('assignment_date', (appraisal as any).assignment_date);
    pickIfUndef('inspection_date_ro', (appraisal as any).inspection_date_ro);
    pickIfUndef('inspection_time_ro', (appraisal as any).inspection_time_ro);
    pickIfUndef('assumptions', (appraisal as any).assumptions);
    return patched as FullReportRow;
  };

  const canView = () => {
    if (!row) return false;
    if (profile?.role === 'admin') return true;
    return user?.id === row.owner_id;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow p-6 text-center">جاري التحميل...</div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow p-6 text-center">
        <div className="text-red-600 font-medium mb-2">حدث خطأ في تحميل التقرير</div>
        <div className="text-xs text-gray-500">{error}</div>
      </div>
    );
  }

  if (!row) {
    return (
      <div className="bg-white rounded-xl shadow p-6 text-center">لا يوجد تقرير متاح بعد لهذا الطلب</div>
    );
  }

  if (!canView()) {
    return (
      <div className="bg-white rounded-xl shadow p-6 text-center">لا تملك صلاحية عرض هذا التقرير</div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl border shadow p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">التقرير الكامل</h2>
            <p className="text-sm text-gray-600">رقم العقار: {row.property_id}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 rounded-full text-xs bg-emerald-50 text-emerald-700 border border-emerald-200">تم التسليم {new Date(row.delivered_at).toLocaleDateString()}</span>
            <span className="px-3 py-1 rounded-full text-xs bg-amber-50 text-amber-700 border border-amber-200">التقييم: {row.appraisal_status}</span>
            {row.review_status && (
              <span className="px-3 py-1 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-200">المراجعة: {row.review_status}</span>
            )}
            {row.report_url && (
              <a href={row.report_url} target="_blank" rel="noreferrer" className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700">فتح التقرير PDF</a>
            )}
            <button onClick={onBack} className="px-4 py-2 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200">عودة</button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white rounded-xl border shadow p-5">
            <h3 className="font-semibold text-gray-900 mb-3">بيانات العقار</h3>
            <div className="grid md:grid-cols-2 gap-3 text-sm text-gray-800">
              <div>العنوان: {row.property_address}</div>
              <div>النوع: {row.property_type}</div>
              <div>المساحة (م²): {row.area_sqm}</div>
              <div>غرف: {row.bedrooms ?? '-'}</div>
              <div>حمامات: {row.bathrooms ?? '-'}</div>
              <div>سنة البناء: {row.year_built ?? '-'}</div>
              <div className="md:col-span-2">المالك: {row.owner_name} — {row.owner_contact}</div>
            </div>
          </section>

          <section className="bg-white rounded-xl border shadow p-5">
            <h3 className="font-semibold text-gray-900 mb-3">بيانات مستندات العقار</h3>
            <div className="grid md:grid-cols-2 gap-3 text-sm text-gray-800">
              <div>رقم الصك: {row.deed_number ?? '-'}</div>
              <div>تاريخ الصك: {row.deed_date ?? '-'}</div>
              <div>رقم رخصة البناء: {row.doc_building_license_no ?? '-'}</div>
              <div>تاريخ رخصة البناء: {row.doc_building_license_date ?? '-'}</div>
            </div>
          </section>

          <section className="bg-white rounded-xl border shadow p-5">
            <h3 className="font-semibold text-gray-900 mb-3">تفاصيل المعاينة</h3>
            <div className="grid md:grid-cols-2 gap-3 text-sm text-gray-800">
              <div>تاريخ المعاينة: {row.inspection_date ?? '-'}</div>
              <div>هيكل: {row.structural_condition ?? '-'}</div>
              <div>داخلي: {row.interior_condition ?? '-'}</div>
              <div>خارجي: {row.exterior_condition ?? '-'}</div>
              <div className="md:col-span-2">ملاحظات: {row.inspection_notes ?? '-'}</div>
            </div>

            <div className="mt-5 grid md:grid-cols-2 gap-3 text-sm text-gray-800">
              <div>رقم رخصة البناء: {row.building_license_no ?? '-'}</div>
              <div>رقم المخطط: {row.plan_no ?? '-'}</div>
              <div>استخدام الأرض: {row.land_use ?? '-'}</div>
              <div>رقم القطعة: {row.parcel_no ?? '-'}</div>
              <div>طبيعة الأرض: {row.land_nature ?? '-'}</div>
              <div>الجار مبني: {row.neighbor_built ? 'نعم' : 'لا'}</div>
              <div>شاغلية العقار: {row.is_occupied ? 'نعم' : 'لا'}</div>
              <div className="md:col-span-2">
                <div className="text-sm text-gray-700 mb-2">الخدمات بالموقع:</div>
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    const v: any = (row as any).onsite_services;
                    let arr: any[] = Array.isArray(v) ? v : [];
                    if (!Array.isArray(v) && typeof v === 'string') {
                      const s = v.trim();
                      if (s) {
                        try {
                          const parsed = JSON.parse(s);
                          arr = Array.isArray(parsed) ? parsed : s.split(/\r?\n|,/);
                        } catch {
                          arr = s.split(/\r?\n|,/);
                        }
                      }
                    }
                    arr = arr.filter(Boolean);
                    return arr.length
                      ? arr.map((s, i) => (
                          <span key={i} className="px-2 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 text-xs">{String(s)}</span>
                        ))
                      : <span>-</span>;
                  })()}
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl border shadow p-5">
            <h3 className="font-semibold text-gray-900 mb-3">الحدود والأطوال والخدمات</h3>
            <div className="grid md:grid-cols-2 gap-3 text-sm text-gray-800">
              <div>شمالاً بطول: {row.boundary_north ?? '-'}</div>
              <div>جنوباً بطول: {row.boundary_south ?? '-'}</div>
              <div>شرقاً بطول: {row.boundary_east ?? '-'}</div>
              <div>غرباً بطول: {row.boundary_west ?? '-'}</div>
              <div className="md:col-span-2">
                <div className="text-sm text-gray-700 mb-2">الخدمات والمراكز الحكومية:</div>
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    const v: any = (row as any).public_services;
                    let arr: any[] = Array.isArray(v) ? v : [];
                    if (!Array.isArray(v) && typeof v === 'string') {
                      const s = v.trim();
                      if (s) {
                        try {
                          const parsed = JSON.parse(s);
                          arr = Array.isArray(parsed) ? parsed : s.split(/\r?\n|,/);
                        } catch {
                          arr = s.split(/\r?\n|,/);
                        }
                      }
                    }
                    arr = arr.filter(Boolean);
                    return arr.length
                      ? arr.map((s, i) => (
                          <span key={i} className="px-2 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200 text-xs">{String(s)}</span>
                        ))
                      : <span>-</span>;
                  })()}
                </div>
              </div>
              <div className="md:col-span-2">
                <div className="text-sm text-gray-700 mb-2">الخدمات الصحية والطبية:</div>
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    const v: any = (row as any).health_services;
                    let arr: any[] = Array.isArray(v) ? v : [];
                    if (!Array.isArray(v) && typeof v === 'string') {
                      const s = v.trim();
                      if (s) {
                        try {
                          const parsed = JSON.parse(s);
                          arr = Array.isArray(parsed) ? parsed : s.split(/\r?\n|,/);
                        } catch {
                          arr = s.split(/\r?\n|,/);
                        }
                      }
                    }
                    arr = arr.filter(Boolean);
                    return arr.length
                      ? arr.map((s, i) => (
                          <span key={i} className="px-2 py-1 rounded-full bg-green-100 text-green-800 border border-green-200 text-xs">{String(s)}</span>
                        ))
                      : <span>-</span>;
                  })()}
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl border shadow p-5">
            <h3 className="font-semibold text-gray-900 mb-3">التقييم</h3>
            <div className="grid md:grid-cols-2 gap-3 text-sm text-gray-800">
              <div>القيمة السوقية: {row.market_value ?? '-'}</div>
              <div>قيمة الأرض: {row.land_value ?? '-'}</div>
              <div>قيمة المبنى: {row.building_value ?? '-'}</div>
              <div>المنهج: {row.valuation_method ?? '-'}</div>
              <div>الثقة: {row.confidence_level ?? '-'}</div>
              <div className="md:col-span-2">ملاحظات: {row.appraisal_notes ?? '-'}</div>
            </div>
          </section>

          <section className="bg-white rounded-xl border shadow p-5">
            <h3 className="font-semibold text-gray-900 mb-3">فرضيات وشروط التقييم</h3>
            <div className="grid md:grid-cols-2 gap-3 text-sm text-gray-800">
              <div>الغرض من التقرير: {row.purpose ?? '-'}</div>
              <div>أساس القيمة: {row.value_basis ?? '-'}</div>
              <div>الأسلوب المستخدم: {row.method_used ?? '-'}</div>
              <div>العملة المستخدمة: {row.currency ?? '-'}</div>
              <div>نوع الملكية: {row.ownership_type ?? '-'}</div>
              <div>تاريخ التكليف: {row.assignment_date ?? '-'}</div>
              <div>تاريخ المعاينة: {row.inspection_date_ro ?? row.inspection_date ?? '-'}</div>
              <div>وقت المعاينة: {row.inspection_time_ro ?? '-'}</div>
              <div className="md:col-span-2">فرضيات وشروط: {row.assumptions ?? '-'}</div>
            </div>
          </section>

          <section className="bg-white rounded-xl border shadow p-5">
            <h3 className="font-semibold text-gray-900 mb-3">المقارنات والتعديلات</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-800">
              <div>
                <div className="text-gray-700 mb-1">المقارنات</div>
                <pre className="bg-gray-50 rounded border p-3 whitespace-pre-wrap break-words text-xs">{JSON.stringify(row.comparable_properties ?? [], null, 2)}</pre>
              </div>
              <div>
                <div className="text-gray-700 mb-1">التعديلات</div>
                <pre className="bg-gray-50 rounded border p-3 whitespace-pre-wrap break-words text-xs">{JSON.stringify(row.adjustments ?? [], null, 2)}</pre>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-white rounded-xl border shadow p-5">
            <h3 className="font-semibold text-gray-900 mb-3">المراجعة والتسليم</h3>
            <div className="text-sm text-gray-800 space-y-2">
              <div>حالة المراجعة: {row.review_status ?? '-'}</div>
              <div>تعليقات: {row.comments ?? '-'}</div>
              <div>طريقة التسليم: {row.delivery_method}</div>
              <div>البريد المستلم: {row.recipient_email}</div>
              <div>تاريخ التسليم: {new Date(row.delivered_at).toLocaleString()}</div>
            </div>
          </section>

          <section className="bg-white rounded-xl border shadow p-5">
            <h3 className="font-semibold text-gray-900 mb-3">المرفقات</h3>
            {(row.attachments as any[] | null)?.length ? (
              <div className="space-y-2">
                {(row.attachments as any[]).map((att: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-sm px-3 py-2 border rounded">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800">{att.name || `ملف ${idx+1}`}</span>
                      {att.url && <a href={att.url} target="_blank" rel="noreferrer" className="text-amber-700 hover:underline">فتح</a>}
                    </div>
                    {att.uploaded_at && <span className="text-xs text-gray-500">{new Date(att.uploaded_at).toLocaleString()}</span>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-600">لا توجد مرفقات</div>
            )}
          </section>

          <section className="bg-white rounded-xl border shadow p-5">
            <h3 className="font-semibold text-gray-900 mb-3">معلومات تقنية</h3>
            <div className="text-xs text-gray-600 space-y-1">
              <div>تم إنشاء التقييم: {new Date(row.appraisal_created_at).toLocaleString()}</div>
              {row.appraisal_completed_at && <div>اكتمل التقييم: {new Date(row.appraisal_completed_at).toLocaleString()}</div>}
              {row.inspection_created_at && <div>بدء المعاينة: {new Date(row.inspection_created_at).toLocaleString()}</div>}
              {row.inspection_completed_at && <div>اكتمال المعاينة: {new Date(row.inspection_completed_at).toLocaleString()}</div>}
              <div>تسليم السجل: {new Date(row.delivery_created_at).toLocaleString()}</div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
