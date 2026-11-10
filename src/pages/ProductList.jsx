import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PRODUCTS_DATABASE as INITIAL_PRODUCTS } from '../data/products';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const INITIAL_CATEGORIES = ['Health Care', 'Personal Care', 'Agro Care', 'Home Care', 'Food & Beverages'];
const BRANDS_ORDER = ['Elements Wellness', 'On & On', 'Indiagro', 'HLO', 'Mi Home', 'Aahar', 'Neustar'];

export default function ProductList() {
  const navigate = useNavigate();
  const [productsDb, setProductsDb] = useState(INITIAL_PRODUCTS);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dynamic categories and brands state
  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('custom_categories_list');
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  const [brandsList, setBrandsList] = useState(() => {
    const saved = localStorage.getItem('custom_brands_list');
    return saved ? JSON.parse(saved) : BRANDS_ORDER;
  });

  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedBrand, setSelectedBrand] = useState('ALL');
  
  const [expandedDescIds, setExpandedDescIds] = useState({});
  const [catalogZoom, setCatalogZoom] = useState(1);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "products"));
        if (!querySnapshot.empty) {
          const cloudProducts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setProductsDb(cloudProducts);

          // Merge any new categories or brands dynamically found from database
          const dynamicCats = new Set([...categories, ...cloudProducts.map(p => p.category).filter(Boolean)]);
          const dynamicBrands = new Set([...brandsList, ...cloudProducts.map(p => p.brand).filter(Boolean)]);

          setCategories(Array.from(dynamicCats));
          setBrandsList(Array.from(dynamicBrands));
        }
      } catch (e) {
        const saved = localStorage.getItem('custom_products_db');
        if (saved) {
          try { setProductsDb(JSON.parse(saved)); } catch (err) {}
        }
      }
    };
    fetchProducts();
  }, []);

  const toggleDescription = (id) => {
    setExpandedDescIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const categoriesDropdown = ['ALL', ...categories];
  const availableBrands = ['ALL', ...brandsList.filter(b => productsDb.some(p => p.brand === b) || BRANDS_ORDER.includes(b))];

  // Filtering & Strict Brand Priority Sorting (On & On strictly 2nd)
  const filteredProducts = productsDb.filter(p => {
    const matchesSearch = (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.code || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
    const matchesBrand = selectedBrand === 'ALL' || p.brand === selectedBrand;
    return matchesSearch && matchesCategory && matchesBrand;
  }).sort((a, b) => {
    const brandA = (a.brand || '').trim();
    const brandB = (b.brand || '').trim();

    const indexA = BRANDS_ORDER.findIndex(bName => bName.toLowerCase() === brandA.toLowerCase());
    const indexB = BRANDS_ORDER.findIndex(bName => bName.toLowerCase() === brandB.toLowerCase());
    
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    
    return (a.name || '').localeCompare(b.name || '');
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0b1329', color: 'white', padding: '16px', fontFamily: 'sans-serif', maxWidth: '850px', margin: '0 auto', boxSizing: 'border-box' }}>
      
      {/* Top Header Bar with Back Button & Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <button 
          onClick={() => navigate('/')} 
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', backgroundColor: '#1e293b', color: 'white', border: '1px solid #334155', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
        >
          ← Back
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', fontWeight: 'bold' }}>
          <span>📦</span> Products Catalog ({productsDb.length})
        </div>
      </div>

      {/* Search, Filter & Zoom Controls Bar */}
      <div style={{ backgroundColor: '#131b31', padding: '16px', borderRadius: '14px', border: '1px solid #1e293b', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        
        {/* Search Input & Zoom Controls */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px' }}>🔍</span>
            <input 
              type="text" 
              placeholder="Search name or code..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '10px', border: '1px solid #1e293b', background: '#0b1329', color: 'white', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {/* Zoom Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#0b1329', padding: '6px 10px', borderRadius: '10px', border: '1px solid #1e293b' }}>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>Zoom:</span>
            <button onClick={() => setCatalogZoom(prev => Math.max(prev - 0.1, 0.8))} style={{ background: '#1e293b', color: 'white', border: 'none', width: '24px', height: '24px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>-</button>
            <span style={{ fontSize: '11px', color: '#38bdf8', minWidth: '36px', textAlign: 'center', fontWeight: 'bold' }}>{Math.round(catalogZoom * 100)}%</span>
            <button onClick={() => setCatalogZoom(prev => Math.min(prev + 0.1, 1.3))} style={{ background: '#1e293b', color: 'white', border: 'none', width: '24px', height: '24px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>+</button>
          </div>
        </div>

        {/* Dropdowns for Categories & Brands */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{ flex: 1, minWidth: '160px', padding: '11px', borderRadius: '10px', border: '1px solid #1e293b', background: '#0b1329', color: 'white', fontSize: '13px', outline: 'none', fontWeight: 'bold' }}
          >
            {categoriesDropdown.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'ALL' ? `All Categories (${productsDb.length})` : cat}
              </option>
            ))}
          </select>

          <select 
            value={selectedBrand} 
            onChange={(e) => setSelectedBrand(e.target.value)}
            style={{ flex: 1, minWidth: '140px', padding: '11px', borderRadius: '10px', border: '1px solid #1e293b', background: '#0b1329', color: 'white', fontSize: '13px', outline: 'none', fontWeight: 'bold' }}
          >
            {availableBrands.map(brand => (
              <option key={brand} value={brand}>{brand === 'ALL' ? 'All Brands' : brand}</option>
            ))}
          </select>
        </div>

      </div>

      {/* Showing count indicator */}
      <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', letterSpacing: '0.5px', marginBottom: '14px', textTransform: 'uppercase' }}>
        Showing: {filteredProducts.length} Products (On & On strictly 2nd)
      </div>

      {/* Products List Cards Wrapper with Zoom Scaling */}
      <div style={{ transform: `scale(${catalogZoom})`, transformOrigin: 'top center', transition: 'transform 0.15s ease', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', backgroundColor: '#131b31', borderRadius: '14px' }}>
            No products found matching your search.
          </div>
        ) : (
          filteredProducts.map((p, idx) => {
            const isExpanded = !!expandedDescIds[p.id || idx];

            return (
              <div 
                key={p.id || idx} 
                style={{ backgroundColor: '#131b31', border: '1px solid #1e293b', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', boxSizing: 'border-box' }}
              >
                
                {/* Product Image Box */}
                <div style={{ width: '100%', height: '170px', backgroundColor: '#0b1329', borderRadius: '10px', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '10px', boxSizing: 'border-box' }}>
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} onError={(e) => { e.target.style.display = 'none'; }} />
                  ) : (
                    <div style={{ color: '#475569', fontSize: '12px' }}>📦 No Image</div>
                  )}
                </div>

                {/* Title & Code Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: 'white', lineHeight: '1.4' }}>{p.name}</h3>
                  {p.code && (
                    <span style={{ fontSize: '11px', backgroundColor: '#1e3a8a', color: '#93c5fd', padding: '3px 8px', borderRadius: '6px', fontFamily: 'monospace', whiteSpace: 'nowrap', fontWeight: 'bold' }}>
                      {p.code}
                    </span>
                  )}
                </div>

                {/* Category & Brand Pills */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  {p.category && (
                    <span style={{ fontSize: '11px', backgroundColor: '#3b0764', color: '#e9d5ff', padding: '4px 10px', borderRadius: '6px', fontWeight: 'bold' }}>
                      {p.category}
                    </span>
                  )}
                  {p.brand && (
                    <span style={{ fontSize: '11px', backgroundColor: '#064e3b', color: '#a7f3d0', padding: '4px 10px', borderRadius: '6px', fontWeight: 'bold' }}>
                      {p.brand}
                    </span>
                  )}
                </div>

                {/* Description Dropdown Box (Accordion) */}
                {p.description && (
                  <div style={{ backgroundColor: '#0b1329', borderRadius: '10px', border: '1px solid #1e293b', overflow: 'hidden' }}>
                    <button 
                      onClick={() => toggleDescription(p.id || idx)}
                      style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'transparent', border: 'none', color: '#38bdf8', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', textAlign: 'left' }}
                    >
                      <span>📖 Product Description</span>
                      <span style={{ fontSize: '11px' }}>{isExpanded ? '▲ Hide' : '▼ View'}</span>
                    </button>
                    
                    {isExpanded && (
                      <div style={{ padding: '0 14px 12px 14px', fontSize: '12px', color: '#94a3b8', lineHeight: '1.5', borderTop: '1px solid #1e293b', paddingTop: '8px' }}>
                        {p.description}
                      </div>
                    )}
                  </div>
                )}

                {/* Price Boxes (DP Price & MRP Price) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '2px' }}>
                  <div style={{ backgroundColor: '#0b1329', border: '1px solid #1e293b', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold', marginBottom: '4px', letterSpacing: '0.5px' }}>DP PRICE</div>
                    <div style={{ fontSize: '16px', color: '#34d399', fontWeight: 'bold' }}>₹{parseFloat(p.dpPrice || p.mrpPrice || 0).toFixed(2)}</div>
                  </div>

                  <div style={{ backgroundColor: '#0b1329', border: '1px solid #1e293b', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold', marginBottom: '4px', letterSpacing: '0.5px' }}>MRP PRICE</div>
                    <div style={{ fontSize: '16px', color: '#f87171', fontWeight: 'bold' }}>₹{parseFloat(p.mrpPrice || 0).toFixed(2)}</div>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}