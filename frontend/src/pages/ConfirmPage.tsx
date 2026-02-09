import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { confirmEmail, resendConfirmation } from '../api/authApi';

export default function ConfirmPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resendSent, setResendSent] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No confirmation token provided.');
      return;
    }
    confirmEmail(token)
      .then(data => {
        setStatus('success');
        setMessage(data.message);
      })
      .catch(err => {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Confirmation failed.');
      });
  }, [token]);

  const handleResend = async () => {
    if (!resendEmail) return;
    try {
      await resendConfirmation(resendEmail);
      setResendSent(true);
    } catch {
      // always succeeds per API contract
    }
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h1 style={{ color: '#e94560', textAlign: 'center' }}>HeroManager</h1>
        {status === 'loading' && <p style={{ textAlign: 'center' }}>Confirming your account...</p>}
        {status === 'success' && (
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ color: '#4caf50' }}>Account Confirmed!</h2>
            <p>{message}</p>
            <Link to="/login" style={linkStyle}>Go to Login</Link>
          </div>
        )}
        {status === 'error' && (
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ color: '#ff4444' }}>Confirmation Failed</h2>
            <p>{message}</p>
            <div style={{ marginTop: '20px' }}>
              <p>Need a new confirmation link?</p>
              <input
                type="email"
                placeholder="Enter your email"
                value={resendEmail}
                onChange={e => setResendEmail(e.target.value)}
                style={inputStyle}
              />
              <button onClick={handleResend} style={buttonStyle} disabled={resendSent}>
                {resendSent ? 'Link Sent!' : 'Resend Confirmation'}
              </button>
            </div>
            <Link to="/login" style={{ ...linkStyle, display: 'block', marginTop: '15px' }}>Back to Login</Link>
          </div>
        )}
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
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #0f3460',
  backgroundColor: '#0f3460', color: '#eee', fontSize: '14px', boxSizing: 'border-box',
  marginBottom: '10px',
};
const buttonStyle: React.CSSProperties = {
  width: '100%', padding: '12px', backgroundColor: '#e94560', color: '#fff',
  border: 'none', borderRadius: '5px', fontSize: '16px', cursor: 'pointer',
};
const linkStyle: React.CSSProperties = { color: '#e94560', textDecoration: 'none' };
