import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { username, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 20px',
      backgroundColor: '#1a1a2e',
      color: '#eee',
      borderBottom: '2px solid #e94560',
    }}>
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <Link to="/team" style={{ color: '#e94560', fontWeight: 'bold', fontSize: '1.2em', textDecoration: 'none' }}>
          HeroManager
        </Link>
        <Link to="/team" style={{ color: '#eee', textDecoration: 'none' }}>Team</Link>
        <Link to="/shop" style={{ color: '#eee', textDecoration: 'none' }}>Shop</Link>
        <Link to="/arena" style={{ color: '#eee', textDecoration: 'none' }}>Arena</Link>
      </div>
      <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
        <span>{username}</span>
        <button onClick={handleLogout} style={{
          backgroundColor: '#e94560',
          color: '#fff',
          border: 'none',
          padding: '6px 14px',
          borderRadius: '4px',
          cursor: 'pointer',
        }}>
          Logout
        </button>
      </div>
    </nav>
  );
}
