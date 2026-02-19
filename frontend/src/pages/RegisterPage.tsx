import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { register } from '../api/authApi';
import type { ErrorResponse } from '../types';
import { AxiosError } from 'axios';

const spinKeyframes = `
@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
`;

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register({ email, username, password });
      setSuccess(true);
    } catch (err) {
      const axiosErr = err as AxiosError<ErrorResponse>;
      setError(axiosErr.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div style={styles.card}>
        <h1 style={styles.title}>Check Your Email</h1>
        <p style={styles.text}>
          Registration successful! We've sent a confirmation link to <strong>{email}</strong>.
        </p>
        <p style={styles.text}>Please check your email and click the link to activate your account.</p>
        <Link to="/login" style={styles.link}>Go to Login</Link>
      </div>
    );
  }

  return (
    <div style={styles.card}>
      <style>{spinKeyframes}</style>
      <h1 style={styles.title}>Create Account</h1>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.field}>
          <label style={styles.label}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
            placeholder="your@email.com"
          />
        </div>
        <div style={styles.field}>
          <label style={styles.label}>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            minLength={3}
            maxLength={30}
            style={styles.input}
            placeholder="3-30 characters"
          />
        </div>
        <div style={styles.field}>
          <label style={styles.label}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            style={styles.input}
            placeholder="Min 6 characters"
          />
        </div>
        {error && <div style={styles.error}>{error}</div>}
        <button type="submit" disabled={loading} style={{
          ...styles.button,
          opacity: loading ? 0.8 : 1,
          cursor: loading ? 'not-allowed' : 'pointer',
        }}>
          {loading ? (
            <span style={styles.buttonContent}>
              <span style={styles.spinner} />
              Creating Account...
            </span>
          ) : 'Register'}
        </button>
      </form>
      <p style={styles.footer}>
        Already have an account? <Link to="/login" style={styles.link}>Log in</Link>
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
    margin: '0 0 24px',
    fontSize: 24,
    textAlign: 'center',
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
    cursor: 'pointer',
    marginTop: 8,
  },
  buttonContent: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
  },
  spinner: {
    display: 'inline-block',
    width: 15,
    height: 15,
    border: '2px solid rgba(255,255,255,0.35)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    animation: 'spin 0.75s linear infinite',
    flexShrink: 0,
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
  text: {
    color: '#a0a0b0',
    fontSize: 14,
    lineHeight: 1.6,
    marginBottom: 12,
  },
};
