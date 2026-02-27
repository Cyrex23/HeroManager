import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, UserPlus, Mail, CheckCircle } from 'lucide-react';
import { register, resendConfirmation } from '../api/authApi';
import type { ErrorResponse } from '../types';
import { AxiosError } from 'axios';
import HeroManagerLogo from '../components/brand/HeroManagerLogo';
import ParticleBackground from '../components/effects/ParticleBackground';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);

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

  function fieldAnim(i: number) {
    return {
      initial: { opacity: 0, x: -16 },
      animate: { opacity: 1, x: 0 },
      transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' as const },
    };
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

          <p style={styles.tagline}>Begin Your Legend</p>

          <AnimatePresence mode="wait">
            {success ? (
              /* Success state */
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
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

                <h2 style={styles.successTitle}>Check Your Email</h2>

                <p style={styles.successText}>
                  We've sent a confirmation link to{' '}
                  <strong style={{ color: '#e0e0e0' }}>{email}</strong>
                </p>
                <p style={styles.successText}>
                  Click the link in your inbox to activate your account.
                </p>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  style={{ marginTop: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}
                >
                  <Link to="/login" style={styles.successBtn}>
                    <Mail size={15} />
                    Go to Login
                  </Link>

                  {resendSent ? (
                    <span style={{ color: '#4ade80', fontSize: 12 }}>Confirmation email resent!</span>
                  ) : (
                    <button
                      type="button"
                      disabled={resendLoading}
                      onClick={async () => {
                        setResendLoading(true);
                        try { await resendConfirmation(email); setResendSent(true); }
                        catch { /* silently ignore */ }
                        finally { setResendLoading(false); }
                      }}
                      style={styles.resendBtn}
                    >
                      {resendLoading ? <span className="spinner" style={{ width: 12, height: 12 }} /> : null}
                      Resend activation email
                    </button>
                  )}
                </motion.div>
              </motion.div>
            ) : (
              /* Registration form */
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
              >
                {/* Email */}
                <motion.div {...fieldAnim(0)}>
                  <label style={styles.label}>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="your@email.com"
                    className="fancy-input"
                    style={inputStyle}
                  />
                </motion.div>

                {/* Username */}
                <motion.div {...fieldAnim(1)}>
                  <label style={styles.label}>Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    minLength={3}
                    maxLength={30}
                    placeholder="3–30 characters"
                    className="fancy-input"
                    style={inputStyle}
                  />
                  {username.length > 0 && (
                    <div style={{ marginTop: 4, fontSize: 11, color: username.length >= 3 ? '#4ade80' : '#a0a0b0' }}>
                      {username.length} / 30 characters
                    </div>
                  )}
                </motion.div>

                {/* Password */}
                <motion.div {...fieldAnim(2)}>
                  <label style={styles.label}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      placeholder="Min 6 characters"
                      className="fancy-input"
                      style={{ ...inputStyle, paddingRight: 44 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={styles.eyeBtn}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </motion.div>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      style={styles.error}
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit */}
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.97 }}
                  className="btn-shimmer"
                  style={{
                    ...styles.submitBtn,
                    marginTop: 6,
                    background: loading
                      ? 'rgba(80,80,100,0.6)'
                      : 'linear-gradient(135deg, #e94560 0%, #b83050 50%, #f97316 100%)',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: loading ? 'none' : '0 4px 24px rgba(233,69,96,0.38)',
                  }}
                >
                  {loading ? (
                    <>
                      <span className="spinner" style={{ width: 16, height: 16 }} />
                      Creating your legend...
                    </>
                  ) : (
                    <>
                      <UserPlus size={16} />
                      Create Account
                    </>
                  )}
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>

          {!success && (
            <p style={styles.footer}>
              Already a hero?{' '}
              <Link to="/login" style={styles.link}>
                Log in
              </Link>
            </p>
          )}
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
    background: 'radial-gradient(circle, rgba(167,139,250,0.07) 0%, rgba(233,69,96,0.05) 40%, transparent 70%)',
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
    padding: '52px 44px 44px',
    boxShadow: '0 0 100px rgba(167,139,250,0.08), 0 40px 80px rgba(0,0,0,0.65)',
  },
  tagline: {
    textAlign: 'center',
    color: '#6a6a88',
    fontSize: 11,
    letterSpacing: '0.22em',
    textTransform: 'uppercase',
    marginBottom: 32,
    marginTop: 10,
    fontFamily: 'Cinzel, serif',
  },
  label: {
    display: 'block',
    fontSize: 11,
    color: '#7070a0',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    marginBottom: 7,
    fontWeight: 600,
    fontFamily: 'Inter, sans-serif',
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    color: '#555',
    cursor: 'pointer',
    padding: 4,
    lineHeight: 0,
  },
  error: {
    color: '#e94560',
    fontSize: 13,
    padding: '10px 14px',
    backgroundColor: 'rgba(233,69,96,0.09)',
    border: '1px solid rgba(233,69,96,0.2)',
    borderRadius: 8,
    lineHeight: 1.5,
  },
  submitBtn: {
    padding: '14px 0',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 700,
    fontFamily: 'Inter, sans-serif',
    letterSpacing: '0.04em',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    width: '100%',
  },
  footer: {
    textAlign: 'center',
    marginTop: 28,
    fontSize: 13,
    color: '#6a6a88',
  },
  link: {
    color: '#e94560',
    textDecoration: 'none',
    fontWeight: 600,
  },
  successTitle: {
    fontFamily: 'Cinzel, serif',
    color: '#4ade80',
    fontSize: 22,
    fontWeight: 700,
    marginBottom: 16,
  },
  successText: {
    color: '#a0a0b0',
    fontSize: 14,
    lineHeight: 1.65,
    marginBottom: 8,
  },
  successBtn: {
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
  resendBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: 'none', border: 'none', color: '#7070a0',
    fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
    textDecoration: 'underline', padding: 0,
  },
};
