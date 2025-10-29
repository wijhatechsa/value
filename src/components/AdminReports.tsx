import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

interface ReportRow {
  appraisal_id: string;
  property_id: string;
  owner_id: string;
  property_address: string;
  property_type: string;
  area_sqm: number;
  owner_name: string;
  final_value: number | null;
  review_status: string | null;
  delivered_at: string;
}

interface Props { onBack: () => void }

export const AdminReports: React.FC<Props> = ({ onBack }) => {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // filters
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase.from('full_reports')
        .select('appraisal_id, property_id, owner_id, property_address, property_type, area_sqm, owner_name, final_value, review_status, delivered_at')
        .order('delivered_at', { ascending: false });

      if (type) query = query.eq('property_type', type);
      if (status) query = query.eq('review_status', status);
      if (from) query = query.gte('delivered_at', from);
      if (to) query = query.lte('delivered_at', to);
      if (q) query = query.or(`property_address.ilike.%${q}%,owner_name.ilike.%${q}%`);

      const { data, error } = await query;
      if (error) throw error;
      setRows((data as any) || []);
    } catch (e: any) {
      const msg = e?.message || 'تعذر تحميل التقارير';
      // If view not in schema cache
      if ((msg + '').toLowerCase().includes('schema cache')) {
        setError('الـ view غير محمّل بعد في الـ API. قم بتنفيذ: NOTIFY pgrst, \"reload schema\".');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { load(); }, [q, type, status, from, to]);

  const types = useMemo(() => ['residential', 'commercial', 'industrial', 'land'], []);
  const statuses = useMemo(() => ['approved', 'rejected', 'needs_revision', 'pending'], []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">تقارير مكتملة (إدارة)</h2>
        <button onClick={onBack} className="px-4 py-2 rounded-lg bg-amber-100 text-amber-800 hover:bg-amber-200">عودة</button>
      </div>

      <div className="bg-white rounded-xl shadow border p-4 grid md:grid-cols-5 gap-3">
        <input className="border rounded-lg px-3 py-2" placeholder="بحث بالعنوان/المالك" value={q} onChange={e => setQ(e.target.value)} />
        <select className="border rounded-lg px-3 py-2" value={type} onChange={e => setType(e.target.value)}>
          <option value="">نوع العقار</option>
          {types.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className="border rounded-lg px-3 py-2" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">حالة المراجعة</option>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <input type="date" className="border rounded-lg px-3 py-2" value={from} onChange={e => setFrom(e.target.value)} />
        <input type="date" className="border rounded-lg px-3 py-2" value={to} onChange={e => setTo(e.target.value)} />
      </div>

      {loading && <div className="bg-white rounded-xl shadow p-6">جاري التحميل...</div>}
      {error && !loading && (
        <div className="bg-white rounded-xl shadow p-6 text-red-600">{error}</div>
      )}

      {!loading && !error && (
        <div className="bg-white rounded-xl shadow border">
          <div className="grid grid-cols-12 px-4 py-3 border-b text-sm font-semibold text-gray-700">
            <div className="col-span-4">العنوان</div>
            <div className="col-span-2">النوع</div>
            <div className="col-span-2">القيمة النهائية</div>
            <div className="col-span-2">حالة المراجعة</div>
            <div className="col-span-2">تاريخ التسليم</div>
          </div>
          {rows.map(r => (
            <div key={r.appraisal_id} className="grid grid-cols-12 px-4 py-3 border-b text-sm">
              <div className="col-span-4 truncate">{r.property_address}</div>
              <div className="col-span-2">{r.property_type}</div>
              <div className="col-span-2">{r.final_value ?? '-'}</div>
              <div className="col-span-2">{r.review_status ?? '-'}</div>
              <div className="col-span-2">{new Date(r.delivered_at).toLocaleDateString()}</div>
            </div>
          ))}
          {rows.length === 0 && (
            <div className="px-4 py-6 text-center text-gray-500">لا توجد تقارير مطابقة للفلاتر الحالية</div>
          )}
        </div>
      )}
    </div>
  );
};

