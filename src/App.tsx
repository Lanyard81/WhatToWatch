import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { HouseholdProvider, useHousehold } from './context/HouseholdContext';
import { ThemeProvider } from './context/ThemeContext';
import { PendingDeleteProvider } from './context/PendingDeleteContext';
import { BottomNav } from './components/BottomNav';
import { TopBar } from './components/TopBar';
import { FloatingActionButton } from './components/FloatingActionButton';
import { LoginPage } from './pages/LoginPage';
import { HouseholdSetupPage } from './pages/HouseholdSetupPage';
import { JoinPage } from './pages/JoinPage';
import { SearchPage } from './pages/SearchPage';
import { WantToWatchPage } from './pages/WantToWatchPage';
import { WatchingPage } from './pages/WatchingPage';
import { WatchedPage } from './pages/WatchedPage';
import { SettingsPage } from './pages/SettingsPage';
import { TitleDetailPage } from './pages/TitleDetailPage';
import { StatsPage } from './pages/StatsPage';

const FAB_ROUTES = new Set(['/', '/watching', '/watched']);

function AppShell() {
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { household, loading: householdLoading, error: householdError } = useHousehold();

  // Reachable before sign-in and before a household is set up — JoinPage
  // manages its own auth/household states rather than sharing the gates below.
  // Routed explicitly (rather than just rendered) so useParams() binds :householdId.
  if (location.pathname.startsWith('/join/')) {
    return (
      <Routes>
        <Route path="/join/:householdId" element={<JoinPage />} />
      </Routes>
    );
  }

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
        <TopBar />
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
        {FAB_ROUTES.has(location.pathname) && <FloatingActionButton />}
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
