import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import Navbar from '../components/Navbar';
import CountdownTimer from '../components/CountdownTimer';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import toast from 'react-hot-toast';
import { FaArrowLeft, FaMap, FaUsers, FaTrophy, FaSkull, FaLock, FaCamera } from 'react-icons/fa';
import { format } from 'date-fns';
import './MatchDetail.css';

const SLOT_COUNT = { Solo: 1, Duo: 2, Squad: 4 };

export default function MatchDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [screenshot, setScreenshot] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedType, setSelectedType] = useState('Solo');
  const [playerNames, setPlayerNames] = useState(['', '', '', '']);

  const fetchMatch = () => {
    API.get(`/matches/${id}`)
      .then(res => {
        setMatch(res.data);
        // Auto-select first enabled type
        const enabled = ['Solo', 'Duo', 'Squad'].find(t => res.data.enabledTypes?.[t]);
        if (enabled) setSelectedType(enabled);
      })
      .catch(() => toast.error('ম্যাচ পাওয়া যায়নি'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchMatch(); }, [id]);

  // Autofill player names from user profile
  useEffect(() => {
    if (user?.inGameNames?.length > 0) {
      const filled = ['', '', '', ''].map((_, i) => user.inGameNames[i] || '');
      setPlayerNames(filled);
    }
  }, [user]);

  const isJoined = match?.players?.some(p => {
    const pid = p.user?._id || p.user;
    return pid?.toString() === user?._id?.toString();
  });

  const myPlayer = match?.players?.find(p => {
    const pid = p.user?._id || p.user;
    return pid?.toString() === user?._id?.toString();
  });

  const usedSlots = match?.players?.reduce((sum, p) => sum + (p.slots || 1), 0) || 0;
  const slotsNeeded = SLOT_COUNT[selectedType] || 1;
  const isFull = usedSlots + slotsNeeded > (match?.maxSlots || 0);

  const selectedFee = match?.entryFees?.[selectedType] || 0;

  const handleJoin = async () => {
    const required = SLOT_COUNT[selectedType] || 1;
    const names = playerNames.slice(0, required);
    if (names.some(n => !n.trim())) return toast.error(`${required} জন player এর in-game নাম দিন`);
    setJoining(true);
    try {
      await API.post(`/matches/${id}/join`, {
        entryType: selectedType,
        playerNames: names.map(n => n.trim())
      });
      toast.success('সফলভাবে ম্যাচে যোগ দিয়েছেন! 🎮');
      refreshUser();
      fetchMatch();
      setShowConfirm(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'যোগ দিতে ব্যর্থ হয়েছে');
    } finally { setJoining(false); }
  };

  const handleSubmitResult = async () => {
    if (!screenshot) return toast.error('Screenshot সিলেক্ট করুন');
    setUploading(true);
    const formData = new FormData();
    formData.append('screenshot', screenshot);
    try {
      await API.post(`/matches/${id}/result`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Screenshot জমা দেওয়া হয়েছে!');
      fetchMatch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'আপলোড ব্যর্থ হয়েছে');
    } finally { setUploading(false); }
  };

  if (loading) return <div className="page-loader"><div className="spinner"/></div>;
  if (!match) return null;

  const enabledTypes = Object.entries(match.enabledTypes || { Solo: true, Duo: true, Squad: true })
    .filter(([, enabled]) => enabled)
    .map(([type]) => type);

  return (
    <div className="pb-nav animate-fade">
      <TopBar/>
      <div className="match-detail-page">
        {/* Header */}
        <div className="match-detail-header">
          <button className="back-btn" onClick={() => navigate(-1)}><FaArrowLeft size={14}/></button>
          <div className="match-detail-title">
            <span className="match-game-badge">{match.game}</span>
            <h2>{match.title}</h2>
            <span style={{fontSize:'13px', color:'var(--text-secondary)'}}>
              {format(new Date(match.matchTime), 'dd-MM-yyyy, hh:mm a')}
            </span>
          </div>
          <span className="match-status-badge">#{match.matchNumber}</span>
        </div>

        {/* Countdown */}
        {match.status === 'upcoming' && (
          <div className="countdown-banner">
            <span>ম্যাচ শুরু হতে বাকি:</span>
            <CountdownTimer matchTime={match.matchTime} status={match.status}/>
          </div>
        )}
        {match.status === 'running' && (
          <div className="countdown-banner running">🔴 ম্যাচ এখন চলছে!</div>
        )}

        {/* Tags */}
        <div className="match-tags" style={{padding:'0 0 12px'}}>
          {match.map && <span className="match-tag blue"><FaMap size={10}/> {match.map}</span>}
          <span className="match-tag red">Prize: {match.totalPrize}৳</span>
          {match.perKillPrize > 0 && <span className="match-tag orange"><FaSkull size={10}/> Kill: {match.perKillPrize}৳</span>}
        </div>

        {/* Entry Type Selector */}
        {!isJoined && match.status === 'upcoming' && enabledTypes.length > 0 && (
          <div style={{background:'#ffffff', border:'1.5px solid var(--border)', borderRadius:12, padding:'14px', marginBottom:'12px', boxShadow:'var(--shadow)'}}>
            <p style={{fontSize:'13px', fontWeight:600, marginBottom:'10px', color:'var(--text-secondary)'}}>Entry Type বেছে নিন:</p>
            <div style={{display:'flex', gap:'8px', marginBottom:'0'}}>
              {enabledTypes.map(type => (
                <button key={type} onClick={() => setSelectedType(type)} style={{
                  flex:1, padding:'10px 6px', borderRadius:10, border:'2px solid',
                  borderColor: selectedType === type ? 'var(--purple)' : 'var(--border)',
                  background: selectedType === type ? 'rgba(37,99,235,0.1)' : '#ffffff',
                  color: selectedType === type ? 'var(--purple)' : 'var(--text-secondary)',
                  cursor:'pointer', fontWeight:700, fontSize:'13px',
                  fontFamily:'Hind Siliguri, sans-serif', transition:'all 0.2s'
                }}>
                  <div>{type === 'Solo' ? '👤' : type === 'Duo' ? '👥' : '👨‍👩‍👧‍👦'}</div>
                  <div>{type}</div>
                  <div style={{fontSize:'11px', marginTop:'2px'}}>৳{match.entryFees?.[type] || 0}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Slots */}
        <div className="slot-info">
          <div style={{display:'flex', justifyContent:'space-between', marginBottom:'6px'}}>
            <span style={{fontSize:'13px', color:'var(--text-secondary)'}}>স্লট</span>
            <span style={{fontSize:'13px', fontWeight:700}}>{usedSlots}/{match.maxSlots}</span>
          </div>
          <div className="slot-bar">
            <div className="slot-fill" style={{
              width:`${(usedSlots/match.maxSlots)*100}%`,
              background: usedSlots >= match.maxSlots ? 'var(--danger)' : 'var(--purple)',
            }}/>
          </div>
        </div>

        {/* Prize note */}
        {match.prizeNote && (
          <div className="info-box yellow">📋 {match.prizeNote}</div>
        )}

        {/* Room Details */}
        {isJoined && (match.roomId || match.roomPassword || match.roomNote) && (
          <div className="room-details-card">
            <h3><FaLock size={13}/> রুম ডিটেইলস</h3>
            {match.roomId && <div className="room-row"><span>Room ID:</span><strong>{match.roomId}</strong></div>}
            {match.roomPassword && <div className="room-row"><span>Password:</span><strong>{match.roomPassword}</strong></div>}
            {match.roomNote && <div className="room-row"><span>নোট:</span><span style={{color:'var(--accent)'}}>{match.roomNote}</span></div>}
          </div>
        )}
        {!isJoined && (match.roomId || match.roomPassword) && (
          <div className="info-box blue">🔒 ম্যাচে যোগ দিলে রুম ডিটেইলস দেখা যাবে</div>
        )}

        {/* Screenshot submit */}
        {isJoined && (match.status === 'running' || match.status === 'completed') && myPlayer?.resultStatus === 'pending' && (
          <div className="screenshot-section">
            <h3><FaCamera size={13}/> Result Screenshot জমা দিন</h3>
            <label className="screenshot-upload">
              {screenshot ? <span>📁 {screenshot.name}</span> : <span>📷 Screenshot বেছে নিন</span>}
              <input type="file" accept="image/*" onChange={e => setScreenshot(e.target.files[0])} style={{display:'none'}}/>
            </label>
            <button className="btn-primary" onClick={handleSubmitResult} disabled={uploading || !screenshot}>
              {uploading ? '⏳ আপলোড হচ্ছে...' : '📤 জমা দিন'}
            </button>
          </div>
        )}

        {myPlayer?.resultStatus === 'submitted' && (
          <div className="info-box yellow">⏳ Screenshot জমা দেওয়া হয়েছে। Admin রিভিউ করছেন।</div>
        )}
        {myPlayer?.resultStatus === 'approved' && (
          <div className="info-box green">
            ✅ Result অনুমোদিত! পুরস্কার: {myPlayer.prize} TK, কিল: {myPlayer.kills}, পজিশন: {myPlayer.position}
          </div>
        )}

        {/* Join button */}
        {!isJoined && match.status === 'upcoming' && !isFull && enabledTypes.length > 0 && (
          <button className="btn-primary pulse-glow" onClick={() => setShowConfirm(true)}>
            🎮 যোগ দিন — {selectedType} (ফি: {selectedFee}৳)
          </button>
        )}
        {(isFull || enabledTypes.length === 0) && !isJoined && (
          <button className="btn-primary" disabled style={{background:'var(--bg-card)', color:'var(--text-muted)'}}>
            🚫 {enabledTypes.length === 0 ? 'এই ম্যাচে join বন্ধ আছে' : 'ম্যাচ ফুল হয়ে গেছে'}
          </button>
        )}
      </div>

      {/* Join Confirm Modal */}
      {showConfirm && (
        <div className="modal-overlay" onClick={() => setShowConfirm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-handle"/>
            <h3 style={{marginBottom:'6px', fontFamily:'Rajdhani', fontSize:'20px'}}>
              {selectedType} হিসেবে join করুন
            </h3>
            <p style={{color:'var(--text-secondary)', marginBottom:'14px', fontSize:'14px'}}>
              Gaming Balance থেকে <strong style={{color:'var(--purple)'}}>{selectedFee} টাকা</strong> কাটা হবে।
            </p>

            {/* Player name inputs */}
            {Array.from({length: SLOT_COUNT[selectedType]}).map((_, i) => (
              <input
                key={i}
                className="input-field"
                placeholder={`Player ${i+1} In-Game Name`}
                value={playerNames[i] || ''}
                onChange={e => {
                  const updated = [...playerNames];
                  updated[i] = e.target.value;
                  setPlayerNames(updated);
                }}
                style={{marginBottom:'8px'}}
              />
            ))}

            <div style={{display:'flex', gap:'10px', marginTop:'6px'}}>
              <button className="btn-secondary" style={{flex:1}} onClick={() => setShowConfirm(false)}>বাতিল</button>
              <button className="btn-primary" style={{flex:1}} onClick={handleJoin} disabled={joining}>
                {joining ? '⏳...' : '✅ নিশ্চিত করুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Navbar/>
    </div>
  );
}
