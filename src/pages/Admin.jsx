import React, { useState, useEffect } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { useNavigate } from 'react-router-dom';
import { PRODUCTS_DATABASE as INITIAL_PRODUCTS } from '../data/products';
import { collection, doc, setDoc, deleteDoc, onSnapshot, getDocs, addDoc, getDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { sendCustomAdminNotification } from '../utils/notifications';
import { keyReasonsTamil as DEFAULT_REASONS, incomeOpportunities as DEFAULT_INCOME, promotionalSupport as DEFAULT_SUPPORT, rankTableData as DEFAULT_RANKS } from '../data/legalDefaults';

const BiometricAuth = registerPlugin('BiometricAuth');

const INITIAL_CATEGORIES = ['Health Care', 'Personal Care', 'Agro Care', 'Home Care', 'Food & Beverages'];
const INITIAL_BRANDS = ['Elements Wellness', 'On & On', 'Indiagro', 'Neustar', 'Mi Home', 'Aahar', 'HLO'];

const DEFAULT_BOP_VENUES = [
  { id: 'bop_1', sNo: '1', venue: 'HOTEL GOLDEN PARK', city: 'MADURAI', state: 'TAMIL NADU', weekdays: 'SUNDAY', time: '3.00 PM' },
  { id: 'bop_2', sNo: '2', venue: 'THE RICHMAN HOTEL', city: 'TIRUPUR', state: 'TAMIL NADU', weekdays: 'SUNDAY', time: '3.00 PM' },
  { id: 'bop_3', sNo: '3', venue: 'HOTEL FREE BIRDS', city: 'TRICHY', state: 'TAMIL NADU', weekdays: 'SUNDAY', time: '4.00 PM - 6.00 PM' },
  { id: 'bop_4', sNo: '4', venue: 'HOTEL THENI INTERNATIONAL', city: 'THENI', state: 'TAMIL NADU', weekdays: 'SATURDAY', time: '10.00 AM' },
  { id: 'bop_5', sNo: '5', venue: 'SIMSAN HOTEL', city: 'CHENNAI', state: 'TAMIL NADU', weekdays: 'SUNDAY', time: '3 PM' },
  { id: 'bop_6', sNo: '6', venue: 'THE SWAGATH GRANDE', city: 'DINDIGUL', state: 'TAMIL NADU', weekdays: 'SUNDAY', time: '10.30 - 1.30 PM' },
  { id: 'bop_7', sNo: '7', venue: 'KRV MERIDIAN', city: 'KARUR', state: 'TAMIL NADU', weekdays: 'SUNDAY', time: '10.30 AM' },
  { id: 'bop_8', sNo: '8', venue: 'HOTEL PRINCE GARDENS', city: 'COIMBATORE', state: 'TAMIL NADU', weekdays: 'SUNDAY', time: '3.00 PM' },
  { id: 'bop_9', sNo: '9', venue: 'LP PLAZA', city: 'ARCOT', state: 'TAMIL NADU', weekdays: 'SUNDAY', time: '11.00 AM' },
  { id: 'bop_10', sNo: '10', venue: 'ARCHANA SWEETS AND BAKERY(SAKTHI MINI HALL)', city: 'TIRUNELVELI', state: 'TAMIL NADU', weekdays: 'SATURDAY', time: '4.00 PM' },
  { id: 'bop_11', sNo: '11', venue: 'SOLAI MINI HALL', city: 'THOOTHUKUDI', state: 'TAMIL NADU', weekdays: 'THURSDAY', time: '3.00 PM' },
  { id: 'bop_12', sNo: '12', venue: 'LOTUS MINI A/C MAHAL', city: 'TIRUVANNAMALAI', state: 'TAMIL NADU', weekdays: 'TUESDAY', time: '4.00 PM' },
  { id: 'bop_13', sNo: '13', venue: 'HOTEL TAMILNADU', city: 'KANCHEEPURAM', state: 'TAMIL NADU', weekdays: 'SATURDAY', time: '4.00 PM' }
];

export default function Admin() {
  const navigate = useNavigate();
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isBiometricPrompt, setIsBiometricPrompt] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [adminTab, setAdminTab] = useState('products');

  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [productSearch, setProductSearch] = useState('');

  // Dynamic Categories & Brands state stored in localStorage & synced
  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('custom_categories_list');
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  const [brands, setBrands] = useState(() => {
    const saved = localStorage.getItem('custom_brands_list');
    return saved ? JSON.parse(saved) : INITIAL_BRANDS;
  });

  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [newBrandInput, setNewBrandInput] = useState('');

  const [legalAdminForm, setLegalAdminForm] = useState({
    title: '⚖️ Legal & Business Info',
    description: 'Explore company licenses, registration details, 12 types of incomes, and official support frameworks.',
    certificates: [],
    keyReasonsTamil: DEFAULT_REASONS,
    incomeOpportunities: DEFAULT_INCOME,
    promotionalSupport: DEFAULT_SUPPORT,
    rankTableData: DEFAULT_RANKS
  });
  const [newCert, setNewCert] = useState({ title: '', imageUrl: '' });

  const [bopVenues, setBopVenues] = useState(DEFAULT_BOP_VENUES);
  const [newBop, setNewBop] = useState({ venue: '', city: '', state: 'TAMIL NADU', weekdays: 'SUNDAY', time: '' });
  const [editingBopId, setEditingBopId] = useState(null);
  const [editBopForm, setEditBopForm] = useState({ sNo: '', venue: '', city: '', state: '', weekdays: '', time: '' });

  const [customNotify, setCustomNotify] = useState({ title: '', message: '', scheduledTime: '' });

  useEffect(() => {
    const savedAdminAuth = localStorage.getItem('growth_os_admin_session');
    if (savedAdminAuth === 'active') {
      setIsBiometricPrompt(true);
    }

    const cleanOldNotifications = async () => {
      try {
        const notifSnap = await getDocs(collection(db, "notifications"));
        const now = new Date().getTime();
        const twelveHoursInMs = 12 * 60 * 60 * 1000;

        notifSnap.docs.forEach(async (docSnap) => {
          const data = docSnap.data();
          if (data.createdAt) {
            const createdTime = new Date(data.createdAt).getTime();
            if (now - createdTime > twelveHoursInMs) {
              await deleteDoc(doc(db, "notifications", docSnap.id));
            }
          }
        });
      } catch (e) {
        console.log("Error cleaning old notifications:", e);
      }
    };

    cleanOldNotifications();

    const unsubscribeProducts = onSnapshot(collection(db, "products"), (snapshot) => {
      const cloudProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const deletedIds = JSON.parse(localStorage.getItem('deleted_product_ids') || '[]');
      const mergedMap = new Map();
      INITIAL_PRODUCTS.forEach(p => {
        if (!deletedIds.includes(p.id.toString())) mergedMap.set(p.id.toString(), p);
      });
      cloudProducts.forEach(p => {
        if (!deletedIds.includes(p.id.toString())) mergedMap.set(p.id.toString(), { ...(mergedMap.get(p.id.toString()) || {}), ...p });
      });
      const finalProductsList = Array.from(mergedMap.values());
      setProducts(finalProductsList);
      localStorage.setItem('custom_products_db', JSON.stringify(finalProductsList));

      // Extract any unique categories and brands from products dynamically
      const dynamicCats = new Set(finalProductsList.map(p => p.category).filter(Boolean));
      const dynamicBrands = new Set(finalProductsList.map(p => p.brand).filter(Boolean));
      
      setCategories(prev => Array.from(new Set([...prev, ...dynamicCats])));
      setBrands(prev => Array.from(new Set([...prev, ...dynamicBrands])));
    });

    const fetchAdminData = async () => {
      try {
        const legalSnap = await getDoc(doc(db, "settings", "legal_info"));
        if (legalSnap.exists()) {
          const data = legalSnap.data();
          setLegalAdminForm({
            title: data.title || '⚖️ Legal & Business Info',
            description: data.description || '',
            certificates: data.certificates || (data.licenseImageUrl ? [{ id: '1', title: 'License 1', imageUrl: data.licenseImageUrl }] : []),
            keyReasonsTamil: Array.isArray(data.keyReasonsTamil) ? data.keyReasonsTamil : DEFAULT_REASONS,
            incomeOpportunities: Array.isArray(data.incomeOpportunities) ? data.incomeOpportunities : DEFAULT_INCOME,
            promotionalSupport: Array.isArray(data.promotionalSupport) ? data.promotionalSupport : DEFAULT_SUPPORT,
            rankTableData: Array.isArray(data.rankTableData) ? data.rankTableData : DEFAULT_RANKS
          });
        }

        const catalogSnap = await getDoc(doc(db, "settings", "catalog_options"));
        if (catalogSnap.exists()) {
          const catalog = catalogSnap.data();
          if (Array.isArray(catalog.categories)) setCategories(catalog.categories);
          if (Array.isArray(catalog.brands)) setBrands(catalog.brands);
        }

        const bopSnap = await getDoc(doc(db, "settings", "bop_venues"));
        if (bopSnap.exists() && bopSnap.data().venues && bopSnap.data().venues.length > 0) {
          setBopVenues(bopSnap.data().venues);
        } else {
          await setDoc(doc(db, "settings", "bop_venues"), { venues: DEFAULT_BOP_VENUES }, { merge: true });
          setBopVenues(DEFAULT_BOP_VENUES);
        }
      } catch (err) {
        console.log("Error fetching admin data", err);
      }
    };
    fetchAdminData();

    return () => unsubscribeProducts();
  }, []);

  const [newProd, setNewProd] = useState({ name: '', code: '', category: categories[0] || 'Health Care', brand: brands[0] || 'Elements Wellness', mrpPrice: '', dpPrice: '', imageUrl: '', description: '' });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', code: '', category: categories[0] || 'Health Care', brand: brands[0] || 'Elements Wellness', mrpPrice: '', dpPrice: '', imageUrl: '', description: '' });

  const handleAddCategory = () => {
    if (!newCategoryInput.trim()) return;
    const formatted = newCategoryInput.trim();
    if (!categories.includes(formatted)) {
      const updated = [...categories, formatted];
      setCategories(updated);
      localStorage.setItem('custom_categories_list', JSON.stringify(updated));
      persistCatalogOptions(updated, brands).catch(error => console.error('Category sync failed', error));
      setNewProd({ ...newProd, category: formatted });
      alert(`✅ Category "${formatted}" created successfully!`);
    } else {
      alert('⚠️ Category already exists!');
    }
    setNewCategoryInput('');
  };

  const handleAddBrand = () => {
    if (!newBrandInput.trim()) return;
    const formatted = newBrandInput.trim();
    if (!brands.includes(formatted)) {
      const updated = [...brands, formatted];
      setBrands(updated);
      localStorage.setItem('custom_brands_list', JSON.stringify(updated));
      persistCatalogOptions(categories, updated).catch(error => console.error('Brand sync failed', error));
      setNewProd({ ...newProd, brand: formatted });
      alert(`✅ Brand "${formatted}" created successfully!`);
    } else {
      alert('⚠️ Brand already exists!');
    }
    setNewBrandInput('');
  };

  const persistCatalogOptions = async (nextCategories, nextBrands) => {
    await setDoc(doc(db, "settings", "catalog_options"), {
      categories: nextCategories,
      brands: nextBrands,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  };

  const handleRenameCategory = async (oldName) => {
    const nextName = window.prompt('Edit category name', oldName)?.trim();
    if (!nextName || nextName === oldName) return;
    if (categories.some(value => value.toLowerCase() === nextName.toLowerCase())) return alert('Category already exists.');
    try {
      const batch = writeBatch(db);
      products.filter(p => p.category === oldName).forEach(p => batch.set(doc(db, 'products', String(p.id)), { category: nextName }, { merge: true }));
      await batch.commit();
      const nextCategories = categories.map(value => value === oldName ? nextName : value);
      const nextProducts = products.map(p => p.category === oldName ? { ...p, category: nextName } : p);
      setCategories(nextCategories); localStorage.setItem('custom_categories_list', JSON.stringify(nextCategories)); setProducts(nextProducts);
      localStorage.setItem('custom_products_db', JSON.stringify(nextProducts));
      await persistCatalogOptions(nextCategories, brands);
    } catch (error) { console.error(error); alert('Could not rename category.'); }
  };

  const handleDeleteCategory = async (name) => {
    if (products.some(p => p.category === name)) return alert('This category is used by existing products. Reassign those products before deleting it.');
    if (!window.confirm(`Delete category "${name}"?`)) return;
    const next = categories.filter(value => value !== name);
    setCategories(next); localStorage.setItem('custom_categories_list', JSON.stringify(next));
    try { await persistCatalogOptions(next, brands); } catch (error) { console.error(error); alert('Could not save category changes.'); }
  };

  const handleRenameBrand = async (oldName) => {
    const nextName = window.prompt('Edit brand name', oldName)?.trim();
    if (!nextName || nextName === oldName) return;
    if (brands.some(value => value.toLowerCase() === nextName.toLowerCase())) return alert('Brand already exists.');
    try {
      const batch = writeBatch(db);
      products.filter(p => p.brand === oldName).forEach(p => batch.set(doc(db, 'products', String(p.id)), { brand: nextName }, { merge: true }));
      await batch.commit();
      const nextBrands = brands.map(value => value === oldName ? nextName : value);
      const nextProducts = products.map(p => p.brand === oldName ? { ...p, brand: nextName } : p);
      setBrands(nextBrands); localStorage.setItem('custom_brands_list', JSON.stringify(nextBrands)); setProducts(nextProducts);
      localStorage.setItem('custom_products_db', JSON.stringify(nextProducts));
      await persistCatalogOptions(categories, nextBrands);
    } catch (error) { console.error(error); alert('Could not rename brand.'); }
  };

  const handleDeleteBrand = async (name) => {
    if (products.some(p => p.brand === name)) return alert('This brand is used by existing products. Reassign those products before deleting it.');
    if (!window.confirm(`Delete brand "${name}"?`)) return;
    const next = brands.filter(value => value !== name);
    setBrands(next); localStorage.setItem('custom_brands_list', JSON.stringify(next));
    try { await persistCatalogOptions(categories, next); } catch (error) { console.error(error); alert('Could not save brand changes.'); }
  };

  const editLegalArrayItem = (key, index, fields) => {
    const current = legalAdminForm[key] || [];
    const old = current[index] || {};
    const updated = { ...old };
    for (const [field, label] of fields) {
      const value = window.prompt(`Edit ${label}`, old[field] ?? '');
      if (value === null) return;
      updated[field] = value;
    }
    setLegalAdminForm(prev => ({ ...prev, [key]: prev[key].map((item, i) => i === index ? updated : item) }));
  };

  const addLegalArrayItem = (key, fields) => {
    const item = {};
    for (const [field, label] of fields) {
      const value = window.prompt(`Enter ${label}`);
      if (value === null) return;
      item[field] = value;
    }
    item.id = `custom_${Date.now()}`;
    setLegalAdminForm(prev => ({ ...prev, [key]: [...(prev[key] || []), item] }));
  };

  const deleteLegalArrayItem = (key, index) => {
    if (!window.confirm('Delete this item from the Legal & Business page?')) return;
    setLegalAdminForm(prev => ({ ...prev, [key]: prev[key].filter((_, i) => i !== index) }));
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === 'MANPOWER' && password === 'ARUNMAHI') {
      setIsLoggedIn(true);
      localStorage.setItem('growth_os_admin_session', 'active');
    } else {
      alert('❌ Invalid Username or Password!');
    }
  };

  const handleBiometricUnlock = async () => {
    if (!Capacitor.isNativePlatform()) {
      setIsBiometricPrompt(false);
      alert('Biometric login is available in the installed Android app. Please use Username & Password in browser.');
      localStorage.removeItem('growth_os_admin_session');
      return;
    }
    try {
      const availability = await BiometricAuth.isAvailable();
      if (!availability?.available) {
        setIsBiometricPrompt(false);
        localStorage.removeItem('growth_os_admin_session');
        alert(availability?.message || 'Fingerprint or device screen lock is not available. Please use Username & Password.');
        return;
      }
      const result = await BiometricAuth.authenticate();
      if (result?.verified === true) {
        setIsLoggedIn(true);
        setIsBiometricPrompt(false);
      } else {
        alert('Verification was not completed. Try again or use Username & Password.');
      }
    } catch (error) {
      // Do not let a cancelled native prompt close the application or crash the WebView.
      console.warn('Native biometric verification cancelled/failed:', error);
      setIsBiometricPrompt(false);
      localStorage.removeItem('growth_os_admin_session');
      alert('Fingerprint / device PIN was cancelled or failed. Please login using Username & Password.');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setIsBiometricPrompt(false);
    localStorage.removeItem('growth_os_admin_session');
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newProd.name.trim() || !newProd.code.trim() || !newProd.mrpPrice || !newProd.dpPrice) {
      alert('⚠️ Please fill out all required product details!');
      return;
    }
    const productId = 'prod_' + Date.now();
    const item = {
      id: productId,
      name: newProd.name.trim().toUpperCase(),
      code: newProd.code.trim().toUpperCase(),
      category: newProd.category,
      brand: newProd.brand,
      mrpPrice: parseFloat(newProd.mrpPrice),
      dpPrice: parseFloat(newProd.dpPrice),
      imageUrl: newProd.imageUrl.trim(),
      description: newProd.description.trim()
    };
    try {
      await setDoc(doc(db, "products", productId), item);
      const updatedList = [...products, item];
      setProducts(updatedList);
      localStorage.setItem('custom_products_db', JSON.stringify(updatedList));
      setNewProd({ name: '', code: '', category: categories[0], brand: brands[0], mrpPrice: '', dpPrice: '', imageUrl: '', description: '' });
      alert('✅ New Product Published Successfully!');
    } catch (err) {
      console.error(err);
      alert('❌ Error saving product to cloud.');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteDoc(doc(db, "products", id.toString()));
        const deletedIds = JSON.parse(localStorage.getItem('deleted_product_ids') || '[]');
        if (!deletedIds.includes(id.toString())) {
          deletedIds.push(id.toString());
          localStorage.setItem('deleted_product_ids', JSON.stringify(deletedIds));
        }
        const updatedList = products.filter(p => p.id.toString() !== id.toString());
        setProducts(updatedList);
        localStorage.setItem('custom_products_db', JSON.stringify(updatedList));
        alert('🗑️ Product deleted successfully!');
      } catch (err) {
        console.error(err);
        alert('❌ Error deleting product.');
      }
    }
  };

  const handleStartEdit = (prod) => {
    setEditingId(prod.id);
    setEditForm({ 
      name: prod.name || '', code: prod.code || '', category: prod.category || categories[0], brand: prod.brand || brands[0], mrpPrice: prod.mrpPrice || '', dpPrice: prod.dpPrice || '', imageUrl: prod.imageUrl || '', description: prod.description || '' 
    });
  };

  const handleSaveEdit = async (id) => {
    try {
      const updatedData = {
        id: id,
        name: editForm.name.trim().toUpperCase(),
        code: editForm.code.trim().toUpperCase(),
        category: editForm.category,
        brand: editForm.brand,
        mrpPrice: parseFloat(editForm.mrpPrice || 0),
        dpPrice: parseFloat(editForm.dpPrice || 0),
        imageUrl: editForm.imageUrl.trim(),
        description: editForm.description.trim()
      };
      await setDoc(doc(db, "products", id.toString()), updatedData, { merge: true });
      const updatedList = products.map(p => p.id.toString() === id.toString() ? updatedData : p);
      setProducts(updatedList);
      localStorage.setItem('custom_products_db', JSON.stringify(updatedList));
      setEditingId(null);
      alert('✅ Product Updated Successfully!');
    } catch (err) {
      console.error(err);
      alert('❌ Failed to update product.');
    }
  };

  const handleSendCustomNotification = async (e) => {
    e.preventDefault();
    if (!customNotify.title.trim() || !customNotify.message.trim()) {
      alert('⚠️ Please enter both Notification Title and Message!');
      return;
    }
    try {
      await addDoc(collection(db, "notifications"), {
        title: customNotify.title.trim(),
        message: customNotify.message.trim(),
        scheduledTime: customNotify.scheduledTime || null,
        createdAt: new Date().toISOString()
      });

      await sendCustomAdminNotification(
        customNotify.title.trim(), 
        customNotify.message.trim(), 
        customNotify.scheduledTime ? new Date(customNotify.scheduledTime) : null
      );
      
      alert(customNotify.scheduledTime ? '⏰ Notification Scheduled Successfully!' : '🚀 Custom Realtime Notification Sent Successfully!');
      setCustomNotify({ title: '', message: '', scheduledTime: '' });
    } catch (err) {
      console.error(err);
      alert('❌ Failed to send custom notification.');
    }
  };

  const handleAddCertificate = () => {
    if (!newCert.title.trim() || !newCert.imageUrl.trim()) {
      alert('⚠️ Please enter both Certificate Title and Image URL!');
      return;
    }
    const updatedCertificates = [
      ...legalAdminForm.certificates,
      { id: 'cert_' + Date.now(), title: newCert.title.trim(), imageUrl: newCert.imageUrl.trim() }
    ];
    setLegalAdminForm({ ...legalAdminForm, certificates: updatedCertificates });
    setNewCert({ title: '', imageUrl: '' });
  };

  const handleEditCertificate = (cert) => {
    const title = window.prompt('Edit certificate title', cert.title);
    if (title === null) return;
    const imageUrl = window.prompt('Edit certificate image URL', cert.imageUrl);
    if (imageUrl === null) return;
    setLegalAdminForm(prev => ({ ...prev, certificates: prev.certificates.map(item => item.id === cert.id ? { ...item, title: title.trim(), imageUrl: imageUrl.trim() } : item) }));
  };

  const handleDeleteCertificate = (id) => {
    if (!window.confirm('Delete this certificate?')) return;
    const updatedCertificates = legalAdminForm.certificates.filter(c => c.id !== id);
    setLegalAdminForm({ ...legalAdminForm, certificates: updatedCertificates });
  };

  const handleSaveLegalInfo = async (e) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, "settings", "legal_info"), legalAdminForm, { merge: true });
      alert('✅ Legal & Certificates Info Updated Successfully!');
    } catch (err) {
      console.error(err);
      alert('❌ Failed to update legal info.');
    }
  };

  const handleAddBopVenue = async (e) => {
    e.preventDefault();
    if (!newBop.venue.trim() || !newBop.city.trim() || !newBop.time.trim()) {
      alert('⚠️ Please fill out Meeting Venue, City, and Time!');
      return;
    }
    const updatedVenues = [
      ...bopVenues,
      { id: 'bop_' + Date.now(), sNo: String(bopVenues.length + 1), ...newBop }
    ];
    setBopVenues(updatedVenues);
    setNewBop({ venue: '', city: '', state: 'TAMIL NADU', weekdays: 'SUNDAY', time: '' });
    try {
      await setDoc(doc(db, "settings", "bop_venues"), { venues: updatedVenues }, { merge: true });
      alert('✅ BOP Venue Added & Saved Successfully!');
    } catch (err) {
      alert('❌ Failed to save BOP venue.');
    }
  };

  const handleDeleteBopVenue = async (id) => {
    if (window.confirm('Are you sure you want to delete this venue?')) {
      const updatedVenues = bopVenues.filter(v => v.id !== id).map((v, idx) => ({ ...v, sNo: String(idx + 1) }));
      setBopVenues(updatedVenues);
      try {
        await setDoc(doc(db, "settings", "bop_venues"), { venues: updatedVenues }, { merge: true });
        alert('🗑️ Venue deleted successfully!');
      } catch (err) {
        alert('❌ Failed to delete venue.');
      }
    }
  };

  const handleStartEditBop = (v) => {
    setEditingBopId(v.id);
    setEditBopForm({ sNo: v.sNo, venue: v.venue, city: v.city, state: v.state, weekdays: v.weekdays, time: v.time });
  };

  const handleSaveEditBop = async (id) => {
    const updatedVenues = bopVenues.map(v => v.id === id ? { id, ...editBopForm } : v);
    setBopVenues(updatedVenues);
    setEditingBopId(null);
    try {
      await setDoc(doc(db, "settings", "bop_venues"), { venues: updatedVenues }, { merge: true });
      alert('✅ BOP Venue Updated Successfully!');
    } catch (err) {
      alert('❌ Failed to update venue.');
    }
  };

  const renderLegalArrayEditor = (key, title, fields) => (
    <section style={{ border: '1px solid #475569', borderRadius: '10px', padding: '12px', background: '#0f172a' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <strong style={{ color: '#7dd3fc', fontSize: '13px' }}>{title} ({(legalAdminForm[key] || []).length})</strong>
        <button type="button" onClick={() => addLegalArrayItem(key, fields)} style={{ border: 0, borderRadius: '7px', padding: '7px 10px', background: '#0284c7', color: 'white', fontWeight: 700 }}>+ Add</button>
      </div>
      <div style={{ display: 'grid', gap: '7px' }}>
        {(legalAdminForm[key] || []).map((item, index) => (
          <div key={item.id || index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', padding: '9px', borderRadius: '7px', background: '#1e293b' }}>
            <div style={{ minWidth: 0 }}>
              <strong style={{ display: 'block', fontSize: '12px', overflowWrap: 'anywhere' }}>{item[fields[0][0]] || `Item ${index + 1}`}</strong>
              <span style={{ display: 'block', fontSize: '10px', color: '#94a3b8', overflowWrap: 'anywhere' }}>{item[fields[1][0]] || ''}</span>
            </div>
            <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
              <button type="button" onClick={() => editLegalArrayItem(key, index, fields)} style={{ border: 0, borderRadius: '6px', padding: '6px 8px', background: '#1d4ed8', color: 'white' }}>Edit</button>
              <button type="button" onClick={() => deleteLegalArrayItem(key, index)} style={{ border: 0, borderRadius: '6px', padding: '6px 8px', background: '#7f1d1d', color: 'white' }}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );

  const filteredAdminProducts = products.filter(prod => 
    (prod.name || '').toLowerCase().includes(productSearch.toLowerCase()) ||
    (prod.code || '').toLowerCase().includes(productSearch.toLowerCase())
  );

  if (isBiometricPrompt) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '20px', fontFamily: 'sans-serif' }}>
        <div style={{ backgroundColor: '#1e293b', padding: '35px', borderRadius: '16px', border: '1px solid #334155', textAlign: 'center', maxWidth: '380px', width: '100%', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ fontSize: '42px' }}>🔒</div>
          <div>
            <h2 style={{ margin: '0 0 6px 0', color: 'white', fontSize: '20px' }}>Admin Quick Unlock</h2>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px' }}>Verify device lock / fingerprint to enter Admin Hub</p>
          </div>
          <button onClick={handleBiometricUnlock} style={{ padding: '12px', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>
            👆 Unlock with Fingerprint / PIN
          </button>
          <button onClick={() => { setIsBiometricPrompt(false); localStorage.removeItem('growth_os_admin_session'); }} style={{ background: 'transparent', border: 'none', color: '#f87171', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>
            Use Username & Password Instead
          </button>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', padding: '30px 20px', fontFamily: 'sans-serif', boxSizing: 'border-box' }}>
        <div />
        <form onSubmit={handleLogin} style={{ backgroundColor: '#1e293b', padding: '35px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', width: '100%', maxWidth: '400px', border: '1px solid #334155' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h2 style={{ margin: 0, color: 'white', fontSize: '22px' }}>🔐 Admin Login</h2>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '6px' }}>Growth OS Secure Control Center</p>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: '#cbd5e1', fontSize: '13px', marginBottom: '6px', fontWeight: 'bold' }}>Username</label>
            <input type="text" placeholder="Enter Username" value={username} onChange={(e) => setUsername(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #475569', background: '#0f172a', color: 'white', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', color: '#cbd5e1', fontSize: '13px', marginBottom: '6px', fontWeight: 'bold' }}>Password</label>
            <input type="password" placeholder="Enter Password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #475569', background: '#0f172a', color: 'white', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="button" onClick={() => navigate('/')} style={{ flex: 1, padding: '12px', backgroundColor: '#334155', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>⬅ Back</button>
            <button type="submit" style={{ flex: 1, padding: '12px', backgroundColor: '#7e22ce', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Login</button>
          </div>
        </form>

        <div style={{ backgroundColor: '#1e293b', padding: '20px 25px', borderRadius: '14px', border: '1px solid #334155', width: '100%', maxWidth: '650px', textAlign: 'center', marginTop: '30px' }}>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#38bdf8' }}>About Growth OS</h3>
          <p style={{ margin: 0, fontSize: '11px', color: '#cbd5e1' }}>Growth OS is a comprehensive business management platform built to simplify and organize daily business operations. Designed especially for Network Marketing Leaders, the Platforms combines essential tools into a single, easy-to-use system.</p>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#38bdf8' }}>About Me</h3>
          <p style={{ margin: 0, fontSize: '11px', color: '#cbd5e1' }}>Hi, I'm <strong style={{ color: 'white' }}>Gokulnathan.A, M.Sc(C.S)</strong>. Network Marketing Professional, Entrepreneur and computer science postgraduate. Passionate about building technology that simplifies business operations.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: 'white', padding: '24px', fontFamily: 'sans-serif', boxSizing: 'border-box', maxWidth: '1400px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '1px solid #334155', paddingBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button onClick={() => navigate('/')} style={{ padding: '10px 16px', backgroundColor: '#334155', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>⬅ Back to Dashboard</button>
          <h2 style={{ margin: 0, fontSize: '20px', color: '#38bdf8' }}>⚡ Admin Management Hub</h2>
        </div>
        <button onClick={handleLogout} style={{ padding: '10px 16px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>Logout 🚪</button>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '30px', flexWrap: 'wrap' }}>
        <button onClick={() => setAdminTab('products')} style={{ padding: '12px 20px', backgroundColor: adminTab === 'products' ? '#7e22ce' : '#1e293b', color: 'white', border: '1px solid #334155', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>📦 Products</button>
        <button onClick={() => setAdminTab('legal')} style={{ padding: '12px 20px', backgroundColor: adminTab === 'legal' ? '#7e22ce' : '#1e293b', color: 'white', border: '1px solid #334155', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>⚖️ Legal & Certificates</button>
        <button onClick={() => setAdminTab('bop')} style={{ padding: '12px 20px', backgroundColor: adminTab === 'bop' ? '#7e22ce' : '#1e293b', color: 'white', border: '1px solid #334155', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>📍 BOP Venues Manager</button>
        <button onClick={() => setAdminTab('broadcast')} style={{ padding: '12px 20px', backgroundColor: adminTab === 'broadcast' ? '#7e22ce' : '#1e293b', color: 'white', border: '1px solid #334155', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>🔔 Broadcast</button>
      </div>

      {adminTab === 'products' && (
        <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 900 ? '1fr' : '380px 1fr', gap: '24px' }}>
          <div style={{ backgroundColor: '#1e293b', padding: '24px', borderRadius: '14px', border: '1px solid #334155', height: 'fit-content', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Quick Add Custom Category & Brand Builders */}
            <div style={{ backgroundColor: '#0f172a', padding: '14px', borderRadius: '10px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '12px', color: '#f59e0b', fontWeight: 'bold' }}>🛠️ Create New Category / Brand</div>
              
              <div style={{ display: 'flex', gap: '6px' }}>
                <input 
                  type="text" 
                  placeholder="New Category Name" 
                  value={newCategoryInput} 
                  onChange={(e) => setNewCategoryInput(e.target.value)} 
                  style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #475569', background: '#1e293b', color: 'white', fontSize: '12px', outline: 'none' }} 
                />
                <button type="button" onClick={handleAddCategory} style={{ padding: '8px 12px', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>+ Add Cat</button>
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                <input 
                  type="text" 
                  placeholder="New Brand Name" 
                  value={newBrandInput} 
                  onChange={(e) => setNewBrandInput(e.target.value)} 
                  style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #475569', background: '#1e293b', color: 'white', fontSize: '12px', outline: 'none' }} 
                />
                <button type="button" onClick={handleAddBrand} style={{ padding: '8px 12px', backgroundColor: '#7e22ce', color: 'white', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>+ Add Brand</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <strong style={{ display: 'block', color: '#7dd3fc', fontSize: '11px', marginBottom: '6px' }}>CATEGORIES ({categories.length})</strong>
                  {categories.map(name => <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px', padding: '5px 0', borderBottom: '1px solid #334155', fontSize: '11px' }}><span>{name}</span><span style={{ display: 'flex', gap: '3px' }}><button type="button" onClick={() => handleRenameCategory(name)} title="Edit category" style={{ border: 0, borderRadius: '4px', padding: '4px 6px', background: '#1d4ed8', color: 'white' }}>✎</button><button type="button" onClick={() => handleDeleteCategory(name)} title="Delete category" style={{ border: 0, borderRadius: '4px', padding: '4px 6px', background: '#7f1d1d', color: 'white' }}>×</button></span></div>)}
                </div>
                <div>
                  <strong style={{ display: 'block', color: '#c4b5fd', fontSize: '11px', marginBottom: '6px' }}>BRANDS ({brands.length})</strong>
                  {brands.map(name => <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px', padding: '5px 0', borderBottom: '1px solid #334155', fontSize: '11px' }}><span>{name}</span><span style={{ display: 'flex', gap: '3px' }}><button type="button" onClick={() => handleRenameBrand(name)} title="Edit brand" style={{ border: 0, borderRadius: '4px', padding: '4px 6px', background: '#1d4ed8', color: 'white' }}>✎</button><button type="button" onClick={() => handleDeleteBrand(name)} title="Delete brand" style={{ border: 0, borderRadius: '4px', padding: '4px 6px', background: '#7f1d1d', color: 'white' }}>×</button></span></div>)}
                </div>
              </div>
            </div>

            <div>
              <h3 style={{ margin: '0 0 14px 0', fontSize: '16px', color: '#38bdf8' }}>🚀 Add New Product</h3>
              <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <input type="text" placeholder="Product Name *" value={newProd.name} onChange={(e) => setNewProd({...newProd, name: e.target.value})} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #475569', background: '#0f172a', color: 'white', outline: 'none', boxSizing: 'border-box' }} />
                <input type="text" placeholder="Product Code *" value={newProd.code} onChange={(e) => setNewProd({...newProd, code: e.target.value})} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #475569', background: '#0f172a', color: 'white', outline: 'none', boxSizing: 'border-box' }} />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <select value={newProd.category} onChange={(e) => setNewProd({...newProd, category: e.target.value})} style={{ flex: 1, padding: '11px', borderRadius: '8px', border: '1px solid #475569', background: '#0f172a', color: 'white', outline: 'none' }}>
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                  <select value={newProd.brand} onChange={(e) => setNewProd({...newProd, brand: e.target.value})} style={{ flex: 1, padding: '11px', borderRadius: '8px', border: '1px solid #475569', background: '#0f172a', color: 'white', outline: 'none' }}>
                    {brands.map(brand => <option key={brand} value={brand}>{brand}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="number" placeholder="MRP Price *" value={newProd.mrpPrice} onChange={(e) => setNewProd({...newProd, mrpPrice: e.target.value})} style={{ flex: 1, padding: '11px', borderRadius: '8px', border: '1px solid #475569', background: '#0f172a', color: 'white', outline: 'none', boxSizing: 'border-box' }} />
                  <input type="number" placeholder="DP Price *" value={newProd.dpPrice} onChange={(e) => setNewProd({...newProd, dpPrice: e.target.value})} style={{ flex: 1, padding: '11px', borderRadius: '8px', border: '1px solid #475569', background: '#0f172a', color: 'white', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <input type="url" placeholder="Image URL" value={newProd.imageUrl} onChange={(e) => setNewProd({...newProd, imageUrl: e.target.value})} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #475569', background: '#0f172a', color: 'white', outline: 'none', boxSizing: 'border-box' }} />
                <textarea placeholder="Description" value={newProd.description} onChange={(e) => setNewProd({...newProd, description: e.target.value})} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #475569', background: '#0f172a', color: 'white', outline: 'none', minHeight: '60px', boxSizing: 'border-box' }} />
                <button type="submit" style={{ padding: '12px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>+ Save Product</button>
              </form>
            </div>
          </div>

          <div style={{ backgroundColor: '#1e293b', padding: '24px', borderRadius: '14px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', color: '#38bdf8' }}>📦 Manage Active Products ({filteredAdminProducts.length})</h3>
            <input type="text" placeholder="🔍 Search products..." value={productSearch} onChange={(e) => setProductSearch(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #475569', background: '#0f172a', color: 'white', outline: 'none', boxSizing: 'border-box' }} />
            <div style={{ maxHeight: '550px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredAdminProducts.map(prod => (
                <div key={prod.id} style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '16px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '10px' }}>
                  {editingId === prod.id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ fontSize: '13px', color: '#f59e0b', fontWeight: 'bold' }}>✏️ Edit Product Details</div>
                      
                      <input type="text" placeholder="Product Name" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} style={{ padding: '9px', borderRadius: '6px', border: '1px solid #475569', background: '#1e293b', color: 'white', outline: 'none' }} />
                      
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input type="text" placeholder="Product Code" value={editForm.code} onChange={(e) => setEditForm({...editForm, code: e.target.value})} style={{ flex: 1, padding: '9px', borderRadius: '6px', border: '1px solid #475569', background: '#1e293b', color: 'white', outline: 'none' }} />
                        <select value={editForm.category} onChange={(e) => setEditForm({...editForm, category: e.target.value})} style={{ flex: 1, padding: '9px', borderRadius: '6px', border: '1px solid #475569', background: '#1e293b', color: 'white', outline: 'none' }}>
                          {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <select value={editForm.brand} onChange={(e) => setEditForm({...editForm, brand: e.target.value})} style={{ flex: 1, padding: '9px', borderRadius: '6px', border: '1px solid #475569', background: '#1e293b', color: 'white', outline: 'none' }}>
                          {brands.map(brand => <option key={brand} value={brand}>{brand}</option>)}
                        </select>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input type="number" placeholder="MRP Price" value={editForm.mrpPrice} onChange={(e) => setEditForm({...editForm, mrpPrice: e.target.value})} style={{ flex: 1, padding: '9px', borderRadius: '6px', border: '1px solid #475569', background: '#1e293b', color: 'white', outline: 'none' }} />
                        <input type="number" placeholder="DP Price" value={editForm.dpPrice} onChange={(e) => setEditForm({...editForm, dpPrice: e.target.value})} style={{ flex: 1, padding: '9px', borderRadius: '6px', border: '1px solid #475569', background: '#1e293b', color: 'white', outline: 'none' }} />
                      </div>

                      <input type="url" placeholder="Image URL" value={editForm.imageUrl} onChange={(e) => setEditForm({...editForm, imageUrl: e.target.value})} style={{ padding: '9px', borderRadius: '6px', border: '1px solid #475569', background: '#1e293b', color: 'white', outline: 'none' }} />
                      
                      <textarea placeholder="Description" value={editForm.description} onChange={(e) => setEditForm({...editForm, description: e.target.value})} style={{ padding: '9px', borderRadius: '6px', border: '1px solid #475569', background: '#1e293b', color: 'white', outline: 'none', minHeight: '50px' }} />

                      <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                        <button onClick={() => handleSaveEdit(prod.id)} style={{ flex: 1, padding: '10px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>💾 Save Changes</button>
                        <button onClick={() => setEditingId(null)} style={{ flex: 1, padding: '10px', backgroundColor: '#475569', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'white' }}>{prod.name}</div>
                        <div style={{ fontSize: '12px', color: '#38bdf8', marginTop: '4px' }}>{prod.category} • {prod.brand} • Code: {prod.code} | MRP: ₹{prod.mrpPrice} | DP: ₹{prod.dpPrice}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleStartEdit(prod)} style={{ padding: '6px 10px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>✏️ Edit</button>
                        <button onClick={() => handleDeleteProduct(prod.id)} style={{ padding: '6px 10px', backgroundColor: '#7f1d1d', color: '#fca5a5', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>🗑️ Delete</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {adminTab === 'legal' && (
        <div style={{ backgroundColor: '#1e293b', padding: '24px', borderRadius: '14px', border: '1px solid #334155', maxWidth: '750px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', color: '#38bdf8' }}>📜 Manage Company Legal & Certificates</h3>
          <form onSubmit={handleSaveLegalInfo} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <input type="text" value={legalAdminForm.title} onChange={(e) => setLegalAdminForm({...legalAdminForm, title: e.target.value})} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #475569', background: '#0f172a', color: 'white', outline: 'none', boxSizing: 'border-box' }} />
            <textarea value={legalAdminForm.description} onChange={(e) => setLegalAdminForm({...legalAdminForm, description: e.target.value})} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #475569', background: '#0f172a', color: 'white', outline: 'none', minHeight: '80px', boxSizing: 'border-box' }} />
            
            <div style={{ borderTop: '1px dashed #475569', paddingTop: '15px' }}>
              <label style={{ fontSize: '13px', color: '#38bdf8', display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>➕ Add Certificate</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: '#0f172a', padding: '15px', borderRadius: '10px', border: '1px solid #334155' }}>
                <input type="text" placeholder="Certificate Title" value={newCert.title} onChange={(e) => setNewCert({...newCert, title: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #475569', background: '#1e293b', color: 'white', outline: 'none', boxSizing: 'border-box' }} />
                <input type="url" placeholder="Direct Image URL" value={newCert.imageUrl} onChange={(e) => setNewCert({...newCert, imageUrl: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #475569', background: '#1e293b', color: 'white', outline: 'none', boxSizing: 'border-box' }} />
                <button type="button" onClick={handleAddCertificate} style={{ padding: '10px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>+ Add to List</button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
              {legalAdminForm.certificates.map((cert) => (
                <div key={cert.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', padding: '10px', borderRadius: '8px', border: '1px solid #334155' }}>
                  <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{cert.title}</span>
                  <span style={{ display: 'flex', gap: '6px' }}>
                  <button type="button" onClick={() => handleEditCertificate(cert)} style={{ background: '#1d4ed8', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Edit</button>
                  <button type="button" onClick={() => handleDeleteCertificate(cert.id)} style={{ background: '#7f1d1d', color: '#fca5a5', border: 'none', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Delete</button>
                  </span>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px dashed #475569', paddingTop: '15px', display: 'grid', gap: '12px' }}>
              <h4 style={{ margin: 0, color: '#f59e0b' }}>Customize all Legal & Business page content</h4>
              {renderLegalArrayEditor('keyReasonsTamil', 'Key Reasons', [['title','Title'],['desc','Description']])}
              {renderLegalArrayEditor('incomeOpportunities', 'Income Opportunities', [['title','Title'],['desc','Description'],['no','Number']])}
              {renderLegalArrayEditor('promotionalSupport', 'Promotional Support', [['code','Code'],['desc','Description']])}
              {renderLegalArrayEditor('rankTableData', 'Rank Eligibility Table', [['rank','Rank'],['mbv','Matched GBV'],['no','Serial Number']])}
            </div>

            <button type="submit" style={{ padding: '12px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>💾 Save All Legal & Business Changes</button>
          </form>
        </div>
      )}

      {adminTab === 'broadcast' && (
        <div style={{ backgroundColor: '#1e293b', padding: '24px', borderRadius: '14px', border: '1px solid #334155', maxWidth: '720px', margin: '0 auto' }}>
          <h3 style={{ margin: '0 0 16px', color: '#f59e0b' }}>🔔 Send Custom Broadcast Notification</h3>
          <form onSubmit={handleSendCustomNotification} style={{ display: 'grid', gap: '12px' }}>
            <input type="text" placeholder="Notification title" value={customNotify.title} onChange={e => setCustomNotify({ ...customNotify, title: e.target.value })} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #475569', background: '#0f172a', color: 'white' }} />
            <textarea placeholder="Notification message" value={customNotify.message} onChange={e => setCustomNotify({ ...customNotify, message: e.target.value })} style={{ minHeight: '120px', padding: '12px', borderRadius: '8px', border: '1px solid #475569', background: '#0f172a', color: 'white' }} />
            <label style={{ color: '#7dd3fc', fontSize: '12px' }}>Schedule (optional; leave empty to send now)</label>
            <input type="datetime-local" value={customNotify.scheduledTime} onChange={e => setCustomNotify({ ...customNotify, scheduledTime: e.target.value })} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #475569', background: '#0f172a', color: 'white' }} />
            <button type="submit" style={{ padding: '13px', border: 0, borderRadius: '8px', background: '#d97706', color: 'white', fontWeight: 700 }}>Send / Schedule Notification</button>
          </form>
        </div>
      )}

      {adminTab === 'bop' && (
        <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 900 ? '1fr' : '380px 1fr', gap: '24px' }}>
          
          <div style={{ backgroundColor: '#1e293b', padding: '24px', borderRadius: '14px', border: '1px solid #334155', height: 'fit-content' }}>
            <h3 style={{ margin: '0 0 18px 0', fontSize: '16px', color: '#38bdf8' }}>📍 Add BOP Meeting Venue</h3>
            <form onSubmit={handleAddBopVenue} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <input type="text" placeholder="Meeting Venue" value={newBop.venue} onChange={(e) => setNewBop({...newBop, venue: e.target.value})} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #475569', background: '#0f172a', color: 'white', outline: 'none', boxSizing: 'border-box' }} />
              <input type="text" placeholder="City" value={newBop.city} onChange={(e) => setNewBop({...newBop, city: e.target.value})} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #475569', background: '#0f172a', color: 'white', outline: 'none', boxSizing: 'border-box' }} />
              <input type="text" placeholder="State" value={newBop.state} onChange={(e) => setNewBop({...newBop, state: e.target.value})} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #475569', background: '#0f172a', color: 'white', outline: 'none', boxSizing: 'border-box' }} />
              <input type="text" placeholder="Weekday" value={newBop.weekdays} onChange={(e) => setNewBop({...newBop, weekdays: e.target.value})} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #475569', background: '#0f172a', color: 'white', outline: 'none', boxSizing: 'border-box' }} />
              <input type="text" placeholder="Time" value={newBop.time} onChange={(e) => setNewBop({...newBop, time: e.target.value})} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #475569', background: '#0f172a', color: 'white', outline: 'none', boxSizing: 'border-box' }} />
              <button type="submit" style={{ padding: '12px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>+ Add Venue to Table</button>
            </form>
          </div>

          <div style={{ backgroundColor: '#1e293b', padding: '24px', borderRadius: '14px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', color: '#38bdf8' }}>📋 Manage BOP Venues ({bopVenues.length})</h3>
            <div style={{ maxHeight: '550px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {bopVenues.map((v) => (
                <div key={v.id} style={{ backgroundColor: '#0f172a', padding: '14px', borderRadius: '10px', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '11px', background: '#334155', color: '#38bdf8', padding: '2px 6px', borderRadius: '4px', marginRight: '8px' }}>#{v.sNo}</span>
                    <strong style={{ fontSize: '14px', color: 'white' }}>{v.venue}</strong> ({v.city}, {v.state})
                    <div style={{ fontSize: '12px', color: '#f59e0b', marginTop: '2px' }}>📅 {v.weekdays} @ {v.time}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {editingBopId !== v.id && <button onClick={() => handleStartEditBop(v)} style={{ padding: '6px 10px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>✏️ Edit</button>}
                    <button onClick={() => handleDeleteBopVenue(v.id)} style={{ padding: '6px 10px', backgroundColor: '#7f1d1d', color: '#fca5a5', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>🗑️ Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}