import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import API from '../../utils/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { FaArrowLeft, FaSave, FaPhone, FaLock, FaFacebook, FaYoutube, FaTelegram } from 'react-icons/fa';

const TX_COLOR = {
  addmoney: '#10b981', prize: '#10b981', refund: '#10b981', transfer: '#3b82f6',
  withdraw: '#ef4444', match_fee: '#f59e0b', admin_adjust: '#8b5cf6'
};

export default function AdminUserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [txs, setTxs] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gaming, setGaming] = useState('');
  const [winning, setWinning] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [showCredentials, setShowCredentials] = useState(false);

  useEffect(() => {
    Promise.all([
      API.get(`/admin/users/${id}`),
      API.get(`/wallet/transactions/user/${id}`).catch(() => ({ data: [] })),
    ]).then(([userRes, txRes]) => {
      setUser(userRes.data);
      setGaming(userRes.data.gamingBalance);
      setWinning(userRes.data.winningBalance);
      setTxs(txRes.data || []);
    }).catch(() => toast.error('User not found'))
    .finally(() => setLoading(false));
  }, [id]);

  const saveBalance = async () => {
    setSaving(true);
    try {
      const res = await API.put(`/admin/users/${id}/balance`, {
        gamingBalance: parseFloat(gaming), winningBalance: parseFloat(winning), note
      });
      setUser(res.data.user);
      toast.success('Balance updated!');
      setNote('');
    } catch { toast.error('Error'); }
    finally { setSaving(false); }
  };

  const toggleStatus = async () => {
    try {
      const res = await API.put(`/admin/users/${id}/status`, { isActive: !user.isActive });
      setUser(res.data);
      toast.success(res.data.isActive ? 'Account সক্রিয় করা হয়েছে' : 'Account স্থগিত করা হয়েছে');
    } catch { toast.error('Error'); }
  };

  if (loading) return <div className="page-loader"><div className="spinner"/></div>;
  if (!user) return null;

  const deposits = txs.filter(t => t.type === 'addmoney');
  const withdrawals = txs.filter(t => t.type === 'withdraw');

  const tabs = [
    { key: 'info', label: 'তথ্য' },
    { key: 'balance', label: 'Balance' },
    { key: 'deposit', label: 'Deposit' },
    { key: 'withdraw', label: 'Withdraw' },
    { key: 'transactions', label: 'সব Transactions' },
    { key: 'credentials', label: 'Credentials' },
  ];

  return (
    <AdminLayout title="User Details">
      <button onClick={() => navigate('/admin/users')} style={{display:'flex', alignItems:'center', gap:'6px', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:8, padding:'8px 12px', color:'var(--text-primary)', cursor:'pointer', fontSize:'13px', marginBottom:'16px'}}>
        <FaArrowLeft size={12}/> Users
      </button>

      {/* User Profile Card */}
      <div style={{background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:12, padding:'16px', marginBottom:'14px'}}>
        <div style={{display:'flex', alignItems:'center', gap:'12px', marginBottom:'12px'}}>
          <div style={{width:52, height:52, borderRadius:'50%', background:'linear-gradient(135deg, var(--purple), var(--purple-dark))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', fontWeight:700, color:'white', flexShrink:0}}>
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div style={{flex:1}}>
            <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
              <h3 style={{fontFamily:'Rajdhani', fontSize:'18px', fontWeight:700}}>{user.name}</h3>
              <span style={{fontSize:'10px', padding:'2px 8px', borderRadius:20, fontWeight:700,
                background: user.isActive ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                color: user.isActive ? 'var(--accent2)' : 'var(--danger)'
              }}>{user.isActive ? 'Active' : 'Suspended'}</span>
            </div>
            <p style={{fontSize:'13px', color:'var(--text-secondary)'}}>{user.phone}</p>
            <p style={{fontSize:'11px', color:'var(--text-muted)'}}>Promo: {user.promoCode} • Joined: {format(new Date(user.createdAt), 'dd/MM/yyyy')}</p>
          </div>
          <button onClick={toggleStatus} className={user.isActive ? 'btn-danger' : 'btn-success'} style={{fontSize:'11px', padding:'6px 10px'}}>
            {user.isActive ? 'Suspend' : 'Activate'}
          </button>
        </div>

        {/* Stats */}
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:'8px'}}>
          {[
            { label: 'Gaming', value: `৳${user.gamingBalance}`, color: 'var(--purple-light)' },
            { label: 'Winning', value: `৳${user.winningBalance}`, color: 'var(--accent2)' },
            { label: 'Total Win', value: `৳${user.totalWin}`, color: 'var(--accent)' },
            { label: 'Kills', value: user.totalKills, color: 'var(--danger)' },
          ].map((s, i) => (
            <div key={i} style={{background:'var(--bg-card2)', borderRadius:8, padding:'8px', textAlign:'center'}}>
              <div style={{fontSize:'10px', color:'var(--text-secondary)'}}>{s.label}</div>
              <div style={{fontFamily:'Rajdhani', fontSize:'15px', fontWeight:700, color: s.color}}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:'flex', gap:'6px', flexWrap:'wrap', marginBottom:'14px'}}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
            padding:'6px 12px', borderRadius:20, border:'none', cursor:'pointer', fontSize:'12px', fontWeight:600,
            background: activeTab === t.key ? 'var(--purple)' : 'var(--bg-card)',
            color: activeTab === t.key ? 'white' : 'var(--text-secondary)',
            fontFamily:'Hind Siliguri, sans-serif'
          }}>{t.label}</button>
        ))}
      </div>

      {/* Tab: Info */}
      {activeTab === 'info' && (
        <div style={{background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, padding:'16px'}}>
          <h3 style={{fontFamily:'Rajdhani', fontSize:'15px', fontWeight:700, marginBottom:'12px'}}>🎮 In-Game Names</h3>
          {user.inGameNames?.length > 0
            ? user.inGameNames.map((n, i) => (
                <p key={i} style={{fontSize:'14px', padding:'6px 0', borderBottom:'1px solid var(--border-light)'}}>{i+1}. {n}</p>
              ))
            : <p style={{color:'var(--text-muted)', fontSize:'13px'}}>কোনো in-game name নেই</p>
          }

          <h3 style={{fontFamily:'Rajdhani', fontSize:'15px', fontWeight:700, margin:'14px 0 10px'}}>🔗 Social Links</h3>
          {user.socialLinks?.facebook && (
            <p style={{fontSize:'13px', display:'flex', alignItems:'center', gap:'6px', marginBottom:'6px'}}>
              <FaFacebook color="#1877f2"/> <a href={user.socialLinks.facebook} target="_blank" rel="noreferrer" style={{color:'var(--purple-light)'}}>{user.socialLinks.facebook}</a>
            </p>
          )}
          {user.socialLinks?.youtube && (
            <p style={{fontSize:'13px', display:'flex', alignItems:'center', gap:'6px', marginBottom:'6px'}}>
              <FaYoutube color="#ff0000"/> <a href={user.socialLinks.youtube} target="_blank" rel="noreferrer" style={{color:'var(--purple-light)'}}>{user.socialLinks.youtube}</a>
            </p>
          )}
          {user.socialLinks?.telegram && (
            <p style={{fontSize:'13px', display:'flex', alignItems:'center', gap:'6px'}}>
              <FaTelegram color="#0088cc"/> <a href={user.socialLinks.telegram} target="_blank" rel="noreferrer" style={{color:'var(--purple-light)'}}>{user.socialLinks.telegram}</a>
            </p>
          )}
          {!user.socialLinks?.facebook && !user.socialLinks?.youtube && !user.socialLinks?.telegram && (
            <p style={{color:'var(--text-muted)', fontSize:'13px'}}>কোনো social link নেই</p>
          )}
        </div>
      )}

      {/* Tab: Balance Edit */}
      {activeTab === 'balance' && (
        <div style={{background:'var(--bg-card)', border:'1px solid rgba(124,58,237,0.3)', borderRadius:10, padding:'16px'}}>
          <h3 style={{fontFamily:'Rajdhani', fontSize:'16px', fontWeight:700, marginBottom:'12px', color:'var(--purple-light)'}}>⚙️ Balance Edit</h3>
          <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
            <div>
              <label style={{fontSize:'12px', color:'var(--text-secondary)', display:'block', marginBottom:'4px'}}>Gaming Balance (৳)</label>
              <input className="input-field" type="number" value={gaming} onChange={e => setGaming(e.target.value)}/>
            </div>
            <div>
              <label style={{fontSize:'12px', color:'var(--text-secondary)', display:'block', marginBottom:'4px'}}>Winning Balance (৳)</label>
              <input className="input-field" type="number" value={winning} onChange={e => setWinning(e.target.value)}/>
            </div>
            <div>
              <label style={{fontSize:'12px', color:'var(--text-secondary)', display:'block', marginBottom:'4px'}}>Note</label>
              <input className="input-field" placeholder="কারণ লিখুন..." value={note} onChange={e => setNote(e.target.value)}/>
            </div>
            <button className="btn-primary" onClick={saveBalance} disabled={saving}>
              <FaSave size={12}/> {saving ? 'Saving...' : 'Balance Save করুন'}
            </button>
          </div>
        </div>
      )}

      {/* Tab: Deposit History */}
      {activeTab === 'deposit' && (
        <div style={{background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, padding:'16px'}}>
          <h3 style={{fontFamily:'Rajdhani', fontSize:'16px', fontWeight:700, marginBottom:'12px'}}>💚 Deposit History ({deposits.length})</h3>
          {deposits.length === 0 ? <p style={{color:'var(--text-muted)', fontSize:'13px'}}>কোনো deposit নেই</p>
          : deposits.map(tx => (
            <div key={tx._id} style={{display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid var(--border-light)', fontSize:'13px'}}>
              <div>
                <p style={{fontWeight:600}}>{tx.paymentMethod?.toUpperCase()} — {tx.transactionId || '-'}</p>
                <p style={{fontSize:'11px', color:'var(--text-muted)'}}>{format(new Date(tx.createdAt), 'dd/MM/yyyy HH:mm')}</p>
              </div>
              <div style={{textAlign:'right'}}>
                <p style={{fontFamily:'Rajdhani', fontWeight:700, color:'var(--accent2)'}}>+{tx.amount}৳</p>
                <p style={{fontSize:'11px', color: tx.status==='approved'?'var(--accent2)':tx.status==='pending'?'var(--accent)':'var(--danger)'}}>{tx.status}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Withdraw History */}
      {activeTab === 'withdraw' && (
        <div style={{background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, padding:'16px'}}>
          <h3 style={{fontFamily:'Rajdhani', fontSize:'16px', fontWeight:700, marginBottom:'12px'}}>💸 Withdraw History ({withdrawals.length})</h3>
          {withdrawals.length === 0 ? <p style={{color:'var(--text-muted)', fontSize:'13px'}}>কোনো withdrawal নেই</p>
          : withdrawals.map(tx => (
            <div key={tx._id} style={{display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid var(--border-light)', fontSize:'13px'}}>
              <div>
                <p style={{fontWeight:600}}>{tx.paymentMethod?.toUpperCase()} — {tx.accountNumber || '-'}</p>
                <p style={{fontSize:'11px', color:'var(--text-muted)'}}>{format(new Date(tx.createdAt), 'dd/MM/yyyy HH:mm')}</p>
              </div>
              <div style={{textAlign:'right'}}>
                <p style={{fontFamily:'Rajdhani', fontWeight:700, color:'var(--danger)'}}>-{tx.amount}৳</p>
                <p style={{fontSize:'11px', color: tx.status==='approved'?'var(--accent2)':tx.status==='pending'?'var(--accent)':'var(--danger)'}}>{tx.status}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: All Transactions */}
      {activeTab === 'transactions' && (
        <div style={{background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, padding:'16px'}}>
          <h3 style={{fontFamily:'Rajdhani', fontSize:'16px', fontWeight:700, marginBottom:'12px'}}>📋 সব Transactions ({txs.length})</h3>
          {txs.length === 0 ? <p style={{color:'var(--text-muted)', fontSize:'13px'}}>কোনো transaction নেই</p>
          : txs.map(tx => (
            <div key={tx._id} style={{display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--border-light)', fontSize:'13px'}}>
              <div>
                <p style={{fontWeight:600, color: TX_COLOR[tx.type] || 'var(--text-primary)'}}>{tx.type}</p>
                {tx.note && <p style={{fontSize:'11px', color:'var(--text-muted)', marginTop:'2px'}}>{tx.note}</p>}
                <p style={{fontSize:'11px', color:'var(--text-muted)'}}>{format(new Date(tx.createdAt), 'dd/MM/yyyy HH:mm')}</p>
              </div>
              <div style={{textAlign:'right'}}>
                <p style={{fontFamily:'Rajdhani', fontWeight:700, color: TX_COLOR[tx.type]}}>{tx.amount}৳</p>
                <p style={{fontSize:'10px', color: tx.status==='approved'?'var(--accent2)':'var(--accent)'}}>{tx.status}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Credentials */}
      {activeTab === 'credentials' && (
        <div style={{background:'var(--bg-card)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:10, padding:'16px'}}>
          <h3 style={{fontFamily:'Rajdhani', fontSize:'16px', fontWeight:700, marginBottom:'12px', color:'var(--danger)'}}>🔐 Credentials</h3>
          <div style={{display:'flex', alignItems:'center', gap:'10px', padding:'12px', background:'var(--bg-card2)', borderRadius:8, marginBottom:'10px'}}>
            <FaPhone color="var(--accent2)"/>
            <div>
              <p style={{fontSize:'11px', color:'var(--text-muted)'}}>Phone Number</p>
              <p style={{fontSize:'15px', fontWeight:700, fontFamily:'Rajdhani'}}>{user.phone}</p>
            </div>
          </div>
          {!showCredentials ? (
            <button className="btn-danger" style={{width:'100%'}} onClick={() => setShowCredentials(true)}>
              ⚠️ Password দেখুন (সতর্কতার সাথে ব্যবহার করুন)
            </button>
          ) : (
            <div style={{padding:'12px', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8}}>
              <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px'}}>
                <FaLock color="var(--danger)"/>
                <div>
                  <p style={{fontSize:'11px', color:'var(--text-muted)'}}>Password Hash</p>
                  <p style={{fontSize:'11px', fontFamily:'monospace', color:'var(--text-secondary)', wordBreak:'break-all'}}>{user.password}</p>
                </div>
              </div>
              <p style={{fontSize:'11px', color:'var(--danger)'}}>⚠️ এটা encrypted password। Original password দেখা সম্ভব নয়।</p>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
