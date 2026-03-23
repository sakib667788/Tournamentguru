import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { useEffect, useRef } from 'react';
import { requestNotificationPermission, onForegroundMessage } from './utils/firebase';
import { playNotificationSound } from './utils/sound';
import API from './utils/api';
import toast from 'react-hot-toast';
import './index.css';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Matches from './pages/Matches';
import MatchDetail from './pages/MatchDetail';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import AddMoney from './pages/AddMoney';
import Withdraw from './pages/Withdraw';
import Transactions from './pages/Transactions';
import TopPlayers from './pages/TopPlayers';
import MatchHistory from './pages/MatchHistory';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCategories from './pages/admin/AdminCategories';
import AdminMatches from './pages/admin/AdminMatches';
import AdminMatchForm from './pages/admin/AdminMatchForm';
import AdminMatchDetail from './pages/admin/AdminMatchDetail';
import AdminAddMoney from './pages/admin/AdminAddMoney';
import AdminWithdraw from './pages/admin/AdminWithdraw';
import AdminUsers from './pages/admin/AdminUsers';
import AdminUserDetail from './pages/admin/AdminUserDetail';
import AdminSliders from './pages/admin/AdminSliders';
import AdminNotifications from './pages/admin/AdminNotifications';
import AdminSettings from './pages/admin/AdminSettings';
import AdminSubAdmins from './pages/admin/AdminSubAdmins';

// SubAdmin Pages
import SubAdminMatches from './pages/subadmin/SubAdminMatches';
import SubAdminMatchForm from './pages/subadmin/SubAdminMatchForm';
import SubAdminMatchDetail from './pages/subadmin/SubAdminMatchDetail';
import SubAdminNotifications from './pages/subadmin/SubAdminNotifications';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loader"><div className="spinner"/></div>;
  if (!user) return <Navigate to="/login" />;
  if (user.role === 'subadmin') return <Navigate to="/subadmin/matches" />;
  if (user.role === 'admin') return <Navigate to="/admin" />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loader"><div className="spinner"/></div>;
  if (!user) return <Navigate to="/login" />;
  if (user.role !== 'admin') return <Navigate to="/" />;
  return children;
};

const SubAdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loader"><div className="spinner"/></div>;
  if (!user) return <Navigate to="/login" />;
  if (user.role !== 'subadmin') return <Navigate to="/" />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loader"><div className="spinner"/></div>;
  if (user) {
    if (user.role === 'admin') return <Navigate to="/admin" />;
    if (user.role === 'subadmin') return <Navigate to="/subadmin/matches" />;
    return <Navigate to="/" />;
  }
  return children;
};

function AppRoutes() {
  const { user } = useAuth();
  const lastUnreadCount = useRef(0);
  const isFirstCheck = useRef(true);

  useEffect(() => {
    if (!user) return;
    const setupFCM = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const token = await requestNotificationPermission();
        if (token) {
          await API.post('/notifications/fcm-token', { token });
        }
      } catch (err) {}
    };
    setupFCM();

    const unsubscribe = onForegroundMessage((payload) => {
      const title = payload.notification?.title || 'Tournament Guru';
      const body = payload.notification?.body || '';
      playNotificationSound();
      toast(
        <div>
          <strong style={{ display: 'block', marginBottom: '4px' }}>🔔 {title}</strong>
          <span style={{ fontSize: '13px' }}>{body}</span>
        </div>,
        { duration: 6000 }
      );
    });

    return () => { if (unsubscribe) unsubscribe(); };
  }, [user?._id]);

  useEffect(() => {
    if (!user) return;
    const checkUnread = async () => {
      try {
        const res = await API.get('/notifications/unread-count');
        const count = res.data.count || 0;
        if (isFirstCheck.current) {
          if (count > 0) setTimeout(() => playNotificationSound(), 800);
          lastUnreadCount.current = count;
          isFirstCheck.current = false;
        } else {
          if (count > lastUnreadCount.current) {
            playNotificationSound();
            toast('🔔 নতুন notification আছে!', { duration: 3000 });
          }
          lastUnreadCount.current = count;
        }
      } catch {}
    };
    checkUnread();
    const interval = setInterval(checkUnread, 30000);
    return () => clearInterval(interval);
  }, [user?._id]);

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      {/* User */}
      <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/matches/:game" element={<ProtectedRoute><Matches /></ProtectedRoute>} />
      <Route path="/match/:id" element={<ProtectedRoute><MatchDetail /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
      <Route path="/add-money" element={<ProtectedRoute><AddMoney /></ProtectedRoute>} />
      <Route path="/withdraw" element={<ProtectedRoute><Withdraw /></ProtectedRoute>} />
      <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
      <Route path="/top-players" element={<ProtectedRoute><TopPlayers /></ProtectedRoute>} />
      <Route path="/match-history" element={<ProtectedRoute><MatchHistory /></ProtectedRoute>} />

      {/* Admin */}
      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/categories" element={<AdminRoute><AdminCategories /></AdminRoute>} />
      <Route path="/admin/matches" element={<AdminRoute><AdminMatches /></AdminRoute>} />
      <Route path="/admin/matches/new" element={<AdminRoute><AdminMatchForm /></AdminRoute>} />
      <Route path="/admin/matches/:id/edit" element={<AdminRoute><AdminMatchForm /></AdminRoute>} />
      <Route path="/admin/matches/:id" element={<AdminRoute><AdminMatchDetail /></AdminRoute>} />
      <Route path="/admin/addmoney" element={<AdminRoute><AdminAddMoney /></AdminRoute>} />
      <Route path="/admin/withdraw" element={<AdminRoute><AdminWithdraw /></AdminRoute>} />
      <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
      <Route path="/admin/users/:id" element={<AdminRoute><AdminUserDetail /></AdminRoute>} />
      <Route path="/admin/sliders" element={<AdminRoute><AdminSliders /></AdminRoute>} />
      <Route path="/admin/notifications" element={<AdminRoute><AdminNotifications /></AdminRoute>} />
      <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
      <Route path="/admin/subadmins" element={<AdminRoute><AdminSubAdmins /></AdminRoute>} />

      {/* SubAdmin */}
      <Route path="/subadmin/matches" element={<SubAdminRoute><SubAdminMatches /></SubAdminRoute>} />
      <Route path="/subadmin/matches/new" element={<SubAdminRoute><SubAdminMatchForm /></SubAdminRoute>} />
      <Route path="/subadmin/matches/:id/edit" element={<SubAdminRoute><SubAdminMatchForm /></SubAdminRoute>} />
      <Route path="/subadmin/matches/:id" element={<SubAdminRoute><SubAdminMatchDetail /></SubAdminRoute>} />
      <Route path="/subadmin/notifications" element={<SubAdminRoute><SubAdminNotifications /></SubAdminRoute>} />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: '#1a1a35',
                color: '#fff',
                border: '1px solid rgba(124,58,237,0.3)',
                fontFamily: 'Hind Siliguri, sans-serif',
                fontSize: '14px',
              },
              success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
            }}
          />
        </BrowserRouter>
      </SettingsProvider>
    </AuthProvider>
  );
}
