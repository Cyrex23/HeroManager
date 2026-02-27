import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Loader, Mail, RefreshCw, LogIn } from 'lucide-react';
import { confirmEmail, resendConfirmation } from '../api/authApi';
import type { ErrorResponse } from '../types';
import { AxiosError } from 'axios';
import HeroManagerLogo from '../components/brand/HeroManagerLogo';
import ParticleBackground from '../components/effects/ParticleBackground';

export default function ConfirmPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'alreadyConfirmed' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resendStatus, setResendStatus] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
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
    setResendLoading(true);
    try {
      await resendConfirmation(resendEmail);
      setResendStatus('A new confirmation link has been sent if an unconfirmed account exists for that email.');
    } catch {
      setResendStatus('Failed to resend. Please try again.');
    } finally {
      setResendLoading(false);
    }
  }

  const isSuccess = status === 'success' || status === 'alreadyConfirmed';

  return (
    <div style={styles.page}>
      <ParticleBackground />
      <div style={{
        ...styles.ambientGlow,
        background: isSuccess
          ? 'radial-gradient(circle, rgba(74,222,128,0.07) 0%, transparent 70%)'
          : status === 'error'
          ? 'radial-gradient(circle, rgba(233,69,96,0.07) 0%, transparent 70%)'
          : 'radial-gradient(circle, rgba(96,165,250,0.07) 0%, transparent 70%)',
      }} />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        style={styles.cardWrap}
      >
        <div className="glass-strong" style={styles.card}>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
            <HeroManagerLogo size="md" linkTo="/login" />
          </div>

          <AnimatePresence mode="wait">

            {status === 'loading' && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={styles.statusBlock}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                  style={{ marginBottom: 20 }}
                >
                  <Loader size={48} color="#60a5fa" style={{ display: 'block', margin: '0 auto' }} />
                </motion.div>
                <h2 style={{ ...styles.statusTitle, color: '#60a5fa' }}>Confirming Your Email</h2>
                <p style={styles.statusText}>Please wait while we verify your account...</p>
              </motion.div>
            )}

            {isSuccess && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                style={styles.statusBlock}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 18 }}
                  style={{ marginBottom: 20 }}
                >
                  <CheckCircle size={56} color="#4ade80" style={{ display: 'block', margin: '0 auto' }} />
                </motion.div>
                <h2 style={{ ...styles.statusTitle, color: '#4ade80' }}>
                  {status === 'alreadyConfirmed' ? 'Already Confirmed' : 'Email Verified!'}
                </h2>
                <p style={styles.statusText}>{message}</p>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  style={{ marginTop: 28 }}
                >
                  <Link to="/login" style={styles.ctaBtn}>
                    <LogIn size={15} />
                    Enter the Realm
                  </Link>
                </motion.div>
              </motion.div>
            )}

            {status === 'error' && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                style={styles.statusBlock}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 18 }}
                  style={{ marginBottom: 20 }}
                >
                  <XCircle size={56} color="#e94560" style={{ display: 'block', margin: '0 auto' }} />
                </motion.div>
                <h2 style={{ ...styles.statusTitle, color: '#e94560' }}>Confirmation Failed</h2>
                <p style={styles.statusText}>{message}</p>

                <div style={styles.resendSection}>
                  <p style={{ ...styles.statusText, marginBottom: 4, fontSize: 13 }}>
                    Need a new confirmation link?
                  </p>
                  <input
                    type="email"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="fancy-input"
                    style={styles.resendInput}
                  />
                  <motion.button
                    onClick={handleResend}
                    disabled={resendLoading || !resendEmail}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="btn-shimmer"
                    style={{
                      ...styles.resendBtn,
                      opacity: resendLoading || !resendEmail ? 0.6 : 1,
                      cursor: resendLoading || !resendEmail ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {resendLoading
                      ? <span className="spinner" style={{ width: 14, height: 14 }} />
                      : <RefreshCw size={14} />
                    }
                    Resend Link
                  </motion.button>
                  {resendStatus && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{ color: '#a0a0b0', fontSize: 12, marginTop: 4, lineHeight: 1.5 }}
                    >
                      {resendStatus}
                    </motion.p>
                  )}
                </div>

                <Link to="/login" style={styles.backLink}>
                  <Mail size={13} />
                  Back to Login
                </Link>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    position: 'relative',
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  ambientGlow: {
    position: 'absolute',
    width: 700,
    height: 700,
    borderRadius: '50%',
    pointerEvents: 'none',
    zIndex: 1,
  },
  cardWrap: {
    position: 'relative',
    zIndex: 2,
    width: '100%',
    maxWidth: 440,
    padding: '0 20px',
  },
  card: {
    borderRadius: 22,
    padding: '48px 44px 44px',
    boxShadow: '0 0 100px rgba(0,0,0,0.5), 0 40px 80px rgba(0,0,0,0.65)',
  },
  statusBlock: {
    textAlign: 'center',
    paddingTop: 4,
  },
  statusTitle: {
    fontFamily: 'Cinzel, serif',
    fontSize: 22,
    fontWeight: 700,
    marginBottom: 14,
  },
  statusText: {
    color: '#a0a0b0',
    fontSize: 14,
    lineHeight: 1.65,
    marginBottom: 6,
  },
  ctaBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '13px 32px',
    background: 'linear-gradient(135deg, #e94560, #f97316)',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 700,
    textDecoration: 'none',
    boxShadow: '0 4px 24px rgba(233,69,96,0.35)',
  },
  resendSection: {
    marginTop: 24,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
  },
  resendInput: {
    padding: '11px 14px',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(8, 8, 22, 0.85)',
    color: '#e0e0e0',
    fontSize: 13,
    fontFamily: 'Inter, sans-serif',
    width: '100%',
  },
  resendBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    padding: '10px 22px',
    background: 'linear-gradient(135deg, #2a2a4a, #3a3a6a)',
    color: '#e0e0e0',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 600,
    fontFamily: 'Inter, sans-serif',
  },
  backLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    marginTop: 20,
    color: '#6a6a88',
    textDecoration: 'none',
    fontSize: 13,
  },
};
