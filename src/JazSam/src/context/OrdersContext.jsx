import { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useStore } from './StoreContext';

const OrdersContext = createContext(null);

const API = 'http://localhost/salespresso-api';

/* ── Rising three-note chime — returns a stop() fn to cancel the loop ── */
function startReadySound() {
  const play = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      [[523, 0], [659, 0.18], [784, 0.36]].forEach(([freq, delay]) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = freq;
        const t = ctx.currentTime + delay;
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 1.0);
        osc.start(t);
        osc.stop(t + 1.0);
      });
    } catch {}
  };
  play();
  const id = setInterval(play, 3000);
  return () => clearInterval(id);
}

/* ── "Your order is ready" modal ── */
function OrderReadyModal({ order, onClose }) {
  useEffect(() => {
    const stopSound = startReadySound();
    const t = setTimeout(onClose, 12000);
    return () => {
      stopSound();
      clearTimeout(t);
    };
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem',
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: '2rem',
        maxWidth: 360, width: '100%', textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        animation: 'orderReadyIn 0.3s ease',
      }}>
        <div style={{ marginBottom: '0.75rem' }}>
          <svg width="72" height="72" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
            <path d="M287.38 939.53H676.5A20.48 20.48 0 0 1 697 960a20.48 20.48 0 0 1-20.48 20.48H287.38A20.48 20.48 0 0 1 266.9 960a20.48 20.48 0 0 1 20.48-20.47z" fill="#1a1a1a" />
            <path d="M309.41 837.77c-110.78-61.5-185.75-179.64-185.75-315.3v-11.25A361 361 0 0 1 135 421.11h698.45a361 361 0 0 1 11.36 90.1v11.26c0 135.65-75 253.8-185.75 315.3v11.38a45 45 0 0 1-45 45H354.4a45 45 0 0 1-45-45v-11.38z" fill="#f9f0e6" />
            <path d="M833.54 734.43a121.23 121.23 0 0 1-46.89-9.35L764.88 716l12-20.28a339.44 339.44 0 0 0 47.41-173.24V489l22.73 2.51a121.66 121.66 0 0 1 108.37 121.1c0.04 67.16-54.64 121.82-121.85 121.82zM825 693a82.41 82.41 0 0 0 8.5 0.44A80.92 80.92 0 0 0 865 538a380.68 380.68 0 0 1-40 155z" fill="#1a1a1a" />
            <path d="M833.45 421.11a361 361 0 0 1 11.36 90.1v11.26c0 135.65-75 253.8-185.75 315.3v11.38a45 45 0 0 1-45 45h-147a45 45 0 0 1-45-45v-11.38c-110.78-61.5-185.75-179.64-185.75-315.3v-11.25a361 361 0 0 1 11.36-90.1z" fill="#e8c99a" />
            <path d="M602.18 421.11h231.27a361 361 0 0 1 11.36 90.1v11.26c0 135.65-75 253.8-185.75 315.3v11.38a45 45 0 0 1-45 45H495.5v-67.58q135.83-199.65 106.68-405.46z" fill="#6b4226" />
            <path d="M614 919H354.47a65.61 65.61 0 0 1-65.54-65.54v-3.93a380.9 380.9 0 0 1-185.75-327.21v-10.95a382.07 382.07 0 0 1 13.11-99.44l4.08-15.15h727.72l4.08 15.15a382.08 382.08 0 0 1 13.11 99.44v10.94a380.9 380.9 0 0 1-185.74 327.27v3.93A65.61 65.61 0 0 1 614 919zM152.13 437.75a342 342 0 0 0-8 73.62v10.94a340 340 0 0 0 175.22 297.53l10.54 5.85v27.82a24.6 24.6 0 0 0 24.58 24.58H614a24.6 24.6 0 0 0 24.58-24.58V825.7l10.54-5.85a340 340 0 0 0 175.2-297.53v-10.95a342 342 0 0 0-8-73.62z" fill="#1a1a1a" />
            <path d="M469.95 406.82a20.48 20.48 0 0 1-12.52-36.7c13.63-10.51 22.79-30.7 22.79-50.24 0-18.05-5.59-39.4-12.46-47.59a20.46 20.46 0 0 1-2.69-4.12c-2.8-5.69-5.9-11.37-9.17-17.39-12.16-22.32-25.95-47.63-25.95-78.56 0-54.87 11.06-81.8 47.33-115.3A20.48 20.48 0 0 1 505.07 87c-27.77 25.64-34.16 41.57-34.16 85.2 0 20.5 10.18 39.18 21 59 3 5.48 6.06 11.12 8.95 16.87 6.59 8.61 11.78 20.06 15.43 34.09a154.27 154.27 0 0 1 4.94 37.73c0 32.09-15.21 64.54-38.74 82.68a20.39 20.39 0 0 1-12.54 4.25zM312.2 406.82a20.48 20.48 0 0 1-12.52-36.7c13.63-10.5 22.79-30.7 22.79-50.24 0-18.05-5.59-39.4-12.46-47.59a20.48 20.48 0 0 1-2.69-4.12c-2.8-5.69-5.9-11.37-9.17-17.39-12.15-22.33-25.95-47.64-25.95-78.57 0-54.87 11.06-81.8 47.33-115.3A20.48 20.48 0 0 1 347.32 87c-27.77 25.64-34.16 41.57-34.16 85.2 0 20.5 10.18 39.18 21 59 3 5.48 6.06 11.12 8.95 16.87 6.59 8.61 11.78 20.06 15.43 34.09a154.3 154.3 0 0 1 4.94 37.73c0 32.09-15.21 64.54-38.75 82.68a20.39 20.39 0 0 1-12.53 4.25zM627.7 406.82a20.48 20.48 0 0 1-12.52-36.7c13.63-10.51 22.79-30.7 22.79-50.24 0-18.05-5.59-39.4-12.46-47.59a20.46 20.46 0 0 1-2.69-4.12c-2.8-5.69-5.9-11.37-9.17-17.39-12.16-22.32-25.95-47.63-25.95-78.56 0-54.87 11.06-81.8 47.33-115.3A20.48 20.48 0 0 1 662.82 87c-27.77 25.64-34.16 41.57-34.16 85.2 0 20.5 10.18 39.18 21 59 3 5.48 6.06 11.12 8.95 16.87 6.59 8.61 11.78 20.06 15.43 34.09a154.27 154.27 0 0 1 4.94 37.73c0 32.09-15.21 64.54-38.74 82.68a20.39 20.39 0 0 1-12.54 4.25z" fill="#1a1a1a" />
          </svg>
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.4rem', color: '#1a1a1a' }}>
          Your order is ready!
        </h2>
        <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '1rem' }}>
          Order <strong>{order.id}</strong> is ready for pickup.
        </p>

        {(order.items || []).length > 0 && (
          <div style={{
            background: '#f9f5f0', borderRadius: 10,
            padding: '0.75rem 1rem', marginBottom: '1.25rem', textAlign: 'left',
          }}>
            {order.items.map((item, i) => {
              const m    = item.match(/^(\d+)x\s+(.+)$/);
              const qty  = m ? m[1] : '';
              const name = m ? m[2] : item;
              return (
                <div key={i} style={{ fontSize: '0.9rem', color: '#374151', padding: '2px 0' }}>
                  <span style={{ fontWeight: 600, color: '#6b4226' }}>{qty}x</span> {name}
                </div>
              );
            })}
          </div>
        )}

        <button
          onClick={onClose}
          style={{
            background: '#1a1a1a', color: '#fff', border: 'none',
            borderRadius: 8, padding: '0.65rem 2rem', fontWeight: 600,
            fontSize: '0.95rem', cursor: 'pointer', width: '100%',
          }}
        >
          Got it!
        </button>
      </div>
    </div>
  );
}

export function OrdersProvider({ children }) {
  const { user, addPoints } = useAuth();
  const store = useStore();
  const [completedAlert, setCompletedAlert] = useState(null);
  const [fetchedUserOrders, setFetchedUserOrders] = useState(null);
  const prevStatusesRef = useRef({});
  const prevStoreOrdersRef = useRef(null);

  const allOrders = store.orders;

  // Fetch user-specific orders directly from the server using ?userId= so we
  // rely on the SQL WHERE clause instead of client-side filtering, which breaks
  // when orders were saved with a mismatched or missing userId.
  const loadUserOrders = useCallback(async () => {
    if (!user?.id) { setFetchedUserOrders(null); return; }
    try {
      const res = await fetch(`${API}/orders.php?userId=${encodeURIComponent(user.id)}`);
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) setFetchedUserOrders(data);
    } catch {}
  }, [user?.id]);

  // Re-fetch whenever the user changes (login / logout)
  useEffect(() => { loadUserOrders(); }, [loadUserOrders]);

  // Re-fetch whenever store.orders changes (SSE pushes a new snapshot)
  useEffect(() => {
    if (store.orders !== prevStoreOrdersRef.current) {
      prevStoreOrdersRef.current = store.orders;
      loadUserOrders();
    }
  }, [store.orders, loadUserOrders]);

  // Re-fetch on explicit order-update events (placed, status changed, payment)
  useEffect(() => {
    window.addEventListener('jazsam_orders_updated', loadUserOrders);
    return () => window.removeEventListener('jazsam_orders_updated', loadUserOrders);
  }, [loadUserOrders]);

  const userOrders = user
    ? (fetchedUserOrders ?? allOrders.filter(o => String(o.userId) === String(user.id)))
    : allOrders;

  // Watch for the current user's orders transitioning to 'Completed'
  useEffect(() => {
    if (!user) return;
    if (window.location.pathname.startsWith('/admin')) return;
    userOrders.forEach(order => {
      const prev = prevStatusesRef.current[order.id];
      // prev === undefined means first load — don't alert for already-completed orders
      if (prev !== undefined && prev !== 'Completed' && order.status === 'Completed') {
        setCompletedAlert(order);
      }
    });
    const map = {};
    userOrders.forEach(o => { map[o.id] = o.status; });
    prevStatusesRef.current = map;
  }, [userOrders, user]);

  async function placeOrder(cartItems, note = '', overrideTotal = null, paymentMethod = 'cash', rewardId = null, customerName = '', orderType = 'Pickup', deliveryAddress = '', deliveryLatLng = '', deliveryFee = 0, phoneNumber = '') {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
    const timeStr = now.toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit', hour12: true,
    });

    const subtotal = cartItems.reduce((s, i) => s + i.price * i.qty, 0);
    const total = overrideTotal ?? subtotal;

    const newOrder = {
      id: `#${Math.floor(100000 + Math.random() * 900000)}`,
      userId: user?.id || 'guest',
      customer: customerName.trim() || user?.name || 'Guest',
      date: `${dateStr} · ${timeStr}`,
      items: cartItems.map(i => `${i.qty}x ${i.name}`),
      total,
      note: note || '',
      status: 'Pending',
      paymentMethod,
      paymentStatus: 'Pending',
      orderType,
      deliveryAddress: deliveryAddress || null,
      deliveryLatLng:  deliveryLatLng  || null,
      deliveryFee,
    };

    const res = await fetch(`${API}/orders.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId:          user?.id || '',
        customer:        customerName.trim() || user?.name || 'Guest',
        items:           newOrder.items,
        subtotal,
        total,
        note:            note || '',
        cartItems,
        paymentMethod,
        rewardId:        rewardId || null,
        orderType,
        deliveryAddress: deliveryAddress || '',
        deliveryLatLng:  deliveryLatLng  || '',
        deliveryFee,
        phoneNumber:     phoneNumber || '',
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Server error ${res.status}`);
    }
    const data = await res.json();
    if (data.id)             newOrder.id             = data.id;
    if (data.dbId)           newOrder.dbId           = data.dbId;
    if (data.paymentMethod)  newOrder.paymentMethod  = data.paymentMethod;
    if (data.paymentStatus)  newOrder.paymentStatus  = data.paymentStatus;

    window.dispatchEvent(new Event('jazsam_orders_updated'));

    return newOrder;
  }

  return (
    <OrdersContext.Provider value={{ orders: userOrders, allOrders, placeOrder }}>
      {children}
      {completedAlert && (
        <OrderReadyModal order={completedAlert} onClose={() => setCompletedAlert(null)} />
      )}
    </OrdersContext.Provider>
  );
}

export function useOrders() {
  return useContext(OrdersContext);
}
