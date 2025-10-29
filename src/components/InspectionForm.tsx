import React, { useEffect, useState } from 'react';
import { ClientInfoCard } from './ClientInfoCard';
import { supabase, Property, Inspection } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Save, Plus, X } from 'lucide-react';

interface InspectionFormProps {
  property: Property;
  inspection: Inspection | null;
  onSuccess: () => void;
  canEdit: boolean;
}

export const InspectionForm: React.FC<InspectionFormProps> = ({
  property,
  inspection,
  onSuccess,
  canEdit,
}) => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [amenity, setAmenity] = useState('');
  const [defect, setDefect] = useState('');

  const [formData, setFormData] = useState({
    inspection_date: '',
    structural_condition: '',
    interior_condition: '',
    exterior_condition: '',
    amenities: [] as string[],
    defects: [] as string[],
    notes: '',
    status: 'pending',
    building_license_no: '',
    plan_no: '',
    land_use: '',
    onsite_services: [] as string[],
    parcel_no: '',
    neighbor_built: false,
    land_nature: '',
    is_occupied: false,
  });

  useEffect(() => {
    if (inspection) {
      setFormData({
        inspection_date: inspection.inspection_date || '',
        structural_condition: inspection.structural_condition || '',
        interior_condition: inspection.interior_condition || '',
        exterior_condition: inspection.exterior_condition || '',
        amenities: (inspection.amenities as any) || [],
        defects: (inspection.defects as any) || [],
        notes: inspection.notes || '',
        status: inspection.status,
        building_license_no: (inspection as any).building_license_no || '',
        plan_no: (inspection as any).plan_no || '',
        land_use: (inspection as any).land_use || '',
        onsite_services: ((inspection as any).onsite_services as any) || [],
        parcel_no: (inspection as any).parcel_no || '',
        neighbor_built: !!(inspection as any).neighbor_built,
        land_nature: (inspection as any).land_nature || '',
        is_occupied: !!(inspection as any).is_occupied,
      });
    }
  }, [inspection]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const inspectionData = {
        property_id: property.id,
        inspector_id: user?.id,
        inspection_date: formData.inspection_date,
        structural_condition: formData.structural_condition,
        interior_condition: formData.interior_condition,
        exterior_condition: formData.exterior_condition,
        amenities: formData.amenities,
        defects: formData.defects,
        notes: formData.notes,
        status: formData.status,
        completed_at: formData.status === 'completed' ? new Date().toISOString() : null,
        building_license_no: formData.building_license_no || null,
        plan_no: formData.plan_no || null,
        land_use: formData.land_use || null,
        onsite_services: formData.onsite_services || [],
        parcel_no: formData.parcel_no || null,
        neighbor_built: !!formData.neighbor_built,
        land_nature: formData.land_nature || null,
        is_occupied: !!formData.is_occupied,
      } as Partial<Inspection> & { property_id: string };

      if (inspection) {
        const { error: updateError } = await supabase
          .from('inspections')
          .update(inspectionData as any)
          .eq('id', inspection.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('inspections')
          .insert(inspectionData as any);
        if (insertError) throw insertError;
      }

      if (formData.status === 'completed') {
        await supabase
          .from('properties')
          .update({ status: 'inspection' })
          .eq('id', property.id);
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      setLoading(false);
    }
  };

  const addAmenity = () => {
    if (amenity.trim()) {
      setFormData({ ...formData, amenities: [...formData.amenities, amenity.trim()] });
      setAmenity('');
    }
  };

  const removeAmenity = (index: number) => {
    setFormData({
      ...formData,
      amenities: formData.amenities.filter((_, i) => i !== index),
    });
  };

  const addDefect = () => {
    if (defect.trim()) {
      setFormData({ ...formData, defects: [...formData.defects, defect.trim()] });
      setDefect('');
    }
  };

  const removeDefect = (index: number) => {
    setFormData({
      ...formData,
      defects: formData.defects.filter((_, i) => i !== index),
    });
  };

  if (!canEdit && !inspection) {
    return (
      <div className="text-center py-8 text-gray-600" dir="rtl">
        لا توجد بيانات فحص بعد لهذا العقار.
      </div>
    );
  }

  if (!canEdit && inspection) {
    return (
      <div className="space-y-6" dir="rtl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-600">تاريخ الفحص</label>
            <p className="text-lg text-gray-800 mt-1">{inspection.inspection_date}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">الحالة الإنشائية</label>
            <p className="text-lg text-gray-800 mt-1">{inspection.structural_condition}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">الحالة الداخلية</label>
            <p className="text-lg text-gray-800 mt-1">{inspection.interior_condition}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">الحالة الخارجية</label>
            <p className="text-lg text-gray-800 mt-1">{inspection.exterior_condition}</p>
          </div>
        </div>
        {inspection.amenities && inspection.amenities.length > 0 && (
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-2">المرافق</label>
            <div className="flex flex-wrap gap-2">
              {inspection.amenities.map((item: string, index: number) => (
                <span key={index} className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}
        {inspection.defects && inspection.defects.length > 0 && (
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-2">العيوب</label>
            <div className="flex flex-wrap gap-2">
              {inspection.defects.map((item: string, index: number) => (
                <span key={index} className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm">
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}
        {inspection.notes && (
          <div>
            <label className="text-sm font-medium text-gray-600">ملاحظات</label>
            <p className="text-gray-800 mt-1 whitespace-pre-wrap">{inspection.notes}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" dir="rtl">
      {profile?.role && profile.role !== 'client' && (
        <div className="mb-4"><ClientInfoCard property={property} /></div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ الفحص</label>
          <input
            type="date"
            value={formData.inspection_date}
            onChange={(e) => setFormData({ ...formData, inspection_date: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">حالة الفحص</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
          >
            <option value="pending">قيد الإعداد</option>
            <option value="in_progress">جارٍ التنفيذ</option>
            <option value="completed">مكتمل</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">الحالة الإنشائية</label>
          <select
            value={formData.structural_condition}
            onChange={(e) => setFormData({ ...formData, structural_condition: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
            required
          >
            <option value="">اختر الحالة</option>
            <option value="excellent">ممتاز</option>
            <option value="good">جيد</option>
            <option value="fair">متوسط</option>
            <option value="poor">ضعيف</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">الحالة الداخلية</label>
          <select
            value={formData.interior_condition}
            onChange={(e) => setFormData({ ...formData, interior_condition: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
            required
          >
            <option value="">اختر الحالة</option>
            <option value="excellent">ممتاز</option>
            <option value="good">جيد</option>
            <option value="fair">متوسط</option>
            <option value="poor">ضعيف</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">الحالة الخارجية</label>
          <select
            value={formData.exterior_condition}
            onChange={(e) => setFormData({ ...formData, exterior_condition: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
            required
          >
            <option value="">اختر الحالة</option>
            <option value="excellent">ممتاز</option>
            <option value="good">جيد</option>
            <option value="fair">متوسط</option>
            <option value="poor">ضعيف</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">رقم رخصة البناء</label>
          <input
            type="text"
            value={formData.building_license_no}
            onChange={(e) => setFormData({ ...formData, building_license_no: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">رقم المخطط</label>
          <input
            type="text"
            value={formData.plan_no}
            onChange={(e) => setFormData({ ...formData, plan_no: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">استخدام الأرض</label>
          <input
            type="text"
            value={formData.land_use}
            onChange={(e) => setFormData({ ...formData, land_use: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">الخدمات المتوفرة (موقع)</label>
          <TagInput
            value={formData.onsite_services}
            onChange={(v) => setFormData({ ...formData, onsite_services: v })}
            suggestions={[ 'electricity', 'water', 'sewage', 'gas', 'fiber', 'paved_road', 'street_lighting' ]}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">رقم القطعة</label>
          <input
            type="text"
            value={formData.parcel_no}
            onChange={(e) => setFormData({ ...formData, parcel_no: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="neighbor_built"
            type="checkbox"
            checked={formData.neighbor_built}
            onChange={(e) => setFormData({ ...formData, neighbor_built: e.target.checked })}
            className="h-4 w-4 text-amber-600 border-gray-300 rounded"
          />
          <label htmlFor="neighbor_built" className="text-sm font-medium text-gray-700">هل الجيران مبنيون؟</label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">طبيعة الأرض</label>
          <input
            type="text"
            value={formData.land_nature}
            onChange={(e) => setFormData({ ...formData, land_nature: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="is_occupied"
            type="checkbox"
            checked={formData.is_occupied}
            onChange={(e) => setFormData({ ...formData, is_occupied: e.target.checked })}
            className="h-4 w-4 text-amber-600 border-gray-300 rounded"
          />
          <label htmlFor="is_occupied" className="text-sm font-medium text-gray-700">هل العقار مشغول؟</label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">المرافق</label>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={amenity}
            onChange={(e) => setAmenity(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
            placeholder="أضف مرفقًا"
          />
          <button
            type="button"
            onClick={addAmenity}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.amenities.map((item, index) => (
            <span key={index} className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm flex items-center gap-2">
              {item}
              <button type="button" onClick={() => removeAmenity(index)}>
                <X className="w-4 h-4" />
              </button>
            </span>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">العيوب</label>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={defect}
            onChange={(e) => setDefect(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
            placeholder="أضف عيبًا"
          />
          <button
            type="button"
            onClick={addDefect}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.defects.map((item, index) => (
            <span key={index} className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm flex items-center gap-2">
              {item}
              <button type="button" onClick={() => removeDefect(index)}>
                <X className="w-4 h-4" />
              </button>
            </span>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
          rows={4}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 text-white py-3 rounded-lg font-medium hover:from-amber-600 hover:to-yellow-700 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <Save className="w-5 h-5" />
        {loading ? 'جارٍ الحفظ...' : 'حفظ الفحص'}
      </button>
    </form>
  );
};

// Simple tag input with suggestions
const TagInput: React.FC<{ value: string[]; onChange: (v: string[]) => void; suggestions?: string[]; }> = ({ value, onChange, suggestions = [] }) => {
  const [text, setText] = React.useState('');
  const add = (t: string) => {
    const v = t.trim();
    if (!v) return;
    if ((value || []).includes(v)) return;
    onChange([...(value || []), v]);
    setText('');
  };
  const remove = (t: string) => onChange((value || []).filter(x => x !== t));
  const filtered = suggestions.filter(s => s.toLowerCase().includes(text.toLowerCase()) && !(value || []).includes(s));
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {(value || []).map(tag => (
          <span key={tag} className="inline-flex items-center gap-2 px-2 py-1 rounded bg-amber-100 text-amber-800 border border-amber-200 text-xs">
            {tag}
            <button onClick={() => remove(tag)} className="text-amber-700 hover:text-amber-900">إزالة</button>
          </span>
        ))}
      </div>
      <input
        className="w-full border rounded-lg px-3 py-2"
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            add(text);
          }
        }}
        placeholder="اكتب لاقتراح الوسوم، ثم اضغط Enter للإضافة"
      />
      {filtered.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {filtered.map(s => (
            <button type="button" key={s} onClick={() => add(s)} className="px-2 py-1 rounded border text-xs bg-gray-50 border-gray-200 hover:bg-amber-200 hover:border-amber-300">
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

