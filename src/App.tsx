import { AuthProvider, useAuth } from './contexts/AuthContext';
import { I18nProvider, useI18n } from './contexts/I18nContext';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';

function AppContent() {
  const { user, loading } = useAuth();
  const { dir } = useI18n();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100 flex items-center justify-center" dir={dir}>
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div dir={dir} className="min-h-screen">
      {user ? <Dashboard /> : <Auth />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <I18nProvider>
        <AppContent />
      </I18nProvider>
    </AuthProvider>
  );
}

export default App;
