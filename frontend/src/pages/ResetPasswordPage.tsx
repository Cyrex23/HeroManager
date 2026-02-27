import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, KeyRound, CheckCircle, AlertCircle } from 'lucide-react';
import { resetPassword } from '../api/authApi';
import { AxiosError } from 'axios';
import type { ErrorResponse } from '../types';
import HeroManagerLogo from '../components/brand/HeroManagerLogo';
import ParticleBackground from '../components/effects/ParticleBackground';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '13px 16px',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(8, 8, 22, 0.85)',
    color: '#e0e0e0',
    fontSize: 14,
    fontFamily: 'Inter, sans-serif',
    boxSizing: 'border-box',
  };

  async function handleSubmit() {
    setError('');
    if (!token) { setError('Invalid or missing reset token.'); return; }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (newPassword !== confirm) { setError('Passwords do not match.'); return; }

    setLoading(true);
    try {
      await resetPassword(token, newPassword);
      setSuccess(true);
    } catch (err) {
      const axiosErr = err as AxiosError<ErrorResponse>;
      setError(axiosErr.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

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
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
            <HeroManagerLogo size="lg" />
          </div>

          <p style={styles.tagline}>Reset Your Password</p>

          {!token ? (
            <div style={styles.errorBox}>
              <AlertCircle size={18} />
              Invalid reset link. Please request a new one.
            </div>
          ) : success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ textAlign: 'center', paddingTop: 8 }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.15, type: 'spring', stiffness: 300, damping: 18 }}
                style={{ marginBottom: 20 }}
              >
                <CheckCircle size={56} color="#4ade80" style={{ margin: '0 auto', display: 'block' }} />
              </motion.div>
              <h2 style={styles.successTitle}>Password Updated!</h2>
              <p style={styles.successText}>Your password has been reset. You can now log in with your new password.</p>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} style={{ marginTop: 28 }}>
                <Link to="/login" style={styles.successBtn}>
                  <KeyRound size={15} />
                  Go to Login
                </Link>
              </motion.div>
            </motion.div>
          ) : (
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
              onKeyDown={(e) => { if (e.key === 'Enter' && !loading) handleSubmit(); }}
            >
              {/* New password */}
              <div>
                <label style={styles.label}>New Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="fancy-input"
                    style={{ ...inputStyle, paddingRight: 44 }}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm */}
              <div>
                <label style={styles.label}>Confirm Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat your password"
                  className="fancy-input"
                  style={inputStyle}
                />
              </div>

              {error && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={styles.errorBox}>
                  {error}
                </motion.div>
              )}

              <motion.button
                type="button"
                onClick={handleSubmit}
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
                  <><span className="spinner" style={{ width: 16, height: 16 }} /> Resetting...</>
                ) : (
                  <><KeyRound size={16} /> Reset Password</>
                )}
              </motion.button>

              <p style={styles.footer}>
                <Link to="/login" style={styles.link}>Back to Login</Link>
              </p>
            </div>
          )}
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
  eyeBtn: {
    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', color: '#555', cursor: 'pointer', padding: 4, lineHeight: 0,
  },
  errorBox: {
    color: '#e94560', fontSize: 13, padding: '10px 14px',
    backgroundColor: 'rgba(233,69,96,0.09)', border: '1px solid rgba(233,69,96,0.2)',
    borderRadius: 8, lineHeight: 1.5, display: 'flex', alignItems: 'center', gap: 8,
  },
  submitBtn: {
    marginTop: 6, padding: '14px 0', color: '#fff', border: 'none', borderRadius: 12,
    fontSize: 15, fontWeight: 700, fontFamily: 'Inter, sans-serif', letterSpacing: '0.04em',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, width: '100%',
  },
  footer: { textAlign: 'center', marginTop: 4, fontSize: 13, color: '#6a6a88' },
  link: { color: '#e94560', textDecoration: 'none', fontWeight: 600 },
  successTitle: { fontFamily: 'Cinzel, serif', color: '#4ade80', fontSize: 22, fontWeight: 700, marginBottom: 16 },
  successText: { color: '#a0a0b0', fontSize: 14, lineHeight: 1.65, marginBottom: 8 },
  successBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 32px',
    background: 'linear-gradient(135deg, #e94560, #f97316)', color: '#fff', border: 'none',
    borderRadius: 12, fontSize: 15, fontWeight: 700, textDecoration: 'none',
    boxShadow: '0 4px 24px rgba(233,69,96,0.35)',
  },
};
