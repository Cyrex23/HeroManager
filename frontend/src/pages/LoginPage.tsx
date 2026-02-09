import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../api/authApi';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [loginStr, setLoginStr] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(loginStr, password);
      authLogin(data.token, data.playerId, data.username);
      navigate('/team');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h1 style={{ color: '#e94560', textAlign: 'center' }}>HeroManager</h1>
        <h2 style={{ textAlign: 'center' }}>Login</h2>
        {error && <div style={errorStyle}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={fieldStyle}>
            <label>Email or Username</label>
            <input type="text" value={loginStr} onChange={e => setLoginStr(e.target.value)} required style={inputStyle} />
          </div>
          <div style={fieldStyle}>
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={inputStyle} />
          </div>
          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '15px' }}>
          Don't have an account? <Link to="/register" style={linkStyle}>Register</Link>
        </p>
      </div>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  display: 'flex', justifyContent: 'center', alignItems: 'center',
  minHeight: '100vh', backgroundColor: '#1a1a2e', color: '#eee',
};
const cardStyle: React.CSSProperties = {
  backgroundColor: '#16213e', padding: '40px', borderRadius: '10px',
  border: '1px solid #0f3460', width: '400px',
};
const fieldStyle: React.CSSProperties = { marginBottom: '15px' };
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #0f3460',
  backgroundColor: '#0f3460', color: '#eee', fontSize: '14px', boxSizing: 'border-box',
};
const buttonStyle: React.CSSProperties = {
  width: '100%', padding: '12px', backgroundColor: '#e94560', color: '#fff',
  border: 'none', borderRadius: '5px', fontSize: '16px', cursor: 'pointer',
};
const errorStyle: React.CSSProperties = {
  backgroundColor: '#ff4444', color: '#fff', padding: '10px', borderRadius: '5px',
  marginBottom: '15px', textAlign: 'center',
};
const linkStyle: React.CSSProperties = { color: '#e94560', textDecoration: 'none' };
