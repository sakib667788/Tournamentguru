import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import toast from 'react-hot-toast';
import { FaPlusCircle, FaMoneyBillWave, FaTrophy, FaHistory, FaCode, FaSignOutAlt, FaEdit, FaCopy, FaChevronRight, FaExchangeAlt } from 'react-icons/fa';
import './Profile.css';

export default function Profile() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [editName, setEditName] = useState(false);
  const [newName, setNewName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferring, setTransferring] = useState(false);

  const handleSaveName = async () => {
    setSaving(true);
    try {
      await API.put('/users/profile', { name: newName });
      await refreshUser();
      toast.success('নাম আপডেট হয়েছে');
      setEditName(false);
    } catch { toast.error('আপডেট ব্যর্থ হয়েছে'); }
    finally { setSaving(false); }
  };

  const handleTransfer = async () => {
    if (!transferAmount || parseInt(transferAmount) < 1)
      return toast.error('সর্বনিম্ন ১ টাকা দিন');
    setTransferring(true);
    try {
      await API.post('/wallet/transfer', { amount: parseInt(transferAmount) });
      toast.success(`${transferAmount} টাকা Gaming Balance এ transfer হয়েছে!`);
      setTransferAmount('');
      setShowTransfer(false);
      await refreshUser();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Transfer ব্যর্থ হয়েছে');
    } finally { setTransferring(false); }
  };

  const copyPromo = () => {
    navigator.clipboard.writeText(user?.promoCode || '');
    toast.success('কপি হয়েছে!');
  };

  const menuItems = [
    { icon: <FaPlusCircle/>, label: 'Add Money', color: '#10b981', action: () => navigate('/add-money') },
    { icon: <FaMoneyBillWave/>, label: 'Withdraw', color: '#f59e0b', action: () => navigate('/withdraw') },
    { icon: <FaExchangeAlt/>, label: 'Balance Transfer', color: '#3b82f6', action: () => setShowTransfer(true) },
    { icon: <FaTrophy/>, label: 'Top Player', color: '#a78bfa', action: () => navigate('/top-players') },
    { icon: <FaHistory/>, label: 'Transactions', color: '#60a5fa', action: () => navigate('/transactions') },
    { icon: <FaCode/>, label: 'Developer', color: '#f472b6', action: () => window.open('https://t.me/najmussalehinsakib', '_blank') },
    { icon: <FaSignOutAlt/>, label: 'Logout', color: '#ef4444', action: () => { logout(); navigate('/login'); } },
  ];

  return (
    <div className="pb-nav animate-fade">
      <TopBar/>
      <div className="profile-page">
        <div className="profile-card">
          <div className="profile-avatar">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="profile-info">
            {editName ? (
              <div style={{display:'flex', gap:'6px', alignItems:'center'}}>
                <input className="input-field" style={{padding:'6px 10px', fontSize:'14px'}}
                  value={newName} onChange={e => setNewName(e.target.value)}/>
                <button className="btn-success" onClick={handleSaveName} disabled={saving}>✓</button>
                <button className="btn-danger" onClick={() => setEditName(false)}>✗</button>
              </div>
            ) : (
              <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                <h2 style={{fontSize:'18px', fontWeight:700}}>{user?.name}</h2>
                <button onClick={() => setEditName(true)} style={{background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer'}}>
                  <FaEdit size={14}/>
                </button>
              </div>
            )}
            <div style={{display:'flex', alignItems:'center', gap:'6px', marginTop:'4px'}}>
              <span style={{fontSize:'12px', color:'var(--text-secondary)'}}>Promo: {user?.promoCode}</span>
              <button onClick={copyPromo} style={{background:'none', border:'none', color:'var(--purple-light)', cursor:'pointer', padding:'2px'}}>
                <FaCopy size={11}/>
              </button>
            </div>
          </div>
        </div>

        <div className="balance-grid">
          <div className="balance-card">
            <span>Gaming Balance</span>
            <strong>৳{user?.gamingBalance || 0}</strong>
          </div>
          <div className="balance-card">
            <span>Winning Balance</span>
            <strong style={{color:'var(--accent2)'}}>৳{user?.winningBalance || 0}</strong>
          </div>
          <div className="balance-card">
            <span>Total Win</span>
            <strong style={{color:'var(--accent)'}}>৳{user?.totalWin || 0}</strong>
          </div>
          <div className="balance-card">
            <span>Total Kills</span>
            <strong style={{color:'var(--danger)'}}>{user?.totalKills || 0}</strong>
          </div>
        </div>

        <div className="profile-menu">
          {menuItems.map((item, i) => (
            <button key={i} className="menu-item" onClick={item.action}>
              <span className="menu-icon" style={{color: item.color}}>{item.icon}</span>
              <span className="menu-label">{item.label}</span>
              <FaChevronRight size={12} color="var(--text-muted)"/>
            </button>
          ))}
        </div>
      </div>

      {/* Transfer Modal */}
      {showTransfer && (
        <div className="modal-overlay" onClick={() => setShowTransfer(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-handle"/>
            <h3 style={{marginBottom:'6px', fontFamily:'Rajdhani', fontSize:'20px'}}>Balance Transfer</h3>
            <p style={{fontSize:'13px', color:'var(--text-secondary)', marginBottom:'16px'}}>
              Winning Balance: <strong style={{color:'var(--accent2)'}}>৳{user?.winningBalance || 0}</strong>
            </p>
            <input
              className="input-field"
              type="number"
              placeholder="কত টাকা transfer করবেন?"
              value={transferAmount}
              onChange={e => setTransferAmount(e.target.value)}
              style={{marginBottom:'14px'}}
            />
            <p style={{fontSize:'12px', color:'var(--text-muted)', marginBottom:'14px'}}>
              ⚡ Winning Balance → Gaming Balance এ যাবে
            </p>
            <div style={{display:'flex', gap:'10px'}}>
              <button className="btn-secondary" style={{flex:1}} onClick={() => setShowTransfer(false)}>বাতিল</button>
              <button className="btn-primary" style={{flex:1}} onClick={handleTransfer} disabled={transferring}>
                {transferring ? '⏳...' : '✅ Transfer করুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Navbar/>
    </div>
  );
}
