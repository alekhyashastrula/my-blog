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

const LOAN_TYPES = [
  { value: 'home_loan', label: 'Home Loan', icon: '🏠', color: '#3b82f6' },
  { value: 'car_loan', label: 'Car Loan', icon: '🚗', color: '#f97316' },
  { value: 'personal_loan', label: 'Personal Loan', icon: '💼', color: '#8b5cf6' },
  { value: 'education_loan', label: 'Education Loan', icon: '🎓', color: '#06b6d4' },
  { value: 'business_loan', label: 'Business Loan', icon: '🏢', color: '#10b981' },
  { value: 'gold_loan', label: 'Gold Loan', icon: '🪙', color: '#f59e0b' },
  { value: 'credit_card', label: 'Credit Card EMI', icon: '💳', color: '#ec4899' },
  { value: 'two_wheeler', label: 'Two Wheeler Loan', icon: '🏍️', color: '#84cc16' },
  { value: 'other', label: 'Other Loan', icon: '📋', color: '#64748b' },
];

const BANKS = [
  'SBI','HDFC Bank','ICICI Bank','Axis Bank','Kotak Mahindra','Bank of Baroda',
  'Punjab National Bank','Canara Bank','Union Bank','IDFC FIRST Bank','IndusInd Bank',
  'Yes Bank','Federal Bank','South Indian Bank','HSBC','Citibank','Standard Chartered','Other',
];

const CRYPTO_TX_TYPES = [
  { value: 'buy', label: 'Buy', color: '#10b981' },
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

// ─── Tab accent colours ───────────────────────────────────────────────────────

const TAB_COLORS = {
  dashboard: '#3b82f6',
  crypto: '#8b5cf6',
  history: '#06b6d4',
  notes: '#ec4899',
  reminders: '#f59e0b',
  transactions: '#10b981',
  budgets: '#f97316',
  upload: '#f43f5e',
  loans: '#f43f5e',
};

// ─── Coin icon colours ────────────────────────────────────────────────────────

const COIN_COLORS = {
  bitcoin: '#f7931a', ethereum: '#627eea', solana: '#9945ff',
  binancecoin: '#f3ba2f', ripple: '#346aa9', cardano: '#0033ad',
  'avalanche-2': '#e84142', polkadot: '#e6007a', 'matic-network': '#8247e5',
  chainlink: '#2a5ada', litecoin: '#bfbbbb', dogecoin: '#c2a633',
  'shiba-inu': '#ff5b00', tron: '#ff0013', uniswap: '#ff007a',
  cosmos: '#6f7390', stellar: '#14b6e7', near: '#00c08b',
  aptos: '#4fc4f9', tether: '#26a17b', 'usd-coin': '#2775ca',
};

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

// ─── Design tokens ────────────────────────────────────────────────────────────

const S = {
  bg: '#0d0d14',
  card: '#13131e',
  cardAlt: '#18182a',
  border: '#252535',
  deep: '#09090f',

  blue: '#3b82f6',
  purple: '#8b5cf6',
  emerald: '#10b981',
  cyan: '#06b6d4',
  pink: '#ec4899',
  amber: '#f59e0b',
  orange: '#f97316',
  red: '#ef4444',
  rose: '#f43f5e',
  yellow: '#eab308',

  text: '#e2e8f0',
  textDim: '#94a3b8',
  muted: '#64748b',
  faint: '#2a2a3d',
};

const input = {
  background: S.deep,
  border: `1px solid ${S.border}`,
  borderRadius: '10px',
  padding: '10px 14px',
  color: S.text,
  fontSize: '14px',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};

const card = {
  background: S.card,
  border: `1px solid ${S.border}`,
  borderRadius: '16px',
  padding: '20px',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function FinanceTracker() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashMonth, setDashMonth] = useState(() => today().slice(0, 7));

  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [newTx, setNewTx] = useState({ date: today(), description: '', amount: '', category: 'Other' });
  const [reminders, setReminders] = useState([]);
  const [newReminder, setNewReminder] = useState({ title: '', date: today(), amount: '' });

  // Loans state
  const [loans, setLoans] = useState([]);
  const [loanSubTab, setLoanSubTab] = useState('overview');
  const [expandedLoan, setExpandedLoan] = useState(null);
  const [newLoan, setNewLoan] = useState({
    name: '', bank: 'HDFC Bank', type: 'home_loan', accountNo: '',
    totalAmount: '', emiAmount: '', interestRate: '', tenureMonths: '',
    startDate: today(), emiDueDay: '5', notes: '',
  });

  const [cryptoTxs, setCryptoTxs] = useState([]);
  const [prices, setPrices] = useState({});
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState('');
  const [newCryptoTx, setNewCryptoTx] = useState({
    date: today(), type: 'buy', coinId: 'bitcoin', quantity: '', pricePerUnit: '',
    toCoinId: '', toQuantity: '', wallet: '', notes: '', fees: '',
  });
  const [cryptoSubTab, setCryptoSubTab] = useState('portfolio');

  const [wallets, setWallets] = useState([]);
  const [newWallet, setNewWallet] = useState({ name: '', addresses: [''], network: 'Ethereum', app: '' });
  const [revealedWallets, setRevealedWallets] = useState(new Set());

  const [spendingHistory, setSpendingHistory] = useState([]);
  const [historyLabel, setHistoryLabel] = useState(() => {
    const d = new Date();
    return `${d.toLocaleString('default', { month: 'long' })} ${d.getFullYear()}`;
  });

  const [bankBalance, setBankBalance] = useState('');
  const [balancePin, setBalancePin] = useState('');
  const [balanceRevealed, setBalanceRevealed] = useState(false);
  const [pinModal, setPinModal] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinError, setPinError] = useState('');
  const [pendingBalance, setPendingBalance] = useState('');

  useEffect(() => { setRevealedWallets(new Set()); setBalanceRevealed(false); }, [activeTab, cryptoSubTab]);

  useEffect(() => {
    const load = (key, set) => { const v = localStorage.getItem(key); if (v) set(JSON.parse(v)); };
    load('finance_transactions', setTransactions);
    load('finance_budgets', setBudgets);
    load('finance_notes', setNotes);
    load('finance_reminders', setReminders);
    load('crypto_txs', setCryptoTxs);
    load('finance_wallets', setWallets);
    load('finance_spending_history', setSpendingHistory);
    load('finance_loans', setLoans);
    const pin = localStorage.getItem('finance_balance_pin');
    if (pin) setBalancePin(pin);
    const bal = localStorage.getItem('finance_bank_balance');
    if (bal) setBankBalance(bal);
  }, []);

  useEffect(() => { localStorage.setItem('finance_transactions', JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem('finance_budgets', JSON.stringify(budgets)); }, [budgets]);
  useEffect(() => { localStorage.setItem('finance_notes', JSON.stringify(notes)); }, [notes]);
  useEffect(() => { localStorage.setItem('finance_reminders', JSON.stringify(reminders)); }, [reminders]);
  useEffect(() => { localStorage.setItem('crypto_txs', JSON.stringify(cryptoTxs)); }, [cryptoTxs]);
  useEffect(() => { localStorage.setItem('finance_wallets', JSON.stringify(wallets)); }, [wallets]);
  useEffect(() => { localStorage.setItem('finance_spending_history', JSON.stringify(spendingHistory)); }, [spendingHistory]);
  useEffect(() => { localStorage.setItem('finance_bank_balance', bankBalance); }, [bankBalance]);
  useEffect(() => { if (balancePin) localStorage.setItem('finance_balance_pin', balancePin); }, [balancePin]);
  useEffect(() => { localStorage.setItem('finance_loans', JSON.stringify(loans)); }, [loans]);

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

  // ── Loan helpers ──────────────────────────────────────────────────────────────

  function addLoan() {
    if (!newLoan.name.trim() || !newLoan.totalAmount || !newLoan.emiAmount || !newLoan.tenureMonths) return;
    setLoans(prev => [...prev, { id: Date.now(), ...newLoan, payments: [] }]);
    setNewLoan({ name: '', bank: 'HDFC Bank', type: 'home_loan', accountNo: '', totalAmount: '', emiAmount: '', interestRate: '', tenureMonths: '', startDate: today(), emiDueDay: '5', notes: '' });
    setLoanSubTab('overview');
  }

  function markEmiPaid(loanId, month, amount) {
    setLoans(prev => prev.map(l => {
      if (l.id !== loanId) return l;
      const alreadyPaid = l.payments.some(p => p.month === month);
      if (alreadyPaid) return l;
      return { ...l, payments: [...l.payments, { id: Date.now(), month, date: today(), amount: amount || l.emiAmount }] };
    }));
  }

  function undoEmiPayment(loanId, month) {
    setLoans(prev => prev.map(l => l.id !== loanId ? l : { ...l, payments: l.payments.filter(p => p.month !== month) }));
  }

  function getLoanStats(loan) {
    const tenure = parseInt(loan.tenureMonths) || 0;
    const emi = parseFloat(loan.emiAmount) || 0;
    const principal = parseFloat(loan.totalAmount) || 0;
    const rate = parseFloat(loan.interestRate) || 0;
    const paidCount = loan.payments.length;
    const remainingEMIs = Math.max(0, tenure - paidCount);
    const totalPayable = emi * tenure;
    const totalInterest = totalPayable - principal;
    const paidAmount = emi * paidCount;
    const remainingAmount = emi * remainingEMIs;
    const progressPct = tenure > 0 ? (paidCount / tenure) * 100 : 0;
    // Next due date
    const dueDay = parseInt(loan.emiDueDay) || 5;
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const currentMonthPaid = loan.payments.some(p => p.month === currentMonth);
    let nextDue = new Date(now.getFullYear(), now.getMonth(), dueDay);
    if (now.getDate() > dueDay || currentMonthPaid) nextDue = new Date(now.getFullYear(), now.getMonth() + 1, dueDay);
    const daysToNext = Math.ceil((nextDue - now) / (1000 * 60 * 60 * 24));
    return { tenure, emi, principal, rate, paidCount, remainingEMIs, totalPayable, totalInterest, paidAmount, remainingAmount, progressPct, currentMonth, currentMonthPaid, nextDue, daysToNext };
  }

  // EMI due alerts — loans where this month's EMI not yet paid
  const emiDueAlerts = loans.filter(l => {
    const stats = getLoanStats(l);
    return !stats.currentMonthPaid && stats.remainingEMIs > 0;
  });

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

  let totalPortfolioINR = 0;
  let totalCostBasis = 0;
  Object.entries(portfolio).forEach(([coinId, h]) => {
    const priceINR = prices[coinId]?.inr || 0;
    totalPortfolioINR += h.qty * priceINR;
    totalCostBasis += h.totalCost;
  });
  const totalPnL = totalPortfolioINR - totalCostBasis;

  const filteredTxs = dashMonth
    ? transactions.filter(t => {
        const d = new Date(t.date);
        if (isNaN(d)) return false;
        const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        return ym === dashMonth;
      })
    : transactions;
  const spending = {};
  filteredTxs.forEach(t => { spending[t.category] = (spending[t.category] || 0) + t.amount; });
  const totalSpent = Object.values(spending).reduce((a, b) => a + b, 0);
  const mandatorySpent = filteredTxs.filter(t => DEFAULT_CATEGORIES.find(c => c.name === t.category && c.type === 'mandatory')).reduce((a, t) => a + t.amount, 0);
  const unnecessarySpent = filteredTxs.filter(t => DEFAULT_CATEGORIES.find(c => c.name === t.category && c.type === 'unnecessary')).reduce((a, t) => a + t.amount, 0);
  const budgetAlerts = Object.entries(budgets).filter(([cat, budget]) => budget > 0 && (spending[cat] || 0) > budget).map(([cat]) => cat);
  const reminderAlerts = reminders.filter(r => !r.done && daysDiff(r.date) <= 0);
  const upcomingReminders = reminders.filter(r => !r.done && daysDiff(r.date) > 0 && daysDiff(r.date) <= 3);

  const tabs = ['dashboard', 'loans', 'crypto', 'history', 'notes', 'reminders', 'transactions', 'budgets', 'upload'];

  function saveSnapshot() {
    if (!historyLabel.trim()) return;
    const snap = {
      id: Date.now(), label: historyLabel, date: today(),
      total: totalSpent, mandatory: mandatorySpent, unnecessary: unnecessarySpent,
      breakdown: { ...spending }, txCount: transactions.length,
    };
    setSpendingHistory(prev => [snap, ...prev]);
  }

  function addWallet() {
    const validAddresses = newWallet.addresses.filter(a => a.trim());
    if (!newWallet.name.trim() || validAddresses.length === 0) return;
    setWallets(prev => [...prev, { id: Date.now(), name: newWallet.name, network: newWallet.network, app: newWallet.app, addresses: validAddresses }]);
    setNewWallet({ name: '', addresses: [''], network: 'Ethereum', app: '' });
  }

  function toggleReveal(id) {
    setRevealedWallets(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function openBalanceModal() {
    setPinInput(''); setPinConfirm(''); setPinError('');
    setPinModal(balancePin ? 'unlock' : 'set');
  }

  function submitUnlock() {
    if (pinInput === balancePin) {
      setBalanceRevealed(true); setPinModal(''); setPinInput(''); setPinError('');
    } else {
      setPinError('Incorrect PIN. Try again.');
    }
  }

  function submitSetPin() {
    if (pinInput.length < 4) { setPinError('PIN must be at least 4 digits.'); return; }
    if (pinInput !== pinConfirm) { setPinError('PINs do not match.'); return; }
    setBalancePin(pinInput); setBalanceRevealed(true); setPinModal('');
    setPinInput(''); setPinConfirm(''); setPinError('');
  }

  function submitEditBalance() {
    setBankBalance(pendingBalance); setPinModal(''); setPendingBalance('');
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div style={{ background: S.bg, minHeight: '100vh', color: S.text, fontFamily: 'system-ui, sans-serif' }}>

      {/* ── PIN MODAL ──────────────────────────────────────────────────────────── */}
      {pinModal && (
        <div style={{ position: 'fixed', inset: 0, background: '#00000099', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(6px)' }}
          onClick={e => { if (e.target === e.currentTarget) { setPinModal(''); setPinInput(''); setPinConfirm(''); setPinError(''); } }}>
          <div style={{ ...card, width: '340px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: `0 0 60px ${S.purple}33, 0 24px 48px #00000080`, border: `1px solid ${S.purple}44` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${S.purple}22`, border: `1px solid ${S.purple}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                {pinModal === 'edit_balance' ? '💰' : pinModal === 'unlock' ? '🔓' : '🔐'}
              </div>
              <p style={{ color: S.text, fontSize: '15px', fontWeight: 700, margin: 0 }}>
                {pinModal === 'set' ? 'Set Balance PIN' : pinModal === 'unlock' ? 'Enter PIN to View' : pinModal === 'change' ? 'Change PIN' : 'Update Bank Balance'}
              </p>
            </div>

            {pinModal === 'edit_balance' ? (
              <>
                <p style={{ color: S.muted, fontSize: '13px', margin: 0 }}>Enter your current bank balance manually.</p>
                <input type="number" placeholder="e.g. 125000" value={pendingBalance}
                  onChange={e => setPendingBalance(e.target.value)} autoFocus
                  onKeyDown={e => e.key === 'Enter' && submitEditBalance()}
                  style={{ ...input }} />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => { setPinModal(''); setPendingBalance(''); }} style={{ flex: 1, background: S.faint, border: `1px solid ${S.border}`, borderRadius: '10px', padding: '10px', color: S.muted, cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                  <button onClick={submitEditBalance} style={{ flex: 1, background: `linear-gradient(135deg, ${S.blue}, ${S.purple})`, border: 'none', borderRadius: '10px', padding: '10px', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>Save Balance</button>
                </div>
              </>
            ) : (
              <>
                <input type="password" inputMode="numeric" maxLength={8} placeholder="Enter PIN"
                  value={pinInput} onChange={e => { setPinInput(e.target.value); setPinError(''); }} autoFocus
                  onKeyDown={e => e.key === 'Enter' && (pinModal === 'unlock' ? submitUnlock() : null)}
                  style={{ ...input, letterSpacing: '8px', textAlign: 'center', fontSize: '22px' }} />
                {(pinModal === 'set' || pinModal === 'change') && (
                  <input type="password" inputMode="numeric" maxLength={8} placeholder="Confirm PIN"
                    value={pinConfirm} onChange={e => { setPinConfirm(e.target.value); setPinError(''); }}
                    onKeyDown={e => e.key === 'Enter' && submitSetPin()}
                    style={{ ...input, letterSpacing: '8px', textAlign: 'center', fontSize: '22px' }} />
                )}
                {pinError && <p style={{ color: S.red, fontSize: '12px', margin: 0, background: `${S.red}15`, padding: '8px 12px', borderRadius: '8px' }}>{pinError}</p>}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => { setPinModal(''); setPinInput(''); setPinConfirm(''); setPinError(''); }} style={{ flex: 1, background: S.faint, border: `1px solid ${S.border}`, borderRadius: '10px', padding: '10px', color: S.muted, cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                  <button onClick={pinModal === 'unlock' ? submitUnlock : submitSetPin} style={{ flex: 1, background: `linear-gradient(135deg, ${S.blue}, ${S.purple})`, border: 'none', borderRadius: '10px', padding: '10px', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>
                    {pinModal === 'unlock' ? 'Unlock' : 'Set PIN'}
                  </button>
                </div>
                {pinModal === 'unlock' && balancePin && (
                  <button onClick={() => { setPinModal('change'); setPinInput(''); setPinConfirm(''); setPinError(''); }}
                    style={{ background: 'none', border: 'none', color: S.muted, cursor: 'pointer', fontSize: '12px', textDecoration: 'underline' }}>
                    Change PIN
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <div style={{ maxWidth: '980px', margin: '0 auto', padding: '44px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: '44px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: `linear-gradient(135deg, ${S.blue}, ${S.purple})`, boxShadow: `0 0 14px ${S.blue}` }} />
            <span style={{ background: `linear-gradient(90deg, ${S.blue}, ${S.purple})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: 700 }}>
              Finance + Crypto Tracker
            </span>
          </div>
          <h1 style={{ fontSize: '36px', fontWeight: 800, color: S.text, margin: 0, letterSpacing: '-0.5px' }}>
            Your Money,{' '}
            <span style={{ background: `linear-gradient(90deg, ${S.blue}, ${S.purple})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Private.</span>
          </h1>
          <p style={{ color: S.muted, marginTop: '8px', fontSize: '13px' }}>All data stored locally — never leaves your device.</p>
        </div>

        {/* Alerts */}
        {(budgetAlerts.length > 0 || reminderAlerts.length > 0 || upcomingReminders.length > 0 || emiDueAlerts.length > 0) && (
          <div style={{ marginBottom: '28px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {budgetAlerts.map(cat => (
              <div key={cat} style={{ background: `${S.red}12`, border: `1px solid ${S.red}30`, borderRadius: '12px', padding: '12px 16px', display: 'flex', gap: '10px', color: '#fca5a5', fontSize: '13px', alignItems: 'center' }}>
                <span style={{ fontSize: '16px' }}>⚠️</span>
                <span><strong>{cat}</strong> — Over budget! ₹{fmt(spending[cat])} of ₹{budgets[cat]}</span>
              </div>
            ))}
            {reminderAlerts.map(r => (
              <div key={r.id} style={{ background: `${S.red}12`, border: `1px solid ${S.red}30`, borderRadius: '12px', padding: '12px 16px', display: 'flex', gap: '10px', color: '#fca5a5', fontSize: '13px', alignItems: 'center' }}>
                <span style={{ fontSize: '16px' }}>🔔</span>
                <span><strong>{r.title}</strong> — {daysDiff(r.date) === 0 ? 'Due today!' : `Overdue ${Math.abs(daysDiff(r.date))}d`} {r.amount && `· ₹${r.amount}`}</span>
              </div>
            ))}
            {upcomingReminders.map(r => (
              <div key={r.id} style={{ background: `${S.amber}12`, border: `1px solid ${S.amber}30`, borderRadius: '12px', padding: '12px 16px', display: 'flex', gap: '10px', color: '#fde047', fontSize: '13px', alignItems: 'center' }}>
                <span style={{ fontSize: '16px' }}>📅</span>
                <span><strong>{r.title}</strong> — Due in {daysDiff(r.date)}d {r.amount && `· ₹${r.amount}`}</span>
              </div>
            ))}
            {emiDueAlerts.map(l => {
              const lt = LOAN_TYPES.find(t => t.value === l.type);
              return (
                <div key={l.id} style={{ background: `${S.rose}12`, border: `1px solid ${S.rose}35`, borderRadius: '12px', padding: '12px 16px', display: 'flex', gap: '10px', color: '#fda4af', fontSize: '13px', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ fontSize: '16px' }}>{lt?.icon || '💳'}</span>
                    <span><strong>{l.name}</strong> — EMI due this month · ₹{fmt(parseFloat(l.emiAmount))}</span>
                  </div>
                  <button onClick={() => markEmiPaid(l.id, `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}`, l.emiAmount)}
                    style={{ background: `${S.emerald}20`, border: `1px solid ${S.emerald}40`, borderRadius: '8px', padding: '4px 12px', color: S.emerald, cursor: 'pointer', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                    ✓ Mark Paid
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: '3px', marginBottom: '32px', background: S.deep, borderRadius: '14px', padding: '5px', overflowX: 'auto', border: `1px solid ${S.border}` }}>
          {tabs.map(tab => {
            const tabColor = TAB_COLORS[tab] || S.blue;
            const isActive = activeTab === tab;
            return (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                padding: '8px 14px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                background: isActive ? `${tabColor}20` : 'transparent',
                color: isActive ? tabColor : S.muted,
                whiteSpace: 'nowrap', transition: 'all 0.15s',
                textTransform: 'capitalize', letterSpacing: '0.4px',
                boxShadow: isActive ? `0 0 16px ${tabColor}18` : 'none',
              }}>
                {tab === 'crypto' ? '₿ Crypto' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                {tab === 'reminders' && reminderAlerts.length > 0 && (
                  <span style={{ marginLeft: '5px', background: S.red, color: '#fff', borderRadius: '10px', padding: '1px 5px', fontSize: '10px' }}>{reminderAlerts.length}</span>
                )}
                {tab === 'loans' && emiDueAlerts.length > 0 && (
                  <span style={{ marginLeft: '5px', background: S.rose, color: '#fff', borderRadius: '10px', padding: '1px 5px', fontSize: '10px' }}>{emiDueAlerts.length}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* ─── DASHBOARD ──────────────────────────────────────────────────────── */}
        {activeTab === 'dashboard' && (
          <div>
            {/* Balance Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '28px' }}>
              {/* Bank Balance */}
              <div style={{ background: 'linear-gradient(135deg, #0d1929 0%, #132040 100%)', border: `1px solid ${S.blue}33`, borderRadius: '18px', padding: '24px', boxShadow: `0 0 40px ${S.blue}15`, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '130px', height: '130px', borderRadius: '50%', background: `${S.blue}10` }} />
                <div style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '12px' }}>
                        <span style={{ fontSize: '18px' }}>🏦</span>
                        <p style={{ color: S.blue, fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase', margin: 0, fontWeight: 700 }}>Bank Balance</p>
                      </div>
                      <p style={{ fontSize: '28px', fontWeight: 800, color: S.text, margin: 0, letterSpacing: balanceRevealed ? 'normal' : '5px' }}>
                        {balanceRevealed ? (bankBalance ? `₹${fmt(parseFloat(bankBalance))}` : <span style={{ color: S.muted, fontSize: '14px', fontWeight: 500 }}>Not set</span>) : '••••••••'}
                      </p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                      <button onClick={balanceRevealed ? () => setBalanceRevealed(false) : openBalanceModal}
                        style={{ background: `${S.blue}20`, border: `1px solid ${S.blue}44`, borderRadius: '8px', padding: '5px 12px', color: S.blue, cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}>
                        {balanceRevealed ? '🙈 Hide' : '👁 Show'}
                      </button>
                      {balanceRevealed && (
                        <button onClick={() => { setPendingBalance(bankBalance); setPinModal('edit_balance'); }}
                          style={{ background: `${S.blue}12`, border: `1px solid ${S.blue}30`, borderRadius: '8px', padding: '4px 10px', color: S.textDim, cursor: 'pointer', fontSize: '10px' }}>
                          ✏️ Edit
                        </button>
                      )}
                    </div>
                  </div>
                  {balanceRevealed && !balancePin && (
                    <button onClick={() => { setPinInput(''); setPinConfirm(''); setPinError(''); setPinModal('set'); }}
                      style={{ marginTop: '12px', background: 'none', border: 'none', color: `${S.blue}80`, cursor: 'pointer', fontSize: '11px', padding: 0, textDecoration: 'underline' }}>
                      + Set PIN to protect balances
                    </button>
                  )}
                </div>
              </div>

              {/* Crypto Portfolio */}
              <div style={{ background: 'linear-gradient(135deg, #130d28 0%, #1e1040 100%)', border: `1px solid ${S.purple}33`, borderRadius: '18px', padding: '24px', boxShadow: `0 0 40px ${S.purple}15`, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '130px', height: '130px', borderRadius: '50%', background: `${S.purple}10` }} />
                <div style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '12px' }}>
                        <span style={{ fontSize: '18px' }}>₿</span>
                        <p style={{ color: S.purple, fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase', margin: 0, fontWeight: 700 }}>Crypto Portfolio</p>
                      </div>
                      <p style={{ fontSize: '28px', fontWeight: 800, color: S.text, margin: 0, letterSpacing: balanceRevealed ? 'normal' : '5px' }}>
                        {balanceRevealed ? `₹${fmt(totalPortfolioINR)}` : '••••••••'}
                      </p>
                      {balanceRevealed && totalPnL !== 0 && (
                        <p style={{ color: totalPnL >= 0 ? S.emerald : S.red, fontSize: '13px', margin: '6px 0 0', fontWeight: 700 }}>
                          {totalPnL >= 0 ? '▲' : '▼'} {totalPnL >= 0 ? '+' : ''}₹{fmt(totalPnL)} P&L
                        </p>
                      )}
                    </div>
                    <button onClick={balanceRevealed ? () => setBalanceRevealed(false) : openBalanceModal}
                      style={{ background: `${S.purple}20`, border: `1px solid ${S.purple}44`, borderRadius: '8px', padding: '5px 12px', color: S.purple, cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}>
                      {balanceRevealed ? '🙈 Hide' : '👁 Show'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Loans summary on dashboard */}
            {loans.length > 0 && (() => {
              const totalOutstanding = loans.reduce((sum, l) => sum + getLoanStats(l).remainingAmount, 0);
              const totalEMI = loans.reduce((sum, l) => sum + (parseFloat(l.emiAmount) || 0), 0);
              return (
                <div style={{ background: 'linear-gradient(135deg, #1f0a14 0%, #2d0e1e 100%)', border: `1px solid ${S.rose}30`, borderRadius: '18px', padding: '20px', marginBottom: '16px', boxShadow: `0 0 30px ${S.rose}10` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '16px' }}>🏦</span>
                      <span style={{ color: S.rose, fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 700 }}>Active Loans & EMIs</span>
                    </div>
                    <button onClick={() => setActiveTab('loans')} style={{ background: `${S.rose}15`, border: `1px solid ${S.rose}30`, borderRadius: '8px', padding: '4px 12px', color: S.rose, cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}>View All →</button>
                  </div>
                  <div style={{ display: 'flex', gap: '14px', marginBottom: '14px' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: S.muted, fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 4px', fontWeight: 600 }}>Total Outstanding</p>
                      <p style={{ color: S.rose, fontSize: '20px', fontWeight: 800, margin: 0 }}>₹{fmt(totalOutstanding)}</p>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: S.muted, fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 4px', fontWeight: 600 }}>Monthly EMI Outflow</p>
                      <p style={{ color: S.amber, fontSize: '20px', fontWeight: 800, margin: 0 }}>₹{fmt(totalEMI)}</p>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: S.muted, fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 4px', fontWeight: 600 }}>Active Loans</p>
                      <p style={{ color: S.text, fontSize: '20px', fontWeight: 800, margin: 0 }}>{loans.filter(l => getLoanStats(l).remainingEMIs > 0).length}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {loans.filter(l => getLoanStats(l).remainingEMIs > 0).slice(0, 3).map(l => {
                      const stats = getLoanStats(l);
                      const lt = LOAN_TYPES.find(t => t.value === l.type);
                      return (
                        <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '14px' }}>{lt?.icon}</span>
                          <span style={{ color: S.textDim, fontSize: '12px', flex: 1 }}>{l.name}</span>
                          <span style={{ color: S.muted, fontSize: '11px' }}>{stats.remainingEMIs} EMIs left</span>
                          <div style={{ width: '80px', height: '3px', background: S.faint, borderRadius: '4px' }}>
                            <div style={{ height: '100%', width: `${stats.progressPct}%`, background: lt?.color || S.rose, borderRadius: '4px' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Month picker */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <p style={{ color: S.text, fontSize: '18px', fontWeight: 700, margin: 0 }}>
                  {dashMonth ? new Date(dashMonth + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : 'All Time'}
                </p>
                <p style={{ color: S.muted, fontSize: '12px', margin: '4px 0 0' }}>
                  Today: {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  {' · '}{filteredTxs.length} transaction{filteredTxs.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input type="month" value={dashMonth}
                  onChange={e => setDashMonth(e.target.value)}
                  style={{ background: S.deep, border: `1px solid ${S.border}`, borderRadius: '10px', padding: '7px 12px', color: S.text, fontSize: '13px', outline: 'none', cursor: 'pointer' }} />
                <button onClick={() => setDashMonth('')}
                  style={{ background: dashMonth === '' ? `${S.blue}20` : S.deep, border: `1px solid ${dashMonth === '' ? S.blue : S.border}`, borderRadius: '10px', padding: '7px 14px', color: dashMonth === '' ? S.blue : S.muted, cursor: 'pointer', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  All Time
                </button>
              </div>
            </div>

            {/* Stats cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px', marginBottom: '36px' }}>
              {[
                { label: 'Total Spent', value: `₹${fmt(totalSpent)}`, color: S.blue, icon: '💳', bg: `linear-gradient(135deg, #0d1929, #13254a)` },
                { label: 'Mandatory', value: `₹${fmt(mandatorySpent)}`, color: S.cyan, icon: '🏠', bg: `linear-gradient(135deg, #0a1e24, #0e2d38)` },
                { label: 'Unnecessary', value: `₹${fmt(unnecessarySpent)}`, color: S.orange, icon: '🛍️', bg: `linear-gradient(135deg, #1f100a, #2d1608)` },
              ].map(s => (
                <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.color}25`, borderRadius: '16px', padding: '20px', boxShadow: `0 0 20px ${s.color}0a` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '16px' }}>{s.icon}</span>
                    <p style={{ color: s.color, fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase', margin: 0, fontWeight: 700 }}>{s.label}</p>
                  </div>
                  <p style={{ fontSize: '24px', fontWeight: 800, color: S.text, margin: 0 }}>{s.value}</p>
                </div>
              ))}
            </div>

            <p style={{ color: S.textDim, fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '14px', fontWeight: 700 }}>Spending Breakdown</p>
            {Object.keys(spending).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: S.muted }}>
                <p style={{ fontSize: '46px', margin: '0 0 12px' }}>📂</p>
                <p style={{ fontSize: '14px' }}>{dashMonth && transactions.length > 0 ? `No transactions for ${new Date(dashMonth + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}.` : 'Upload a CSV to see spending breakdown.'}</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {Object.entries(spending).sort((a, b) => b[1] - a[1]).map(([cat, amount]) => {
                  const budget = budgets[cat] || 0;
                  const over = budget > 0 && amount > budget;
                  const catInfo = DEFAULT_CATEGORIES.find(c => c.name === cat);
                  const isMandatory = catInfo?.type === 'mandatory';
                  const barColor = over ? S.red : isMandatory ? S.cyan : S.orange;
                  return (
                    <div key={cat} style={{ ...card, borderLeft: `3px solid ${barColor}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: budget > 0 ? '10px' : 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '13px', color: S.text, fontWeight: 600 }}>{cat}</span>
                          <span style={{ fontSize: '10px', color: isMandatory ? S.cyan : S.orange, background: isMandatory ? `${S.cyan}15` : `${S.orange}15`, padding: '2px 8px', borderRadius: '6px', fontWeight: 600 }}>
                            {catInfo?.type}
                          </span>
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: over ? S.red : S.text }}>
                          ₹{fmt(amount)}{budget > 0 && <span style={{ color: S.muted, fontWeight: 400, fontSize: '12px' }}> / ₹{budget}</span>}
                        </span>
                      </div>
                      {budget > 0 && (
                        <div style={{ background: S.deep, borderRadius: '6px', height: '4px' }}>
                          <div style={{ height: '100%', width: `${Math.min((amount/budget)*100,100)}%`, background: barColor, borderRadius: '6px', boxShadow: `0 0 8px ${barColor}` }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── LOANS ──────────────────────────────────────────────────────────── */}
        {activeTab === 'loans' && (
          <div>
            {/* Sub-tabs */}
            <div style={{ display: 'flex', gap: '3px', marginBottom: '24px', background: S.deep, borderRadius: '12px', padding: '4px', border: `1px solid ${S.border}` }}>
              {[['overview','📋 Overview'], ['add','+ Add Loan'], ['payments','💰 Payment History']].map(([st, label]) => (
                <button key={st} onClick={() => setLoanSubTab(st)} style={{
                  padding: '8px 16px', borderRadius: '9px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                  background: loanSubTab === st ? `${S.rose}20` : 'transparent',
                  color: loanSubTab === st ? S.rose : S.muted,
                }}>{label}</button>
              ))}
            </div>

            {/* ── OVERVIEW ── */}
            {loanSubTab === 'overview' && (
              <div>
                {loans.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '70px 0', color: S.muted }}>
                    <p style={{ fontSize: '52px', margin: '0 0 14px' }}>🏦</p>
                    <p style={{ fontSize: '15px', fontWeight: 600, color: S.textDim, marginBottom: '8px' }}>No loans added yet</p>
                    <p style={{ fontSize: '13px', marginBottom: '20px' }}>Track your EMIs, tenure, and outstanding balance.</p>
                    <button onClick={() => setLoanSubTab('add')} style={{ background: `linear-gradient(135deg, ${S.rose}, ${S.pink})`, color: '#fff', border: 'none', borderRadius: '12px', padding: '11px 24px', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}>+ Add Your First Loan</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Summary row */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '4px' }}>
                      {[
                        { label: 'Total Outstanding', value: `₹${fmt(loans.reduce((s,l)=>s+getLoanStats(l).remainingAmount,0))}`, color: S.rose, bg: 'linear-gradient(135deg,#1f0a14,#2d0e1e)' },
                        { label: 'Monthly EMI Total', value: `₹${fmt(loans.reduce((s,l)=>s+(parseFloat(l.emiAmount)||0),0))}`, color: S.amber, bg: 'linear-gradient(135deg,#1f1408,#2d1e0a)' },
                        { label: 'Total Paid So Far', value: `₹${fmt(loans.reduce((s,l)=>s+getLoanStats(l).paidAmount,0))}`, color: S.emerald, bg: 'linear-gradient(135deg,#0a1f14,#0e2d1c)' },
                      ].map(s => (
                        <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.color}25`, borderRadius: '14px', padding: '16px' }}>
                          <p style={{ color: s.color, fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 8px', fontWeight: 700 }}>{s.label}</p>
                          <p style={{ color: S.text, fontSize: '20px', fontWeight: 800, margin: 0 }}>{s.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Loan cards */}
                    {loans.map(loan => {
                      const stats = getLoanStats(loan);
                      const lt = LOAN_TYPES.find(t => t.value === loan.type);
                      const lc = lt?.color || S.rose;
                      const isExpanded = expandedLoan === loan.id;
                      const yearsLeft = Math.floor(stats.remainingEMIs / 12);
                      const monthsLeft = stats.remainingEMIs % 12;
                      return (
                        <div key={loan.id} style={{ ...card, border: `1px solid ${lc}25`, borderLeft: `4px solid ${lc}` }}>
                          {/* Header row */}
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                            <div style={{ width: '46px', height: '46px', borderRadius: '14px', background: `${lc}20`, border: `1px solid ${lc}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>
                              {lt?.icon || '💳'}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                  <p style={{ color: S.text, fontSize: '15px', fontWeight: 700, margin: '0 0 3px' }}>{loan.name}</p>
                                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <span style={{ color: lc, fontSize: '11px', background: `${lc}15`, padding: '2px 9px', borderRadius: '6px', fontWeight: 600 }}>{lt?.label}</span>
                                    <span style={{ color: S.muted, fontSize: '12px' }}>🏦 {loan.bank}</span>
                                    {loan.accountNo && <span style={{ color: S.muted, fontSize: '11px' }}>Acct: ****{loan.accountNo.slice(-4)}</span>}
                                    {loan.interestRate && <span style={{ color: S.amber, fontSize: '11px' }}>{loan.interestRate}% p.a.</span>}
                                  </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                                  <button onClick={() => setExpandedLoan(isExpanded ? null : loan.id)}
                                    style={{ background: `${S.blue}15`, border: `1px solid ${S.blue}30`, borderRadius: '8px', padding: '5px 12px', color: S.blue, cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}>
                                    {isExpanded ? 'Less ▲' : 'Details ▼'}
                                  </button>
                                  <button onClick={() => { if (confirm('Delete this loan?')) setLoans(p => p.filter(x => x.id !== loan.id)); }}
                                    style={{ background: 'none', border: 'none', color: S.muted, cursor: 'pointer', fontSize: '18px' }}>×</button>
                                </div>
                              </div>

                              {/* Progress */}
                              <div style={{ marginTop: '14px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                  <span style={{ color: S.muted, fontSize: '11px' }}>{stats.paidCount} of {stats.tenure} EMIs paid</span>
                                  <span style={{ color: lc, fontSize: '11px', fontWeight: 700 }}>{stats.progressPct.toFixed(0)}% complete</span>
                                </div>
                                <div style={{ background: S.faint, borderRadius: '6px', height: '6px' }}>
                                  <div style={{ height: '100%', width: `${stats.progressPct}%`, background: `linear-gradient(90deg, ${lc}, ${lc}99)`, borderRadius: '6px', boxShadow: `0 0 8px ${lc}60` }} />
                                </div>
                              </div>

                              {/* Key stats */}
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginTop: '14px' }}>
                                {[
                                  { label: 'Monthly EMI', value: `₹${fmt(stats.emi)}`, color: S.amber },
                                  { label: 'Outstanding', value: `₹${fmt(stats.remainingAmount)}`, color: S.rose },
                                  { label: 'Remaining', value: yearsLeft > 0 ? `${yearsLeft}y ${monthsLeft}m` : `${monthsLeft}m`, color: S.cyan },
                                ].map(s => (
                                  <div key={s.label} style={{ background: S.deep, borderRadius: '10px', padding: '10px 12px' }}>
                                    <p style={{ color: S.muted, fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 4px', fontWeight: 600 }}>{s.label}</p>
                                    <p style={{ color: s.color, fontSize: '15px', fontWeight: 700, margin: 0 }}>{s.value}</p>
                                  </div>
                                ))}
                              </div>

                              {/* This month EMI */}
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '14px', padding: '12px 14px', background: stats.currentMonthPaid ? `${S.emerald}10` : `${S.rose}10`, borderRadius: '10px', border: `1px solid ${stats.currentMonthPaid ? S.emerald : S.rose}25` }}>
                                <div>
                                  <p style={{ margin: 0, color: stats.currentMonthPaid ? S.emerald : S.rose, fontSize: '12px', fontWeight: 700 }}>
                                    {stats.currentMonthPaid ? '✅ This month\'s EMI paid' : `⏰ EMI due on ${loan.emiDueDay}${['st','nd','rd'][parseInt(loan.emiDueDay)-1]||'th'} — ₹${fmt(stats.emi)}`}
                                  </p>
                                  {!stats.currentMonthPaid && stats.daysToNext !== undefined && (
                                    <p style={{ margin: '2px 0 0', color: S.muted, fontSize: '11px' }}>
                                      {stats.daysToNext <= 0 ? 'Overdue!' : `In ${stats.daysToNext} day${stats.daysToNext !== 1 ? 's' : ''}`}
                                    </p>
                                  )}
                                </div>
                                {stats.currentMonthPaid ? (
                                  <button onClick={() => undoEmiPayment(loan.id, stats.currentMonth)}
                                    style={{ background: `${S.muted}15`, border: `1px solid ${S.muted}30`, borderRadius: '8px', padding: '5px 12px', color: S.muted, cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}>
                                    Undo
                                  </button>
                                ) : (
                                  <button onClick={() => markEmiPaid(loan.id, stats.currentMonth, loan.emiAmount)}
                                    style={{ background: `linear-gradient(135deg, ${S.emerald}, ${S.cyan})`, border: 'none', borderRadius: '8px', padding: '7px 16px', color: '#000', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}>
                                    ✓ Mark Paid
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Expanded details */}
                          {isExpanded && (
                            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${S.border}` }}>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '10px', marginBottom: '14px' }}>
                                {[
                                  { label: 'Original Loan Amount', value: `₹${fmt(stats.principal)}` },
                                  { label: 'Total Payable (Principal + Interest)', value: `₹${fmt(stats.totalPayable)}` },
                                  { label: 'Total Interest', value: `₹${fmt(stats.totalInterest)}`, color: S.rose },
                                  { label: 'Amount Paid So Far', value: `₹${fmt(stats.paidAmount)}`, color: S.emerald },
                                  { label: 'Loan Start Date', value: formatDate(loan.startDate) },
                                  { label: 'EMI Due Date', value: `${loan.emiDueDay}${['st','nd','rd'][parseInt(loan.emiDueDay)-1]||'th'} of every month` },
                                  { label: 'Total Tenure', value: `${stats.tenure} months (${Math.floor(stats.tenure/12)}y ${stats.tenure%12}m)` },
                                  { label: 'Remaining Tenure', value: `${stats.remainingEMIs} months` },
                                ].map(item => (
                                  <div key={item.label} style={{ background: S.deep, borderRadius: '10px', padding: '10px 14px' }}>
                                    <p style={{ color: S.muted, fontSize: '10px', letterSpacing: '0.5px', margin: '0 0 3px' }}>{item.label}</p>
                                    <p style={{ color: item.color || S.text, fontSize: '14px', fontWeight: 600, margin: 0 }}>{item.value}</p>
                                  </div>
                                ))}
                              </div>
                              {loan.notes && <p style={{ color: S.muted, fontSize: '12px', margin: 0, fontStyle: 'italic' }}>📝 {loan.notes}</p>}

                              {/* Recent payments */}
                              {loan.payments.length > 0 && (
                                <div style={{ marginTop: '14px' }}>
                                  <p style={{ color: S.muted, fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 10px', fontWeight: 700 }}>Recent Payments</p>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                                    {[...loan.payments].reverse().map(p => (
                                      <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: `${S.emerald}08`, borderRadius: '8px', border: `1px solid ${S.emerald}15` }}>
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                          <span style={{ color: S.emerald, fontSize: '13px' }}>✓</span>
                                          <span style={{ color: S.textDim, fontSize: '12px' }}>{new Date(p.month + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                          <span style={{ color: S.emerald, fontSize: '13px', fontWeight: 700 }}>₹{fmt(parseFloat(p.amount))}</span>
                                          <span style={{ color: S.muted, fontSize: '11px' }}>{formatDate(p.date)}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── ADD LOAN ── */}
            {loanSubTab === 'add' && (
              <div style={{ ...card, border: `1px solid ${S.rose}25` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: `${S.rose}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🏦</div>
                  <p style={{ color: S.rose, fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase', margin: 0, fontWeight: 700 }}>Add New Loan / EMI</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ gridColumn: '1/-1' }}>
                    <p style={{ color: S.muted, fontSize: '11px', marginBottom: '6px', letterSpacing: '1px', fontWeight: 600 }}>LOAN LABEL</p>
                    <input type="text" placeholder="e.g. Home Loan - SBI, Car Loan - HDFC" value={newLoan.name}
                      onChange={e => setNewLoan(p => ({ ...p, name: e.target.value }))} style={{ ...input }} />
                  </div>
                  <div>
                    <p style={{ color: S.muted, fontSize: '11px', marginBottom: '6px', letterSpacing: '1px', fontWeight: 600 }}>LOAN TYPE</p>
                    <select value={newLoan.type} onChange={e => setNewLoan(p => ({ ...p, type: e.target.value }))} style={{ ...input }}>
                      {LOAN_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <p style={{ color: S.muted, fontSize: '11px', marginBottom: '6px', letterSpacing: '1px', fontWeight: 600 }}>BANK / LENDER</p>
                    <select value={newLoan.bank} onChange={e => setNewLoan(p => ({ ...p, bank: e.target.value }))} style={{ ...input }}>
                      {BANKS.map(b => <option key={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <p style={{ color: S.muted, fontSize: '11px', marginBottom: '6px', letterSpacing: '1px', fontWeight: 600 }}>LOAN / ACCOUNT NUMBER (last 4 digits)</p>
                    <input type="text" placeholder="e.g. 1234" maxLength={20} value={newLoan.accountNo}
                      onChange={e => setNewLoan(p => ({ ...p, accountNo: e.target.value }))} style={{ ...input }} />
                  </div>
                  <div>
                    <p style={{ color: S.muted, fontSize: '11px', marginBottom: '6px', letterSpacing: '1px', fontWeight: 600 }}>TOTAL LOAN AMOUNT (₹)</p>
                    <input type="number" placeholder="e.g. 2500000" value={newLoan.totalAmount}
                      onChange={e => setNewLoan(p => ({ ...p, totalAmount: e.target.value }))} style={{ ...input }} />
                  </div>
                  <div>
                    <p style={{ color: S.muted, fontSize: '11px', marginBottom: '6px', letterSpacing: '1px', fontWeight: 600 }}>MONTHLY EMI (₹)</p>
                    <input type="number" placeholder="e.g. 22000" value={newLoan.emiAmount}
                      onChange={e => setNewLoan(p => ({ ...p, emiAmount: e.target.value }))} style={{ ...input }} />
                  </div>
                  <div>
                    <p style={{ color: S.muted, fontSize: '11px', marginBottom: '6px', letterSpacing: '1px', fontWeight: 600 }}>INTEREST RATE (% per annum)</p>
                    <input type="number" placeholder="e.g. 8.5" step="0.01" value={newLoan.interestRate}
                      onChange={e => setNewLoan(p => ({ ...p, interestRate: e.target.value }))} style={{ ...input }} />
                  </div>
                  <div>
                    <p style={{ color: S.muted, fontSize: '11px', marginBottom: '6px', letterSpacing: '1px', fontWeight: 600 }}>TOTAL TENURE (months)</p>
                    <input type="number" placeholder="e.g. 240 (20 years)" value={newLoan.tenureMonths}
                      onChange={e => setNewLoan(p => ({ ...p, tenureMonths: e.target.value }))} style={{ ...input }} />
                    {newLoan.tenureMonths && <p style={{ color: S.muted, fontSize: '11px', margin: '5px 0 0' }}>= {Math.floor(parseInt(newLoan.tenureMonths)/12)}y {parseInt(newLoan.tenureMonths)%12}m</p>}
                  </div>
                  <div>
                    <p style={{ color: S.muted, fontSize: '11px', marginBottom: '6px', letterSpacing: '1px', fontWeight: 600 }}>LOAN START DATE</p>
                    <input type="date" value={newLoan.startDate}
                      onChange={e => setNewLoan(p => ({ ...p, startDate: e.target.value }))} style={{ ...input }} />
                  </div>
                  <div>
                    <p style={{ color: S.muted, fontSize: '11px', marginBottom: '6px', letterSpacing: '1px', fontWeight: 600 }}>EMI DUE DATE (day of month)</p>
                    <select value={newLoan.emiDueDay} onChange={e => setNewLoan(p => ({ ...p, emiDueDay: e.target.value }))} style={{ ...input }}>
                      {[1,2,3,4,5,6,7,8,9,10,15,20,25,28].map(d => <option key={d} value={d}>{d}{['st','nd','rd'][d-1]||'th'} of every month</option>)}
                    </select>
                  </div>
                  <div style={{ gridColumn: '1/-1' }}>
                    <p style={{ color: S.muted, fontSize: '11px', marginBottom: '6px', letterSpacing: '1px', fontWeight: 600 }}>NOTES (optional)</p>
                    <input type="text" placeholder="e.g. Fixed rate, balloon payment on month 60..." value={newLoan.notes}
                      onChange={e => setNewLoan(p => ({ ...p, notes: e.target.value }))} style={{ ...input }} />
                  </div>
                </div>

                {/* Preview */}
                {newLoan.totalAmount && newLoan.emiAmount && newLoan.tenureMonths && (
                  <div style={{ marginTop: '18px', padding: '16px', background: `${S.rose}08`, border: `1px solid ${S.rose}20`, borderRadius: '12px' }}>
                    <p style={{ color: S.rose, fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 10px', fontWeight: 700 }}>Loan Summary Preview</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px' }}>
                      {[
                        { label: 'Total Payable', value: `₹${fmt(parseFloat(newLoan.emiAmount) * parseInt(newLoan.tenureMonths))}` },
                        { label: 'Total Interest', value: `₹${fmt(Math.max(0, parseFloat(newLoan.emiAmount) * parseInt(newLoan.tenureMonths) - parseFloat(newLoan.totalAmount)))}`, color: S.rose },
                        { label: 'Tenure', value: `${Math.floor(parseInt(newLoan.tenureMonths)/12)}y ${parseInt(newLoan.tenureMonths)%12}m` },
                      ].map(s => (
                        <div key={s.label}>
                          <p style={{ color: S.muted, fontSize: '10px', letterSpacing: '1px', margin: '0 0 3px' }}>{s.label}</p>
                          <p style={{ color: s.color || S.text, fontSize: '14px', fontWeight: 700, margin: 0 }}>{s.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button onClick={addLoan}
                  disabled={!newLoan.name.trim() || !newLoan.totalAmount || !newLoan.emiAmount || !newLoan.tenureMonths}
                  style={{ marginTop: '20px', background: (!newLoan.name.trim() || !newLoan.totalAmount || !newLoan.emiAmount || !newLoan.tenureMonths) ? S.faint : `linear-gradient(135deg, ${S.rose}, ${S.pink})`, color: '#fff', border: 'none', borderRadius: '12px', padding: '13px 24px', fontWeight: 700, cursor: 'pointer', fontSize: '14px', width: '100%', opacity: (!newLoan.name.trim() || !newLoan.totalAmount || !newLoan.emiAmount || !newLoan.tenureMonths) ? 0.5 : 1 }}>
                  Save Loan
                </button>
              </div>
            )}

            {/* ── PAYMENT HISTORY ── */}
            {loanSubTab === 'payments' && (
              <div>
                {loans.length === 0 ? (
                  <p style={{ color: S.muted, textAlign: 'center', padding: '60px 0' }}>No loans added yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {loans.map(loan => {
                      const lt = LOAN_TYPES.find(t => t.value === loan.type);
                      const lc = lt?.color || S.rose;
                      const stats = getLoanStats(loan);
                      return (
                        <div key={loan.id} style={{ ...card, borderLeft: `4px solid ${lc}` }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ fontSize: '20px' }}>{lt?.icon}</span>
                              <div>
                                <p style={{ color: S.text, fontWeight: 700, fontSize: '14px', margin: 0 }}>{loan.name}</p>
                                <p style={{ color: S.muted, fontSize: '11px', margin: '2px 0 0' }}>{loan.bank} · {stats.paidCount} payments · ₹{fmt(stats.paidAmount)} paid</p>
                              </div>
                            </div>
                            {!stats.currentMonthPaid && stats.remainingEMIs > 0 && (
                              <button onClick={() => markEmiPaid(loan.id, stats.currentMonth, loan.emiAmount)}
                                style={{ background: `linear-gradient(135deg, ${S.emerald}, ${S.cyan})`, border: 'none', borderRadius: '8px', padding: '7px 16px', color: '#000', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}>
                                ✓ Pay This Month
                              </button>
                            )}
                          </div>
                          {loan.payments.length === 0 ? (
                            <p style={{ color: S.muted, fontSize: '12px', margin: 0 }}>No payments recorded yet.</p>
                          ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '6px' }}>
                              {[...loan.payments].reverse().map(p => (
                                <div key={p.id} style={{ background: `${S.emerald}08`, border: `1px solid ${S.emerald}18`, borderRadius: '8px', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div>
                                    <p style={{ color: S.textDim, fontSize: '12px', fontWeight: 600, margin: '0 0 2px' }}>{new Date(p.month+'-01').toLocaleDateString('en-IN',{month:'short',year:'numeric'})}</p>
                                    <p style={{ color: S.emerald, fontSize: '13px', fontWeight: 700, margin: 0 }}>₹{fmt(parseFloat(p.amount))}</p>
                                  </div>
                                  <button onClick={() => undoEmiPayment(loan.id, p.month)}
                                    style={{ background: 'none', border: 'none', color: S.muted, cursor: 'pointer', fontSize: '14px', padding: 0 }}>×</button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ─── CRYPTO ─────────────────────────────────────────────────────────── */}
        {activeTab === 'crypto' && (
          <div>
            {/* Crypto sub-tabs */}
            <div style={{ display: 'flex', gap: '3px', marginBottom: '24px', background: S.deep, borderRadius: '12px', padding: '4px', border: `1px solid ${S.border}` }}>
              {['portfolio', 'prices', 'transactions', 'add', 'wallets'].map(st => {
                const isActive = cryptoSubTab === st;
                return (
                  <button key={st} onClick={() => setCryptoSubTab(st)} style={{
                    padding: '7px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                    background: isActive ? `${S.purple}22` : 'transparent',
                    color: isActive ? S.purple : S.muted, textTransform: 'capitalize',
                  }}>
                    {st === 'add' ? '+ Add Transaction' : st.charAt(0).toUpperCase() + st.slice(1)}
                  </button>
                );
              })}
              <div style={{ flex: 1 }} />
              <button onClick={fetchPrices} style={{ background: `${S.cyan}15`, border: `1px solid ${S.cyan}30`, borderRadius: '8px', padding: '6px 12px', color: S.cyan, cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}>
                {priceLoading ? '⟳ Loading...' : '↻ Refresh'}
              </button>
            </div>
            {priceError && <p style={{ color: S.amber, fontSize: '12px', marginBottom: '16px', background: `${S.amber}10`, padding: '10px 14px', borderRadius: '10px' }}>⚠ {priceError}</p>}

            {/* Portfolio */}
            {cryptoSubTab === 'portfolio' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px', marginBottom: '28px' }}>
                  {[
                    { label: 'Portfolio Value', value: `₹${fmt(totalPortfolioINR)}`, color: S.purple, bg: 'linear-gradient(135deg, #130d28, #1e1040)' },
                    { label: 'Total Invested', value: `₹${fmt(totalCostBasis)}`, color: S.blue, bg: 'linear-gradient(135deg, #0d1929, #13254a)' },
                    { label: totalPnL >= 0 ? 'Total Profit' : 'Total Loss', value: `${totalPnL >= 0 ? '+' : ''}₹${fmt(totalPnL)}`, color: totalPnL >= 0 ? S.emerald : S.red, bg: totalPnL >= 0 ? 'linear-gradient(135deg, #0a1f17, #0e2d20)' : 'linear-gradient(135deg, #1f0a0a, #2d0e0e)' },
                  ].map(s => (
                    <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.color}25`, borderRadius: '16px', padding: '20px' }}>
                      <p style={{ color: s.color, fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 10px', fontWeight: 700 }}>{s.label}</p>
                      <p style={{ fontSize: '22px', fontWeight: 800, color: S.text, margin: 0 }}>{s.value}</p>
                    </div>
                  ))}
                </div>

                {Object.keys(portfolio).filter(c => portfolio[c].qty > 0.000001).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 0', color: S.muted }}>
                    <p style={{ fontSize: '46px', margin: '0 0 12px' }}>₿</p>
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
                      const coinColor = COIN_COLORS[coinId] || S.purple;
                      return (
                        <div key={coinId} style={{ ...card, display: 'flex', alignItems: 'center', gap: '16px', borderLeft: `3px solid ${coinColor}` }}>
                          <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: `${coinColor}20`, border: `2px solid ${coinColor}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '12px', color: coinColor, flexShrink: 0 }}>
                            {coin?.symbol || coinId.slice(0,3).toUpperCase()}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div>
                                <p style={{ color: S.text, fontWeight: 700, fontSize: '14px', margin: '0 0 2px' }}>{coin?.name || coinId}</p>
                                <p style={{ color: S.muted, fontSize: '12px', margin: 0 }}>{fmt(h.qty)} {coin?.symbol} · Avg ₹{fmt(avgBuy)}</p>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <p style={{ color: S.text, fontWeight: 700, fontSize: '15px', margin: '0 0 2px' }}>₹{fmt(currentValue)}</p>
                                <p style={{ color: pnl >= 0 ? S.emerald : S.red, fontSize: '12px', margin: 0, fontWeight: 700 }}>
                                  {pnl >= 0 ? '▲' : '▼'} {pnl >= 0 ? '+' : ''}₹{fmt(pnl)} ({pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%)
                                </p>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '16px', marginTop: '8px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '11px', color: S.muted }}>₹{fmt(priceINR)} / ${fmt(priceUSD)}</span>
                              <span style={{ fontSize: '11px', color: change24h >= 0 ? S.emerald : S.red, fontWeight: 600 }}>24h: {change24h >= 0 ? '+' : ''}{change24h?.toFixed(2)}%</span>
                              {h.rewards > 0 && <span style={{ fontSize: '11px', color: S.yellow }}>⭐ Rewards: {fmt(h.rewards)} {coin?.symbol}</span>}
                              {h.disbursed > 0 && <span style={{ fontSize: '11px', color: S.pink }}>Disbursed: ₹{fmt(h.disbursed)}</span>}
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
                    const coinColor = COIN_COLORS[coin.id] || S.purple;
                    return (
                      <div key={coin.id} style={{ ...card, display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px' }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: `${coinColor}20`, border: `1px solid ${coinColor}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '10px', color: coinColor, flexShrink: 0 }}>
                          {coin.symbol}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ color: S.text, fontSize: '13px', fontWeight: 600, margin: '0 0 2px' }}>{coin.name}</p>
                          <p style={{ color: S.muted, fontSize: '11px', margin: 0 }}>{p ? `₹${fmt(p.inr)}` : '—'}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ color: S.textDim, fontSize: '11px', margin: '0 0 3px' }}>{p ? `$${fmt(p.usd)}` : '—'}</p>
                          <p style={{ color: change >= 0 ? S.emerald : S.red, fontSize: '11px', margin: 0, fontWeight: 700 }}>
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
                  <p style={{ color: S.muted, textAlign: 'center', padding: '60px 0' }}>No crypto transactions yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[...cryptoTxs].reverse().map(tx => {
                      const coin = COINS.find(c => c.id === tx.coinId);
                      const txType = CRYPTO_TX_TYPES.find(t => t.value === tx.type);
                      const toCoin = COINS.find(c => c.id === tx.toCoinId);
                      return (
                        <div key={tx.id} style={{ ...card, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: txType?.color || S.purple, background: `${txType?.color || S.purple}18`, padding: '5px 11px', borderRadius: '8px', flexShrink: 0 }}>
                            {txType?.label || tx.type}
                          </span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ color: S.text, fontSize: '13px', fontWeight: 600, margin: '0 0 3px' }}>
                              {tx.quantity} {coin?.symbol || tx.coinId}
                              {tx.type === 'swap' && tx.toCoinId && ` → ${tx.toQuantity} ${toCoin?.symbol || tx.toCoinId}`}
                              {tx.pricePerUnit && ` @ ₹${fmt(tx.pricePerUnit)}`}
                            </p>
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                              <span style={{ color: S.muted, fontSize: '11px' }}>{formatDate(tx.date)}</span>
                              {tx.wallet && <span style={{ color: S.textDim, fontSize: '11px' }}>📍 {tx.wallet}</span>}
                              {tx.fees && <span style={{ color: S.muted, fontSize: '11px' }}>Fee: ₹{tx.fees}</span>}
                              {tx.notes && <span style={{ color: S.muted, fontSize: '11px' }}>{tx.notes}</span>}
                            </div>
                          </div>
                          <button onClick={() => setCryptoTxs(prev => prev.filter(t => t.id !== tx.id))} style={{ background: 'none', border: 'none', color: S.muted, cursor: 'pointer', fontSize: '18px' }}>×</button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Add transaction form */}
            {cryptoSubTab === 'add' && (
              <div style={{ ...card, border: `1px solid ${S.purple}33` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '22px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${S.purple}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>₿</div>
                  <p style={{ color: S.purple, fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase', margin: 0, fontWeight: 700 }}>New Crypto Transaction</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <p style={{ color: S.muted, fontSize: '11px', marginBottom: '6px', letterSpacing: '1px', fontWeight: 600 }}>TYPE</p>
                    <select value={newCryptoTx.type} onChange={e => setNewCryptoTx(p => ({ ...p, type: e.target.value }))} style={{ ...input }}>
                      {CRYPTO_TX_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <p style={{ color: S.muted, fontSize: '11px', marginBottom: '6px', letterSpacing: '1px', fontWeight: 600 }}>DATE</p>
                    <input type="date" value={newCryptoTx.date} onChange={e => setNewCryptoTx(p => ({ ...p, date: e.target.value }))} style={{ ...input }} />
                  </div>
                  <div>
                    <p style={{ color: S.muted, fontSize: '11px', marginBottom: '6px', letterSpacing: '1px', fontWeight: 600 }}>COIN</p>
                    <select value={newCryptoTx.coinId} onChange={e => setNewCryptoTx(p => ({ ...p, coinId: e.target.value }))} style={{ ...input }}>
                      {COINS.map(c => <option key={c.id} value={c.id}>{c.name} ({c.symbol})</option>)}
                    </select>
                  </div>
                  <div>
                    <p style={{ color: S.muted, fontSize: '11px', marginBottom: '6px', letterSpacing: '1px', fontWeight: 600 }}>QUANTITY</p>
                    <input type="number" placeholder="0.00" value={newCryptoTx.quantity} onChange={e => setNewCryptoTx(p => ({ ...p, quantity: e.target.value }))} style={{ ...input }} />
                  </div>
                  <div>
                    <p style={{ color: S.muted, fontSize: '11px', marginBottom: '6px', letterSpacing: '1px', fontWeight: 600 }}>PRICE PER UNIT (₹)</p>
                    <input type="number" placeholder="0.00" value={newCryptoTx.pricePerUnit} onChange={e => setNewCryptoTx(p => ({ ...p, pricePerUnit: e.target.value }))} style={{ ...input }} />
                  </div>
                  <div>
                    <p style={{ color: S.muted, fontSize: '11px', marginBottom: '6px', letterSpacing: '1px', fontWeight: 600 }}>FEES (₹)</p>
                    <input type="number" placeholder="0.00" value={newCryptoTx.fees} onChange={e => setNewCryptoTx(p => ({ ...p, fees: e.target.value }))} style={{ ...input }} />
                  </div>
                  {newCryptoTx.type === 'swap' && (<>
                    <div>
                      <p style={{ color: S.muted, fontSize: '11px', marginBottom: '6px', letterSpacing: '1px', fontWeight: 600 }}>TO COIN</p>
                      <select value={newCryptoTx.toCoinId} onChange={e => setNewCryptoTx(p => ({ ...p, toCoinId: e.target.value }))} style={{ ...input }}>
                        {COINS.map(c => <option key={c.id} value={c.id}>{c.name} ({c.symbol})</option>)}
                      </select>
                    </div>
                    <div>
                      <p style={{ color: S.muted, fontSize: '11px', marginBottom: '6px', letterSpacing: '1px', fontWeight: 600 }}>TO QUANTITY</p>
                      <input type="number" placeholder="0.00" value={newCryptoTx.toQuantity} onChange={e => setNewCryptoTx(p => ({ ...p, toQuantity: e.target.value }))} style={{ ...input }} />
                    </div>
                  </>)}
                  <div>
                    <p style={{ color: S.muted, fontSize: '11px', marginBottom: '6px', letterSpacing: '1px', fontWeight: 600 }}>WALLET / EXCHANGE</p>
                    <input type="text" placeholder="e.g. Binance, Coinbase, MetaMask" value={newCryptoTx.wallet} onChange={e => setNewCryptoTx(p => ({ ...p, wallet: e.target.value }))} style={{ ...input }} />
                  </div>
                  <div>
                    <p style={{ color: S.muted, fontSize: '11px', marginBottom: '6px', letterSpacing: '1px', fontWeight: 600 }}>NOTES</p>
                    <input type="text" placeholder="Optional note" value={newCryptoTx.notes} onChange={e => setNewCryptoTx(p => ({ ...p, notes: e.target.value }))} style={{ ...input }} />
                  </div>
                </div>
                {newCryptoTx.quantity && newCryptoTx.pricePerUnit && (
                  <div style={{ marginTop: '16px', padding: '14px 18px', background: `${S.purple}10`, border: `1px solid ${S.purple}20`, borderRadius: '12px', display: 'flex', gap: '20px' }}>
                    <span style={{ color: S.textDim, fontSize: '13px' }}>Total: <strong style={{ color: S.purple }}>₹{fmt(parseFloat(newCryptoTx.quantity) * parseFloat(newCryptoTx.pricePerUnit))}</strong></span>
                    {newCryptoTx.fees && <span style={{ color: S.textDim, fontSize: '13px' }}>After fees: <strong style={{ color: S.text }}>₹{fmt(parseFloat(newCryptoTx.quantity) * parseFloat(newCryptoTx.pricePerUnit) + parseFloat(newCryptoTx.fees))}</strong></span>}
                  </div>
                )}
                <button onClick={addCryptoTx} style={{ marginTop: '18px', background: `linear-gradient(135deg, ${S.purple}, ${S.pink})`, color: '#fff', border: 'none', borderRadius: '12px', padding: '13px 24px', fontWeight: 700, cursor: 'pointer', fontSize: '14px', width: '100%', boxShadow: `0 4px 20px ${S.purple}30` }}>
                  Add Transaction
                </button>
              </div>
            )}

            {/* Wallets */}
            {cryptoSubTab === 'wallets' && (
              <div>
                <p style={{ color: S.muted, fontSize: '13px', marginBottom: '20px' }}>Store your wallet addresses privately. Addresses auto-hide when you leave this tab.</p>

                <div style={{ ...card, marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '14px', border: `1px solid ${S.purple}22` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: `${S.purple}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>🔐</div>
                    <p style={{ color: S.purple, fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', margin: 0, fontWeight: 700 }}>Add Wallet</p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <p style={{ color: S.muted, fontSize: '11px', marginBottom: '6px', letterSpacing: '1px', fontWeight: 600 }}>LABEL</p>
                      <input type="text" placeholder="e.g. My MetaMask" value={newWallet.name}
                        onChange={e => setNewWallet(p => ({ ...p, name: e.target.value }))} style={{ ...input }} />
                    </div>
                    <div>
                      <p style={{ color: S.muted, fontSize: '11px', marginBottom: '6px', letterSpacing: '1px', fontWeight: 600 }}>NETWORK</p>
                      <select value={newWallet.network} onChange={e => setNewWallet(p => ({ ...p, network: e.target.value }))} style={{ ...input }}>
                        {['Ethereum','Bitcoin','Solana','BNB Chain','Polygon','Avalanche','Arbitrum','Optimism','Base','Tron','Cosmos','Other'].map(n => <option key={n}>{n}</option>)}
                      </select>
                    </div>
                    <div>
                      <p style={{ color: S.muted, fontSize: '11px', marginBottom: '6px', letterSpacing: '1px', fontWeight: 600 }}>WALLET / EXCHANGE APP</p>
                      <input type="text" placeholder="e.g. MetaMask, Binance, Ledger" value={newWallet.app}
                        onChange={e => setNewWallet(p => ({ ...p, app: e.target.value }))} style={{ ...input }} />
                    </div>
                  </div>
                  <div>
                    <p style={{ color: S.muted, fontSize: '11px', marginBottom: '8px', letterSpacing: '1px', fontWeight: 600 }}>WALLET ADDRESSES</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {newWallet.addresses.map((addr, i) => (
                        <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <input type="text" placeholder={`Address ${i + 1} — 0x...`} value={addr}
                            onChange={e => setNewWallet(p => { const a = [...p.addresses]; a[i] = e.target.value; return { ...p, addresses: a }; })}
                            style={{ ...input, flex: 1, fontFamily: 'monospace', fontSize: '12px' }} />
                          {newWallet.addresses.length > 1 && (
                            <button onClick={() => setNewWallet(p => ({ ...p, addresses: p.addresses.filter((_, j) => j !== i) }))}
                              style={{ background: `${S.red}15`, border: `1px solid ${S.red}30`, borderRadius: '8px', padding: '7px 11px', color: S.red, cursor: 'pointer', fontSize: '16px', flexShrink: 0 }}>×</button>
                          )}
                        </div>
                      ))}
                      <button onClick={() => setNewWallet(p => ({ ...p, addresses: [...p.addresses, ''] }))}
                        style={{ background: 'none', border: `1px dashed ${S.border}`, borderRadius: '9px', padding: '9px', color: S.muted, cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                        + Add Another Address
                      </button>
                    </div>
                  </div>
                  <button onClick={addWallet} style={{ background: `linear-gradient(135deg, ${S.purple}, ${S.blue})`, color: '#fff', border: 'none', borderRadius: '12px', padding: '12px', fontWeight: 700, cursor: 'pointer', fontSize: '14px', boxShadow: `0 4px 20px ${S.purple}25` }}>
                    Save Wallet
                  </button>
                </div>

                {wallets.length === 0 ? (
                  <p style={{ color: S.muted, textAlign: 'center', padding: '50px 0' }}>No wallets saved yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {wallets.map(w => {
                      const addrs = w.addresses || (w.address ? [w.address] : []);
                      return (
                        <div key={w.id} style={{ ...card }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: addrs.length > 0 ? '14px' : 0 }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `${S.purple}20`, border: `1px solid ${S.purple}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                              🔐
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <p style={{ color: S.text, fontSize: '14px', fontWeight: 700, margin: 0 }}>{w.name}</p>
                                <span style={{ fontSize: '10px', color: S.cyan, background: `${S.cyan}15`, padding: '2px 8px', borderRadius: '6px', fontWeight: 600 }}>{w.network}</span>
                                {w.app && <span style={{ fontSize: '11px', color: S.muted }}>{w.app}</span>}
                                <span style={{ fontSize: '10px', color: S.muted }}>{addrs.length} address{addrs.length !== 1 ? 'es' : ''}</span>
                              </div>
                            </div>
                            <button onClick={() => setWallets(p => p.filter(x => x.id !== w.id))} style={{ background: 'none', border: 'none', color: S.muted, cursor: 'pointer', fontSize: '18px', flexShrink: 0 }}>×</button>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {addrs.map((addr, i) => {
                              const revKey = `${w.id}-${i}`;
                              const revealed = revealedWallets.has(revKey);
                              return (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  {addrs.length > 1 && <span style={{ color: S.muted, fontSize: '10px', width: '16px', flexShrink: 0, fontWeight: 600 }}>{i + 1}</span>}
                                  <code style={{ flex: 1, fontSize: '12px', color: revealed ? S.cyan : S.muted, fontFamily: 'monospace', background: S.deep, padding: '7px 12px', borderRadius: '8px', letterSpacing: revealed ? '0.5px' : '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', border: `1px solid ${revealed ? S.cyan + '30' : S.border}` }}>
                                    {revealed ? addr : '••••••••••••••••••••••••••••••••••••••••'}
                                  </code>
                                  <button onClick={() => toggleReveal(revKey)} style={{ background: revealed ? `${S.cyan}15` : S.deep, border: `1px solid ${revealed ? S.cyan + '40' : S.border}`, borderRadius: '8px', padding: '5px 12px', color: revealed ? S.cyan : S.muted, cursor: 'pointer', fontSize: '11px', flexShrink: 0, fontWeight: 600 }}>
                                    {revealed ? '🙈 Hide' : '👁 Show'}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
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
            <div style={{ ...card, marginBottom: '28px', border: `1px solid ${S.cyan}22` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: `${S.cyan}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' }}>📊</div>
                <p style={{ color: S.cyan, fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', margin: 0, fontWeight: 700 }}>Save Spending Snapshot</p>
              </div>
              <p style={{ color: S.muted, fontSize: '13px', margin: '0 0 14px' }}>This saves your current {transactions.length} transactions (₹{fmt(totalSpent)} total) for future reference.</p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="text" placeholder="Label e.g. March 2026" value={historyLabel}
                  onChange={e => setHistoryLabel(e.target.value)}
                  style={{ ...input, flex: 1 }} />
                <button onClick={saveSnapshot} disabled={transactions.length === 0}
                  style={{ background: transactions.length === 0 ? S.faint : `linear-gradient(135deg, ${S.cyan}, ${S.blue})`, color: '#fff', border: 'none', borderRadius: '10px', padding: '0 22px', fontWeight: 700, cursor: transactions.length === 0 ? 'not-allowed' : 'pointer', fontSize: '14px', flexShrink: 0, opacity: transactions.length === 0 ? 0.5 : 1 }}>
                  Save
                </button>
              </div>
            </div>

            {spendingHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: S.muted }}>
                <p style={{ fontSize: '46px', margin: '0 0 12px' }}>📊</p>
                <p>No history yet. Save a snapshot to start tracking over time.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {spendingHistory.map(snap => (
                  <div key={snap.id} style={{ ...card }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <div>
                        <p style={{ color: S.text, fontSize: '16px', fontWeight: 700, margin: '0 0 4px' }}>{snap.label}</p>
                        <p style={{ color: S.muted, fontSize: '11px', margin: 0 }}>Saved on {formatDate(snap.date)} · {snap.txCount} transactions</p>
                      </div>
                      <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ color: S.cyan, fontSize: '20px', fontWeight: 800, margin: 0 }}>₹{fmt(snap.total)}</p>
                          <p style={{ color: S.muted, fontSize: '11px', margin: 0 }}>total</p>
                        </div>
                        <button onClick={() => setSpendingHistory(p => p.filter(x => x.id !== snap.id))} style={{ background: 'none', border: 'none', color: S.muted, cursor: 'pointer', fontSize: '18px' }}>×</button>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
                      <div style={{ flex: 1, background: `${S.blue}10`, border: `1px solid ${S.blue}20`, borderRadius: '10px', padding: '12px 16px' }}>
                        <p style={{ color: S.blue, fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 6px', fontWeight: 700 }}>Mandatory</p>
                        <p style={{ color: S.text, fontSize: '16px', fontWeight: 700, margin: 0 }}>₹{fmt(snap.mandatory)}</p>
                      </div>
                      <div style={{ flex: 1, background: `${S.orange}10`, border: `1px solid ${S.orange}20`, borderRadius: '10px', padding: '12px 16px' }}>
                        <p style={{ color: S.orange, fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 6px', fontWeight: 700 }}>Unnecessary</p>
                        <p style={{ color: S.text, fontSize: '16px', fontWeight: 700, margin: 0 }}>₹{fmt(snap.unnecessary)}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {Object.entries(snap.breakdown).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
                        <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: S.muted, fontSize: '12px' }}>{cat}</span>
                          <span style={{ color: S.text, fontSize: '12px', fontWeight: 600 }}>₹{fmt(amt)}</span>
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
                style={{ background: `linear-gradient(135deg, ${S.pink}, ${S.purple})`, color: '#fff', border: 'none', borderRadius: '10px', padding: '0 18px', fontWeight: 700, cursor: 'pointer', fontSize: '14px', alignSelf: 'flex-start', height: '44px', flexShrink: 0 }}>Add</button>
            </div>
            {notes.length === 0 ? <p style={{ color: S.muted, textAlign: 'center', padding: '50px 0' }}>No notes yet.</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[...notes].reverse().map(note => (
                  <div key={note.id} style={{ ...card, display: 'flex', gap: '12px', borderLeft: `3px solid ${S.pink}` }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: S.text, fontSize: '14px', margin: '0 0 8px', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{note.text}</p>
                      <p style={{ color: S.muted, fontSize: '11px', margin: 0 }}>{formatDate(note.createdAt)}</p>
                    </div>
                    <button onClick={() => setNotes(p => p.filter(n => n.id !== note.id))} style={{ background: 'none', border: 'none', color: S.muted, cursor: 'pointer', fontSize: '18px', lineHeight: 1, padding: 0 }}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── REMINDERS ──────────────────────────────────────────────────────── */}
        {activeTab === 'reminders' && (
          <div>
            <div style={{ ...card, marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '14px', border: `1px solid ${S.amber}22` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: `${S.amber}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' }}>🔔</div>
                <p style={{ color: S.amber, fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', margin: 0, fontWeight: 700 }}>New Reminder</p>
              </div>
              <input type="text" placeholder="Title — Pay rent, Netflix, EMI..." value={newReminder.title}
                onChange={e => setNewReminder(p => ({ ...p, title: e.target.value }))} style={{ ...input }} />
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ color: S.muted, fontSize: '11px', marginBottom: '6px', letterSpacing: '1px', fontWeight: 600 }}>DUE DATE</p>
                  <input type="date" value={newReminder.date} onChange={e => setNewReminder(p => ({ ...p, date: e.target.value }))} style={{ ...input }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ color: S.muted, fontSize: '11px', marginBottom: '6px', letterSpacing: '1px', fontWeight: 600 }}>AMOUNT (optional)</p>
                  <input type="number" placeholder="₹ 0" value={newReminder.amount} onChange={e => setNewReminder(p => ({ ...p, amount: e.target.value }))} style={{ ...input }} />
                </div>
              </div>
              <button onClick={addReminder} style={{ background: `linear-gradient(135deg, ${S.amber}, ${S.orange})`, color: '#000', border: 'none', borderRadius: '12px', padding: '12px', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}>Add Reminder</button>
            </div>
            {reminders.length === 0 ? <p style={{ color: S.muted, textAlign: 'center', padding: '50px 0' }}>No reminders yet.</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[...reminders].sort((a, b) => new Date(a.date) - new Date(b.date)).map(r => {
                  const diff = daysDiff(r.date);
                  let sc = S.muted, st = `Due in ${diff}d`;
                  if (r.done) { sc = S.emerald; st = 'Done ✓'; }
                  else if (diff < 0) { sc = S.red; st = `Overdue ${Math.abs(diff)}d`; }
                  else if (diff === 0) { sc = S.red; st = 'Due today!'; }
                  else if (diff <= 3) { sc = S.amber; st = `Due in ${diff}d`; }
                  return (
                    <div key={r.id} style={{ ...card, display: 'flex', alignItems: 'center', gap: '12px', borderLeft: `3px solid ${sc}` }}>
                      <input type="checkbox" checked={r.done} onChange={() => setReminders(p => p.map(x => x.id === r.id ? { ...x, done: !x.done } : x))}
                        style={{ width: '16px', height: '16px', accentColor: S.amber, cursor: 'pointer', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ color: r.done ? S.muted : S.text, fontSize: '14px', fontWeight: 600, margin: '0 0 4px', textDecoration: r.done ? 'line-through' : 'none' }}>{r.title}</p>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <span style={{ color: S.muted, fontSize: '11px' }}>{formatDate(r.date)}</span>
                          <span style={{ color: sc, fontSize: '11px', fontWeight: 700 }}>{st}</span>
                          {r.amount && <span style={{ color: S.amber, fontSize: '11px', fontWeight: 600 }}>₹{r.amount}</span>}
                        </div>
                      </div>
                      <button onClick={() => setReminders(p => p.filter(x => x.id !== r.id))} style={{ background: 'none', border: 'none', color: S.muted, cursor: 'pointer', fontSize: '18px' }}>×</button>
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
            {/* Manual entry form */}
            <div style={{ ...card, marginBottom: '20px', border: `1px solid ${S.emerald}22` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: `${S.emerald}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' }}>✏️</div>
                <p style={{ color: S.emerald, fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', margin: 0, fontWeight: 700 }}>Add Transaction Manually</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <p style={{ color: S.muted, fontSize: '11px', marginBottom: '6px', letterSpacing: '1px', fontWeight: 600 }}>DESCRIPTION</p>
                  <input type="text" placeholder="e.g. Grocery store, Rent, Netflix..."
                    value={newTx.description} onChange={e => setNewTx(p => ({ ...p, description: e.target.value }))}
                    style={{ ...input }} />
                </div>
                <div>
                  <p style={{ color: S.muted, fontSize: '11px', marginBottom: '6px', letterSpacing: '1px', fontWeight: 600 }}>AMOUNT (₹)</p>
                  <input type="number" placeholder="0.00"
                    value={newTx.amount} onChange={e => setNewTx(p => ({ ...p, amount: e.target.value }))}
                    style={{ ...input }} />
                </div>
                <div>
                  <p style={{ color: S.muted, fontSize: '11px', marginBottom: '6px', letterSpacing: '1px', fontWeight: 600 }}>DATE</p>
                  <input type="date" value={newTx.date}
                    onChange={e => setNewTx(p => ({ ...p, date: e.target.value }))}
                    style={{ ...input }} />
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <p style={{ color: S.muted, fontSize: '11px', marginBottom: '6px', letterSpacing: '1px', fontWeight: 600 }}>CATEGORY</p>
                  <select value={newTx.category} onChange={e => setNewTx(p => ({ ...p, category: e.target.value }))} style={{ ...input }}>
                    {DEFAULT_CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.name} ({c.type})</option>)}
                  </select>
                </div>
              </div>
              <button
                disabled={!newTx.description.trim() || !newTx.amount}
                onClick={() => {
                  if (!newTx.description.trim() || !newTx.amount) return;
                  setTransactions(p => [{ id: Date.now(), date: newTx.date, description: newTx.description.trim(), amount: Math.abs(parseFloat(newTx.amount)), category: newTx.category }, ...p]);
                  setNewTx({ date: today(), description: '', amount: '', category: 'Other' });
                }}
                style={{ marginTop: '14px', background: (!newTx.description.trim() || !newTx.amount) ? S.faint : `linear-gradient(135deg, ${S.emerald}, ${S.cyan})`, color: '#000', border: 'none', borderRadius: '12px', padding: '12px', fontWeight: 700, cursor: (!newTx.description.trim() || !newTx.amount) ? 'not-allowed' : 'pointer', fontSize: '14px', width: '100%', opacity: (!newTx.description.trim() || !newTx.amount) ? 0.5 : 1 }}>
                + Add Transaction
              </button>
            </div>

            {/* List header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <p style={{ color: S.muted, fontSize: '13px', margin: 0 }}><span style={{ color: S.emerald, fontWeight: 700 }}>{transactions.length}</span> transactions</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setActiveTab('upload')} style={{ background: `${S.blue}15`, border: `1px solid ${S.blue}30`, borderRadius: '8px', padding: '5px 12px', color: S.blue, cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>📂 Import CSV</button>
                {transactions.length > 0 && <button onClick={() => { if (confirm('Clear all?')) setTransactions([]); }} style={{ background: `${S.red}15`, border: `1px solid ${S.red}30`, borderRadius: '8px', padding: '5px 12px', color: S.red, cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>Clear all</button>}
              </div>
            </div>

            {transactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px 0', color: S.muted }}>
                <p style={{ fontSize: '40px', margin: '0 0 12px' }}>📋</p>
                <p>No transactions yet. Add one manually above or import a CSV.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {transactions.map(t => (
                  <div key={t.id} style={{ ...card, padding: '13px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: S.text, fontSize: '13px', fontWeight: 500, margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{maskAccount(t.description)}</p>
                      <p style={{ color: S.muted, fontSize: '11px', margin: 0 }}>{formatDate(t.date)}</p>
                    </div>
                    <span style={{ color: S.emerald, fontWeight: 700, fontSize: '14px', flexShrink: 0 }}>₹{fmt(t.amount)}</span>
                    <select value={t.category} onChange={e => setTransactions(p => p.map(x => x.id === t.id ? { ...x, category: e.target.value } : x))}
                      style={{ background: S.deep, border: `1px solid ${S.border}`, borderRadius: '8px', padding: '5px 8px', color: S.textDim, fontSize: '11px', cursor: 'pointer', outline: 'none' }}>
                      {DEFAULT_CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                    </select>
                    <button onClick={() => setTransactions(p => p.filter(x => x.id !== t.id))} style={{ background: 'none', border: 'none', color: S.muted, cursor: 'pointer', fontSize: '18px' }}>×</button>
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
              {DEFAULT_CATEGORIES.map(cat => {
                const isMandatory = cat.type === 'mandatory';
                const catColor = isMandatory ? S.cyan : S.orange;
                return (
                  <div key={cat.name} style={{ ...card, display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 18px', borderLeft: `3px solid ${catColor}` }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: S.text, fontSize: '14px', fontWeight: 600, margin: '0 0 4px' }}>{cat.name}</p>
                      <span style={{ fontSize: '10px', color: catColor, background: `${catColor}15`, padding: '2px 8px', borderRadius: '6px', fontWeight: 600 }}>{cat.type}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: S.emerald, fontSize: '16px', fontWeight: 700 }}>₹</span>
                      <input type="number" min="0" placeholder="No limit" value={budgets[cat.name] || ''}
                        onChange={e => setBudgets(p => ({ ...p, [cat.name]: Number(e.target.value) }))}
                        style={{ width: '120px', background: S.deep, border: `1px solid ${S.border}`, borderRadius: '10px', padding: '8px 12px', color: S.text, fontSize: '13px', outline: 'none', fontWeight: 600 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── UPLOAD ─────────────────────────────────────────────────────────── */}
        {activeTab === 'upload' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <p style={{ color: S.muted, fontSize: '13px', margin: 0 }}>Upload a bank statement CSV to bulk import transactions. Or enter them manually in the <button onClick={() => setActiveTab('transactions')} style={{ background: 'none', border: 'none', color: S.blue, cursor: 'pointer', fontSize: '13px', padding: 0, textDecoration: 'underline', fontWeight: 600 }}>Transactions tab</button>.</p>
            </div>
            <label style={{ display: 'block', border: `2px dashed ${S.rose}40`, borderRadius: '20px', padding: '70px 20px', textAlign: 'center', cursor: 'pointer', background: `${S.rose}05`, transition: 'all 0.2s' }}>
              <p style={{ fontSize: '52px', margin: '0 0 16px' }}>📂</p>
              <p style={{ color: S.text, fontWeight: 700, fontSize: '17px', margin: '0 0 6px' }}>Upload Bank Statement CSV</p>
              <p style={{ color: S.muted, fontSize: '13px', margin: '0 0 24px' }}>Read locally — never sent to any server</p>
              <span style={{ background: `linear-gradient(135deg, ${S.rose}, ${S.pink})`, color: '#fff', padding: '12px 28px', borderRadius: '12px', fontSize: '14px', fontWeight: 700, boxShadow: `0 4px 20px ${S.rose}30` }}>Choose CSV File</span>
              <input type="file" accept=".csv" onChange={handleCSV} style={{ display: 'none' }} />
            </label>
            <div style={{ ...card, marginTop: '18px', border: `1px solid ${S.emerald}20` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: `${S.emerald}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>✓</div>
                <p style={{ color: S.emerald, fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', margin: 0, fontWeight: 700 }}>Supported Formats</p>
              </div>
              {['HDFC, ICICI, SBI, Axis bank CSV exports', 'Auto-detects: Date, Description, Amount columns', 'Only debit/expense entries are imported'].map(item => (
                <p key={item} style={{ color: S.textDim, fontSize: '13px', margin: '8px 0', display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <span style={{ color: S.emerald, fontWeight: 700 }}>✓</span>{item}
                </p>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
