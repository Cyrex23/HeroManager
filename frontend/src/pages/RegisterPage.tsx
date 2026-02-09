import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { register } from '../api/authApi';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(email, username, password);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <h1 style={{ color: '#e94560', textAlign: 'center' }}>HeroManager</h1>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <h2 style={{ color: '#4caf50' }}>Registration Successful!</h2>
            <p>Please check your email (<strong>{email}</strong>) for a confirmation link.</p>
            <Link to="/login" style={linkStyle}>Go to Login</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h1 style={{ color: '#e94560', textAlign: 'center' }}>HeroManager</h1>
        <h2 style={{ textAlign: 'center' }}>Register</h2>
        {error && <div style={errorStyle}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={fieldStyle}>
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} />
          </div>
          <div style={fieldStyle}>
            <label>Username</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} required minLength={3} maxLength={30} style={inputStyle} />
          </div>
          <div style={fieldStyle}>
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} style={inputStyle} />
          </div>
          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '15px' }}>
          Already have an account? <Link to="/login" style={linkStyle}>Login</Link>
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
