import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function IncomeCalculator() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('matching'); // 'matching' or 'moreIncomes'

  // Matching Calculator States
  const [amount, setAmount] = useState('');
  const [bv, setBv] = useState('');
  const [income, setIncome] = useState('');
  const [planType, setPlanType] = useState('G75');

  // More Incomes / Rank Income Calculator States
  const [rankInputType, setRankInputType] = useState('bv'); // 'bv' or 'amount'
  const [org1Val, setOrg1Val] = useState('');
  const [org2Val, setOrg2Val] = useState('');
  const [selectedRank, setSelectedRank] = useState('STAR SILVER'); // Default Star Silver (2%)

  // Rank Income percentages mapping based on official plan
  const rankPercentages = {
    'STAR SILVER': 2.0,
    'STAR PEARL': 3.0,
    'EMERALD': 3.75,
    'GOLD': 4.5,
    'PLATINUM': 5.0,
    'DIAMOND': 5.5,
    'BLUE DIAMOND': 5.9,
    'ROYAL DIAMOND': 6.3,
    'CROWN DIAMOND': 6.7,
    'CROWN AMBASSADOR': 7.1
  };

  const handleAmountChange = (val) => {
    setAmount(val);
    const amtNum = parseFloat(val);
    if (isNaN(amtNum) || val === '') {
      setBv('');
      setIncome('');
    } else {
      const calculatedBv = planType === 'G35' ? amtNum * 0.35 : amtNum * 0.75;
      const calculatedIncome = calculatedBv * 0.12;
      setBv(calculatedBv.toFixed(2));
      setIncome(calculatedIncome.toFixed(2));
    }
  };

  const handleBvChange = (val) => {
    setBv(val);
    const bvNum = parseFloat(val);
    if (isNaN(bvNum) || val === '') {
      setAmount('');
      setIncome('');
    } else {
      const calculatedAmount = planType === 'G35' ? bvNum / 0.35 : bvNum / 0.75;
      const calculatedIncome = bvNum * 0.12;
      setAmount(calculatedAmount.toFixed(2));
      setIncome(calculatedIncome.toFixed(2));
    }
  };

  const handleIncomeChange = (val) => {
    setIncome(val);
    const incNum = parseFloat(val);
    if (isNaN(incNum) || val === '') {
      setAmount('');
      setBv('');
    } else {
      const calculatedBv = incNum / 0.12;
      const calculatedAmount = planType === 'G35' ? calculatedBv / 0.35 : calculatedBv / 0.75;
      setBv(calculatedBv.toFixed(2));
      setAmount(calculatedAmount.toFixed(2));
    }
  };

  const handlePlanChange = (newPlan) => {
    setPlanType(newPlan);
    if (amount !== '') {
      const amtNum = parseFloat(amount);
      const calculatedBv = newPlan === 'G35' ? amtNum * 0.35 : amtNum * 0.75;
      const calculatedIncome = calculatedBv * 0.12;
      setBv(calculatedBv.toFixed(2));
      setIncome(calculatedIncome.toFixed(2));
    }
  };

  const handleClearMatching = () => {
    setAmount('');
    setBv('');
    setIncome('');
  };

  const input1 = parseFloat(org1Val) || 0;
  const input2 = parseFloat(org2Val) || 0;
  
  const multiplier = rankInputType === 'amount' ? (planType === 'G35' ? 0.35 : 0.75) : 1;
  const o1Bv = input1 * multiplier;
  const o2Bv = input2 * multiplier;

  const matchedBv = Math.min(o1Bv, o2Bv);
  const matchingIncome = matchedBv * 0.12;
  
  const rankPer = rankPercentages[selectedRank] || 0;
  const rankIncomeVal = matchedBv * (rankPer / 100);
  const totalMoreIncome = matchingIncome + rankIncomeVal;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: 'white', padding: '20px', boxSizing: 'border-box', fontFamily: 'sans-serif' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={() => navigate('/')} style={{ padding: '8px 14px', backgroundColor: '#334155', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
          ⬅ Back
        </button>
        <h2 style={{ margin: 0, fontSize: '18px', color: '#38bdf8' }}>🧮 Income & BV Calculator</h2>
      </div>

      {/* Calculator Tabs */}
      <div style={{ display: 'flex', gap: '10px', maxWidth: '500px', margin: '0 auto 20px auto' }}>
        <button 
          onClick={() => setActiveTab('matching')}
          style={{ flex: 1, padding: '10px', backgroundColor: activeTab === 'matching' ? '#7e22ce' : '#1e293b', color: 'white', border: '1px solid #334155', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
        >
          ⚖️ Matching Income
        </button>
        <button 
          onClick={() => setActiveTab('moreIncomes')}
          style={{ flex: 1, padding: '10px', backgroundColor: activeTab === 'moreIncomes' ? '#7e22ce' : '#1e293b', color: 'white', border: '1px solid #334155', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
        >
          🚀 Rank & Bonus Calculator
        </button>
      </div>

      {/* TAB 1: MATCHING INCOME CALCULATOR */}
      {activeTab === 'matching' && (
        <div style={{ backgroundColor: '#1e293b', padding: '25px', borderRadius: '12px', border: '1px solid #334155', maxWidth: '500px', margin: '0 auto 30px auto', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '8px', fontWeight: 'bold' }}>Select Plan Type:</label>
            <div style={{ display: 'flex', gap: '15px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>
                <input type="radio" name="planType" value="G35" checked={planType === 'G35'} onChange={() => handlePlanChange('G35')} />
                G35 (100₹ = 35 BV)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>
                <input type="radio" name="planType" value="G75" checked={planType === 'G75'} onChange={() => handlePlanChange('G75')} />
                G75 (100₹ = 75 BV)
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '5px', fontWeight: 'bold' }}>Amount (₹)</label>
              <input type="number" placeholder="e.g. 1000" value={amount} onChange={(e) => handleAmountChange(e.target.value)} style={{ width: '100%', padding: '11px', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: 'white', fontSize: '15px', boxSizing: 'border-box', outline: 'none' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '5px', fontWeight: 'bold' }}>BV (Business Volume)</label>
              <input type="number" placeholder="e.g. 350" value={bv} onChange={(e) => handleBvChange(e.target.value)} style={{ width: '100%', padding: '11px', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: 'white', fontSize: '15px', boxSizing: 'border-box', outline: 'none' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '5px', fontWeight: 'bold' }}>Income (₹) [12%]</label>
              <input type="number" placeholder="e.g. 42" value={income} onChange={(e) => handleIncomeChange(e.target.value)} style={{ width: '100%', padding: '11px', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: 'white', fontSize: '15px', boxSizing: 'border-box', outline: 'none' }} />
            </div>
          </div>

          <div style={{ backgroundColor: '#0f172a', border: '1px dashed #38bdf8', padding: '12px 14px', borderRadius: '8px', marginBottom: '20px' }}>
            <div style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 'bold', marginBottom: '4px' }}>📌 Important Note:</div>
            <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: '1.5' }}>
              Only the matching BV (12%) between Org 1 and Org 2 is calculated for income. BV from only one side is not considered for income calculation.
            </div>
          </div>

          <button onClick={handleClearMatching} style={{ width: '100%', padding: '12px', backgroundColor: '#475569', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}>
            Clear All Values
          </button>
        </div>
      )}

      {/* TAB 2: RANK INCOME & ADVANCED CALCULATOR */}
      {activeTab === 'moreIncomes' && (
        <div style={{ backgroundColor: '#1e293b', padding: '25px', borderRadius: '12px', border: '1px solid #334155', maxWidth: '500px', margin: '0 auto 30px auto', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '15px', color: '#38bdf8' }}>🚀 Rank Income & Sales Turnover Calculator</h3>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px', fontWeight: 'bold' }}>Input Format:</label>
            <div style={{ display: 'flex', gap: '15px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
                <input type="radio" name="rankInputType" value="bv" checked={rankInputType === 'bv'} onChange={() => setRankInputType('bv')} />
                Enter BV Directly
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
                <input type="radio" name="rankInputType" value="amount" checked={rankInputType === 'amount'} onChange={() => setRankInputType('amount')} />
                Enter Amount (₹)
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '5px', fontWeight: 'bold' }}>
                Org 1 Total ({rankInputType === 'bv' ? 'BV' : 'Amount in ₹'})
              </label>
              <input type="number" placeholder={rankInputType === 'bv' ? 'e.g. 5000 BV' : 'e.g. 10000 ₹'} value={org1Val} onChange={(e) => setOrg1Val(e.target.value)} style={{ width: '100%', padding: '11px', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: 'white', fontSize: '15px', boxSizing: 'border-box', outline: 'none' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '5px', fontWeight: 'bold' }}>
                Org 2 Total ({rankInputType === 'bv' ? 'BV' : 'Amount in ₹'})
              </label>
              <input type="number" placeholder={rankInputType === 'bv' ? 'e.g. 4500 BV' : 'e.g. 9000 ₹'} value={org2Val} onChange={(e) => setOrg2Val(e.target.value)} style={{ width: '100%', padding: '11px', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: 'white', fontSize: '15px', boxSizing: 'border-box', outline: 'none' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '5px', fontWeight: 'bold' }}>Select Achieved Rank (For Rank Income):</label>
              <select value={selectedRank} onChange={(e) => setSelectedRank(e.target.value)} style={{ width: '100%', padding: '11px', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: 'white', fontSize: '14px', outline: 'none', fontWeight: 'bold' }}>
                {Object.entries(rankPercentages).map(([rank, per]) => (
                  <option key={rank} value={rank}>{rank} ({per}% Rank Income)</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ backgroundColor: '#0f172a', border: '1px solid #38bdf8', padding: '16px', borderRadius: '8px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: '#94a3b8' }}>Matched BV:</span>
              <span style={{ color: 'white', fontWeight: 'bold' }}>{matchedBv.toFixed(2)} BV</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: '#94a3b8' }}>Sales Turnover Bonus (12%):</span>
              <span style={{ color: '#10b981', fontWeight: 'bold' }}>₹{matchingIncome.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: '#94a3b8' }}>Rank Income ({selectedRank} - {rankPer}%):</span>
              <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>₹{rankIncomeVal.toFixed(2)}</span>
            </div>
            <div style={{ borderTop: '1px solid #334155', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '15px' }}>
              <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>Total Estimated Income:</span>
              <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>₹{totalMoreIncome.toFixed(2)}</span>
            </div>
          </div>

          <button onClick={() => { setOrg1Val(''); setOrg2Val(''); }} style={{ width: '100%', padding: '12px', backgroundColor: '#475569', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}>
            Clear Values
          </button>
        </div>
      )}

    </div>
  );
}