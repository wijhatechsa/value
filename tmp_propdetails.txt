import React, { useEffect, useRef, useState } from 'react';
import { ClientInfoCard } from './ClientInfoCard';
import { supabase, Property, Inspection, Appraisal, Review, Delivery } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRight, Building2, FileText, CheckCircle, TrendingUp, Send } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';
import { InspectionForm } from './InspectionForm';
import { AppraisalForm } from './AppraisalForm';
import { ReviewForm } from './ReviewForm';
import { DeliveryForm } from './DeliveryForm';

interface PropertyDetailsProps {
  property: Property;
  onBack: () => void;
}

export const PropertyDetails: React.FC<PropertyDetailsProps> = ({ property, onBack }) => {
  const { profile } = useAuth();
  const { t } = useI18n();
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [appraisal, setAppraisal] = useState<Appraisal | null>(null);
  const [review, setReview] = useState<Review | null>(null);
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'inspection' | 'appraisal' | 'review' | 'delivery'>('details');
  const mapElRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    loadWorkflowData();
  }, [property.id]);

  const loadWorkflowData = async () => {
    const { data: inspectionData } = await supabase
      .from('inspections')
      .select('*')
      .eq('property_id', property.id)
      .maybeSingle();

    const { data: appraisalData } = await supabase
      .from('appraisals')
      .select('*')
      .eq('property_id', property.id)
      .maybeSingle();

    const { data: reviewData } = await supabase
      .from('reviews')
      .select('*')
      .eq('appraisal_id', appraisalData?.id)
      .maybeSingle();

    const { data: deliveryData } = await supabase
      .from('deliveries')
      .select('*')
      .eq('appraisal_id', appraisalData?.id)
      .maybeSingle();

    setInspection(inspectionData);
    setAppraisal(appraisalData);
    setReview(reviewData);
    setDelivery(deliveryData);
  };

  useEffect(() => {
    if (activeTab !== 'details') return;
    const lat: any = (property as any).location_lat;
    const lng: any = (property as any).location_lng;
    if (!lat || !lng) return;
    const L = (window as any).L;
    if (!L || !mapElRef.current) return;

    const center = [Number(lat), Number(lng)];
    const zoom = Math.max(14, Number((property as any).location_zoom || 14));

    if (!mapRef.current) {
      const map = L.map(mapElRef.current, { zoomControl: false }).setView(center as any, zoom);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
      markerRef.current = L.marker(center as any).addTo(map);
      mapRef.current = map;
    } else {
      mapRef.current.setView(center as any, zoom);
      if (!markerRef.current) markerRef.current = L.marker(center as any).addTo(mapRef.current);
      else markerRef.current.setLatLng(center as any);
    }
  }, [activeTab, (property as any).location_lat, (property as any).location_lng]);

  const canAccessInspection = () => {
    return profile?.role === 'inspector' || profile?.role === 'admin';
  };

  const canAccessAppraisal = () => {
    return profile?.role === 'appraiser' || profile?.role === 'admin';
  };

  const canAccessReview = () => {
    return profile?.role === 'reviewer' || profile?.role === 'admin';
  };

  const getPropertyTypeText = (type: string) => {
    const types: Record<string, string> = {
      residential: 'ط·آ³ط¸ئ’ط¸â€ ط¸ظ¹',
      commercial: 'ط·ع¾ط·آ¬ط·آ§ط·آ±ط¸ظ¹',
      industrial: 'ط·آµط¸â€ ط·آ§ط·آ¹ط¸ظ¹',
      land: 'ط·آ£ط·آ±ط·آ¶',
    };
    return types[type] || type;
  };

  const steps = [
    { id: 'intake', label: 'ط·آ§ط¸â€‍ط·آ§ط·آ³ط·ع¾ط¸â€ڑط·آ¨ط·آ§ط¸â€‍', completed: true },
    { id: 'inspection', label: 'ط·آ§ط¸â€‍ط¸ظ¾ط·آ­ط·آµ', completed: !!inspection && inspection.status === 'completed' },
    { id: 'appraisal', label: 'ط·آ§ط¸â€‍ط·ع¾ط¸â€ڑط¸ظ¹ط¸ظ¹ط¸â€¦', completed: !!appraisal && appraisal.status === 'completed' },
    { id: 'review', label: 'ط·آ§ط¸â€‍ط¸â€¦ط·آ±ط·آ§ط·آ¬ط·آ¹ط·آ©', completed: !!review && review.review_status === 'approved' },
    { id: 'delivery', label: 'ط·آ§ط¸â€‍ط·ع¾ط·آ³ط¸â€‍ط¸ظ¹ط¸â€¦', completed: !!delivery },
  ];

  const stepsI18n = [
    { id: 'intake', label: t('steps.intake'), completed: true },
    { id: 'inspection', label: t('steps.inspection'), completed: !!inspection && inspection.status === 'completed' },
    { id: 'appraisal', label: t('steps.appraisal'), completed: !!appraisal && appraisal.status === 'completed' },
    { id: 'review', label: t('steps.review'), completed: !!review && review.review_status === 'approved' },
    { id: 'delivery', label: t('steps.delivery'), completed: !!delivery },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-amber-100 rounded-lg transition"
        >
          <ArrowRight className="w-6 h-6 text-amber-600" />
        </button>
        <h2 className="text-2xl font-bold text-gray-800">تفاصيل الطلب</h2>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-8 border border-amber-200">

      {profile?.role && profile.role !== 'client' && (
        <div className="mb-4"><ClientInfoCard property={property} /></div>
      )}

        <div className="flex flex-wrap gap-3 mb-8">
          {stepsI18n.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                step.completed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {step.completed && <CheckCircle className="w-4 h-4" />}
                <span className="font-medium">{step.label}</span>
              </div>
              {index < stepsI18n.length - 1 && (
                <div className="w-8 h-0.5 bg-gray-300 mx-2"></div>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-6 py-3 font-medium transition ${
              activeTab === 'details'
                ? 'border-b-2 border-amber-500 text-amber-600'
                : 'text-gray-600 hover:text-amber-600'
            }`}
          >
            <Building2 className="w-5 h-5 inline mr-2" />
            تفاصيل العقار
          </button>
          {(canAccessInspection() || inspection) && (
            <button
              onClick={() => setActiveTab('inspection')}
              className={`px-6 py-3 font-medium transition ${
                activeTab === 'inspection'
                  ? 'border-b-2 border-amber-500 text-amber-600'
                  : 'text-gray-600 hover:text-amber-600'
              }`}
            >
              <FileText className="w-5 h-5 inline mr-2" />
              المعاينة</button>
          )}
          {(canAccessAppraisal() || appraisal) && (
            <button
              onClick={() => setActiveTab('appraisal')}
              className={`px-6 py-3 font-medium transition ${
                activeTab === 'appraisal'
                  ? 'border-b-2 border-amber-500 text-amber-600'
                  : 'text-gray-600 hover:text-amber-600'
              }`}
            >
              <TrendingUp className="w-5 h-5 inline mr-2" />
              التقييم</button>
          )}
          {(canAccessReview() || review) && appraisal && (
            <button
              onClick={() => setActiveTab('review')}
              className={`px-6 py-3 font-medium transition ${
                activeTab === 'review'
                  ? 'border-b-2 border-amber-500 text-amber-600'
                  : 'text-gray-600 hover:text-amber-600'
              }`}
            >
              <CheckCircle className="w-5 h-5 inline mr-2" />
              المراجعة</button>
          )}
          {(canAccessReview() || delivery) && review?.review_status === 'approved' && (
            <button
              onClick={() => setActiveTab('delivery')}
              className={`px-6 py-3 font-medium transition ${
                activeTab === 'delivery'
                  ? 'border-b-2 border-amber-500 text-amber-600'
                  : 'text-gray-600 hover:text-amber-600'
              }`}
            >
              <Send className="w-5 h-5 inline mr-2" />
              التسليم</button>
          )}
        </div>

        {activeTab === 'details' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-600">ط·آ§ط¸â€‍ط·آ¹ط¸â€ ط¸ث†ط·آ§ط¸â€ </label>
                <p className="text-lg text-gray-800 mt-1">{property.property_address}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">ط¸â€ ط¸ث†ط·آ¹ ط·آ§ط¸â€‍ط·آ¹ط¸â€ڑط·آ§ط·آ±</label>
                <p className="text-lg text-gray-800 mt-1">{getPropertyTypeText(property.property_type)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">ط·آ§ط¸â€‍ط¸â€¦ط·آ³ط·آ§ط·آ­ط·آ©</label>
                <p className="text-lg text-gray-800 mt-1">{property.area_sqm} ط¸â€¦ط¢آ²</p>
              </div>
              {property.bedrooms && (
                <div>
                  <label className="text-sm font-medium text-gray-600">ط·ط›ط·آ±ط¸ظ¾ ط·آ§ط¸â€‍ط¸â€ ط¸ث†ط¸â€¦</label>
                  <p className="text-lg text-gray-800 mt-1">{property.bedrooms}</p>
                </div>
              )}
              {property.bathrooms && (
                <div>
                  <label className="text-sm font-medium text-gray-600">ط·آ¯ط¸ث†ط·آ±ط·آ§ط·ع¾ ط·آ§ط¸â€‍ط¸â€¦ط¸ظ¹ط·آ§ط¸â€،</label>
                  <p className="text-lg text-gray-800 mt-1">{property.bathrooms}</p>
                </div>
              )}
              {property.year_built && (
                <div>
                  <label className="text-sm font-medium text-gray-600">ط·آ³ط¸â€ ط·آ© ط·آ§ط¸â€‍ط·آ¨ط¸â€ ط·آ§ط·طŒ</label>
                  <p className="text-lg text-gray-800 mt-1">{property.year_built}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-600">ط·آ§ط·آ³ط¸â€¦ ط·آ§ط¸â€‍ط¸â€¦ط·آ§ط¸â€‍ط¸ئ’</label>
                <p className="text-lg text-gray-800 mt-1">{property.owner_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">ط·آ±ط¸â€ڑط¸â€¦ ط·آ§ط¸â€‍ط·آ§ط·ع¾ط·آµط·آ§ط¸â€‍</label>
                <p className="text-lg text-gray-800 mt-1">{property.owner_contact}</p>
              </div>              {(property as any).city && (
                <div>
                  <label className="text-sm font-medium text-gray-600">ط§ظ„ظ…ط¯ظٹظ†ط©</label>
                  <p className="text-lg text-gray-800 mt-1">{(property as any).city}</p>
                </div>
              )}
              {(property as any).district && (
                <div>
                  <label className="text-sm font-medium text-gray-600">ط§ظ„ط­ظٹ</label>
                  <p className="text-lg text-gray-800 mt-1">{(property as any).district}</p>
                </div>
              )}              {(property as any).location_lat && (property as any).location_lng && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-600">ط·آ§ط¸â€‍ط¸â€¦ط¸ث†ط¸â€ڑط·آ¹ ط·آ¹ط¸â€‍ط¸â€° ط·آ§ط¸â€‍ط·آ®ط·آ±ط¸ظ¹ط·آ·ط·آ©</label>
                  <div ref={mapElRef} className="w-full h-72 rounded-lg border border-gray-200 mt-2" />
                  <div className="text-xs text-gray-600 mt-2">lat: {(property as any).location_lat}, lng: {(property as any).location_lng}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'inspection' && (
          <InspectionForm
            property={property}
            inspection={inspection}
            onSuccess={loadWorkflowData}
            canEdit={canAccessInspection()}
          />
        )}

        {activeTab === 'appraisal' && (
          <AppraisalForm
            property={property}
            inspection={inspection}
            appraisal={appraisal}
            onSuccess={loadWorkflowData}
            canEdit={canAccessAppraisal()}
          />
        )}

        {activeTab === 'review' && appraisal && (
          <ReviewForm
            appraisal={appraisal}
            review={review}
            onSuccess={loadWorkflowData}
            canEdit={canAccessReview()}
          />
        )}

        {activeTab === 'delivery' && appraisal && review?.review_status === 'approved' && (
          <DeliveryForm
            appraisal={appraisal}
            delivery={delivery}
            onSuccess={loadWorkflowData}
            canEdit={canAccessReview()}
          />
        )}
      </div>
    </div>
  );
};





