import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { PRODUCTS_DATABASE as INITIAL_PRODUCTS } from '../data/products';

function numberToWords(num) {
  if (isNaN(num) || num === 0) return 'Zero Rupees only';
  
  const a = ['','one ','two ','three ','four ', 'five ','six ','seven ','eight ','nine ','ten ','eleven ','twelve ','thirteen ','fourteen ','fifteen ','sixteen ','seventeen ','eighteen ','nineteen '];
  const b = ['', '', 'twenty','thirty','forty','fifty', 'sixty','seventy','eighty','ninety'];

  function inWords(n) {
    if ((n = n.toString()).length > 9) return 'overflow';
    let narray = ('000000000' + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!narray) return;
    let str = '';
    str += (narray[1] != 0) ? (a[Number(narray[1])] || b[narray[1][0]] + ' ' + a[narray[1][1]]) + 'crore ' : '';
    str += (narray[2] != 0) ? (a[Number(narray[2])] || b[narray[2][0]] + ' ' + a[narray[2][1]]) + 'lakh ' : '';
    str += (narray[3] != 0) ? (a[Number(narray[3])] || b[narray[3][0]] + ' ' + a[narray[3][1]]) + 'thousand ' : '';
    str += (narray[4] != 0) ? (a[Number(narray[4])] || b[narray[4][0]] + ' ' + a[narray[4][1]]) + 'hundred ' : '';
    str += (narray[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(narray[5])] || b[narray[5][0]] + ' ' + a[narray[5][1]]) : '';
    return str.trim();
  }

  const capitalized = inWords(Math.floor(num));
  return capitalized ? capitalized.charAt(0).toUpperCase() + capitalized.slice(1) + ' Rupees only' : '';
}

export default function Billing() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState({});

  const [productsDb, setProductsDb] = useState(() => {
    const saved = localStorage.getItem('custom_products_db');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return INITIAL_PRODUCTS; }
    }
    return INITIAL_PRODUCTS;
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "products"), (snapshot) => {
      const cloudProducts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const deletedIds = JSON.parse(localStorage.getItem('deleted_product_ids') || '[]');

      const mergedMap = new Map();
      INITIAL_PRODUCTS.forEach(p => {
        if (!deletedIds.includes(p.id.toString())) {
          mergedMap.set(p.id.toString(), p);
        }
      });
      cloudProducts.forEach(p => {
        if (!deletedIds.includes(p.id.toString())) {
          mergedMap.set(p.id.toString(), { ...(mergedMap.get(p.id.toString()) || {}), ...p });
        }
      });
      
      const finalProductsList = Array.from(mergedMap.values());
      setProductsDb(finalProductsList);
      localStorage.setItem('custom_products_db', JSON.stringify(finalProductsList));
    }, (error) => {
      console.log("Offline mode: Using cached products", error);
    });

    return () => unsubscribe();
  }, []);

  const [billerName, setBillerName] = useState('');
  const [billerPhone, setBillerPhone] = useState('');
  
  const [billDate, setBillDate] = useState(() => new Date().toLocaleDateString());
  const [billTime, setBillTime] = useState(() => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const [invoiceNo] = useState(() => `MIMAN${Math.floor(1000 + Math.random() * 9000)}`);

  const [receivedAmount, setReceivedAmount] = useState(0);
  const [extraDiscount, setExtraDiscount] = useState(0);

  const [activeTab, setActiveTab] = useState('search');

  // Filter products by search and sort Alphabetically (A to Z)
  const filteredProducts = useMemo(() => {
    return productsDb.filter(prod => 
      (prod.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (prod.code || '').toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [searchTerm, productsDb]);

  const updateCartItem = (id, qtyChange, newDisc = null) => {
    setCart(prev => {
      const current = prev[id] || { qty: 0, customDiscount: null };
      const updatedQty = current.qty + qtyChange;
      
      if (updatedQty <= 0) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }

      const prod = productsDb.find(p => p.id === id || p.id.toString() === id.toString());
      if (!prod) return prev;

      const mrp = parseFloat(prod.mrpPrice) || 0;
      const dp = parseFloat(prod.dpPrice) || 0;
      const defaultDisc = mrp - dp;
      const disc = newDisc !== null ? parseFloat(newDisc) || 0 : (current.customDiscount !== null ? current.customDiscount : defaultDisc);

      return {
        ...prev,
        [id]: { qty: updatedQty, customDiscount: disc }
      };
    });
  };

  const cartItems = useMemo(() => {
    return Object.entries(cart).map(([id, itemData]) => {
      const product = productsDb.find(p => p.id === id || p.id.toString() === id.toString() || p.id === parseInt(id));
      if (!product) return null;
      
      const mrp = parseFloat(product.mrpPrice) || 0;
      const dp = parseFloat(product.dpPrice) || 0;
      const defaultDisc = mrp - dp;
      const disc = itemData.customDiscount !== null ? itemData.customDiscount : defaultDisc;
      const finalPrice = Math.max(0, mrp - disc);

      return {
        ...product,
        mrpPrice: mrp,
        dpPrice: dp,
        qty: itemData.qty,
        discount: disc,
        finalPrice
      };
    }).filter(Boolean);
  }, [cart, productsDb]);

  const totals = useMemo(() => {
    return cartItems.reduce((acc, item) => {
      acc.mrp += item.mrpPrice * item.qty;
      acc.totalDisc += item.discount * item.qty;
      acc.netAmount += item.finalPrice * item.qty;
      acc.count += item.qty;
      return acc;
    }, { mrp: 0, totalDisc: 0, netAmount: 0, count: 0 });
  }, [cartItems]);

  const finalPayable = Math.max(0, totals.netAmount - (parseFloat(extraDiscount) || 0));
  const balanceDue = Math.max(0, finalPayable - (parseFloat(receivedAmount) || 0));
  const totalSavings = totals.totalDisc + (parseFloat(extraDiscount) || 0);

  // Perfectly Aligned PDF Generator
  const handleDownloadOrShareInvoicePDF = async () => {
    if (!billerName.trim()) {
      alert('⚠️ Mandatory field missing: Please enter Customer Name (Bill To)!');
      return;
    }
    if (cartItems.length === 0) {
      alert('⚠️ Add at least one item to invoice.');
      return;
    }

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      let y = 15;
      const pageWidth = 210;
      const margin = 15;

      // Brand Header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(126, 34, 206);
      doc.text("INDIASHOPPE", pageWidth / 2, y, { align: "center" });

      y += 6;
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(80, 80, 80);
      doc.text("TAX INVOICE", pageWidth / 2, y, { align: "center" });

      y += 6;
      doc.setLineWidth(0.4);
      doc.line(margin, y, pageWidth - margin, y);

      y += 8;
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text("Bill To:", margin, y);
      doc.text("Invoice Details:", 130, y);

      y += 5;
      doc.setFont("helvetica", "bold");
      doc.text(`${billerName.toUpperCase()}`, margin, y);
      doc.setFont("helvetica", "normal");
      doc.text(`Invoice No.: ${invoiceNo}`, 130, y);

      y += 5;
      if (billerPhone.trim()) {
        doc.text(`Phone: ${billerPhone}`, margin, y);
      }
      doc.text(`Date: ${billDate}`, 130, y);

      y += 5;
      doc.text(`Time: ${billTime}`, 130, y);

      y += 8;
      // Table Header Background
      doc.setFillColor(126, 34, 206);
      doc.rect(margin, y, 180, 8, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("#", 18, y + 5.5);
      doc.text("Item Name", 28, y + 5.5);
      doc.text("Qty", 100, y + 5.5, { align: "center" });
      doc.text("Unit", 118, y + 5.5, { align: "center" });
      doc.text("Price", 140, y + 5.5, { align: "right" });
      doc.text("Disc", 162, y + 5.5, { align: "right" });
      doc.text("Amount", 192, y + 5.5, { align: "right" });

      y += 10;
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);

      cartItems.forEach((item, idx) => {
        const itemNameLines = doc.splitTextToSize(item.name || '', 68);
        const lineHeight = 4.2;
        const rowHeight = Math.max(8, (itemNameLines.length * lineHeight) + 4);

        if (y + rowHeight > 265) {
          doc.addPage();
          y = 20;
        }

        const textVertCenter = y + (rowHeight / 2) + 1.2;

        doc.text(`${idx + 1}`, 18, textVertCenter);
        doc.text(itemNameLines, 28, y + 4.5);
        doc.text(String(item.qty), 100, textVertCenter, { align: "center" });
        doc.text("Pcs", 118, textVertCenter, { align: "center" });
        doc.text(`Rs.${item.mrpPrice.toFixed(2)}`, 140, textVertCenter, { align: "right" });
        doc.text(`Rs.${item.discount.toFixed(2)}`, 162, textVertCenter, { align: "right" });
        doc.setFont("helvetica", "bold");
        doc.text(`Rs.${(item.finalPrice * item.qty).toFixed(2)}`, 192, textVertCenter, { align: "right" });
        doc.setFont("helvetica", "normal");

        y += rowHeight;
        doc.setLineWidth(0.1);
        doc.setLineDash([1, 1], 0);
        doc.line(margin, y, pageWidth - margin, y);
        doc.setLineDash([], 0);
        y += 3;
      });

      y += 2;
      doc.setFont("helvetica", "bold");
      doc.text("Total", 18, y);
      doc.text(`${totals.count}`, 100, y, { align: "center" });
      doc.text(`Rs.${totals.netAmount.toFixed(2)}`, 192, y, { align: "right" });

      y += 6;
      doc.setLineWidth(0.4);
      doc.line(margin, y, pageWidth - margin, y);

      y += 8;
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(9);
      doc.setFont("helvetica", "italic");
      doc.text(`Amount in words: ${numberToWords(finalPayable)}`, margin, y);

      let summaryX = 135;
      let valX = 192;
      let sy = y - 4;

      doc.setFont("helvetica", "normal");
      doc.text("Sub Total:", summaryX, sy);
      doc.text(`Rs.${totals.mrp.toFixed(2)}`, valX, sy, { align: "right" });

      sy += 6;
      doc.text("Extra Disc:", summaryX, sy);
      doc.text(`Rs.${parseFloat(extraDiscount || 0).toFixed(2)}`, valX, sy, { align: "right" });

      sy += 6;
      doc.setFont("helvetica", "bold");
      doc.text("Total:", summaryX, sy);
      doc.text(`Rs.${finalPayable.toFixed(2)}`, valX, sy, { align: "right" });

      sy += 6;
      doc.setFont("helvetica", "normal");
      doc.text("Received:", summaryX, sy);
      doc.text(`Rs.${parseFloat(receivedAmount || 0).toFixed(2)}`, valX, sy, { align: "right" });

      sy += 6;
      doc.setTextColor(220, 38, 38);
      doc.text("Balance:", summaryX, sy);
      doc.text(`Rs.${balanceDue.toFixed(2)}`, valX, sy, { align: "right" });

      sy += 6;
      doc.setTextColor(126, 34, 206);
      doc.text("You Saved:", summaryX, sy);
      doc.text(`Rs.${totalSavings.toFixed(2)}`, valX, sy, { align: "right" });

      y = Math.max(y + 15, sy + 10);
      if (y > 265) {
        doc.addPage();
        y = 20;
      }

      doc.setTextColor(100, 100, 100);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text("Terms & Conditions: By purchasing or using this product, you agree to use it responsibly.", margin, y);
      doc.text("The company holds no liability for misuse, damage, or loss. All purchases are final.", margin, y + 4);

      const pdfBase64 = doc.output('datauristring').split(',')[1];
      const fileName = `Tax_Invoice_${billerName.replace(/\s+/g, '_')}_${Date.now()}.pdf`;

      try {
        const savedFile = await Filesystem.writeFile({
          path: fileName,
          data: pdfBase64,
          directory: Directory.Documents,
          recursive: true
        });

        try {
          await Share.share({
            title: `Tax Invoice - ${billerName}`,
            text: `Here is your tax invoice from Indiashoppe. Amount: Rs.${finalPayable.toFixed(2)}`,
            url: savedFile.uri,
            dialogTitle: 'Save or Share Tax Invoice PDF',
          });
        } catch (shareErr) {
          alert(`PDF saved successfully to Documents folder! File: ${fileName}`);
        }
      } catch (nativeErr) {
        doc.save(fileName);
      }

    } catch (err) {
      console.error('PDF generation error:', err);
      alert('PDF generation failed: ' + err.message);
    }
  };

  return (
    <div className="billing-shell">
      <style>{`
        .billing-shell{position:fixed;inset:0;background:#f3f6fb;color:#172033;display:flex;flex-direction:column;overflow:hidden;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;--ink:#172033;--muted:#64748b;--line:#dbe3ee;--surface:#fff;--soft:#f7f9fc;--brand:#6d28d9;--brand2:#7c3aed;--green:#059669;--danger:#dc2626}
        .billing-top{height:auto;min-height:62px;padding:10px 14px;background:#fff;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;gap:12px;flex-shrink:0;box-shadow:0 2px 10px rgba(15,23,42,.04)}
        .billing-brand{display:flex;align-items:center;gap:10px;min-width:0}.billing-back{border:0;border-radius:12px;background:#eef2f8;color:var(--ink);padding:10px 13px;font-weight:750;font-size:14px;white-space:nowrap}.billing-title{font-size:17px;line-height:1.2;font-weight:800;margin:0;white-space:normal}
        .billing-tabs{display:flex;gap:6px;background:#f1f4f9;padding:4px;border-radius:12px;flex-shrink:0}.billing-tab{border:0;border-radius:9px;padding:9px 12px;background:transparent;color:#475569;font-weight:750;font-size:13px}.billing-tab.active{background:var(--brand);color:#fff;box-shadow:0 2px 6px rgba(109,40,217,.2)}
        .billing-layout{display:grid;grid-template-columns:minmax(0,1fr) minmax(380px,520px);gap:14px;padding:14px;flex:1;min-height:0;overflow:hidden}
        .billing-panel{min-width:0;min-height:0;background:var(--surface);border:1px solid var(--line);border-radius:18px;box-shadow:0 4px 18px rgba(15,23,42,.045);overflow:hidden;display:flex;flex-direction:column}
        .billing-panel-head{padding:14px 16px;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;gap:10px;flex-shrink:0}.billing-panel-head h3{font-size:16px;margin:0;font-weight:800}.billing-panel-body{padding:14px;overflow:auto;min-height:0;overscroll-behavior:contain;-webkit-overflow-scrolling:touch}
        .billing-search{width:100%;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:12px;padding:13px 14px;background:#fff;color:var(--ink);font-size:15px;outline:none;margin-bottom:12px}.billing-search:focus,.billing-field:focus{border-color:#8b5cf6;box-shadow:0 0 0 3px rgba(139,92,246,.12)}
        .billing-product-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px}.billing-product{border:1px solid var(--line);border-radius:14px;background:#fff;padding:11px;display:grid;grid-template-columns:68px minmax(0,1fr);gap:10px;align-items:center}.billing-product-img{width:68px;height:72px;object-fit:contain;border-radius:10px;background:#f5f7fb}.billing-product-placeholder{width:68px;height:72px;border-radius:10px;background:#f1f5f9;display:grid;place-items:center;font-size:25px}.billing-product-name{font-size:13px;font-weight:750;line-height:1.35;color:var(--ink);overflow-wrap:anywhere}.billing-product-meta{font-size:11px;color:var(--muted);margin-top:3px}.billing-product-price{font-size:12px;margin-top:5px}.billing-add{border:0;border-radius:9px;background:var(--brand);color:white;font-weight:750;padding:8px 11px;font-size:12px;white-space:nowrap}.billing-qty{display:flex;align-items:center;gap:8px}.billing-qty button{border:0;border-radius:8px;width:30px;height:30px;background:#e9eefa;color:#334155;font-weight:900;font-size:17px}.billing-qty button.plus{background:#6d28d9;color:white}.billing-qty strong{min-width:16px;text-align:center}
        .billing-cart-headline{display:flex;align-items:center;justify-content:space-between;gap:8px}.billing-muted{color:var(--muted);font-size:12px}.billing-clear{border:1px solid #fecaca;background:#fff1f2;color:#b91c1c;border-radius:9px;padding:8px 10px;font-size:12px;font-weight:750}
        .billing-cart-list{display:flex;flex-direction:column;gap:9px}.billing-cart-item{border:1px solid var(--line);border-radius:13px;padding:12px;background:#fff}.billing-cart-item-top{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.billing-cart-item-name{font-weight:800;font-size:13px;line-height:1.4;color:var(--ink);overflow-wrap:anywhere}.billing-remove{border:0;background:#fff1f2;color:#be123c;border-radius:8px;width:32px;height:32px;font-size:17px;font-weight:800;flex-shrink:0}.billing-item-sub{font-size:11px;color:var(--muted);margin-top:3px}.billing-item-controls{display:flex;justify-content:space-between;align-items:end;gap:10px;flex-wrap:wrap;margin-top:10px}.billing-discount-label{display:block;font-size:11px;color:var(--muted);margin-bottom:4px}.billing-field{box-sizing:border-box;border:1px solid #cbd5e1;border-radius:9px;background:white;color:var(--ink);padding:9px 10px;font-size:13px;min-width:0;max-width:100%}.billing-total-card{background:#f7f5ff;border:1px solid #e9ddff;border-radius:14px;padding:13px;margin-top:12px}.billing-total-row{display:flex;justify-content:space-between;gap:10px;font-size:13px;padding:3px 0;color:#475569}.billing-total-row.grand{font-size:18px;font-weight:900;color:var(--ink);border-top:1px solid #ddd6fe;margin-top:6px;padding-top:9px}.billing-saved{color:var(--green);font-weight:800}
        .billing-customer{border:1px solid var(--line);border-radius:14px;padding:13px;margin-top:12px;background:#fff}.billing-section-title{font-size:13px;font-weight:850;margin:0 0 9px;color:var(--ink)}.billing-field-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.billing-field-grid .billing-field{width:100%}.billing-payment{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:9px}.billing-payment label{font-size:11px;color:var(--muted);display:block;margin-bottom:4px}
        .billing-empty{padding:30px 15px;text-align:center;border:1px dashed #cbd5e1;border-radius:14px;background:#fafbfe}.billing-empty-icon{font-size:34px}.billing-empty strong{display:block;margin:8px 0 4px;font-size:15px}.billing-empty p{margin:0;color:var(--muted);font-size:13px}.billing-invoice-preview{margin-top:12px;background:#fff;color:#111827;border:1px solid #d1d5db;border-radius:12px;padding:12px;overflow:hidden}.billing-invoice-preview table{width:100%;border-collapse:collapse;font-size:10px}.billing-invoice-preview th{background:#6d28d9;color:#fff;padding:7px 4px;text-align:left}.billing-invoice-preview td{border-bottom:1px solid #e5e7eb;padding:7px 4px}.billing-actionbar{flex-shrink:0;padding:10px 14px calc(10px + env(safe-area-inset-bottom));background:rgba(255,255,255,.97);border-top:1px solid var(--line);box-shadow:0 -5px 18px rgba(15,23,42,.07);z-index:5}.billing-primary{width:100%;min-height:50px;border:0;border-radius:13px;background:linear-gradient(135deg,#6d28d9,#7c3aed);color:#fff;font-size:15px;font-weight:850;box-shadow:0 5px 12px rgba(109,40,217,.2)}.billing-primary:disabled{background:#cbd5e1;box-shadow:none;color:#64748b}.billing-action-hint{text-align:center;font-size:11px;color:var(--muted);margin-top:5px}.billing-invoice-title{text-align:center;padding-bottom:9px;border-bottom:2px solid #111;margin-bottom:10px}.billing-invoice-title strong{display:block;color:#6d28d9;font-size:19px}.billing-invoice-title span{font-size:11px;font-weight:800;letter-spacing:.6px}
        @media(max-width:767px){.billing-top{padding:9px 10px;min-height:58px}.billing-title{font-size:15px}.billing-back{padding:9px 10px;font-size:13px}.billing-tabs{gap:3px}.billing-tab{padding:8px 9px;font-size:12px}.billing-layout{display:block;padding:9px;overflow:hidden}.billing-panel{height:100%;border-radius:15px}.billing-panel.products-panel{display:none}.billing-panel.cart-panel{display:none}.billing-layout.show-products .products-panel{display:flex}.billing-layout.show-cart .cart-panel{display:flex}.billing-product-grid{grid-template-columns:1fr}.billing-panel-body{padding:11px}.billing-field-grid{grid-template-columns:1fr}.billing-cart-item{padding:11px}.billing-cart-panel{position:relative}.billing-actionbar{padding-left:11px;padding-right:11px}.billing-invoice-preview table{min-width:460px}.billing-invoice-scroll{overflow-x:auto}.billing-product{grid-template-columns:62px minmax(0,1fr)}.billing-product-img,.billing-product-placeholder{width:62px;height:66px}}
        @media(min-width:768px){.billing-actionbar{border-radius:0 0 18px 18px}.billing-cart-panel{height:100%}}
      `}</style>

      <header className="billing-top">
        <div className="billing-brand">
          <button className="billing-back" onClick={() => navigate('/')}>← Back</button>
          <h2 className="billing-title">🧾 Billing Counter</h2>
        </div>
        <nav className="billing-tabs" aria-label="Billing sections">
          <button className={`billing-tab ${activeTab === 'search' ? 'active' : ''}`} onClick={() => setActiveTab('search')}>Products</button>
          <button className={`billing-tab ${activeTab === 'invoice' ? 'active' : ''}`} onClick={() => setActiveTab('invoice')}>Cart · {cartItems.length}</button>
        </nav>
      </header>

      <main className={`billing-layout ${activeTab === 'search' ? 'show-products' : 'show-cart'}`}>
        <section className="billing-panel products-panel">
          <div className="billing-panel-head"><h3>Find products</h3><span className="billing-muted">{filteredProducts.length} products</span></div>
          <div className="billing-panel-body">
            <input className="billing-search" type="search" placeholder="Search by product name or code…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            <div className="billing-product-grid">
              {filteredProducts.map(prod => {
                const qty = cart[prod.id]?.qty || 0;
                return <article className="billing-product" key={prod.id}>
                  {prod.imageUrl ? <img className="billing-product-img" src={prod.imageUrl} alt={prod.name} onError={e => { e.currentTarget.style.display='none'; }} /> : <div className="billing-product-placeholder">📦</div>}
                  <div style={{minWidth:0}}>
                    <div className="billing-product-name">{prod.name}</div>
                    <div className="billing-product-meta">{prod.code || 'No product code'}{prod.brand ? ` · ${prod.brand}` : ''}</div>
                    <div className="billing-product-price"><span style={{color:'#94a3b8',textDecoration:'line-through'}}>₹{Number(prod.mrpPrice||0).toFixed(2)}</span> <strong style={{color:'#059669'}}>₹{Number(prod.dpPrice||0).toFixed(2)}</strong></div>
                    <div style={{display:'flex',justifyContent:'flex-end',marginTop:7}}>
                      {qty === 0 ? <button className="billing-add" onClick={() => updateCartItem(prod.id,1)}>＋ Add to bill</button> : <div className="billing-qty"><button onClick={() => updateCartItem(prod.id,-1)} aria-label="Decrease quantity">−</button><strong>{qty}</strong><button className="plus" onClick={() => updateCartItem(prod.id,1)} aria-label="Increase quantity">＋</button></div>}
                    </div>
                  </div>
                </article>;
              })}
              {filteredProducts.length === 0 && <div className="billing-empty"><div className="billing-empty-icon">🔎</div><strong>No products found</strong><p>Try another product name or code.</p></div>}
            </div>
          </div>
        </section>

        <section className="billing-panel cart-panel">
          <div className="billing-panel-head">
            <div><h3>🛒 Your bill</h3><div className="billing-muted">{totals.count} units · {cartItems.length} products</div></div>
            {cartItems.length > 0 && <button className="billing-clear" onClick={() => setCart({})}>Clear all</button>}
          </div>
          <div className="billing-panel-body">
            {cartItems.length === 0 ? <div className="billing-empty"><div className="billing-empty-icon">🛍️</div><strong>Your cart is empty</strong><p>Add products to start preparing a bill.</p><button className="billing-add" style={{marginTop:13}} onClick={() => setActiveTab('search')}>Browse products</button></div> : <div className="billing-cart-list">
              {cartItems.map((item,idx) => <article className="billing-cart-item" key={item.id}>
                <div className="billing-cart-item-top"><div style={{minWidth:0}}><div className="billing-cart-item-name">{idx+1}. {item.name}</div><div className="billing-item-sub">{item.code || 'No code'} · MRP ₹{item.mrpPrice.toFixed(2)} · Unit price ₹{item.finalPrice.toFixed(2)}</div></div><button className="billing-remove" onClick={() => updateCartItem(item.id,-item.qty)} aria-label={`Remove ${item.name}`}>×</button></div>
                <div className="billing-item-controls"><div><span className="billing-discount-label">Quantity</span><div className="billing-qty"><button onClick={() => updateCartItem(item.id,-1)} aria-label="Decrease quantity">−</button><strong>{item.qty}</strong><button className="plus" onClick={() => updateCartItem(item.id,1)} aria-label="Increase quantity">＋</button></div></div><div style={{minWidth:110}}><label className="billing-discount-label" htmlFor={`discount-${item.id}`}>Discount / unit (₹)</label><input id={`discount-${item.id}`} className="billing-field" type="number" min="0" max={item.mrpPrice} step="0.01" value={item.discount} onChange={e => updateCartItem(item.id,0,e.target.value)} style={{width:120}} /></div><div style={{textAlign:'right',marginLeft:'auto'}}><span className="billing-discount-label">Item total</span><strong style={{fontSize:17,color:'#059669'}}>₹{(item.finalPrice*item.qty).toFixed(2)}</strong></div></div>
              </article>)}
            </div>}

            <div className="billing-total-card">
              <div className="billing-total-row"><span>Subtotal (MRP)</span><strong>₹{totals.mrp.toFixed(2)}</strong></div>
              <div className="billing-total-row"><span>Product savings</span><strong className="billing-saved">− ₹{totals.totalDisc.toFixed(2)}</strong></div>
              <div className="billing-total-row"><span>Additional discount (₹)</span><input className="billing-field" type="number" min="0" value={extraDiscount} onChange={e => setExtraDiscount(e.target.value)} style={{width:105,textAlign:'right'}} /></div>
              <div className="billing-total-row grand"><span>Amount payable</span><span>₹{finalPayable.toFixed(2)}</span></div>
              <div className="billing-total-row"><span>Balance due</span><strong style={{color:balanceDue>0?'#dc2626':'#059669'}}>₹{balanceDue.toFixed(2)}</strong></div>
            </div>

            <section className="billing-customer">
              <h4 className="billing-section-title">Customer details</h4>
              <div className="billing-field-grid"><input className="billing-field" type="text" placeholder="Customer name *" value={billerName} onChange={e => setBillerName(e.target.value)} /><input className="billing-field" type="tel" placeholder="Phone number (optional)" value={billerPhone} onChange={e => setBillerPhone(e.target.value)} /></div>
              <div className="billing-payment">
                <div><label htmlFor="received-amount">Amount received (₹)</label><input id="received-amount" className="billing-field" type="number" min="0" value={receivedAmount} onChange={e => setReceivedAmount(e.target.value)} style={{width:'100%'}} /></div>
                <div><label>Invoice number</label><div className="billing-field" style={{background:'#f8fafc'}}>{invoiceNo}</div></div>
              </div>
              <div style={{fontSize:11,color:'#64748b',marginTop:8}}>Date: {billDate} · Time: {billTime}</div>
            </section>

            {cartItems.length > 0 && <details className="billing-invoice-preview"><summary style={{fontWeight:800,fontSize:13,cursor:'pointer'}}>Preview invoice details</summary><div className="billing-invoice-scroll" style={{marginTop:10}}><div className="billing-invoice-title"><strong>Indiashoppe</strong><span>TAX INVOICE</span></div><div style={{fontSize:11,display:'flex',justifyContent:'space-between',gap:10,marginBottom:8}}><span>Bill to: <b>{billerName || 'Customer name pending'}</b></span><span>{invoiceNo}</span></div><table><thead><tr><th>#</th><th>Item</th><th>Qty</th><th>Price</th><th>Disc</th><th>Amount</th></tr></thead><tbody>{cartItems.map((item,i)=><tr key={item.id}><td>{i+1}</td><td>{item.name}</td><td>{item.qty}</td><td>₹{item.mrpPrice.toFixed(2)}</td><td>₹{(item.discount*item.qty).toFixed(2)}</td><td>₹{(item.finalPrice*item.qty).toFixed(2)}</td></tr>)}</tbody></table><div style={{textAlign:'right',fontWeight:850,marginTop:10}}>Total: ₹{finalPayable.toFixed(2)}</div><div style={{fontSize:11,marginTop:6}}>Amount in words: {numberToWords(finalPayable)}</div></div></details>}
          </div>
          <div className="billing-actionbar">
            <button className="billing-primary" type="button" onClick={handleDownloadOrShareInvoicePDF} disabled={cartItems.length===0}>📄 Generate & Save Invoice PDF</button>
            <div className="billing-action-hint">{cartItems.length===0 ? 'Add at least one product to continue' : !billerName.trim() ? 'Enter customer name to generate the invoice' : 'Your invoice is ready to save or share'}</div>
          </div>
        </section>
      </main>
    </div>
  );
}
