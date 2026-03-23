import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { FaWallet, FaTrophy } from 'react-icons/fa';
import './TopBar.css';

const getImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const base = (process.env.REACT_APP_API_URL || '/api').replace('/api', '');
  return `${base}${url}`;
};

export default function TopBar() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();

  return (
    <header className="topbar">
      <div className="topbar-left">
        {settings.appLogo
          ? <img src={getImageUrl(settings.appLogo)} alt="logo" className="topbar-logo-img"/>
          : <div className="topbar-logo-icon">🏆</div>
        }
        <span className="topbar-name">{settings.appName || 'Tournament Guru'}</span>
      </div>
      <div style={{display:'flex', gap:'6px', alignItems:'center'}}>
        <button className="topbar-wallet" onClick={() => navigate('/add-money')} title="Gaming Balance">
          <FaWallet size={11}/>
          <span>৳{user?.gamingBalance || 0}</span>
        </button>
        <button className="topbar-wallet" onClick={() => navigate('/withdraw')}
          style={{background:'rgba(16,185,129,0.1)', border:'1.5px solid rgba(16,185,129,0.3)', color:'#059669'}}
          title="Winning Balance">
          <FaTrophy size={11}/>
          <span>৳{user?.winningBalance || 0}</span>
        </button>
      </div>
    </header>
  );
}
