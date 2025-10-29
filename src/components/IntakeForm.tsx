import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { SA_CITIES } from '../data/sa_areas';
import { supabase } from '../lib/supabase';
import { Home, MapPin, Ruler, Calendar, User, Phone } from 'lucide-react';

interface IntakeFormProps {
  onSuccess: () => void;
}

export const IntakeForm: React.FC<IntakeFormProps> = ({ onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    property_address: '',
    property_type: 'residential',
    area_sqm: '',
    bedrooms: '',
    bathrooms: '',
    year_built: '',
    owner_name: '',
    owner_contact: '',
    city: '',
    district: '',
    location_lat: '',
    location_lng: '',
    location_zoom: '',
  });

  // Leaflet map references
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    const L = (window as any).L;
    if (!L || mapRef.current || !mapContainerRef.current) return;

    const defaultCenter = [24.7136, 46.6753];
    const map = L.map(mapContainerRef.current).setView(defaultCenter, 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
    mapRef.current = map;

    const setMarker = (latlng: { lat: number; lng: number }) => {
      if (!markerRef.current) {
        markerRef.current = L.marker(latlng, { draggable: true }).addTo(map);
        markerRef.current.on('dragend', (e: any) => {
          const pos = e.target.getLatLng();
          setFormData((prev) => ({
            ...prev,
            location_lat: pos.lat.toFixed(6),
            location_lng: pos.lng.toFixed(6),
            location_zoom: String(map.getZoom()),
          }));
        });
      } else {
        markerRef.current.setLatLng(latlng);
      }
      setFormData((prev) => ({
        ...prev,
        location_lat: latlng.lat.toFixed(6),
        location_lng: latlng.lng.toFixed(6),
        location_zoom: String(map.getZoom()),
      }));
    };

    map.on('click', (e: any) => setMarker(e.latlng));
    map.on('zoomend', () => {
      setFormData((prev) => ({ ...prev, location_zoom: String(map.getZoom()) }));
    });

    return () => {
      map.off();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const basePayload: any = {
        user_id: user?.id,
        property_address: formData.property_address,
        property_type: formData.property_type,
        area_sqm: parseFloat(formData.area_sqm),
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
        year_built: formData.year_built ? parseInt(formData.year_built) : null,
        owner_name: formData.owner_name,
        owner_contact: formData.owner_contact,
        status: 'intake',
      };

      const hasLocation = formData.location_lat && formData.location_lng;
      let payload: any = { ...basePayload };
      if (formData.city || formData.district) {
        payload.city = formData.city || null;
        payload.district = formData.district || null;
      }
      if (hasLocation) {
        payload.location_lat = Number(formData.location_lat);
        payload.location_lng = Number(formData.location_lng);
        payload.location_zoom = formData.location_zoom ? Number(formData.location_zoom) : null;
      }

      let { error: insertError } = await supabase.from('properties').insert(payload);

      const shouldRetryUndefinedColumn = (err: any) => { const msg = (err?.message || '').toString(); const code = (err?.code || '').toString(); return /column .* does not exist/i.test(msg) || /schema cache/i.test(msg) || code === '42703'; };

      if (insertError && shouldRetryUndefinedColumn(insertError)) {
        const { error: retryError } = await supabase.from('properties').insert(basePayload);
        insertError = retryError || null;
      }

      if (insertError) throw insertError;
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'city') {
      setFormData({ ...formData, city: value, district: '' });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 border border-amber-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-gradient-to-br from-amber-400 to-yellow-600 p-3 rounded-xl">
          <Home className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">طلب تقييم عقار جديد</h2>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 text-amber-600" />
              عنوان العقار
            </label>
            <textarea
              name="property_address"
              value={formData.property_address}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
              rows={2}
              required
              dir="rtl"
            />
          </div>

          {/* اختر المدينة ثم الحي */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2" dir="rtl">
              المدينة
            </label>
            <select
              name="city"
              value={(formData as any).city || ''}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
              dir="rtl"
            >
              <option value="">— اختر المدينة —</option>
              {SA_CITIES.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2" dir="rtl">
              الحي
            </label>
            <select
              name="district"
              value={(formData as any).district || ''}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
              dir="rtl"
              disabled={!formData.city}
            >
              <option value="">— اختر الحي —</option>
              {(() => {
                const city = SA_CITIES.find(c => c.name === formData.city);
                return city ? city.districts.map(d => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                )) : null;
              })()}
            </select>
          </div>

          {/* Map location (optional) */}
          <div className="md:col-span-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2" dir="rtl">
              <MapPin className="w-4 h-4 text-amber-600" />
              الموقع على الخريطة (اختياري)
            </label>
            <div ref={mapContainerRef} className="w-full h-72 rounded-lg border border-gray-300" />
            <div className="mt-2 flex items-center gap-3" dir="rtl">
              <button
                type="button"
                className="px-3 py-2 text-sm rounded-md bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                onClick={() => {
                  const L = (window as any).L;
                  if (!navigator.geolocation || !mapRef.current || !L) return;
                  navigator.geolocation.getCurrentPosition(
                    (pos) => {
                      const { latitude, longitude } = pos.coords;
                      const latlng: any = { lat: latitude, lng: longitude };
                      mapRef.current.setView(latlng, 16);
                      if (markerRef.current) markerRef.current.setLatLng(latlng);
                      else {
                        markerRef.current = L.marker(latlng, { draggable: true }).addTo(mapRef.current);
                        markerRef.current.on('dragend', (e: any) => {
                          const p = e.target.getLatLng();
                          setFormData((prev) => ({
                            ...prev,
                            location_lat: p.lat.toFixed(6),
                            location_lng: p.lng.toFixed(6),
                            location_zoom: String(mapRef.current.getZoom()),
                          }));
                        });
                      }
                      setFormData((prev) => ({
                        ...prev,
                        location_lat: latitude.toFixed(6),
                        location_lng: longitude.toFixed(6),
                        location_zoom: String(mapRef.current.getZoom()),
                      }));
                    },
                    () => {}
                  );
                }}
              >
                استخدام موقعي الحالي
              </button>
              <div className="text-xs text-gray-600">
                {formData.location_lat && formData.location_lng
                  ? `lat: ${formData.location_lat}, lng: ${formData.location_lng}, z: ${formData.location_zoom || ''}`
                  : 'لم يتم التحديد بعد'}
              </div>
              <button
                type="button"
                className="ml-auto px-3 py-2 text-sm rounded-md bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100"
                onClick={() => {
                  if (mapRef.current && markerRef.current) {
                    mapRef.current.removeLayer(markerRef.current);
                    markerRef.current = null;
                  }
                  setFormData((prev) => ({ ...prev, location_lat: '', location_lng: '', location_zoom: '' }));
                }}
              >
                إزالة الموقع
              </button>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Home className="w-4 h-4 text-amber-600" />
              نوع العقار
            </label>
            <select
              name="property_type"
              value={formData.property_type}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
              dir="rtl"
            >
              <option value="residential">سكني</option>
              <option value="commercial">تجاري</option>
              <option value="industrial">صناعي</option>
              <option value="land">أرض</option>
            </select>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Ruler className="w-4 h-4 text-amber-600" />
              المساحة (متر مربع)
            </label>
            <input
              type="number"
              name="area_sqm"
              value={formData.area_sqm}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
              required
              dir="rtl"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              عدد غرف النوم
            </label>
            <input
              type="number"
              name="bedrooms"
              value={formData.bedrooms}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
              dir="rtl"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              عدد دورات المياه
            </label>
            <input
              type="number"
              name="bathrooms"
              value={formData.bathrooms}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
              dir="rtl"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 text-amber-600" />
              سنة البناء
            </label>
            <input
              type="number"
              name="year_built"
              value={formData.year_built}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
              dir="rtl"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 text-amber-600" />
              اسم المالك
            </label>
            <input
              type="text"
              name="owner_name"
              value={formData.owner_name}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
              required
              dir="rtl"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Phone className="w-4 h-4 text-amber-600" />
              رقم الاتصال
            </label>
            <input
              type="text"
              name="owner_contact"
              value={formData.owner_contact}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
              required
              dir="rtl"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 text-white py-4 rounded-lg font-medium hover:from-amber-600 hover:to-yellow-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
        >
          {loading ? 'جارٍ الإرسال...' : 'إرسال طلب التقييم'}
        </button>
      </form>
    </div>
  );
};


