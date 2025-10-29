import React, { useState } from 'react';
import { supabase, Appraisal, Delivery } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Send, Mail, CheckCircle, Link as LinkIcon } from 'lucide-react';

interface DeliveryFormProps {
  appraisal: Appraisal;
  delivery: Delivery | null;
  onSuccess: () => void;
  canEdit: boolean;
}

export const DeliveryForm: React.FC<DeliveryFormProps> = ({
  appraisal,
  delivery,
  onSuccess,
  canEdit,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    delivery_method: 'email',
    recipient_email: '',
    report_url: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const deliveryData = {
        appraisal_id: appraisal.id,
        delivered_by: user?.id,
        delivery_method: formData.delivery_method,
        recipient_email: formData.recipient_email || null,
        report_url: formData.report_url || null,
        delivered_at: new Date().toISOString(),
      } as Partial<Delivery> & { appraisal_id: string };

      const { error: insertError } = await supabase
        .from('deliveries')
        .insert(deliveryData as any);

      if (insertError) throw insertError;

      const { data: propertyData } = await supabase
        .from('properties')
        .select('id')
        .eq('id', appraisal.property_id)
        .maybeSingle();

      if (propertyData) {
        await supabase
          .from('properties')
          .update({ status: 'completed' })
          .eq('id', propertyData.id);
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Delivery failed');
    } finally {
      setLoading(false);
    }
  };

  if (delivery) {
    return (
      <div className="space-y-6">
        <div className="bg-green-50 border-2 border-green-200 p-6 rounded-xl">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <h3 className="text-xl font-bold text-green-900">تم التسليم بنجاح</h3>
          </div>

          <div className="space-y-3 text-sm text-gray-700" dir="rtl">
            <div>طريقة التسليم: <span className="font-medium">{delivery.delivery_method}</span></div>
            {delivery.recipient_email && (
              <div>البريد المستلم: <span className="font-medium">{delivery.recipient_email}</span></div>
            )}
            {delivery.report_url && (
              <div className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-amber-600" />
                <a
                  href={delivery.report_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-700 hover:text-amber-800 underline break-all"
                >
                  رابط التقرير
                </a>
              </div>
            )}
            <div>
              تاريخ التسليم: {new Date(delivery.delivered_at).toLocaleString('ar-SA')}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="text-center py-8 text-gray-600" dir="rtl">لا تملك صلاحية التعديل</div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" dir="rtl">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 p-6 rounded-xl">
        <h3 className="text-lg font-bold text-amber-900 mb-2">ملخص التقييم</h3>
        <div className="text-sm text-gray-700">
          القيمة النهائية: <span className="font-medium">{appraisal.final_value?.toLocaleString('ar-SA')}</span>
        </div>
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
          <Mail className="w-4 h-4 text-amber-600" />
          طريقة التسليم
        </label>
        <select
          value={formData.delivery_method}
          onChange={(e) => setFormData({ ...formData, delivery_method: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
        >
          <option value="email">بريد إلكتروني</option>
          <option value="portal">بوابة إلكترونية</option>
          <option value="physical">نسخة ورقية</option>
          <option value="courier">شركة شحن</option>
        </select>
      </div>

      {(formData.delivery_method === 'email' || formData.delivery_method === 'portal') && (
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Mail className="w-4 h-4 text-amber-600" />
            البريد الإلكتروني للمستلم
          </label>
          <input
            type="email"
            value={formData.recipient_email}
            onChange={(e) => setFormData({ ...formData, recipient_email: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
            required
            placeholder="example@email.com"
          />
        </div>
      )}

      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">رابط التقرير (اختياري)</label>
        <input
          type="url"
          value={formData.report_url}
          onChange={(e) => setFormData({ ...formData, report_url: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
          dir="ltr"
          placeholder="https://..."
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
      >
        <Send className="w-5 h-5" />
        {loading ? 'جارٍ التسليم...' : 'تأكيد التسليم'}
      </button>
    </form>
  );
};

