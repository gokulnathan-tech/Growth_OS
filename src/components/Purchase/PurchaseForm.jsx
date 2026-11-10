import React, { useState } from 'react';

export default function PurchaseForm({ onAddItem }) {
  const [itemName, setItemName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [baseAmount, setBaseAmount] = useState('');
  const [extraAmount, setExtraAmount] = useState('');
  const [tag, setTag] = useState('');
  const [quantity, setQuantity] = useState(1);

  const handleAddToList = (e) => {
    e.preventDefault();

    // 1. Mandatory Item Name Validation
    if (!itemName.trim()) {
      alert("Error: Item Name mandatory field da!");
      return;
    }

    // 2. Strict Exact 10-Digit ID Number Validation
    if (!/^\d{10}$/.test(idNumber)) {
      alert("Error: ID Number exactly 10 digits mattum thaan irukanum (koodavum koodathu, koraiyavum koodathu)!");
      return;
    }

    const base = baseAmount === '' ? 0 : parseFloat(baseAmount);
    const extra = extraAmount === '' ? 0 : parseFloat(extraAmount);

    if (base === 0 && extra === 0) {
      alert("Error: Base Amount or Extra Amount-il ethavathu oru amount enter pannungal!");
      return;
    }

    const newItem = {
      id: Date.now(),
      itemName: itemName.trim(),
      idNumber: idNumber.trim(),
      baseAmount: base,
      extraAmount: extra,
      tag: tag.trim() ? `(${tag.trim()})` : '',
      quantity: parseInt(quantity) || 1,
    };

    if (onAddItem) {
      onAddItem(newItem);
    }

    setItemName('');
    setIdNumber('');
    setBaseAmount('');
    setExtraAmount('');
    setTag('');
    setQuantity(1);
  };

  return (
    <div style={{ background: '#1e293b', padding: '15px', borderRadius: '10px', maxWidth: '400px', width: '100%', color: 'white', boxSizing: 'border-box' }}>
      <h3 style={{ margin: '0 0 12px 0', textAlign: 'center', fontSize: '16px', color: '#38bdf8' }}>Add Purchase Item</h3>
      
      <form onSubmit={handleAddToList} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div>
          <label style={{ fontSize: '12px', color: '#94a3b8' }}>Item Name *</label>
          <input 
            type="text" 
            placeholder="Enter item name (Required)" 
            value={itemName} 
            onChange={(e) => setItemName(e.target.value)} 
            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid ' + (!itemName.trim() ? '#ef4444' : '#475569'), background: '#0f172a', color: 'white', marginTop: '3px', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label style={{ fontSize: '12px', color: '#94a3b8' }}>ID Number (Exact 10 Digits) *</label>
          <input 
            type="number" 
            pattern="[0-9]*"
            inputMode="numeric"
            placeholder="Enter exact 10-digit ID" 
            value={idNumber} 
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 10);
              setIdNumber(val);
            }} 
            onKeyDown={(e) => {
              if (['e', 'E', '+', '-', '.'].includes(e.key)) {
                e.preventDefault();
              }
            }}
            maxLength={10}
            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid ' + (idNumber.length !== 10 ? '#ef4444' : '#475569'), background: '#0f172a', color: 'white', marginTop: '3px', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <label style={{ fontSize: '12px', color: '#94a3b8' }}>Base Amount</label>
            <input 
              type="number" 
              placeholder="Base amt" 
              value={baseAmount} 
              onChange={(e) => setBaseAmount(e.target.value)} 
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: 'white', marginTop: '3px', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: '#94a3b8' }}>Extra Amount</label>
            <input 
              type="number" 
              placeholder="Extra amt" 
              value={extraAmount} 
              onChange={(e) => setExtraAmount(e.target.value)} 
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: 'white', marginTop: '3px', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <label style={{ fontSize: '12px', color: '#94a3b8' }}>Tag / Note</label>
            <input 
              type="text" 
              placeholder="e.g. G35" 
              value={tag} 
              onChange={(e) => setTag(e.target.value)} 
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: 'white', marginTop: '3px', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: '#94a3b8' }}>Quantity</label>
            <input 
              type="number" 
              placeholder="1" 
              value={quantity} 
              onChange={(e) => setQuantity(e.target.value)} 
              min="1"
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: 'white', marginTop: '3px', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <button 
          type="submit" 
          style={{ padding: '10px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', marginTop: '4px' }}
        >
          Add to List
        </button>
      </form>
    </div>
  );
}