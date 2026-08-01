import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { HouseholdProvider, useHousehold } from './context/HouseholdContext';
import { ThemeProvider } from './context/ThemeContext';
import { PendingDeleteProvider } from './context/PendingDeleteContext';
import { BottomNav } from './components/BottomNav';
import { LoginPage } from './pages/LoginPage';
import { HouseholdSetupPage } from './pages/HouseholdSetupPage';
import { SearchPage } from './pages/SearchPage';
import { WantToWatchPage } from './pages/WantToWatchPage';
import { WatchingPage } from './pages/WatchingPage';
import { WatchedPage } from './pages/WatchedPage';
import { SettingsPage } from './pages/SettingsPage';
import { TitleDetailPage } from './pages/TitleDetailPage';
import { StatsPage } from './pages/StatsPage';

function AppShell() {
  const { user, loading: authLoading } = useAuth();
  const { household, loading: householdLoading, error: householdError } = useHousehold();

  if (authLoading) {
    return <div className="centered-screen">Loading…</div>;
  }

  if (!user) {
    return <LoginPage />;
  }

  if (householdError) {
    return <div className="centered-screen error" style={{ padding: 24, textAlign: 'center' }}>{householdError}</div>;
  }

  if (householdLoading) {
    return <div className="centered-screen">Loading…</div>;
  }

  if (!household) {
    return <HouseholdSetupPage />;
  }

  return (
    <PendingDeleteProvider>
      <div className="app-shell">
        <main className="app-main">
          <Routes>
            <Route path="/" element={<WantToWatchPage />} />
            <Route path="/watching" element={<WatchingPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/watched" element={<WatchedPage />} />
            <Route path="/title/:titleId" element={<TitleDetailPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </PendingDeleteProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ThemeProvider>
        <AuthProvider>
          <HouseholdProvider>
            <AppShell />
          </HouseholdProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
