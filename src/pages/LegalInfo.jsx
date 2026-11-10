import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { keyReasonsTamil as DEFAULT_REASONS, incomeOpportunities as DEFAULT_INCOME, promotionalSupport as DEFAULT_SUPPORT, rankTableData as DEFAULT_RANKS, bopVenuesData as DEFAULT_BOP } from '../data/legalDefaults';

export default function LegalInfo() {
  const navigate = useNavigate();
  
  const [legalInfo, setLegalInfo] = useState({
    title: '⚖️ Legal & Business Info',
    description: 'Explore company licenses, registration details, 12 types of incomes, and official support frameworks.',
    certificates: [],
    keyReasonsTamil: DEFAULT_REASONS,
    incomeOpportunities: DEFAULT_INCOME,
    promotionalSupport: DEFAULT_SUPPORT,
    rankTableData: DEFAULT_RANKS,
    bopVenuesData: DEFAULT_BOP
  });

  // Zoom scale state for mobile responsiveness (range: 0.8 to 1.4)
  const [zoomScale, setZoomScale] = useState(1);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "settings", "legal_info"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setLegalInfo({
          title: data.title || '⚖️ Legal & Business Info',
          description: data.description || '',
          certificates: data.certificates || (data.licenseImageUrl ? [{ id: '1', title: 'License 1', imageUrl: data.licenseImageUrl }] : []),
          keyReasonsTamil: Array.isArray(data.keyReasonsTamil) ? data.keyReasonsTamil : DEFAULT_REASONS,
          incomeOpportunities: Array.isArray(data.incomeOpportunities) ? data.incomeOpportunities : DEFAULT_INCOME,
          promotionalSupport: Array.isArray(data.promotionalSupport) ? data.promotionalSupport : DEFAULT_SUPPORT,
          rankTableData: Array.isArray(data.rankTableData) ? data.rankTableData : DEFAULT_RANKS,
          bopVenuesData: Array.isArray(data.bopVenuesData) ? data.bopVenuesData : DEFAULT_BOP
        });
      }
    }, (err) => {
      console.log("Error fetching legal info", err);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'bop_venues'), snapshot => {
      const venues = snapshot.exists() ? snapshot.data().venues : null;
      if (Array.isArray(venues)) setLegalInfo(prev => ({ ...prev, bopVenuesData: venues }));
    }, error => console.log('BOP venue sync unavailable', error));
    return () => unsubscribe();
  }, []);

  const handleZoomIn = () => {
    setZoomScale(prev => Math.min(prev + 0.1, 1.4));
  };

  const handleZoomOut = () => {
    setZoomScale(prev => Math.max(prev - 0.1, 0.8));
  };

  const handleResetZoom = () => {
    setZoomScale(1);
  };

  const keyReasonsTamil = legalInfo.keyReasonsTamil || DEFAULT_REASONS;
  const incomeOpportunities = legalInfo.incomeOpportunities || DEFAULT_INCOME;
  const promotionalSupport = legalInfo.promotionalSupport || DEFAULT_SUPPORT;
  const rankTableData = legalInfo.rankTableData || DEFAULT_RANKS;
  const bopVenuesData = legalInfo.bopVenuesData || DEFAULT_BOP;






  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: 'white', padding: '20px', boxSizing: 'border-box', fontFamily: 'sans-serif', maxWidth: '950px', margin: '0 auto' }}>
      
      {/* Header & Zoom Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #334155', paddingBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
        <button onClick={() => navigate('/')} style={{ padding: '8px 14px', backgroundColor: '#334155', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
          ⬅ Back to Dashboard
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'bold' }}>Zoom:</span>
          <button onClick={handleZoomOut} style={{ padding: '6px 10px', backgroundColor: '#334155', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }} title="Zoom Out">-</button>
          <button onClick={handleResetZoom} style={{ padding: '6px 10px', backgroundColor: '#475569', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }} title="Reset Zoom">{Math.round(zoomScale * 100)}%</button>
          <button onClick={handleZoomIn} style={{ padding: '6px 10px', backgroundColor: '#334155', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }} title="Zoom In">+</button>
        </div>
      </div>

      {/* Main Content Wrapper with Zoom Scale Effect */}
      <div style={{ transform: `scale(${zoomScale})`, transformOrigin: 'top center', transition: 'transform 0.2s ease', display: 'flex', flexDirection: 'column', gap: '25px' }}>
        
        {/* Title */}
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ margin: 0, color: '#38bdf8', fontSize: '20px' }}>{legalInfo.title}</h2>
        </div>

        {/* Description Section */}
        <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#cbd5e1', lineHeight: '1.6' }}>
            {legalInfo.description}
          </p>
        </div>

        {/* Certificates Gallery Section */}
        {legalInfo.certificates && legalInfo.certificates.length > 0 && (
          <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#38bdf8', fontSize: '16px' }}>📜 Official Company Licenses & Certificates</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
              {legalInfo.certificates.map((cert) => (
                <div key={cert.id} style={{ backgroundColor: '#0f172a', padding: '12px', borderRadius: '10px', border: '1px solid #475569', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>{cert.title}</div>
                  <div style={{ width: '100%', height: '220px', background: '#1e293b', borderRadius: '6px', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid #334155' }}>
                    <img src={cert.imageUrl} alt={cert.title} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Key Reasons */}
        <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
          <h3 style={{ color: '#38bdf8', fontSize: '16px', marginBottom: '15px' }}>💡 வணிகப் பயணம் தொடங்க முக்கிய காரணங்கள்</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
            {keyReasonsTamil.map((item, idx) => (
              <div key={idx} style={{ backgroundColor: '#0f172a', padding: '12px', borderRadius: '8px', border: '1px solid #334155' }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#38bdf8' }}>{item.title}</div>
                <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '4px', lineHeight: '1.4' }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Rank Table */}
        <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
          <h3 style={{ color: '#38bdf8', fontSize: '16px', marginBottom: '15px' }}>📊 Rank Eligibility & Matched GBV Table</h3>
          <div style={{ overflowX: 'auto', maxHeight: '350px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#334155', color: '#38bdf8', position: 'sticky', top: 0 }}>
                  <th style={{ padding: '10px', border: '1px solid #475569', textAlign: 'center', width: '60px' }}>SI. No</th>
                  <th style={{ padding: '10px', border: '1px solid #475569' }}>Rank</th>
                  <th style={{ padding: '10px', border: '1px solid #475569' }}>Matched GBV</th>
                </tr>
              </thead>
              <tbody>
                {rankTableData.map((row) => (
                  <tr key={row.no} style={{ borderBottom: '1px solid #334155' }}>
                    <td style={{ padding: '8px 10px', border: '1px solid #334155', textAlign: 'center', color: '#94a3b8' }}>{row.no}</td>
                    <td style={{ padding: '8px 10px', border: '1px solid #334155', fontWeight: 'bold', color: 'white' }}>{row.rank}</td>
                    <td style={{ padding: '8px 10px', border: '1px solid #334155', color: '#cbd5e1' }}>{row.mbv}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 12 Types of Income */}
        <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
          <h3 style={{ color: '#38bdf8', fontSize: '16px', marginBottom: '15px' }}>🌟 12 வகையான வருமான வாய்ப்புகள்</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
            {incomeOpportunities.map((item) => (
              <div key={item.no} style={{ backgroundColor: '#0f172a', padding: '12px', borderRadius: '8px', border: '1px solid #334155', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#c084fc', background: '#1e1b4b', padding: '4px 8px', borderRadius: '6px' }}>{item.no}</span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'white' }}>{item.title}</div>
                  <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '4px', lineHeight: '1.4' }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Promotional Support */}
        <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
          <h3 style={{ color: '#f472b6', fontSize: '16px', marginBottom: '10px' }}>📢 Promotional Support</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px' }}>
            {promotionalSupport.map((item) => (
              <div key={item.code} style={{ backgroundColor: '#0f172a', padding: '10px 12px', borderRadius: '8px', border: '1px solid #334155', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#f472b6', background: '#312e81', padding: '4px 8px', borderRadius: '6px' }}>{item.code}</span>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'white' }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* COMPANY BOP VENUE TABLE SECTION */}
        <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155', marginBottom: '20px' }}>
          <h3 style={{ color: '#38bdf8', fontSize: '16px', marginBottom: '15px' }}>📍 Company BOP Venues</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#334155', color: '#38bdf8' }}>
                  <th style={{ padding: '10px', border: '1px solid #475569', textAlign: 'center', width: '60px' }}>S.No</th>
                  <th style={{ padding: '10px', border: '1px solid #475569' }}>Meeting Venue</th>
                  <th style={{ padding: '10px', border: '1px solid #475569' }}>City</th>
                  <th style={{ padding: '10px', border: '1px solid #475569' }}>State</th>
                  <th style={{ padding: '10px', border: '1px solid #475569' }}>Weekdays</th>
                  <th style={{ padding: '10px', border: '1px solid #475569' }}>Time</th>
                </tr>
              </thead>
              <tbody>
                {bopVenuesData.map((venue) => (
                  <tr key={venue.sNo} style={{ borderBottom: '1px solid #334155' }}>
                    <td style={{ padding: '8px 10px', border: '1px solid #334155', textAlign: 'center', color: '#94a3b8' }}>{venue.sNo}</td>
                    <td style={{ padding: '8px 10px', border: '1px solid #334155', fontWeight: 'bold', color: 'white' }}>{venue.venue}</td>
                    <td style={{ padding: '8px 10px', border: '1px solid #334155', color: '#38bdf8' }}>{venue.city}</td>
                    <td style={{ padding: '8px 10px', border: '1px solid #334155', color: '#cbd5e1' }}>{venue.state}</td>
                    <td style={{ padding: '8px 10px', border: '1px solid #334155', color: '#f59e0b', fontWeight: 'bold' }}>{venue.weekdays}</td>
                    <td style={{ padding: '8px 10px', border: '1px solid #334155', color: '#34d399', fontWeight: 'bold' }}>{venue.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}