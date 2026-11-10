import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';

export default function PurchaseManager() {
  const navigate = useNavigate();
  
  const [memberName, setMemberName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [extraAmount, setExtraAmount] = useState('');
  const [tag, setTag] = useState('');
  const [amounts, setAmounts] = useState(['']); // Minimum 1 amount box
  const [purchaseList, setPurchaseList] = useState([]);
  
  const [editingId, setEditingId] = useState(null);
  const previewRef = useRef(null);

  const handleAddAmountBox = () => {
    setAmounts([...amounts, '']);
  };

  const handleAmountChange = (index, value) => {
    const updated = [...amounts];
    updated[index] = value;
    setAmounts(updated);
  };

  const handleRemoveAmountBox = (index) => {
    if (amounts.length > 1) {
      setAmounts(amounts.filter((_, i) => i !== index));
    } else {
      alert('⚠️ Minimum 1 amount box is required!');
    }
  };

  const handleAddOrUpdateList = (e) => {
    e.preventDefault();
    if (!memberName.trim() || !idNumber.trim()) {
      alert('⚠️ Please enter Member Name and ID Number!');
      return;
    }
    
    // Filter out empty amount fields or check if at least one valid amount is entered
    const validAmounts = amounts.filter(amt => amt.toString().trim() !== '');
    if (validAmounts.length === 0) {
      alert('⚠️ Please enter at least one amount!');
      return;
    }

    const numericAmounts = validAmounts.map(a => parseFloat(a) || 0);
    const sumAmounts = numericAmounts.reduce((acc, curr) => acc + curr, 0);
    const extra = parseFloat(extraAmount) || 0;
    const itemTotal = sumAmounts + extra;

    if (editingId !== null) {
      setPurchaseList(purchaseList.map(item => item.id === editingId ? {
        ...item,
        memberName: memberName.trim().toUpperCase(),
        idNumber: idNumber.trim(),
        extraAmount: extra,
        tag: tag.trim().toUpperCase(),
        amounts: validAmounts,
        itemTotal: itemTotal
      } : item));
      setEditingId(null);
    } else {
      const newItem = {
        id: Date.now(),
        memberName: memberName.trim().toUpperCase(),
        idNumber: idNumber.trim(),
        extraAmount: extra,
        tag: tag.trim().toUpperCase(),
        amounts: validAmounts,
        itemTotal: itemTotal
      };
      setPurchaseList([...purchaseList, newItem]);
    }

    setMemberName('');
    setIdNumber('');
    setExtraAmount('');
    setTag('');
    setAmounts(['']);
  };

  const handleEditItem = (item) => {
    setEditingId(item.id);
    setMemberName(item.memberName);
    setIdNumber(item.idNumber);
    setExtraAmount(item.extraAmount > 0 ? item.extraAmount.toString() : '');
    setTag(item.tag || '');
    setAmounts(item.amounts && item.amounts.length > 0 ? item.amounts : ['']);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteItem = (id) => {
    setPurchaseList(purchaseList.filter(item => item.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setMemberName('');
      setIdNumber('');
      setExtraAmount('');
      setTag('');
      setAmounts(['']);
    }
  };

  const grandTotal = purchaseList.reduce((sum, item) => sum + item.itemTotal, 0);

  const generateCanvasImage = async () => {
    if (!previewRef.current) return null;
    const canvas = await html2canvas(previewRef.current, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false
    });
    return canvas.toDataURL('image/jpeg', 1.0);
  };

  const handleDownloadJPG = async () => {
    if (purchaseList.length === 0) {
      alert('⚠️ No purchase entries added to export!');
      return;
    }
    try {
      const dataUrl = await generateCanvasImage();
      const base64Data = dataUrl.split(',')[1];
      const fileName = `Purchase_Summary_${new Date().toISOString().split('T')[0]}.jpg`;

      try {
        const savedFile = await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Documents,
          recursive: true
        });

        await Share.share({
          title: 'Purchase Summary',
          url: savedFile.uri,
          dialogTitle: 'Save or Share JPG'
        });
      } catch (nativeErr) {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = fileName;
        link.click();
      }
    } catch (err) {
      console.error(err);
      alert('❌ Failed to generate JPG.');
    }
  };

  const handleWhatsAppShare = async () => {
    if (purchaseList.length === 0) {
      alert('⚠️ No purchase entries added to share!');
      return;
    }
    try {
      const dataUrl = await generateCanvasImage();
      const base64Data = dataUrl.split(',')[1];
      const fileName = `Purchase_Summary_${new Date().toISOString().split('T')[0]}.jpg`;

      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Documents,
        recursive: true
      });

      await Share.share({
        title: 'Purchase Summary',
        url: savedFile.uri,
        dialogTitle: 'Share via WhatsApp'
      });
    } catch (err) {
      let textSummary = `📊 *Purchase Summary Report*\n\n`;
      purchaseList.forEach((item, idx) => {
        const amountsJoined = item.amounts.join(' + ');
        const extraStr = item.extraAmount > 0 ? ` + ${item.extraAmount}` : '';
        const tagStr = item.tag ? ` (${item.tag})` : '';
        textSummary += `${idx + 1}, ${item.memberName} — ${item.idNumber} — ${amountsJoined}${extraStr}${tagStr}\n`;
      });
      textSummary += `\n------------------\n💰 *TOTAL = ${grandTotal}*\n\n💪 Powered by Growth OS`;

      try {
        await Share.share({ title: 'Purchase Summary', text: textSummary, dialogTitle: 'Share WhatsApp' });
      } catch (e) {
        navigator.clipboard.writeText(textSummary);
        alert('📋 Summary text copied to clipboard!');
      }
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0b1329', color: 'white', padding: '16px', fontFamily: 'sans-serif', maxWidth: '500px', margin: '0 auto', boxSizing: 'border-box' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <button 
          onClick={() => navigate('/')} 
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 14px', backgroundColor: '#1e293b', color: 'white', border: '1px solid #334155', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
        >
          ← Back
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 'bold' }}>
          <span>🛒</span> Purchase Manager
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button 
            onClick={handleDownloadJPG}
            style={{ padding: '9px 12px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}
          >
            📥 JPG
          </button>
          <button 
            onClick={handleWhatsAppShare}
            style={{ padding: '9px 12px', backgroundColor: '#25D366', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}
          >
            💬 WA
          </button>
        </div>
      </div>

      {/* Add / Edit Purchase Entry Card */}
      <div style={{ backgroundColor: 'white', color: '#1e293b', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
        <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>🛒 {editingId !== null ? 'Edit Purchase Entry' : 'Add Purchase Entry'}</span>
          {editingId !== null && (
            <button onClick={() => { setEditingId(null); setMemberName(''); setIdNumber(''); setExtraAmount(''); setTag(''); setAmounts(['']); }} style={{ fontSize: '11px', background: '#64748b', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
          )}
        </div>

        <form onSubmit={handleAddOrUpdateList} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input 
            type="text" 
            placeholder="Member Name *" 
            value={memberName} 
            onChange={(e) => setMemberName(e.target.value.toUpperCase())} 
            style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#1e293b', fontSize: '13px', outline: 'none', boxSizing: 'border-box', textTransform: 'uppercase', fontWeight: 'bold' }}
          />

          <input 
            type="text" 
            placeholder="ID Number (10 Digits) *" 
            maxLength={10}
            value={idNumber} 
            onChange={(e) => setIdNumber(e.target.value.replace(/\D/g, ''))} 
            style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#1e293b', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
          />

          <input 
            type="number" 
            placeholder="Extra Amount (Optional)" 
            value={extraAmount} 
            onChange={(e) => setExtraAmount(e.target.value)} 
            style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#1e293b', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
          />

          <input 
            type="text" 
            placeholder="Tag (Optional, e.g., G35)" 
            value={tag} 
            onChange={(e) => setTag(e.target.value)} 
            style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#1e293b', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
          />

          {/* Amount boxes section (Minimum 1, expandable) */}
          <div style={{ marginTop: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>💰 Amount Boxes :</span>
              <button 
                type="button" 
                onClick={handleAddAmountBox}
                style={{ padding: '6px 12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                + Add Amount
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {amounts.map((amt, aIdx) => (
                <div key={aIdx} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <input 
                    type="number" 
                    placeholder={`Amount ${aIdx + 1} *`} 
                    value={amt} 
                    onChange={(e) => handleAmountChange(aIdx, e.target.value)} 
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#1e293b', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                  />
                  {amounts.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => handleRemoveAmountBox(aIdx)}
                      style={{ background: '#ef4444', color: 'white', border: 'none', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '11px' }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button 
            type="submit" 
            style={{ width: '100%', padding: '14px', backgroundColor: editingId !== null ? '#059669' : '#8b5cf6', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', marginTop: '8px', boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)' }}
          >
            {editingId !== null ? '💾 UPDATE ENTRY' : '+ ADD TO LIST'}
          </button>
        </form>
      </div>

      {/* Live Output Preview & Management Container */}
      <div style={{ backgroundColor: 'white', color: '#1e293b', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#64748b', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Live Output Preview & Management
        </div>

        {purchaseList.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', border: '2px dashed #cbd5e1', borderRadius: '12px', color: '#94a3b8', fontSize: '13px' }}>
            No purchases added yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {purchaseList.map((item, idx) => {
              const amountsJoined = item.amounts.join(' + ');
              const extraStr = item.extraAmount > 0 ? ` + ${item.extraAmount}` : '';
              const tagStr = item.tag ? ` (${item.tag})` : '';

              return (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b', wordBreak: 'break-word', flex: 1, marginRight: '10px' }}>
                    {idx + 1}, {item.memberName} — {item.idNumber} — {amountsJoined}{extraStr}{tagStr}
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button 
                      onClick={() => handleEditItem(item)}
                      style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteItem(item.id)}
                      style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}

            <div style={{ borderTop: '2px solid #cbd5e1', paddingTop: '12px', marginTop: '6px', textAlign: 'right', fontSize: '16px', fontWeight: 'bold', color: '#1e293b' }}>
              TOTAL = {grandTotal}
            </div>
          </div>
        )}
      </div>

      {/* Hidden Downloadable JPG Container with white-space: nowrap */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <div ref={previewRef} style={{ width: 'auto', minWidth: '950px', backgroundColor: '#ffffff', color: '#111827', padding: '50px', fontFamily: 'sans-serif', whiteSpace: 'nowrap' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', marginBottom: '35px' }}>
            {purchaseList.map((item, idx) => {
              const amountsJoined = item.amounts.join(' + ');
              const extraStr = item.extraAmount > 0 ? ` + ${item.extraAmount}` : '';
              const tagStr = item.tag ? ` (${item.tag})` : '';

              return (
                <div key={item.id} style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>
                  {idx + 1}, {item.memberName} — {item.idNumber} — {amountsJoined}{extraStr}{tagStr}
                </div>
              );
            })}
          </div>

          {/* Exact Total Box matching reference image */}
          <div style={{ borderTop: '2px solid #111827', paddingTop: '14px', marginTop: '10px', width: '420px', margin: '0 auto', textAlign: 'center' }}>
            <div style={{ borderBottom: '2px solid #111827', paddingBottom: '14px' }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', letterSpacing: '0.5px' }}>
                TOTAL = {grandTotal}
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}