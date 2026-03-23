import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import API from '../../utils/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { FaArrowLeft, FaCheck } from 'react-icons/fa';

export default function AdminMatchDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(null);
  const [exiting, setExiting] = useState(null);
  const [resultForms, setResultForms] = useState({});

  const fetchMatch = () => {
    API.get(`/matches/${id}`).then(res => {
      setMatch(res.data);
      const forms = {};
      res.data.players.forEach(p => {
        const uid = (p.user?._id || p.user)?.toString();
        if (uid) {
          forms[uid] = { kills: p.kills || 0, position: p.position || 0, prize: p.prize || 0 };
        }
      });
      setResultForms(forms);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchMatch(); }, [id]);

  const handleApprove = async (userId) => {
    setApproving(userId);
    try {
      await API.post(`/matches/${id}/players/${userId}/approve`, resultForms[userId]);
      toast.success('Result Approved! Prize added.');
      fetchMatch();
    } catch { toast.error('Error'); }
    finally { setApproving(null); }
  };

  const handleExit = async (userId, name) => {
    if (!window.confirm(`${name} কে match থেকে বের করবেন? Entry fee refund হবে।`)) return;
    setExiting(userId);
    try {
      await API.post(`/matches/${id}/players/${userId}/exit`);
      toast.success(`${name} কে বের করা হয়েছে, refund দেওয়া হয়েছে।`);
      fetchMatch();
    } catch { toast.error('Error'); }
    finally { setExiting(null); }
  };

  if (loading) return <div className="page-loader"><div className="spinner"/></div>;
  if (!match) return null;

  const isCompleted = match.status === 'completed';

  return (
    <AdminLayout title={`Match #${match.matchNumber}`}>
      <div style={{marginBottom:'16px'}}>
        <button onClick={() => navigate('/admin/matches')} style={{display:'flex', alignItems:'center', gap:'6px', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:8, padding:'8px 12px', color:'var(--text-primary)', cursor:'pointer', fontSize:'13px', marginBottom:'12px'}}>
          <FaArrowLeft size={12}/> Matches
        </button>
        <div style={{background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, padding:'14px'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px'}}>
            <h2 style={{fontFamily:'Rajdhani', fontSize:'20px'}}>{match.title}</h2>
            <span style={{fontSize:'12px', fontWeight:700, padding:'3px 10px', borderRadius:20,
              background: match.status==='completed' ? 'rgba(16,185,129,0.15)' : match.status==='running' ? 'rgba(37,99,235,0.15)' : 'rgba(245,158,11,0.15)',
              color: match.status==='completed' ? 'var(--accent2)' : match.status==='running' ? 'var(--purple)' : 'var(--accent)'
            }}>{match.status}</span>
          </div>
          <div style={{display:'flex', flexWrap:'wrap', gap:'12px', fontSize:'13px', color:'var(--text-secondary)'}}>
            <span>Game: <strong style={{color:'var(--text-primary)'}}>{match.game}</strong></span>
            <span>Mode: <strong style={{color:'var(--text-primary)'}}>{match.gameMode}</strong></span>
            <span>Map: <strong style={{color:'var(--text-primary)'}}>{match.map}</strong></span>
            <span>Fees: <strong style={{color:'var(--accent)'}}>Solo {match.entryFees?.Solo || 0}৳ / Duo {match.entryFees?.Duo || 0}৳ / Squad {match.entryFees?.Squad || 0}৳</strong></span>
            <span>Prize: <strong style={{color:'var(--accent2)'}}>{match.totalPrize}৳</strong></span>
            <span>Slots: <strong>{match.players.length}/{match.maxSlots}</strong></span>
            <span>Time: <strong>{format(new Date(match.matchTime), 'dd/MM/yyyy hh:mm a')}</strong></span>
          </div>
        </div>
      </div>

      {/* Warning if match not completed */}
      {!isCompleted && (
        <div style={{background:'rgba(245,158,11,0.1)', border:'1.5px solid rgba(245,158,11,0.3)', borderRadius:10, padding:'12px', marginBottom:'14px', fontSize:'13px', color:'#d97706'}}>
          ⚠️ Match এখনো <strong>{match.status}</strong> — Prize approve বা refund করতে হলে আগে match <strong>completed</strong> করুন।
        </div>
      )}

      <h3 style={{fontFamily:'Rajdhani', fontSize:'16px', fontWeight:700, marginBottom:'10px'}}>Players ({match.players.length})</h3>

      {match.players.length === 0
        ? <div className="empty-state"><p>কোনো player নেই</p></div>
        : match.players.map(p => {
          const uid = (p.user?._id || p.user)?.toString();
          const name = p.user?.name || 'Unknown';
          const rf = resultForms[uid] || { kills: 0, position: 0, prize: 0 };

          return (
            <div key={uid} style={{background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, padding:'14px', marginBottom:'10px'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px'}}>
                <div>
                  <strong style={{fontSize:'15px'}}>{name}</strong>
                  <p style={{fontSize:'12px', color:'var(--text-secondary)'}}>{p.user?.phone}</p>
                  {p.entryType && <p style={{fontSize:'12px', color:'var(--purple-light)', fontWeight:600}}>{p.entryType === 'Solo' ? '👤' : p.entryType === 'Duo' ? '👥' : '👨‍👩‍👧‍👦'} {p.entryType} — {p.entryFee || 0}৳</p>}
                  {p.playerNames?.length > 0 && (
                    <p style={{fontSize:'12px', color:'var(--text-secondary)'}}>Players: {p.playerNames.join(', ')}</p>
                  )}
                </div>
                <span style={{fontSize:'12px', fontWeight:700, color:
                  p.resultStatus === 'approved' ? 'var(--accent2)' :
                  p.resultStatus === 'submitted' ? 'var(--accent)' :
                  p.resultStatus === 'rejected' ? 'var(--danger)' : 'var(--text-muted)'
                }}>
                  {p.resultStatus === 'approved' ? '✅ Approved' :
                   p.resultStatus === 'submitted' ? '📸 Screenshot' :
                   p.resultStatus === 'rejected' ? '❌ Rejected' : '⏳ Pending'}
                </span>
              </div>

              {/* Screenshot link */}
              {p.resultScreenshot && (
                <a href={p.resultScreenshot.startsWith('http') ? p.resultScreenshot : `${(process.env.REACT_APP_API_URL || '/api').replace('/api', '')}${p.resultScreenshot}`}
                  target="_blank" rel="noreferrer"
                  style={{display:'block', marginBottom:'8px', fontSize:'12px', color:'var(--purple-light)'}}>
                  📷 Screenshot দেখুন
                </a>
              )}

              {/* Approve — only when completed + screenshot submitted */}
              {isCompleted && p.resultStatus === 'submitted' && (
                <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                  <div className="form-row">
                    <div><label className="form-label">Kills</label>
                      <input className="input-field" type="number" style={{padding:'6px 10px'}}
                        value={rf.kills} onChange={e => setResultForms(f => ({...f, [uid]: {...(f[uid]||{}), kills: parseInt(e.target.value)||0}}))}/>
                    </div>
                    <div><label className="form-label">Position</label>
                      <input className="input-field" type="number" style={{padding:'6px 10px'}}
                        value={rf.position} onChange={e => setResultForms(f => ({...f, [uid]: {...(f[uid]||{}), position: parseInt(e.target.value)||0}}))}/>
                    </div>
                  </div>
                  <div><label className="form-label">Prize (৳)</label>
                    <input className="input-field" type="number" style={{padding:'6px 10px'}}
                      value={rf.prize} onChange={e => setResultForms(f => ({...f, [uid]: {...(f[uid]||{}), prize: parseInt(e.target.value)||0}}))}/>
                  </div>
                  <button className="btn-success" onClick={() => handleApprove(uid)} disabled={approving === uid}>
                    <FaCheck size={11}/> Approve & Add Prize
                  </button>
                </div>
              )}

              {p.resultStatus === 'approved' && (
                <div style={{fontSize:'13px', color:'var(--accent2)'}}>
                  Kills: {p.kills} | Position: {p.position} | Prize: {p.prize}৳
                </div>
              )}

              {/* Exit — only when match not completed */}
              {isCompleted && p.resultStatus !== 'approved' && (
                <button className="btn-danger" style={{fontSize:'12px', marginTop:'8px'}}
                  onClick={() => handleExit(uid, name)} disabled={exiting === uid}>
                  {exiting === uid ? '⏳...' : '🚪 Match থেকে বের করুন'}
                </button>
              )}
            </div>
          );
        })
      }
    </AdminLayout>
  );
}
