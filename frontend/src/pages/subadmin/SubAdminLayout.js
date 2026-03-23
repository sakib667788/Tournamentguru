import { useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { FaGamepad, FaBell, FaSignOutAlt } from 'react-icons/fa';

const navItems = [
  { to: '/subadmin/matches', icon: <FaGamepad/>, label: 'Matches' },
  { to: '/subadmin/notifications', icon: <FaBell/>, label: 'Notifications' },
];

export default function SubAdminLayout({ children, title }) {
  const { logout } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={{minHeight:'100vh', background:'#f0f4ff', fontFamily:'Hind Siliguri, sans-serif'}}>
      <header style={{
        position:'sticky', top:0, zIndex:50,
        background:'#ffffff', borderBottom:'2px solid rgba(37,99,235,0.25)',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'12px 16px', boxShadow:'0 2px 8px rgba(37,99,235,0.08)'
      }}>
        <span style={{fontFamily:'Rajdhani, sans-serif', fontSize:'20px', fontWeight:700, color:'#111827'}}>
          🏆 {settings.appName}
        </span>
        <span style={{fontSize:'12px', color:'#2563eb', fontWeight:600, background:'rgba(37,99,235,0.08)', padding:'3px 10px', borderRadius:20, border:'1px solid rgba(37,99,235,0.2)'}}>
          Sub Admin
        </span>
        <button onClick={handleLogout} style={{background:'none', border:'none', cursor:'pointer', color:'#6b7280', padding:'6px'}}>
          <FaSignOutAlt size={16}/>
        </button>
      </header>

      <nav style={{
        display:'flex', gap:'8px', padding:'12px 16px',
        background:'#ffffff', borderBottom:'1px solid rgba(37,99,235,0.15)',
        boxShadow:'0 1px 4px rgba(37,99,235,0.05)'
      }}>
        {navItems.map(item => (
          <NavLink key={item.to} to={item.to}
            style={({isActive}) => ({
              display:'flex', alignItems:'center', gap:'6px',
              padding:'8px 16px', borderRadius:20, textDecoration:'none',
              fontSize:'14px', fontWeight:600, transition:'all 0.2s',
              background: isActive ? '#2563eb' : '#f0f4ff',
              color: isActive ? '#ffffff' : '#4b5563',
              border: isActive ? '1.5px solid #2563eb' : '1.5px solid rgba(37,99,235,0.2)',
            })}>
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <main style={{padding:'16px', maxWidth:'480px', margin:'0 auto'}}>
        {title && <h1 style={{fontFamily:'Rajdhani, sans-serif', fontSize:'22px', fontWeight:700, marginBottom:'16px', color:'#111827'}}>{title}</h1>}
        {children}
      </main>
    </div>
  );
}
