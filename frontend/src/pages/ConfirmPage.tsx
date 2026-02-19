import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { confirmEmail, resendConfirmation } from '../api/authApi';
import type { ErrorResponse } from '../types';
import { AxiosError } from 'axios';

export default function ConfirmPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'alreadyConfirmed' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resendStatus, setResendStatus] = useState('');
  const hasCalledRef = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No confirmation token provided.');
      return;
    }

    if (hasCalledRef.current) return;
    hasCalledRef.current = true;

    confirmEmail(token)
      .then((data) => {
        if (data.alreadyConfirmed) {
          setStatus('alreadyConfirmed');
          setMessage(data.message || 'Your email is already confirmed. You can log in.');
        } else {
          setStatus('success');
          setMessage(data.message || 'Email confirmed successfully! You can now log in.');
        }
      })
      .catch((err: AxiosError<ErrorResponse>) => {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Confirmation failed. The link may be invalid or expired.');
      });
  }, [token]);

  async function handleResend() {
    if (!resendEmail) return;
    try {
      await resendConfirmation(resendEmail);
      setResendStatus('A new confirmation link has been sent if an unconfirmed account exists for that email.');
    } catch {
      setResendStatus('Failed to resend. Please try again.');
    }
  }

  return (
    <div style={styles.card}>
      <h1 style={styles.title}>Email Confirmation</h1>

      {status === 'loading' && <p style={styles.text}>Confirming your email...</p>}

      {status === 'success' && (
        <>
          <p style={styles.successText}>{message}</p>
          <Link to="/login" style={styles.button}>Go to Login</Link>
        </>
      )}

      {status === 'alreadyConfirmed' && (
        <>
          <p style={styles.successText}>{message}</p>
          <Link to="/login" style={styles.button}>Go to Login</Link>
        </>
      )}

      {status === 'error' && (
        <>
          <p style={styles.errorText}>{message}</p>
          <div style={styles.resendSection}>
            <p style={styles.text}>Need a new confirmation link?</p>
            <input
              type="email"
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
              placeholder="Enter your email"
              style={styles.input}
            />
            <button onClick={handleResend} style={styles.resendButton}>
              Resend Confirmation
            </button>
            {resendStatus && <p style={styles.text}>{resendStatus}</p>}
          </div>
          <Link to="/login" style={styles.link}>Back to Login</Link>
        </>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    padding: 32,
    width: 400,
    boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
    textAlign: 'center',
  },
  title: {
    color: '#e94560',
    margin: '0 0 24px',
    fontSize: 24,
  },
  text: {
    color: '#a0a0b0',
    fontSize: 14,
    marginBottom: 12,
  },
  successText: {
    color: '#4ade80',
    fontSize: 15,
    marginBottom: 24,
  },
  errorText: {
    color: '#e94560',
    fontSize: 15,
    marginBottom: 24,
  },
  button: {
    display: 'inline-block',
    padding: '12px 24px',
    backgroundColor: '#e94560',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    fontSize: 15,
    fontWeight: 600,
    textDecoration: 'none',
    cursor: 'pointer',
  },
  resendSection: {
    marginTop: 16,
    marginBottom: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    alignItems: 'center',
  },
  input: {
    padding: '10px 12px',
    borderRadius: 4,
    border: '1px solid #333',
    backgroundColor: '#0f0f23',
    color: '#e0e0e0',
    fontSize: 14,
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  resendButton: {
    padding: '8px 16px',
    backgroundColor: '#16213e',
    color: '#e0e0e0',
    border: '1px solid #333',
    borderRadius: 4,
    fontSize: 13,
    cursor: 'pointer',
  },
  link: {
    color: '#e94560',
    textDecoration: 'none',
    fontSize: 13,
  },
};
