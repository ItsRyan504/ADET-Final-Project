/**
 * StoreContext — data layer that syncs with salespresso_db via PHP API.
 *
 * API base: http://localhost/salespresso-api
 * Falls back to DEFAULT data when the API is unreachable (e.g. XAMPP offline).
 */

import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const StoreContext = createContext(null);

const API = 'http://localhost/salespresso-api';


/* ── Simple fetch helpers ── */
function getAdminAuthHeader() {
  try {
    const session = JSON.parse(localStorage.getItem('jazsam_admin') || 'null');
    return session?.token ? { 'Authorization': `Bearer ${session.token}` } : {};
  } catch { return {}; }
}

async function apiFetch(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...getAdminAuthHeader(),
    ...(options.headers || {}),
  };
  const res = await fetch(`${API}/${path}`, { ...options, headers });
  if (res.status === 401) {
    localStorage.removeItem('jazsam_admin');
    window.dispatchEvent(new Event('jazsam_session_expired'));
    throw new Error(`API error 401`);
  }
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export function StoreProvider({ children }) {
  const [products,   setProducts]   = useState([]);
  const [inventory,  setInventory]  = useState([]);
  const [rewards,    setRewards]    = useState([]);
  const [employees,  setEmployees]  = useState([]);
  const [orders,     setOrders]     = useState([]);
  const [auditLogs,  setAuditLogs]  = useState([]);
  const [apiOnline,  setApiOnline]  = useState(false);

  /* ── Load all data from API on mount ── */
  useEffect(() => {
    Promise.allSettled([
      apiFetch('products.php'),
      apiFetch('ingredients.php'),
      apiFetch('rewards.php'),
      apiFetch('employees.php'),
    ]).then(([prodRes, invRes, rwdRes, empRes]) => {
      let online = false;
      if (prodRes.status === 'fulfilled' && Array.isArray(prodRes.value)) {
        setProducts(prodRes.value);
        online = true;
      }
      if (invRes.status  === 'fulfilled' && Array.isArray(invRes.value))  setInventory(invRes.value);
      if (rwdRes.status  === 'fulfilled' && Array.isArray(rwdRes.value))  setRewards(rwdRes.value);
      if (empRes.status  === 'fulfilled' && Array.isArray(empRes.value))  setEmployees(empRes.value);
      setApiOnline(online);
    });
  }, []);

  /* ── Poll products every 15 s so menu stays in sync with admin changes ── */
  const loadProducts = useCallback(async () => {
    try {
      const data = await apiFetch('products.php');
      if (Array.isArray(data)) setProducts(data);
    } catch {}
  }, []);

  useEffect(() => {
    let poll = setInterval(loadProducts, 15000);

    function onVisibilityChange() {
      clearInterval(poll);
      if (!document.hidden) {
        loadProducts();
        poll = setInterval(loadProducts, 15000);
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      clearInterval(poll);
    };
  }, [loadProducts]);

  /* ── Orders: load from DB, fall back to localStorage cache ── */
  const loadOrders = useCallback(async () => {
    try {
      const data = await apiFetch('orders.php');
      if (Array.isArray(data)) {
        setOrders(prev => {
          const prevIds = new Set(prev.map(o => o.id));
          // Only notify admin about orders that are actually visible (not awaiting payment)
          const incoming = data.filter(o => !prevIds.has(o.id) && o.status !== 'Awaiting Payment');
          if (incoming.length > 0) {
            window.dispatchEvent(new CustomEvent('jazsam_new_orders', { detail: { count: incoming.length } }));
          }
          return data;
        });
        localStorage.setItem('jazsam_orders', JSON.stringify(data));
        return;
      }
    } catch {}
    try {
      const cached = JSON.parse(localStorage.getItem('jazsam_orders') || '[]');
      setOrders(cached);
    } catch {}
  }, []);

  useEffect(() => {
    loadOrders(); // immediate fetch on mount
    window.addEventListener('jazsam_orders_updated', loadOrders);

    // SSE: server pushes order data whenever it changes (checked every 2 s server-side)
    const es = new EventSource(`${API}/orders-stream.php`);

    es.addEventListener('orders', (e) => {
      try {
        const data = JSON.parse(e.data);
        if (!Array.isArray(data)) return;
        setOrders(prev => {
          const prevIds = new Set(prev.map(o => o.id));
          const incoming = data.filter(o => !prevIds.has(o.id) && o.status !== 'Awaiting Payment');
          if (incoming.length > 0) {
            window.dispatchEvent(new CustomEvent('jazsam_new_orders', { detail: { count: incoming.length } }));
          }
          return data;
        });
        localStorage.setItem('jazsam_orders', JSON.stringify(data));
      } catch {}
    });

    // When the tab regains focus, do a manual fetch in case SSE missed anything while hidden
    function onVisibilityChange() {
      if (!document.hidden) loadOrders();
    }
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.removeEventListener('jazsam_orders_updated', loadOrders);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      es.close();
    };
  }, [loadOrders]);

  /* ════════════════════════════════════════
     PRODUCT CRUD
     ════════════════════════════════════════ */
  async function addProduct(p) {
    try {
      const payload = buildProductPayload(p);
      const result  = await apiFetch('products.php', { method: 'POST', body: JSON.stringify(payload) });
      const savedId = result.id ?? p.id ?? `p${Date.now()}`;
      setProducts(ps => [...ps, { ...p, id: savedId }]);
      loadProducts();
      return savedId;
    } catch {
      /* fallback: local only */
      const id = p.id || `p${Date.now()}`;
      setProducts(ps => [...ps, { ...p, id }]);
      return id;
    }
  }

  async function updateProduct(p) {
    /* Optimistic update */
    setProducts(ps => ps.map(x => x.id === p.id ? p : x));
    try {
      await apiFetch('products.php', { method: 'PUT', body: JSON.stringify(buildProductPayload(p)) });
      loadProducts();
    } catch {}
  }

  async function deleteProduct(id) {
    setProducts(ps => ps.filter(x => x.id !== id));
    try {
      await apiFetch(`products.php?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    } catch {}
  }

  /* ════════════════════════════════════════
     INVENTORY CRUD
     ════════════════════════════════════════ */
  async function addInventory(item) {
    try {
      const result  = await apiFetch('ingredients.php', { method: 'POST', body: JSON.stringify(item) });
      const savedId = result.id ?? item.id ?? `i${Date.now()}`;
      setInventory(is => [...is, { ...item, id: savedId }]);
    } catch {
      setInventory(is => [...is, { ...item, id: item.id || `i${Date.now()}` }]);
    }
  }

  async function updateInventory(item) {
    setInventory(is => is.map(x => x.id === item.id ? item : x));
    try {
      await apiFetch('ingredients.php', { method: 'PUT', body: JSON.stringify(item) });
    } catch {}
  }

  async function deleteInventory(id) {
    setInventory(is => is.filter(x => x.id !== id));
    try {
      await apiFetch(`ingredients.php?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    } catch {}
  }

  async function restockInventory(id, amount) {
    setInventory(is => is.map(x => {
      if (x.id !== id) return x;
      const newQty = x.qty + amount;
      const status = newQty <= 0 ? 'Out of Stock' : newQty <= x.threshold ? 'Low Stock' : 'In Stock';
      const updated = { ...x, qty: newQty, status };
      /* Sync to DB */
      apiFetch('ingredients.php', { method: 'PUT', body: JSON.stringify({ id, qty: newQty }) }).catch(() => {});
      return updated;
    }));
  }

  /* ════════════════════════════════════════
     REWARDS CRUD
     ════════════════════════════════════════ */
  async function addReward(r) {
    try {
      const result  = await apiFetch('rewards.php', { method: 'POST', body: JSON.stringify(r) });
      const savedId = result.id ?? r.id ?? `r${Date.now()}`;
      setRewards(rs => [...rs, { ...r, id: savedId }]);
    } catch {
      setRewards(rs => [...rs, { ...r, id: r.id || `r${Date.now()}` }]);
    }
  }

  async function updateReward(r) {
    setRewards(rs => rs.map(x => x.id === r.id ? r : x));
    try {
      await apiFetch('rewards.php', { method: 'PUT', body: JSON.stringify(r) });
    } catch {}
  }

  async function deleteReward(id) {
    setRewards(rs => rs.filter(x => x.id !== id));
    try {
      await apiFetch(`rewards.php?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    } catch {}
  }

  /* ════════════════════════════════════════
     EMPLOYEES CRUD
     ════════════════════════════════════════ */
  async function addEmployee(e) {
    try {
      const result  = await apiFetch('employees.php', { method: 'POST', body: JSON.stringify(buildEmployeePayload(e)) });
      const savedId = result.id ?? e.id ?? `e${Date.now()}`;
      setEmployees(es => [...es, { ...e, id: savedId }]);
    } catch {
      setEmployees(es => [...es, { ...e, id: e.id || `e${Date.now()}` }]);
    }
  }

  async function updateEmployee(e) {
    setEmployees(es => es.map(x => x.id === e.id ? e : x));
    try {
      await apiFetch('employees.php', { method: 'PUT', body: JSON.stringify(buildEmployeePayload(e)) });
    } catch {}
  }

  async function deleteEmployee(id) {
    setEmployees(es => es.filter(x => x.id !== id));
    try {
      await apiFetch(`employees.php?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    } catch {}
  }

  async function changeEmployeePassword(id, password) {
    try {
      await apiFetch('employees.php', {
        method: 'PUT',
        body: JSON.stringify({ id, password }),
      });
    } catch {}
  }

  const fetchAuditLogs = useCallback(async (limit = 200) => {
    try {
      const data = await apiFetch(`audit_log.php?limit=${limit}`);
      if (data?.logs) setAuditLogs(data.logs);
    } catch {}
  }, []);

  /* ── Payment: mark as paid (admin collects cash at counter) ── */
  async function updatePaymentStatus(orderId) {
    setOrders(os => os.map(o => o.id === orderId ? { ...o, paymentStatus: 'Paid' } : o));
    try {
      await apiFetch('payment.php', {
        method: 'PUT',
        body: JSON.stringify({ orderId }),
      });
      window.dispatchEvent(new Event('jazsam_orders_updated'));
      return { success: true };
    } catch (err) {
      window.dispatchEvent(new Event('jazsam_orders_updated'));
      return { success: false, error: err.message };
    }
  }

  /* ── Order status update — persists to DB ── */
  async function updateOrderStatus(id, status) {
    // Optimistic update
    setOrders(os => os.map(o => o.id === id ? { ...o, status } : o));
    try {
      await apiFetch('orders.php', {
        method: 'PUT',
        body: JSON.stringify({ id, status }),
      });
      // Re-fetch so employee name is populated from DB
      window.dispatchEvent(new Event('jazsam_orders_updated'));
      // Tell the customer's session to refresh points if order was completed
      if (status === 'Completed') {
        window.dispatchEvent(new Event('jazsam_points_updated'));
      }
      return { success: true };
    } catch (err) {
      // Revert optimistic update on failure
      window.dispatchEvent(new Event('jazsam_orders_updated'));
      return { success: false, error: err.message };
    }
  }

  const value = {
    products,  addProduct,  updateProduct,  deleteProduct,
    inventory, addInventory, updateInventory, deleteInventory, restockInventory,
    rewards,   addReward,   updateReward,   deleteReward,
    employees, addEmployee, updateEmployee, deleteEmployee, changeEmployeePassword,
    orders,    updateOrderStatus, updatePaymentStatus,
    auditLogs, fetchAuditLogs,
    apiOnline,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}

/* ══════════════════════════════════════════════
   Private helpers — shape data for the API
   ============================================== */
function buildProductPayload(p) {
  return {
    id:       p.id,
    name:     p.name,
    category: p.category,
    price:    p.price,
    sizes:    p.sizes  || [],
    temps:    p.temps  || [],
    status:   p.status,
    image:    p.image  || '',
    variants: (p.variants || []).map(v => ({
      variantId: v.variantId,
      size:      v.size,
      price:     v.price,
    })),
  };
}

function buildEmployeePayload(e) {
  const nameParts = (e.name || '').trim().split(' ');
  return {
    id:        e.id,
    firstName: nameParts[0] || '',
    lastName:  nameParts.slice(1).join(' ') || '',
    position:  e.position || 'Cashier',
    username:  e.username || '',
    email:     e.email    || '',
    phone:     e.phone    || '',
    password:  e.password || '',
    status:    e.status   || 'Active',
  };
}
