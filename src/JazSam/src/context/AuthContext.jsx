import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const SESSION_KEY = 'jazsam_user';
const API = 'http://localhost/salespresso-api';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)) || null; }
    catch { return null; }
  });

  async function register({ firstName, lastName, email, phone, password }) {
    try {
      const res = await fetch(`${API}/customers.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', firstName, lastName, email, phone, password }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 429) {
        return { success: false, error: data.error || 'Too many attempts. Please wait a few minutes.' };
      }
      if (!res.ok && !data.success) {
        return { success: false, error: data.error || 'Server error. Please try again.' };
      }
      if (!data.success) {
        return { success: false, error: data.error || 'Registration failed.' };
      }

      localStorage.setItem(SESSION_KEY, JSON.stringify(data.user));
      setUser(data.user);
      return { success: true };
    } catch {
      return { success: false, error: 'Cannot reach the server. Make sure the app server is running.' };
    }
  }

  async function login({ email, password }) {
    try {
      const res = await fetch(`${API}/customers.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email, password }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 429) {
        return { success: false, error: data.error || 'Too many login attempts. Please wait a few minutes.' };
      }
      if (!res.ok && !data.success) {
        return { success: false, error: data.error || 'Server error. Please try again.' };
      }
      if (!data.success) {
        return { success: false, error: data.error || 'Login failed.' };
      }

      localStorage.setItem(SESSION_KEY, JSON.stringify(data.user));
      setUser(data.user);
      return { success: true };
    } catch {
      return { success: false, error: 'Cannot reach the server. Make sure the app server is running.' };
    }
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  }

  async function updateUser(fields) {
    if (!user) return;

    // Optimistically update local state first
    const updated = { ...user, ...fields };
    localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
    setUser(updated);

    try {
      const res  = await fetch(`${API}/customers.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, ...fields }),
      });
      const data = await res.json();

      // Sync state from what the DB actually confirmed was saved
      if (data?.success && data?.user) {
        const confirmed = { ...updated, ...data.user };
        localStorage.setItem(SESSION_KEY, JSON.stringify(confirmed));
        setUser(confirmed);
      }
    } catch {
      // Network failure — local session still updated optimistically
    }
  }

  async function addPoints(pts) {
    if (!user) return;
    const newPoints = (user.points || 0) + pts;
    let newTier = 'Bronze';
    if (newPoints >= 1500) newTier = 'Gold';
    else if (newPoints >= 500) newTier = 'Silver';

    await updateUser({ points: newPoints, tier: newTier });
  }

  // Re-fetch points from DB when an order is completed
  useEffect(() => {
    async function refreshPoints() {
      if (!user?.id) return;
      try {
        const res = await fetch(`${API}/customers.php?id=${user.id}`);
        const data = await res.json();
        if (data?.points !== undefined) {
          const updated = { ...user, points: data.points, tier: data.tier };
          localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
          setUser(updated);
        }
      } catch {}
    }
    window.addEventListener('jazsam_points_updated', refreshPoints);
    return () => window.removeEventListener('jazsam_points_updated', refreshPoints);
  }, [user?.id]);

  async function redeemPoints(pts) {
    if (!user || (user.points || 0) < pts) return false;
    const newPoints = (user.points || 0) - pts;
    let newTier = 'Bronze';
    if (newPoints >= 1500) newTier = 'Gold';
    else if (newPoints >= 500) newTier = 'Silver';
    // Update local session immediately
    const updated = { ...user, points: newPoints, tier: newTier };
    localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
    setUser(updated);
    // Persist to DB using resetPoints flag with the computed new value
    try {
      await fetch(`${API}/customers.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, redeemPoints: pts }),
      });
    } catch {}
    return true;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, register, updateUser, addPoints, redeemPoints }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
