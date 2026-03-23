import { useState, useEffect, useRef } from 'react';
import AdminLayout from './AdminLayout';
import API from '../../utils/api';
import toast from 'react-hot-toast';
import { useSettings } from '../../context/SettingsContext';
import { FaSave, FaUpload } from 'react-icons/fa';

export default function AdminSettings() {
  const { refreshSettings } = useSettings();
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const formRef = useRef({});

  useEffect(() => {
    API.get('/settings').then(res => {
      setForm(res.data);
      formRef.current = res.data;
      if (res.data.appLogo) setLogoPreview(res.data.appLogo);
    }).finally(() => setLoading(false));
  }, []);

  const handleLogoChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setLogoFile(f);
    setLogoPreview(URL.createObjectURL(f));
  };

  const save = async () => {
    setSaving(true);
    try {
      let updatedForm = { ...formRef.current };
      if (logoFile) {
        const data = new FormData();
        data.append('image', logoFile);
        const res = await API.post('/settings/upload', data, { headers: { 'Content-Type': 'multipart/form-data' } });
        updatedForm.appLogo = res.data.url;
      }
      await API.post('/settings/update', updatedForm);
      await refreshSettings();
      toast.success('Settings সেভ হয়েছে! ✅');
    } catch (err) { toast.error(err?.response?.data?.message || 'Error saving'); }
    finally { setSaving(false); }
  };

  const seedDefaults = async () => {
    try {
      await API.post('/settings/seed');
      const res = await API.get('/settings');
      setForm(res.data);
      formRef.current = res.data;
      await refreshSettings();
      toast.success('Default settings লোড হয়েছে!');
    } catch { toast.error('Error'); }
  };

  if (loading) return <div className="page-loader"><div className="spinner"/></div>;

  const Section = ({ title, children }) => (
    <div style={{background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, padding:'16px', marginBottom:'14px'}}>
      <h3 style={{fontFamily:'Rajdhani', fontSize:'15px', fontWeight:700, marginBottom:'12px', color:'var(--purple-light)'}}>{title}</h3>
      {children}
    </div>
  );

  const Field = ({ label, children }) => (
    <div style={{marginBottom:'10px'}}>
      <label style={{fontSize:'12px', color:'var(--text-secondary)', display:'block', marginBottom:'4px'}}>{label}</label>
      {children}
    </div>
  );

  return (
    <AdminLayout title="App Settings">
      <button onClick={seedDefaults} style={{background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:8, padding:'8px 14px', color:'var(--text-secondary)', cursor:'pointer', fontSize:'12px', marginBottom:'14px', fontFamily:'Hind Siliguri, sans-serif'}}>
        🔄 Default Settings Load করুন
      </button>

      <Section title="🏆 App Identity">
        <Field label="App Logo">
          <label style={{display:'flex', alignItems:'center', gap:'10px', cursor:'pointer'}}>
            {logoPreview
              ? <img src={logoPreview} alt="logo" style={{width:50, height:50, borderRadius:10, objectFit:'cover', border:'1px solid var(--border)'}}/>
              : <div style={{width:50, height:50, borderRadius:10, background:'var(--bg-card2)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px'}}>🏆</div>
            }
            <span style={{fontSize:'13px', color:'var(--purple-light)', fontWeight:600}}><FaUpload size={11}/> Logo পরিবর্তন</span>
            <input type="file" accept="image/*" onChange={handleLogoChange} style={{display:'none'}}/>
          </label>
        </Field>
        <Field label="App Name">
          <input className="input-field" defaultValue={form.appName || ''} onChange={e => { formRef.current.appName = e.target.value; }}/>
        </Field>
        <Field label="App Description">
          <input className="input-field" defaultValue={form.appDescription || ''} onChange={e => { formRef.current.appDescription = e.target.value; }}/>
        </Field>
        <Field label="Hero Text (হোমপেজের ট্যাগলাইন)">
          <input className="input-field" defaultValue={form.heroText || ''} onChange={e => { formRef.current.heroText = e.target.value; }}/>
        </Field>
        <Field label="Announcement (স্ক্রলিং বার)">
          <input className="input-field" placeholder="খালি রাখলে দেখাবে না" defaultValue={form.announcement || ''} onChange={e => { formRef.current.announcement = e.target.value; }}/>
        </Field>
        <Field label="Footer Text">
          <input className="input-field" defaultValue={form.footerText || ''} onChange={e => { formRef.current.footerText = e.target.value; }}/>
        </Field>
      </Section>

      <Section title="💳 Payment Numbers">
        <Field label="bKash Number">
          <input className="input-field" defaultValue={form.bkashNumber || ''} onChange={e => { formRef.current.bkashNumber = e.target.value; }}/>
        </Field>
        <Field label="Nagad Number">
          <input className="input-field" defaultValue={form.nagadNumber || ''} onChange={e => { formRef.current.nagadNumber = e.target.value; }}/>
        </Field>
        <Field label="Rocket Number">
          <input className="input-field" defaultValue={form.rocketNumber || ''} onChange={e => { formRef.current.rocketNumber = e.target.value; }}/>
        </Field>
      </Section>

      <Section title="💰 Wallet Limits">
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
          <Field label="Minimum Add Money (৳)">
            <input className="input-field" type="number" defaultValue={form.minAddMoney || 20}
              onChange={e => { formRef.current.minAddMoney = parseInt(e.target.value) || 20; }}/>
          </Field>
          <Field label="Minimum Withdraw (৳)">
            <input className="input-field" type="number" defaultValue={form.minWithdraw || 50}
              onChange={e => { formRef.current.minWithdraw = parseInt(e.target.value) || 50; }}/>
          </Field>
        </div>
      </Section>

      <Section title="🔗 Social Links">
        <Field label="YouTube URL">
          <input className="input-field" placeholder="https://youtube.com/..." defaultValue={form.socialYoutube || ''} onChange={e => { formRef.current.socialYoutube = e.target.value; }}/>
        </Field>
        <Field label="Telegram URL/Username">
          <input className="input-field" placeholder="https://t.me/..." defaultValue={form.socialTelegram || ''} onChange={e => { formRef.current.socialTelegram = e.target.value; }}/>
        </Field>
        <Field label="WhatsApp URL">
          <input className="input-field" placeholder="https://wa.me/..." defaultValue={form.socialWhatsapp || ''} onChange={e => { formRef.current.socialWhatsapp = e.target.value; }}/>
        </Field>
        <Field label="Facebook URL">
          <input className="input-field" placeholder="https://facebook.com/..." defaultValue={form.socialFacebook || ''} onChange={e => { formRef.current.socialFacebook = e.target.value; }}/>
        </Field>
      </Section>

      <Section title="🎮 Game Mode Default Banners">
        <p style={{fontSize:'12px', color:'var(--text-secondary)', marginBottom:'12px'}}>
          এই ছবিগুলো হোমপেজের Daily Matches card এ এবং ম্যাচ এর default banner হিসেবে দেখাবে।
        </p>
        {[
          { key: 'banner_freefire_classic', label: 'FreeFire — Classic Match' },
          { key: 'banner_freefire_clash', label: 'FreeFire — Clash Squad' },
          { key: 'banner_freefire_1v1', label: 'FreeFire — CS 1 VS 1' },
          { key: 'banner_freefire_lonewolf', label: 'FreeFire — Lone Wolf' },
          { key: 'banner_pubg_classic', label: 'PUBG — Classic' },
          { key: 'banner_pubg_tdm', label: 'PUBG — TDM' },
        ].map(({ key, label }) => {
          const currentUrl = form[key] ? (form[key].startsWith('http') ? form[key] : `${(process.env.REACT_APP_API_URL||'/api').replace('/api','')}${form[key]}`) : '';
          return (
            <div key={key} style={{marginBottom:'14px', paddingBottom:'14px', borderBottom:'1px solid var(--border-light)'}}>
              <label style={{fontSize:'12px', color:'var(--text-secondary)', display:'block', marginBottom:'6px', fontWeight:600}}>{label}</label>
              <label style={{cursor:'pointer', display:'block'}}>
                <div style={{border:'2px dashed var(--border)', borderRadius:8, overflow:'hidden', background:'var(--bg-card2)', position:'relative'}}>
                  {currentUrl
                    ? <img src={currentUrl} alt={label} style={{width:'100%', height:'80px', objectFit:'cover', display:'block'}}
                        onError={e => { e.target.style.display='none'; }}/>
                    : <div style={{height:'60px', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px'}}>
                        <span style={{fontSize:'20px'}}>🖼</span>
                        <span style={{fontSize:'11px', color:'var(--text-muted)'}}>ছবি আপলোড করুন</span>
                      </div>
                  }
                  <div style={{padding:'4px 8px', background:'rgba(0,0,0,0.6)', position:'absolute', bottom:0, left:0, right:0, fontSize:'10px', color:'#ccc', textAlign:'center'}}>
                    📷 ক্লিক করে ছবি পরিবর্তন করুন
                  </div>
                </div>
                <input type="file" accept="image/*" style={{display:'none'}} onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  try {
                    const data = new FormData();
                    data.append('image', file);
                    const res = await API.post('/settings/upload', data, { headers: { 'Content-Type': 'multipart/form-data' } });
                    formRef.current[key] = res.data.url;
                    setForm(f => ({...f, [key]: res.data.url}));
                    toast.success(`${label} আপলোড হয়েছে!`);
                  } catch { toast.error('Upload failed'); }
                }}/>
              </label>
            </div>
          );
        })}
      </Section>

      <button className="btn-primary" onClick={save} disabled={saving} style={{marginBottom:'20px'}}>
        <FaSave size={13}/> {saving ? '⏳ সেভ হচ্ছে...' : 'সব Settings সেভ করুন'}
      </button>
    </AdminLayout>
  );
}
