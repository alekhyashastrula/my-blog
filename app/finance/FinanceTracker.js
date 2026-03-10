'use client';

import { useState, useEffect } from 'react';
import Papa from 'papaparse';

const DEFAULT_CATEGORIES = [
  { name: 'Rent / Housing', type: 'mandatory', budget: 0 },
  { name: 'Food & Groceries', type: 'mandatory', budget: 0 },
  { name: 'Transportation', type: 'mandatory', budget: 0 },
  { name: 'Utilities & Bills', type: 'mandatory', budget: 0 },
  { name: 'Healthcare', type: 'mandatory', budget: 0 },
  { name: 'Entertainment', type: 'unnecessary', budget: 0 },
  { name: 'Shopping', type: 'unnecessary', budget: 0 },
  { name: 'Dining Out', type: 'unnecessary', budget: 0 },
  { name: 'Subscriptions', type: 'unnecessary', budget: 0 },
  { name: 'Other', type: 'unnecessary', budget: 0 },
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

// Display any date string as DD/MM/YYYY
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr; // fallback to raw if unparseable
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export default function FinanceTracker() {
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [budgets, setBudgets] = useState({});

  // Notes state
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');

  // Reminders state
  const [reminders, setReminders] = useState([]);
  const [newReminder, setNewReminder] = useState({ title: '', date: today(), amount: '' });

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('finance_transactions');
    const savedBudgets = localStorage.getItem('finance_budgets');
    const savedNotes = localStorage.getItem('finance_notes');
    const savedReminders = localStorage.getItem('finance_reminders');
    if (saved) setTransactions(JSON.parse(saved));
    if (savedBudgets) setBudgets(JSON.parse(savedBudgets));
    if (savedNotes) setNotes(JSON.parse(savedNotes));
    if (savedReminders) setReminders(JSON.parse(savedReminders));
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
          const rawAmount = row[amountKey] || '0';
          const amount = parseFloat(rawAmount.replace(/[^0-9.-]/g, '')) || 0;
          return {
            id: Date.now() + i,
            date: row[dateKey] || '',
            description: row[descKey] || Object.values(row).join(' '),
            amount: Math.abs(amount),
            category: 'Other',
            raw: row,
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

  function clearAll() {
    if (confirm('Clear all transactions?')) setTransactions([]);
  }

  // Notes
  function addNote() {
    if (!newNote.trim()) return;
    setNotes(prev => [...prev, { id: Date.now(), text: newNote.trim(), createdAt: today() }]);
    setNewNote('');
  }

  function deleteNote(id) {
    setNotes(prev => prev.filter(n => n.id !== id));
  }

  // Reminders
  function addReminder() {
    if (!newReminder.title.trim() || !newReminder.date) return;
    setReminders(prev => [...prev, { id: Date.now(), ...newReminder, done: false }]);
    setNewReminder({ title: '', date: today(), amount: '' });
  }

  function toggleReminder(id) {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, done: !r.done } : r));
  }

  function deleteReminder(id) {
    setReminders(prev => prev.filter(r => r.id !== id));
  }

  // Spending calculations
  const spending = {};
  transactions.forEach(t => { spending[t.category] = (spending[t.category] || 0) + t.amount; });

  const totalSpent = Object.values(spending).reduce((a, b) => a + b, 0);
  const mandatorySpent = transactions
    .filter(t => DEFAULT_CATEGORIES.find(c => c.name === t.category && c.type === 'mandatory'))
    .reduce((a, t) => a + t.amount, 0);
  const unnecessarySpent = transactions
    .filter(t => DEFAULT_CATEGORIES.find(c => c.name === t.category && c.type === 'unnecessary'))
    .reduce((a, t) => a + t.amount, 0);

  // Budget alerts
  const budgetAlerts = Object.entries(budgets)
    .filter(([cat, budget]) => budget > 0 && (spending[cat] || 0) > budget)
    .map(([cat]) => cat);

  // Reminder alerts — due today or overdue and not done
  const reminderAlerts = reminders.filter(r => !r.done && daysDiff(r.date) <= 0);
  const upcomingReminders = reminders.filter(r => !r.done && daysDiff(r.date) > 0 && daysDiff(r.date) <= 3);

  const tabs = ['dashboard', 'notes', 'reminders', 'transactions', 'budgets', 'upload'];

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Finance Tracker</h1>
        <p className="text-gray-500 mt-1">Your data stays private — stored only in this browser.</p>
      </div>

      {/* Global Alerts */}
      {(budgetAlerts.length > 0 || reminderAlerts.length > 0 || upcomingReminders.length > 0) && (
        <div className="mb-6 space-y-2">
          {budgetAlerts.map(cat => (
            <div key={cat} className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <span>⚠️</span>
              <span><strong>{cat}</strong> — Over budget! Spent ₹{(spending[cat] || 0).toFixed(2)} of ₹{budgets[cat]} limit.</span>
            </div>
          ))}
          {reminderAlerts.map(r => (
            <div key={r.id} className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <span>🔔</span>
              <span><strong>{r.title}</strong> — {daysDiff(r.date) === 0 ? 'Due today!' : `Overdue by ${Math.abs(daysDiff(r.date))} day(s)!`} {r.amount && `₹${r.amount}`}</span>
            </div>
          ))}
          {upcomingReminders.map(r => (
            <div key={r.id} className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
              <span>📅</span>
              <span><strong>{r.title}</strong> — Due in {daysDiff(r.date)} day(s). {r.amount && `₹${r.amount}`}</span>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 whitespace-nowrap transition-colors ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
            {tab === 'reminders' && reminderAlerts.length > 0 && (
              <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">{reminderAlerts.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div>
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
              <p className="text-sm text-gray-500">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">₹{totalSpent.toFixed(2)}</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
              <p className="text-sm text-blue-600">Mandatory</p>
              <p className="text-2xl font-bold text-blue-700 mt-1">₹{mandatorySpent.toFixed(2)}</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-5 border border-orange-100">
              <p className="text-sm text-orange-600">Unnecessary</p>
              <p className="text-2xl font-bold text-orange-700 mt-1">₹{unnecessarySpent.toFixed(2)}</p>
            </div>
          </div>

          <h2 className="text-lg font-semibold text-gray-800 mb-4">Spending by Category</h2>
          {Object.keys(spending).length === 0 ? (
            <p className="text-gray-400 text-sm">No transactions yet. Upload a CSV to get started.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(spending).sort((a, b) => b[1] - a[1]).map(([cat, amount]) => {
                const budget = budgets[cat] || 0;
                const percent = budget > 0 ? Math.min((amount / budget) * 100, 100) : 0;
                const over = budget > 0 && amount > budget;
                const catInfo = DEFAULT_CATEGORIES.find(c => c.name === cat);
                return (
                  <div key={cat} className="bg-white border border-gray-100 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          catInfo?.type === 'mandatory' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {catInfo?.type || 'unnecessary'}
                        </span>
                        <span className="text-sm font-medium text-gray-800">{cat}</span>
                      </div>
                      <span className={`text-sm font-semibold ${over ? 'text-red-600' : 'text-gray-700'}`}>
                        ₹{amount.toFixed(2)} {budget > 0 && `/ ₹${budget}`}
                      </span>
                    </div>
                    {budget > 0 && (
                      <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                        <div className={`h-1.5 rounded-full ${over ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${percent}%` }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Notes Tab */}
      {activeTab === 'notes' && (
        <div>
          <p className="text-sm text-gray-500 mb-5">Write anything — observations, goals, things to remember about your finances.</p>

          {/* Add note */}
          <div className="flex gap-2 mb-6">
            <textarea
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addNote(); } }}
              placeholder="Write a note... (Enter to save)"
              rows={2}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <button
              onClick={addNote}
              className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors self-start"
            >
              Add
            </button>
          </div>

          {/* Notes list */}
          {notes.length === 0 ? (
            <p className="text-gray-400 text-sm">No notes yet.</p>
          ) : (
            <div className="space-y-3">
              {[...notes].reverse().map(note => (
                <div key={note.id} className="bg-yellow-50 border border-yellow-100 rounded-lg px-4 py-3 flex gap-3 items-start">
                  <div className="flex-1">
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{note.text}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatDate(note.createdAt)}</p>
                  </div>
                  <button onClick={() => deleteNote(note.id)} className="text-gray-300 hover:text-red-500 text-lg leading-none shrink-0">×</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reminders Tab */}
      {activeTab === 'reminders' && (
        <div>
          <p className="text-sm text-gray-500 mb-5">Set payment reminders — rent, EMI, subscriptions, bills. You'll see alerts on the dashboard when they're due.</p>

          {/* Add reminder */}
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-6 space-y-3">
            <input
              type="text"
              placeholder="Title (e.g. Pay rent, Netflix renewal)"
              value={newReminder.title}
              onChange={e => setNewReminder(prev => ({ ...prev, title: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-gray-500 mb-1 block">Due date</label>
                <input
                  type="date"
                  value={newReminder.date}
                  onChange={e => setNewReminder(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-500 mb-1 block">Amount (optional)</label>
                <input
                  type="number"
                  placeholder="₹ 0"
                  value={newReminder.amount}
                  onChange={e => setNewReminder(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
            </div>
            <button
              onClick={addReminder}
              className="bg-blue-600 text-white text-sm px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Reminder
            </button>
          </div>

          {/* Reminders list */}
          {reminders.length === 0 ? (
            <p className="text-gray-400 text-sm">No reminders yet.</p>
          ) : (
            <div className="space-y-2">
              {[...reminders].sort((a, b) => new Date(a.date) - new Date(b.date)).map(r => {
                const diff = daysDiff(r.date);
                let statusColor = 'text-gray-500';
                let statusText = `Due in ${diff} day(s)`;
                if (r.done) { statusColor = 'text-green-600'; statusText = 'Done'; }
                else if (diff < 0) { statusColor = 'text-red-600'; statusText = `Overdue by ${Math.abs(diff)} day(s)`; }
                else if (diff === 0) { statusColor = 'text-red-500'; statusText = 'Due today!'; }
                else if (diff <= 3) { statusColor = 'text-yellow-600'; statusText = `Due in ${diff} day(s)`; }

                return (
                  <div key={r.id} className={`flex items-center gap-3 bg-white border rounded-lg px-4 py-3 ${
                    !r.done && diff <= 0 ? 'border-red-200' : 'border-gray-100'
                  }`}>
                    <input
                      type="checkbox"
                      checked={r.done}
                      onChange={() => toggleReminder(r.id)}
                      className="w-4 h-4 accent-blue-600 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${r.done ? 'line-through text-gray-400' : 'text-gray-800'}`}>{r.title}</p>
                      <div className="flex gap-3 mt-0.5">
                        <span className="text-xs text-gray-400">{formatDate(r.date)}</span>
                        <span className={`text-xs font-medium ${statusColor}`}>{statusText}</span>
                        {r.amount && <span className="text-xs text-gray-500">₹{r.amount}</span>}
                      </div>
                    </div>
                    <button onClick={() => deleteReminder(r.id)} className="text-gray-300 hover:text-red-500 text-lg leading-none shrink-0">×</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-500">{transactions.length} transactions</p>
            {transactions.length > 0 && (
              <button onClick={clearAll} className="text-xs text-red-500 hover:underline">Clear all</button>
            )}
          </div>
          {transactions.length === 0 ? (
            <p className="text-gray-400 text-sm">No transactions yet. Go to Upload tab to import a CSV.</p>
          ) : (
            <div className="space-y-2">
              {transactions.map(t => (
                <div key={t.id} className="flex items-center gap-3 bg-white border border-gray-100 rounded-lg px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{maskAccount(t.description)}</p>
                    <p className="text-xs text-gray-400">{formatDate(t.date)}</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 shrink-0">₹{t.amount.toFixed(2)}</span>
                  <select
                    value={t.category}
                    onChange={e => updateCategory(t.id, e.target.value)}
                    className="text-xs border border-gray-200 rounded px-2 py-1 text-gray-700 bg-white"
                  >
                    {DEFAULT_CATEGORIES.map(c => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                  <button onClick={() => deleteTransaction(t.id)} className="text-gray-300 hover:text-red-500 text-lg leading-none">×</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Budgets Tab */}
      {activeTab === 'budgets' && (
        <div>
          <p className="text-sm text-gray-500 mb-6">Set a monthly limit per category. You'll get a warning when you exceed it.</p>
          <div className="space-y-3">
            {DEFAULT_CATEGORIES.map(cat => (
              <div key={cat.name} className="flex items-center gap-4 bg-white border border-gray-100 rounded-lg px-4 py-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{cat.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    cat.type === 'mandatory' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                  }`}>{cat.type}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm text-gray-500">₹</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="No limit"
                    value={budgets[cat.name] || ''}
                    onChange={e => setBudgets(prev => ({ ...prev, [cat.name]: Number(e.target.value) }))}
                    className="w-28 border border-gray-200 rounded px-2 py-1 text-sm text-gray-700"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Tab */}
      {activeTab === 'upload' && (
        <div>
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center">
            <p className="text-4xl mb-3">📂</p>
            <p className="text-gray-700 font-medium mb-1">Upload your bank statement CSV</p>
            <p className="text-sm text-gray-400 mb-4">Your file is read locally — never uploaded to any server</p>
            <label className="cursor-pointer bg-blue-600 text-white text-sm px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Choose CSV file
              <input type="file" accept=".csv" onChange={handleCSV} className="hidden" />
            </label>
          </div>
          <div className="mt-6 bg-gray-50 rounded-lg p-4 text-sm text-gray-500">
            <p className="font-medium text-gray-700 mb-2">Supported formats:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Most Indian bank CSV exports (HDFC, ICICI, SBI, Axis)</li>
              <li>Columns auto-detected: Date, Description, Amount</li>
              <li>Only debits/expenses are imported</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
