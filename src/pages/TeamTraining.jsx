import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function TeamTraining() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('training'); // 'training' or 'team'
  const [trainingSubView, setTrainingSubView] = useState('view'); // 'view' or 'add'
  const [teamSubView, setTeamSubView] = useState('view'); // 'view' or 'add'

  // Training States
  const [trainings, setTrainings] = useState([]);
  const [trainingForm, setTrainingForm] = useState({ date: '', place: '', about: '' });
  const [editingTrainingId, setEditingTrainingId] = useState(null);
  const [viewingNotesId, setViewingNotesId] = useState(null);
  const [tempNotesText, setTempNotesText] = useState('');

  // Team & KYC States (With checkboxes to show/hide fields completely)
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamForm, setTeamForm] = useState({ 
    memberId: '', 
    name: '', 
    kyc: false, showKyc: true,
    neft: false, showNeft: true,
    pan: false, showPan: true 
  });
  const [editingMemberId, setEditingMemberId] = useState(null);

  useEffect(() => {
    const savedTrainings = localStorage.getItem('growth_os_training_notes');
    if (savedTrainings) {
      try { setTrainings(JSON.parse(savedTrainings)); } catch (e) {}
    }

    const savedTeam = localStorage.getItem('growth_os_team_kyc_tracker');
    if (savedTeam) {
      try { setTeamMembers(JSON.parse(savedTeam)); } catch (e) {}
    }

    checkPendingApprovalsReminder(savedTeam);
  }, []);

  const checkPendingApprovalsReminder = (teamDataString) => {
    if (!teamDataString) return;
    try {
      const members = JSON.parse(teamDataString);
      const hasPending = members.some(m => 
        (m.showKyc !== false && !m.kyc) || 
        (m.showNeft !== false && !m.neft) || 
        (m.showPan !== false && !m.pan)
      );
      if (!hasPending) return;

      const lastReminderDate = localStorage.getItem('growth_os_last_kyc_reminder');
      const now = new Date().getTime();
      const twoDaysInMs = 2 * 24 * 60 * 60 * 1000;

      if (!lastReminderDate || (now - parseInt(lastReminderDate)) > twoDaysInMs) {
        alert('🔔 REMINDER: You have pending KYC / NEFT / PAN approvals in your team tracker. Please check and follow up!');
        localStorage.setItem('growth_os_last_kyc_reminder', now.toString());
      }
    } catch (e) {}
  };

  // --- TRAINING FUNCTIONS ---
  const handleSaveTraining = (e) => {
    e.preventDefault();
    if (!trainingForm.date || !trainingForm.place || !trainingForm.about) {
      alert('⚠️ Please fill out Date, Place and About fields!');
      return;
    }

    if (editingTrainingId) {
      const updated = trainings.map(t => t.id === editingTrainingId ? { ...t, ...trainingForm } : t);
      setTrainings(updated);
      localStorage.setItem('growth_os_training_notes', JSON.stringify(updated));
      setEditingTrainingId(null);
      alert('✅ Training Info Updated Successfully!');
    } else {
      const newItem = { id: Date.now(), ...trainingForm, notes: '' };
      const updated = [...trainings, newItem];
      setTrainings(updated);
      localStorage.setItem('growth_os_training_notes', JSON.stringify(updated));
      alert('✅ Training Saved Successfully!');
    }
    setTrainingForm({ date: '', place: '', about: '' });
    setTrainingSubView('view');
  };

  const handleEditTraining = (item) => {
    setEditingTrainingId(item.id);
    setTrainingForm({ date: item.date, place: item.place, about: item.about });
    setTrainingSubView('add');
  };

  const handleDeleteTraining = (id) => {
    if (window.confirm('Delete this training record?')) {
      const updated = trainings.filter(t => t.id !== id);
      setTrainings(updated);
      localStorage.setItem('growth_os_training_notes', JSON.stringify(updated));
      if (viewingNotesId === id) setViewingNotesId(null);
    }
  };

  const handleSaveNotes = (id) => {
    const updated = trainings.map(t => t.id === id ? { ...t, notes: tempNotesText } : t);
    setTrainings(updated);
    localStorage.setItem('growth_os_training_notes', JSON.stringify(updated));
    setViewingNotesId(null);
    alert('✅ Detailed Training Notes Saved!');
  };

  // --- TEAM & KYC FUNCTIONS ---
  const handleSaveTeamMember = (e) => {
    e.preventDefault();
    if (!teamForm.memberId || !teamForm.name) {
      alert('⚠️ Please enter Member ID and Name!');
      return;
    }

    const isValid10Digit = /^\d{10}$/.test(teamForm.memberId.trim());
    if (!isValid10Digit) {
      alert('❌ Member ID must be exactly 10 digits (numbers only, no letters)!');
      return;
    }

    if (editingMemberId) {
      const updated = teamMembers.map(m => m.id === editingMemberId ? { ...m, ...teamForm } : m);
      setTeamMembers(updated);
      localStorage.setItem('growth_os_team_kyc_tracker', JSON.stringify(updated));
      setEditingMemberId(null);
      alert('✅ Team Member Status Updated!');
    } else {
      const newItem = { id: Date.now(), ...teamForm };
      const updated = [...teamMembers, newItem];
      setTeamMembers(updated);
      localStorage.setItem('growth_os_team_kyc_tracker', JSON.stringify(updated));
      alert('✅ Team Member Added Successfully!');
    }
    setTeamForm({ memberId: '', name: '', kyc: false, showKyc: true, neft: false, showNeft: true, pan: false, showPan: true });
    setTeamSubView('view');
  };

  const handleEditTeamMember = (member) => {
    setEditingMemberId(member.id);
    setTeamForm({ 
      memberId: member.memberId, 
      name: member.name, 
      kyc: member.kyc || false, 
      showKyc: member.showKyc !== false, 
      neft: member.neft || false, 
      showNeft: member.showNeft !== false, 
      pan: member.pan || false, 
      showPan: member.showPan !== false 
    });
    setTeamSubView('add');
  };

  const handleDeleteTeamMember = (id) => {
    if (window.confirm('Delete this member from tracker?')) {
      const updated = teamMembers.filter(m => m.id !== id);
      setTeamMembers(updated);
      localStorage.setItem('growth_os_team_kyc_tracker', JSON.stringify(updated));
    }
  };

  const pendingMembersCount = teamMembers.filter(m => 
    (m.showKyc !== false && !m.kyc) || 
    (m.showNeft !== false && !m.neft) || 
    (m.showPan !== false && !m.pan)
  ).length;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: 'white', padding: '20px', fontFamily: 'sans-serif', boxSizing: 'border-box', maxWidth: '900px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #334155', paddingBottom: '15px' }}>
        <button onClick={() => navigate('/')} style={{ padding: '8px 14px', backgroundColor: '#334155', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>
          ← Back
        </button>
        <h2 style={{ margin: 0, color: '#38bdf8', fontSize: '18px' }}>🛡️ Team & Training Maintenance</h2>
      </div>

      {/* Pending Reminder Banner */}
      {pendingMembersCount > 0 && (
        <div style={{ backgroundColor: '#7f1d1d', border: '1px solid #ef4444', padding: '12px 16px', borderRadius: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>⚠️</span>
          <div style={{ fontSize: '13px', color: '#fca5a5' }}>
            <strong>Pending Approvals Notice:</strong> You have {pendingMembersCount} member(s) with pending approvals. (Reminder triggers every 2 days).
          </div>
        </div>
      )}

      {/* Main Tabs Switcher */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          onClick={() => { setActiveTab('training'); setViewingNotesId(null); }}
          style={{ flex: 1, padding: '12px', backgroundColor: activeTab === 'training' ? '#7e22ce' : '#1e293b', color: 'white', border: '1px solid #334155', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
        >
          📚 Training & Meetings
        </button>
        <button 
          onClick={() => setActiveTab('team')}
          style={{ flex: 1, padding: '12px', backgroundColor: activeTab === 'team' ? '#7e22ce' : '#1e293b', color: 'white', border: '1px solid #334155', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
        >
          👥 Team KYC Tracker
        </button>
      </div>

      {/* ==================== TAB 1: TRAINING & MEETINGS ==================== */}
      {activeTab === 'training' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e293b', padding: '12px 16px', borderRadius: '10px', border: '1px solid #334155' }}>
            <span style={{ fontSize: '14px', color: '#38bdf8', fontWeight: 'bold' }}>
              {trainingSubView === 'view' ? '📋 Training Records List' : (editingTrainingId ? '✏️ Edit Training Record' : '➕ Add New Training Record')}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => { setTrainingSubView('view'); setEditingTrainingId(null); setViewingNotesId(null); }}
                style={{ padding: '7px 12px', backgroundColor: trainingSubView === 'view' ? '#3b82f6' : '#334155', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                View Page
              </button>
              <button 
                onClick={() => { setTrainingSubView('add'); setEditingTrainingId(null); setTrainingForm({ date: '', place: '', about: '' }); setViewingNotesId(null); }}
                style={{ padding: '7px 12px', backgroundColor: trainingSubView === 'add' ? '#10b981' : '#334155', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                + Add Data Page
              </button>
            </div>
          </div>

          {trainingSubView === 'view' && !viewingNotesId && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {trainings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', background: '#1e293b', borderRadius: '12px', border: '1px solid #334155' }}>
                  No training records found. Click <strong>"+ Add Data Page"</strong> to create one.
                </div>
              ) : (
                trainings.map((item, index) => (
                  <div key={item.id} style={{ backgroundColor: '#1e293b', padding: '18px', borderRadius: '12px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 'bold' }}>S.No: #{index + 1} | 📅 {item.date}</span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => { setViewingNotesId(item.id); setTempNotesText(item.notes || ''); }} style={{ padding: '6px 12px', backgroundColor: '#7e22ce', color: 'white', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>
                          {item.notes ? '📖 View/Edit Notes' : '➕ Add Notes'}
                        </button>
                        <button onClick={() => handleEditTraining(item)} style={{ padding: '6px 10px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}>Edit</button>
                        <button onClick={() => handleDeleteTraining(item.id)} style={{ padding: '6px 10px', backgroundColor: '#7f1d1d', color: '#fca5a5', border: 'none', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}>Delete</button>
                      </div>
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 'bold', color: 'white' }}>📍 Place: {item.place}</div>
                    <div style={{ fontSize: '13px', color: '#cbd5e1' }}><strong>About:</strong> {item.about}</div>
                    {item.notes && <div style={{ fontSize: '12px', color: '#94a3b8', background: '#0f172a', padding: '10px', borderRadius: '8px', borderLeft: '3px solid #10b981' }}><strong>Notes:</strong> {item.notes}</div>}
                  </div>
                ))
              )}
            </div>
          )}

          {viewingNotesId && (
            (() => {
              const currentTraining = trainings.find(t => t.id === viewingNotesId);
              if (!currentTraining) return null;
              return (
                <div style={{ backgroundColor: '#1e293b', padding: '24px', borderRadius: '14px', border: '1px solid #38bdf8', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, color: '#38bdf8', fontSize: '16px' }}>📝 Notes Editor: {currentTraining.about}</h3>
                    <button onClick={() => setViewingNotesId(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '16px', cursor: 'pointer' }}>✕ Close</button>
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>📅 Date: {currentTraining.date} | 📍 Place: {currentTraining.place}</div>
                  
                  <textarea 
                    placeholder="Write detailed training learnings, meeting minutes or notes here..." 
                    value={tempNotesText} 
                    onChange={e => setTempNotesText(e.target.value)} 
                    style={{ width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid #475569', background: '#0f172a', color: 'white', minHeight: '180px', boxSizing: 'border-box', outline: 'none', fontSize: '13px', lineHeight: '1.5' }} 
                  />

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button onClick={() => setViewingNotesId(null)} style={{ padding: '9px 16px', backgroundColor: '#334155', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
                    <button onClick={() => handleSaveNotes(currentTraining.id)} style={{ padding: '9px 18px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Save Notes</button>
                  </div>
                </div>
              );
            })()
          )}

          {trainingSubView === 'add' && !viewingNotesId && (
            <form onSubmit={handleSaveTraining} style={{ backgroundColor: '#1e293b', padding: '24px', borderRadius: '14px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ margin: 0, color: '#10b981', fontSize: '16px' }}>{editingTrainingId ? '✏️ Modify Training Record Details' : '➕ Add Training Record'}</h3>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>Date *</label>
                  <input type="date" value={trainingForm.date} onChange={e => setTrainingForm({...trainingForm, date: e.target.value})} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #475569', background: '#0f172a', color: 'white', boxSizing: 'border-box', outline: 'none' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>Place *</label>
                  <input type="text" placeholder="e.g. Trichy Hall" value={trainingForm.place} onChange={e => setTrainingForm({...trainingForm, place: e.target.value})} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #475569', background: '#0f172a', color: 'white', boxSizing: 'border-box', outline: 'none' }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>About Meeting / Training *</label>
                <input type="text" placeholder="e.g. Business Plan Seminar" value={trainingForm.about} onChange={e => setTrainingForm({...trainingForm, about: e.target.value})} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #475569', background: '#0f172a', color: 'white', boxSizing: 'border-box', outline: 'none' }} />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" onClick={() => setTrainingSubView('view')} style={{ padding: '11px 16px', backgroundColor: '#334155', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '11px 20px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                  {editingTrainingId ? 'Save Changes' : 'Save Training'}
                </button>
              </div>
            </form>
          )}

        </div>
      )}

      {/* ==================== TAB 2: TEAM KYC TRACKER ==================== */}
      {activeTab === 'team' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e293b', padding: '12px 16px', borderRadius: '10px', border: '1px solid #334155' }}>
            <span style={{ fontSize: '14px', color: '#38bdf8', fontWeight: 'bold' }}>
              {teamSubView === 'view' ? '👥 Team Members List & Status' : (editingMemberId ? '✏️ Edit Member Status' : '➕ Add Team Member')}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => { setTeamSubView('view'); setEditingMemberId(null); }}
                style={{ padding: '7px 12px', backgroundColor: teamSubView === 'view' ? '#3b82f6' : '#334155', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                View Page
              </button>
              <button 
                onClick={() => { setTeamSubView('add'); setEditingMemberId(null); setTeamForm({ memberId: '', name: '', kyc: false, showKyc: true, neft: false, showNeft: true, pan: false, showPan: true }); }}
                style={{ padding: '7px 12px', backgroundColor: teamSubView === 'add' ? '#10b981' : '#334155', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                + Add Data Page
              </button>
            </div>
          </div>

          {teamSubView === 'view' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {teamMembers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', background: '#1e293b', borderRadius: '12px', border: '1px solid #334155' }}>
                  No team members added yet. Click <strong>"+ Add Data Page"</strong> to add a member.
                </div>
              ) : (
                teamMembers.map((member) => (
                  <div key={member.id} style={{ backgroundColor: '#1e293b', padding: '16px 18px', borderRadius: '12px', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 'bold', color: 'white' }}>{member.name} <span style={{ color: '#38bdf8', fontSize: '12px', fontFamily: 'monospace' }}>(ID: {member.memberId})</span></div>
                      <div style={{ display: 'flex', gap: '14px', marginTop: '8px', fontSize: '12px' }}>
                        {member.showKyc !== false && (
                          <span style={{ color: member.kyc ? '#10b981' : '#f87171' }}>{member.kyc ? '✅ KYC Done' : '❌ KYC Pending'}</span>
                        )}
                        {member.showNeft !== false && (
                          <span style={{ color: member.neft ? '#10b981' : '#f87171' }}>{member.neft ? '✅ NEFT Done' : '❌ NEFT Pending'}</span>
                        )}
                        {member.showPan !== false && (
                          <span style={{ color: member.pan ? '#10b981' : '#f87171' }}>{member.pan ? '✅ PAN Done' : '❌ PAN Pending'}</span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleEditTeamMember(member)} style={{ padding: '7px 12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Edit</button>
                      <button onClick={() => handleDeleteTeamMember(member.id)} style={{ padding: '7px 12px', backgroundColor: '#7f1d1d', color: '#fca5a5', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Delete</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {teamSubView === 'add' && (
            <form onSubmit={handleSaveTeamMember} style={{ backgroundColor: '#1e293b', padding: '24px', borderRadius: '14px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ margin: 0, color: '#10b981', fontSize: '16px' }}>{editingMemberId ? '✏️ Modify Member Details & Field Visibility' : '➕ Add Team Member (10-Digit ID)'}</h3>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>Member ID Number *</label>
                  <input 
                    type="text" 
                    maxLength={10} 
                    placeholder="e.g. 4456525485" 
                    value={teamForm.memberId} 
                    onChange={e => setTeamForm({...teamForm, memberId: e.target.value.replace(/\D/g, '')})} 
                    style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #475569', background: '#0f172a', color: 'white', boxSizing: 'border-box', outline: 'none' }} 
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>Member Name *</label>
                  <input type="text" placeholder="e.g. Kaira" value={teamForm.name} onChange={e => setTeamForm({...teamForm, name: e.target.value})} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #475569', background: '#0f172a', color: 'white', boxSizing: 'border-box', outline: 'none' }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Approval Status & Field Visibility (Uncheck "Show" to completely hide the field for this user)</label>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#0f172a', padding: '14px', borderRadius: '8px', border: '1px solid #475569' }}>
                  
                  {/* KYC Option */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={teamForm.kyc} onChange={e => setTeamForm({...teamForm, kyc: e.target.checked})} style={{ width: '16px', height: '16px' }} />
                      KYC 
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94a3b8', cursor: 'pointer' }}>
                      <input type="checkbox" checked={teamForm.showKyc} onChange={e => setTeamForm({...teamForm, showKyc: e.target.checked})} style={{ width: '14px', height: '14px' }} />
                      Show KYC field
                    </label>
                  </div>

                  {/* NEFT Option */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #1e293b', paddingTop: '10px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={teamForm.neft} onChange={e => setTeamForm({...teamForm, neft: e.target.checked})} style={{ width: '16px', height: '16px' }} />
                      NEFT 
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94a3b8', cursor: 'pointer' }}>
                      <input type="checkbox" checked={teamForm.showNeft} onChange={e => setTeamForm({...teamForm, showNeft: e.target.checked})} style={{ width: '14px', height: '14px' }} />
                      Show NEFT field
                    </label>
                  </div>

                  {/* PAN Option */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #1e293b', paddingTop: '10px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={teamForm.pan} onChange={e => setTeamForm({...teamForm, pan: e.target.checked})} style={{ width: '16px', height: '16px' }} />
                      PAN 
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94a3b8', cursor: 'pointer' }}>
                      <input type="checkbox" checked={teamForm.showPan} onChange={e => setTeamForm({...teamForm, showPan: e.target.checked})} style={{ width: '14px', height: '14px' }} />
                      Show PAN field
                    </label>
                  </div>

                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" onClick={() => setTeamSubView('view')} style={{ padding: '11px 16px', backgroundColor: '#334155', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '11px 20px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                  {editingMemberId ? 'Save Changes' : 'Save Member'}
                </button>
              </div>
            </form>
          )}

        </div>
      )}

    </div>
  );
}