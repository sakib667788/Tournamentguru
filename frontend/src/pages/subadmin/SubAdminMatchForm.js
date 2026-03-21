import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SubAdminLayout from './SubAdminLayout';
import API from '../../utils/api';
import toast from 'react-hot-toast';
import { useSettings } from '../../context/SettingsContext';

const MAPS = ['Bermuda', 'Purgatory', 'Kalahari', 'Nextera', 'অন্যান্য'];
const ENTRY_TYPES = ['Solo', 'Duo', 'Squad'];
const FF_MODES = ['Classic Match', 'Clash Squad', 'CS 1 VS 1', 'Lone Wolf'];

const defaultForm = {
  title: '', game: 'FreeFire', gameMode: 'Classic Match', map: 'Bermuda',
  entryType: 'Solo', entryFee: '', totalPrize: '', perKillPrize: '',
  prizeNote: '', maxSlots: '20', matchTime: '',
  roomId: '', roomPassword: '', roomNote: '', banner: '', status: 'upcoming'
};

const NumInput = ({ placeholder, value, onChange }) => {
  const [local, setLocal] = useState(value === 0 || value === '' ? '' : String(value));
  useEffect(() => { setLocal(value === 0 || value === '' ? '' : String(value)); }, [value]);
  return (
    <input className="input-field" type="text" inputMode="numeric" pattern="[0-9]*"
      placeholder={placeholder} value={local}
      onChange={e => {
        const v = e.target.value.replace(/[^0-9]/g, '');
        setLocal(v);
        onChange(v === '' ? '' : Number(v));
      }}/>
  );
};

export default function SubAdminMatchForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (isEdit) {
      API.get(`/matches/${id}`).then(res => {
        const m = res.data;
        setForm({
          title: m.title, game: m.game, gameMode: m.gameMode || '', map: m.map,
          entryType: m.entryType, entryFee: m.entryFee, totalPrize: m.totalPrize,
          perKillPrize: m.perKillPrize, prizeNote: m.prizeNote || '',
          maxSlots: m.maxSlots, matchTime: new Date(m.matchTime).toISOString().slice(0,16),
          roomId: m.roomId || '', roomPassword: m.roomPassword || '',
          roomNote: m.roomNote || '', banner: m.banner || '', status: m.status
        });
        if (m.banner) setBannerPreview(m.banner.startsWith('http') ? m.banner : `${(process.env.REACT_APP_API_URL||'/api').replace('/api','')}${m.banner}`);
      }).catch(() => toast.error('Match not found'));
    }
  }, [id]);

  const set = (k, v) => setForm(f => ({...f, [k]: v}));

  const handleSubmit = async () => {
    if (!form.title || !form.entryFee || !form.totalPrize || !form.matchTime)
      return toast.error('সব প্রয়োজনীয় তথ্য দিন');
    setLoading(true);
    try {
      let bannerUrl = form.banner;
      if (bannerFile) {
        setUploading(true);
        const data = new FormData();
        data.append('image', bannerFile);
        const res = await API.post('/settings/upload', data, { headers: { 'Content-Type': 'multipart/form-data' } });
        bannerUrl = res.data.url;
        setUploading(false);
      }
      const matchData = { ...form, banner: bannerUrl };
      if (isEdit) { await API.put(`/matches/${id}`, matchData); toast.success('Updated!'); }
      else { await API.post('/matches', matchData); toast.success('Match তৈরি হয়েছে!'); }
      navigate('/subadmin/matches');
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setLoading(false); setUploading(false); }
  };

  const isLudo = form.game === 'Ludo';

  return (
    <SubAdminLayout title={isEdit ? 'Match Edit' : 'নতুন Match'}>
      <div className="admin-form">
        <div className="form-group">
          <label className="form-label">ম্যাচের নাম *</label>
          <input className="input-field" placeholder="Match এর নাম দিন" value={form.title} onChange={e => set('title', e.target.value)}/>
        </div>

        {/* Game selector - only FreeFire and Ludo */}
        <div className="form-group">
          <label className="form-label">Game *</label>
          <div style={{display:'flex', gap:'10px'}}>
            {['FreeFire', 'Ludo'].map(g => (
              <button key={g} type="button" onClick={() => {
                set('game', g);
                if (g === 'FreeFire') set('gameMode', 'Classic Match');
                else set('gameMode', '');
              }} style={{
                flex:1, padding:'12px', borderRadius:10, border:'2px solid',
                borderColor: form.game === g ? 'var(--purple)' : 'var(--border)',
                background: form.game === g ? 'rgba(37,99,235,0.1)' : '#ffffff',
                color: form.game === g ? 'var(--purple)' : 'var(--text-secondary)',
                cursor:'pointer', fontWeight:700, fontSize:'14px', fontFamily:'Hind Siliguri, sans-serif'
              }}>
                {g === 'FreeFire' ? '🔥 FreeFire' : '🎲 Ludo'}
              </button>
            ))}
          </div>
        </div>

        {/* Game mode - only for FreeFire */}
        {!isLudo && (
          <div className="form-group">
            <label className="form-label">Game Mode *</label>
            <select className="input-field" value={form.gameMode} onChange={e => set('gameMode', e.target.value)}>
              {FF_MODES.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
        )}

        <div className="form-row">
          {!isLudo && (
            <div className="form-group">
              <label className="form-label">Map</label>
              <select className="input-field" value={form.map} onChange={e => set('map', e.target.value)}>
                {MAPS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Entry Type</label>
            <select className="input-field" value={form.entryType} onChange={e => set('entryType', e.target.value)}>
              {ENTRY_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Entry Fee (৳) *</label>
            <NumInput placeholder="20" value={form.entryFee} onChange={v => set('entryFee', v)}/>
          </div>
          <div className="form-group">
            <label className="form-label">Max Slots</label>
            <NumInput placeholder="20" value={form.maxSlots} onChange={v => set('maxSlots', v)}/>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Total Prize (৳) *</label>
            <NumInput placeholder="500" value={form.totalPrize} onChange={v => set('totalPrize', v)}/>
          </div>
          <div className="form-group">
            <label className="form-label">Per Kill Prize (৳)</label>
            <NumInput placeholder="0" value={form.perKillPrize} onChange={v => set('perKillPrize', v)}/>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Prize Note</label>
          <textarea className="input-field" rows={2} placeholder="e.g. 1st: 100৳, 2nd: 50৳" value={form.prizeNote} onChange={e => set('prizeNote', e.target.value)}/>
        </div>

        <div className="form-group">
          <label className="form-label">Match Time *</label>
          <input className="input-field" type="datetime-local" value={form.matchTime} onChange={e => set('matchTime', e.target.value)}/>
        </div>

        {/* Banner */}
        <div className="form-group">
          <label className="form-label">🖼 Match Banner</label>
          <label style={{display:'block', cursor:'pointer'}}>
            <div style={{border:'2px dashed var(--border)', borderRadius:10, overflow:'hidden', background:'var(--bg-card2)', position:'relative'}}>
              {bannerPreview
                ? <img src={bannerPreview} alt="banner" style={{width:'100%', height:'120px', objectFit:'cover', display:'block'}}/>
                : <div style={{height:'80px', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px'}}>
                    <span style={{fontSize:'24px'}}>🖼</span>
                    <span style={{fontSize:'12px', color:'var(--text-muted)'}}>Banner আপলোড করুন</span>
                  </div>
              }
              <div style={{padding:'6px', background:'rgba(0,0,0,0.5)', position:'absolute', bottom:0, left:0, right:0, fontSize:'11px', color:'#ccc', textAlign:'center'}}>
                📷 ক্লিক করে image দিন
              </div>
            </div>
            <input type="file" accept="image/*" onChange={e => { const f=e.target.files[0]; if(f){setBannerFile(f);setBannerPreview(URL.createObjectURL(f));} }} style={{display:'none'}}/>
          </label>
        </div>

        {/* Room details */}
        <div style={{background:'var(--bg-card2)', borderRadius:10, padding:'14px'}}>
          <p style={{fontSize:'13px', fontWeight:600, marginBottom:'10px', color:'var(--purple)'}}>🔑 Room Details</p>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Room ID</label>
              <input className="input-field" value={form.roomId} onChange={e => set('roomId', e.target.value)}/>
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="input-field" value={form.roomPassword} onChange={e => set('roomPassword', e.target.value)}/>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Note</label>
            <input className="input-field" value={form.roomNote} onChange={e => set('roomNote', e.target.value)}/>
          </div>
        </div>

        {isEdit && (
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="input-field" value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="upcoming">upcoming</option>
              <option value="running">running</option>
              <option value="completed">completed</option>
              <option value="cancelled">cancelled</option>
            </select>
          </div>
        )}

        <button className="btn-primary" onClick={handleSubmit} disabled={loading || uploading}>
          {uploading ? '⏳ Image আপলোড হচ্ছে...' : loading ? '⏳ সেভ হচ্ছে...' : isEdit ? '✅ আপডেট করুন' : '✅ Match তৈরি করুন'}
        </button>
      </div>
    </SubAdminLayout>
  );
}
