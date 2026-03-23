import { useState, useEffect } from 'react';
import SubAdminLayout from './SubAdminLayout';
import API from '../../utils/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { FaTrash, FaBell, FaPlus, FaEdit, FaCheck, FaTimes } from 'react-icons/fa';

export default function SubAdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', message: '', type: 'global', targetUser: '' });
  const [users, setUsers] = useState([]);
  const [sending, setSending] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', message: '' });

  const fetchData = async () => {
    try {
      const res = await API.get('/notifications');
      setNotifications(res.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    API.get('/admin/users').then(res => setUsers(res.data)).catch(() => {});
  }, []);

  const send = async () => {
    if (!form.title || !form.message) return toast.error('Title ও Message দিন');
    if (form.type === 'personal' && !form.targetUser) return toast.error('User বেছে নিন');
    setSending(true);
    try {
      await API.post('/notifications', form);
      toast.success('🔔 Notification পাঠানো হয়েছে!');
      setForm({ title: '', message: '', type: 'global', targetUser: '' });
      fetchData();
    } catch { toast.error('Error'); }
    finally { setSending(false); }
  };

  const saveEdit = async (id) => {
    try {
      await API.put(`/notifications/${id}`, editForm);
      toast.success('আপডেট হয়েছে!');
      setEditingId(null);
      fetchData();
    } catch { toast.error('Error'); }
  };

  const deleteNotif = async (id) => {
    try {
      await API.delete(`/notifications/${id}`);
      toast.success('Deleted');
      fetchData();
    } catch { toast.error('Error'); }
  };

  return (
    <SubAdminLayout title="Push Notifications">
      {/* Send form */}
      <div style={{background:'#ffffff', border:'1.5px solid var(--border)', borderRadius:10, padding:'16px', marginBottom:'16px', boxShadow:'0 2px 8px rgba(37,99,235,0.08)'}}>
        <h3 style={{fontFamily:'Rajdhani', fontSize:'16px', fontWeight:700, marginBottom:'12px', color:'var(--text-primary)'}}>
          <FaBell size={14} color="var(--purple)"/> নতুন Notification
        </h3>
        <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
          <input className="input-field" placeholder="Title *" value={form.title} onChange={e => setForm({...form, title: e.target.value})}/>
          <textarea className="input-field" rows={3} placeholder="Message *" value={form.message} onChange={e => setForm({...form, message: e.target.value})}/>
          <select className="input-field" value={form.type} onChange={e => setForm({...form, type: e.target.value, targetUser: ''})}>
            <option value="global">🌍 সবাইকে পাঠান</option>
            <option value="personal">👤 নির্দিষ্ট User কে</option>
          </select>
          {form.type === 'personal' && (
            <select className="input-field" value={form.targetUser} onChange={e => setForm({...form, targetUser: e.target.value})}>
              <option value="">User বেছে নিন</option>
              {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.phone})</option>)}
            </select>
          )}
          <button className="btn-primary" onClick={send} disabled={sending}>
            {sending ? '⏳ পাঠানো হচ্ছে...' : <><FaPlus size={12}/> Notification পাঠান</>}
          </button>
        </div>
      </div>

      <h3 style={{fontFamily:'Rajdhani', fontSize:'16px', fontWeight:700, marginBottom:'10px'}}>
        History ({notifications.length})
      </h3>

      {loading ? <div className="page-loader"><div className="spinner"/></div>
      : notifications.length === 0 ? <div className="empty-state"><p>কোনো notification নেই</p></div>
      : notifications.map(n => (
        <div key={n._id} style={{background:'#ffffff', border:'1.5px solid var(--border)', borderRadius:10, padding:'12px', marginBottom:'8px'}}>
          {editingId === n._id ? (
            <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
              <input className="input-field" style={{padding:'7px 10px'}} value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})}/>
              <textarea className="input-field" rows={2} value={editForm.message} onChange={e => setEditForm({...editForm, message: e.target.value})}/>
              <div style={{display:'flex', gap:'8px'}}>
                <button className="btn-success" style={{flex:1}} onClick={() => saveEdit(n._id)}><FaCheck size={11}/> Save</button>
                <button className="btn-danger" style={{flex:1}} onClick={() => setEditingId(null)}><FaTimes size={11}/> Cancel</button>
              </div>
            </div>
          ) : (
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'10px'}}>
              <div style={{flex:1}}>
                <div style={{display:'flex', alignItems:'center', gap:'6px', marginBottom:'4px'}}>
                  <strong style={{fontSize:'14px', fontFamily:'Rajdhani'}}>{n.title}</strong>
                  <span style={{fontSize:'10px', background:'rgba(37,99,235,0.1)', color:'var(--purple)', padding:'1px 6px', borderRadius:4}}>{n.type}</span>
                </div>
                <p style={{fontSize:'12px', color:'var(--text-secondary)', lineHeight:1.4}}>{n.message}</p>
                <p style={{fontSize:'11px', color:'var(--text-muted)', marginTop:'4px'}}>{format(new Date(n.createdAt), 'dd/MM/yyyy HH:mm')}</p>
              </div>
              <div style={{display:'flex', gap:'6px', flexShrink:0}}>
                <button onClick={() => { setEditingId(n._id); setEditForm({title:n.title, message:n.message}); }}
                  style={{background:'var(--bg-card2)', border:'1px solid var(--border)', borderRadius:6, padding:'6px 8px', color:'var(--purple)', cursor:'pointer'}}>
                  <FaEdit size={11}/>
                </button>
                <button className="btn-danger" style={{padding:'6px 8px'}} onClick={() => deleteNotif(n._id)}>
                  <FaTrash size={11}/>
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </SubAdminLayout>
  );
}
