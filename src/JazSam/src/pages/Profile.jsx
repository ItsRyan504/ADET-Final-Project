import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrdersContext';
import CropAvatarModal from '../components/CropAvatarModal';
import './Profile.css';

/* ─── Profile picture / avatar ──────────────────── */
function ProfilePicture({ name, picture, size = 88, onUpload, editable }) {
  const inputRef                        = useRef(null);
  const [pendingImg, setPendingImg]     = useState(null);
  const initials = name
    ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

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
        className={`profile-avatar-wrap${editable ? ' profile-avatar-wrap--editable' : ''}`}
        style={{ width: size, height: size }}
        onClick={() => editable && inputRef.current?.click()}
        title={editable ? 'Change profile picture' : undefined}
      >
        {picture ? (
          <img src={picture} alt={name} className="profile-avatar-img" style={{ width: size, height: size }} />
        ) : (
          <div className="profile-avatar" style={{ width: size, height: size, fontSize: size * 0.38 }}>
            {initials}
          </div>
        )}
        {editable && (
          <div className="profile-avatar-overlay">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            <span>Change photo</span>
          </div>
        )}
        {editable && (
          <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
        )}
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

/* ─── Stat card ─────────────────────────────────── */
function StatCard({ label, value, accent }) {
  return (
    <div className="profile-stat">
      <span className="profile-stat__value" style={accent ? { color: accent } : {}}>{value}</span>
      <span className="profile-stat__label">{label}</span>
    </div>
  );
}

/* ─── Field row ─────────────────────────────────── */
function FieldRow({ id, label, type = 'text', value, onChange, placeholder, readOnly, span }) {
  return (
    <div className={`profile-field${span ? ' profile-field--span' : ''}`}>
      <label className="profile-field__label" htmlFor={id}>{label}</label>
      <input
        id={id}
        type={type}
        className={`profile-field__input${readOnly ? ' profile-field__input--readonly' : ''}`}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readOnly}
      />
    </div>
  );
}

/* ─── MAIN ──────────────────────────────────────── */
export default function Profile() {
  const { user, updateUser, logout } = useAuth();
  const { orders }                   = useOrders();
  const navigate                     = useNavigate();

  const [form, setForm] = useState({
    name:    user?.name    || '',
    email:   user?.email   || '',
    phone:   user?.phone   || '',
    address: user?.address || '',
  });

  const [saved,      setSaved]      = useState(false);
  const [editing,    setEditing]    = useState(false);
  const [showDanger, setShowDanger] = useState(false);

  const totalOrders   = orders.length;
  const totalSpent    = orders.reduce((s, o) => s + (typeof o.total === 'number' ? o.total : 0), 0);
  const pendingOrders = orders.filter(o => o.status === 'Pending').length;

  function handleChange(field) {
    return (e) => {
      setForm(f => ({ ...f, [field]: e.target.value }));
      setSaved(false);
    };
  }

  function handleSave(e) {
    e.preventDefault();
    updateUser(form);
    setSaved(true);
    setEditing(false);
  }

  function handleCancel() {
    setEditing(false);
    setForm({
      name:    user?.name    || '',
      email:   user?.email   || '',
      phone:   user?.phone   || '',
      address: user?.address || '',
    });
  }

  function handlePhotoUpload(dataUrl) {
    updateUser({ profilePicture: dataUrl });
  }

  function handleLogout() {
    logout();
    navigate('/');
  }

  if (!user) {
    return (
      <div className="profile-page section-pad">
        <div className="container profile-not-logged">
          <p>You need to <a href="/login">log in</a> to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* ── Hero banner ── */}
      <div className="profile-hero">
        <div className="profile-hero__bg" />
        <div className="container profile-hero__content">
          <ProfilePicture
            name={form.name}
            picture={user.profilePicture}
            size={88}
            onUpload={handlePhotoUpload}
            editable={true}
          />
          <div className="profile-hero__info">
            <h1 className="profile-hero__name">{form.name || 'Your Name'}</h1>
            <p className="profile-hero__email">{form.email}</p>
            {form.address && (
              <p className="profile-hero__address">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                {form.address}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="container profile-body">

        {/* ── Stats row ── */}
        <div className="profile-stats">
          <StatCard label="Total orders" value={totalOrders} />
          <StatCard
            label="Total spent"
            value={`₱${totalSpent.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`}
            accent="var(--color-brown-light)"
          />
          <StatCard
            label="Pending"
            value={pendingOrders}
            accent={pendingOrders > 0 ? '#f59e0b' : undefined}
          />
        </div>

        {/* ── Profile info card ── */}
        <div className="profile-card">
          <div className="profile-card__header">
            <div>
              <h2 className="profile-card__title">Personal information</h2>
              <p className="profile-card__sub">Manage your account details</p>
            </div>
            {!editing && (
              <button className="profile-edit-btn" onClick={() => setEditing(true)}>
                Edit profile
              </button>
            )}
          </div>

          <form className="profile-form" onSubmit={handleSave} noValidate>
            <div className="profile-form__grid">
              <FieldRow
                id="profile-name"
                label="Full name"
                value={form.name}
                onChange={handleChange('name')}
                placeholder="Your full name"
                readOnly={!editing}
              />
              <FieldRow
                id="profile-email"
                label="Email address"
                type="email"
                value={form.email}
                onChange={handleChange('email')}
                placeholder="you@example.com"
                readOnly={!editing}
              />
              <FieldRow
                id="profile-phone"
                label="Contact number"
                type="tel"
                value={form.phone}
                onChange={handleChange('phone')}
                placeholder="+63 9XX XXX XXXX"
                readOnly={!editing}
              />
              <FieldRow
                id="profile-address"
                label="Address"
                value={form.address}
                onChange={handleChange('address')}
                placeholder="Street, City, Province"
                readOnly={!editing}
                span
              />
            </div>

            {editing && (
              <div className="profile-form__actions">
                <button
                  type="button"
                  className="profile-btn profile-btn--outline"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
                <button type="submit" className="profile-btn profile-btn--primary">
                  Save changes
                </button>
              </div>
            )}

            {saved && !editing && (
              <p className="profile-saved-msg">✓ Changes saved successfully.</p>
            )}
          </form>
        </div>

        {/* ── Quick links ── */}
        <div className="profile-card profile-quick-links">
          <h2 className="profile-card__title" style={{ marginBottom: 16 }}>Quick links</h2>
          <div className="profile-links-grid">
            <button className="profile-link-card" onClick={() => navigate('/my-orders')}>
              <span className="profile-link-card__icon">📋</span>
              <span className="profile-link-card__label">My orders</span>
              <span className="profile-link-card__arrow">→</span>
            </button>
            <button className="profile-link-card" onClick={() => navigate('/rewards')}>
              <span className="profile-link-card__icon">⭐</span>
              <span className="profile-link-card__label">Rewards</span>
              <span className="profile-link-card__arrow">→</span>
            </button>
            <button className="profile-link-card" onClick={() => navigate('/menu')}>
              <span className="profile-link-card__icon">☕</span>
              <span className="profile-link-card__label">Order now</span>
              <span className="profile-link-card__arrow">→</span>
            </button>
          </div>
        </div>

        {/* ── Danger zone ── */}
        <div className="profile-card profile-danger-zone">
          <button
            className="profile-danger-toggle"
            onClick={() => setShowDanger(v => !v)}
          >
            <span>Account actions</span>
            <span className={`profile-danger-toggle__arrow${showDanger ? ' open' : ''}`}>▾</span>
          </button>

          {showDanger && (
            <div className="profile-danger-body">
              <p className="profile-danger-desc">
                Logging out will end your current session. You can log back in anytime.
              </p>
              <button className="profile-btn profile-btn--danger" onClick={handleLogout}>
                Log out of this account
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
