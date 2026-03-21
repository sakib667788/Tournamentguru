import { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import API from '../../utils/api';
import toast from 'react-hot-toast';
import { FaTrash, FaUserShield } from 'react-icons/fa';

export default function AdminSubAdmins() {
  const [subadmins, setSubadmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', phone: '', password: '' });
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const fetchSubadmins = () => {
    API.get('/admin/users/subadmins/list')
      .then(res => setSubadmins(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSubadmins(); }, []);

  const handleCreate = async () => {
    if (!form.name || !form.phone || !form.password)
      return toast.error('সব তথ্য দিন');
    setCreating(true);
    try {
      await API.post('/admin/users/subadmins/create', form);
      toast.success('Sub-admin তৈরি হয়েছে!');
      setForm({ name: '', phone: '', password: '' });
      setShowForm(false);
      fetchSubadmins();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    } finally { setCreating(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`${name} কে delete করবেন?`)) return;
    try {
      await API.delete(`/admin/users/subadmins/${id}`);
      toast.success('Deleted!');
      fetchSubadmins();
    } catch { toast.error('Error'); }
  };

  return (
    <AdminLayout title="Sub Admins">
      <div style={{marginBottom:'14px', display:'flex', justifyContent:'flex-end'}}>
        <button className="btn-primary" style={{width:'auto', padding:'8px 16px'}}
          onClick={() => setShowForm(!showForm)}>
          <FaUserShield size={12}/> নতুন Sub-Admin
        </button>
      </div>

      {showForm && (
        <div style={{background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, padding:'16px', marginBottom:'16px'}}>
          <h3 style={{fontFamily:'Rajdhani', fontSize:'16px', marginBottom:'12px'}}>নতুন Sub-Admin তৈরি করুন</h3>
          <input className="input-field" placeholder="নাম" value={form.name}
            onChange={e => setForm({...form, name: e.target.value})} style={{marginBottom:'10px'}}/>
          <input className="input-field" placeholder="ফোন নম্বর" value={form.phone}
            onChange={e => setForm({...form, phone: e.target.value})} style={{marginBottom:'10px'}}/>
          <input className="input-field" type="password" placeholder="পাসওয়ার্ড" value={form.password}
            onChange={e => setForm({...form, password: e.target.value})} style={{marginBottom:'12px'}}/>
          <div style={{display:'flex', gap:'10px'}}>
            <button className="btn-secondary" style={{flex:1}} onClick={() => setShowForm(false)}>বাতিল</button>
            <button className="btn-primary" style={{flex:1}} onClick={handleCreate} disabled={creating}>
              {creating ? '⏳...' : '✅ তৈরি করুন'}
            </button>
          </div>
        </div>
      )}

      {loading ? <div className="page-loader"><div className="spinner"/></div>
      : subadmins.length === 0
        ? <div className="empty-state"><p>কোনো Sub-Admin নেই</p></div>
        : subadmins.map(s => (
          <div key={s._id} className="request-card">
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <div>
                <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                  <FaUserShield size={14} color="var(--accent)"/>
                  <strong style={{fontSize:'15px'}}>{s.name}</strong>
                </div>
                <p style={{fontSize:'12px', color:'var(--text-secondary)', marginTop:'4px'}}>{s.phone}</p>
                <p style={{fontSize:'11px', color:'var(--text-muted)', marginTop:'2px'}}>
                  যোগ দিয়েছেন: {new Date(s.createdAt).toLocaleDateString('bn-BD')}
                </p>
              </div>
              <button className="btn-danger" style={{fontSize:'12px', padding:'7px 12px'}}
                onClick={() => handleDelete(s._id, s.name)}>
                <FaTrash size={11}/>
              </button>
            </div>
          </div>
        ))
      }
    </AdminLayout>
  );
}
