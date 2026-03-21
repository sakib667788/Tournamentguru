import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import API from '../utils/api';
import toast from 'react-hot-toast';
import { FaArrowLeft, FaCheckCircle, FaWallet, FaTrophy } from 'react-icons/fa';

const METHODS = [
  { id: 'bkash', label: 'bKash', color: '#e2136e', emoji: '💳' },
  { id: 'nagad', label: 'Nagad', color: '#f7941d', emoji: '💰' },
  { id: 'rocket', label: 'Rocket', color: '#8b1fa9', emoji: '🚀' },
];

export default function Withdraw() {
  const [method, setMethod] = useState('bkash');
  const [amount, setAmount] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { user, refreshUser } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    const amt = parseInt(amount);
    if (!amt || amt < (settings.minWithdraw || 50))
      return toast.error(`সর্বনিম্ন ${settings.minWithdraw || 50} টাকা উত্তোলন করুন`);
    if (amt > (user?.winningBalance || 0))
      return toast.error('পর্যাপ্ত Winning Balance নেই');
    if (!accountNumber.trim()) return toast.error('আপনার নম্বর দিন');
    setLoading(true);
    try {
      await API.post('/wallet/withdraw', { amount: amt, paymentMethod: method, accountNumber });
      await refreshUser();
      setSuccess(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'উত্তোলন ব্যর্থ হয়েছে');
    } finally { setLoading(false); }
  };

  if (success) return (
    <div className="pb-nav">
      <TopBar/>
      <div style={{padding:'40px 24px', textAlign:'center'}}>
        <FaCheckCircle size={60} color="var(--accent2)" style={{marginBottom:'16px'}}/>
        <h2 style={{fontFamily:'Rajdhani', fontSize:'22px', marginBottom:'8px'}}>অনুরোধ পাঠানো হয়েছে!</h2>
        <p style={{color:'var(--text-secondary)', fontSize:'14px', marginBottom:'24px'}}>
          Admin অনুমোদন করলে আপনার {method.toUpperCase()} নম্বরে টাকা পাঠানো হবে।
        </p>
        <button className="btn-primary" onClick={() => navigate('/')}>হোমে ফিরুন</button>
      </div>
      <Navbar/>
    </div>
  );

  return (
    <div className="pb-nav animate-fade">
      <TopBar/>
      <div style={{padding:'16px'}}>
        <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'20px'}}>
          <button onClick={() => navigate(-1)} style={{background:'#ffffff', border:'1.5px solid var(--border)', borderRadius:'8px', padding:'8px 10px', color:'var(--text-primary)', cursor:'pointer'}}>
            <FaArrowLeft size={14}/>
          </button>
          <h2 style={{fontFamily:'Rajdhani', fontSize:'20px', fontWeight:700, color:'var(--text-primary)'}}>Withdraw</h2>
        </div>

        {/* Balance info — দুটো balance দেখাবে */}
        <div style={{background:'#ffffff', border:'1.5px solid var(--border)', borderRadius:12, padding:'14px', marginBottom:'16px', boxShadow:'0 2px 8px rgba(37,99,235,0.08)'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px'}}>
            <div style={{display:'flex', alignItems:'center', gap:'6px'}}>
              <FaWallet size={13} color="var(--purple)"/>
              <span style={{color:'var(--text-secondary)', fontSize:'13px'}}>Gaming Balance</span>
            </div>
            <strong style={{color:'var(--purple)', fontFamily:'Rajdhani', fontSize:'18px'}}>৳{user?.gamingBalance || 0}</strong>
          </div>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:'10px', borderTop:'1px solid var(--border-light)'}}>
            <div style={{display:'flex', alignItems:'center', gap:'6px'}}>
              <FaTrophy size={13} color="#10b981"/>
              <span style={{color:'var(--text-secondary)', fontSize:'13px'}}>Winning Balance</span>
            </div>
            <strong style={{color:'#10b981', fontFamily:'Rajdhani', fontSize:'18px'}}>৳{user?.winningBalance || 0}</strong>
          </div>
          <div style={{marginTop:'10px', padding:'8px 10px', background:'rgba(37,99,235,0.06)', borderRadius:8, border:'1px solid var(--border-light)'}}>
            <p style={{fontSize:'12px', color:'var(--purple)', fontWeight:600}}>
              ⚠️ শুধুমাত্র Winning Balance থেকে Withdraw করা যাবে।
            </p>
            <p style={{fontSize:'11px', color:'var(--text-muted)', marginTop:'2px'}}>
              Gaming Balance Withdraw করতে পারবেন না। Gaming Balance দিয়ে শুধু Match এ join করা যাবে।
            </p>
          </div>
        </div>

        {/* Method */}
        <p style={{fontSize:'14px', color:'var(--text-secondary)', marginBottom:'10px', fontWeight:600}}>Payment Method:</p>
        <div style={{display:'flex', gap:'10px', marginBottom:'16px'}}>
          {METHODS.map(m => (
            <button key={m.id} onClick={() => setMethod(m.id)} style={{
              flex:1, padding:'12px 8px', borderRadius:10, border:'2px solid',
              borderColor: method === m.id ? m.color : 'var(--border)',
              background: method === m.id ? `${m.color}15` : '#ffffff',
              color: method === m.id ? m.color : 'var(--text-secondary)',
              cursor:'pointer', fontWeight:700, fontSize:'13px',
              fontFamily:'Hind Siliguri, sans-serif', transition:'all 0.2s'
            }}>
              {m.emoji} {m.label}
            </button>
          ))}
        </div>

        <div style={{display:'flex', flexDirection:'column', gap:'12px', marginBottom:'16px'}}>
          <input className="input-field" type="number" placeholder={`পরিমাণ (সর্বনিম্ন ${settings.minWithdraw || 50} টাকা)`}
            value={amount} onChange={e => setAmount(e.target.value)}/>
          <input className="input-field" type="tel" placeholder={`${METHODS.find(m=>m.id===method)?.label} নম্বর`}
            value={accountNumber} onChange={e => setAccountNumber(e.target.value)}/>
        </div>

        <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? '⏳ পাঠানো হচ্ছে...' : '💸 Withdraw করুন'}
        </button>
      </div>
      <Navbar/>
    </div>
  );
}
