import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import type { ErrorResponse } from '../types';
import { AxiosError } from 'axios';

export default function LoginPage() {
  const [loginField, setLoginField] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const navigate = useNavigate();

  async function handleLogin() {
    setError('');
    setLoading(true);

    try {
      const res = await login({ login: loginField, password });
      auth.login(res.token, res.playerId, res.username);
      navigate('/team', { replace: true });
    } catch (err) {
      const axiosErr = err as AxiosError<ErrorResponse>;
      const errorCode = axiosErr.response?.data?.error;
      const errorMsg = axiosErr.response?.data?.message;

      if (errorCode === 'EMAIL_NOT_CONFIRMED') {
        setError('Please confirm your email before logging in. Check your inbox for the confirmation link.');
      } else {
        setError(errorMsg || 'Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.card}>
      <h1 style={styles.title}>HeroManager</h1>
      <p style={styles.subtitle}>Log in to manage your heroes</p>
      <div
        style={styles.form}
        onKeyDown={(e) => { if (e.key === 'Enter' && !loading) handleLogin(); }}
      >
        <div style={styles.field}>
          <label style={styles.label}>Email or Username</label>
          <input
            type="text"
            value={loginField}
            onChange={(e) => setLoginField(e.target.value)}
            style={styles.input}
            placeholder="Enter email or username"
          />
        </div>
        <div style={styles.field}>
          <label style={styles.label}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            placeholder="Enter password"
          />
        </div>
        {error && <div style={styles.error}>{error}</div>}
        <button
          type="button"
          onClick={handleLogin}
          disabled={loading}
          style={{ ...styles.button, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          {loading ? 'Logging in...' : 'Log In'}
        </button>
      </div>
      <p style={styles.footer}>
        Don't have an account? <Link to="/register" style={styles.link}>Register</Link>
      </p>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    padding: 32,
    width: 380,
    boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
  },
  title: {
    color: '#e94560',
    margin: '0 0 4px',
    fontSize: 28,
    textAlign: 'center',
  },
  subtitle: {
    color: '#a0a0b0',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  label: {
    fontSize: 13,
    color: '#a0a0b0',
  },
  input: {
    padding: '10px 12px',
    borderRadius: 4,
    border: '1px solid #333',
    backgroundColor: '#0f0f23',
    color: '#e0e0e0',
    fontSize: 14,
    outline: 'none',
  },
  error: {
    color: '#e94560',
    fontSize: 13,
    padding: '8px 12px',
    backgroundColor: 'rgba(233, 69, 96, 0.1)',
    borderRadius: 4,
  },
  button: {
    padding: '12px 0',
    backgroundColor: '#e94560',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    fontSize: 15,
    fontWeight: 600,
    marginTop: 8,
  },
  footer: {
    textAlign: 'center',
    marginTop: 16,
    fontSize: 13,
    color: '#a0a0b0',
  },
  link: {
    color: '#e94560',
    textDecoration: 'none',
  },
};
