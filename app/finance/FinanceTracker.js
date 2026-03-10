'use client';

import { useState, useEffect } from 'react';
import Papa from 'papaparse';

const DEFAULT_CATEGORIES = [
  { name: 'Rent / Housing', type: 'mandatory' },
  { name: 'Food & Groceries', type: 'mandatory' },
  { name: 'Transportation', type: 'mandatory' },
  { name: 'Utilities & Bills', type: 'mandatory' },
  { name: 'Healthcare', type: 'mandatory' },
  { name: 'Entertainment', type: 'unnecessary' },
  { name: 'Shopping', type: 'unnecessary' },
  { name: 'Dining Out', type: 'unnecessary' },
  { name: 'Subscriptions', type: 'unnecessary' },
  { name: 'Other', type: 'unnecessary' },
];

function maskAccount(str) {
  if (!str) return '';
  return str.length > 4 ? '****' + str.slice(-4) : '****';
}

function today() {
  return new Date().toISOString().split('T')[0];
}

function daysDiff(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((d - now) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export default function FinanceTracker() {
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [budgets, setBudgets] = useState({});
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [reminders, setReminders] = useState([]);
  const [newReminder, setNewReminder] = useState({ title: '', date: today(), amount: '' });

  useEffect(() => {
    const t = localStorage.getItem('finance_transactions');
    const b = localStorage.getItem('finance_budgets');
    const n = localStorage.getItem('finance_notes');
    const r = localStorage.getItem('finance_reminders');
    if (t) setTransactions(JSON.parse(t));
    if (b) setBudgets(JSON.parse(b));
    if (n) setNotes(JSON.parse(n));
    if (r) setReminders(JSON.parse(r));
  }, []);

  useEffect(() => { localStorage.setItem('finance_transactions', JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem('finance_budgets', JSON.stringify(budgets)); }, [budgets]);
  useEffect(() => { localStorage.setItem('finance_notes', JSON.stringify(notes)); }, [notes]);
  useEffect(() => { localStorage.setItem('finance_reminders', JSON.stringify(reminders)); }, [reminders]);

  function handleCSV(e) {
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed = results.data.map((row, i) => {
          const keys = Object.keys(row);
          const dateKey = keys.find(k => /date/i.test(k));
          const descKey = keys.find(k => /desc|narration|particular|detail|memo/i.test(k));
          const amountKey = keys.find(k => /amount|debit|withdrawal/i.test(k));
          const amount = parseFloat((row[amountKey] || '0').replace(/[^0-9.-]/g, '')) || 0;
          return {
            id: Date.now() + i,
            date: row[dateKey] || '',
            description: row[descKey] || Object.values(row).join(' '),
            amount: Math.abs(amount),
            category: 'Other',
          };
        }).filter(t => t.amount > 0);
        setTransactions(prev => [...prev, ...parsed]);
        setActiveTab('transactions');
      },
    });
  }

  function updateCategory(id, category) {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, category } : t));
  }

  function deleteTransaction(id) {
    setTransactions(prev => prev.filter(t => t.id !== id));
  }

  function addNote() {
    if (!newNote.trim()) return;
    setNotes(prev => [...prev, { id: Date.now(), text: newNote.trim(), createdAt: today() }]);
    setNewNote('');
  }

  function addReminder() {
    if (!newReminder.title.trim() || !newReminder.date) return;
    setReminders(prev => [...prev, { id: Date.now(), ...newReminder, done: false }]);
    setNewReminder({ title: '', date: today(), amount: '' });
  }

  function toggleReminder(id) {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, done: !r.done } : r));
  }

  const spending = {};
  transactions.forEach(t => { spending[t.category] = (spending[t.category] || 0) + t.amount; });
  const totalSpent = Object.values(spending).reduce((a, b) => a + b, 0);
  const mandatorySpent = transactions.filter(t => DEFAULT_CATEGORIES.find(c => c.name === t.category && c.type === 'mandatory')).reduce((a, t) => a + t.amount, 0);
  const unnecessarySpent = transactions.filter(t => DEFAULT_CATEGORIES.find(c => c.name === t.category && c.type === 'unnecessary')).reduce((a, t) => a + t.amount, 0);

  const budgetAlerts = Object.entries(budgets).filter(([cat, budget]) => budget > 0 && (spending[cat] || 0) > budget).map(([cat]) => cat);
  const reminderAlerts = reminders.filter(r => !r.done && daysDiff(r.date) <= 0);
  const upcomingReminders = reminders.filter(r => !r.done && daysDiff(r.date) > 0 && daysDiff(r.date) <= 3);

  const tabs = ['dashboard', 'notes', 'reminders', 'transactions', 'budgets', 'upload'];

  return (
    <div style={{ background: '#0a0f0a', minHeight: '100vh', color: '#e8f5e8', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 12px #22c55e' }} />
            <span style={{ color: '#22c55e', fontSize: '12px', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: 600 }}>Finance Tracker</span>
          </div>
          <h1 style={{ fontSize: '36px', fontWeight: 700, color: '#f0fdf0', margin: 0, letterSpacing: '-0.5px' }}>Your Money, Private.</h1>
          <p style={{ color: '#4b7a4b', marginTop: '6px', fontSize: '14px' }}>All data stored locally in your browser — never leaves your device.</p>
        </div>

        {/* Alerts */}
        {(budgetAlerts.length > 0 || reminderAlerts.length > 0 || upcomingReminders.length > 0) && (
          <div style={{ marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {budgetAlerts.map(cat => (
              <div key={cat} style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '10px', color: '#fca5a5' }}>
                <span>⚠️</span>
                <span style={{ fontSize: '14px' }}><strong>{cat}</strong> — Over budget! Spent ₹{(spending[cat] || 0).toFixed(0)} of ₹{budgets[cat]}</span>
              </div>
            ))}
            {reminderAlerts.map(r => (
              <div key={r.id} style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '10px', color: '#fca5a5' }}>
                <span>🔔</span>
                <span style={{ fontSize: '14px' }}><strong>{r.title}</strong> — {daysDiff(r.date) === 0 ? 'Due today!' : `Overdue by ${Math.abs(daysDiff(r.date))} day(s)`} {r.amount && `· ₹${r.amount}`}</span>
              </div>
            ))}
            {upcomingReminders.map(r => (
              <div key={r.id} style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.25)', borderRadius: '12px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '10px', color: '#fde047' }}>
                <span>📅</span>
                <span style={{ fontSize: '14px' }}><strong>{r.title}</strong> — Due in {daysDiff(r.date)} day(s) {r.amount && `· ₹${r.amount}`}</span>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '32px', background: '#111a11', borderRadius: '12px', padding: '4px', overflowX: 'auto' }}>
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500,
              background: activeTab === tab ? '#22c55e' : 'transparent',
              color: activeTab === tab ? '#000' : '#4b7a4b',
              position: 'relative', whiteSpace: 'nowrap', transition: 'all 0.15s',
            }}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'reminders' && reminderAlerts.length > 0 && (
                <span style={{ marginLeft: '6px', background: '#ef4444', color: '#fff', borderRadius: '10px', padding: '1px 6px', fontSize: '10px', fontWeight: 700 }}>{reminderAlerts.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '40px' }}>
              {[
                { label: 'Total Spent', value: `₹${totalSpent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, glow: '#22c55e' },
                { label: 'Mandatory', value: `₹${mandatorySpent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, glow: '#3b82f6' },
                { label: 'Unnecessary', value: `₹${unnecessarySpent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, glow: '#f97316' },
              ].map(stat => (
                <div key={stat.label} style={{ background: '#111a11', border: `1px solid ${stat.glow}22`, borderRadius: '16px', padding: '24px', boxShadow: `0 0 30px ${stat.glow}0d` }}>
                  <p style={{ color: '#4b7a4b', fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>{stat.label}</p>
                  <p style={{ fontSize: '28px', fontWeight: 700, color: stat.glow, margin: 0 }}>{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Category bars */}
            <p style={{ color: '#4b7a4b', fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '16px', fontWeight: 600 }}>Spending Breakdown</p>
            {Object.keys(spending).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#2d4a2d' }}>
                <p style={{ fontSize: '40px', marginBottom: '12px' }}>📂</p>
                <p>No transactions yet. Upload a CSV to get started.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {Object.entries(spending).sort((a, b) => b[1] - a[1]).map(([cat, amount]) => {
                  const budget = budgets[cat] || 0;
                  const percent = budget > 0 ? Math.min((amount / budget) * 100, 100) : 0;
                  const over = budget > 0 && amount > budget;
                  const catInfo = DEFAULT_CATEGORIES.find(c => c.name === cat);
                  const barColor = over ? '#ef4444' : catInfo?.type === 'mandatory' ? '#22c55e' : '#f97316';
                  return (
                    <div key={cat} style={{ background: '#111a11', border: '1px solid #1a2e1a', borderRadius: '14px', padding: '18px 20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: budget > 0 ? '12px' : '0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: barColor, display: 'inline-block', boxShadow: `0 0 8px ${barColor}` }} />
                          <span style={{ fontSize: '14px', color: '#c8e6c8', fontWeight: 500 }}>{cat}</span>
                          <span style={{ fontSize: '11px', color: catInfo?.type === 'mandatory' ? '#22c55e' : '#f97316', background: catInfo?.type === 'mandatory' ? '#22c55e15' : '#f9731615', padding: '2px 8px', borderRadius: '6px' }}>
                            {catInfo?.type || 'unnecessary'}
                          </span>
                        </div>
                        <span style={{ fontSize: '15px', fontWeight: 600, color: over ? '#ef4444' : '#e8f5e8' }}>
                          ₹{amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                          {budget > 0 && <span style={{ color: '#4b7a4b', fontWeight: 400, fontSize: '13px' }}> / ₹{budget}</span>}
                        </span>
                      </div>
                      {budget > 0 && (
                        <div style={{ background: '#0a150a', borderRadius: '4px', height: '4px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${percent}%`, background: barColor, borderRadius: '4px', boxShadow: `0 0 8px ${barColor}`, transition: 'width 0.5s ease' }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* NOTES */}
        {activeTab === 'notes' && (
          <div>
            <p style={{ color: '#4b7a4b', fontSize: '13px', marginBottom: '24px' }}>Jot down financial thoughts, goals, or observations.</p>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '28px' }}>
              <textarea
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addNote(); } }}
                placeholder="Write a note... (Enter to save)"
                rows={2}
                style={{ flex: 1, background: '#111a11', border: '1px solid #1a2e1a', borderRadius: '10px', padding: '12px 14px', color: '#c8e6c8', fontSize: '14px', resize: 'none', outline: 'none' }}
              />
              <button onClick={addNote} style={{ background: '#22c55e', color: '#000', border: 'none', borderRadius: '10px', padding: '0 20px', fontWeight: 600, cursor: 'pointer', fontSize: '14px', alignSelf: 'flex-start', height: '44px' }}>Add</button>
            </div>
            {notes.length === 0 ? (
              <p style={{ color: '#2d4a2d', textAlign: 'center', padding: '40px 0' }}>No notes yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[...notes].reverse().map(note => (
                  <div key={note.id} style={{ background: '#111a11', border: '1px solid #1e3a1e', borderRadius: '12px', padding: '16px 18px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: '#c8e6c8', fontSize: '14px', margin: '0 0 6px', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{note.text}</p>
                      <p style={{ color: '#2d4a2d', fontSize: '12px', margin: 0 }}>{formatDate(note.createdAt)}</p>
                    </div>
                    <button onClick={() => setNotes(prev => prev.filter(n => n.id !== note.id))} style={{ background: 'none', border: 'none', color: '#2d4a2d', cursor: 'pointer', fontSize: '18px', lineHeight: 1, padding: 0 }}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* REMINDERS */}
        {activeTab === 'reminders' && (
          <div>
            <p style={{ color: '#4b7a4b', fontSize: '13px', marginBottom: '24px' }}>Set payment reminders. Get alerts when they're due.</p>
            <div style={{ background: '#111a11', border: '1px solid #1a2e1a', borderRadius: '14px', padding: '20px', marginBottom: '28px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input type="text" placeholder="Title — e.g. Pay rent, Netflix" value={newReminder.title}
                onChange={e => setNewReminder(p => ({ ...p, title: e.target.value }))}
                style={{ background: '#0a150a', border: '1px solid #1a2e1a', borderRadius: '8px', padding: '10px 14px', color: '#c8e6c8', fontSize: '14px', outline: 'none' }}
              />
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ color: '#4b7a4b', fontSize: '11px', marginBottom: '6px', letterSpacing: '1px' }}>DUE DATE</p>
                  <input type="date" value={newReminder.date}
                    onChange={e => setNewReminder(p => ({ ...p, date: e.target.value }))}
                    style={{ width: '100%', background: '#0a150a', border: '1px solid #1a2e1a', borderRadius: '8px', padding: '10px 14px', color: '#c8e6c8', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ color: '#4b7a4b', fontSize: '11px', marginBottom: '6px', letterSpacing: '1px' }}>AMOUNT (optional)</p>
                  <input type="number" placeholder="₹ 0" value={newReminder.amount}
                    onChange={e => setNewReminder(p => ({ ...p, amount: e.target.value }))}
                    style={{ width: '100%', background: '#0a150a', border: '1px solid #1a2e1a', borderRadius: '8px', padding: '10px 14px', color: '#c8e6c8', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
              <button onClick={addReminder} style={{ background: '#22c55e', color: '#000', border: 'none', borderRadius: '8px', padding: '11px', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}>Add Reminder</button>
            </div>
            {reminders.length === 0 ? (
              <p style={{ color: '#2d4a2d', textAlign: 'center', padding: '40px 0' }}>No reminders yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[...reminders].sort((a, b) => new Date(a.date) - new Date(b.date)).map(r => {
                  const diff = daysDiff(r.date);
                  let statusColor = '#4b7a4b';
                  let statusText = `Due in ${diff} day(s)`;
                  if (r.done) { statusColor = '#22c55e'; statusText = 'Completed'; }
                  else if (diff < 0) { statusColor = '#ef4444'; statusText = `Overdue ${Math.abs(diff)}d`; }
                  else if (diff === 0) { statusColor = '#ef4444'; statusText = 'Due today!'; }
                  else if (diff <= 3) { statusColor = '#eab308'; statusText = `Due in ${diff}d`; }

                  return (
                    <div key={r.id} style={{ background: '#111a11', border: `1px solid ${!r.done && diff <= 0 ? '#ef444430' : '#1a2e1a'}`, borderRadius: '12px', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <input type="checkbox" checked={r.done} onChange={() => toggleReminder(r.id)}
                        style={{ width: '16px', height: '16px', accentColor: '#22c55e', cursor: 'pointer', flexShrink: 0 }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ color: r.done ? '#2d4a2d' : '#c8e6c8', fontSize: '14px', fontWeight: 500, margin: '0 0 4px', textDecoration: r.done ? 'line-through' : 'none' }}>{r.title}</p>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <span style={{ color: '#2d4a2d', fontSize: '12px' }}>{formatDate(r.date)}</span>
                          <span style={{ color: statusColor, fontSize: '12px', fontWeight: 600 }}>{statusText}</span>
                          {r.amount && <span style={{ color: '#22c55e', fontSize: '12px' }}>₹{r.amount}</span>}
                        </div>
                      </div>
                      <button onClick={() => setReminders(prev => prev.filter(x => x.id !== r.id))} style={{ background: 'none', border: 'none', color: '#2d4a2d', cursor: 'pointer', fontSize: '18px' }}>×</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TRANSACTIONS */}
        {activeTab === 'transactions' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <p style={{ color: '#4b7a4b', fontSize: '13px', margin: 0 }}>{transactions.length} transactions</p>
              {transactions.length > 0 && (
                <button onClick={() => { if (confirm('Clear all?')) setTransactions([]); }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '13px' }}>Clear all</button>
              )}
            </div>
            {transactions.length === 0 ? (
              <p style={{ color: '#2d4a2d', textAlign: 'center', padding: '60px 0' }}>No transactions. Go to Upload to import a CSV.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {transactions.map(t => (
                  <div key={t.id} style={{ background: '#111a11', border: '1px solid #1a2e1a', borderRadius: '12px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: '#c8e6c8', fontSize: '13px', fontWeight: 500, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{maskAccount(t.description)}</p>
                      <p style={{ color: '#2d4a2d', fontSize: '12px', margin: 0 }}>{formatDate(t.date)}</p>
                    </div>
                    <span style={{ color: '#22c55e', fontWeight: 600, fontSize: '14px', flexShrink: 0 }}>₹{t.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                    <select value={t.category} onChange={e => updateCategory(t.id, e.target.value)}
                      style={{ background: '#0a150a', border: '1px solid #1a2e1a', borderRadius: '6px', padding: '4px 8px', color: '#4b7a4b', fontSize: '12px', cursor: 'pointer', outline: 'none' }}
                    >
                      {DEFAULT_CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                    </select>
                    <button onClick={() => deleteTransaction(t.id)} style={{ background: 'none', border: 'none', color: '#2d4a2d', cursor: 'pointer', fontSize: '18px' }}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* BUDGETS */}
        {activeTab === 'budgets' && (
          <div>
            <p style={{ color: '#4b7a4b', fontSize: '13px', marginBottom: '24px' }}>Set monthly limits. You'll get an alert when you exceed them.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {DEFAULT_CATEGORIES.map(cat => (
                <div key={cat.name} style={{ background: '#111a11', border: '1px solid #1a2e1a', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: '#c8e6c8', fontSize: '14px', fontWeight: 500, margin: '0 0 4px' }}>{cat.name}</p>
                    <span style={{ fontSize: '11px', color: cat.type === 'mandatory' ? '#22c55e' : '#f97316', background: cat.type === 'mandatory' ? '#22c55e15' : '#f9731615', padding: '2px 8px', borderRadius: '6px' }}>{cat.type}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: '#22c55e', fontSize: '14px' }}>₹</span>
                    <input type="number" min="0" placeholder="No limit"
                      value={budgets[cat.name] || ''}
                      onChange={e => setBudgets(prev => ({ ...prev, [cat.name]: Number(e.target.value) }))}
                      style={{ width: '110px', background: '#0a150a', border: '1px solid #1a2e1a', borderRadius: '8px', padding: '8px 12px', color: '#c8e6c8', fontSize: '14px', outline: 'none' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* UPLOAD */}
        {activeTab === 'upload' && (
          <div>
            <label style={{ display: 'block', border: '2px dashed #1a2e1a', borderRadius: '16px', padding: '60px 20px', textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.2s' }}>
              <p style={{ fontSize: '48px', margin: '0 0 16px' }}>📂</p>
              <p style={{ color: '#c8e6c8', fontWeight: 600, fontSize: '16px', margin: '0 0 8px' }}>Upload Bank Statement CSV</p>
              <p style={{ color: '#2d4a2d', fontSize: '13px', margin: '0 0 20px' }}>Read locally — never sent to any server</p>
              <span style={{ background: '#22c55e', color: '#000', padding: '10px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: 600 }}>Choose CSV File</span>
              <input type="file" accept=".csv" onChange={handleCSV} style={{ display: 'none' }} />
            </label>
            <div style={{ background: '#111a11', border: '1px solid #1a2e1a', borderRadius: '12px', padding: '20px', marginTop: '20px' }}>
              <p style={{ color: '#22c55e', fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px', fontWeight: 600 }}>Supported Formats</p>
              {['HDFC, ICICI, SBI, Axis bank CSV exports', 'Auto-detects: Date, Description, Amount columns', 'Only debit/expense entries are imported'].map(item => (
                <p key={item} style={{ color: '#4b7a4b', fontSize: '13px', margin: '6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#22c55e' }}>✓</span> {item}
                </p>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
