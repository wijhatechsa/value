import React, { useEffect, useState } from 'react';
import { supabase, Property } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Building2, MapPin, Calendar, CheckCircle, Clock, FileText } from 'lucide-react';

interface Props {
  onSelectProperty: (property: Property) => void;
}

export const PropertyListGrouped: React.FC<Props> = ({ onSelectProperty }) => {
  const { user, profile } = useAuth();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        let query = supabase
          .from('properties')
          .select(`
            *,
            inspections ( id, status, created_at, completed_at ),
            appraisals ( id, status, created_at, completed_at, reviews ( id, review_status, created_at ), deliveries ( id, delivered_at ) )
          `)
          .order('created_at', { ascending: false });
        if (profile?.role === 'client') query = query.eq('user_id', user?.id || '');
        const { data, error } = await query;
        if (error) throw error;
        setProperties(data || []);
      } catch (e) {
        console.error('Failed to load grouped properties', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id, profile?.role]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      intake: 'bg-blue-100 text-blue-700',
      inspection: 'bg-purple-100 text-purple-700',
      appraisal: 'bg-amber-100 text-amber-700',
      review: 'bg-orange-100 text-orange-700',
      completed: 'bg-green-100 text-green-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };
  const getStatusIcon = (status: string) => {
    const icons: Record<string, any> = { intake: Clock, inspection: FileText, appraisal: Building2, review: FileText, completed: CheckCircle };
    const Icon = icons[status] || Clock;
    return <Icon className="w-4 h-4" />;
  };
  const getStatusText = (status: string) => {
    const texts: Record<string, string> = { intake: 'الاستقبال', inspection: 'الفحص', appraisal: 'التقييم', review: 'المراجعة', completed: 'مكتمل' };
    return texts[status] || status;
  };

  const deriveStatus = (p: any): string => {
    const appraisals: any[] = p.appraisals || [];
    const delivered = appraisals.some(a => Array.isArray(a.deliveries) && a.deliveries.length > 0);
    if (delivered) return 'completed';
    if (appraisals.length > 0) {
      const anyCompletedAppraisal = appraisals.some(a => a.status === 'completed');
      if (anyCompletedAppraisal) return 'review';
      return 'appraisal';
    }
    const inspections: any[] = p.inspections || [];
    if (inspections.length > 0) {
      const anyCompletedInspection = inspections.some(i => i.status === 'completed');
      return anyCompletedInspection ? 'appraisal' : 'inspection';
    }
    return 'intake';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }
  if (properties.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-12 border border-amber-200 text-center">
        <Building2 className="w-16 h-16 text-amber-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">لا توجد عقارات</h3>
        <p className="text-gray-500">ابدأ بإضافة عقار جديد أو غيّر عوامل التصفية.</p>
      </div>
    );
  }

  const groups: Record<string, any[]> = { intake: [], inspection: [], appraisal: [], review: [], completed: [] };
  properties.forEach((p) => { (groups[deriveStatus(p)] || groups.intake).push(p); });
  const groupOrder: Array<keyof typeof groups> = ['intake', 'inspection', 'appraisal', 'review', 'completed'];
  const groupTitle: Record<string, string> = { intake: 'قائمة الاستقبال', inspection: 'قائمة الفحص', appraisal: 'قائمة التقييم', review: 'قائمة المراجعة', completed: 'قائمة المكتمل' };

  const Card: React.FC<{ p: any; status: string }> = ({ p, status }) => (
    <div
      onClick={() => onSelectProperty(p)}
      className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer border border-amber-100 hover:border-amber-300 overflow-hidden group"
    >
      <div className="bg-gradient-to-br from-amber-400 to-yellow-600 p-6">
        <div className="flex items-start justify-between">
          <Building2 className="w-8 h-8 text-white" />
          <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(status)}`}>
            {getStatusIcon(status)}
            {getStatusText(status)}
          </span>
        </div>
      </div>
      <div className="p-6">
        <div className="flex items-start gap-2 mb-4">
          <MapPin className="w-5 h-5 text-amber-600 mt-1 flex-shrink-0" />
          <p className="text-gray-800 font-medium line-clamp-2 text-right">{p.property_address}</p>
        </div>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between items-center">
            <span className="font-medium">{p.area_sqm} م²</span>
            <span>المساحة</span>
          </div>
          {p.bedrooms && (
            <div className="flex justify-between items-center">
              <span className="font-medium">{p.bedrooms}</span>
              <span>غرف</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4 text-amber-600" />
              {new Date(p.created_at).toLocaleDateString('ar-SA')}
            </span>
            <span>تاريخ الإدخال</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-10">
      {groupOrder.map((g) => (
        groups[g].length ? (
          <section key={g}>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{groupTitle[g]}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups[g].map((p) => (
                <Card key={p.id} p={p} status={g} />
              ))}
            </div>
          </section>
        ) : null
      ))}
    </div>
  );
};
