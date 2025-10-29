import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Property } from '../lib/supabase';
import { PropertyListSmart } from './PropertyListSmart';
import { PropertyDetails } from './PropertyDetails';
import { FullReport } from './FullReport';
import { supabase } from '../lib/supabase';
import { IntakeForm } from './IntakeForm';
import { LogOut, Plus, Building2, LayoutDashboard, FileText } from 'lucide-react';
import { AdminReports } from './AdminReports';
import { LanguageSwitcher } from './LanguageSwitcher';

export const Dashboard: React.FC = () => {
  const { profile, signOut } = useAuth();
  const [view, setView] = useState<'list' | 'details' | 'intake' | 'report' | 'adminReports'>('list');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [selectedAppraisalId, setSelectedAppraisalId] = useState<string | null>(null);

  const handleSelectProperty = (property: Property) => {
    setSelectedProperty(property);
    setView('details');
  };

  const handleBack = () => {
    setSelectedProperty(null);
    setView('list');
  };

  const handleOpenReportForSelected = async () => {
    if (!selectedProperty) return;
    try {
      const { data, error } = await supabase
        .from('full_reports')
        .select('appraisal_id, delivered_at')
        .eq('property_id', selectedProperty.id)
        .order('delivered_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data?.appraisal_id) {
        setSelectedAppraisalId(data.appraisal_id);
        setView('report');
        return;
      }

      const errMsg = (error?.message || '').toLowerCase();
      if (error && (errMsg.includes('schema cache') || errMsg.includes('full_reports') || errMsg.includes('not exist'))) {
        const { data: ap } = await supabase
          .from('appraisals')
          .select('id, status, created_at')
          .eq('property_id', selectedProperty.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!ap || ap.status !== 'completed') {
          alert('لا يوجد تقرير جاهز بعد. يجب اكتمال التقييم قبل العرض.');
          return;
        }

        const { data: del } = await supabase
          .from('deliveries')
          .select('id')
          .eq('appraisal_id', ap.id)
          .maybeSingle();

        if (!del) {
          alert('لا يوجد تسليم للتقرير المرتبط. أكمل التسليم أولاً.');
          return;
        }

        setSelectedAppraisalId(ap.id);
        setView('report');
        return;
      }

      alert('لا يمكن فتح التقرير حاليًا. حاول لاحقًا.');
    } catch (e: any) {
      alert('حدث خطأ أثناء فتح التقرير: ' + (e?.message || 'يرجى المحاولة لاحقًا'));
    }
  };

  const handleIntakeSuccess = () => {
    setView('list');
  };

  const getRoleText = (role: string) => {
    const roles: Record<string, string> = {
      admin: 'مسؤول',
      appraiser: 'مثمن',
      inspector: 'مفتش',
      reviewer: 'مراجع',
      client: 'عميل',
    };
    return roles[role] || role;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100" dir="rtl">
      <nav className="bg-white shadow-lg border-b-2 border-amber-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-amber-400 to-yellow-600 p-3 rounded-xl">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">لوحة التحكم</h1>
                <p className="text-sm text-gray-600">إدارة تقييم العقارات</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <LanguageSwitcher />
              <div className="text-right">
                <p className="font-semibold text-gray-800">{profile?.full_name}</p>
                <p className="text-sm text-amber-600">{getRoleText(profile?.role || '')}</p>
              </div>
              <button
                onClick={() => signOut()}
                className="p-3 hover:bg-red-50 rounded-lg transition text-red-600"
                title="تسجيل الخروج"
              >
                <LogOut className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {view === 'list' && (
          <>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <LayoutDashboard className="w-8 h-8 text-amber-600" />
                <h2 className="text-3xl font-bold text-gray-800">قائمة العقارات</h2>
              </div>
              {(profile?.role === 'client' || profile?.role === 'admin') && (
                <button
                  onClick={() => setView('intake')}
                  className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white px-6 py-3 rounded-lg font-medium hover:from-amber-600 hover:to-yellow-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  إضافة طلب جديد
                </button>
              )}
            </div>
            {profile?.role === 'admin' && (
              <div className="mb-4 flex justify-end">
                <button
                  onClick={() => setView('adminReports')}
                  className="bg-amber-100 text-amber-800 px-4 py-2 rounded-lg hover:bg-amber-200 flex items-center gap-2"
                >
                  <FileText className="w-5 h-5" /> تقارير الإدارة
                </button>
              </div>
            )}
            <PropertyListSmart onSelectProperty={handleSelectProperty} />
          </>
        )}

        {view === 'intake' && (
          <>
            <div className="flex items-center gap-4 mb-8">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-amber-100 rounded-lg transition"
              >
                <Building2 className="w-6 h-6 text-amber-600" />
              </button>
              <h2 className="text-3xl font-bold text-gray-800">إدخال بيانات الطلب</h2>
            </div>
            <IntakeForm onSuccess={handleIntakeSuccess} />
          </>
        )}

        {view === 'details' && selectedProperty && (
          <>
            {(profile?.role === 'admin' || profile?.role === 'client') && (
              <div className="mb-4 flex justify-end">
                <button
                  onClick={handleOpenReportForSelected}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition"
                >
                  عرض التقرير النهائي
                </button>
              </div>
            )}
            <PropertyDetails property={selectedProperty} onBack={handleBack} />
          </>
        )}

        {view === 'report' && selectedProperty && selectedAppraisalId && (
          <FullReport appraisalId={selectedAppraisalId} onBack={() => setView('details')} />
        )}

        {view === 'adminReports' && profile?.role === 'admin' && (
          <AdminReports onBack={() => setView('list')} />
        )}
      </div>
    </div>
  );
};
