import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useOrders } from '../context/OrdersContext';
import './MyOrders.css';

function OrderModal({ order, onClose }) {
  const cfg   = STATUS_CONFIG[order.status] || { label: order.status, color: '#a89f96' };
  const pmKey = `${order.paymentMethod || 'cash'}_${order.paymentStatus || 'Pending'}`;
  const badge = PAYMENT_BADGE[pmKey];

  return createPortal(
    <div className="order-modal__overlay" onClick={onClose}>
      <div className="order-modal__card" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="order-modal__header">
          <div>
            <p className="order-modal__label">Order ID</p>
            <p className="order-modal__id">{order.id}</p>
          </div>
          <button className="order-modal__close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="order-modal__divider" />

        {/* Date & status */}
        <div className="order-modal__row">
          <div>
            <p className="order-modal__label">Order date</p>
            <p className="order-modal__value">{order.date}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p className="order-modal__label">Status</p>
            <span className="order-modal__status-pill" style={{ background: cfg.color }}>{cfg.label}</span>
          </div>
        </div>

        {order.completedAt && (
          <div style={{ marginBottom: 12 }}>
            <p className="order-modal__label">Completed at</p>
            <p className="order-modal__value">{order.completedAt}</p>
          </div>
        )}

        {order.employee && (
          <div style={{ marginBottom: 12 }}>
            <p className="order-modal__label">Served by</p>
            <p className="order-modal__value">{order.employee}</p>
          </div>
        )}

        <div className="order-modal__divider" />

        {/* Items */}
        <p className="order-modal__label" style={{ marginBottom: 8 }}>Items ordered</p>
        <div className="order-modal__items">
          {order.items.map((item, i) => {
            const m    = item.match(/^(\d+)x\s+(.+)$/);
            const qty  = m ? m[1] : '';
            const name = m ? m[2] : item;
            return (
              <div key={i} className="order-modal__item-row">
                <span className="order-modal__item-qty">{qty}x</span>
                <span className="order-modal__item-name">{name}</span>
              </div>
            );
          })}
        </div>

        <div className="order-modal__divider" />

        {/* Order type badge */}
        {order.orderType && order.orderType !== 'Pickup' && (
          <div style={{ marginBottom: '0.5rem' }}>
            <span style={{
              display: 'inline-block',
              padding: '0.15rem 0.6rem',
              borderRadius: 99,
              fontSize: '0.78rem',
              fontWeight: 600,
              background: order.orderType === 'Delivery' ? '#fef3c7' : '#dbeafe',
              color:      order.orderType === 'Delivery' ? '#92400e' : '#1e40af',
            }}>
              {order.orderType === 'Delivery' ? '🛵 Delivery' : '🍽 Dine-in'}
            </span>
          </div>
        )}

        {/* Delivery address */}
        {order.orderType === 'Delivery' && order.deliveryAddress && (
          <div style={{ marginBottom: '0.5rem', fontSize: '0.82rem', color: '#374151', lineHeight: 1.4 }}>
            <p className="order-modal__label">Delivery address</p>
            <p>{order.deliveryAddress}</p>
          </div>
        )}

        {/* Total & note */}
        <div className="order-modal__row">
          <div>
            <p className="order-modal__label">Total amount</p>
            <p className="order-modal__total">
              {typeof order.total === 'number'
                ? `₱${order.total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
                : order.total}
            </p>
            {order.deliveryFee > 0 && (
              <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.15rem' }}>
                incl. ₱{order.deliveryFee.toFixed(2)} delivery fee
              </p>
            )}
          </div>
          {order.note && (
            <div style={{ textAlign: 'right', maxWidth: '55%' }}>
              <p className="order-modal__label">Note</p>
              <p className="order-modal__note">{order.note}</p>
            </div>
          )}
        </div>

        {/* Payment badge */}
        {badge && (
          <div className="order-modal__payment-badge" style={{ background: badge.bg, color: badge.color }}>
            {badge.label}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

const TABS = ['All', 'Pending', 'Preparing', 'Completed', 'Cancelled'];

const STATUS_CONFIG = {
  Pending:   { label: 'Pending',   color: '#f59e0b' },
  Preparing: { label: 'Preparing', color: '#3b82f6' },
  Completed: { label: 'Completed', color: '#22c55e' },
  Cancelled: { label: 'Cancelled', color: '#ef4444' },
};

const PAYMENT_BADGE = {
  cash_Pending: { label: 'Pay at Counter',    bg: '#fef3c7', color: '#92400e' },
  cash_Paid:    { label: 'Paid (Cash)',        bg: '#d1fae5', color: '#065f46' },
  online_Pending: { label: 'Awaiting Payment', bg: '#ede9fe', color: '#5b21b6' },
  online_Paid:    { label: 'Paid (Online)',     bg: '#d1fae5', color: '#065f46' },
};

const STATUS_STEPS = ['Pending', 'Preparing', 'Completed'];

function OrderTracker({ status, date, completedAt }) {
  if (status === 'Cancelled') {
    return (
      <div className="order-tracker">
        <div className="order-tracker__cancelled">✕ Order Cancelled</div>
      </div>
    );
  }

  const activeIdx = STATUS_STEPS.indexOf(status);

  return (
    <div className="order-tracker">
      {STATUS_STEPS.map((step, i) => {
        const done    = i < activeIdx;
        const current = i === activeIdx;
        const isLast  = i === STATUS_STEPS.length - 1;
        const timestamp = step === 'Completed' ? completedAt : (current ? date : null);
        return (
          <div key={step} className="order-tracker__step">
            <div className="order-tracker__col">
              <div className={`order-tracker__dot${done ? ' done' : current ? ' current' : ''}`} />
              {!isLast && <div className={`order-tracker__line${done ? ' done' : ''}`} />}
            </div>
            <div className="order-tracker__info">
              <span className={`order-tracker__label${current ? ' current' : done ? ' done' : ''}`}>{step}</span>
              {(current || done) && timestamp && <span className="order-tracker__timestamp">{timestamp}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function MyOrders() {
  const [activeTab,    setActiveTab]    = useState('All');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const { orders }                      = useOrders();

  const filtered = activeTab === 'All'
    ? orders
    : orders.filter(o => o.status === activeTab);

  return (
    <div className="my-orders-page section-pad">
      <div className="container">
        <h1 className="my-orders__title">Your orders</h1>

        {/* Tabs */}
        <div className="my-orders__tabs" role="tablist">
          {TABS.map(tab => (
            <button
              key={tab}
              role="tab"
              aria-selected={activeTab === tab}
              className={`my-orders__tab${activeTab === tab ? ' active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Orders list */}
        <div className="my-orders__list">
          {filtered.length === 0 ? (
            <div className="my-orders__empty">
              <p>No orders found.</p>
            </div>
          ) : (
            filtered.map(order => {
              const cfg = STATUS_CONFIG[order.status] || { label: order.status, color: '#a89f96' };
              return (
                <div key={order.id} className="order-card">
                  {/* Top row */}
                  <div className="order-card__top">
                    <div className="order-card__meta">
                      <span className="order-card__id">Order ID: <strong>{order.id}</strong></span>
                      <span className="order-card__date">Order date: <strong>{order.date}</strong></span>
                    </div>
                    <button className="order-card__view-btn" onClick={() => setSelectedOrder(order)}>View full order</button>
                  </div>

                  <div className="order-card__divider" />

                  {/* Status tracker */}
                  <OrderTracker status={order.status} date={order.date} completedAt={order.completedAt} />

                  <div className="order-card__divider" style={{ margin: '14px 0' }} />

                  {/* Bottom row */}
                  <div className="order-card__body">
                    <div className="order-card__col">
                      <p className="order-card__label">Items ordered:</p>
                      {order.items.map((item, i) => (
                        <p key={i} className="order-card__item">{item}</p>
                      ))}
                    </div>
                    <div className="order-card__col">
                      <p className="order-card__label">Total amount:</p>
                      <p className="order-card__total">
                        {typeof order.total === 'number'
                          ? `₱${order.total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
                          : order.total}
                      </p>
                    </div>
                    <div className="order-card__col order-card__col--note">
                      <p className="order-card__label">Note:</p>
                      <p className="order-card__note">{order.note || '—'}</p>
                    </div>
                  </div>

                  {/* Payment badge */}
                  {(() => {
                    const key = `${order.paymentMethod || 'cash'}_${order.paymentStatus || 'Pending'}`;
                    const badge = PAYMENT_BADGE[key];
                    if (!badge) return null;
                    return (
                      <div className="order-card__payment-badge" style={{ background: badge.bg, color: badge.color }}>
                        {badge.label}
                      </div>
                    );
                  })()}
                </div>
              );
            })
          )}
        </div>
      </div>

      {selectedOrder && (
        <OrderModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  );
}
