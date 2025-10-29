import React, { useEffect, useState } from 'react';
import { supabase, Property, Inspection, Appraisal } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ClientInfoCard } from './ClientInfoCard';
import { DollarSign } from 'lucide-react';

interface AppraisalFormProps {
  property: Property;
  inspection: Inspection | null;
  appraisal: Appraisal | null;
  onSuccess: () => void;
  canEdit: boolean;
}

export const AppraisalForm: React.FC<AppraisalFormProps> = ({
  property,
  inspection,
  appraisal,
  onSuccess,
  canEdit,
}) => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    market_value: '',
    land_value: '',
    building_value: '',
    valuation_method: 'comparative',
    final_value: '',
    confidence_level: 'medium',
    notes: '',
    status: 'pending',
    // assumptions & terms
    purpose: '',
    value_basis: '',
    method_used: '',
    currency: 'SAR',
    ownership_type: '',
    assignment_date: '',
    inspection_date_ro: '',
    inspection_time_ro: '',
    assumptions: '',
    // property documents
    deed_number: '',
    deed_date: '',
    doc_building_license_no: '',
    doc_building_license_date: '',
    // boundaries & services
    boundary_north: '',
    boundary_south: '',
    boundary_east: '',
    boundary_west: '',
    public_services: [] as string[],
    health_services: [] as string[],
    // attachments
    attachments: [] as { name: string; path?: string; url?: string; uploaded_at?: string }[],
  });

  useEffect(() => {
    if (appraisal) {
      setFormData({
        market_value: appraisal.market_value?.toString() || '',
        land_value: appraisal.land_value?.toString() || '',
        building_value: appraisal.building_value?.toString() || '',
        valuation_method: appraisal.valuation_method || 'comparative',
        final_value: appraisal.final_value?.toString() || '',
        confidence_level: appraisal.confidence_level || 'medium',
        notes: appraisal.notes || '',
        status: appraisal.status,
        purpose: (appraisal as any).purpose || '',
        value_basis: (appraisal as any).value_basis || '',
        method_used: (appraisal as any).method_used || '',
        currency: (appraisal as any).currency || 'SAR',
        ownership_type: (appraisal as any).ownership_type || '',
        assignment_date: (appraisal as any).assignment_date || '',
        inspection_date_ro: (appraisal as any).inspection_date_ro || (inspection?.inspection_date || ''),
        inspection_time_ro: (appraisal as any).inspection_time_ro || '',
        assumptions: (appraisal as any).assumptions || '',
        deed_number: (appraisal as any).deed_number || '',
        deed_date: (appraisal as any).deed_date || '',
        doc_building_license_no: (appraisal as any).doc_building_license_no || (inspection?.building_license_no || ''),
        doc_building_license_date: (appraisal as any).doc_building_license_date || '',
        boundary_north: (appraisal as any).boundary_north || '',
        boundary_south: (appraisal as any).boundary_south || '',
        boundary_east: (appraisal as any).boundary_east || '',
        boundary_west: (appraisal as any).boundary_west || '',
        public_services: ((appraisal as any).public_services as any) || [],
        health_services: ((appraisal as any).health_services as any) || [],
        attachments: ((appraisal as any).attachments as any) || [],
      });
    }
  }, [appraisal, inspection?.inspection_date, inspection?.building_license_no]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const appraisalData = {
        property_id: property.id,
        inspection_id: inspection?.id || null,
        market_value: parseFloat(formData.market_value),
        land_value: parseFloat(formData.land_value),
        building_value: parseFloat(formData.building_value),
        valuation_method: formData.valuation_method,
        final_value: parseFloat(formData.final_value),
        confidence_level: formData.confidence_level,
        notes: formData.notes,
        status: formData.status,
        purpose: formData.purpose || null,
        value_basis: formData.value_basis || null,
        method_used: formData.method_used || null,
        currency: formData.currency || null,
        ownership_type: formData.ownership_type || null,
        assignment_date: formData.assignment_date || null,
        inspection_date_ro: formData.inspection_date_ro || (inspection?.inspection_date || null),
        inspection_time_ro: formData.inspection_time_ro || null,
        assumptions: formData.assumptions || null,
        deed_number: formData.deed_number || null,
        deed_date: formData.deed_date || null,
        doc_building_license_no: formData.doc_building_license_no || (inspection?.building_license_no || null),
        doc_building_license_date: formData.doc_building_license_date || null,
        boundary_north: formData.boundary_north || null,
        boundary_south: formData.boundary_south || null,
        boundary_east: formData.boundary_east || null,
        boundary_west: formData.boundary_west || null,
        public_services: formData.public_services || [],
        health_services: formData.health_services || [],
        attachments: formData.attachments || [],
      } as any;

      if (appraisal?.id) {
        const { error: upErr } = await supabase.from('appraisals').update(appraisalData).eq('id', appraisal.id);
        if (upErr) throw upErr;
      } else {
        const { error: insErr } = await supabase.from('appraisals').insert(appraisalData);
        if (insErr) throw insErr;
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'فشل حفظ التقييم');
    } finally {
      setLoading(false);
    }
  };

  if (!canEdit && appraisal) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 p-6 rounded-xl border-2 border-amber-300" dir="rtl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-amber-900">ملخص التقييم</h3>
            <DollarSign className="w-8 h-8 text-amber-600" />
          </div>
          <p className="text-4xl font-bold text-amber-700">{appraisal.final_value?.toLocaleString('ar-SA')} ريال</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-sm text-gray-700">
            <div>قيمة السوق: <span className="font-medium">{appraisal.market_value?.toLocaleString('ar-SA')} ريال</span></div>
            <div>قيمة الأرض: <span className="font-medium">{appraisal.land_value?.toLocaleString('ar-SA')} ريال</span></div>
            <div>قيمة المبنى: <span className="font-medium">{appraisal.building_value?.toLocaleString('ar-SA')} ريال</span></div>
            <div>طريقة التقييم: <span className="font-medium">{appraisal.valuation_method}</span></div>
            <div>مستوى الثقة: <span className="font-medium">{appraisal.confidence_level}</span></div>
          </div>
          {appraisal.notes && (
            <div className="mt-4">
              <div className="text-sm text-gray-600">ملاحظات</div>
              <p className="text-gray-800 whitespace-pre-wrap">{appraisal.notes}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" dir="rtl">
      {profile?.role && profile.role !== 'client' && (
        <div className="mb-4"><ClientInfoCard property={property} /></div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      <div className="bg-white rounded-xl border p-4 space-y-4">
        <h3 className="font-semibold">القيم الأساسية</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">قيمة السوق</label>
            <input type="number" value={formData.market_value} onChange={e=>setFormData({...formData, market_value: e.target.value})} className="w-full px-4 py-3 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">قيمة الأرض</label>
            <input type="number" value={formData.land_value} onChange={e=>setFormData({...formData, land_value: e.target.value})} className="w-full px-4 py-3 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">قيمة المبنى</label>
            <input type="number" value={formData.building_value} onChange={e=>setFormData({...formData, building_value: e.target.value})} className="w-full px-4 py-3 border rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">طريقة التقييم</label>
            <select value={formData.valuation_method} onChange={e=>setFormData({...formData, valuation_method: e.target.value})} className="w-full px-4 py-3 border rounded-lg">
              <option value="comparative">المقارنة</option>
              <option value="cost">التكلفة</option>
              <option value="income">الدخل</option>
              <option value="mixed">مختلطة</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">القيمة النهائية</label>
            <input type="number" value={formData.final_value} onChange={e=>setFormData({...formData, final_value: e.target.value})} className="w-full px-4 py-3 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">مستوى الثقة</label>
            <select value={formData.confidence_level} onChange={e=>setFormData({...formData, confidence_level: e.target.value})} className="w-full px-4 py-3 border rounded-lg">
              <option value="low">منخفض</option>
              <option value="medium">متوسط</option>
              <option value="high">عالٍ</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات</label>
          <textarea value={formData.notes} onChange={e=>setFormData({...formData, notes: e.target.value})} className="w-full px-4 py-3 border rounded-lg" rows={3} />
        </div>
      </div>

      <div className="bg-white rounded-xl border p-4 space-y-4">
        <h3 className="font-semibold">الافتراضات والشروط</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">الغرض من التقييم</label>
            <select value={formData.purpose} onChange={e=>setFormData({...formData, purpose: e.target.value})} className="w-full px-4 py-3 border rounded-lg">
              <option value="">اختر</option>
              <option value="financing">تمويل</option>
              <option value="mortgage">رهن</option>
              <option value="purchase">شراء</option>
              <option value="sale">بيع</option>
              <option value="dispute">نزاع</option>
              <option value="internal">استخدام داخلي</option>
              <option value="other">أخرى</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">أساس القيمة</label>
            <select value={formData.value_basis} onChange={e=>setFormData({...formData, value_basis: e.target.value})} className="w-full px-4 py-3 border rounded-lg">
              <option value="">اختر</option>
              <option value="market">قيمة السوق</option>
              <option value="replacement">قيمة الإحلال</option>
              <option value="liquidation">قيمة التصفية</option>
              <option value="income">الدخل</option>
              <option value="other">أخرى</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">الطريقة المستخدمة</label>
            <select value={formData.method_used} onChange={e=>setFormData({...formData, method_used: e.target.value})} className="w-full px-4 py-3 border rounded-lg">
              <option value="">اختر</option>
              <option value="comparative">المقارنة</option>
              <option value="cost">التكلفة</option>
              <option value="income">الدخل</option>
              <option value="mixed">مختلطة</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">العملة</label>
            <select value={formData.currency} onChange={e=>setFormData({...formData, currency: e.target.value})} className="w-full px-4 py-3 border rounded-lg">
              <option value="SAR">SAR</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="AED">AED</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">نوع الملكية</label>
            <select value={formData.ownership_type} onChange={e=>setFormData({...formData, ownership_type: e.target.value})} className="w-full px-4 py-3 border rounded-lg">
              <option value="">اختر</option>
              <option value="freehold">ملكية كاملة</option>
              <option value="usufruct">منفعة</option>
              <option value="leasehold">إيجار طويل</option>
              <option value="other">أخرى</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ التكليف</label>
            <input type="date" value={formData.assignment_date} onChange={e=>setFormData({...formData, assignment_date: e.target.value})} className="w-full px-4 py-3 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ المعاينة (من تقرير المعاينة)</label>
            <input type="date" value={formData.inspection_date_ro || inspection?.inspection_date || ''} readOnly className="w-full px-4 py-3 border rounded-lg bg-gray-50" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">وقت المعاينة</label>
            <input type="time" value={formData.inspection_time_ro} onChange={e=>setFormData({...formData, inspection_time_ro: e.target.value})} className="w-full px-4 py-3 border rounded-lg" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">الافتراضات</label>
            <textarea value={formData.assumptions} onChange={e=>setFormData({...formData, assumptions: e.target.value})} className="w-full px-4 py-3 border rounded-lg" rows={3} />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end">
        <button type="submit" disabled={loading} className="bg-amber-600 text-white px-5 py-3 rounded-lg hover:bg-amber-700 disabled:opacity-50">
          {loading ? 'جارٍ الحفظ...' : 'حفظ التقييم'}
        </button>
      </div>
    </form>
  );
};

