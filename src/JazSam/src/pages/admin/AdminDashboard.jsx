import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import { useNavigate } from 'react-router-dom';
import { clearAdminSession, getAdminSession, getAdminToken } from './AdminLogin';
import CropAvatarModal from '../../components/CropAvatarModal';
import { useStore } from '../../context/StoreContext';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
  BarChart, Bar,
} from 'recharts';
import './AdminDashboard.css';


/* ══════════════════════════════════════════════════
   SVG ICONS
   ══════════════════════════════════════════════════ */
const Icon = {
  home:      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  products:  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
  inventory: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  rewards:   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  orders:    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>,
  employees: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  settings:  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>,
  auditLog:  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  logout:    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  plus:      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  edit:      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  trash:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  search:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  coffee:    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>,
  users:     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  trendUp:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  box:       <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>,
  alert:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  hotTea:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="2" x2="6" y2="5"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="2" x2="14" y2="5"/></svg>,
  snowflake: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="20" y1="4" x2="4" y2="20"/><line x1="4" y1="4" x2="20" y2="20"/><line x1="12" y1="6" x2="9" y2="3"/><line x1="12" y1="6" x2="15" y2="3"/><line x1="12" y1="18" x2="9" y2="21"/><line x1="12" y1="18" x2="15" y2="21"/><line x1="6" y1="12" x2="3" y2="9"/><line x1="6" y1="12" x2="3" y2="15"/><line x1="18" y1="12" x2="21" y2="9"/><line x1="18" y1="12" x2="21" y2="15"/></svg>,
};

/* ══════════════════════════════════════════════════
   NAV CONFIG
   ══════════════════════════════════════════════════ */
const NAV_ITEMS = [
  { id: 'home',      label: 'Home',      icon: Icon.home },
  { id: 'products',  label: 'Products',  icon: Icon.products },
  { id: 'inventory', label: 'Inventory', icon: Icon.inventory },
  { id: 'rewards',   label: 'Rewards',   icon: Icon.rewards },
  { id: 'orders',    label: 'Orders',    icon: Icon.orders },
  { id: 'employees', label: 'Employees', icon: Icon.employees },
  { id: 'auditLog',  label: 'Audit Log', icon: Icon.auditLog },
  { id: 'settings',  label: 'Settings',  icon: Icon.settings },
];

const ROLE_NAV = {
  barista: new Set(['orders', 'settings']),
  cashier: new Set(['orders', 'products', 'rewards', 'settings']),
};

/* ══════════════════════════════════════════════════
   HELPER COMPONENTS
   ══════════════════════════════════════════════════ */
function StatusBadge({ status }) {
  const map = {
    'Active':       'badge--active',
    'Inactive':     'badge--inactive',
    'available':    'badge--active',
    'unavailable':  'badge--inactive',
    'In Stock':     'badge--active',
    'Low Stock':    'badge--warn',
    'Out of Stock': 'badge--danger',
    'Completed':    'badge--active',
    'Pending':      'badge--pending',
    'Preparing':    'badge--warn',
    'Cancelled':    'badge--danger',
    'Refunded':     'badge--refund',
  };
  return <span className={`adm-badge ${map[status] || ''}`}>{status}</span>;
}

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div className="adm-stat" style={{ '--stat-color': color }}>
      <div className="adm-stat__icon">{icon}</div>
      <div className="adm-stat__body">
        <span className="adm-stat__label">{label}</span>
        <span className="adm-stat__value">{value}</span>
        {sub && <span className="adm-stat__sub">{sub}</span>}
      </div>
    </div>
  );
}

function SectionHeader({ title, action, onAction }) {
  return (
    <div className="adm-section-hdr">
      <h2 className="adm-section-title">{title}</h2>
      {action && (
        <button className="adm-btn-add" onClick={onAction}>
          {Icon.plus} {action}
        </button>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   REUSABLE: DELETE CONFIRM MODAL
   Shows a centered overlay dialog instead of an
   awkward inline confirm row.
   ══════════════════════════════════════════════════ */
function DeleteConfirmModal({ name, onConfirm, onCancel }) {
  // Use a portal so the backdrop renders into document.body,
  // escaping any parent overflow / transform / stacking-context.
  return createPortal(
    <div className="dcm-backdrop" onClick={onCancel}>
      <div className="dcm-dialog" onClick={e => e.stopPropagation()}>
        <div className="dcm-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6M14 11v6"/>
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
        </div>
        <h3 className="dcm-title">Delete item?</h3>
        <p className="dcm-msg">Are you sure you want to delete <strong>&ldquo;{name}&rdquo;</strong>? This action cannot be undone.</p>
        <div className="dcm-actions">
          <button className="dcm-btn dcm-btn--cancel" onClick={onCancel}>Cancel</button>
          <button className="dcm-btn dcm-btn--delete" onClick={onConfirm}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            </svg>
            Yes, delete
          </button>
        </div>
      </div>
    </div>,
    document.body   // ← renders outside any parent container
  );
}

function SearchBar({ value, onChange, placeholder }) {
  return (
    <div className="adm-search">
      {Icon.search}
      <input
        type="text"
        placeholder={placeholder || 'Search…'}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}

/* ══════════════════════════════════════════════════
   SECTION: HOME (OVERVIEW)
   ══════════════════════════════════════════════════ */
/* ── Custom Tooltip for area chart ── */
function SalesTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{
      background: '#1a1a1a', color: '#fff',
      padding: '6px 12px', borderRadius: '8px',
      fontSize: '0.8rem', fontWeight: 700, lineHeight: 1.4,
      boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
    }}>
      <div>₱{Number(payload[0].value).toLocaleString()}</div>
      <div style={{ fontSize: '0.7rem', opacity: 0.7, fontWeight: 400 }}>{label}</div>
    </div>
  );
}

/* ── Countdown ── (kept for Active promos card) */
function Countdown() {
  const target = new Date(); target.setDate(target.getDate() + 30);
  const calc = () => {
    const diff = Math.max(0, target - Date.now());
    return { d: Math.floor(diff/86400000), h: Math.floor(diff/3600000)%24, m: Math.floor(diff/60000)%60, s: Math.floor(diff/1000)%60 };
  };
  const [t, setT] = useState(calc);
  useEffect(() => { const id = setInterval(() => setT(calc()), 1000); return () => clearInterval(id); }, []);
  return <span className="home-promo-countdown">{t.d}d {t.h}h {t.m}m {t.s}s left</span>;
}

function HomeSection({ onAvatarClick }) {
  const { orders, inventory, products } = useStore();
  const session = getAdminSession();
  const adminName = session?.name || 'Admin';
  const initials = adminName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  /* Clock */
  const now = new Date();
  const dayFmt  = now.toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const timeFmt = now.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', hour12: true });
  const [clock, setClock] = useState(timeFmt);
  useEffect(() => {
    const id = setInterval(() => setClock(new Date().toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', hour12: true })), 30000);
    return () => clearInterval(id);
  }, []);

  /* ── Stats ── */
  const completedOrders  = orders.filter(o => o.status === 'Completed');
  const cancelledOrders  = orders.filter(o => o.status === 'Cancelled');
  const pendingOrders    = orders.filter(o => o.status === 'Pending');
  const totalSales       = completedOrders.reduce((s, o) => s + (o.total || 0), 0);
  const customerCount    = completedOrders.length;
  const avgMeal          = customerCount > 0 ? (totalSales / customerCount).toFixed(2) : '0.00';
  const salesFmt         = totalSales >= 1000 ? `${(totalSales / 1000).toFixed(1)}k` : totalSales.toString();

  /* ── Stock alerts ── */
  const rawStock = inventory.map(i => ({
    name:   i.name,
    pct:    i.threshold > 0 ? Math.min(100, Math.round((i.qty / i.threshold) * 100)) : 100,
    status: i.status === 'Out of Stock' ? 'Out of stock'
          : i.status === 'Low Stock'    ? 'Low on stock'
          :                               'Sufficient stock',
    color:  i.status === 'Out of Stock' ? '#ef4444'
          : i.status === 'Low Stock'    ? '#f59e0b'
          :                               '#22c55e',
  }));
  const stockPriority = { 'Out of stock': 0, 'Low on stock': 1, 'Sufficient stock': 2 };
  const stockItems = rawStock.length > 0
    ? [...rawStock].sort((a, b) => stockPriority[a.status] - stockPriority[b.status]).slice(0, 4)
    : [
    { name: 'All items', pct: 100, status: 'Sufficient stock', color: '#22c55e' },
  ];

  /* ── Period selector ── */
  const [period, setPeriod] = useState('Week');

  /* ── Sales goal (─ Recharts area chart) ── */
  const [salesGoal, setSalesGoal] = useState(() => {
    const saved = parseInt(localStorage.getItem('jazsam_sales_goal'), 10);
    return saved > 0 ? saved : 30000;
  });
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalDraft,   setGoalDraft]   = useState('');

  const DAY_MS = 86400000;
  const today  = new Date(); today.setHours(0,0,0,0);

  /* "May 13, 2025 · 9:30 AM" → valid Date */
  const parseOrderDate = (d) => new Date((d || '').replace(' · ', ', '));
  const isRefundable   = (o) => {
    if (o.status !== 'Completed') return false;
    const completed = parseOrderDate(o.completedAt || o.date);
    return !isNaN(completed.getTime()) && (Date.now() - completed.getTime()) < 20 * 60 * 1000;
  };

  /* Build chart buckets based on selected period */
  let chartData;
  if (period === 'Today') {
    chartData = Array.from({ length: 14 }, (_, i) => {
      const hour = 7 + i; // 7am–8pm
      const label = hour < 12 ? `${hour}am` : hour === 12 ? '12pm' : `${hour - 12}pm`;
      const value = completedOrders
        .filter(o => {
          const d = parseOrderDate(o.date);
          return d.getFullYear() === today.getFullYear() &&
                 d.getMonth()    === today.getMonth()    &&
                 d.getDate()     === today.getDate()     &&
                 d.getHours()    === hour;
        })
        .reduce((s, o) => s + (o.total || 0), 0);
      return { label, value };
    });
  } else if (period === 'Week') {
    chartData = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(today.getTime() - (6 - i) * DAY_MS);
      const label = day.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
      const value = completedOrders
        .filter(o => {
          const d = parseOrderDate(o.date); d.setHours(0,0,0,0);
          return d.getTime() === day.getTime();
        })
        .reduce((s, o) => s + (o.total || 0), 0);
      return { label, value };
    });
  } else if (period === 'Month') {
    chartData = Array.from({ length: 30 }, (_, i) => {
      const day = new Date(today.getTime() - (29 - i) * DAY_MS);
      const label = i % 6 === 0 ? day.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }) : '';
      const value = completedOrders
        .filter(o => {
          const d = parseOrderDate(o.date); d.setHours(0,0,0,0);
          return d.getTime() === day.getTime();
        })
        .reduce((s, o) => s + (o.total || 0), 0);
      return { label, value };
    });
  } else {
    // Year — last 12 months
    chartData = Array.from({ length: 12 }, (_, i) => {
      const monthStart = new Date(today.getFullYear(), today.getMonth() - (11 - i), 1);
      const monthEnd   = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);
      const label = monthStart.toLocaleDateString('en-PH', { month: 'short' });
      const value = completedOrders
        .filter(o => { const d = parseOrderDate(o.date); return d >= monthStart && d < monthEnd; })
        .reduce((s, o) => s + (o.total || 0), 0);
      return { label, value };
    });
  }

  const periodSales = chartData.reduce((s, d) => s + d.value, 0);
  const salesPct    = Math.min(100, Math.round((periodSales / salesGoal) * 100));

  /* ── Category sales chart ── */
  const CATEGORY_COLORS = {
    'Coffee': '#6b4226', 'Milktea': '#f472b6', 'Matcha': '#4ade80',
    'Soda': '#38bdf8', 'Mocktails': '#fb923c', 'Lemonade': '#fbbf24',
    'Sides': '#94a3b8',
  };
  const categoryMap = {};
  completedOrders.forEach(o => {
    (o.items || []).forEach(itemStr => {
      const m = itemStr.match(/^(\d+)x\s+(.+)$/);
      if (!m) return;
      const qty  = parseInt(m[1], 10);
      const name = m[2].toLowerCase();
      const prod = products.find(p => p.name.toLowerCase() === name);
      const cat  = prod?.category || 'Other';
      categoryMap[cat] = (categoryMap[cat] || 0) + qty;
    });
  });
  const categoryData = Object.entries(categoryMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  /* ── Peak hours chart ── */
  const hourMap = {};
  orders
    .filter(o => o.status !== 'Cancelled' && o.status !== 'Awaiting Payment' && o.status !== 'Refunded')
    .forEach(o => {
      const d = parseOrderDate(o.date);
      if (isNaN(d.getTime())) return;
      const h = d.getHours();
      hourMap[h] = (hourMap[h] || 0) + 1;
    });
  const peakHoursData = Array.from({ length: 16 }, (_, i) => {
    const h = 6 + i;
    const label = h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`;
    return { label, value: hourMap[h] || 0 };
  });
  const peakHour = peakHoursData.reduce((best, d) => d.value > best.value ? d : best, { label: '—', value: 0 });

  /* ── Target sales (semicircle Pie) ── */
  const pieFilled   = salesPct;
  const pieEmpty    = 100 - salesPct;
  const pieData = [
    { name: 'filled', value: pieFilled   },
    { name: 'gap',    value: pieEmpty     },
    { name: 'hidden', value: 100          }, // bottom half hidden
  ];
  const PIE_COLORS = ['#6b4226', '#e8e0d8', 'transparent'];

  /* legend counts */
  const salesCount    = customerCount;
  const inactiveCount = pendingOrders.length;
  const offlineCount  = cancelledOrders.length;

  /* Week-over-week revenue trend */
  const thisWeekSales = completedOrders
    .filter(o => new Date(o.date || 0).getTime() >= today.getTime() - 6 * DAY_MS)
    .reduce((s, o) => s + (o.total || 0), 0);
  const lastWeekSales = completedOrders
    .filter(o => {
      const t = new Date(o.date || 0).getTime();
      return t >= today.getTime() - 13 * DAY_MS && t < today.getTime() - 6 * DAY_MS;
    })
    .reduce((s, o) => s + (o.total || 0), 0);
  const trendPct = lastWeekSales > 0
    ? (((thisWeekSales - lastWeekSales) / lastWeekSales) * 100).toFixed(1)
    : thisWeekSales > 0 ? '100.0' : '0.0';
  const trendUp   = parseFloat(trendPct) >= 0;
  const trendText = `${trendUp ? '▲' : '▼'} ${Math.abs(trendPct)}% vs last week`;

  return (
    <div className="adm-content home-content">

      {/* ── Header row ── */}
      <div className="home-header">
        <div>
          <h1 className="adm-page-title">Dashboard</h1>
          <p className="home-datetime">{dayFmt} | {clock}</p>
        </div>
        <div className="home-user-info">
          <span className="home-username">{adminName}</span>
          <button className="home-avatar" onClick={onAvatarClick} title="View profile">
            {session?.profilePicture
              ? <img src={session.profilePicture} alt={adminName} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', display: 'block' }} />
              : initials}
          </button>
        </div>
      </div>

      {/* ── Row 1: Stat cards + Stock alert ── */}
      <div className="home-stats-row">
        {/* 2×3 grid of stat cards */}
        <div className="home-stats-left">
          {/* Row A */}
          <div className="home-stat-card">
            <p className="home-stat-label">Customers served</p>
            <p className="home-stat-value">{customerCount}</p>
            <p className="home-stat-trend"><span className={`trend-arrow${trendUp ? '' : ' trend-arrow--down'}`}>{trendText}</span></p>
          </div>
          <div className="home-stat-card">
            <p className="home-stat-label">Sales</p>
            <p className="home-stat-value">₱{salesFmt}</p>
            <p className="home-stat-trend"><span className={`trend-arrow${trendUp ? '' : ' trend-arrow--down'}`}>{trendText}</span></p>
          </div>
          <div className="home-stat-card">
            <p className="home-stat-label">Average Meal Value</p>
            <p className="home-stat-value">{avgMeal}</p>
            <p className="home-stat-trend"><span className={`trend-arrow${trendUp ? '' : ' trend-arrow--down'}`}>{trendText}</span></p>
          </div>
          {/* Row B */}
          <div className="home-stat-card">
            <p className="home-stat-label">Refunds</p>
            <p className="home-stat-value">{orders.filter(o => o.status === 'Refunded').length}</p>
            <p className="home-stat-trend"><span className={`trend-arrow${trendUp ? '' : ' trend-arrow--down'}`}>{trendText}</span></p>
          </div>
          <div className="home-stat-card">
            <p className="home-stat-label">Voids</p>
            <p className="home-stat-value">{orders.filter(o => o.status === 'Cancelled').length}</p>
            <p className="home-stat-trend"><span className={`trend-arrow${trendUp ? '' : ' trend-arrow--down'}`}>{trendText}</span></p>
          </div>
          <div className="home-stat-card">
            <p className="home-stat-label">Total Orders</p>
            <p className="home-stat-value">{orders.length}</p>
            <p className="home-stat-trend"><span className={`trend-arrow${trendUp ? '' : ' trend-arrow--down'}`}>{trendText}</span></p>
          </div>
        </div>

        {/* Stock alert */}
        <div className="home-stock-alert adm-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontWeight: 700, fontSize: '0.95rem' }}>Stock alert</h3>
            <button style={{ background: 'none', border: 'none', fontSize: '0.75rem', color: '#6b4226', fontWeight: 600, cursor: 'pointer' }}>See all</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {stockItems.map(item => (
              <div key={item.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '7px' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1a1a1a' }}>{item.name}</span>
                  <span style={{ fontSize: '0.72rem', color: item.color, fontWeight: 600 }}>{item.status}</span>
                </div>
                <div style={{ height: '8px', borderRadius: '99px', background: '#f0ebe4', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${item.pct}%`, borderRadius: '99px', background: '#6b4226', transition: 'width 0.6s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Row 2: Area chart + Donut gauge ── */}
      <div className="home-charts-row">

        {/* Sales goal area chart */}
        <div className="adm-card home-chart-card home-chart-card--wide">
          <p className="home-chart-subtitle">Statistics</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontWeight: 700, fontSize: '1rem', margin: 0 }}>Sales goal</h3>
              {!editingGoal && (
                <button
                  title="Edit sales goal"
                  onClick={() => { setGoalDraft(String(salesGoal)); setEditingGoal(true); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', color: '#a0a0a0', fontSize: '0.8rem', lineHeight: 1 }}
                >
                  ✏
                </button>
              )}
            </div>
            <select
              value={period}
              onChange={e => setPeriod(e.target.value)}
              style={{
                fontSize: '0.8rem', padding: '4px 10px', border: '1.5px solid #e0d9d0',
                borderRadius: '8px', fontFamily: 'Inter, sans-serif', cursor: 'pointer',
                color: '#5a5450', background: '#fff', outline: 'none',
              }}
            >
              <option>Today</option>
              <option>Week</option>
              <option>Month</option>
              <option>Year</option>
            </select>
          </div>

          <p style={{ fontSize: '2rem', fontWeight: 800, color: '#1a1a1a', margin: '0 0 4px' }}>{salesPct}%</p>
          {editingGoal ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '0 0 12px' }}>
              <span style={{ fontSize: '0.78rem', color: '#5a5450' }}>₱</span>
              <input
                type="number"
                min="1"
                value={goalDraft}
                onChange={e => setGoalDraft(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const v = parseInt(goalDraft, 10);
                    if (v > 0) { setSalesGoal(v); localStorage.setItem('jazsam_sales_goal', v); }
                    setEditingGoal(false);
                  }
                  if (e.key === 'Escape') setEditingGoal(false);
                }}
                autoFocus
                style={{ width: '120px', padding: '3px 8px', border: '1.5px solid #6b4226', borderRadius: '6px', fontSize: '0.85rem', outline: 'none' }}
              />
              <button
                onClick={() => {
                  const v = parseInt(goalDraft, 10);
                  if (v > 0) { setSalesGoal(v); localStorage.setItem('jazsam_sales_goal', v); }
                  setEditingGoal(false);
                }}
                style={{ padding: '3px 10px', background: '#6b4226', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Save
              </button>
              <button
                onClick={() => setEditingGoal(false)}
                style={{ padding: '3px 10px', background: '#f4f1ee', color: '#5a5450', border: 'none', borderRadius: '6px', fontSize: '0.78rem', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <p style={{ fontSize: '0.75rem', color: '#a0a0a0', margin: '0 0 12px' }}>
              ₱{periodSales.toLocaleString('en-PH', { minimumFractionDigits: 2 })} of ₱{salesGoal.toLocaleString()} goal
            </p>
          )}

          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#7b9cef" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#7b9cef" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#f0ebe4" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#a0a0a0' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#a0a0a0' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => v >= 1000 ? `${v/1000}k` : v}
              />
              <Tooltip content={<SalesTooltip />} cursor={{ stroke: '#6b4226', strokeWidth: 1, strokeDasharray: '4 2' }} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#5b7fe8"
                strokeWidth={2.5}
                fill="url(#salesGrad)"
                dot={false}
                activeDot={{ r: 6, fill: '#4060cf', strokeWidth: 2, stroke: '#fff' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Target sales semicircle gauge */}
        <div className="adm-card home-chart-card home-gauge-card">
          <p className="home-chart-subtitle">Statistics</p>
          <h3 style={{ fontWeight: 700, fontSize: '1rem', margin: '0 0 8px' }}>Target sales</h3>

          <div className="home-gauge-wrap">
            {/* Recharts PieChart as semicircle: startAngle 180, endAngle 0 */}
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%" cy="82%"
                  startAngle={180}
                  endAngle={0}
                  innerRadius={65}
                  outerRadius={90}
                  paddingAngle={0}
                  dataKey="value"
                  strokeWidth={0}
                >
                  <Cell fill="#6b4226" />
                  <Cell fill="#e8e0d8" />
                  <Cell fill="transparent" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Center label */}
            <div className="home-gauge-label">
              <span style={{ fontSize: '0.72rem', color: '#7a7472' }}>Total Count</span>
              <span style={{ fontSize: '1.7rem', fontWeight: 800, color: '#1a1a1a', lineHeight: 1.1 }}>₱{salesFmt}</span>
            </div>
          </div>

          {/* Legend */}
          <div className="home-gauge-legend">
            <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#7c3aed', marginRight: 5 }} />Sales <strong>{salesCount}</strong></span>
            <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', border: '1.5px solid #a0a0a0', marginRight: 5 }} />Inactive <strong>{inactiveCount}</strong></span>
            <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#f9a8d4', marginRight: 5 }} />Offline <strong>{offlineCount}</strong></span>
          </div>
        </div>

      </div>

      {/* ── Row 3: Category breakdown + Peak hours ── */}
      <div className="home-charts-row home-charts-row--equal">

        {/* Category sales */}
        <div className="adm-card home-chart-card">
          <p className="home-chart-subtitle">Statistics</p>
          <h3 style={{ fontWeight: 700, fontSize: '1rem', margin: '0 0 4px' }}>Sales by Category</h3>
          <p style={{ fontSize: '0.75rem', color: '#a0a0a0', margin: '0 0 12px' }}>
            Items sold per product category
          </p>
          {categoryData.length === 0 ? (
            <p style={{ fontSize: '0.82rem', color: '#a0a0a0', textAlign: 'center', padding: '32px 0' }}>
              No completed orders yet.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
                <XAxis type="number" tick={{ fontSize: 11, fill: '#a0a0a0' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#5a5450', fontWeight: 600 }} axisLine={false} tickLine={false} width={72} />
                <Tooltip
                  formatter={(v) => [`${v} item${v !== 1 ? 's' : ''}`, 'Sold']}
                  contentStyle={{ background: '#1a1a1a', border: 'none', borderRadius: 8, color: '#fff', fontSize: '0.8rem' }}
                  itemStyle={{ color: '#fff' }}
                  labelStyle={{ color: '#a0a0a0', fontWeight: 400 }}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={18}>
                  {categoryData.map((entry) => (
                    <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] || '#d1d5db'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Peak hours */}
        <div className="adm-card home-chart-card">
          <p className="home-chart-subtitle">Statistics</p>
          <h3 style={{ fontWeight: 700, fontSize: '1rem', margin: '0 0 4px' }}>Busiest Hours</h3>
          <p style={{ fontSize: '0.75rem', color: '#a0a0a0', margin: '0 0 12px' }}>
            {peakHour.value > 0
              ? <><strong style={{ color: '#6b4226' }}>{peakHour.label}</strong> is your peak — {peakHour.value} order{peakHour.value !== 1 ? 's' : ''}</>
              : 'Orders by hour of the day'}
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={peakHoursData} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#a0a0a0' }} axisLine={false} tickLine={false} interval={1} />
              <YAxis tick={{ fontSize: 11, fill: '#a0a0a0' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                formatter={(v) => [`${v} order${v !== 1 ? 's' : ''}`, 'Orders']}
                contentStyle={{ background: '#1a1a1a', border: 'none', borderRadius: 8, color: '#fff', fontSize: '0.8rem' }}
                itemStyle={{ color: '#fff' }}
                labelStyle={{ color: '#a0a0a0', fontWeight: 400 }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={22}>
                {peakHoursData.map((entry) => (
                  <Cell
                    key={entry.label}
                    fill={entry.label === peakHour.label && peakHour.value > 0 ? '#6b4226' : '#7b9cef'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
}


/* ══════════════════════════════════════════════════
   SECTION: PRODUCTS  (card layout + side panel)
   ══════════════════════════════════════════════════ */

/* Category tab config — uses real icons from /public */
const CATEGORIES = [
  { id: 'All',       label: 'All',       icon: '/fast-food-svgrepo-com.svg' },
  { id: 'Coffee',    label: 'Coffee',    icon: '/coffee-icon.png'  },
  { id: 'Milktea',   label: 'Milktea',   icon: '/milktea-icon.png' },
  { id: 'Soda',      label: 'Soda',      icon: '/soda-icon.png'    },
  { id: 'Mocktails', label: 'Mocktails', icon: '/mocktail.png'     },
  { id: 'Sides',     label: 'Sides',     icon: '/sides-icon.png'   },
];

/* Ingredients list populated dynamically from inventory; static fallback below */
const INGREDIENTS_FALLBACK = ['Espresso Shot', 'Milk', 'Coffee Beans', 'Orange Juice', 'Lemon', 'Brown Sugar', 'Cream'];
const QTY_UNITS = ['10ml', '20ml', '50ml', '100ml', '200ml', '1 shot', '1 scoop', '1 pc', '1 tbsp'];
const SIZE_OPTIONS_OZ    = ['8oz', '12oz', '16oz', '22oz'];
const SIZE_OPTIONS_LABEL = ['Small', 'Medium', 'Large', 'XXL'];
function getSizeOptions(sizeType) {
  return sizeType === 'S/M/L' ? SIZE_OPTIONS_LABEL : SIZE_OPTIONS_OZ;
}

/* Image placeholder */
function ImgPlaceholder() {
  return (
    <div className="prod-img-placeholder">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#b0a89e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
    </div>
  );
}

const SIZE_ABBR = { Small: 'S', Medium: 'M', Large: 'L', XXL: 'XL', '8oz': '8', '12oz': '12', '16oz': '16', '22oz': '22' };

/* Size badge chip */
function SizeChip({ label }) {
  const isBrown = ['8oz','12oz','16oz','22oz'].includes(label);
  return (
    <span className={`prod-chip ${isBrown ? 'prod-chip--brown' : 'prod-chip--outline'}`}>
      {SIZE_ABBR[label] ?? label}
    </span>
  );
}

/* Temperature badge chip */
function TempChip({ label }) {
  const isHot = label === 'Hot';
  return (
    <span className={`prod-chip ${isHot ? 'prod-chip--brown' : 'prod-chip--cold'}`} title={label}>
      {isHot ? Icon.hotTea : Icon.snowflake}
    </span>
  );
}

/* Product card */
function ProductCard({ product, onEdit, onDelete, canEdit = true }) {
  const sizes = product.sizes || [];
  const temps = product.temps || [];
  const hasSizes = sizes.length > 0;

  return (
    <div className="prod-card">
      <div className="prod-card__img">
        {product.image
          ? <img src={product.image} alt={product.name} />
          : <ImgPlaceholder />
        }
      </div>
      <div className="prod-card__info">
        <p className="prod-card__name">{product.name}</p>
        <p className="prod-card__price">₱ {product.price.toFixed(2)}</p>
        <div className="prod-card__avail">
          <span className={`prod-avail-badge ${product.status === 'available' ? 'prod-avail-badge--green' : 'prod-avail-badge--red'}`}>
            {product.status.toUpperCase()}
          </span>
        </div>
      </div>
      <div className="prod-card__right">
        {hasSizes && (
          <div className="prod-card__meta">
            <span className="prod-card__meta-label">Size</span>
            <div className="prod-card__chips">
              {sizes.map(s => <SizeChip key={s} label={s} />)}
            </div>
          </div>
        )}
        {temps.length > 0 && (
          <div className="prod-card__meta">
            <span className="prod-card__meta-label">Temperature</span>
            <div className="prod-card__chips">
              {temps.map(t => <TempChip key={t} label={t} />)}
            </div>
          </div>
        )}
        {canEdit && (
          <div className="prod-card__actions">
            <button className="adm-action-btn adm-action-btn--red"  onClick={() => onDelete(product.id)} title="Delete">{Icon.trash}</button>
            <button className="adm-action-btn adm-action-btn--blue" onClick={() => onEdit(product)}      title="Edit">{Icon.edit}</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Add/Edit Product Side Panel ── */
function ProductPanel({ open, mode, product, onClose, onSave, ingredientsList = INGREDIENTS_FALLBACK }) {
  const fileInputRef               = useRef(null);
  const [activeTab,    setActiveTab]   = useState('info');
  const [productName,  setProductName] = useState('');
  const [pCategory,    setPCategory]   = useState('Beverage');
  const [bevType,      setBevType]     = useState('Coffee');
  const [foodType,     setFoodType]    = useState('Sides');
  const [temperature,  setTemperature] = useState([]);
  const [imageTab,       setImageTab]      = useState('upload');
  const [imagePreview,   setImagePreview]  = useState(null);
  const [imageUrl,       setImageUrl]      = useState('');
  const [imageUploading, setImageUploading]= useState(false);
  const [uploadError,    setUploadError]   = useState('');
  const [available,    setAvailable]   = useState(true);
  const [sizeType,     setSizeType]    = useState('Oz');
  const [variants,     setVariants]    = useState([{ size: '12oz', price: '120.00' }]);
  const [ingredients,  setIngredients] = useState([{ ingredient: 'Espresso Shot', qty: '10ml' }]);

  /* Price field for non-variant (food) products */
  const [basePrice, setBasePrice] = useState('0.00');

  /* Proper reset via useEffect */
  useEffect(() => {
    if (!open) return;
    setActiveTab('info');
    setProductName(product?.name   || '');
    const isFood = ['Sides', 'Meals'].includes(product?.category); // keep Meals for backward compat
    setPCategory(isFood ? 'Food' : 'Beverage');
    setFoodType(isFood ? (product?.category || 'Sides') : 'Sides');
    setBevType(
      product?.category === 'Milktea'   ? 'Milktea'   :
      product?.category === 'Soda'      ? 'Soda'      :
      product?.category === 'Mocktails' ? 'Mocktails' : 'Coffee'
    );
    setTemperature(product?.temps  || []);
    setAvailable(product?.status  !== 'unavailable');
    setImageTab('upload');
    setImagePreview(product?.image || null);
    setImageUrl('');
    setUploadError('');
    const priceFallback = String((product?.price ?? 0).toFixed(2));
    setBasePrice(priceFallback);
    const newSizeType = (product?.sizes || []).some(s => SIZE_OPTIONS_LABEL.includes(s)) ? 'S/M/L' : 'Oz';
    setSizeType(newSizeType);
    if ((product?.variants || []).length) {
      /* Restore full variant rows (with variantId + price) from API data */
      setVariants(product.variants.map(v => ({
        variantId: v.variantId,
        size:      v.size || (newSizeType === 'S/M/L' ? 'Small' : '12oz'),
        price:     String((v.price ?? 0).toFixed(2)),
      })));
    } else if ((product?.sizes || []).length) {
      setVariants(product.sizes.map(s => ({ size: s, price: priceFallback })));
    } else {
      setVariants([{ size: newSizeType === 'S/M/L' ? 'Small' : '12oz', price: priceFallback }]);
    }
    setIngredients([{ ingredient: 'Espresso Shot', qty: '10ml' }]);
  }, [open, product]);

  async function handleFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploadError('');
    setImagePreview(URL.createObjectURL(f));
    setImageUploading(true);
    try {
      const session = JSON.parse(localStorage.getItem('jazsam_admin') || 'null');
      const headers = session?.token ? { Authorization: `Bearer ${session.token}` } : {};
      const form = new FormData();
      form.append('image', f);
      const res  = await fetch('http://localhost/salespresso-api/upload.php', { method: 'POST', headers, body: form });
      const data = await res.json();
      if (data.url) {
        setImagePreview(data.url);
      } else {
        // Upload failed — clear the blob so it doesn't get saved to DB
        setImagePreview(null);
        setUploadError(data.error || 'Upload failed. Please try again.');
      }
    } catch {
      setImagePreview(null);
      setUploadError('Upload failed. Check your connection and try again.');
    }
    finally { setImageUploading(false); }
  }

  function handleSave() {
    const isFood = pCategory === 'Food';
    onSave({
      id:       product?.id || `p${Date.now()}`,
      name:     productName,
      category: isFood ? foodType : bevType,
      price:    parseFloat(isFood ? basePrice : (variants[0]?.price || 0)),
      sizes:    isFood ? [] : variants.map(v => v.size),
      temps:    temperature,
      status:   available ? 'available' : 'unavailable',
      image:    imageTab === 'url' ? imageUrl : imagePreview,
      variants: isFood
        ? [{ size: null, price: parseFloat(basePrice) }]
        : variants.map(v => ({
            variantId: v.variantId ?? null,
            size:      v.size,
            price:     parseFloat(v.price) || 0,
          })),
    });
    window.dispatchEvent(new CustomEvent('jazsam_toast', { detail: { message: 'Changes saved!' } }));
    onClose();
  }

  function toggleTemp(t) {
    setTemperature(prev =>
      prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
    );
  }

  function addVariant()      { setVariants(v => [...v, { size: sizeType === 'S/M/L' ? 'Small' : '8oz', price: '0.00' }]); }
  function removeVariant(i)  { setVariants(v => v.filter((_, idx) => idx !== i)); }
  function updateVariant(i, field, val) {
    setVariants(v => v.map((item, idx) => idx === i ? { ...item, [field]: val } : item));
  }

  function addIngredient()      { setIngredients(v => [...v, { ingredient: 'Milk', qty: '10ml' }]); }
  function removeIngredient(i)  { setIngredients(v => v.filter((_, idx) => idx !== i)); }
  function updateIngredient(i, field, val) {
    setIngredients(v => v.map((item, idx) => idx === i ? { ...item, [field]: val } : item));
  }

  const isEdit = mode === 'edit';

  return (
    <>
      {/* Backdrop (mobile) */}
      {open && <div className="pp-backdrop" onClick={onClose} />}

      <aside className={`pp-panel ${open ? 'pp-panel--open' : ''}`}>
        <div className="pp-inner">
          {/* Header */}
          <div className="pp-header">
            <h2 className="pp-title">{isEdit ? 'Edit Product' : 'Add New Product'}</h2>
          </div>

          {/* Tabs */}
          <div className="pp-tabs">
            {['info', 'variants', 'recipe'].map(t => (
              <button
                key={t}
                className={`pp-tab ${activeTab === t ? 'pp-tab--active' : ''}`}
                onClick={() => setActiveTab(t)}
              >
                {t === 'info' ? 'Product Info' : t === 'variants' ? 'Variants' : 'Recipe'}
              </button>
            ))}
          </div>

          {/* ── TAB: Product Info ── */}
          {activeTab === 'info' && (
            <div className="pp-body">
              <div className="pp-field">
                <label className="pp-label">Product Name</label>
                <input
                  className="pp-input"
                  type="text"
                  placeholder="e.g. Hazelnut Latte"
                  value={productName}
                  onChange={e => setProductName(e.target.value)}
                />
              </div>

              <div className="pp-field">
                <label className="pp-label">Product Category</label>
                <select className="pp-select" value={pCategory} onChange={e => setPCategory(e.target.value)}>
                  <option>Beverage</option>
                  <option>Food</option>
                </select>
              </div>

              {pCategory === 'Food' && (
                <div className="pp-field">
                  <label className="pp-label">Food Type</label>
                  <select className="pp-select" value={foodType} onChange={e => setFoodType(e.target.value)}>
                    <option>Sides</option>
                  </select>
                </div>
              )}

              {pCategory === 'Beverage' && (
                <div className="pp-field">
                  <label className="pp-label">Beverage Type</label>
                  <select className="pp-select" value={bevType} onChange={e => setBevType(e.target.value)}>
                    <option>Coffee</option>
                    <option>Milktea</option>
                    <option>Soda</option>
                    <option>Mocktails</option>
                  </select>
                </div>
              )}

              <div className="pp-field">
                <label className="pp-label">Temperature</label>
                <div className="pp-temp-row">
                  {['Hot', 'Iced'].map(t => (
                    <button
                      key={t}
                      type="button"
                      className={`pp-temp-btn ${temperature.includes(t) ? 'pp-temp-btn--active' : ''}`}
                      onClick={() => toggleTemp(t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Base price field for Food items (no variant sizes) */}
              {pCategory === 'Food' && (
                <div className="pp-field">
                  <label className="pp-label">Price (₱)</label>
                  <input
                    className="pp-input"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={basePrice}
                    onChange={e => setBasePrice(e.target.value)}
                  />
                </div>
              )}

              <div className="pp-field">
                <label className="pp-label">Product Image</label>
                <div className="pp-img-tabs">
                  <button
                    type="button"
                    className={`pp-img-tab ${imageTab === 'upload' ? 'pp-img-tab--active' : ''}`}
                    onClick={() => setImageTab('upload')}
                  >
                    Upload Image
                  </button>
                  <button
                    type="button"
                    className={`pp-img-tab ${imageTab === 'url' ? 'pp-img-tab--active' : ''}`}
                    onClick={() => setImageTab('url')}
                  >
                    Paste URL
                  </button>
                </div>
                <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFile} />
                {imageTab === 'upload' ? (
                  <div className="pp-dropzone" onClick={() => !imageUploading && fileInputRef.current?.click()}>
                    {imageUploading
                      ? <span style={{fontSize:'12px',color:'#b0a89e'}}>Uploading…</span>
                      : imagePreview
                        ? <img src={imagePreview} alt="preview" style={{width:'80px',height:'80px',objectFit:'cover',borderRadius:'8px'}} />
                        : <><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#b0a89e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg><span>Click to upload or drag &amp; drop</span></>
                    }
                  </div>
                ) : (
                  <input className="pp-input" type="url" placeholder="https://example.com/image.jpg" value={imageUrl} onChange={e => setImageUrl(e.target.value)} />
                )}
                {uploadError && (
                  <p style={{ fontSize: '0.75rem', color: '#dc2626', margin: '6px 0 0' }}>{uploadError}</p>
                )}
              </div>

              <div className="pp-checkbox-row">
                <input
                  type="checkbox"
                  id="pp-avail"
                  checked={available}
                  onChange={e => setAvailable(e.target.checked)}
                />
                <label htmlFor="pp-avail">Mark as available for ordering</label>
              </div>
            </div>
          )}

          {/* ── TAB: Variants ── */}
          {activeTab === 'variants' && (
            <div className="pp-body">
              <div className="pp-field">
                <label className="pp-label">Size Type</label>
                <select
                  className="pp-select"
                  value={sizeType}
                  onChange={e => {
                    const t = e.target.value;
                    setSizeType(t);
                    setVariants([{ size: t === 'S/M/L' ? 'Small' : '12oz', price: '120.00' }]);
                  }}
                >
                  <option>Oz</option>
                  <option>S/M/L</option>
                </select>
              </div>

              <div className="pp-variants-hdr">
                <label className="pp-label">Sizes in {sizeType === 'S/M/L' ? 's/m/l' : 'oz'}</label>
                <button type="button" className="pp-add-link" onClick={addVariant}>+ Add Size</button>
              </div>

              {variants.map((v, i) => (
                <div key={i} className="pp-variant-row">
                  <div className="pp-price-wrap">
                    <span className="pp-price-prefix">Size</span>
                    <select
                      className="pp-select pp-select--sm"
                      value={v.size}
                      onChange={e => updateVariant(i, 'size', e.target.value)}
                    >
                      {getSizeOptions(sizeType).map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="pp-price-wrap">
                    <span className="pp-price-prefix">Price (₱)</span>
                    <input
                      className="pp-input pp-input--price"
                      type="number"
                      step="0.01"
                      value={v.price}
                      onChange={e => updateVariant(i, 'price', e.target.value)}
                    />
                  </div>
                  <div className="pp-remove-wrap">
                    <button
                      type="button"
                      className="pp-remove-btn"
                      onClick={() => removeVariant(i)}
                      disabled={variants.length <= 1}
                    >✕</button>
                  </div>
                </div>
              ))}

              <div className="pp-checkbox-row" style={{ marginTop: '12px' }}>
                <input
                  type="checkbox"
                  id="pp-avail-v"
                  checked={available}
                  onChange={e => setAvailable(e.target.checked)}
                />
                <label htmlFor="pp-avail-v">Mark as available for ordering</label>
              </div>
            </div>
          )}

          {/* ── TAB: Recipe ── */}
          {activeTab === 'recipe' && (
            <div className="pp-body">
              <div className="pp-recipe-info">
                Select ingredients from inventory and specify quantities used per serving.
              </div>

              <div className="pp-variants-hdr">
                <span />
                <button type="button" className="pp-add-link" onClick={addIngredient}>+ Add Ingredient</button>
              </div>

              {ingredients.map((ing, i) => (
                <div key={i} className="pp-variant-row pp-variant-row--recipe">
                  <div className="pp-ing-col">
                    <span className="pp-col-label">Ingredient</span>
                    <select
                      className="pp-select pp-select--sm"
                      value={ing.ingredient}
                      onChange={e => updateIngredient(i, 'ingredient', e.target.value)}
                    >
                      {ingredientsList.map(n => <option key={n}>{n}</option>)}
                    </select>
                  </div>
                  <div className="pp-ing-col">
                    <span className="pp-col-label">Quantity Used</span>
                    <select
                      className="pp-select pp-select--sm"
                      value={ing.qty}
                      onChange={e => updateIngredient(i, 'qty', e.target.value)}
                    >
                      {QTY_UNITS.map(q => <option key={q}>{q}</option>)}
                    </select>
                  </div>
                  <button
                    type="button"
                    className="pp-remove-btn"
                    style={{ alignSelf: 'flex-end' }}
                    onClick={() => removeIngredient(i)}
                    disabled={ingredients.length <= 1}
                  >✕</button>
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="pp-footer">
            <button type="button" className="pp-cancel" onClick={onClose}>Cancel</button>
            <button type="button" className="pp-submit" onClick={handleSave}>{isEdit ? 'Save Changes' : 'Add'}</button>
          </div>
        </div>
      </aside>
    </>
  );
}

function ProductsSection({ role = 'admin' }) {
  const canEdit = role === 'admin';
  const { products, addProduct, updateProduct, deleteProduct, inventory } = useStore();
  const ingredientsList = inventory.length
    ? inventory.map(i => i.name)
    : INGREDIENTS_FALLBACK;
  const [search,      setSearch]      = useState('');
  const [filter,      setFilter]      = useState('All');
  const [page,        setPage]        = useState(1);
  const [panelOpen,   setPanelOpen]   = useState(false);
  const [panelMode,   setPanelMode]   = useState('add');
  const [editProduct, setEditProduct] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const ITEMS_PER_PAGE = 15;
  const FOOD_CATS = ['Sides'];
  const filtered  = products.filter(p => {
    const catMatch =
      filter === 'All'      ? true :
      filter === 'Food'     ? FOOD_CATS.includes(p.category) :
      filter === 'Beverage' ? !FOOD_CATS.includes(p.category) :
      p.category === filter;
    return catMatch && p.name.toLowerCase().includes(search.toLowerCase());
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated  = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const available = products.filter(p => p.status === 'available').length;
  const foodCount = products.filter(p => FOOD_CATS.includes(p.category)).length;
  const beverages = products.filter(p => !FOOD_CATS.includes(p.category)).length;

  function applyFilter(f) { setFilter(f); setPage(1); }
  function applySearch(v) { setSearch(v); setPage(1); }

  function openAdd()        { setPanelMode('add');  setEditProduct(null); setPanelOpen(true); setConfirmDeleteId(null); }
  function openEdit(prod)   { setPanelMode('edit'); setEditProduct(prod); setPanelOpen(true); setConfirmDeleteId(null); }
  function handleDelete(id) {
    deleteProduct(id);
    setConfirmDeleteId(null);
  }
  function handleSave(data) {
    if (panelMode === 'edit') updateProduct(data);
    else addProduct(data);
  }

  return (
    <div className="adm-content adm-content--products">
      {/* Delete confirm modal */}
      {confirmDeleteId && (() => {
        const p = products.find(x => x.id === confirmDeleteId);
        return p ? (
          <DeleteConfirmModal
            name={p.name}
            onConfirm={() => handleDelete(confirmDeleteId)}
            onCancel={() => setConfirmDeleteId(null)}
          />
        ) : null;
      })()}

      <div className="adm-page-header">
        <h1 className="adm-page-title">Products</h1>
        {canEdit && <button className="adm-btn-add" onClick={openAdd}>{Icon.plus} Add a product</button>}
      </div>

      <div className="prod-cat-tabs">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            className={`prod-cat-tab ${filter === cat.id ? 'prod-cat-tab--active' : ''}`}
            onClick={() => applyFilter(cat.id)}
          >
            <img src={cat.icon} alt={cat.label} className="prod-cat-tab__icon" />
            <span className="prod-cat-tab__label">{cat.label}</span>
          </button>
        ))}
      </div>

      <div className="prod-list-hdr">
        <h2 className="prod-list-heading">{filter}</h2>
        <div className="adm-search prod-search">
          {Icon.search}
          <input type="text" placeholder="Enter Product Name" value={search} onChange={e => applySearch(e.target.value)} />
        </div>
      </div>

      <div className="adm-count-pills">
        <button className={`adm-pill adm-pill--btn${filter === 'All' ? ' adm-pill--active' : ''}`} onClick={() => applyFilter('All')}>{products.length} total</button>
        <span className="adm-pill adm-pill--green">{available} available</span>
        <button className={`adm-pill adm-pill--btn${filter === 'Food' ? ' adm-pill--active' : ''}`} onClick={() => applyFilter('Food')}>{foodCount} food</button>
        <button className={`adm-pill adm-pill--btn${filter === 'Beverage' ? ' adm-pill--active' : ''}`} onClick={() => applyFilter('Beverage')}>{beverages} beverages</button>
      </div>

      <div className="prod-list">
        {paginated.map(p => (
          <ProductCard key={p.id} product={p} onEdit={openEdit} onDelete={(id) => setConfirmDeleteId(id)} canEdit={canEdit} />
        ))}
        {filtered.length === 0 && <p className="adm-muted" style={{padding:'24px 0'}}>No products found.</p>}
      </div>

      {totalPages > 1 && (
        <div className="prod-pagination">
          <button className="prod-page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>&#8249;</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
            <button
              key={n}
              className={`prod-page-btn${page === n ? ' prod-page-btn--active' : ''}`}
              onClick={() => setPage(n)}
            >{n}</button>
          ))}
          <button className="prod-page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>&#8250;</button>
          <span className="prod-page-info">{(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}</span>
        </div>
      )}

      <ProductPanel
        open={panelOpen}
        mode={panelMode}
        product={editProduct}
        onClose={() => setPanelOpen(false)}
        onSave={handleSave}
        ingredientsList={ingredientsList}
      />
    </div>
  );
}


/* ══════════════════════════════════════════════════
   SECTION: INVENTORY
   ══════════════════════════════════════════════════ */
function InventorySection() {
  const { inventory, addInventory, updateInventory, deleteInventory, restockInventory } = useStore();
  const [search, setSearch] = useState('');
  const [restockId, setRestockId] = useState(null);
  const [restockAmt, setRestockAmt] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', qty: '', unit: 'g', threshold: '' });

  const filtered = inventory.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
  const inStock  = inventory.filter(i => i.status === 'In Stock').length;
  const low      = inventory.filter(i => i.status === 'Low Stock').length;
  const out      = inventory.filter(i => i.status === 'Out of Stock').length;

  function handleRestock(id) {
    const amt = parseInt(restockAmt, 10);
    if (amt > 0) { restockInventory(id, amt); setRestockId(null); setRestockAmt(''); }
  }
  function handleDelete(id) {
    deleteInventory(id);
    setConfirmDeleteId(null);
  }
  function handleAddItem() {
    if (!newItem.name.trim()) return;
    const qty = parseInt(newItem.qty, 10) || 0;
    const threshold = parseInt(newItem.threshold, 10) || 0;
    let status = 'In Stock';
    if (qty <= 0) status = 'Out of Stock';
    else if (qty <= threshold) status = 'Low Stock';
    addInventory({ ...newItem, qty, threshold, status });
    setNewItem({ name: '', qty: '', unit: 'g', threshold: '' });
    setShowAdd(false);
  }

  return (
    <div className="adm-content">
      {/* Delete confirm modal */}
      {confirmDeleteId && (() => {
        const item = inventory.find(x => x.id === confirmDeleteId);
        return item ? (
          <DeleteConfirmModal
            name={item.name}
            onConfirm={() => handleDelete(confirmDeleteId)}
            onCancel={() => setConfirmDeleteId(null)}
          />
        ) : null;
      })()}

      {/* Add ingredient right panel */}
      {showAdd && <div className="pp-backdrop" onClick={() => setShowAdd(false)} />}
      <aside className={`pp-panel ${showAdd ? 'pp-panel--open' : ''}`}>
        <div className="pp-inner">
          <div className="pp-header">
            <h2 className="pp-title">Add New Item</h2>
          </div>
          <div className="pp-body">
            <div className="pp-field">
              <label className="pp-label">Name</label>
              <input className="pp-input" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} placeholder="Item name" />
            </div>
            <div className="pp-field">
              <label className="pp-label">Quantity</label>
              <input className="pp-input" type="number" min="0" value={newItem.qty} onChange={e => setNewItem({...newItem, qty: Math.max(0, e.target.value)})} placeholder="0" />
            </div>
            <div className="pp-field">
              <label className="pp-label">Unit</label>
              <select className="pp-select" value={newItem.unit} onChange={e => setNewItem({...newItem, unit: e.target.value})}>
                <option>g</option>
                <option>ml</option>
                <option>pcs</option>
                <option>kg</option>
              </select>
            </div>
            <div className="pp-field">
              <label className="pp-label">Threshold</label>
              <input className="pp-input" type="number" min="0" value={newItem.threshold} onChange={e => setNewItem({...newItem, threshold: Math.max(0, e.target.value)})} placeholder="0" />
            </div>
          </div>
          <div className="pp-footer">
            <button className="pp-cancel" onClick={() => setShowAdd(false)}>Cancel</button>
            <button className="pp-submit" onClick={handleAddItem}>Add Item</button>
          </div>
        </div>
      </aside>

      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Inventory</h1>
          <p className="adm-page-desc">Track ingredients and stock levels.</p>
        </div>
        <button className="adm-btn-add" onClick={() => setShowAdd(true)}>{Icon.plus} Add ingredient</button>
      </div>

      <div className="adm-filters">
        <SearchBar value={search} onChange={setSearch} placeholder="Enter Item Name" />
      </div>

      <div className="adm-count-pills">
        <span className="adm-pill">{inventory.length} total</span>
        <span className="adm-pill adm-pill--green">{inStock} in stock</span>
        <span className="adm-pill adm-pill--yellow">{low} low stock</span>
        <span className="adm-pill adm-pill--red">{out} out of stock</span>
      </div>

      <div className="adm-card adm-card--flush">
        <table className="adm-table">
          <thead>
            <tr>
              <th>Item Name</th><th>Stock Quantity</th><th>Threshold</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(i => (
              <>
                <tr key={i.id}>
                  <td className="adm-bold">{i.name}</td>
                  <td>{i.qty} {i.unit}</td>
                  <td className="adm-muted">{i.threshold} {i.unit}</td>
                  <td><StatusBadge status={i.status} /></td>
                  <td>
                    <div className="adm-actions">
                      <button
                        className={`adm-action-btn ${restockId === i.id ? 'adm-action-btn--brown' : 'adm-action-btn--green'}`}
                        title={restockId === i.id ? 'Close restock' : 'Restock'}
                        onClick={() => {
                          if (restockId === i.id) { setRestockId(null); setRestockAmt(''); }
                          else { setRestockId(i.id); setRestockAmt(''); setConfirmDeleteId(null); }
                        }}
                      >
                        {restockId === i.id
                          ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        }
                      </button>
                      <button className="adm-action-btn adm-action-btn--red" title="Delete" onClick={() => { setConfirmDeleteId(i.id); setRestockId(null); }}>{Icon.trash}</button>
                    </div>
                  </td>
                </tr>

                {/* ── Restock inline panel ── */}
                {restockId === i.id && (
                  <tr key={`${i.id}-restock`} className="inv-restock-row">
                    <td colSpan={5} style={{ padding: 0 }}>
                      <div className="inv-restock-card">
                        <div className="inv-restock-info">
                          <span className="inv-restock-name">{i.name}</span>
                          <span className="inv-restock-current">Current stock: <strong>{i.qty} {i.unit}</strong></span>
                        </div>
                        <div className="inv-restock-form">
                          <label className="inv-restock-label">Add quantity ({i.unit})</label>
                          <div className="inv-restock-controls">
                            <button
                              className="inv-restock-step"
                              onClick={() => setRestockAmt(a => String(Math.max(0, (parseInt(a,10)||0) - 1)))}
                            >−</button>
                            <input
                              type="number"
                              min="0"
                              className="inv-restock-input"
                              value={restockAmt}
                              onChange={e => setRestockAmt(String(Math.max(0, parseInt(e.target.value,10) || 0)))}
                              placeholder="0"
                              autoFocus
                            />
                            <button
                              className="inv-restock-step"
                              onClick={() => setRestockAmt(a => String((parseInt(a,10)||0) + 1))}
                            >+</button>
                          </div>
                        </div>
                        <div className="inv-restock-btns">
                          <button className="inv-restock-cancel" onClick={() => { setRestockId(null); setRestockAmt(''); }}>Cancel</button>
                          <button className="inv-restock-confirm" onClick={() => handleRestock(i.id)} disabled={!restockAmt || parseInt(restockAmt,10) <= 0}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                            Confirm Restock
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   SECTION: REWARDS  (with two tabs + right panel)
   ══════════════════════════════════════════════════ */
function RewardsSection({ role = 'admin' }) {
  const canEdit = role === 'admin';
  const { rewards, addReward, updateReward, deleteReward } = useStore();
  const [activeTab,   setActiveTab]   = useState('available');
  const [confirmId,   setConfirmId]   = useState(null);
  const [searchCards, setSearchCards] = useState('');

  /* right-panel state (shared for both tabs) */
  const [rightPanel,   setRightPanel]   = useState(null);
  // 'rewardDetail' | 'maxPoints' | 'addStamps' | 'updateStep1' | 'updateStep2'

  /* Available Rewards panel state */
  const [editingReward, setEditingReward] = useState(null);
  const [rewardForm,    setRewardForm]    = useState({ name: '', type: 'Discount (%)', discountAmt: '', stamps: 10 });
  const [maxPoints,     setMaxPoints]     = useState(30);
  const [maxPointsDraft,setMaxPointsDraft]= useState('30');

  /* Stamp Cards panel state */
  const [panelRow,     setPanelRow]     = useState(null);
  const [addStampsAmt, setAddStampsAmt] = useState('');
  const [updateForm,   setUpdateForm]   = useState({ custName: '', custType: 'With Registered Jazsam Account', custId: '', cardNo: '' });

  const REWARD_TYPES = ['Discount (%)'];
  const CUST_TYPES   = ['With Registered Jazsam Account', 'Walk-in / No Jazsam Account'];

  const stampsRequired = maxPoints;

  const CUST_API = 'http://localhost/salespresso-api';

  const [allCustomers, setAllCustomers] = useState([]);

  useEffect(() => {
    fetch(`${CUST_API}/customers.php`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setAllCustomers(data); })
      .catch(() => {});
  }, []);

  const cardRows = allCustomers
    .filter(u => searchCards === '' || u.name.toLowerCase().includes(searchCards.toLowerCase()))
    .map((u, idx) => {
      const stamps = u.points || 0;
      const pct    = Math.min(100, Math.round((stamps / stampsRequired) * 100));
      const earned = stamps >= stampsRequired;
      const rewardable = stamps >= stampsRequired;
      const allRedeemed = stamps >= stampsRequired * rewards.length;
      const cardNo = `Card# ${String(1023 + idx)}`;
      return { ...u, stamps, pct, earned, rewardable, allRedeemed, cardNo };
    });

  async function saveStamps(userId, newStamps) {
    try {
      const token = getAdminToken();
      await fetch(`${CUST_API}/customers.php`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ id: userId, points: newStamps }),
      });
      setAllCustomers(cs => cs.map(c => c.id === userId ? { ...c, points: newStamps } : c));
      try {
        const session = JSON.parse(localStorage.getItem('jazsam_user') || 'null');
        if (session && session.id === userId) {
          localStorage.setItem('jazsam_user', JSON.stringify({ ...session, points: newStamps }));
        }
      } catch {}
    } catch {}
  }

  async function handleAddStampsConfirm() {
    if (!panelRow) return;
    const toAdd = Math.max(0, parseInt(addStampsAmt, 10) || 0);
    await saveStamps(panelRow.id, panelRow.stamps + toAdd);
    closePanel();
  }

  async function handleResetStamps(row) {
    await saveStamps(row.id, 0);
  }

  function openAddStamps(row) {
    setPanelRow(row);
    setAddStampsAmt('');
    setRightPanel('addStamps');
  }

  function openUpdate(row) {
    setPanelRow(row);
    setUpdateForm({ custName: row.name || '', custType: 'With Registered Jazsam Account', custId: '', cardNo: '' });
    setRightPanel('updateStep1');
  }

  function closePanel() {
    setRightPanel(null);
    setPanelRow(null);
  }

  function openAddReward() {
    setEditingReward(null);
    setRewardForm({ name: '', type: 'Discount (%)', discountAmt: '', stamps: 10 });
    setRightPanel('rewardDetail');
  }

  function openEditReward(r) {
    setEditingReward(r);
    setRewardForm({ name: r.name, type: r.type || 'Discount (%)', discountAmt: r.value || '', stamps: r.stamps || 10 });
    setRightPanel('rewardDetail');
  }

  function handleSaveReward() {
    if (!rewardForm.name.trim()) return;
    const payload = { name: rewardForm.name, type: rewardForm.type, value: rewardForm.discountAmt, stamps: Number(rewardForm.stamps) || 10 };
    if (editingReward) { updateReward({ ...editingReward, ...payload }); }
    else               { addReward(payload); }
    closePanel();
  }

  function openMaxPoints() {
    setMaxPointsDraft(String(maxPoints));
    setRightPanel('maxPoints');
  }

  function handleSaveMaxPoints() {
    const v = parseInt(maxPointsDraft, 10);
    if (v > 0) setMaxPoints(v);
    closePanel();
  }

  function getTypeColor(type) {
    if (!type) return '#7a7068';
    if (type.includes('%'))      return '#0891b2';
    if (type.includes('₱'))     return '#d97706';
    if (type.includes('Free'))   return '#16a34a';
    if (type.includes('Birthday')) return '#9333ea';
    return '#7a7068';
  }

  function getAmountLabel(type) {
    if (type === 'Discount (%)')  return { label: 'Discount amount', suffix: '%' };
    if (type === 'Discount (₱)') return { label: 'Discount amount', suffix: '₱' };
    if (type === 'Free Item')     return { label: 'Item description', suffix: '' };
    return { label: 'Reward value', suffix: '' };
  }

  function rewardStatus(row) {
    if (row.allRedeemed) return { label: 'All Rewards Redeemed', color: '#22c55e' };
    if (row.rewardable)  return { label: '1 Reward/s Redeemable', color: '#22c55e' };
    return { label: 'Collecting', color: '#7a7068' };
  }

  const totalRewards = cardRows.length * rewards.length;

  return (
    <div className="adm-content" style={{ position: 'relative' }}>
      {/* Delete confirm modal */}
      {confirmId && (() => {
        const r = rewards.find(x => x.id === confirmId);
        return r ? (
          <DeleteConfirmModal
            name={r.name}
            onConfirm={() => { deleteReward(confirmId); setConfirmId(null); }}
            onCancel={() => setConfirmId(null)}
          />
        ) : null;
      })()}

      {/* ── Header ── */}
      <div className="rwd-header">
        <h1 className="adm-page-title">Loyalty Card Rewards</h1>
        <div className="rwd-header__right">
          <div className="adm-search">
            {Icon.search}
            <input
              type="text"
              placeholder="Search reward"
              value={searchCards}
              onChange={e => setSearchCards(e.target.value)}
            />
          </div>
          {canEdit && <button className="emp-btn-add" onClick={openAddReward} title="Add reward">{Icon.plus}</button>}
          <button className="emp-btn-sort" title="Filter">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="9" y1="18" x2="15" y2="18"/></svg>
          </button>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="adm-orders-tabs">
        <button
          className={`adm-orders-tab${activeTab === 'available' ? ' active' : ''}`}
          onClick={() => { setActiveTab('available'); closePanel(); }}
        >
          Available Rewards
        </button>
        <button
          className={`adm-orders-tab${activeTab === 'cards' ? ' active' : ''}`}
          onClick={() => { setActiveTab('cards'); closePanel(); }}
        >
          Customer Stamp Cards
        </button>
      </div>
      <div className="adm-orders-tab-line" />

      {/* ── Available Rewards tab ── */}
      {activeTab === 'available' && (
        <>
          {/* Sliding panels (fixed overlay, same style as Edit Product) */}
          {canEdit && (rightPanel === 'rewardDetail' || rightPanel === 'maxPoints') && (
            <div className="pp-backdrop" onClick={closePanel} />
          )}

          {/* Reward Details panel — admin only */}
          <aside className={`pp-panel ${canEdit && rightPanel === 'rewardDetail' ? 'pp-panel--open' : ''}`}>
            <div className="pp-inner">
              <div className="pp-header">
                <h2 className="pp-title">{editingReward ? 'Edit Reward' : 'Add Reward'}</h2>
              </div>
              <div className="pp-body">
                <div className="pp-field">
                  <label className="pp-label">Reward Name</label>
                  <input
                    className="pp-input"
                    placeholder="e.g. Loyalty Card Reward 1"
                    value={rewardForm.name}
                    onChange={e => setRewardForm({ ...rewardForm, name: e.target.value })}
                  />
                </div>
                <div className="pp-field">
                  <label className="pp-label">Loyalty Reward Type</label>
                  <select
                    className="pp-select"
                    value={rewardForm.type}
                    onChange={e => setRewardForm({ ...rewardForm, type: e.target.value })}
                  >
                    {REWARD_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                {rewardForm.type !== 'Birthday reward' && (
                  <div className="pp-field">
                    <label className="pp-label">{getAmountLabel(rewardForm.type).label}</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type={rewardForm.type === 'Free Item' ? 'text' : 'number'}
                        className="pp-input"
                        style={{ flex: 1 }}
                        value={rewardForm.discountAmt}
                        onChange={e => setRewardForm({ ...rewardForm, discountAmt: e.target.value })}
                        placeholder={rewardForm.type === 'Free Item' ? 'e.g. Small Drink' : '0'}
                      />
                      {getAmountLabel(rewardForm.type).suffix && (
                        <span style={{ fontSize: '0.85rem', color: '#7a7068', fontWeight: 600, flexShrink: 0 }}>
                          {getAmountLabel(rewardForm.type).suffix}
                        </span>
                      )}
                    </div>
                  </div>
                )}
                <div className="pp-field">
                  <label className="pp-label">Stamps Required</label>
                  <input
                    type="number"
                    min="1"
                    className="pp-input"
                    value={rewardForm.stamps}
                    onChange={e => setRewardForm({ ...rewardForm, stamps: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                  />
                </div>
              </div>
              <div className="pp-footer">
                <button className="pp-cancel" onClick={closePanel}>Cancel</button>
                <button className="pp-submit" onClick={handleSaveReward}>
                  {editingReward ? 'Save Changes' : 'Add Reward'}
                </button>
              </div>
            </div>
          </aside>

          {/* Set Maximum Card Points panel — admin only */}
          <aside className={`pp-panel ${canEdit && rightPanel === 'maxPoints' ? 'pp-panel--open' : ''}`}>
            <div className="pp-inner">
              <div className="pp-header">
                <h2 className="pp-title">Set Maximum Card Points</h2>
              </div>
              <div className="pp-body">
                <p style={{ fontSize: '0.82rem', color: '#7a7068', lineHeight: 1.65, margin: 0 }}>
                  Set a maximum number of points for the stamp card. Once a customer reaches this limit, the card can no longer collect stamps or be used. To continue receiving rewards, the customer must obtain a new card.
                </p>
                <div className="pp-field">
                  <label className="pp-label">Max Points per Card</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="number"
                      min="1"
                      className="pp-input"
                      style={{ flex: 1 }}
                      value={maxPointsDraft}
                      onChange={e => setMaxPointsDraft(e.target.value)}
                    />
                    <span style={{ fontSize: '0.85rem', color: '#7a7068', fontWeight: 600, flexShrink: 0 }}>points</span>
                  </div>
                </div>
              </div>
              <div className="pp-footer">
                <button className="pp-cancel" onClick={closePanel}>Cancel</button>
                <button className="pp-submit" onClick={handleSaveMaxPoints}>Save</button>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <div className="rwd-maxpts-row">
            <div className="rwd-maxpts-left">
              <span className="rwd-maxpts-label">Max Points per Card :</span>
              <span className="rwd-maxpts-value">{maxPoints}</span>
              {canEdit && (
                <button className="rwd-maxpts-edit" onClick={openMaxPoints} title="Edit max points">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
              )}
            </div>
            <span className="rwd-avail-count">{rewards.length} rewards available</span>
          </div>

          <div className="adm-card adm-card--flush">
            <table className="adm-table rwd-avail-table">
              <thead>
                <tr>
                  <th>Reward name</th>
                  <th>Value</th>
                  <th>Requirement</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {rewards.length === 0 && (
                  <tr><td colSpan="4" className="adm-muted" style={{ textAlign: 'center', padding: '32px' }}>No rewards yet. Click + to add one.</td></tr>
                )}
                {rewards.map(r => (
                  <tr key={r.id}>
                    <td>
                      <div className="rwd-name-cell">
                        <strong>{r.name}</strong>
                        <span className="rwd-type-badge" style={{ color: getTypeColor(r.type) }}>{r.type}</span>
                      </div>
                    </td>
                    <td>{r.value}</td>
                    <td>{r.stamps} stamps</td>
                    <td>
                      {canEdit && (
                        <div className="rwd-avail-actions">
                          <button className="rwd-avail-btn rwd-avail-btn--del" onClick={() => setConfirmId(r.id)} title="Delete">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                          </button>
                          <button className="rwd-avail-btn rwd-avail-btn--edit" onClick={() => openEditReward(r)}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            Edit
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── Customer Stamp Cards tab ── */}
      {activeTab === 'cards' && (
        <>
          {/* Overlay backdrop */}
          {canEdit && (rightPanel === 'addStamps' || rightPanel === 'updateStep1' || rightPanel === 'updateStep2') && (
            <div className="pp-backdrop" onClick={closePanel} />
          )}

          {/* Add Stamps slide-out panel — admin only */}
          <aside className={`pp-panel ${canEdit && rightPanel === 'addStamps' ? 'pp-panel--open' : ''}`}>
            <div className="pp-inner">
              {rightPanel === 'addStamps' && panelRow && (
                <>
                  <div className="pp-header">
                    <h2 className="pp-title">Add Stamps</h2>
                  </div>
                  <div className="pp-body">
                    <div className="rwd-panel-info-row">
                      <span className="rwd-panel-label">Customer :</span>
                      <span className="rwd-panel-value">{panelRow.name}</span>
                    </div>
                    <div className="rwd-panel-info-row">
                      <span className="rwd-panel-label">Card # :</span>
                      <span className="rwd-panel-value">{panelRow.cardNo}</span>
                    </div>
                    <div className="rwd-stamp-counter-box">
                      <div className="rwd-stamp-counter-num">
                        {panelRow.stamps} / {stampsRequired}
                      </div>
                      <div className="rwd-stamp-counter-sub">
                        stamps collected &nbsp;•&nbsp; {Math.max(0, stampsRequired - panelRow.stamps)} remaining to full card
                      </div>
                    </div>
                    <div className="pp-field">
                      <label className="pp-label">Number of Stamps to Add</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input
                          type="number"
                          min="1"
                          className="pp-input"
                          style={{ flex: 1 }}
                          value={addStampsAmt}
                          onChange={e => setAddStampsAmt(e.target.value)}
                          placeholder="0"
                        />
                        <span style={{ fontSize: '0.85rem', color: '#7a7068', fontWeight: 600, flexShrink: 0 }}>stamps</span>
                      </div>
                    </div>
                  </div>
                  <div className="pp-footer">
                    <button className="pp-cancel" onClick={closePanel}>Cancel</button>
                    <button className="pp-submit" onClick={handleAddStampsConfirm}>Confirm</button>
                  </div>
                </>
              )}
            </div>
          </aside>

          {/* Update step 1 — Reward details slide-out panel — admin only */}
          <aside className={`pp-panel ${canEdit && rightPanel === 'updateStep1' ? 'pp-panel--open' : ''}`}>
            <div className="pp-inner">
              <div className="pp-header">
                <h2 className="pp-title">Reward details</h2>
              </div>
              <div className="pp-body">
                <div className="pp-field">
                  <label className="pp-label">Customer Name</label>
                  <input
                    className="pp-input"
                    value={updateForm.custName}
                    onChange={e => setUpdateForm({ ...updateForm, custName: e.target.value })}
                  />
                </div>
                <div className="pp-field">
                  <label className="pp-label">Customer type</label>
                  <select
                    className="pp-select"
                    value={updateForm.custType}
                    onChange={e => setUpdateForm({ ...updateForm, custType: e.target.value })}
                  >
                    {CUST_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="pp-footer">
                <button className="pp-cancel" onClick={closePanel}>Cancel</button>
                <button className="pp-submit" onClick={() => setRightPanel('updateStep2')}>Next</button>
              </div>
            </div>
          </aside>

          {/* Update step 2 — Customer card details slide-out panel — admin only */}
          <aside className={`pp-panel ${canEdit && rightPanel === 'updateStep2' ? 'pp-panel--open' : ''}`}>
            <div className="pp-inner">
              <div className="pp-header">
                <h2 className="pp-title">Customer card details</h2>
              </div>
              <div className="pp-body">
                <div className="pp-field">
                  <label className="pp-label">Customer Name</label>
                  <input
                    className="pp-input"
                    value={updateForm.custName}
                    onChange={e => setUpdateForm({ ...updateForm, custName: e.target.value })}
                  />
                </div>
                <div className="pp-field">
                  <label className="pp-label">Customer type</label>
                  <select
                    className="pp-select"
                    value={updateForm.custType}
                    onChange={e => setUpdateForm({ ...updateForm, custType: e.target.value })}
                  >
                    {CUST_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                {updateForm.custType === 'With Registered Jazsam Account' && (
                  <div className="pp-field">
                    <label className="pp-label">Enter Customer ID</label>
                    <input
                      className="pp-input"
                      value={updateForm.custId}
                      onChange={e => setUpdateForm({ ...updateForm, custId: e.target.value })}
                      placeholder="e.g. 10012"
                    />
                  </div>
                )}
                <div className="pp-field">
                  <label className="pp-label">Enter Stamp Card No.</label>
                  <input
                    className="pp-input"
                    value={updateForm.cardNo}
                    onChange={e => setUpdateForm({ ...updateForm, cardNo: e.target.value })}
                    placeholder="e.g. 1025"
                  />
                </div>
              </div>
              <div className="pp-footer">
                <button className="pp-cancel" onClick={() => setRightPanel('updateStep1')}>Back</button>
                <button className="pp-submit" onClick={closePanel}>Save</button>
              </div>
            </div>
          </aside>

          {/* Main table */}
          <div className="rwd-cards-meta">
            <span className="adm-muted" style={{ fontSize: '0.82rem' }}>{totalRewards} rewards available</span>
          </div>
          <div className="adm-card adm-card--flush">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Card #</th>
                  <th>Stamps Collected</th>
                  <th>Reward Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cardRows.length === 0 && (
                  <tr><td colSpan="5" className="adm-muted" style={{ textAlign: 'center', padding: '32px' }}>No registered customers yet.</td></tr>
                )}
                {cardRows.map(row => {
                  const rs = rewardStatus(row);
                  return (
                    <tr key={row.id}>
                      <td className="adm-bold">{row.name}</td>
                      <td className="adm-muted">{row.cardNo}</td>
                      <td>
                        <div className="rwd-stamp-cell">
                          <span className="rwd-stamp-count">{row.stamps}</span>
                          <div className="rwd-progress-bar">
                            <div
                              className="rwd-progress-fill"
                              style={{
                                width: `${row.pct}%`,
                                background: row.allRedeemed ? '#22c55e' : row.pct >= 50 ? '#f59e0b' : '#d4c5f0',
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ color: rs.color, fontWeight: 700, fontSize: '0.82rem' }}>{rs.label}</span>
                      </td>
                      <td>
                        {canEdit && (
                          <div className="rwd-action-btns">
                            <button className="rwd-btn rwd-btn--stamp" onClick={() => openAddStamps(row)}>
                              + Stamp
                            </button>
                            <button className="rwd-btn rwd-btn--update" onClick={() => openUpdate(row)}>
                              {Icon.edit} Update
                            </button>
                            <button className="rwd-btn rwd-btn--reset" onClick={() => handleResetStamps(row)}>
                              Reset
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   WALK-IN ORDER — VARIANT PICKER MODAL
   ══════════════════════════════════════════════════ */
function WalkInVariantPicker({ product, onClose, onAdd }) {
  const variants = product.variants || [];
  const temps    = product.temps    || [];
  const hasMultipleSizes = variants.filter(v => v.size && v.size !== 'Regular').length > 1;

  const [selectedVariant, setSelectedVariant] = useState(variants[0] || null);
  const [selectedTemp,    setSelectedTemp]    = useState(temps[0]    || null);
  const [qty, setQty] = useState(1);

  const price = selectedVariant?.price ?? product.price ?? 0;

  return createPortal(
    <div className="walkin-overlay" onClick={onClose}>
      <div className="walkin-picker" onClick={e => e.stopPropagation()}>
        <button className="walkin-picker__close" onClick={onClose}>✕</button>

        {product.image
          ? <img src={product.image} alt={product.name} className="walkin-picker__img" />
          : <div className="walkin-picker__img walkin-picker__img--placeholder" />
        }

        <h3 className="walkin-picker__name">{product.name}</h3>
        <p className="walkin-picker__price">₱{price.toFixed(2)}</p>

        {hasMultipleSizes && (
          <div className="walkin-picker__section">
            <p className="walkin-picker__label">Size</p>
            <div className="walkin-picker__opts">
              {variants.map(v => (
                <button
                  key={v.variantId || v.size}
                  className={`walkin-opt${selectedVariant?.variantId === v.variantId ? ' active' : ''}`}
                  onClick={() => setSelectedVariant(v)}
                >
                  {v.size}
                  <span className="walkin-opt__sub">₱{v.price.toFixed(2)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {temps.length > 0 && (
          <div className="walkin-picker__section">
            <p className="walkin-picker__label">Temperature</p>
            <div className="walkin-picker__opts">
              {temps.map(t => (
                <button
                  key={t}
                  className={`walkin-opt${selectedTemp === t ? ' active' : ''}`}
                  onClick={() => setSelectedTemp(t)}
                >
                  {t === 'Hot' ? Icon.hotTea : Icon.snowflake} {t}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="walkin-picker__qty-row">
          <button className="walkin-qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
          <span className="walkin-qty-val">{qty}</span>
          <button className="walkin-qty-btn" onClick={() => setQty(q => q + 1)}>+</button>
        </div>

        <button
          className="walkin-picker__add-btn"
          onClick={() => onAdd({
            id:           product.id,
            name:         product.name,
            price,
            qty,
            selectedSize: hasMultipleSizes ? (selectedVariant?.size || null) : null,
            selectedTemp: temps.length > 0 ? selectedTemp : null,
            img:          product.image,
          })}
        >
          Add to Order — ₱{(price * qty).toFixed(2)}
        </button>
      </div>
    </div>,
    document.body
  );
}

/* ══════════════════════════════════════════════════
   WALK-IN ORDER — MAIN PANEL
   ══════════════════════════════════════════════════ */
const WALKIN_CATS = ['All', 'Coffee', 'Milktea', 'Soda', 'Mocktails', 'Sides'];
const API_BASE = 'http://localhost/salespresso-api';

function WalkInOrderPanel() {
  const { products } = useStore();
  const [category,      setCategory]      = useState('All');
  const [cart,          setCart]          = useState([]);
  const [pickerProduct, setPickerProduct] = useState(null);
  const [customerName,  setCustomerName]  = useState('');
  const [orderNote,     setOrderNote]     = useState('');
  const [placing,       setPlacing]       = useState(false);
  const [successMsg,    setSuccessMsg]    = useState(null);
  const [errorMsg,      setErrorMsg]      = useState(null);

  const filtered = products.filter(p =>
    p.status === 'available' &&
    (category === 'All' || p.category === category)
  );

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  function addToCart(item) {
    const key = `${item.id}-${item.selectedSize || ''}-${item.selectedTemp || ''}`;
    setCart(prev => {
      const existing = prev.find(c => c.cartKey === key);
      if (existing) return prev.map(c => c.cartKey === key ? { ...c, qty: c.qty + item.qty } : c);
      return [...prev, { ...item, cartKey: key }];
    });
    setPickerProduct(null);
  }

  function updateQty(cartKey, delta) {
    setCart(prev =>
      prev.map(c => c.cartKey === cartKey ? { ...c, qty: c.qty + delta } : c)
          .filter(c => c.qty > 0)
    );
  }

  async function placeWalkInOrder() {
    if (cart.length === 0) return;
    setPlacing(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const items = cart.map(i => {
      const details = [i.selectedSize, i.selectedTemp].filter(Boolean).join(', ');
      return `${i.qty}x ${i.name}${details ? ` (${details})` : ''}`;
    });

    try {
      const res = await fetch(`${API_BASE}/orders.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId:        '',
          customer:      customerName.trim() || 'Walk-in Customer',
          items,
          total:         subtotal,
          note:          orderNote.trim(),
          cartItems:     cart,
          paymentMethod: 'cash',
        }),
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      const orderId = (data.id || '').replace(/^#/, 'ORD-');
      setSuccessMsg(`Order ${orderId} placed successfully!`);
      setCart([]);
      setCustomerName('');
      setOrderNote('');
      window.dispatchEvent(new CustomEvent('jazsam_new_orders', { detail: { count: 1 } }));
    } catch {
      setErrorMsg('Could not place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  }

  return (
    <div className="walkin-layout">
      {/* ── Left: product catalog ── */}
      <div className="walkin-catalog">
        <div className="walkin-cats">
          {WALKIN_CATS.map(cat => (
            <button
              key={cat}
              className={`walkin-cat-btn${category === cat ? ' active' : ''}`}
              onClick={() => setCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="walkin-grid">
          {filtered.map(p => (
            <button key={p.id} className="walkin-card" onClick={() => setPickerProduct(p)}>
              {p.image
                ? <img src={p.image} alt={p.name} className="walkin-card__img" />
                : <div className="walkin-card__img walkin-card__img--placeholder" />
              }
              <span className="walkin-card__name">{p.name}</span>
              <span className="walkin-card__price">₱{(p.price ?? 0).toFixed(2)}</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="walkin-grid-empty">No available products in this category.</div>
          )}
        </div>
      </div>

      {/* ── Right: cart & checkout ── */}
      <div className="walkin-cart">
        <h3 className="walkin-cart__title">Order Summary</h3>

        <div className="walkin-cart__field">
          <label className="walkin-cart__label">Customer Name</label>
          <input
            type="text"
            placeholder="Walk-in Customer (optional)"
            value={customerName}
            onChange={e => setCustomerName(e.target.value)}
            className="walkin-input"
          />
        </div>

        {cart.length === 0 ? (
          <div className="walkin-cart__empty">No items added yet.<br />Tap a product to add it.</div>
        ) : (
          <div className="walkin-cart__items">
            {cart.map(item => (
              <div key={item.cartKey} className="walkin-cart-row">
                <div className="walkin-cart-row__info">
                  <span className="walkin-cart-row__name">{item.name}</span>
                  {(item.selectedSize || item.selectedTemp) && (
                    <span className="walkin-cart-row__sub">
                      {[item.selectedSize, item.selectedTemp].filter(Boolean).join(' · ')}
                    </span>
                  )}
                </div>
                <div className="walkin-cart-row__controls">
                  <button className="walkin-qty-btn" onClick={() => updateQty(item.cartKey, -1)}>−</button>
                  <span className="walkin-qty-val">{item.qty}</span>
                  <button className="walkin-qty-btn" onClick={() => updateQty(item.cartKey, 1)}>+</button>
                </div>
                <span className="walkin-cart-row__price">₱{(item.price * item.qty).toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}

        <div className="walkin-cart__field" style={{ marginTop: '12px' }}>
          <label className="walkin-cart__label">Note</label>
          <textarea
            placeholder="Special instructions..."
            value={orderNote}
            onChange={e => setOrderNote(e.target.value)}
            className="walkin-input walkin-textarea"
            rows={2}
          />
        </div>

        <div className="walkin-cart__total">
          <span>Total</span>
          <span className="walkin-cart__total-amount">₱{subtotal.toFixed(2)}</span>
        </div>

        {errorMsg   && <div className="walkin-msg walkin-msg--error">{errorMsg}</div>}
        {successMsg && <div className="walkin-msg walkin-msg--success">{successMsg}</div>}

        <button
          className="walkin-place-btn"
          disabled={cart.length === 0 || placing}
          onClick={placeWalkInOrder}
        >
          {placing ? 'Placing Order…' : 'Place Walk-in Order'}
        </button>
      </div>

      {pickerProduct && (
        <WalkInVariantPicker
          product={pickerProduct}
          onClose={() => setPickerProduct(null)}
          onAdd={addToCart}
        />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   SECTION: ORDERS
   ══════════════════════════════════════════════════ */
function playOrderSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    // Soft two-note café bell (C5 → E5, major third)
    [[523, 0], [659, 0.22]].forEach(([freq, delay]) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = ctx.currentTime + delay;
      gain.gain.setValueAtTime(0.28, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.0);
      osc.start(t);
      osc.stop(t + 1.0);
    });
  } catch {}
}

function OrdersSection() {
  const { orders, updateOrderStatus, updatePaymentStatus } = useStore();
  const [activeTab, setActiveTab] = useState('incoming');
  const [search, setSearch] = useState('');
  const [confirmCancelId, setConfirmCancelId] = useState(null);
  const [confirmRefundId, setConfirmRefundId] = useState(null);
  const [newOrderToast, setNewOrderToast] = useState(null);
  const [statusError,   setStatusError]   = useState(null);

  useEffect(() => {
    function onNewOrders(e) {
      const count = e.detail?.count ?? 1;
      playOrderSound();
      setNewOrderToast(count);
      const t = setTimeout(() => setNewOrderToast(null), 4000);
      return () => clearTimeout(t);
    }
    window.addEventListener('jazsam_new_orders', onNewOrders);
    return () => window.removeEventListener('jazsam_new_orders', onNewOrders);
  }, []);

  const adminSession = JSON.parse(localStorage.getItem('jazsam_admin') || '{}');
  const adminName = adminSession.name || 'Admin';

  async function markAsPaid(order) {
    const result = await updatePaymentStatus(order.id);
    if (!result?.success) {
      setStatusError(result?.error || 'Failed to mark payment. Please try again.');
      setTimeout(() => setStatusError(null), 5000);
    }
  }

  async function cycleStatus(order) {
    // Block moving to Preparing until the order is paid
    if (order.status === 'Pending' && order.paymentStatus !== 'Paid') {
      setStatusError('Cannot start preparing — payment has not been collected yet.');
      setTimeout(() => setStatusError(null), 4000);
      return;
    }
    const flow = { 'Pending': 'Preparing', 'Preparing': 'Completed' };
    const next = flow[order.status];
    if (!next) return;
    setConfirmCancelId(null);
    const result = await updateOrderStatus(order.id, next);
    if (!result?.success) {
      setStatusError(result?.error || 'Failed to update order. Please try again.');
      setTimeout(() => setStatusError(null), 5000);
    }
  }
  async function cancelOrder(id) {
    setConfirmCancelId(null);
    const result = await updateOrderStatus(id, 'Cancelled');
    if (!result?.success) {
      setStatusError(result?.error || 'Failed to cancel order. Please try again.');
      setTimeout(() => setStatusError(null), 5000);
    }
  }

  async function refundOrder(id) {
    setConfirmRefundId(null);
    const result = await updateOrderStatus(id, 'Refunded');
    if (!result?.success) {
      setStatusError(result?.error || 'Failed to process refund. Please try again.');
      setTimeout(() => setStatusError(null), 5000);
    }
  }

  const incomingOrders = orders.filter(o =>
    o.status === 'Pending' || o.status === 'Preparing' || o.status === 'Awaiting Payment'
  );

  const historyOrders = orders.filter(o =>
    (o.status === 'Completed' || o.status === 'Cancelled' || o.status === 'Refunded') &&
    ((o.id || '').toLowerCase().includes(search.toLowerCase()) ||
     (o.customer || o.userId || '').toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="adm-content">
      {newOrderToast && (
        <div className="order-toast">
          🔔 {newOrderToast} new order{newOrderToast > 1 ? 's' : ''} received!
        </div>
      )}
      {statusError && (
        <div className="order-toast order-toast--error">
          ⚠ {statusError}
        </div>
      )}

      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Orders</h1>
        </div>
      </div>

      {/* ── Main tab bar ── */}
      <div className="adm-orders-tabs">
        <button
          className={`adm-orders-tab${activeTab === 'incoming' ? ' active' : ''}`}
          onClick={() => setActiveTab('incoming')}
        >
          Incoming orders
        </button>
        <button
          className={`adm-orders-tab${activeTab === 'history' ? ' active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Order history
        </button>
        <button
          className={`adm-orders-tab adm-orders-tab--walkin${activeTab === 'walkin' ? ' active' : ''}`}
          onClick={() => setActiveTab('walkin')}
        >
          + Walk-in Order
        </button>
      </div>
      <div className="adm-orders-tab-line" />

      {/* ── Walk-in Order ── */}
      {activeTab === 'walkin' && <WalkInOrderPanel />}

      {/* ── Incoming Orders — card grid ── */}
      {activeTab === 'incoming' && (
        incomingOrders.length === 0 ? (
          <div className="adm-empty-state">No incoming orders at the moment.</div>
        ) : (
          <div className="adm-order-cards">
            {incomingOrders.map(o => {
              const parts = (o.date || '').split('·');
              const datePart = parts[0]?.trim() || '';
              const timePart = parts[1]?.trim() || '';
              const orderId = (o.id || '').replace(/^#/, 'ORD-');

              return (
                <div key={o.id} className="adm-order-card">
                  <div className="adm-order-card__header">
                    <div className="adm-order-card__header-row1">
                      <span className="adm-order-card__time">{timePart}</span>
                      <span className="adm-order-card__id-top">{orderId}</span>
                    </div>
                    <div className="adm-order-card__header-row2">
                      <span className="adm-order-card__date">{datePart}</span>
                    </div>
                  </div>

                  <div className="adm-order-card__body">
                    {(o.items || []).map((item, idx) => {
                      const match = item.match(/^(\d+)x\s+(.+)$/);
                      const qty  = match ? match[1] : '';
                      const name = match ? match[2] : item;
                      const addons = (o.addons && o.addons[idx]) ? o.addons[idx] : [];

                      return (
                        <div key={idx} className="adm-order-card__item-wrap">
                          {idx > 0 && <div className="adm-order-card__divider" />}
                          <div className="adm-order-card__item">
                            <span className="adm-order-card__item-qty">{qty}x</span>
                            <span className="adm-order-card__item-name">{name}</span>
                          </div>
                          {addons.length > 0 && (
                            <div className="adm-order-card__tags">
                              {addons.map((tag, ti) => (
                                <span key={ti} className="adm-order-card__tag">{tag}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="adm-order-card__footer">
                    {(o.customer && o.customer !== 'Guest') && (
                      <div style={{ fontSize: '0.82rem', color: '#374151', marginBottom: '0.3rem' }}>
                        <strong>Name:</strong> {o.customer}
                      </div>
                    )}
                    {o.orderType && o.orderType !== 'Pickup' && (
                      <div style={{ fontSize: '0.82rem', marginBottom: '0.3rem' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '0.1rem 0.5rem',
                          borderRadius: 99,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: o.orderType === 'Delivery' ? '#fef3c7' : '#dbeafe',
                          color:      o.orderType === 'Delivery' ? '#92400e' : '#1e40af',
                        }}>
                          {o.orderType === 'Delivery' ? '🛵 Delivery' : '🍽 Dine-in'}
                        </span>
                      </div>
                    )}
                    {o.orderType === 'Delivery' && o.phoneNumber && (
                      <div style={{ fontSize: '0.82rem', color: '#374151', marginBottom: '0.3rem' }}>
                        <strong>Phone:</strong> {o.phoneNumber}
                      </div>
                    )}
                    {o.orderType === 'Delivery' && o.deliveryAddress && (
                      <div style={{ fontSize: '0.78rem', color: '#6b7280', marginBottom: '0.3rem', lineHeight: 1.4 }}>
                        <strong style={{ color: '#374151' }}>Address:</strong> {o.deliveryAddress}
                        {o.deliveryLatLng && (
                          <a
                            href={`https://www.google.com/maps?q=${o.deliveryLatLng}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ marginLeft: '0.4rem', color: '#2563eb', textDecoration: 'underline', fontSize: '0.75rem' }}
                          >
                            View map
                          </a>
                        )}
                      </div>
                    )}
                    {o.deliveryFee > 0 && (
                      <div style={{ fontSize: '0.82rem', color: '#374151', marginBottom: '0.3rem' }}>
                        <strong>Delivery fee:</strong> ₱{o.deliveryFee.toFixed(2)}
                      </div>
                    )}
                    {o.note && (
                      <div style={{ fontSize: '0.82rem', color: '#374151', marginBottom: '0.3rem' }}>
                        <strong>Note:</strong> {o.note}
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                      {/* Payment badge */}
                      {o.paymentStatus === 'Paid'
                        ? <span className="adm-payment-badge adm-payment-badge--paid">
                            Paid{o.paymentMethod === 'online' ? ' · Online' : ''}
                          </span>
                        : <span className="adm-payment-badge adm-payment-badge--unpaid">
                            {o.paymentMethod === 'online' ? 'Awaiting Online Payment' : 'Payment Pending'}
                          </span>
                      }
                      <span style={{ marginLeft: 'auto', fontWeight: 700, fontSize: '0.95rem', color: '#1a1a1a' }}>
                        ₱{(o.total ?? 0).toFixed(2)}
                      </span>
                    </div>

                    {confirmCancelId === o.id ? (
                      <div className="adm-order-card__confirm">
                        <span>Cancel order?</span>
                        <button className="adm-action-btn adm-action-btn--red" onClick={() => cancelOrder(o.id)}>Yes</button>
                        <button className="adm-action-btn" onClick={() => setConfirmCancelId(null)}>No</button>
                      </div>
                    ) : (
                      <div className="adm-order-card__actions">
                        {/* Cash orders: show Collect Payment until paid */}
                        {o.status === 'Pending' && o.paymentStatus !== 'Paid' && o.paymentMethod !== 'online' && (
                          <button
                            className="adm-order-card__btn adm-order-card__btn--pay"
                            onClick={() => markAsPaid(o)}
                          >
                            Collect Payment
                          </button>
                        )}
                        {(o.status === 'Pending' || o.status === 'Preparing') && (
                          <button
                            className={`adm-order-card__btn adm-order-card__btn--primary${o.status === 'Pending' && o.paymentStatus !== 'Paid' ? ' adm-order-card__btn--muted' : ''}`}
                            onClick={() => cycleStatus(o)}
                          >
                            {o.status === 'Pending' ? 'Start Preparing' : 'Mark Completed'}
                          </button>
                        )}
                        <button
                          className="adm-order-card__btn adm-order-card__btn--cancel"
                          onClick={() => setConfirmCancelId(o.id)}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ── Order History — table ── */}
      {activeTab === 'history' && (
        <>
          <div className="adm-filters" style={{ marginBottom: '16px' }}>
            <SearchBar value={search} onChange={setSearch} placeholder="Search by order ID or customer" />
          </div>
          <div className="adm-card adm-card--flush">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Date and Time</th>
                  <th>Status</th>
                  <th>Employee</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {historyOrders.map(o => (
                  <tr key={o.id}>
                    <td className="adm-mono">{(o.id || '').replace(/^#/, 'ORD-')}</td>
                    <td>{o.customer || o.userId || 'Guest'}</td>
                    <td className="adm-bold">
                      ₱{typeof o.total === 'number'
                        ? o.total.toLocaleString('en-PH', { minimumFractionDigits: 2 })
                        : o.total}
                    </td>
                    <td>
                      {o.paymentMethod === 'online' ? 'Online' : 'Cash'}
                      {' '}
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 7px', borderRadius: 10,
                        background: o.paymentStatus === 'Paid' ? '#d1fae5' : '#fef3c7',
                        color:      o.paymentStatus === 'Paid' ? '#065f46' : '#92400e' }}>
                        {o.paymentStatus || 'Pending'}
                      </span>
                    </td>
                    <td className="adm-muted" style={{ fontSize: '0.8rem' }}>{o.date}</td>
                    <td><StatusBadge status={o.status} /></td>
                    <td>{o.employee || adminName}</td>
                    <td>
                      {isRefundable(o) && (
                        confirmRefundId === o.id ? (
                          <span style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.78rem', color: '#5a5450' }}>Refund?</span>
                            <button className="adm-action-btn adm-action-btn--red" onClick={() => refundOrder(o.id)}>Yes</button>
                            <button className="adm-action-btn" onClick={() => setConfirmRefundId(null)}>No</button>
                          </span>
                        ) : (
                          <button
                            style={{ background: 'rgba(139,92,246,0.08)', color: '#7c3aed', border: '1px solid #c4b5fd', borderRadius: '6px', padding: '4px 12px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                            onClick={() => setConfirmRefundId(o.id)}
                          >
                            Refund
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                ))}
                {historyOrders.length === 0 && (
                  <tr>
                    <td colSpan="8" className="adm-muted" style={{ textAlign: 'center', padding: '24px' }}>
                      No order history found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   EMPLOYEE MODAL
   ══════════════════════════════════════════════════ */
function EmployeeModal({ employee, onClose, onSave, onDelete, adminEmail, adminPicture }) {
  const { orders, changeEmployeePassword } = useStore();
  const [tab, setTab] = useState('profile');
  const [form, setForm] = useState({
    firstName: employee.name?.split(' ')[0] || '',
    lastName:  employee.name?.split(' ').slice(1).join(' ') || '',
    email:     employee.email || '',
    phone:     employee.phone || '',
    position:  employee.position || '',
    hireDate:  employee.hireDate || '',
    status:    employee.status || 'Active',
  });
  const [pwForm, setPwForm]         = useState({ newPw: '', confirmPw: '' });
  const [pwError, setPwError]       = useState('');
  const [pwSaved, setPwSaved]       = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const empOrders = orders.filter(o =>
    (o.employee || '').toLowerCase() === (employee.name || '').toLowerCase()
  );

  function initials(name) {
    const parts = (name || '').trim().split(' ');
    return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();
  }

  function handleSave() {
    onSave({
      ...employee,
      name:     `${form.firstName} ${form.lastName}`.trim(),
      email:    form.email,
      phone:    form.phone,
      position: form.position,
      hireDate: form.hireDate,
      status:   form.status,
    });
  }

  return createPortal(
    <div className="emp-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="emp-modal">
        {/* Left panel */}
        <div className="emp-modal__left">
          <div className="emp-modal__avatar">
            {adminPicture && employee.email === adminEmail
              ? <img src={adminPicture} alt={employee.name} className="emp-modal__avatar-img" />
              : initials(employee.name)}
          </div>
          <p className="emp-modal__emp-name">{employee.name}</p>
          <p className="emp-modal__emp-role">{employee.position}</p>
          <nav className="emp-modal__nav">
            <button
              className={`emp-modal__nav-btn${tab === 'profile' ? ' active' : ''}`}
              onClick={() => setTab('profile')}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Profile
            </button>
            <button
              className={`emp-modal__nav-btn${tab === 'history' ? ' active' : ''}`}
              onClick={() => setTab('history')}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Transaction History
            </button>
            <button
              className={`emp-modal__nav-btn${tab === 'security' ? ' active' : ''}`}
              onClick={() => { setTab('security'); setPwError(''); setPwSaved(false); setPwForm({ newPw: '', confirmPw: '' }); }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Security
            </button>
          </nav>
        </div>

        {/* Right panel */}
        <div className="emp-modal__right">
          {tab === 'profile' && (
            <>
              <div className="emp-modal__right-hdr">
                <h3>Personal Information</h3>
                <button className="emp-modal__close" onClick={onClose}>×</button>
              </div>
              <div className="emp-modal__form">
                <div className="emp-modal__row">
                  <div className="emp-modal__field">
                    <label>First Name</label>
                    <input value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} />
                  </div>
                  <div className="emp-modal__field">
                    <label>Last Name</label>
                    <input value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} />
                  </div>
                </div>
                <div className="emp-modal__row">
                  <div className="emp-modal__field">
                    <label>Email</label>
                    <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                  </div>
                  <div className="emp-modal__field">
                    <label>Contact No.</label>
                    <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                  </div>
                </div>
                <div className="emp-modal__row">
                  <div className="emp-modal__field">
                    <label>Role</label>
                    <input value={form.position} onChange={e => setForm({...form, position: e.target.value})} />
                  </div>
                  <div className="emp-modal__field">
                    <label>Hire Date</label>
                    <input value={form.hireDate} placeholder="MM-DD-YY" onChange={e => setForm({...form, hireDate: e.target.value})} />
                  </div>
                </div>
              </div>

              {/* Account status — hidden for own account to prevent self-lockout */}
              {employee.email !== adminEmail && (
                <div className="emp-modal__status-row">
                  <div>
                    <span className="emp-modal__status-label">Account Status</span>
                    <span className="emp-modal__status-desc">
                      {form.status === 'Active'
                        ? 'Employee can log in to the admin panel'
                        : 'Employee is blocked from logging in'}
                    </span>
                  </div>
                  <div className="emp-modal__status-right">
                    <span className={`emp-status-dot ${form.status === 'Active' ? 'emp-status-dot--active' : 'emp-status-dot--inactive'}`} />
                    <span className="emp-modal__status-value">{form.status}</span>
                    <Toggle
                      on={form.status === 'Active'}
                      onChange={v => setForm(f => ({ ...f, status: v ? 'Active' : 'Inactive' }))}
                    />
                  </div>
                </div>
              )}

              {showDeleteConfirm && (
                <DeleteConfirmModal
                  name={employee.name}
                  onConfirm={() => { setShowDeleteConfirm(false); onDelete(employee.id); }}
                  onCancel={() => setShowDeleteConfirm(false)}
                />
              )}

              <div className="emp-modal__footer">
                {employee.email !== adminEmail && (
                  <button className="emp-modal__btn--delete" onClick={() => setShowDeleteConfirm(true)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                    Delete Profile
                  </button>
                )}
                <button className="emp-modal__btn--save" onClick={handleSave}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Save Changes
                </button>
              </div>
            </>
          )}

          {tab === 'history' && (
            <>
              <div className="emp-modal__right-hdr">
                <h3>{employee.name?.split(' ')[0]}&apos;s Transaction History</h3>
                <button className="emp-modal__close" onClick={onClose}>×</button>
              </div>
              <div className="emp-modal__table-wrap">
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th>Transaction ID</th>
                      <th>Date and Time</th>
                      <th>Total Amount</th>
                      <th>Payment Method</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {empOrders.length === 0 && (
                      <tr>
                        <td colSpan="5" className="adm-muted" style={{ textAlign: 'center', padding: '32px' }}>
                          No transactions found for this employee.
                        </td>
                      </tr>
                    )}
                    {empOrders.map(o => (
                      <tr key={o.id}>
                        <td className="adm-mono">{(o.id || '').replace(/^#/, 'ORD-')}</td>
                        <td className="adm-muted" style={{ fontSize: '0.8rem' }}>{o.date}</td>
                        <td className="adm-bold">
                          ₱{typeof o.total === 'number'
                            ? o.total.toLocaleString('en-PH', { minimumFractionDigits: 2 })
                            : o.total}
                        </td>
                        <td>{o.payment || 'Cash'}</td>
                        <td><StatusBadge status={o.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {tab === 'security' && (
            <>
              <div className="emp-modal__right-hdr">
                <h3>Change Password</h3>
                <button className="emp-modal__close" onClick={onClose}>×</button>
              </div>
              <div className="emp-modal__form">
                <div className="emp-modal__row">
                  <div className="emp-modal__field">
                    <label>New Password</label>
                    <input
                      type="password"
                      value={pwForm.newPw}
                      onChange={e => { setPwForm(f => ({ ...f, newPw: e.target.value })); setPwError(''); setPwSaved(false); }}
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="emp-modal__field">
                    <label>Confirm Password</label>
                    <input
                      type="password"
                      value={pwForm.confirmPw}
                      onChange={e => { setPwForm(f => ({ ...f, confirmPw: e.target.value })); setPwError(''); setPwSaved(false); }}
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                {pwError && <p style={{ color: '#ef4444', fontSize: '0.82rem', margin: '4px 0 0' }}>{pwError}</p>}
                {pwSaved && <p style={{ color: '#22c55e', fontSize: '0.82rem', margin: '4px 0 0' }}>✓ Password updated successfully.</p>}
              </div>
              <div className="emp-modal__footer">
                <button
                  className="emp-modal__btn--save"
                  onClick={async () => {
                    if (!pwForm.newPw) return setPwError('New password is required.');
                    if (pwForm.newPw.length < 6) return setPwError('Password must be at least 6 characters.');
                    if (pwForm.newPw !== pwForm.confirmPw) return setPwError('Passwords do not match.');
                    await changeEmployeePassword(employee.id, pwForm.newPw);
                    setPwForm({ newPw: '', confirmPw: '' });
                    setPwSaved(true);
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Update Password
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ══════════════════════════════════════════════════
   CREATE EMPLOYEE MODAL
   ══════════════════════════════════════════════════ */
function CreateEmployeeModal({ onClose, onCreated }) {
  const { addEmployee } = useStore();
  const [form, setForm] = useState({
    firstName:  '',
    lastName:   '',
    email:      '',
    phone:      '',
    position:   'Cashier',
    username:   '',
    password:   '',
    confirmPw:  '',
  });
  const [error, setError]     = useState('');
  const [saving, setSaving]   = useState(false);

  function field(key, val) { setForm(f => ({ ...f, [key]: val })); }

  async function handleCreate() {
    if (!form.firstName.trim() || !form.lastName.trim())
      return setError('First and last name are required.');
    if (!form.email.trim())
      return setError('Email is required.');
    if (!form.username.trim())
      return setError('Username is required.');
    if (!form.password)
      return setError('Password is required.');
    if (form.password !== form.confirmPw)
      return setError('Passwords do not match.');

    setError('');
    setSaving(true);
    const newEmp = {
      name:     `${form.firstName.trim()} ${form.lastName.trim()}`,
      email:    form.email.trim(),
      phone:    form.phone.trim(),
      position: form.position,
      username: form.username.trim(),
      password: form.password,
      status:   'Active',
    };
    await addEmployee(newEmp);
    setSaving(false);
    onCreated();
  }

  return createPortal(
    <div className="emp-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="emp-create-modal">
        <div className="emp-create-modal__hdr">
          <h3>Add New Employee</h3>
          <button className="emp-modal__close" onClick={onClose}>×</button>
        </div>

        <div className="emp-modal__form emp-create-modal__form">
          <div className="emp-modal__row">
            <div className="emp-modal__field">
              <label>First Name <span className="emp-req">*</span></label>
              <input value={form.firstName} onChange={e => field('firstName', e.target.value)} placeholder="e.g. Juan" />
            </div>
            <div className="emp-modal__field">
              <label>Last Name <span className="emp-req">*</span></label>
              <input value={form.lastName} onChange={e => field('lastName', e.target.value)} placeholder="e.g. dela Cruz" />
            </div>
          </div>
          <div className="emp-modal__row">
            <div className="emp-modal__field">
              <label>Email <span className="emp-req">*</span></label>
              <input type="email" value={form.email} onChange={e => field('email', e.target.value)} placeholder="employee@jazsam.com" />
            </div>
            <div className="emp-modal__field">
              <label>Contact No.</label>
              <input value={form.phone} onChange={e => field('phone', e.target.value)} placeholder="09XXXXXXXXX" />
            </div>
          </div>
          <div className="emp-modal__row">
            <div className="emp-modal__field">
              <label>Username <span className="emp-req">*</span></label>
              <input value={form.username} onChange={e => field('username', e.target.value)} placeholder="e.g. jdelacruz" />
            </div>
            <div className="emp-modal__field">
              <label>Role</label>
              <select
                className="emp-modal__select"
                value={form.position}
                onChange={e => field('position', e.target.value)}
              >
                <option value="Cashier">Cashier</option>
                <option value="Barista">Barista</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
          </div>
          <div className="emp-modal__row">
            <div className="emp-modal__field">
              <label>Password <span className="emp-req">*</span></label>
              <input type="password" value={form.password} onChange={e => field('password', e.target.value)} placeholder="••••••••" />
            </div>
            <div className="emp-modal__field">
              <label>Confirm Password <span className="emp-req">*</span></label>
              <input type="password" value={form.confirmPw} onChange={e => field('confirmPw', e.target.value)} placeholder="••••••••" />
            </div>
          </div>

          {error && <p className="emp-create-modal__error">{error}</p>}
        </div>

        <div className="emp-modal__footer">
          <button className="emp-modal__btn--cancel" onClick={onClose}>Cancel</button>
          <button className="emp-modal__btn--save" onClick={handleCreate} disabled={saving}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            {saving ? 'Creating…' : 'Create Account'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ══════════════════════════════════════════════════
   SECTION: EMPLOYEES
   ══════════════════════════════════════════════════ */
function EmployeesSection() {
  const { employees, updateEmployee, deleteEmployee, addEmployee } = useStore();
  const session                        = getAdminSession();
  const [search, setSearch]           = useState('');
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [showCreate, setShowCreate]   = useState(false);

  const activeCount   = employees.filter(e => e.status === 'Active').length;
  const inactiveCount = employees.filter(e => e.status === 'Inactive').length;

  const filtered = employees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.empId.includes(search) ||
    e.email.toLowerCase().includes(search.toLowerCase())
  );

  function initials(name) {
    const parts = (name || '').trim().split(' ');
    return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();
  }

  function addToast(type) {
    const id = Date.now();
    setToasts(ts => [...ts, { id, type }]);
  }

  function removeToast(id) {
    setToasts(ts => ts.filter(t => t.id !== id));
  }

  function handleSave(updated) {
    updateEmployee(updated);
    setSelectedEmp(null);
    addToast('edit');
  }

  function handleDelete(id) {
    deleteEmployee(id);
    setSelectedEmp(null);
  }

  return (
    <div className="adm-content">
      {selectedEmp && (
        <EmployeeModal
          employee={selectedEmp}
          onClose={() => setSelectedEmp(null)}
          onSave={handleSave}
          onDelete={handleDelete}
          adminEmail={session?.email}
          adminPicture={session?.profilePicture}
        />
      )}

      {showCreate && (
        <CreateEmployeeModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); addToast('create'); }}
        />
      )}

      {/* ── Stacked toasts ── */}
      {toasts.length > 0 && createPortal(
        <div className="emp-toast-stack">
          {toasts.map(t => (
            <div
              key={t.id}
              className="emp-save-toast"
              onAnimationEnd={e => { if (e.animationName === 'empToastOut') removeToast(t.id); }}
            >
              <div className="emp-save-toast__icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div className="emp-save-toast__text">
                <span className="emp-save-toast__title">{t.type === 'edit' ? 'Changes Saved!' : 'Employee Created!'}</span>
                <span className="emp-save-toast__sub">{t.type === 'edit' ? 'Employee profile has been updated.' : 'New employee account has been created.'}</span>
              </div>
              <button className="emp-save-toast__close" onClick={() => removeToast(t.id)}>×</button>
            </div>
          ))}
        </div>,
        document.body
      )}

      {/* Header */}
      <div className="emp-section-header">
        <h1 className="adm-page-title">Employees</h1>
        <div className="emp-section-header__right">
          <div className="adm-search">
            {Icon.search}
            <input
              type="text"
              placeholder="Search employee"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="emp-btn-add" title="Add employee" onClick={() => setShowCreate(true)}>
            {Icon.plus}
          </button>
          <button className="emp-btn-sort" title="Sort">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="9" y1="18" x2="15" y2="18"/></svg>
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="emp-stats-row">
        <span className="emp-stat-dot emp-stat-dot--active" />
        <span className="emp-stat-label">Active {activeCount}</span>
        <span className="emp-stat-dot emp-stat-dot--inactive" />
        <span className="emp-stat-label">Inactive {inactiveCount}</span>
        <span className="emp-stat-dot emp-stat-dot--total" />
        <span className="emp-stat-label">Total {employees.length}</span>
      </div>

      {/* Table */}
      <div className="adm-card adm-card--flush">
        <table className="adm-table emp-table">
          <thead>
            <tr>
              <th>Employee Name</th>
              <th>Status</th>
              <th>Email</th>
              <th>Contact</th>
              <th>Role</th>
              <th>Last Active</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(e => (
              <tr key={e.id}>
                <td>
                  <div className="emp-name-cell">
                    <div className="emp-avatar">
                      {session?.profilePicture && e.email === session?.email
                        ? <img src={session.profilePicture} alt={e.name} className="emp-avatar-img" />
                        : initials(e.name)}
                    </div>
                    <div>
                      <div className="emp-name-text">{e.name}</div>
                      <div className="emp-id-text">#{e.empId}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="emp-status-cell">
                    <span className={`emp-status-dot ${e.status === 'Active' ? 'emp-status-dot--active' : 'emp-status-dot--inactive'}`} />
                    {e.status}
                  </div>
                </td>
                <td className="adm-muted">{e.email}</td>
                <td className="adm-muted">{e.phone}</td>
                <td>{e.position}</td>
                <td className="adm-muted" style={{ fontSize: '0.8rem' }}>{e.lastActive || '—'}</td>
                <td>
                  <div className="emp-action-cell">
                    <button
                      className="emp-btn-edit"
                      onClick={() => setSelectedEmp(e)}
                      title="Edit employee"
                    >
                      {Icon.edit} Edit
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="7" className="adm-muted" style={{ textAlign: 'center', padding: '32px' }}>
                  No employees found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   SECTION: AUDIT LOG
   ══════════════════════════════════════════════════ */
const ACTION_COLOR = {
  'Order Status Changed':    '#3b82f6',
  'Product Added':           '#22c55e',
  'Product Updated':         '#f59e0b',
  'Product Deleted':         '#ef4444',
  'Employee Created':        '#22c55e',
  'Employee Updated':        '#f59e0b',
  'Employee Password Changed':'#f59e0b',
  'Employee Deleted':        '#ef4444',
  'Inventory Restocked':     '#22c55e',
  'Inventory Updated':       '#f59e0b',
  'Inventory Item Deleted':  '#ef4444',
};

const CATEGORY_ACTIONS = {
  Orders:    ['Order Status Changed'],
  Products:  ['Product Added', 'Product Updated', 'Product Deleted'],
  Inventory: ['Inventory Restocked', 'Inventory Updated', 'Inventory Item Deleted'],
  Employees: ['Employee Created', 'Employee Updated', 'Employee Password Changed', 'Employee Deleted'],
};

function isToday(d) {
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}
function isThisWeek(d) {
  const now = new Date(); const start = new Date(now); start.setDate(now.getDate() - now.getDay());
  start.setHours(0,0,0,0); return d >= start;
}
function isThisMonth(d) {
  const now = new Date(); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

function AuditLogSection() {
  const { auditLogs, fetchAuditLogs } = useStore();
  const [loading,   setLoading]  = useState(true);
  const [search,    setSearch]   = useState('');
  const [category,  setCategory] = useState('All');
  const [dateRange, setDateRange]= useState('All');
  const [performer, setPerformer]= useState('All');
  const [sortAsc,   setSortAsc]  = useState(false);
  const [page,      setPage]     = useState(1);
  const PAGE_SIZE = 15;

  useEffect(() => {
    setLoading(true);
    fetchAuditLogs(200).finally(() => setLoading(false));
  }, [fetchAuditLogs]);

  const performers = ['All', ...Array.from(new Set(auditLogs.map(l => l.staffName || 'System').filter(Boolean)))];

  const filtered = auditLogs
    .filter(l => {
      const q = search.toLowerCase();
      if (q && ![(l.action||''),(l.target||''),(l.staffName||''),(l.details||'')].some(s => s.toLowerCase().includes(q))) return false;
      if (category !== 'All' && !CATEGORY_ACTIONS[category]?.includes(l.action)) return false;
      if (performer !== 'All' && (l.staffName || 'System') !== performer) return false;
      if (dateRange !== 'All' && l.createdAt) {
        const d = new Date(l.createdAt);
        if (dateRange === 'Today'      && !isToday(d))     return false;
        if (dateRange === 'This week'  && !isThisWeek(d))  return false;
        if (dateRange === 'This month' && !isThisMonth(d)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      const ta = new Date(a.createdAt || 0).getTime();
      const tb = new Date(b.createdAt || 0).getTime();
      return sortAsc ? ta - tb : tb - ta;
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function goTo(p) { setPage(Math.max(1, Math.min(p, totalPages))); }

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [search, category, dateRange, performer, sortAsc]);

  const CATS   = ['All', 'Orders', 'Products', 'Inventory', 'Employees'];
  const DATES  = ['All', 'Today', 'This week', 'This month'];

  return (
    <div className="adm-content">
      <div className="adm-page-header">
        <h1 className="adm-page-title">Audit Log</h1>
        <button className="adm-btn-add" onClick={() => { setLoading(true); fetchAuditLogs(200).finally(() => setLoading(false)); }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.18-2.37"/></svg>
          Refresh
        </button>
      </div>

      {/* ── Search + sort row ── */}
      <div className="alog-toolbar">
        <div className="adm-search" style={{ flex: 1 }}>
          {Icon.search}
          <input type="text" placeholder="Search logs…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className="alog-sort-btn" onClick={() => setSortAsc(v => !v)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            {sortAsc
              ? <><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></>
              : <><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></>}
          </svg>
          {sortAsc ? 'Oldest first' : 'Newest first'}
        </button>
      </div>

      {/* ── Filter card ── */}
      <div className="alog-filters">
        <div className="alog-filter-row">
          <div className="alog-filter-group">
            <span className="alog-filter-label">Category</span>
            <div className="alog-chips">
              {CATS.map(c => (
                <button key={c} className={`alog-chip${category === c ? ' alog-chip--active' : ''}`} onClick={() => setCategory(c)}>{c}</button>
              ))}
            </div>
          </div>
          <div className="alog-filter-divider" />
          <div className="alog-filter-group">
            <span className="alog-filter-label">Date</span>
            <div className="alog-chips">
              {DATES.map(d => (
                <button key={d} className={`alog-chip${dateRange === d ? ' alog-chip--active' : ''}`} onClick={() => setDateRange(d)}>{d}</button>
              ))}
            </div>
          </div>
          <div className="alog-filter-divider" />
          <div className="alog-filter-group">
            <span className="alog-filter-label">Performed by</span>
            <select className="alog-select" value={performer} onChange={e => setPerformer(e.target.value)}>
              {performers.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="adm-table-wrap">
        {loading ? (
          <p className="adm-muted" style={{ padding: '40px', textAlign: 'center' }}>Loading…</p>
        ) : (
          <table className="adm-table">
            <thead>
              <tr>
                <th>Date &amp; Time</th>
                <th>Action</th>
                <th>Target</th>
                <th>Details</th>
                <th>Performed By</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="5" className="adm-muted" style={{ textAlign: 'center', padding: '40px' }}>
                    No audit logs found.
                  </td>
                </tr>
              )}
              {paginated.map(l => (
                <tr key={l.id}>
                  <td className="adm-muted" style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                    {l.createdAt ? new Date(l.createdAt).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) : '—'}
                  </td>
                  <td>
                    <span style={{
                      display: 'inline-block', padding: '2px 8px', borderRadius: '12px',
                      fontSize: '0.76rem', fontWeight: 600, whiteSpace: 'nowrap',
                      background: (ACTION_COLOR[l.action] || '#94a3b8') + '1a',
                      color: ACTION_COLOR[l.action] || '#94a3b8',
                    }}>
                      {l.action}
                    </span>
                  </td>
                  <td style={{ fontWeight: 500 }}>{l.target || '—'}</td>
                  <td className="adm-muted" style={{ fontSize: '0.82rem' }}>{l.details || '—'}</td>
                  <td style={{ fontSize: '0.85rem' }}>{l.staffName || 'System'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Pagination ── */}
      {!loading && totalPages > 1 && (
        <div className="alog-pagination">
          <span className="alog-pagination__info">
            {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <div className="alog-pagination__pages">
            <button className="alog-page-btn" onClick={() => goTo(safePage - 1)} disabled={safePage === 1}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
              .reduce((acc, p, idx, arr) => {
                if (idx > 0 && p - arr[idx - 1] > 1) acc.push('…');
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === '…'
                  ? <span key={`ellipsis-${i}`} className="alog-page-ellipsis">…</span>
                  : <button key={p} className={`alog-page-btn${safePage === p ? ' alog-page-btn--active' : ''}`} onClick={() => goTo(p)}>{p}</button>
              )}
            <button className="alog-page-btn" onClick={() => goTo(safePage + 1)} disabled={safePage === totalPages}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   SECTION: SETTINGS
   ══════════════════════════════════════════════════ */
function Toggle({ on, onChange }) {
  return (
    <button
      type="button"
      className={`stg-toggle${on ? ' stg-toggle--on' : ''}`}
      onClick={() => onChange(!on)}
      aria-checked={on}
      role="switch"
    >
      <span className="stg-toggle__thumb" />
    </button>
  );
}

function SettingsSection({ onLogout }) {
  const saved = loadAdminSettings();
  /* Notification toggles */
  const [notifNewOrder, setNotifNewOrder] = useState(saved.notifNewOrder);
  const [notifLowStock, setNotifLowStock] = useState(saved.notifLowStock);
  const [notifReward,   setNotifReward]   = useState(saved.notifReward);
  const [notifSound,    setNotifSound]    = useState(saved.notifSound);

  /* Persist settings whenever any value changes */
  useEffect(() => {
    saveAdminSettings({ notifNewOrder, notifLowStock, notifReward, notifSound });
  }, [notifNewOrder, notifLowStock, notifReward, notifSound]);

  return (
    <div className="adm-content">
      {/* Header */}
      <div className="stg-header">
        <h1 className="adm-page-title">Settings</h1>
        <div className="stg-header__right">
          <div className="adm-search">
            {Icon.search}
            <input type="text" placeholder="Search" />
          </div>
          <button className="emp-btn-sort" title="Sort">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="9" y1="18" x2="15" y2="18"/></svg>
          </button>
        </div>
      </div>

      {/* Settings card */}
      <div className="stg-card">

        {/* ── Notification Settings ── */}
        <h2 className="stg-section-title">Notification Settings</h2>

        <div className="stg-row">
          <div className="stg-row__info">
            <span className="stg-row__label">New Order Alert</span>
            <span className="stg-row__desc">Notify when a new order is placed</span>
          </div>
          <Toggle on={notifNewOrder} onChange={setNotifNewOrder} />
        </div>
        <div className="stg-divider" />

        <div className="stg-row">
          <div className="stg-row__info">
            <span className="stg-row__label">Low Stock Warning</span>
            <span className="stg-row__desc">Alert when inventory is low</span>
          </div>
          <Toggle on={notifLowStock} onChange={setNotifLowStock} />
        </div>
        <div className="stg-divider" />

        <div className="stg-row">
          <div className="stg-row__info">
            <span className="stg-row__label">Reward Redemption</span>
            <span className="stg-row__desc">Notify when a customer redeems</span>
          </div>
          <Toggle on={notifReward} onChange={setNotifReward} />
        </div>
        <div className="stg-divider" />

        <div className="stg-row">
          <div className="stg-row__info">
            <span className="stg-row__label">Notification Sound</span>
            <span className="stg-row__desc">Play a sound for new orders and low stock alerts</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {notifSound && (
              <button
                type="button"
                className="stg-sound-test"
                onClick={() => playNotificationSound('order')}
                title="Test sound"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                Test
              </button>
            )}
            <Toggle on={notifSound} onChange={setNotifSound} />
          </div>
        </div>


      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   SETTINGS PERSISTENCE
   ══════════════════════════════════════════════════ */
const ADMIN_SETTINGS_KEY = 'jazsam_admin_settings';

const SETTINGS_DEFAULTS = {
  notifNewOrder: true,
  notifLowStock: true,
  notifReward:   false,
  notifSound:    true,
};

function loadAdminSettings() {
  try {
    return { ...SETTINGS_DEFAULTS, ...JSON.parse(localStorage.getItem(ADMIN_SETTINGS_KEY) || '{}') };
  } catch { return { ...SETTINGS_DEFAULTS }; }
}

function saveAdminSettings(settings) {
  localStorage.setItem(ADMIN_SETTINGS_KEY, JSON.stringify(settings));
}

/* ══════════════════════════════════════════════════
   NOTIFICATION SOUND
   ══════════════════════════════════════════════════ */
function playNotificationSound(type = 'order') {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';

    if (type === 'order') {
      // Two-tone ding for new order
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.6);
    } else {
      // Descending warning beep for low stock
      osc.frequency.setValueAtTime(523, ctx.currentTime);
      osc.frequency.setValueAtTime(392, ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    }
    osc.onended = () => ctx.close();
  } catch {}
}

/* ══════════════════════════════════════════════════
   SECTION: ADMIN PROFILE
   ══════════════════════════════════════════════════ */
const ADMIN_SESSION_KEY_LOCAL = 'jazsam_admin';

function AdminProfilePicture({ name, picture, size = 88, onUpload }) {
  const inputRef                        = useRef(null);
  const [pendingImg, setPendingImg]     = useState(null);
  const initials = name
    ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'A';

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPendingImg(ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  return (
    <>
      <div
        className="adm-prof-avatar-wrap"
        style={{ width: size, height: size }}
        onClick={() => inputRef.current?.click()}
        title="Change profile picture"
      >
        {picture ? (
          <img src={picture} alt={name} className="adm-prof-avatar-img" style={{ width: size, height: size }} />
        ) : (
          <div className="adm-prof-avatar" style={{ width: size, height: size, fontSize: size * 0.38 }}>
            {initials}
          </div>
        )}
        <div className="adm-prof-avatar-overlay">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
          <span>Change photo</span>
        </div>
        <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
      </div>

      {pendingImg && (
        <CropAvatarModal
          imageSrc={pendingImg}
          onSave={(cropped) => { onUpload(cropped); setPendingImg(null); }}
          onCancel={() => setPendingImg(null)}
        />
      )}
    </>
  );
}

function AdminProfileSection({ session, onUpdate, onLogout }) {
  const [form, setForm] = useState({
    name:    session?.name    || '',
    email:   session?.email   || '',
    phone:   session?.phone   || '',
    address: session?.address || '',
  });
  const [editing, setEditing] = useState(false);
  const [saved,   setSaved]   = useState(false);

  function handleChange(field) {
    return (e) => { setForm(f => ({ ...f, [field]: e.target.value })); setSaved(false); };
  }

  function handleSave(e) {
    e.preventDefault();
    onUpdate(form);
    setSaved(true);
    setEditing(false);
  }

  function handleCancel() {
    setEditing(false);
    setForm({ name: session?.name || '', email: session?.email || '', phone: session?.phone || '', address: session?.address || '' });
  }

  return (
    <div className="adm-content">
      {/* ── Hero banner ── */}
      <div className="adm-prof-hero">
        <div className="adm-prof-hero__bg" />
        <div className="adm-prof-hero__content">
          <AdminProfilePicture
            name={form.name}
            picture={session?.profilePicture}
            size={80}
            onUpload={(dataUrl) => onUpdate({ profilePicture: dataUrl })}
          />
          <div className="adm-prof-hero__info">
            <h1 className="adm-prof-hero__name">{form.name || 'Admin'}</h1>
            <span className="adm-prof-hero__role">Administrator</span>
            <p className="adm-prof-hero__email">{form.email}</p>
          </div>
        </div>
      </div>

      {/* ── Info card ── */}
      <div className="stg-card" style={{ marginTop: 24 }}>
        <div className="adm-prof-card-hdr">
          <div>
            <h2 className="stg-section-title" style={{ marginBottom: 4 }}>Personal information</h2>
            <p className="stg-row__desc">Manage your admin account details</p>
          </div>
          {!editing && (
            <button className="adm-prof-edit-btn" onClick={() => setEditing(true)}>
              Edit profile
            </button>
          )}
        </div>

        <form onSubmit={handleSave} noValidate style={{ marginTop: 24 }}>
          <div className="adm-prof-grid">
            {[
              { id: 'adm-name',    label: 'Full name',      field: 'name',    type: 'text',  ph: 'Admin name' },
              { id: 'adm-email',   label: 'Email address',  field: 'email',   type: 'email', ph: 'admin@jazsam.com' },
              { id: 'adm-phone',   label: 'Contact number', field: 'phone',   type: 'tel',   ph: '+63 9XX XXX XXXX' },
              { id: 'adm-address', label: 'Address',        field: 'address', type: 'text',  ph: 'Street, City, Province', span: true },
            ].map(({ id, label, field, type, ph, span }) => (
              <div key={id} className={`adm-settings-field${span ? ' adm-prof-span' : ''}`}>
                <label htmlFor={id}>{label}</label>
                <input
                  id={id}
                  type={type}
                  value={form[field]}
                  onChange={handleChange(field)}
                  placeholder={ph}
                  readOnly={!editing}
                  className={!editing ? 'adm-prof-readonly' : ''}
                />
              </div>
            ))}
          </div>

          {editing && (
            <div className="adm-prof-actions">
              <button type="button" className="adm-prof-btn adm-prof-btn--outline" onClick={handleCancel}>Cancel</button>
              <button type="submit" className="adm-btn-save">Save changes</button>
            </div>
          )}
          {saved && !editing && (
            <p className="adm-prof-saved">✓ Changes saved successfully.</p>
          )}
        </form>
      </div>

      {/* ── Account actions ── */}
      <div className="stg-card" style={{ marginTop: 16 }}>
        <h2 className="stg-section-title">Account actions</h2>
        <p className="stg-row__desc" style={{ marginBottom: 16 }}>
          Logging out will end your admin session. You can sign back in anytime.
        </p>
        <button className="adm-btn-logout" onClick={onLogout}>
          {Icon.logout} Log out of admin panel
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   MAIN DASHBOARD
   ══════════════════════════════════════════════════ */
export default function AdminDashboard() {
  const navigate    = useNavigate();
  const [session, setSession] = useState(() => getAdminSession());
  const role        = session?.role || 'admin';
  const allowedNav  = ROLE_NAV[role] || null;
  const visibleNav  = allowedNav ? NAV_ITEMS.filter(i => allowedNav.has(i.id)) : NAV_ITEMS;
  const defaultPage = allowedNav ? 'orders' : 'home';
  const [active, setActive] = useState(defaultPage);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    let toastTimer;
    function onToast(e) {
      setToast(e.detail?.message || 'Changes saved!');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => setToast(null), 3000);
    }
    window.addEventListener('jazsam_toast', onToast);
    return () => { window.removeEventListener('jazsam_toast', onToast); clearTimeout(toastTimer); };
  }, []);

  async function updateSession(fields) {
    // Optimistically update local state first
    const updated = { ...session, ...fields };
    localStorage.setItem(ADMIN_SESSION_KEY_LOCAL, JSON.stringify(updated));
    setSession(updated);

    // Persist profile picture to the database
    if (fields.profilePicture !== undefined) {
      const token = getAdminToken();
      try {
        const res  = await fetch('http://localhost/salespresso-api/auth.php', {
          method:  'PUT',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ profilePicture: fields.profilePicture }),
        });
        const data = await res.json();
        if (data?.success) {
          const confirmed = { ...updated, profilePicture: data.profilePicture ?? fields.profilePicture };
          localStorage.setItem(ADMIN_SESSION_KEY_LOCAL, JSON.stringify(confirmed));
          setSession(confirmed);
        } else {
          console.error('[Profile] DB save failed:', data);
        }
      } catch (err) {
        console.error('[Profile] Fetch error:', err);
      }
    }
  }

  async function handleLogout() {
    const token = getAdminToken();
    if (token) {
      try {
        await fetch('http://localhost/salespresso-api/auth.php', {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` },
        });
      } catch {}
    }
    clearAdminSession();
    navigate('/admin', { replace: true });
  }

  // Redirect to login when any API call returns 401 (expired/invalid token)
  useEffect(() => {
    function onSessionExpired() {
      navigate('/admin', { replace: true });
    }
    window.addEventListener('jazsam_session_expired', onSessionExpired);
    return () => window.removeEventListener('jazsam_session_expired', onSessionExpired);
  }, [navigate]);

  // Auto-logout after 10 minutes of inactivity
  useEffect(() => {
    let timer;
    const IDLE_MS = 10 * 60 * 1000;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        localStorage.removeItem('jazsam_admin');
        window.dispatchEvent(new Event('jazsam_session_expired'));
      }, IDLE_MS);
    };
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(e => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      clearTimeout(timer);
      events.forEach(e => window.removeEventListener(e, reset));
    };
  }, []);

  // Close sidebar on nav (mobile)
  function handleNav(id) {
    setActive(id);
    setSidebarOpen(false);
  }

  const { orders, inventory } = useStore();
  const pendingCount = orders.filter(o => o.status === 'Pending').length;
  const alertCount   = inventory.filter(i => i.status !== 'In Stock').length;

  /* ── Notification sounds ── */
  const knownOrderIdsRef    = useRef(null);
  const knownLowStockIdsRef = useRef(null);

  useEffect(() => {
    if (orders.length === 0) return;
    const currentIds = new Set(orders.map(o => o.id));
    if (knownOrderIdsRef.current === null) {
      knownOrderIdsRef.current = currentIds;
      return;
    }
    const hasNew = orders.some(o => !knownOrderIdsRef.current.has(o.id));
    if (hasNew) {
      const s = loadAdminSettings();
      if (s.notifSound && s.notifNewOrder) playNotificationSound('order');
    }
    knownOrderIdsRef.current = currentIds;
  }, [orders]);

  useEffect(() => {
    if (inventory.length === 0) return;
    const currentLow = new Set(inventory.filter(i => i.status !== 'In Stock').map(i => i.id));
    if (knownLowStockIdsRef.current === null) {
      knownLowStockIdsRef.current = currentLow;
      return;
    }
    const hasNew = [...currentLow].some(id => !knownLowStockIdsRef.current.has(id));
    if (hasNew) {
      const s = loadAdminSettings();
      if (s.notifSound && s.notifLowStock) playNotificationSound('stock');
    }
    knownLowStockIdsRef.current = currentLow;
  }, [inventory]);

  function renderSection() {
    if (allowedNav && !allowedNav.has(active) && active !== 'profile') {
      return <OrdersSection />;
    }
    switch (active) {
      case 'home':      return <HomeSection onAvatarClick={() => setActive('profile')} />;
      case 'products':  return <ProductsSection role={role} />;
      case 'inventory': return <InventorySection />;
      case 'rewards':   return <RewardsSection role={role} />;
      case 'orders':    return <OrdersSection />;
      case 'employees': return <EmployeesSection />;
      case 'auditLog':  return <AuditLogSection />;
      case 'settings':  return <SettingsSection onLogout={handleLogout} />;
      case 'profile':   return <AdminProfileSection session={session} onUpdate={updateSession} onLogout={() => setShowLogoutConfirm(true)} />;
      default:          return allowedNav ? <OrdersSection /> : <HomeSection />;
    }
  }

  return (
    <div className="adm-shell">
      {/* Global save toast */}
      {toast && (
        <div className="adm-save-toast">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          {toast}
        </div>
      )}

      {/* Logout confirm modal */}
      {showLogoutConfirm && createPortal(
        <div className="adm-modal-backdrop" onClick={() => setShowLogoutConfirm(false)}>
          <div className="adm-modal" onClick={e => e.stopPropagation()}>
            <div className="adm-modal__icon">
              {Icon.logout}
            </div>
            <h2 className="adm-modal__title">Log out?</h2>
            <p className="adm-modal__body">Are you sure you want to log out of the admin panel?</p>
            <div className="adm-modal__actions">
              <button className="adm-modal__cancel" onClick={() => setShowLogoutConfirm(false)}>Cancel</button>
              <button className="adm-modal__confirm" onClick={handleLogout}>Yes, log out</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Mobile overlay */}
      {sidebarOpen && <div className="adm-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* ── SIDEBAR ── */}
      <aside className={`adm-sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Brand */}
        <div className="adm-sidebar-brand">
          <img src="/login-icon.png" alt="JazSam" />
          <div>
            <span className="adm-sidebar-name">JazSam</span>
            <span className="adm-sidebar-role">Admin Panel</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="adm-nav">
          {visibleNav.map(item => (
            <button
              key={item.id}
              className={`adm-nav-item ${active === item.id ? 'active' : ''}`}
              onClick={() => handleNav(item.id)}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.id === 'orders'    && pendingCount > 0 && <span className="adm-nav-badge">{pendingCount}</span>}
              {item.id === 'inventory' && alertCount   > 0 && <span className="adm-nav-badge adm-nav-badge--warn">{alertCount}</span>}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <button className="adm-sidebar-logout" onClick={() => setShowLogoutConfirm(true)}>
          {Icon.logout}
          <span>Logout</span>
        </button>
      </aside>

      {/* ── MAIN ── */}
      <div className="adm-main">
        {/* Slim topbar — only hamburger (mobile) + avatar/link icon */}
        <header className="adm-topbar">
          <button className="adm-hamburger" onClick={() => setSidebarOpen(v => !v)} aria-label="Toggle sidebar">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          {/* spacer */}
          <span style={{ flex: 1 }} />
          <div className="adm-topbar-right">
            <button className="adm-topbar-notif" title="Go to store" onClick={() => navigate('/')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </button>
            <button
              className="adm-topbar-avatar"
              title={session?.email}
              onClick={() => { setActive('profile'); setSidebarOpen(false); }}
            >
              {session?.profilePicture ? (
                <img src={session.profilePicture} alt={session.name} className="adm-topbar-avatar-img" />
              ) : (
                session?.name?.[0] || 'A'
              )}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="adm-main-inner">
          {renderSection()}
        </main>
      </div>
    </div>
  );
}
