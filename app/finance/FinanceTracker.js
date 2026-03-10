'use client';

import { useState, useEffect, useCallback } from 'react';
import Papa from 'papaparse';

// ─── Constants ───────────────────────────────────────────────────────────────

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

const COINS = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
  { id: 'solana', symbol: 'SOL', name: 'Solana' },
  { id: 'binancecoin', symbol: 'BNB', name: 'BNB' },
  { id: 'ripple', symbol: 'XRP', name: 'XRP' },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano' },
  { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche' },
  { id: 'polkadot', symbol: 'DOT', name: 'Polkadot' },
  { id: 'matic-network', symbol: 'MATIC', name: 'Polygon' },
  { id: 'chainlink', symbol: 'LINK', name: 'Chainlink' },
  { id: 'litecoin', symbol: 'LTC', name: 'Litecoin' },
  { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin' },
  { id: 'shiba-inu', symbol: 'SHIB', name: 'Shiba Inu' },
  { id: 'tron', symbol: 'TRX', name: 'TRON' },
  { id: 'uniswap', symbol: 'UNI', name: 'Uniswap' },
  { id: 'cosmos', symbol: 'ATOM', name: 'Cosmos' },
  { id: 'stellar', symbol: 'XLM', name: 'Stellar' },
  { id: 'near', symbol: 'NEAR', name: 'NEAR Protocol' },
  { id: 'aptos', symbol: 'APT', name: 'Aptos' },
  { id: 'tether', symbol: 'USDT', name: 'Tether' },
  { id: 'usd-coin', symbol: 'USDC', name: 'USD Coin' },
];

const CRYPTO_TX_TYPES = [
  { value: 'buy', label: 'Buy', color: '#22c55e' },
  { value: 'sell', label: 'Sell', color: '#ef4444' },
  { value: 'transfer_in', label: 'Transfer In', color: '#3b82f6' },
  { value: 'transfer_out', label: 'Transfer Out', color: '#f97316' },
  { value: 'disbursement', label: 'Disbursement', color: '#a855f7' },
  { value: 'staking_reward', label: 'Staking Reward', color: '#eab308' },
  { value: 'unstake', label: 'Unstake', color: '#06b6d4' },
  { value: 'airdrop', label: 'Airdrop', color: '#ec4899' },
  { value: 'mining', label: 'Mining Reward', color: '#f59e0b' },
  { value: 'swap', label: 'Swap', color: '#8b5cf6' },
  { value: 'interest', label: 'Interest / Yield', color: '#10b981' },
  { value: 'nft_purchase', label: 'NFT Purchase', color: '#f43f5e' },
  { value: 'nft_sale', label: 'NFT Sale', color: '#84cc16' },
  { value: 'gas_fee', label: 'Gas Fee', color: '#6b7280' },
  { value: 'lost', label: 'Lost / Scam', color: '#dc2626' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function maskAccount(str) {
  if (!str) return '';
  return str.length > 4 ? '****' + str.slice(-4) : '****';
}
function today() { return new Date().toISOString().split('T')[0]; }
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
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}
function fmt(n) { return Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 }); }

const S = {
  dark: '#0a0f0a',
  card: '#111a11',
  border: '#1a2e1a',
  deep: '#0a150a',
  green: '#22c55e',
  greenDim: '#22c55e22',
  text: '#c8e6c8',
  muted: '#4b7a4b',
  faint: '#2d4a2d',
  red: '#ef4444',
  orange: '#f97316',
  yellow: '#eab308',
};

const input = {
  background: S.deep, border: `1px solid ${S.border}`, borderRadius: '8px',
  padding: '10px 14px', color: S.text, fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box',
};
const card = { background: S.card, border: `1px solid ${S.border}`, borderRadius: '14px', padding: '20px' };

// ─── Component ────────────────────────────────────────────────────────────────

export default function FinanceTracker() {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Finance state
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [reminders, setReminders] = useState([]);
  const [newReminder, setNewReminder] = useState({ title: '', date: today(), amount: '' });

  // Crypto state
  const [cryptoTxs, setCryptoTxs] = useState([]);
  const [prices, setPrices] = useState({});
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState('');
  const [newCryptoTx, setNewCryptoTx] = useState({
    date: today(), type: 'buy', coinId: 'bitcoin', quantity: '', pricePerUnit: '',
    toCoinId: '', toQuantity: '', wallet: '', notes: '', fees: '',
  });
  const [cryptoSubTab, setCryptoSubTab] = useState('portfolio');

  // Wallet state
  const [wallets, setWallets] = useState([]);
  const [newWallet, setNewWallet] = useState({ name: '', address: '', network: 'Ethereum', app: '' });
  const [revealedWallets, setRevealedWallets] = useState(new Set()); // NOT persisted — auto-hides on nav

  // Spending history state
  const [spendingHistory, setSpendingHistory] = useState([]);
  const [historyLabel, setHistoryLabel] = useState(() => {
    const d = new Date();
    return `${d.toLocaleString('default', { month: 'long' })} ${d.getFullYear()}`;
  });

  // Auto-hide all wallet reveals when tab changes
  useEffect(() => { setRevealedWallets(new Set()); }, [activeTab, cryptoSubTab]);

  // Load from localStorage
  useEffect(() => {
    const load = (key, set) => { const v = localStorage.getItem(key); if (v) set(JSON.parse(v)); };
    load('finance_transactions', setTransactions);
    load('finance_budgets', setBudgets);
    load('finance_notes', setNotes);
    load('finance_reminders', setReminders);
    load('crypto_txs', setCryptoTxs);
    load('finance_wallets', setWallets);
    load('finance_spending_history', setSpendingHistory);
  }, []);

  useEffect(() => { localStorage.setItem('finance_transactions', JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem('finance_budgets', JSON.stringify(budgets)); }, [budgets]);
  useEffect(() => { localStorage.setItem('finance_notes', JSON.stringify(notes)); }, [notes]);
  useEffect(() => { localStorage.setItem('finance_reminders', JSON.stringify(reminders)); }, [reminders]);
  useEffect(() => { localStorage.setItem('crypto_txs', JSON.stringify(cryptoTxs)); }, [cryptoTxs]);
  useEffect(() => { localStorage.setItem('finance_wallets', JSON.stringify(wallets)); }, [wallets]);
  useEffect(() => { localStorage.setItem('finance_spending_history', JSON.stringify(spendingHistory)); }, [spendingHistory]);

  // Fetch live prices
  const fetchPrices = useCallback(async () => {
    setPriceLoading(true);
    setPriceError('');
    try {
      const ids = COINS.map(c => c.id).join(',');
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=inr,usd&include_24hr_change=true`);
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setPrices(data);
    } catch {
      setPriceError('Could not fetch live prices. Showing last known data.');
    }
    setPriceLoading(false);
  }, []);

  useEffect(() => { if (activeTab === 'crypto') fetchPrices(); }, [activeTab, fetchPrices]);

  // ── Finance helpers ──────────────────────────────────────────────────────────

  function handleCSV(e) {
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: (results) => {
        const parsed = results.data.map((row, i) => {
          const keys = Object.keys(row);
          const dateKey = keys.find(k => /date/i.test(k));
          const descKey = keys.find(k => /desc|narration|particular|detail|memo/i.test(k));
          const amountKey = keys.find(k => /amount|debit|withdrawal/i.test(k));
          const amount = parseFloat((row[amountKey] || '0').replace(/[^0-9.-]/g, '')) || 0;
          return { id: Date.now() + i, date: row[dateKey] || '', description: row[descKey] || Object.values(row).join(' '), amount: Math.abs(amount), category: 'Other' };
        }).filter(t => t.amount > 0);
        setTransactions(prev => [...prev, ...parsed]);
        setActiveTab('transactions');
      },
    });
  }

  // ── Crypto helpers ────────────────────────────────────────────────────────────

  function addReminder() {
    if (!newReminder.title.trim() || !newReminder.date) return;
    setReminders(prev => [...prev, { id: Date.now(), ...newReminder, done: false }]);
    setNewReminder({ title: '', date: today(), amount: '' });
  }

  function addCryptoTx() {
    if (!newCryptoTx.quantity || !newCryptoTx.coinId) return;
    setCryptoTxs(prev => [...prev, { id: Date.now(), ...newCryptoTx }]);
    setNewCryptoTx({ date: today(), type: 'buy', coinId: 'bitcoin', quantity: '', pricePerUnit: '', toCoinId: '', toQuantity: '', wallet: '', notes: '', fees: '' });
  }

  // Compute portfolio holdings from transactions
  const portfolio = {};
  cryptoTxs.forEach(tx => {
    const coin = tx.coinId;
    if (!portfolio[coin]) portfolio[coin] = { qty: 0, totalCost: 0, disbursed: 0, staked: 0, rewards: 0 };
    const qty = parseFloat(tx.quantity) || 0;
    const price = parseFloat(tx.pricePerUnit) || 0;
    const fees = parseFloat(tx.fees) || 0;

    if (['buy', 'transfer_in', 'airdrop', 'mining', 'staking_reward', 'interest'].includes(tx.type)) {
      portfolio[coin].qty += qty;
      portfolio[coin].totalCost += qty * price + fees;
    }
    if (['sell', 'transfer_out', 'gas_fee', 'lost', 'nft_purchase'].includes(tx.type)) {
      portfolio[coin].qty -= qty;
    }
    if (tx.type === 'disbursement') {
      portfolio[coin].qty -= qty;
      portfolio[coin].disbursed += qty * price;
    }
    if (tx.type === 'staking_reward') portfolio[coin].rewards += qty;
    if (tx.type === 'swap' && tx.toCoinId) {
      portfolio[coin].qty -= qty;
      if (!portfolio[tx.toCoinId]) portfolio[tx.toCoinId] = { qty: 0, totalCost: 0, disbursed: 0, staked: 0, rewards: 0 };
      portfolio[tx.toCoinId].qty += parseFloat(tx.toQuantity) || 0;
    }
  });

  // Total portfolio value in INR
  let totalPortfolioINR = 0;
  let totalCostBasis = 0;
  Object.entries(portfolio).forEach(([coinId, h]) => {
    const priceINR = prices[coinId]?.inr || 0;
    totalPortfolioINR += h.qty * priceINR;
    totalCostBasis += h.totalCost;
  });
  const totalPnL = totalPortfolioINR - totalCostBasis;

  // Finance calculations
  const spending = {};
  transactions.forEach(t => { spending[t.category] = (spending[t.category] || 0) + t.amount; });
  const totalSpent = Object.values(spending).reduce((a, b) => a + b, 0);
  const mandatorySpent = transactions.filter(t => DEFAULT_CATEGORIES.find(c => c.name === t.category && c.type === 'mandatory')).reduce((a, t) => a + t.amount, 0);
  const unnecessarySpent = transactions.filter(t => DEFAULT_CATEGORIES.find(c => c.name === t.category && c.type === 'unnecessary')).reduce((a, t) => a + t.amount, 0);
  const budgetAlerts = Object.entries(budgets).filter(([cat, budget]) => budget > 0 && (spending[cat] || 0) > budget).map(([cat]) => cat);
  const reminderAlerts = reminders.filter(r => !r.done && daysDiff(r.date) <= 0);
  const upcomingReminders = reminders.filter(r => !r.done && daysDiff(r.date) > 0 && daysDiff(r.date) <= 3);

  const tabs = ['dashboard', 'crypto', 'history', 'notes', 'reminders', 'transactions', 'budgets', 'upload'];

  function saveSnapshot() {
    if (!historyLabel.trim()) return;
    const snap = {
      id: Date.now(),
      label: historyLabel,
      date: today(),
      total: totalSpent,
      mandatory: mandatorySpent,
      unnecessary: unnecessarySpent,
      breakdown: { ...spending },
      txCount: transactions.length,
    };
    setSpendingHistory(prev => [snap, ...prev]);
  }

  function addWallet() {
    if (!newWallet.name.trim() || !newWallet.address.trim()) return;
    setWallets(prev => [...prev, { id: Date.now(), ...newWallet }]);
    setNewWallet({ name: '', address: '', network: 'Ethereum', app: '' });
  }

  function toggleReveal(id) {
    setRevealedWallets(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div style={{ background: S.dark, minHeight: '100vh', color: S.text, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '40px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: S.green, boxShadow: `0 0 12px ${S.green}` }} />
            <span style={{ color: S.green, fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: 600 }}>Finance + Crypto Tracker</span>
          </div>
          <h1 style={{ fontSize: '34px', fontWeight: 700, color: '#f0fdf0', margin: 0, letterSpacing: '-0.5px' }}>Your Money, Private.</h1>
          <p style={{ color: S.muted, marginTop: '6px', fontSize: '13px' }}>All data stored locally — never leaves your device.</p>
        </div>

        {/* Alerts */}
        {(budgetAlerts.length > 0 || reminderAlerts.length > 0 || upcomingReminders.length > 0) && (
          <div style={{ marginBottom: '28px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {budgetAlerts.map(cat => (
              <div key={cat} style={{ background: '#ef444410', border: '1px solid #ef444430', borderRadius: '10px', padding: '12px 16px', display: 'flex', gap: '8px', color: '#fca5a5', fontSize: '13px' }}>
                ⚠️ <span><strong>{cat}</strong> — Over budget! ₹{fmt(spending[cat])} of ₹{budgets[cat]}</span>
              </div>
            ))}
            {reminderAlerts.map(r => (
              <div key={r.id} style={{ background: '#ef444410', border: '1px solid #ef444430', borderRadius: '10px', padding: '12px 16px', display: 'flex', gap: '8px', color: '#fca5a5', fontSize: '13px' }}>
                🔔 <span><strong>{r.title}</strong> — {daysDiff(r.date) === 0 ? 'Due today!' : `Overdue ${Math.abs(daysDiff(r.date))}d`} {r.amount && `· ₹${r.amount}`}</span>
              </div>
            ))}
            {upcomingReminders.map(r => (
              <div key={r.id} style={{ background: '#eab30810', border: '1px solid #eab30825', borderRadius: '10px', padding: '12px 16px', display: 'flex', gap: '8px', color: '#fde047', fontSize: '13px' }}>
                📅 <span><strong>{r.title}</strong> — Due in {daysDiff(r.date)}d {r.amount && `· ₹${r.amount}`}</span>
              </div>
            ))}
          </div>
        )}

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '32px', background: '#111a11', borderRadius: '12px', padding: '4px', overflowX: 'auto' }}>
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '8px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
              background: activeTab === tab ? S.green : 'transparent',
              color: activeTab === tab ? '#000' : S.muted, whiteSpace: 'nowrap', transition: 'all 0.15s',
              textTransform: 'capitalize', letterSpacing: '0.5px',
            }}>
              {tab === 'crypto' ? '₿ Crypto' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'reminders' && reminderAlerts.length > 0 && (
                <span style={{ marginLeft: '5px', background: S.red, color: '#fff', borderRadius: '10px', padding: '1px 5px', fontSize: '10px' }}>{reminderAlerts.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* ─── DASHBOARD ──────────────────────────────────────────────────────── */}
        {activeTab === 'dashboard' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px', marginBottom: '36px' }}>
              {[
                { label: 'Total Spent', value: `₹${fmt(totalSpent)}`, color: S.green },
                { label: 'Mandatory', value: `₹${fmt(mandatorySpent)}`, color: '#3b82f6' },
                { label: 'Unnecessary', value: `₹${fmt(unnecessarySpent)}`, color: S.orange },
              ].map(s => (
                <div key={s.label} style={{ ...card, boxShadow: `0 0 24px ${s.color}0d` }}>
                  <p style={{ color: S.muted, fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 8px' }}>{s.label}</p>
                  <p style={{ fontSize: '26px', fontWeight: 700, color: s.color, margin: 0 }}>{s.value}</p>
                </div>
              ))}
            </div>
            <p style={{ color: S.muted, fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '14px', fontWeight: 600 }}>Breakdown</p>
            {Object.keys(spending).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px 0', color: S.faint }}>
                <p style={{ fontSize: '36px', margin: '0 0 10px' }}>📂</p>
                <p>Upload a CSV to see spending breakdown.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {Object.entries(spending).sort((a, b) => b[1] - a[1]).map(([cat, amount]) => {
                  const budget = budgets[cat] || 0;
                  const over = budget > 0 && amount > budget;
                  const catInfo = DEFAULT_CATEGORIES.find(c => c.name === cat);
                  const barColor = over ? S.red : catInfo?.type === 'mandatory' ? S.green : S.orange;
                  return (
                    <div key={cat} style={card}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: budget > 0 ? '10px' : 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: barColor, boxShadow: `0 0 6px ${barColor}`, display: 'inline-block' }} />
                          <span style={{ fontSize: '14px', color: S.text, fontWeight: 500 }}>{cat}</span>
                          <span style={{ fontSize: '10px', color: catInfo?.type === 'mandatory' ? S.green : S.orange, background: catInfo?.type === 'mandatory' ? S.greenDim : '#f9731615', padding: '2px 7px', borderRadius: '5px' }}>{catInfo?.type}</span>
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: over ? S.red : S.text }}>
                          ₹{fmt(amount)}{budget > 0 && <span style={{ color: S.muted, fontWeight: 400, fontSize: '12px' }}> / ₹{budget}</span>}
                        </span>
                      </div>
                      {budget > 0 && (
                        <div style={{ background: S.deep, borderRadius: '4px', height: '3px' }}>
                          <div style={{ height: '100%', width: `${Math.min((amount/budget)*100,100)}%`, background: barColor, borderRadius: '4px', boxShadow: `0 0 6px ${barColor}` }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── CRYPTO ─────────────────────────────────────────────────────────── */}
        {activeTab === 'crypto' && (
          <div>
            {/* Crypto sub-tabs */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: '#0d160d', borderRadius: '10px', padding: '4px' }}>
              {['portfolio', 'prices', 'transactions', 'add', 'wallets'].map(st => (
                <button key={st} onClick={() => setCryptoSubTab(st)} style={{
                  padding: '7px 14px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                  background: cryptoSubTab === st ? '#22c55e33' : 'transparent',
                  color: cryptoSubTab === st ? S.green : S.muted, textTransform: 'capitalize',
                }}>
                  {st === 'add' ? '+ Add Transaction' : st.charAt(0).toUpperCase() + st.slice(1)}
                </button>
              ))}
              <div style={{ flex: 1 }} />
              <button onClick={fetchPrices} style={{ background: 'none', border: `1px solid ${S.border}`, borderRadius: '7px', padding: '6px 12px', color: S.muted, cursor: 'pointer', fontSize: '11px' }}>
                {priceLoading ? '⟳ Loading...' : '↻ Refresh Prices'}
              </button>
            </div>
            {priceError && <p style={{ color: S.yellow, fontSize: '12px', marginBottom: '16px' }}>⚠ {priceError}</p>}

            {/* Portfolio */}
            {cryptoSubTab === 'portfolio' && (
              <div>
                {/* Summary cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px', marginBottom: '28px' }}>
                  {[
                    { label: 'Portfolio Value', value: `₹${fmt(totalPortfolioINR)}`, color: S.green },
                    { label: 'Total Invested', value: `₹${fmt(totalCostBasis)}`, color: '#3b82f6' },
                    { label: totalPnL >= 0 ? 'Total Profit' : 'Total Loss', value: `${totalPnL >= 0 ? '+' : ''}₹${fmt(totalPnL)}`, color: totalPnL >= 0 ? S.green : S.red },
                  ].map(s => (
                    <div key={s.label} style={{ ...card, boxShadow: `0 0 20px ${s.color}0d` }}>
                      <p style={{ color: S.muted, fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 6px' }}>{s.label}</p>
                      <p style={{ fontSize: '22px', fontWeight: 700, color: s.color, margin: 0 }}>{s.value}</p>
                    </div>
                  ))}
                </div>

                {Object.keys(portfolio).filter(c => portfolio[c].qty > 0.000001).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '50px 0', color: S.faint }}>
                    <p style={{ fontSize: '36px', margin: '0 0 10px' }}>₿</p>
                    <p>No holdings yet. Add a Buy or Transfer In transaction.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {Object.entries(portfolio).filter(([,h]) => h.qty > 0.000001).map(([coinId, h]) => {
                      const coin = COINS.find(c => c.id === coinId);
                      const priceINR = prices[coinId]?.inr || 0;
                      const priceUSD = prices[coinId]?.usd || 0;
                      const change24h = prices[coinId]?.inr_24h_change || 0;
                      const currentValue = h.qty * priceINR;
                      const avgBuy = h.totalCost / h.qty;
                      const pnl = currentValue - h.totalCost;
                      const pnlPct = h.totalCost > 0 ? (pnl / h.totalCost) * 100 : 0;
                      return (
                        <div key={coinId} style={{ ...card, display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: S.greenDim, border: `1px solid ${S.green}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px', color: S.green, flexShrink: 0 }}>
                            {coin?.symbol || coinId.slice(0,3).toUpperCase()}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div>
                                <p style={{ color: S.text, fontWeight: 600, fontSize: '14px', margin: '0 0 2px' }}>{coin?.name || coinId}</p>
                                <p style={{ color: S.muted, fontSize: '12px', margin: 0 }}>{fmt(h.qty)} {coin?.symbol} · Avg ₹{fmt(avgBuy)}</p>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <p style={{ color: S.text, fontWeight: 600, fontSize: '14px', margin: '0 0 2px' }}>₹{fmt(currentValue)}</p>
                                <p style={{ color: pnl >= 0 ? S.green : S.red, fontSize: '12px', margin: 0, fontWeight: 600 }}>
                                  {pnl >= 0 ? '+' : ''}₹{fmt(pnl)} ({pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%)
                                </p>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '16px', marginTop: '8px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '11px', color: S.muted }}>Price: ₹{fmt(priceINR)} / ${fmt(priceUSD)}</span>
                              <span style={{ fontSize: '11px', color: change24h >= 0 ? S.green : S.red }}>24h: {change24h >= 0 ? '+' : ''}{change24h?.toFixed(2)}%</span>
                              {h.rewards > 0 && <span style={{ fontSize: '11px', color: S.yellow }}>Rewards: {fmt(h.rewards)} {coin?.symbol}</span>}
                              {h.disbursed > 0 && <span style={{ fontSize: '11px', color: '#a855f7' }}>Disbursed: ₹{fmt(h.disbursed)}</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Live Prices */}
            {cryptoSubTab === 'prices' && (
              <div>
                <p style={{ color: S.muted, fontSize: '12px', marginBottom: '20px' }}>Live prices from CoinGecko · Refresh to update</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '10px' }}>
                  {COINS.map(coin => {
                    const p = prices[coin.id];
                    const change = p?.inr_24h_change || 0;
                    return (
                      <div key={coin.id} style={{ ...card, display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: S.greenDim, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '11px', color: S.green, flexShrink: 0 }}>
                          {coin.symbol}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ color: S.text, fontSize: '13px', fontWeight: 600, margin: '0 0 2px' }}>{coin.name}</p>
                          <p style={{ color: S.muted, fontSize: '11px', margin: 0 }}>{p ? `₹${fmt(p.inr)}` : '—'}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ color: S.muted, fontSize: '11px', margin: '0 0 2px' }}>{p ? `$${fmt(p.usd)}` : '—'}</p>
                          <p style={{ color: change >= 0 ? S.green : S.red, fontSize: '11px', margin: 0, fontWeight: 600 }}>
                            {p ? `${change >= 0 ? '+' : ''}${change.toFixed(2)}%` : '—'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Transaction history */}
            {cryptoSubTab === 'transactions' && (
              <div>
                {cryptoTxs.length === 0 ? (
                  <p style={{ color: S.faint, textAlign: 'center', padding: '50px 0' }}>No crypto transactions yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[...cryptoTxs].reverse().map(tx => {
                      const coin = COINS.find(c => c.id === tx.coinId);
                      const txType = CRYPTO_TX_TYPES.find(t => t.value === tx.type);
                      const toCoin = COINS.find(c => c.id === tx.toCoinId);
                      return (
                        <div key={tx.id} style={{ ...card, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: txType?.color || S.green, background: `${txType?.color || S.green}18`, padding: '4px 10px', borderRadius: '6px', flexShrink: 0 }}>
                            {txType?.label || tx.type}
                          </span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ color: S.text, fontSize: '13px', fontWeight: 500, margin: '0 0 2px' }}>
                              {tx.quantity} {coin?.symbol || tx.coinId}
                              {tx.type === 'swap' && tx.toCoinId && ` → ${tx.toQuantity} ${toCoin?.symbol || tx.toCoinId}`}
                              {tx.pricePerUnit && ` @ ₹${fmt(tx.pricePerUnit)}`}
                            </p>
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                              <span style={{ color: S.faint, fontSize: '11px' }}>{formatDate(tx.date)}</span>
                              {tx.wallet && <span style={{ color: S.muted, fontSize: '11px' }}>Wallet: {tx.wallet}</span>}
                              {tx.fees && <span style={{ color: S.muted, fontSize: '11px' }}>Fee: ₹{tx.fees}</span>}
                              {tx.notes && <span style={{ color: S.muted, fontSize: '11px' }}>{tx.notes}</span>}
                            </div>
                          </div>
                          <button onClick={() => setCryptoTxs(prev => prev.filter(t => t.id !== tx.id))} style={{ background: 'none', border: 'none', color: S.faint, cursor: 'pointer', fontSize: '18px' }}>×</button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Add transaction form */}
            {cryptoSubTab === 'add' && (
              <div style={card}>
                <p style={{ color: S.green, fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '20px', fontWeight: 600 }}>New Crypto Transaction</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <p style={{ color: S.muted, fontSize: '11px', marginBottom: '6px', letterSpacing: '1px' }}>TYPE</p>
                    <select value={newCryptoTx.type} onChange={e => setNewCryptoTx(p => ({ ...p, type: e.target.value }))} style={{ ...input }}>
                      {CRYPTO_TX_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <p style={{ color: S.muted, fontSize: '11px', marginBottom: '6px', letterSpacing: '1px' }}>DATE</p>
                    <input type="date" value={newCryptoTx.date} onChange={e => setNewCryptoTx(p => ({ ...p, date: e.target.value }))} style={{ ...input }} />
                  </div>
                  <div>
                    <p style={{ color: S.muted, fontSize: '11px', marginBottom: '6px', letterSpacing: '1px' }}>COIN</p>
                    <select value={newCryptoTx.coinId} onChange={e => setNewCryptoTx(p => ({ ...p, coinId: e.target.value }))} style={{ ...input }}>
                      {COINS.map(c => <option key={c.id} value={c.id}>{c.name} ({c.symbol})</option>)}
                    </select>
                  </div>
                  <div>
                    <p style={{ color: S.muted, fontSize: '11px', marginBottom: '6px', letterSpacing: '1px' }}>QUANTITY</p>
                    <input type="number" placeholder="0.00" value={newCryptoTx.quantity} onChange={e => setNewCryptoTx(p => ({ ...p, quantity: e.target.value }))} style={{ ...input }} />
                  </div>
                  <div>
                    <p style={{ color: S.muted, fontSize: '11px', marginBottom: '6px', letterSpacing: '1px' }}>PRICE PER UNIT (₹)</p>
                    <input type="number" placeholder="0.00" value={newCryptoTx.pricePerUnit} onChange={e => setNewCryptoTx(p => ({ ...p, pricePerUnit: e.target.value }))} style={{ ...input }} />
                  </div>
                  <div>
                    <p style={{ color: S.muted, fontSize: '11px', marginBottom: '6px', letterSpacing: '1px' }}>FEES (₹)</p>
                    <input type="number" placeholder="0.00" value={newCryptoTx.fees} onChange={e => setNewCryptoTx(p => ({ ...p, fees: e.target.value }))} style={{ ...input }} />
                  </div>
                  {newCryptoTx.type === 'swap' && (<>
                    <div>
                      <p style={{ color: S.muted, fontSize: '11px', marginBottom: '6px', letterSpacing: '1px' }}>TO COIN</p>
                      <select value={newCryptoTx.toCoinId} onChange={e => setNewCryptoTx(p => ({ ...p, toCoinId: e.target.value }))} style={{ ...input }}>
                        {COINS.map(c => <option key={c.id} value={c.id}>{c.name} ({c.symbol})</option>)}
                      </select>
                    </div>
                    <div>
                      <p style={{ color: S.muted, fontSize: '11px', marginBottom: '6px', letterSpacing: '1px' }}>TO QUANTITY</p>
                      <input type="number" placeholder="0.00" value={newCryptoTx.toQuantity} onChange={e => setNewCryptoTx(p => ({ ...p, toQuantity: e.target.value }))} style={{ ...input }} />
                    </div>
                  </>)}
                  <div>
                    <p style={{ color: S.muted, fontSize: '11px', marginBottom: '6px', letterSpacing: '1px' }}>WALLET / EXCHANGE</p>
                    <input type="text" placeholder="e.g. Binance, Coinbase, MetaMask" value={newCryptoTx.wallet} onChange={e => setNewCryptoTx(p => ({ ...p, wallet: e.target.value }))} style={{ ...input }} />
                  </div>
                  <div>
                    <p style={{ color: S.muted, fontSize: '11px', marginBottom: '6px', letterSpacing: '1px' }}>NOTES</p>
                    <input type="text" placeholder="Optional note" value={newCryptoTx.notes} onChange={e => setNewCryptoTx(p => ({ ...p, notes: e.target.value }))} style={{ ...input }} />
                  </div>
                </div>
                {newCryptoTx.quantity && newCryptoTx.pricePerUnit && (
                  <div style={{ marginTop: '16px', padding: '12px 16px', background: S.deep, borderRadius: '8px', display: 'flex', gap: '20px' }}>
                    <span style={{ color: S.muted, fontSize: '12px' }}>Total: <strong style={{ color: S.green }}>₹{fmt(parseFloat(newCryptoTx.quantity) * parseFloat(newCryptoTx.pricePerUnit))}</strong></span>
                    {newCryptoTx.fees && <span style={{ color: S.muted, fontSize: '12px' }}>After fees: <strong style={{ color: S.text }}>₹{fmt(parseFloat(newCryptoTx.quantity) * parseFloat(newCryptoTx.pricePerUnit) + parseFloat(newCryptoTx.fees))}</strong></span>}
                  </div>
                )}
                <button onClick={addCryptoTx} style={{ marginTop: '18px', background: S.green, color: '#000', border: 'none', borderRadius: '8px', padding: '12px 24px', fontWeight: 700, cursor: 'pointer', fontSize: '14px', width: '100%' }}>
                  Add Transaction
                </button>
              </div>
            )}
            {/* ─── WALLETS sub-tab ─────────────────────────────────────────── */}
            {cryptoSubTab === 'wallets' && (
              <div>
                <p style={{ color: S.muted, fontSize: '13px', marginBottom: '20px' }}>Store your wallet addresses privately. Addresses are hidden by default and auto-hide when you leave this tab.</p>

                {/* Add wallet form */}
                <div style={{ ...card, marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <p style={{ color: S.green, fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', margin: 0, fontWeight: 600 }}>Add Wallet</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <p style={{ color: S.muted, fontSize: '11px', marginBottom: '6px', letterSpacing: '1px' }}>LABEL</p>
                      <input type="text" placeholder="e.g. My MetaMask" value={newWallet.name}
                        onChange={e => setNewWallet(p => ({ ...p, name: e.target.value }))} style={{ ...input }} />
                    </div>
                    <div>
                      <p style={{ color: S.muted, fontSize: '11px', marginBottom: '6px', letterSpacing: '1px' }}>NETWORK</p>
                      <select value={newWallet.network} onChange={e => setNewWallet(p => ({ ...p, network: e.target.value }))} style={{ ...input }}>
                        {['Ethereum','Bitcoin','Solana','BNB Chain','Polygon','Avalanche','Arbitrum','Optimism','Base','Tron','Cosmos','Other'].map(n => <option key={n}>{n}</option>)}
                      </select>
                    </div>
                    <div>
                      <p style={{ color: S.muted, fontSize: '11px', marginBottom: '6px', letterSpacing: '1px' }}>WALLET / EXCHANGE APP</p>
                      <input type="text" placeholder="e.g. MetaMask, Binance, Ledger" value={newWallet.app}
                        onChange={e => setNewWallet(p => ({ ...p, app: e.target.value }))} style={{ ...input }} />
                    </div>
                    <div>
                      <p style={{ color: S.muted, fontSize: '11px', marginBottom: '6px', letterSpacing: '1px' }}>WALLET ADDRESS</p>
                      <input type="text" placeholder="0x..." value={newWallet.address}
                        onChange={e => setNewWallet(p => ({ ...p, address: e.target.value }))} style={{ ...input }} />
                    </div>
                  </div>
                  <button onClick={addWallet} style={{ background: S.green, color: '#000', border: 'none', borderRadius: '8px', padding: '11px', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}>Save Wallet</button>
                </div>

                {/* Wallet list */}
                {wallets.length === 0 ? (
                  <p style={{ color: S.faint, textAlign: 'center', padding: '40px 0' }}>No wallets saved yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {wallets.map(w => {
                      const revealed = revealedWallets.has(w.id);
                      return (
                        <div key={w.id} style={{ ...card, display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: S.greenDim, border: `1px solid ${S.green}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
                            🔐
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              <p style={{ color: S.text, fontSize: '14px', fontWeight: 600, margin: 0 }}>{w.name}</p>
                              <span style={{ fontSize: '10px', color: S.green, background: S.greenDim, padding: '2px 7px', borderRadius: '5px' }}>{w.network}</span>
                              {w.app && <span style={{ fontSize: '10px', color: S.muted }}>{w.app}</span>}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <code style={{ fontSize: '12px', color: revealed ? S.green : S.faint, fontFamily: 'monospace', background: S.deep, padding: '4px 10px', borderRadius: '6px', letterSpacing: revealed ? '0.5px' : '2px' }}>
                                {revealed ? w.address : '••••••••••••••••••••••••••••••••••••••••'}
                              </code>
                              <button onClick={() => toggleReveal(w.id)} style={{ background: 'none', border: `1px solid ${S.border}`, borderRadius: '6px', padding: '3px 10px', color: revealed ? S.green : S.muted, cursor: 'pointer', fontSize: '11px', flexShrink: 0 }}>
                                {revealed ? '🙈 Hide' : '👁 Show'}
                              </button>
                            </div>
                          </div>
                          <button onClick={() => setWallets(p => p.filter(x => x.id !== w.id))} style={{ background: 'none', border: 'none', color: S.faint, cursor: 'pointer', fontSize: '18px', flexShrink: 0 }}>×</button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          </div>
        )}

        {/* ─── HISTORY ────────────────────────────────────────────────────────── */}
        {activeTab === 'history' && (
          <div>
            <div style={{ ...card, marginBottom: '28px' }}>
              <p style={{ color: S.green, fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 14px', fontWeight: 600 }}>Save Current Spending as Snapshot</p>
              <p style={{ color: S.muted, fontSize: '12px', margin: '0 0 14px' }}>This saves a snapshot of your current {transactions.length} transactions (₹{fmt(totalSpent)} total) for future reference.</p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="text" placeholder="Label e.g. March 2026" value={historyLabel}
                  onChange={e => setHistoryLabel(e.target.value)}
                  style={{ ...input, flex: 1 }} />
                <button onClick={saveSnapshot} disabled={transactions.length === 0}
                  style={{ background: transactions.length === 0 ? S.faint : S.green, color: '#000', border: 'none', borderRadius: '8px', padding: '0 20px', fontWeight: 700, cursor: transactions.length === 0 ? 'not-allowed' : 'pointer', fontSize: '14px', flexShrink: 0 }}>
                  Save
                </button>
              </div>
            </div>

            {spendingHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px 0', color: S.faint }}>
                <p style={{ fontSize: '36px', margin: '0 0 10px' }}>📊</p>
                <p>No history yet. Save a snapshot to start tracking over time.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {spendingHistory.map(snap => (
                  <div key={snap.id} style={{ ...card }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <div>
                        <p style={{ color: S.text, fontSize: '16px', fontWeight: 700, margin: '0 0 4px' }}>{snap.label}</p>
                        <p style={{ color: S.faint, fontSize: '11px', margin: 0 }}>Saved on {formatDate(snap.date)} · {snap.txCount} transactions</p>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ color: S.green, fontSize: '18px', fontWeight: 700, margin: 0 }}>₹{fmt(snap.total)}</p>
                          <p style={{ color: S.muted, fontSize: '11px', margin: 0 }}>total</p>
                        </div>
                        <button onClick={() => setSpendingHistory(p => p.filter(x => x.id !== snap.id))} style={{ background: 'none', border: 'none', color: S.faint, cursor: 'pointer', fontSize: '18px' }}>×</button>
                      </div>
                    </div>
                    {/* Mandatory vs Unnecessary */}
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
                      <div style={{ flex: 1, background: S.deep, borderRadius: '8px', padding: '10px 14px' }}>
                        <p style={{ color: '#3b82f6', fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 4px' }}>Mandatory</p>
                        <p style={{ color: S.text, fontSize: '15px', fontWeight: 600, margin: 0 }}>₹{fmt(snap.mandatory)}</p>
                      </div>
                      <div style={{ flex: 1, background: S.deep, borderRadius: '8px', padding: '10px 14px' }}>
                        <p style={{ color: S.orange, fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 4px' }}>Unnecessary</p>
                        <p style={{ color: S.text, fontSize: '15px', fontWeight: 600, margin: 0 }}>₹{fmt(snap.unnecessary)}</p>
                      </div>
                    </div>
                    {/* Category breakdown */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {Object.entries(snap.breakdown).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
                        <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: S.muted, fontSize: '12px' }}>{cat}</span>
                          <span style={{ color: S.text, fontSize: '12px', fontWeight: 500 }}>₹{fmt(amt)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── NOTES ──────────────────────────────────────────────────────────── */}
        {activeTab === 'notes' && (
          <div>
            <p style={{ color: S.muted, fontSize: '13px', marginBottom: '20px' }}>Jot down goals, observations, or anything finance-related.</p>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
              <textarea value={newNote} onChange={e => setNewNote(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (newNote.trim()) { setNotes(p => [...p, { id: Date.now(), text: newNote.trim(), createdAt: today() }]); setNewNote(''); } } }}
                placeholder="Write a note... (Enter to save)" rows={2}
                style={{ ...input, flex: 1, resize: 'none' }}
              />
              <button onClick={() => { if (newNote.trim()) { setNotes(p => [...p, { id: Date.now(), text: newNote.trim(), createdAt: today() }]); setNewNote(''); } }}
                style={{ background: S.green, color: '#000', border: 'none', borderRadius: '8px', padding: '0 18px', fontWeight: 600, cursor: 'pointer', fontSize: '14px', alignSelf: 'flex-start', height: '44px', flexShrink: 0 }}>Add</button>
            </div>
            {notes.length === 0 ? <p style={{ color: S.faint, textAlign: 'center', padding: '40px 0' }}>No notes yet.</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[...notes].reverse().map(note => (
                  <div key={note.id} style={{ ...card, display: 'flex', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: S.text, fontSize: '14px', margin: '0 0 6px', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{note.text}</p>
                      <p style={{ color: S.faint, fontSize: '11px', margin: 0 }}>{formatDate(note.createdAt)}</p>
                    </div>
                    <button onClick={() => setNotes(p => p.filter(n => n.id !== note.id))} style={{ background: 'none', border: 'none', color: S.faint, cursor: 'pointer', fontSize: '18px', lineHeight: 1, padding: 0 }}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── REMINDERS ──────────────────────────────────────────────────────── */}
        {activeTab === 'reminders' && (
          <div>
            <div style={{ ...card, marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input type="text" placeholder="Title — Pay rent, Netflix, EMI..." value={newReminder.title}
                onChange={e => setNewReminder(p => ({ ...p, title: e.target.value }))} style={{ ...input }} />
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ color: S.muted, fontSize: '11px', marginBottom: '6px', letterSpacing: '1px' }}>DUE DATE</p>
                  <input type="date" value={newReminder.date} onChange={e => setNewReminder(p => ({ ...p, date: e.target.value }))} style={{ ...input }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ color: S.muted, fontSize: '11px', marginBottom: '6px', letterSpacing: '1px' }}>AMOUNT (optional)</p>
                  <input type="number" placeholder="₹ 0" value={newReminder.amount} onChange={e => setNewReminder(p => ({ ...p, amount: e.target.value }))} style={{ ...input }} />
                </div>
              </div>
              <button onClick={addReminder} style={{ background: S.green, color: '#000', border: 'none', borderRadius: '8px', padding: '11px', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}>Add Reminder</button>
            </div>
            {reminders.length === 0 ? <p style={{ color: S.faint, textAlign: 'center', padding: '40px 0' }}>No reminders yet.</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[...reminders].sort((a, b) => new Date(a.date) - new Date(b.date)).map(r => {
                  const diff = daysDiff(r.date);
                  let sc = S.muted, st = `Due in ${diff}d`;
                  if (r.done) { sc = S.green; st = 'Done'; }
                  else if (diff < 0) { sc = S.red; st = `Overdue ${Math.abs(diff)}d`; }
                  else if (diff === 0) { sc = S.red; st = 'Due today!'; }
                  else if (diff <= 3) { sc = S.yellow; st = `Due in ${diff}d`; }
                  return (
                    <div key={r.id} style={{ ...card, display: 'flex', alignItems: 'center', gap: '12px', border: `1px solid ${!r.done && diff <= 0 ? '#ef444430' : S.border}` }}>
                      <input type="checkbox" checked={r.done} onChange={() => setReminders(p => p.map(x => x.id === r.id ? { ...x, done: !x.done } : x))}
                        style={{ width: '15px', height: '15px', accentColor: S.green, cursor: 'pointer', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ color: r.done ? S.faint : S.text, fontSize: '14px', fontWeight: 500, margin: '0 0 3px', textDecoration: r.done ? 'line-through' : 'none' }}>{r.title}</p>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <span style={{ color: S.faint, fontSize: '11px' }}>{formatDate(r.date)}</span>
                          <span style={{ color: sc, fontSize: '11px', fontWeight: 600 }}>{st}</span>
                          {r.amount && <span style={{ color: S.green, fontSize: '11px' }}>₹{r.amount}</span>}
                        </div>
                      </div>
                      <button onClick={() => setReminders(p => p.filter(x => x.id !== r.id))} style={{ background: 'none', border: 'none', color: S.faint, cursor: 'pointer', fontSize: '18px' }}>×</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── TRANSACTIONS ────────────────────────────────────────────────────── */}
        {activeTab === 'transactions' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <p style={{ color: S.muted, fontSize: '12px', margin: 0 }}>{transactions.length} transactions</p>
              {transactions.length > 0 && <button onClick={() => { if (confirm('Clear all?')) setTransactions([]); }} style={{ background: 'none', border: 'none', color: S.red, cursor: 'pointer', fontSize: '12px' }}>Clear all</button>}
            </div>
            {transactions.length === 0 ? <p style={{ color: S.faint, textAlign: 'center', padding: '50px 0' }}>No transactions. Go to Upload to import a CSV.</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {transactions.map(t => (
                  <div key={t.id} style={{ ...card, padding: '13px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: S.text, fontSize: '13px', fontWeight: 500, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{maskAccount(t.description)}</p>
                      <p style={{ color: S.faint, fontSize: '11px', margin: 0 }}>{formatDate(t.date)}</p>
                    </div>
                    <span style={{ color: S.green, fontWeight: 600, fontSize: '13px', flexShrink: 0 }}>₹{fmt(t.amount)}</span>
                    <select value={t.category} onChange={e => setTransactions(p => p.map(x => x.id === t.id ? { ...x, category: e.target.value } : x))}
                      style={{ background: S.deep, border: `1px solid ${S.border}`, borderRadius: '6px', padding: '4px 8px', color: S.muted, fontSize: '11px', cursor: 'pointer', outline: 'none' }}>
                      {DEFAULT_CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                    </select>
                    <button onClick={() => setTransactions(p => p.filter(x => x.id !== t.id))} style={{ background: 'none', border: 'none', color: S.faint, cursor: 'pointer', fontSize: '18px' }}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── BUDGETS ────────────────────────────────────────────────────────── */}
        {activeTab === 'budgets' && (
          <div>
            <p style={{ color: S.muted, fontSize: '13px', marginBottom: '20px' }}>Set monthly limits. You'll get alerts when exceeded.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {DEFAULT_CATEGORIES.map(cat => (
                <div key={cat.name} style={{ ...card, display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 18px' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: S.text, fontSize: '14px', fontWeight: 500, margin: '0 0 3px' }}>{cat.name}</p>
                    <span style={{ fontSize: '10px', color: cat.type === 'mandatory' ? S.green : S.orange, background: cat.type === 'mandatory' ? S.greenDim : '#f9731615', padding: '2px 7px', borderRadius: '5px' }}>{cat.type}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: S.green, fontSize: '14px' }}>₹</span>
                    <input type="number" min="0" placeholder="No limit" value={budgets[cat.name] || ''}
                      onChange={e => setBudgets(p => ({ ...p, [cat.name]: Number(e.target.value) }))}
                      style={{ width: '110px', background: S.deep, border: `1px solid ${S.border}`, borderRadius: '8px', padding: '8px 12px', color: S.text, fontSize: '13px', outline: 'none' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── UPLOAD ─────────────────────────────────────────────────────────── */}
        {activeTab === 'upload' && (
          <div>
            <label style={{ display: 'block', border: `2px dashed ${S.border}`, borderRadius: '16px', padding: '60px 20px', textAlign: 'center', cursor: 'pointer' }}>
              <p style={{ fontSize: '46px', margin: '0 0 14px' }}>📂</p>
              <p style={{ color: S.text, fontWeight: 600, fontSize: '16px', margin: '0 0 6px' }}>Upload Bank Statement CSV</p>
              <p style={{ color: S.faint, fontSize: '13px', margin: '0 0 20px' }}>Read locally — never sent to any server</p>
              <span style={{ background: S.green, color: '#000', padding: '10px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: 700 }}>Choose CSV File</span>
              <input type="file" accept=".csv" onChange={handleCSV} style={{ display: 'none' }} />
            </label>
            <div style={{ ...card, marginTop: '18px' }}>
              <p style={{ color: S.green, fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 12px', fontWeight: 600 }}>Supported Formats</p>
              {['HDFC, ICICI, SBI, Axis bank CSV exports', 'Auto-detects: Date, Description, Amount columns', 'Only debit/expense entries are imported'].map(item => (
                <p key={item} style={{ color: S.muted, fontSize: '13px', margin: '5px 0', display: 'flex', gap: '8px' }}>
                  <span style={{ color: S.green }}>✓</span>{item}
                </p>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
