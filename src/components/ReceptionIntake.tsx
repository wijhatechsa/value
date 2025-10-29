import React, { useEffect, useState } from 'react';
import { supabase, Property } from '../lib/supabase';

type IntakeRecord = {
  id?: string;
  property_id: string;
  reference_no: string | null;
  received_by: string | null;
  received_at: string | null;
  contact_verified: boolean;
  building_license_no?: string | null;
  plan_no?: string | null;
  land_use?: string | null;
  onsite_services?: any[] | null;
  parcel_no?: string | null;
  neighbor_built?: boolean | null;
  land_nature?: string | null;
  is_occupied?: boolean | null;
  documents: any[] | null;
  notes: string | null;
};

export const ReceptionIntake: React.FC<{ property: Property; onBack: () => void }> = ({ property, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rec, setRec] = useState<IntakeRecord | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('intake_records')
        .select('*')
        .eq('property_id', property.id)
        .maybeSingle();
      setRec(
        (data as any) || {
          property_id: property.id,
          reference_no: '',
          received_by: null,
          received_at: new Date().toISOString(),
          contact_verified: false,
          building_license_no: '',
          plan_no: '',
          land_use: '',
          onsite_services: [],
          parcel_no: '',
          neighbor_built: null,
          land_nature: '',
          is_occupied: null,
          documents: [],
          notes: '',
        }
      );
      setLoading(false);
    })();
  }, [property.id]);

  const save = async () => {
    if (!rec) return;
    setSaving(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('intake_records')
        .upsert({
          property_id: rec.property_id,
          reference_no: rec.reference_no || null,
          received_by: rec.received_by || null,
          received_at: rec.received_at || null,
          contact_verified: !!rec.contact_verified,
          building_license_no: rec.building_license_no || null,
          plan_no: rec.plan_no || null,
          land_use: rec.land_use || null,
          onsite_services: rec.onsite_services || [],
          parcel_no: rec.parcel_no || null,
          neighbor_built: rec.neighbor_built ?? null,
          land_nature: rec.land_nature || null,
          is_occupied: rec.is_occupied ?? null,
          documents: rec.documents || [],
          notes: rec.notes || null,
        }, { onConflict: 'property_id' });
      if (error) throw error;
    } catch (e: any) {
      setError(e?.message || 'طھط¹ط°ط± ط­ظپط¸ ط¨ظٹط§ظ†ط§طھ ط§ظ„ط§ط³طھظ‚ط¨ط§ظ„');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !rec) {
    return <div className="bg-white rounded-xl shadow p-6">ط¬ط§ط±ظٹ ط§ظ„طھط­ظ…ظٹظ„...</div>;
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">ط³ط¬ظ„ ط§ظ„ط§ط³طھظ‚ط¨ط§ظ„</h2>
        <div className="flex gap-2">
          <button onClick={onBack} className="px-4 py-2 rounded-lg bg-amber-100 text-amber-800 hover:bg-amber-200">ط¹ظˆط¯ط©</button>
          <button onClick={save} disabled={saving} className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50">ط­ظپط¸</button>
        </div>

        {/* حقول إضافية للاستقبال */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">رقم رخصة البناء</label>
            <input className="w-full border rounded-lg px-3 py-2" value={rec.building_license_no || ''} onChange={e => setRec({ ...rec, building_license_no: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">رقم المخطط</label>
            <input className="w-full border rounded-lg px-3 py-2" value={rec.plan_no || ''} onChange={e => setRec({ ...rec, plan_no: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">استخدام الأرض</label>
            <select className="w-full border rounded-lg px-3 py-2" value={rec.land_use || ''} onChange={e => setRec({ ...rec, land_use: e.target.value })}>
              <option value="">اختر</option>
              <option value="residential">سكني</option>
              <option value="commercial">تجاري</option>
              <option value="industrial">صناعي</option>
              <option value="land">أرض</option>
              <option value="mixed">مختلط</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">الخدمات بالموقع (وسوم)</label>
            <TagInput
              value={(rec.onsite_services as any[]) || []}
              onChange={(v) => setRec({ ...rec, onsite_services: v })}
              suggestions={[ 'electricity', 'water', 'sewage', 'gas', 'fiber', 'paved_road', 'street_lighting' ]}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">رقم القطعة</label>
            <input className="w-full border rounded-lg px-3 py-2" value={rec.parcel_no || ''} onChange={e => setRec({ ...rec, parcel_no: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">طبيعة الأرض</label>
            <select className="w-full border rounded-lg px-3 py-2" value={rec.land_nature || ''} onChange={e => setRec({ ...rec, land_nature: e.target.value })}>
              <option value="">اختر</option>
              <option value="flat">مستوية</option>
              <option value="sloped">منحدرة</option>
              <option value="corner">زاوية</option>
              <option value="interior">داخلية</option>
              <option value="on_main_road">على شارع رئيسي</option>
              <option value="inside_block">داخل البلوك</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input id="neighbor_built" type="checkbox" checked={!!rec.neighbor_built} onChange={e => setRec({ ...rec, neighbor_built: e.target.checked })} />
            <label htmlFor="neighbor_built" className="text-sm text-gray-700">الجار مبني</label>
          </div>
          <div className="flex items-center gap-2">
            <input id="is_occupied" type="checkbox" checked={!!rec.is_occupied} onChange={e => setRec({ ...rec, is_occupied: e.target.checked })} />
            <label htmlFor="is_occupied" className="text-sm text-gray-700">شاغلية العقار</label>
          </div>
        </div>
      </div>

      {/* Read-only: client-submitted property data */}
      <div className="bg-white rounded-xl shadow border p-4">
        <h3 className="font-semibold mb-2">ط¨ظٹط§ظ†ط§طھ ط§ظ„ط¹ظ…ظٹظ„ (ظ‚ط±ط§ط،ط© ظپظ‚ط·)</h3>
        <div className="grid md:grid-cols-2 gap-3 text-sm text-gray-700">
          <div><span className="text-gray-500">ط§ظ„ط¹ظ†ظˆط§ظ†:</span> {property.property_address}</div>
          <div><span className="text-gray-500">ط§ظ„ظ†ظˆط¹:</span> {property.property_type}</div>
          <div><span className="text-gray-500">ط§ظ„ظ…ط³ط§ط­ط© (ظ…آ²):</span> {property.area_sqm}</div>
          <div><span className="text-gray-500">ط§ظ„ط؛ط±ظپ:</span> {property.bedrooms ?? '-'}</div>
          <div><span className="text-gray-500">ط§ظ„ط­ظ…ط§ظ…ط§طھ:</span> {property.bathrooms ?? '-'}</div>
          <div><span className="text-gray-500">ط³ظ†ط© ط§ظ„ط¨ظ†ط§ط،:</span> {property.year_built ?? '-'}</div>
          <div className="md:col-span-2"><span className="text-gray-500">ط§ظ„ظ…ط§ظ„ظƒ:</span> {property.owner_name} â€” {property.owner_contact}</div>
        </div>
      </div>

      {/* Editable: reception-only fields */}
      <div className="bg-white rounded-xl shadow border p-4 space-y-4">
        <h3 className="font-semibold">ط¨ظٹط§ظ†ط§طھ ط§ظ„ط§ط³طھظ‚ط¨ط§ظ„ (ظ…ط±ط¬ط¹ظٹط© ط¯ط§ط®ظ„ظٹط©)</h3>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">ط§ظ„ط±ظ‚ظ… ط§ظ„ظ…ط±ط¬ط¹ظٹ</label>
            <input className="w-full border rounded-lg px-3 py-2" value={rec.reference_no || ''} onChange={e => setRec({ ...rec, reference_no: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">طھط§ط±ظٹط® ط§ظ„ط§ط³طھظ„ط§ظ…</label>
            <input type="datetime-local" className="w-full border rounded-lg px-3 py-2"
              value={rec.received_at ? new Date(rec.received_at).toISOString().slice(0,16) : ''}
              onChange={e => setRec({ ...rec, received_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
            />
          </div>
          <div className="flex items-center gap-2">
            <input id="contact_verified" type="checkbox" checked={!!rec.contact_verified} onChange={e => setRec({ ...rec, contact_verified: e.target.checked })} />
            <label htmlFor="contact_verified" className="text-sm text-gray-700">طھط£ظƒظٹط¯ ط¨ظٹط§ظ†ط§طھ ط§ظ„ط§طھطµط§ظ„</label>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">ظ…ظ„ط§ط­ط¸ط§طھ</label>
            <textarea className="w-full border rounded-lg px-3 py-2" rows={4} value={rec.notes || ''} onChange={e => setRec({ ...rec, notes: e.target.value })} />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">ظ…ط±ظپظ‚ط§طھ/ظˆط«ط§ط¦ظ‚ (JSON)</label>
          <textarea className="w-full border rounded-lg px-3 py-2 font-mono text-xs" rows={6}
            value={JSON.stringify(rec.documents || [], null, 2)}
            onChange={e => {
              try {
                const parsed = JSON.parse(e.target.value || '[]');
                setRec({ ...rec, documents: parsed });
              } catch {
                // ignore parse errors while typing
              }
            }}
          />
          <p className="text-xs text-gray-500 mt-1">ظٹظ…ظƒظ†ظƒ ط­ظپط¸ ط±ظˆط§ط¨ط· ط£ظˆ ط¨ظٹط§ظ†ط§طھ ط§ظ„ظˆط«ط§ط¦ظ‚ ظƒظ‚ط§ط¦ظ…ط© JSON.</p>
        </div>
      </div>
    </div>
  );
};

// مكون إدخال وسوم بسيط مع اقتراحات
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
            <button onClick={() => remove(tag)} className="text-amber-700 hover:text-amber-900">×</button>
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
        placeholder="أضف خدمة واضغط Enter"
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


