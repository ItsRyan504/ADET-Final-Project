import { useState, useMemo, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrdersContext';
import { useStore } from '../context/StoreContext';
import './Menu.css';

// Fix leaflet default marker icons (broken by bundlers)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const STORE_COORDS = [13.1391, 123.7354]; // Old Albay District, Legazpi City

function getDeliveryFee(distanceKm) {
  if (distanceKm <= 2) return 30;
  if (distanceKm <= 5) return 50;
  return 80;
}

function haversineKm([lat1, lng1], [lat2, lng2]) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function MapPicker({ pin, onPin }) {
  useMapEvents({
    click(e) { onPin([e.latlng.lat, e.latlng.lng]); },
  });
  return pin ? <Marker position={pin} /> : null;
}

const API = 'http://localhost/salespresso-api';

/* ─── Data ─────────────────────────────────────── */
const CATEGORIES = [
  { id: 'All',       label: 'All',       icon: '/fast-food-svgrepo-com.svg' },
  { id: 'Coffee',    label: 'Coffee',    icon: '/coffee-icon.png'   },
  { id: 'Milktea',   label: 'Milktea',   icon: '/milktea-icon.png'  },
  { id: 'Soda',      label: 'Soda',      icon: '/soda-icon.png'     },
  { id: 'Mocktails', label: 'Mocktails', icon: '/mocktail.png'      },
  { id: 'Sides',     label: 'Sides',     icon: '/sides-icon.png'    },
];

const fmt = (n) => `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

/* ─── Edit icon ─────────────────────────────────── */
function EditIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
}

/* ─── Guest Sign In Modal (via Portal) ──────────── */
function GuestSignInModal({ item, onClose, onLogin, onSignUp }) {
  return createPortal(
    <div className="item-modal-overlay" onClick={onClose}>
      <div className="item-modal guest-signin-modal" onClick={e => e.stopPropagation()}>
        <button className="item-modal__close" onClick={onClose} aria-label="Close">✕</button>

        <div className="guest-signin-modal__img-wrap">
          <img src={item.img} alt={item.name} className="item-modal__img" />
        </div>

        <div className="guest-signin-modal__body">
          <div className="guest-signin-modal__lock">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h2 className="guest-signin-modal__title">Sign in to order</h2>
          <p className="guest-signin-modal__desc">
            Create an account or log in to add <strong>{item.name}</strong> to your cart and start ordering.
          </p>

          <div className="guest-signin-modal__actions">
            <button className="guest-signin-modal__btn guest-signin-modal__btn--primary" onClick={onLogin}>
              Log in
            </button>
            <button className="guest-signin-modal__btn guest-signin-modal__btn--outline" onClick={onSignUp}>
              Create an account
            </button>
          </div>

          <p className="guest-signin-modal__footer-text">
            Browse the menu freely — sign in when you're ready!
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ─── No-image placeholder ──────────────────────── */
function ImgPlaceholder({ size = 90 }) {
  return (
    <div className="menu-img-placeholder" style={{ width: size, height: size }}>
      <svg width={size * 0.45} height={size * 0.45} viewBox="0 0 24 24" fill="none" stroke="#c0b0a0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
    </div>
  );
}

/* ─── Item Detail Modal (via Portal) ───────────── */
function ItemModal({ item, onClose, onAddToCart }) {
  const variants  = item.variants || [];
  const temps     = item.temps    || [];
  const hasMultipleSizes = variants.filter(v => v.size && v.size !== 'Regular').length > 1;
  const hasTemps         = temps.length > 0;

  const [selectedVariant, setSelectedVariant] = useState(() => variants[0] || null);
  const [selectedTemp,    setSelectedTemp]    = useState(() => temps[0] || null);
  const [qty,  setQty]  = useState(1);

  const price = selectedVariant?.price ?? item.price;

  function handleAdd() {
    onAddToCart({
      ...item,
      price,
      selectedSize: selectedVariant?.size  || null,
      selectedTemp: selectedTemp           || null,
      qty,
    });
    onClose();
  }

  return createPortal(
    <div className="item-modal-overlay" onClick={onClose}>
      <div className="item-modal" onClick={e => e.stopPropagation()}>
        <button className="item-modal__close" onClick={onClose} aria-label="Close">✕</button>

        {/* Header: image + name/price side by side */}
        <div className="item-modal__header">
          <div className="item-modal__img-wrap">
            {item.img
              ? <img src={item.img} alt={item.name} className="item-modal__img" />
              : <ImgPlaceholder size={70} />
            }
          </div>
          <div className="item-modal__header-info">
            <h2 className="item-modal__name">{item.name}</h2>
            <p className="item-modal__price">{fmt(price)}</p>
            <p className="item-modal__desc">A perfectly crafted item made with care — just how you like it.</p>
          </div>
        </div>

        <div className="item-modal__body">

          {/* Size selector */}
          {hasMultipleSizes && (
            <div className="item-modal__option-group">
              <span className="item-modal__label">Size</span>
              <div className="item-modal__options">
                {variants.map(v => (
                  <button
                    key={v.variantId || v.size}
                    className={`item-modal__opt-btn${selectedVariant?.size === v.size ? ' item-modal__opt-btn--active' : ''}`}
                    onClick={() => setSelectedVariant(v)}
                  >
                    <span className="item-modal__opt-label">{v.size}</span>
                    <span className="item-modal__opt-price">{fmt(v.price)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Temperature selector */}
          {hasTemps && (
            <div className="item-modal__option-group">
              <span className="item-modal__label">Temperature</span>
              <div className="item-modal__options">
                {temps.map(t => (
                  <button
                    key={t}
                    className={`item-modal__opt-btn item-modal__opt-btn--temp${selectedTemp === t ? (t === 'Hot' ? ' item-modal__opt-btn--hot' : ' item-modal__opt-btn--cold') : ''}`}
                    onClick={() => setSelectedTemp(t)}
                  >
                    {t === 'Hot'
                      ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="2" x2="6" y2="5"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="2" x2="14" y2="5"/></svg>
                      : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="20" y1="4" x2="4" y2="20"/><line x1="4" y1="4" x2="20" y2="20"/><line x1="12" y1="6" x2="9" y2="3"/><line x1="12" y1="6" x2="15" y2="3"/><line x1="12" y1="18" x2="9" y2="21"/><line x1="12" y1="18" x2="15" y2="21"/><line x1="18" y1="12" x2="21" y2="9"/><line x1="18" y1="12" x2="21" y2="15"/></svg>
                    }
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="item-modal__qty-row">
            <span className="item-modal__label">Quantity</span>
            <div className="item-modal__qty">
              <button onClick={() => setQty(q => Math.max(1, q - 1))} className="item-modal__qty-btn">−</button>
              <span className="item-modal__qty-val">{qty}</span>
              <button onClick={() => setQty(q => q + 1)} className="item-modal__qty-btn">+</button>
            </div>
          </div>

          {/* Footer */}
          <div className="item-modal__footer">
            <span className="item-modal__subtotal">{fmt(price * qty)}</span>
            <button className="item-modal__add-btn" onClick={handleAdd}>
              Add to cart
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ─── Checkout Confirm Modal (via Portal) ───────── */
function CheckoutModal({ cartItems, onConfirm, onCancel }) {
  const { user }              = useAuth();
  const { rewards: storeRewards } = useStore();
  const subtotal = cartItems.reduce((s, i) => s + i.price * i.qty, 0);
  const [orderNote,      setOrderNote]      = useState('');
  const [customerName,   setCustomerName]   = useState(user?.name || '');
  const [phoneNumber,    setPhoneNumber]    = useState('');
  const [paymentMethod,  setPaymentMethod]  = useState(null);
  const [step,           setStep]           = useState('review'); // 'review' | 'fulfillment' | 'payment'
  const [orderType,      setOrderType]      = useState(null);     // 'Pickup' | 'Dine-in' | 'Delivery'
  const [pin,            setPin]            = useState(null);     // [lat, lng]
  const [reverseAddr,    setReverseAddr]    = useState('');

  const activeReward = (() => {
    try {
      const cached = JSON.parse(localStorage.getItem('jazsam_active_reward'));
      if (cached) return cached;
      if (user?.activeRewardId && storeRewards?.length) {
        const r = storeRewards.find(r => r.id === user.activeRewardId);
        return r || null;
      }
      return null;
    } catch { return null; }
  })();

  const discount = (() => {
    if (!activeReward) return 0;
    if (activeReward.rawType === 'Percentage')   return subtotal * (activeReward.rawValue / 100);
    if (activeReward.rawType === 'Fixed Amount') return Math.min(activeReward.rawValue, subtotal);
    return 0;
  })();

  const distanceKm  = pin ? haversineKm(STORE_COORDS, pin) : 0;
  const deliveryFee = orderType === 'Delivery' && pin ? getDeliveryFee(distanceKm) : 0;
  const itemsTotal  = Math.max(0, subtotal - discount);
  const total       = itemsTotal + deliveryFee;

  // Reverse-geocode the pin to get a human-readable address
  const handlePin = useCallback(async (coords) => {
    setPin(coords);
    setReverseAddr('');
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${coords[0]}&lon=${coords[1]}&format=json`
      );
      const data = await res.json();
      setReverseAddr(data.display_name || '');
    } catch {}
  }, []);

  const canProceedFromFulfillment =
    orderType === 'Pickup' ||
    orderType === 'Dine-in' ||
    (orderType === 'Delivery' && pin && phoneNumber.trim().length >= 7);

  return createPortal(
    <div className="item-modal-overlay" onClick={onCancel}>
      <div className="item-modal checkout-modal" onClick={e => e.stopPropagation()}>
        <button className="item-modal__close" onClick={onCancel} aria-label="Close">✕</button>

        {/* ── Step 1: Review ── */}
        {step === 'review' && (
          <>
            <div className="checkout-modal__header">
              <h2 className="item-modal__name">Confirm your order</h2>
              <p className="item-modal__desc">Review your items before placing the order.</p>
            </div>

            <div className="checkout-modal__items">
              {cartItems.map(item => (
                <div key={item.cartKey} className="checkout-row">
                  <img src={item.img} alt={item.name} className="checkout-row__img" />
                  <div className="checkout-row__info">
                    <p className="checkout-row__name">{item.qty}× {item.name}</p>
                    {item.note && <p className="checkout-row__note">{item.note}</p>}
                  </div>
                  <p className="checkout-row__price">{fmt(item.price * item.qty)}</p>
                </div>
              ))}
            </div>

            {activeReward && discount > 0 && (
              <div className="checkout-reward-banner">
                🎫 <strong>{activeReward.name}</strong> applied
                <span className="checkout-reward-save">−{fmt(discount)}</span>
              </div>
            )}

            <div className="checkout-modal__note-wrap">
              <label className="item-modal__label" htmlFor="order-name">Name</label>
              <input
                id="order-name"
                className="item-modal__note"
                style={{ resize: 'none', padding: '0.5rem 0.75rem' }}
                placeholder="e.g. Juan"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
              />
            </div>

            <div className="checkout-modal__note-wrap">
              <label className="item-modal__label" htmlFor="order-note">
                Order note <span>(optional)</span>
              </label>
              <textarea
                id="order-note"
                className="item-modal__note"
                placeholder="e.g. Please include extra napkins…"
                rows={2}
                value={orderNote}
                onChange={e => setOrderNote(e.target.value)}
              />
            </div>

            <div className="checkout-modal__footer">
              {discount > 0 && (
                <div className="cart-panel__total-row" style={{ marginBottom: 4, color: '#6b7280', fontSize: '0.82rem' }}>
                  <span>Subtotal:</span><span>{fmt(subtotal)}</span>
                </div>
              )}
              <div className="cart-panel__total-row cart-panel__total-row--bold" style={{ marginBottom: 12 }}>
                <span>Total:</span><span>{fmt(itemsTotal)}</span>
              </div>
              <button className="item-modal__add-btn" onClick={() => setStep('fulfillment')}>
                Continue
              </button>
            </div>
          </>
        )}

        {/* ── Step 2: Fulfillment ── */}
        {step === 'fulfillment' && (
          <>
            <div className="checkout-modal__header">
              <h2 className="item-modal__name">How will you receive your order?</h2>
              <p className="item-modal__desc">Choose how you'd like to get your order.</p>
            </div>

            <div className="checkout-payment-options" style={{ marginBottom: '1rem' }}>
              {[
                { key: 'Pickup',  label: 'Pick Up',  desc: 'Collect your order at the counter' },
                { key: 'Dine-in', label: 'Dine In',  desc: 'Eat here at the café' },
                { key: 'Delivery',label: 'Delivery', desc: 'We deliver to your location in Legazpi City' },
              ].map(opt => (
                <button
                  key={opt.key}
                  className={`checkout-payment-btn${orderType === opt.key ? ' checkout-payment-btn--active' : ''}`}
                  onClick={() => { setOrderType(opt.key); setPin(null); setReverseAddr(''); setPhoneNumber(''); }}
                >
                  <span className="checkout-payment-btn__label">{opt.label}</span>
                  <span className="checkout-payment-btn__desc">{opt.desc}</span>
                </button>
              ))}
            </div>

            {orderType === 'Delivery' && (
              <div style={{ marginBottom: '1rem' }}>
                <div className="checkout-modal__note-wrap" style={{ marginBottom: '0.75rem' }}>
                  <label className="item-modal__label" htmlFor="delivery-phone">
                    Phone number
                  </label>
                  <input
                    id="delivery-phone"
                    className="item-modal__note"
                    style={{ padding: '0.5rem 0.75rem' }}
                    placeholder="e.g. 09XX XXX XXXX"
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value)}
                    type="tel"
                  />
                </div>

                <p className="item-modal__label" style={{ marginBottom: '0.4rem' }}>
                  Pin your location
                </p>
                <div style={{ height: 240, borderRadius: 10, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                  <MapContainer
                    center={STORE_COORDS}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={false}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <MapPicker pin={pin} onPin={handlePin} />
                  </MapContainer>
                </div>
                {pin && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#374151' }}>
                    <strong>Delivery fee:</strong> ₱{deliveryFee} ({distanceKm.toFixed(1)} km away)
                    {reverseAddr && (
                      <p style={{ marginTop: '0.2rem', color: '#6b7280', fontSize: '0.75rem' }}>
                        {reverseAddr}
                      </p>
                    )}
                  </div>
                )}
                {!pin && (
                  <p style={{ marginTop: '0.4rem', fontSize: '0.78rem', color: '#9ca3af' }}>
                    Tap anywhere on the map to drop your pin.
                  </p>
                )}
              </div>
            )}

            <div className="checkout-modal__footer checkout-payment-footer">
              <button
                className="item-modal__add-btn checkout-payment-footer__back"
                onClick={() => setStep('review')}
              >
                Back
              </button>
              <button
                className="item-modal__add-btn"
                disabled={!canProceedFromFulfillment}
                style={{ opacity: canProceedFromFulfillment ? 1 : 0.45, flex: 1 }}
                onClick={() => {
                  if (!canProceedFromFulfillment) return;
                  if (orderType === 'Delivery') setPaymentMethod('online');
                  setStep('payment');
                }}
              >
                Continue to payment
              </button>
            </div>
          </>
        )}

        {/* ── Step 3: Payment ── */}
        {step === 'payment' && (
          <>
            <div className="checkout-modal__header">
              <h2 className="item-modal__name">How would you like to pay?</h2>
              <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.25rem' }}>
                <span>Items: {fmt(itemsTotal)}</span>
                {deliveryFee > 0 && <span style={{ marginLeft: '0.75rem' }}>Delivery: +{fmt(deliveryFee)}</span>}
              </div>
              <p className="item-modal__desc" style={{ marginTop: '0.25rem' }}>
                Total: <strong>{fmt(total)}</strong>
              </p>
            </div>

            <div className="checkout-payment-options">
              {orderType !== 'Delivery' && (
                <button
                  className={`checkout-payment-btn${paymentMethod === 'cash' ? ' checkout-payment-btn--active' : ''}`}
                  onClick={() => setPaymentMethod('cash')}
                >
                  <img src="/cash-counter-payment-svgrepo-com.svg" alt="" className="checkout-payment-btn__icon" />
                  <span className="checkout-payment-btn__label">Pay at Counter</span>
                  <span className="checkout-payment-btn__desc">Cash — pay when you receive your order</span>
                </button>
              )}

              <button
                className={`checkout-payment-btn${paymentMethod === 'online' ? ' checkout-payment-btn--active' : ''}`}
                onClick={() => setPaymentMethod('online')}
              >
                <img src="/cashless-payment-svgrepo-com.svg" alt="" className="checkout-payment-btn__icon" />
                <span className="checkout-payment-btn__label">Pay Now</span>
                <span className="checkout-payment-btn__desc">GCash via PayMongo</span>
              </button>
            </div>

            {orderType === 'Delivery' && (
              <p style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: '-0.25rem', marginBottom: '0.5rem' }}>
                Online payment is required for delivery orders.
              </p>
            )}

            <div className="checkout-modal__footer checkout-payment-footer">
              <button
                className="item-modal__add-btn checkout-payment-footer__back"
                onClick={() => setStep('fulfillment')}
              >
                Back
              </button>
              <button
                className="item-modal__add-btn"
                disabled={!paymentMethod}
                style={{ opacity: paymentMethod ? 1 : 0.45, flex: 1 }}
                onClick={() => paymentMethod && onConfirm(
                  orderNote, total, paymentMethod, activeReward?.id || null,
                  customerName, orderType, pin, reverseAddr, deliveryFee, phoneNumber
                )}
              >
                Place order
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}

/* ─── Cart Panel ────────────────────────────────── */
function CartPanel({ cartItems, onInc, onDec, onCheckout, onClose }) {
  const subtotal = useMemo(() => cartItems.reduce((s, i) => s + i.price * i.qty, 0), [cartItems]);

  return (
    <aside className="cart-panel">
      <div className="cart-panel__header">
        <h3 className="cart-panel__title">Your cart</h3>
        {onClose && (
          <button className="cart-panel__edit" onClick={onClose} aria-label="Close cart">✕</button>
        )}
      </div>

      {cartItems.length === 0 ? (
        <div className="cart-panel__empty">
          <p>Your cart is empty.</p>
          <p>Add items from the menu!</p>
        </div>
      ) : (
        <div className="cart-panel__items">
          {cartItems.map(item => (
            <div key={item.cartKey} className="cart-row">
              <img src={item.img} alt={item.name} className="cart-row__img" />
              <div className="cart-row__info">
                <p className="cart-row__name">{item.name}</p>
                <p className="cart-row__price">{fmt(item.price)}</p>
                {item.note && <p className="cart-row__note">{item.note}</p>}
              </div>
              <div className="cart-row__qty">
                <button className="cart-row__btn" onClick={() => onDec(item.cartKey)}>−</button>
                <span>{item.qty}</span>
                <button className="cart-row__btn" onClick={() => onInc(item.cartKey)}>+</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {cartItems.length > 0 && (
        <div className="cart-panel__footer">
          <div className="cart-panel__totals">
            <div className="cart-panel__total-row">
              <span>Subtotal:</span><span>{fmt(subtotal)}</span>
            </div>
            <div className="cart-panel__total-row cart-panel__total-row--bold">
              <span>Total:</span><span>{fmt(subtotal)}</span>
            </div>
          </div>
          <button className="cart-panel__checkout-btn" onClick={onCheckout}>
            Proceed to check out
          </button>
        </div>
      )}
    </aside>
  );
}

/* ─── Cart Abandon Confirm Modal ────────────────── */
function CartAbandonModal({ onStay, onLeave }) {
  return createPortal(
    <div className="item-modal-overlay" onClick={onStay}>
      <div className="item-modal" style={{ maxWidth: 340 }} onClick={e => e.stopPropagation()}>
        <div className="item-modal__body" style={{ gap: 14, paddingTop: 28 }}>
          <div style={{ textAlign: 'center', fontSize: '2rem' }}>🛒</div>
          <h2 className="item-modal__name" style={{ textAlign: 'center' }}>Leave the menu?</h2>
          <p className="item-modal__desc" style={{ textAlign: 'center' }}>
            You have items in your cart. If you leave now, your cart will be cleared.
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button
              className="item-modal__add-btn"
              style={{ background: '#f5f0ea', color: '#1a1a1a', flex: 1 }}
              onClick={onStay}
            >
              Stay
            </button>
            <button
              className="item-modal__add-btn"
              style={{ flex: 1 }}
              onClick={onLeave}
            >
              Leave
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ─── MAIN PAGE ─────────────────────────────────── */
export default function Menu() {
  const { user } = useAuth();
  const { placeOrder }         = useOrders();
  const { products }           = useStore();
  const navigate               = useNavigate();

  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedItem,   setSelectedItem]   = useState(null);
  const [showCheckout,   setShowCheckout]   = useState(false);
  const [cartItems,      setCartItems]      = useState([]);
  const [guestItem,      setGuestItem]      = useState(null);
  const [orderError,      setOrderError]      = useState(null);
  const [showAbandonModal, setShowAbandonModal] = useState(false);
  const [pendingPath,      setPendingPath]      = useState(null);
  const [mobileCartOpen,   setMobileCartOpen]   = useState(false);

  const totalCartQty = cartItems.reduce((s, i) => s + i.qty, 0);

  // Intercept link clicks when cart has items
  useEffect(() => {
    if (cartItems.length === 0) return;

    function onLinkClick(e) {
      const link = e.target.closest('a[href]');
      if (!link) return;
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto')) return;
      e.preventDefault();
      e.stopPropagation();
      setPendingPath(href);
      setShowAbandonModal(true);
    }

    document.addEventListener('click', onLinkClick, true);
    return () => document.removeEventListener('click', onLinkClick, true);
  }, [cartItems.length]);

  // Warn on browser close / refresh
  useEffect(() => {
    function onBeforeUnload(e) {
      if (cartItems.length > 0) { e.preventDefault(); e.returnValue = ''; }
    }
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [cartItems.length]);

  const filtered = products
    .filter(p => (activeCategory === 'All' || p.category === activeCategory) && p.status === 'available')
    .map(p => ({ ...p, img: p.image || null }));

  const sectionLabel =
    activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1);

  /* ── Card click handler ── */
  function handleItemClick(item) {
    if (user) {
      setSelectedItem(item);
    } else {
      setGuestItem(item);
    }
  }

  /* ── Cart handlers ── */
  function addToCart({ qty, note, ...item }) {
    setCartItems(prev => {
      const cartKey = `${item.id}-${Date.now()}`;
      return [...prev, { ...item, qty, note, cartKey }];
    });
  }

  function incQty(cartKey) {
    setCartItems(prev => prev.map(i => i.cartKey === cartKey ? { ...i, qty: i.qty + 1 } : i));
  }

  function decQty(cartKey) {
    setCartItems(prev =>
      prev.map(i => i.cartKey === cartKey ? { ...i, qty: i.qty - 1 } : i)
          .filter(i => i.qty > 0)
    );
  }

  /* ── Checkout ── */
  async function handleConfirmOrder(orderNote, discountedTotal, paymentMethod, rewardId = null, customerName = '', orderType = 'Pickup', pin = null, deliveryAddress = '', deliveryFee = 0, phoneNumber = '') {
    try {
      const deliveryLatLng = pin ? `${pin[0]},${pin[1]}` : '';
      const order = await placeOrder(cartItems, orderNote, discountedTotal, paymentMethod, rewardId, customerName, orderType, deliveryAddress, deliveryLatLng, deliveryFee, phoneNumber);

      // Clear voucher from localStorage (server already cleared it from DB)
      if (rewardId) {
        try {
          const cachedReward = JSON.parse(localStorage.getItem('jazsam_active_reward'));
          const rewardPts = cachedReward?.points ?? cachedReward?.stamps ?? 999;
          if (rewardPts < 30 && user?.id) {
            const usedKey = `jazsam_used_rewards_${user.id}`;
            const used = JSON.parse(localStorage.getItem(usedKey) || '[]');
            if (!used.includes(rewardId)) {
              localStorage.setItem(usedKey, JSON.stringify([...used, rewardId]));
            }
          }
        } catch {}
        localStorage.removeItem('jazsam_active_reward');
      }

      setCartItems([]);
      setShowCheckout(false);

      if (paymentMethod === 'online') {
        // Create a PayMongo checkout session and redirect the user there
        const res = await fetch(`${API}/paymongo-checkout.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: order.dbId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Could not start online payment.');
        window.location.href = data.checkoutUrl;
      } else {
        navigate('/my-orders');
      }
    } catch (err) {
      console.error('[PayMongo] order error:', err);
      setShowCheckout(false);
      setOrderError(err.message || 'Failed to place order. Please try again.');
    }
  }

  return (
    <main className="menu-page">
      {/* Cart abandon modal */}
      {showAbandonModal && (
        <CartAbandonModal
          onStay={() => setShowAbandonModal(false)}
          onLeave={() => {
            setCartItems([]);
            setShowAbandonModal(false);
            navigate(pendingPath);
          }}
        />
      )}

      {/* Order error toast */}
      {orderError && (
        <div className="menu-order-error">{orderError}</div>
      )}

      {/* Hero */}
      <section className="menu-page__hero">
        <div className="menu-page__hero-bg" />
        <div className="container menu-page__hero-inner">
          <h1 className="menu-page__hero-title">Our Menu</h1>
          <p className="menu-page__hero-sub">Handcrafted for your every mood</p>
        </div>
      </section>

      {/* Body */}
      <div className={`container menu-page__body${user ? ' menu-page__body--with-cart' : ''}`}>

        {/* Left */}
        <div className="menu-page__left">
          <section className="menu-categories">
            <h2 className="menu-categories__heading">Categories</h2>
            <div className="menu-categories__list">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  id={`category-${cat.id}`}
                  className={`menu-cat-btn${activeCategory === cat.id ? ' menu-cat-btn--active' : ''}`}
                  onClick={() => setActiveCategory(cat.id)}
                >
                  <img src={cat.icon} alt={cat.label} className="menu-cat-btn__icon" />
                  <span className="menu-cat-btn__label">{cat.label}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="menu-grid-section">
            <div className="menu-grid-section__header">
              <h2 className="menu-grid-section__title">{sectionLabel}</h2>
            </div>

            {filtered.length === 0 && (
              <p className="menu-empty">No items available in this category yet.</p>
            )}

            <div className={`menu-grid${user ? ' menu-grid--with-cart' : ''}`}>
              {filtered.map(item => (
                <div
                  key={item.id}
                  className="menu-item-card"
                  id={`item-${activeCategory}-${item.id}`}
                  onClick={() => handleItemClick(item)}
                >
                  <div className="menu-item-card__img-wrap">
                    {item.img
                      ? <img src={item.img} alt={item.name} className="menu-item-card__img" />
                      : <ImgPlaceholder size={90} />
                    }
                  </div>
                  <div className="menu-item-card__info">
                    <span className="menu-item-card__name">{item.name}</span>
                    <span className="menu-item-card__price">PHP {item.price.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Cart — desktop sidebar */}
        {user && (
          <CartPanel
            cartItems={cartItems}
            onInc={incQty}
            onDec={decQty}
            onCheckout={() => setShowCheckout(true)}
          />
        )}
      </div>

      {/* Mobile cart FAB + drawer — portalled to body to escape PageTransition's transform */}
      {user && createPortal(
        <>
          <button className="mobile-cart-fab" onClick={() => setMobileCartOpen(true)} aria-label="Open cart">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM5.2 4H2V2H0v2h2l3.6 7.59L4.25 14c-.16.28-.25.61-.25.96C4 16.1 4.9 17 6 17h14v-2H6.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63H19c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1 1 0 0 0 23.43 4H5.2z"/>
            </svg>
            {totalCartQty > 0 && <span className="mobile-cart-fab__badge">{totalCartQty}</span>}
          </button>
          {mobileCartOpen && (
            <div className="mobile-cart-overlay" onClick={() => setMobileCartOpen(false)}>
              <div className="mobile-cart-drawer" onClick={e => e.stopPropagation()}>
                <div className="mobile-cart-drawer__handle" />
                <CartPanel
                  cartItems={cartItems}
                  onInc={incQty}
                  onDec={decQty}
                  onCheckout={() => { setMobileCartOpen(false); setShowCheckout(true); }}
                  onClose={() => setMobileCartOpen(false)}
                />
              </div>
            </div>
          )}
        </>,
        document.body
      )}

      {/* Guest sign-in modal — portal to body */}
      {guestItem && (
        <GuestSignInModal
          item={guestItem}
          onClose={() => setGuestItem(null)}
          onLogin={() => navigate('/login')}
          onSignUp={() => navigate('/login')}
        />
      )}

      {/* Item modal — portal to body */}
      {selectedItem && (
        <ItemModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onAddToCart={addToCart}
        />
      )}

      {showCheckout && (
        <CheckoutModal
          cartItems={cartItems}
          onConfirm={handleConfirmOrder}
          onCancel={() => setShowCheckout(false)}
        />
      )}
    </main>
  );
}
