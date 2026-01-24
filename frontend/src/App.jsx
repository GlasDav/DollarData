import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Menu } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Settings from './pages/Settings';
import DataManagement from './pages/DataManagement';
import Transactions from './pages/Transactions';
import Dashboard from './pages/Dashboard';
import NetWorth from './pages/NetWorth';
import FinancialCalendar from './pages/FinancialCalendar';
import Subscriptions from './pages/Subscriptions';
import Tools from './pages/Tools';
import Budget from './pages/Budget';
import Review from './pages/Review';
import Reports from './pages/Reports';
import Insights from './pages/Insights';
import Goals from './pages/Goals';
import LandingPage from './pages/LandingPage';


import TransactionsHub from './pages/TransactionsHub';
import ReportsHub from './pages/ReportsHub';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import BasiqCallback from './pages/BasiqCallback';

import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { TutorialProvider, useTutorial } from './context/TutorialContext';
import Joyride, { STATUS } from 'react-joyride';
import { tourStepsMap, TOUR_IDS } from './constants/tourSteps.jsx';
import { Navigate, Outlet } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import PrivateRoute from './components/PrivateRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Footer from './components/Footer';
import { FeedbackModal, FeedbackButton } from './components/FeedbackModal';
import { LogOut } from 'lucide-react';
import NotificationBell from './components/NotificationBell';
import AIChatBot from './components/AIChatBot';
import QuickAddFAB from './components/QuickAddFAB';
import CommandPalette from './components/CommandPalette';

// Optimized QueryClient configuration for better performance and UX
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh, reduces refetches
      cacheTime: 10 * 60 * 1000, // 10 minutes - keep in cache longer
      refetchOnWindowFocus: false, // Stop aggressive refetching on window focus
      refetchOnReconnect: 'always', // Refetch only when reconnecting after offline
      retry: 1, // Retry failed requests once instead of 3 times
    },
    mutations: {
      retry: 0, // Don't retry mutations automatically (user-triggered)
    },
  },
});



// Enhanced NavItem component with left accent indicator
// Note: NavItem is now internal to Sidebar.jsx, removing it from here.

// Page title mapping
const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/transactions': 'Transactions',
  '/budget': 'Budget',
  '/net-worth': 'Net Worth',
  '/goals': 'Goals & Achievements',
  '/reports': 'Reports',
  '/settings': 'Settings',
  '/data-management': 'Data Management',
  '/calendar': 'Calendar',
  '/subscriptions': 'Subscriptions',
  '/review': 'Review',
  '/tools': 'Tools',
  '/insights': 'Insights',

};

// Header with page title
function Header({ onToggleDrawer }) {
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || 'DollarData';

  return (
    <header className="h-[72px] bg-card dark:bg-card-dark border-b border-border dark:border-border-dark flex items-center justify-between px-6 shadow-sm z-10 sticky top-0">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleDrawer}
          className="p-2 -ml-2 rounded-md text-text-muted hover:text-text-primary hover:bg-surface dark:hover:bg-surface-dark transition-colors"
        >
          <Menu size={24} />
        </button>
        <h1 className="text-lg font-semibold text-text-primary dark:text-text-primary-dark">{title}</h1>
      </div>
      <NotificationBell />
    </header>
  );
}

// Sidebar + Layout
function Layout() {
  const { logout, user } = useAuth();
  const [showFeedback, setShowFeedback] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const location = useLocation();
  const { activeTour, stepIndex, setStepIndex, completeTour, closeTour } = useTutorial();

  // Get tour steps for active tour
  const tourSteps = activeTour ? tourStepsMap[activeTour] || [] : [];

  // Close tour when navigating away from Budget page (where setup tour runs)
  React.useEffect(() => {
    if (activeTour === TOUR_IDS.SETUP && location.pathname !== '/budget') {
      closeTour();
    }
  }, [location.pathname, activeTour, closeTour]);

  // Handle Joyride callbacks
  const handleJoyrideCallback = (data) => {
    const { status, index, type } = data;

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      if (activeTour) {
        completeTour(activeTour);
      }
    } else if (type === 'step:after') {
      setStepIndex(index + 1);
    }
  };

  return (
    <div className="flex h-screen bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark font-sans overflow-hidden">

      {/* Drawer Sidebar */}
      <Sidebar
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onLogout={logout}
        onFeedback={() => setShowFeedback(true)}
      />

      {/* Backdrop Overlay */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          onClick={() => setIsDrawerOpen(false)}
        />
      )}

      {/* Main Content - wrapped in error boundary */}
      <div className="flex-1 flex flex-col overflow-hidden bg-surface dark:bg-surface-dark w-full">
        <Header onToggleDrawer={() => setIsDrawerOpen(true)} />

        <div className="flex-1 overflow-auto">
          <div className="min-h-full flex flex-col">
            <ErrorBoundary>
              <div className="flex-1">
                <Outlet />
              </div>
            </ErrorBoundary>
            {/* Hide footer on Settings page to keep sidebar fixed - footer is relevant for layout changes */}
            {location.pathname !== '/settings' && <Footer />}
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} />

      {/* Command Palette (Cmd/Ctrl+K) */}
      <CommandPalette />

      {/* Quick Add FAB */}
      <QuickAddFAB />

      {/* AI ChatBot - Available on all pages */}
      <AIChatBot />

      {/* Tutorial Joyride - only run on appropriate pages */}
      {activeTour === TOUR_IDS.SETUP && location.pathname === '/budget' && (
        <Joyride
          steps={tourSteps}
          stepIndex={stepIndex}
          run={activeTour !== null && tourSteps.length > 0}
          continuous
          showProgress
          showSkipButton
          spotlightClicks
          disableOverlayClose
          disableScrollParentFix={true}
          callback={handleJoyrideCallback}
          styles={{
            options: {
              primaryColor: '#5D5DFF',
              zIndex: 10000,
            },
            tooltip: {
              borderRadius: '12px',
              padding: '16px',
            },
            buttonNext: {
              borderRadius: '8px',
            },
            buttonBack: {
              borderRadius: '8px',
            },
            buttonSkip: {
              borderRadius: '8px',
            },
          }}
          locale={{
            back: 'Back',
            close: 'Close',
            last: 'Finish',
            next: 'Next',
            skip: 'Skip Tour',
          }}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <TutorialProvider>
              <Router>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/verify-email" element={<VerifyEmail />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/terms" element={<TermsOfService />} />
                  <Route path="/basiq-callback" element={<BasiqCallback />} />
                  <Route path="/" element={<LandingPage />} />

                  {/* Protected Routes */}
                  <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/transactions" element={<TransactionsHub />} />
                    <Route path="/budget" element={<Budget />} />
                    <Route path="/net-worth" element={<NetWorth />} />
                    <Route path="/investments" element={<Navigate to="/net-worth" replace />} />
                    <Route path="/goals" element={<Goals />} />
                    <Route path="/reports" element={<ReportsHub />} />
                    <Route path="/settings" element={<Settings />} />
                    {/* Legacy routes - redirect to consolidated pages */}
                    <Route path="/subscriptions" element={<Subscriptions />} />
                    <Route path="/review" element={<TransactionsHub />} />
                    <Route path="/calendar" element={<ReportsHub />} />
                    <Route path="/insights" element={<ReportsHub />} />
                    <Route path="/data-management" element={<DataManagement />} />
                    <Route path="/tools" element={<Settings />} />

                  </Route>
                </Routes>
              </Router>
            </TutorialProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
