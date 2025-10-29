import React from 'react';
import { Property } from '../lib/supabase';

export const ClientInfoCard: React.FC<{ property: Property }> = ({ property }) => {
  return (
    <div className="bg-white rounded-xl border shadow p-4" dir="rtl">
      <h3 className="font-semibold text-gray-900 mb-3">بيانات العميل</h3>
      <div className="grid md:grid-cols-2 gap-3 text-sm text-gray-800">
        <div>
          <span className="text-gray-600">اسم المالك:</span> {property.owner_name}
        </div>
        <div>
          <span className="text-gray-600">وسيلة التواصل:</span> {property.owner_contact}
        </div>
        {((property as any).city || (property as any).district) && (
          <div className="md:col-span-2">
            <span className="text-gray-600">المدينة/الحي:</span> {((property as any).city || '')}{((property as any).city && (property as any).district ? ' - ' : '')}{((property as any).district || '')}
          </div>
        )}
        <div className="md:col-span-2">
          <span className="text-gray-600">العنوان:</span> {property.property_address}
        </div>
        <div>
          <span className="text-gray-600">نوع العقار:</span> {property.property_type}
        </div>
        <div>
          <span className="text-gray-600">المساحة (م²):</span> {property.area_sqm}
        </div>
        {property.bedrooms !== null && (
          <div>
            <span className="text-gray-600">عدد الغرف:</span> {property.bedrooms}
          </div>
        )}
        {property.bathrooms !== null && (
          <div>
            <span className="text-gray-600">عدد الحمامات:</span> {property.bathrooms}
          </div>
        )}
        {property.year_built !== null && (
          <div>
            <span className="text-gray-600">سنة البناء:</span> {property.year_built}
          </div>
        )}
      </div>
    </div>
  );
};

