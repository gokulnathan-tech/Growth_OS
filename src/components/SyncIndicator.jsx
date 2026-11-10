import React, { useState, useEffect } from 'react';

export default function SyncIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic check to verify real network connection
    const interval = setInterval(() => {
      setIsOnline(navigator.onLine);
    }, 3000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '5px 12px',
      backgroundColor: isOnline ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
      border: `1px solid ${isOnline ? '#10b981' : '#ef4444'}`,
      borderRadius: '20px',
      fontSize: '11px',
      fontWeight: 'bold',
      color: isOnline ? '#34d399' : '#f87171'
    }}>
      <span style={{
        width: '7px',
        height: '7px',
        borderRadius: '50%',
        backgroundColor: isOnline ? '#10b981' : '#ef4444',
        boxShadow: `0 0 8px ${isOnline ? '#10b981' : '#ef4444'}`
      }}></span>
      {isOnline ? 'Online' : 'Offline'}
    </div>
  );
}