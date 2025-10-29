import React, { useEffect, useState } from 'react';
import { supabase, Appraisal, Review } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Save, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface ReviewFormProps {
  appraisal: Appraisal;
  review: Review | null;
  onSuccess: () => void;
  canEdit: boolean;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({
  appraisal,
  review,
  onSuccess,
  canEdit,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    review_status: 'pending',
    comments: '',
  });

  useEffect(() => {
    if (review) {
      setFormData({
        review_status: review.review_status,
        comments: review.comments || '',
      });
    }
  }, [review]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const reviewData = {
        appraisal_id: appraisal.id,
        reviewer_id: user?.id as string | undefined,
        review_status: formData.review_status,
        comments: formData.comments,
        completed_at: formData.review_status !== 'pending' ? new Date().toISOString() : null,
      } as Partial<Review> & { appraisal_id: string };

      if (review) {
        const { error: updateError } = await supabase
          .from('reviews')
          .update(reviewData as any)
          .eq('id', review.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('reviews')
          .insert(reviewData as any);
        if (insertError) throw insertError;
      }

      if (formData.review_status === 'approved') {
        const { data: propertyData } = await supabase
          .from('properties')
          .select('id')
          .eq('id', appraisal.property_id)
          .maybeSingle();

        if (propertyData) {
          await supabase
            .from('properties')
            .update({ status: 'review' })
            .eq('id', propertyData.id);
        }
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      setLoading(false);
    }
  };

  if (appraisal.status !== 'completed') {
    return (
      <div className="text-center py-8 text-gray-600">
        لا يمكن المراجعة قبل اكتمال التقييم.
      </div>
    );
  }

  if (!canEdit && !review) {
    return (
      <div className="text-center py-8 text-gray-600">لا توجد مراجعة بعد.</div>
    );
  }

  if (!canEdit && review) {
    const getStatusIcon = () => {
      if (review.review_status === 'approved') return <CheckCircle className="w-8 h-8 text-green-600" />;
      if (review.review_status === 'rejected') return <XCircle className="w-8 h-8 text-red-600" />;
      return <AlertCircle className="w-8 h-8 text-amber-600" />;
    };

    const getStatusText = () => {
      if (review.review_status === 'approved') return 'تم الاعتماد';
      if (review.review_status === 'rejected') return 'مرفوض';
      if (review.review_status === 'needs_revision') return 'بحاجة إلى تعديلات';
      return 'قيد المراجعة';
    };

    const getStatusColor = () => {
      if (review.review_status === 'approved') return 'bg-green-50 border-green-200';
      if (review.review_status === 'rejected') return 'bg-red-50 border-red-200';
      if (review.review_status === 'needs_revision') return 'bg-amber-50 border-amber-200';
      return 'bg-gray-50 border-gray-200';
    };

    return (
      <div className="space-y-6" dir="rtl">
        <div className={`p-6 rounded-xl border-2 ${getStatusColor()}`}>
          <div className="flex items-center gap-3 mb-4">
            {getStatusIcon()}
            <h3 className="text-xl font-bold text-gray-900">{getStatusText()}</h3>
          </div>
          {review.comments && (
            <p className="text-gray-700 whitespace-pre-wrap">{review.comments}</p>
          )}
        </div>
      </div>
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
        <h3 className="text-lg font-bold text-amber-900 mb-4">ملخص التقييم</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-gray-600">القيمة النهائية:</span>
            <p className="text-xl font-bold text-amber-700">
              {appraisal.final_value?.toLocaleString('ar-SA')} ر.س
            </p>
          </div>
          <div>
            <span className="text-sm text-gray-600">مستوى الثقة:</span>
            <p className="text-lg font-medium text-gray-800">{appraisal.confidence_level}</p>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">حالة المراجعة</label>
        <select
          value={formData.review_status}
          onChange={(e) => setFormData({ ...formData, review_status: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
        >
          <option value="pending">قيد المراجعة</option>
          <option value="approved">معتمد</option>
          <option value="needs_revision">بحاجة إلى تعديلات</option>
          <option value="rejected">مرفوض</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات</label>
        <textarea
          value={formData.comments}
          onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
          rows={6}
          placeholder="اكتب ملاحظاتك هنا إن وجدت..."
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 text-white py-3 rounded-lg font-medium hover:from-amber-600 hover:to-yellow-700 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <Save className="w-5 h-5" />
        {loading ? 'جاري الحفظ...' : 'حفظ المراجعة'}
      </button>
    </form>
  );
};

