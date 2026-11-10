import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { PRODUCTS_DATABASE as INITIAL_PRODUCTS } from '../data/products';
import soundFile from '../utils/notification_sound.mp3';
import SyncIndicator from '../components/SyncIndicator';

const APP_NAVIGATION_ITEMS = [
  { name: 'Create Tree', path: '/tree', icon: '🌳', desc: 'Binary tree management' },
  { name: 'Purchase Manager', path: '/purchase', icon: '🛒', desc: 'Purchase list and JPG export' },
  { name: 'Product Price List', path: '/products', icon: '📦', desc: 'DP & MRP product search' },
  { name: 'Income Calculator', path: '/calculator', icon: '🧮', desc: 'G35/G75 BV and 12% income' },
  { name: 'Make a Bill / List', path: '/billing', icon: '🧾', desc: 'Customer billing counter' },
  { name: 'Team & Training Maintenance', path: '/team-training', icon: '🛡️', desc: 'Training notes & KYC tracker' },
  { name: 'Legal & Business Info', path: '/legal-info', icon: '⚖️', desc: 'Company licenses & documents' }
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [comingSoonModal, setComingSoonModal] = useState(false);
  
  // Theme State (Dark / Light)
  const [theme, setTheme] = useState(() => localStorage.getItem('growth_os_theme') || 'dark');
  
  // Offline Online Status State
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isFirebaseOnline, setIsFirebaseOnline] = useState(navigator.onLine);

  // Global Quick Search State
  const [quickSearchQuery, setQuickSearchQuery] = useState('');

  // Realtime Live Notification Popup State
  const [liveAlert, setLiveAlert] = useState(null);
  
  useEffect(() => {
    localStorage.setItem('growth_os_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('growth_os_theme', newTheme);
    // Dispatch custom event so App.jsx updates instantly
    window.dispatchEvent(new Event('themeChange'));
  };

  // Network listener
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Firestore listener metadata will confirm backend reachability.
    };
    const handleOffline = () => {
      setIsOnline(false);
      setIsFirebaseOnline(false);
    };

    const verifyNetwork = async () => {
      if (!navigator.onLine) {
        setIsOnline(false);
        setIsFirebaseOnline(false);
        return;
      }
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4500);
        await fetch('https://www.gstatic.com/generate_204', {
          method: 'GET',
          mode: 'no-cors',
          cache: 'no-store',
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        setIsOnline(true);
      } catch {
        setIsOnline(false);
        setIsFirebaseOnline(false);
      }
    };
    verifyNetwork();
    const intervalId = setInterval(verifyNetwork, 12000);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Play notification sound
  const playSound = () => {
    const audio = new Audio(soundFile);
    audio.play().catch(e => console.log("Audio play error:", e));
  };

  // Real-time Firebase notification listener
  useEffect(() => {
    let isInitialLoad = true;

    const unsubscribe = onSnapshot(collection(db, "notifications"), { includeMetadataChanges: true }, (snapshot) => {
      setIsFirebaseOnline(!snapshot.metadata.fromCache);
      if (isInitialLoad) {
        isInitialLoad = false;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const notifData = change.doc.data();
          if (notifData.createdAt) {
            const notifTime = new Date(notifData.createdAt).getTime();
            const now = new Date().getTime();
            if (now - notifTime < 15000) {
              setLiveAlert(notifData);
              playSound();
            }
          }
        }
      });
    }, (error) => {
      setIsFirebaseOnline(false);
      console.log("Firebase Realtime Listener Error: ", error);
    });


    return () => {
      unsubscribe();
    };
  }, []);

  const filteredQuickResults = useMemo(() => {
    if (!quickSearchQuery.trim()) return [];
    const q = quickSearchQuery.toLowerCase();
    
    const matchedTools = APP_NAVIGATION_ITEMS.filter(item => 
      item.name.toLowerCase().includes(q) ||
      item.desc.toLowerCase().includes(q)
    );

    const matchedProducts = INITIAL_PRODUCTS.filter(prod =>
      (prod.name || '').toLowerCase().includes(q) ||
      (prod.code || '').toLowerCase().includes(q)
    ).slice(0, 5).map(prod => ({
      name: prod.name,
      path: '/products',
      icon: '📦',
      desc: `Code: ${prod.code} | DP: ₹${prod.dpPrice} | MRP: ₹${prod.mrpPrice}`
    }));

    return [...matchedTools, ...matchedProducts];
  }, [quickSearchQuery]);

  const isDark = theme === 'dark';
  const connectionOnline = isOnline && isFirebaseOnline;

  return (
    <div style={{ 
      backgroundColor: isDark ? '#0f172a' : '#f8fafc', 
      minHeight: '100dvh', 
      color: isDark ? 'white' : '#1e293b', 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      padding: '20px', 
      boxSizing: 'border-box',
      width: '100%',
      overflowX: 'hidden',
      transition: 'background 0.3s, color 0.3s'
    }}>
      
      {/* Real-time Broadcast Alert Popup Modal */}
      {liveAlert && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ backgroundColor: isDark ? '#1e293b' : 'white', border: '2px solid #f59e0b', padding: '25px', borderRadius: '16px', maxWidth: '380px', width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.6)' }}>
            <span style={{ fontSize: '32px' }}>🔔</span>
            <h3 style={{ margin: 0, color: '#f59e0b', fontSize: '18px' }}>{liveAlert.title}</h3>
            <p style={{ margin: 0, fontSize: '14px', color: isDark ? '#e2e8f0' : '#475569', lineHeight: '1.5' }}>
              {liveAlert.message}
            </p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button onClick={() => setLiveAlert(null)} style={{ flex: 1, padding: '11px', backgroundColor: '#334155', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Header Bar (Sync Indicator, Theme Switcher & Admin Panel Button) */}
      <div style={{ width: '100%', maxWidth: '800px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
        
        {/* Offline Sync Indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 12px',
          backgroundColor: connectionOnline ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: `1px solid ${connectionOnline ? '#10b981' : '#ef4444'}`,
          borderRadius: '20px',
          fontSize: '11px',
          fontWeight: 'bold',
          color: connectionOnline ? '#34d399' : '#f87171'
        }}>
          <span style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            backgroundColor: connectionOnline ? '#10b981' : '#ef4444',
            boxShadow: `0 0 8px ${connectionOnline ? '#10b981' : '#ef4444'}`
          }}></span>
          {connectionOnline ? 'Online' : 'Offline'}
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* Theme Switcher Button */}
          <button 
            onClick={toggleTheme}
            style={{ 
              padding: '8px 12px', 
              backgroundColor: isDark ? '#334155' : '#e2e8f0', 
              color: isDark ? '#f8fafc' : '#1e293b', 
              border: 'none', 
              borderRadius: '8px', 
              fontWeight: 'bold', 
              fontSize: '12px', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {isDark ? '☀️ Light' : '🌙 Dark'}
          </button>

          {/* Admin Panel Button */}
          <button 
            onClick={() => navigate('/admin')}
            style={{ 
              padding: '8px 14px', 
              backgroundColor: '#7e22ce', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px', 
              fontWeight: 'bold', 
              fontSize: '12px', 
              cursor: 'pointer',
              boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
            }}
          >
            🔐 Admin Panel
          </button>
        </div>

      </div>

      {/* Top Header / Title Section */}
      <div style={{ textAlign: 'center', width: '100%', marginBottom: '10px' }}>
        <h1 style={{ margin: '0 0 5px 0', fontSize: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          🚀 Growth OS
        </h1>
        <p style={{ margin: 0, fontSize: '13px', color: '#38bdf8', fontWeight: 'bold' }}>Ultimate Edition</p>
      </div>

      {/* GLOBAL QUICK SEARCH (Tools & Products Instant Search) */}
      <div style={{ width: '100%', maxWidth: '800px', marginBottom: '15px', position: 'relative' }}>
        <input 
          type="text"
          placeholder="🔍 Quick search tools, features, or products..."
          value={quickSearchQuery}
          onChange={(e) => setQuickSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 14px',
            backgroundColor: isDark ? '#162032' : '#ffffff',
            border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
            borderRadius: '10px',
            color: isDark ? 'white' : '#1e293b',
            fontSize: '13px',
            outline: 'none',
            boxSizing: 'border-box',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
          }}
        />

        {/* Floating Search Results Dropdown */}
        {quickSearchQuery.trim() !== '' && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 5px)',
            left: 0,
            right: 0,
            backgroundColor: isDark ? '#1e293b' : '#ffffff',
            border: `1px solid ${isDark ? '#475569' : '#cbd5e1'}`,
            borderRadius: '10px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            zIndex: 100,
            maxHeight: '280px',
            overflowY: 'auto'
          }}>
            {filteredQuickResults.length === 0 ? (
              <div style={{ padding: '12px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
                No matching tools or products found.
              </div>
            ) : (
              filteredQuickResults.map((item, idx) => (
                <div 
                  key={idx}
                  onClick={() => {
                    navigate(item.path);
                    setQuickSearchQuery('');
                  }}
                  style={{
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: 'pointer',
                    borderBottom: idx < filteredQuickResults.length - 1 ? `1px solid ${isDark ? '#334155' : '#e2e8f0'}` : 'none',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? '#334155' : '#f1f5f9'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <span style={{ fontSize: '18px' }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#38bdf8' }}>{item.name}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>{item.desc}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Cards Container */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', 
        gap: '16px', 
        width: '100%', 
        maxWidth: '800px',
        margin: '10px 0',
        padding: '10px',
        boxSizing: 'border-box'
      }}>
        
        {/* Create Tree Card */}
        <div 
          onClick={() => navigate('/tree')}
          style={{ background: isDark ? '#1e293b' : '#ffffff', padding: '22px', borderRadius: '14px', cursor: 'pointer', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, display: 'flex', flexDirection: 'column', gap: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
        >
          <div style={{ fontSize: '28px' }}>🌳</div>
          <h3 style={{ margin: 0, fontSize: '18px', color: isDark ? 'white' : '#1e293b' }}>Create Tree</h3>
          <p style={{ margin: 0, fontSize: '13px', color: isDark ? '#94a3b8' : '#64748b' }}>Create and manage your binary tree</p>
        </div>

        {/* Purchase Manager Card */}
        <div 
          onClick={() => navigate('/purchase')}
          style={{ background: isDark ? '#1e293b' : '#ffffff', padding: '22px', borderRadius: '14px', cursor: 'pointer', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, display: 'flex', flexDirection: 'column', gap: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
        >
          <div style={{ fontSize: '28px' }}>🛒</div>
          <h3 style={{ margin: 0, fontSize: '18px', color: isDark ? 'white' : '#1e293b' }}>Purchase Manager</h3>
          <p style={{ margin: 0, fontSize: '13px', color: isDark ? '#94a3b8' : '#64748b' }}>Create purchase list and export image</p>
        </div>

        {/* Product Price List Card */}
        <div 
          onClick={() => navigate('/products')}
          style={{ background: isDark ? '#1e293b' : '#ffffff', padding: '22px', borderRadius: '14px', cursor: 'pointer', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, display: 'flex', flexDirection: 'column', gap: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
        >
          <div style={{ fontSize: '28px' }}>📦</div>
          <h3 style={{ margin: 0, fontSize: '18px', color: isDark ? 'white' : '#1e293b' }}>Product Price List</h3>
          <p style={{ margin: 0, fontSize: '13px', color: isDark ? '#94a3b8' : '#64748b' }}>View DP & MRP prices with instant live search</p>
        </div>

        {/* Income Calculator Card */}
        <div 
          onClick={() => navigate('/calculator')}
          style={{ background: isDark ? '#1e293b' : '#ffffff', padding: '22px', borderRadius: '14px', cursor: 'pointer', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, display: 'flex', flexDirection: 'column', gap: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
        >
          <div style={{ fontSize: '28px' }}>🧮</div>
          <h3 style={{ margin: 0, fontSize: '18px', color: isDark ? 'white' : '#1e293b' }}>Income Calculator</h3>
          <p style={{ margin: 0, fontSize: '13px', color: isDark ? '#94a3b8' : '#64748b' }}>Calculate G35/G75 BV and 12% income instantly</p>
        </div>

        {/* Make a Bill / List Card */}
        <div 
          onClick={() => navigate('/billing')}
          style={{ background: isDark ? '#1e293b' : '#ffffff', padding: '22px', borderRadius: '14px', cursor: 'pointer', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, display: 'flex', flexDirection: 'column', gap: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
        >
          <div style={{ fontSize: '28px' }}>🧾</div>
          <h3 style={{ margin: 0, fontSize: '18px', color: isDark ? 'white' : '#1e293b' }}>Make a Bill / List</h3>
          <p style={{ margin: 0, fontSize: '13px', color: isDark ? '#94a3b8' : '#64748b' }}>Create instant customer bills and calculate DP/MRP totals</p>
        </div>

        {/* Team & Training Maintenance Card */}
        <div 
          onClick={() => navigate('/team-training')}
          style={{ background: isDark ? '#1e293b' : '#ffffff', padding: '22px', borderRadius: '14px', cursor: 'pointer', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, display: 'flex', flexDirection: 'column', gap: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
        >
          <div style={{ fontSize: '28px' }}>🛡️</div>
          <h3 style={{ margin: 0, fontSize: '18px', color: isDark ? 'white' : '#1e293b' }}>Team & Training Maintenance</h3>
          <p style={{ margin: 0, fontSize: '13px', color: isDark ? '#94a3b8' : '#64748b' }}>Manage training notes and track team KYC/NEFT statuses locally</p>
        </div>

        {/* Legal & Business Info Card */}
        <div 
          onClick={() => navigate('/legal-info')}
          style={{ background: isDark ? '#1e293b' : '#ffffff', padding: '22px', borderRadius: '14px', cursor: 'pointer', border: `1px solid ${isDark ? '#0369a1' : '#bae6fd'}`, display: 'flex', flexDirection: 'column', gap: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
        >
          <div style={{ fontSize: '28px' }}>⚖️</div>
          <h3 style={{ margin: 0, fontSize: '18px', color: isDark ? 'white' : '#1e293b' }}>Legal & Business Info</h3>
          <p style={{ margin: 0, fontSize: '13px', color: isDark ? '#94a3b8' : '#64748b' }}>View company licenses and official documents</p>
        </div>

      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', marginBottom: '10px', fontSize: '12px', color: '#64748b' }}>
        Growth OS • Powered by <span style={{ color: '#38bdf8' }}>Gokulnathan</span>
      </div>

    </div>
  );
}