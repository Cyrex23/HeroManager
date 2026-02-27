import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Swords, Mail, CheckCircle } from 'lucide-react';
import { login, forgotPassword } from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import type { ErrorResponse } from '../types';
import { AxiosError } from 'axios';
import HeroManagerLogo from '../components/brand/HeroManagerLogo';
import ParticleBackground from '../components/effects/ParticleBackground';

export default function LoginPage() {
  const [loginField, setLoginField] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const navigate = useNavigate();

  // Forgot password state
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotError, setForgotError] = useState('');

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

  async function handleForgotPassword() {
    setForgotError('');
    if (!forgotEmail.trim()) { setForgotError('Please enter your email address.'); return; }
    setForgotLoading(true);
    try {
      await forgotPassword(forgotEmail.trim());
      setForgotSent(true);
    } catch {
      setForgotError('Something went wrong. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '13px 16px',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(8, 8, 22, 0.85)',
    color: '#e0e0e0',
    fontSize: 14,
    fontFamily: 'Inter, sans-serif',
  };

  return (
    <div style={styles.page}>
      <ParticleBackground />
      <div style={styles.ambientGlow} />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        style={styles.cardWrap}
      >
        <div className="glass-strong" style={styles.card}>

          {/* Brand logo */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
            <HeroManagerLogo size="lg" />
          </div>

          <p style={styles.tagline}>Enter the Realm</p>

          {/* Login form */}
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
            onKeyDown={(e) => { if (e.key === 'Enter' && !loading && !forgotOpen) handleLogin(); }}
          >
            <div>
              <label style={styles.label}>Email or Username</label>
              <input
                type="text"
                value={loginField}
                onChange={(e) => setLoginField(e.target.value)}
                placeholder="Enter email or username"
                className="fancy-input"
                style={inputStyle}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 7 }}>
                <label style={{ ...styles.label, marginBottom: 0 }}>Password</label>
                <button
                  type="button"
                  onClick={() => { setForgotOpen((o) => !o); setForgotSent(false); setForgotError(''); }}
                  style={styles.forgotLink}
                >
                  Forgot password?
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="fancy-input"
                  style={{ ...inputStyle, paddingRight: 44 }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Inline forgot-password panel */}
            <AnimatePresence>
              {forgotOpen && (
                <motion.div
                  key="forgot"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={styles.forgotBox}>
                    {forgotSent ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <CheckCircle size={18} color="#4ade80" style={{ flexShrink: 0 }} />
                        <span style={{ color: '#4ade80', fontSize: 13 }}>
                          If an account exists for that email, a reset link has been sent.
                        </span>
                      </div>
                    ) : (
                      <>
                        <p style={styles.forgotDesc}>Enter your email and we'll send you a reset link.</p>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input
                            type="email"
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleForgotPassword(); }}
                            placeholder="your@email.com"
                            className="fancy-input"
                            style={{ ...inputStyle, fontSize: 13, padding: '10px 12px', flex: 1 }}
                          />
                          <button
                            type="button"
                            onClick={handleForgotPassword}
                            disabled={forgotLoading}
                            style={styles.forgotSendBtn}
                          >
                            {forgotLoading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Mail size={14} />}
                            Send
                          </button>
                        </div>
                        {forgotError && (
                          <div style={{ color: '#e94560', fontSize: 12, marginTop: 4 }}>{forgotError}</div>
                        )}
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={styles.error}>
                {error}
              </motion.div>
            )}

            <motion.button
              type="button"
              onClick={handleLogin}
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.97 }}
              className="btn-shimmer"
              style={{
                ...styles.submitBtn,
                background: loading ? 'rgba(80,80,100,0.6)' : 'linear-gradient(135deg, #e94560 0%, #b83050 50%, #f97316 100%)',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 24px rgba(233,69,96,0.38)',
              }}
            >
              {loading ? (
                <><span className="spinner" style={{ width: 16, height: 16 }} /> Entering realm...</>
              ) : (
                <><Swords size={16} /> Enter the Realm</>
              )}
            </motion.button>
          </div>

          <p style={styles.footer}>
            New adventurer?{' '}
            <Link to="/register" style={styles.link}>Create account</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    position: 'relative', width: '100%', height: '100%',
    display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  ambientGlow: {
    position: 'absolute', width: 700, height: 700, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(233,69,96,0.07) 0%, rgba(167,139,250,0.04) 40%, transparent 70%)',
    pointerEvents: 'none', zIndex: 1,
  },
  cardWrap: { position: 'relative', zIndex: 2, width: '100%', maxWidth: 430, padding: '0 20px' },
  card: { borderRadius: 22, padding: '52px 44px 44px', boxShadow: '0 0 100px rgba(233,69,96,0.10), 0 40px 80px rgba(0,0,0,0.65)' },
  tagline: {
    textAlign: 'center', color: '#6a6a88', fontSize: 11, letterSpacing: '0.22em',
    textTransform: 'uppercase', marginBottom: 36, marginTop: 10, fontFamily: 'Cinzel, serif',
  },
  label: {
    display: 'block', fontSize: 11, color: '#7070a0', textTransform: 'uppercase',
    letterSpacing: '0.12em', marginBottom: 7, fontWeight: 600, fontFamily: 'Inter, sans-serif',
  },
  forgotLink: {
    background: 'none', border: 'none', color: '#e94560', fontSize: 11,
    fontWeight: 600, cursor: 'pointer', padding: 0, fontFamily: 'Inter, sans-serif',
    textDecoration: 'underline', opacity: 0.8,
  },
  forgotBox: {
    backgroundColor: 'rgba(233,69,96,0.05)',
    border: '1px solid rgba(233,69,96,0.15)',
    borderRadius: 10,
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 10,
  },
  forgotDesc: { margin: 0, color: '#8888a8', fontSize: 12, fontFamily: 'Inter, sans-serif' },
  forgotSendBtn: {
    display: 'flex', alignItems: 'center', gap: 5, padding: '10px 14px',
    background: 'rgba(233,69,96,0.15)', border: '1px solid rgba(233,69,96,0.3)',
    borderRadius: 8, color: '#e94560', fontSize: 12, fontWeight: 700,
    cursor: 'pointer', fontFamily: 'Inter, sans-serif', flexShrink: 0, whiteSpace: 'nowrap' as const,
  },
  eyeBtn: {
    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', color: '#555', cursor: 'pointer', padding: 4, lineHeight: 0, transition: 'color 0.2s',
  },
  error: {
    color: '#e94560', fontSize: 13, padding: '10px 14px',
    backgroundColor: 'rgba(233,69,96,0.09)', border: '1px solid rgba(233,69,96,0.2)',
    borderRadius: 8, lineHeight: 1.5,
  },
  submitBtn: {
    marginTop: 6, padding: '14px 0', color: '#fff', border: 'none', borderRadius: 12,
    fontSize: 15, fontWeight: 700, fontFamily: 'Inter, sans-serif', letterSpacing: '0.04em',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, width: '100%',
  },
  footer: { textAlign: 'center', marginTop: 28, fontSize: 13, color: '#6a6a88' },
  link: { color: '#e94560', textDecoration: 'none', fontWeight: 600 },
};
