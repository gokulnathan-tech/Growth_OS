import React, { useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { scheduleDailyQuoteNotification, initNotificationListeners } from './utils/notifications';

import LegalInfo from './pages/LegalInfo';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Billing = lazy(() => import('./pages/Billing'));
const Admin = lazy(() => import('./pages/Admin'));
const Purchase = lazy(() => import('./pages/Purchase'));
const ProductList = lazy(() => import('./pages/ProductList'));
const IncomeCalculator = lazy(() => import('./pages/IncomeCalculator'));
const Home = lazy(() => import('./pages/Home'));
const TeamTraining = lazy(() => import('./pages/TeamTraining'));

function AppContent() {
  const navigate = useNavigate();
  const [notificationPopup, setNotificationPopup] = useState(null);
  
  // Global theme sync listener across app routes
  const [theme, setTheme] = useState(() => localStorage.getItem('growth_os_theme') || 'dark');

  useEffect(() => {
    scheduleDailyQuoteNotification();

    initNotificationListeners(navigate, (popupData) => {
      setNotificationPopup(popupData);
    });

    // Check theme from localStorage periodically or storage event
    const handleThemeChange = () => {
      const currentTheme = localStorage.getItem('growth_os_theme') || 'dark';
      setTheme(currentTheme);
      document.documentElement.dataset.theme = currentTheme;
      document.body.dataset.theme = currentTheme;
    };
    handleThemeChange();
    window.addEventListener('storage', handleThemeChange);
    window.addEventListener('themeChange', handleThemeChange);
    return () => {
      window.removeEventListener('storage', handleThemeChange);
      window.removeEventListener('themeChange', handleThemeChange);
    };
  }, [navigate]);

  const isDark = theme === 'dark';
  document.documentElement.dataset.theme = theme;
  document.body.dataset.theme = theme;

  return (
    <div style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc', minHeight: '100vh', color: isDark ? 'white' : '#1e293b', transition: 'background 0.3s, color 0.3s' }}>
      <Suspense fallback={
        <div style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '15px', color: '#38bdf8', fontSize: '16px', fontWeight: 'bold', fontFamily: 'sans-serif' }}>
          <div style={{ fontSize: '36px' }}>⏳</div>
          <span>🚀 Loading Growth OS...</span>
        </div>
      }>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/purchase" element={<Purchase />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/tree" element={<Home />} />
          <Route path="/calculator" element={<IncomeCalculator />} />
          <Route path="/team" element={<TeamTraining />} />
          <Route path="/team-training" element={<TeamTraining />} />
          <Route path="/legal-info" element={<LegalInfo />} />
        </Routes>
      </Suspense>

      {notificationPopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ backgroundColor: isDark ? '#1e293b' : 'white', border: '2px solid #7e22ce', padding: '30px', borderRadius: '16px', maxWidth: '420px', width: '100%', textAlign: 'center', boxShadow: '0 15px 35px rgba(126,34,206,0.4)' }}>
            <h3 style={{ color: '#38bdf8', marginTop: 0, fontSize: '20px' }}>{notificationPopup.title}</h3>
            <p style={{ color: isDark ? '#cbd5e1' : '#475569', fontSize: '14px', lineHeight: '1.6', margin: '15px 0' }}>{notificationPopup.message}</p>
            <button 
              onClick={() => setNotificationPopup(null)} 
              style={{ padding: '12px 25px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', width: '100%', fontSize: '14px' }}
            >
              OK / Close ✖️
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}