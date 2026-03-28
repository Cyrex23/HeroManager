import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { getSummon, sellSummon, halveSummonCapacity } from '../api/playerApi';
import { usePlayer } from '../context/PlayerContext';
import { useLanguage } from '../context/LanguageContext';
import type { SummonResponse } from '../types';
import HeroPortrait from '../components/Hero/HeroPortrait';
import CapBadge from '../components/Hero/CapBadge';
import { SUMMON_STAT_CONFIG } from '../utils/summonStatConfig';

if (typeof document !== 'undefined') {
  const id = 'summon-detail-css';
  if (!document.getElementById(id)) {
    const el = document.createElement('style');
    el.id = id;
    el.textContent = `
      @keyframes summonXpShimmer {
        0%   { transform: translateX(-180%) skewX(-18deg); opacity: 0; }
        15%  { opacity: 1; }
        85%  { opacity: 1; }
        100% { transform: translateX(380%) skewX(-18deg); opacity: 0; }
      }
      @keyframes summonXpBreathe {
        0%, 100% { filter: brightness(1); }
        50%       { filter: brightness(1.35); }
      }
      @keyframes summonLvlFlow {
        0%, 100% { background-position: 0% 0%; }
        50%       { background-position: 0% 100%; }
      }
      .summon-detail-lvl {
        background: linear-gradient(180deg, #c8c8c8 0%, #ff6b85 45%, #b01c32 100%);
        background-size: 100% 200%;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        filter:
          drop-shadow(0  1px 0 rgba(0,0,0,0.95))
          drop-shadow(0 -1px 0 rgba(0,0,0,0.85))
          drop-shadow( 1px 0 0 rgba(0,0,0,0.85))
          drop-shadow(-1px 0 0 rgba(0,0,0,0.85))
          drop-shadow(0  2px 6px rgba(0,0,0,0.75));
        animation: summonLvlFlow 2.4s ease-in-out infinite;
      }
    `;
    document.head.appendChild(el);
  }
}

const SUMMON_STAT_COLOR: Record<string, string> = {
  magicPower:       '#60a5fa',
  magicProficiency: '#a78bfa',
  spellMastery:     '#c4b5fd',
};

export default function SummonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fetchPlayer } = usePlayer();
  const { t } = useLanguage();
  const [summon, setSummon] = useState<SummonResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [confirmSell, setConfirmSell] = useState(false);
  const [confirmHalve, setConfirmHalve] = useState(false);

  const summonId = Number(id);

  const refresh = useCallback(async () => {
    try {
      const data = await getSummon(summonId);
      setSummon(data);
    } catch {
      setError(t('sd_err_load'));
    } finally {
      setLoading(false);
    }
  }, [summonId]);

  useEffect(() => { refresh(); }, [refresh]);

  async function handleSell() {
    setError(''); setMessage('');
    try {
      const res = await sellSummon(summonId);
      setMessage(res.message);
      await fetchPlayer();
      navigate('/team');
    } catch {
      setError(t('sd_err_sell'));
    } finally {
      setConfirmSell(false);
    }
  }

  async function handleHalve() {
    setError(''); setMessage('');
    try {
      const res = await halveSummonCapacity(summonId);
      setMessage(res.message);
      await Promise.all([refresh(), fetchPlayer()]);
    } catch {
      setError(t('sd_err_halve'));
    } finally {
      setConfirmHalve(false);
    }
  }

  if (loading) return (
    <div style={{ color: '#a0a0b0', display: 'flex', alignItems: 'center', gap: 10 }}>
      <span className="spinner" style={{ width: 18, height: 18 }} />{t('sd_loading')}
    </div>
  );
  if (!summon) return <div style={{ color: '#e94560' }}>{t('sd_not_found')}</div>;

  const xpPct = summon.xpToNextLevel > 0
    ? Math.min((summon.currentXp / summon.xpToNextLevel) * 100, 100) : 0;

  return (
    <div>
      {/* Sell confirmation */}
      {confirmSell && (
        <div style={styles.confirmOverlay}>
          <div style={styles.confirmCard}>
            <div style={styles.confirmTitle}>{t('sd_sell_title')}</div>
            <div style={styles.confirmName}>{summon.name}</div>
            <div style={styles.confirmSub}>
              {t('sd_sell_sub').split('{price}')[0]}
              <strong style={{ color: '#fbbf24' }}>{summon.sellPrice}g</strong>
              {t('sd_sell_sub').split('{price}')[1]}
            </div>
            <div style={styles.confirmBtns}>
              <button style={styles.confirmYes} onClick={handleSell}>{t('sd_sell_btn')}</button>
              <button style={styles.confirmNo} onClick={() => setConfirmSell(false)}>{t('sd_cancel_btn')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Halve-capacity confirmation */}
      {confirmHalve && (
        <div style={styles.confirmOverlay}>
          <div style={styles.confirmCard}>
            <div style={styles.confirmTitle}>{t('sd_halve_title')}</div>
            <div style={styles.confirmName}>{summon.name}</div>
            <div style={styles.confirmSub}>
              {t('sd_halve_sub_from')} <strong style={{ color: '#a78bfa' }}>{summon.capacity}</strong> {t('sd_halve_sub_to')}{' '}
              <strong style={{ color: '#a78bfa' }}>{Math.max(1, Math.floor(summon.capacity / 2))}</strong>.
              <br />{t('sd_halve_sub_cost').split('{price}')[0]}<strong style={{ color: '#fbbf24' }}>{summon.sellPrice}g</strong>{t('sd_halve_sub_cost').split('{price}')[1]}
            </div>
            <div style={styles.confirmBtns}>
              <button style={styles.confirmYes} onClick={handleHalve}>{t('sd_halve_btn')}</button>
              <button style={styles.confirmNo} onClick={() => setConfirmHalve(false)}>{t('sd_cancel_btn')}</button>
            </div>
          </div>
        </div>
      )}

      <Link to="/team" style={styles.backLink}>
        <ChevronLeft size={14} style={{ flexShrink: 0 }} />
        {t('sd_back')}
      </Link>


      {message && <div style={styles.success}>{message}</div>}
      {error   && <div style={styles.error}>{error}</div>}

      {/* ── Header ── */}
      <div style={styles.header}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <HeroPortrait imagePath={summon.imagePath} name={summon.name} size={160} />
          <span className="summon-detail-lvl" style={styles.portraitLvlBadge}>{summon.level}</span>
          <div style={styles.xpBarBg}>
            <div style={{ ...styles.xpBarFill, width: `${xpPct}%` }}>
              {xpPct > 5 && <div style={styles.xpShimmer} />}
            </div>
            <div style={styles.xpBarCenter}>
              <span style={styles.xpBarText}>{Math.round(xpPct)}%</span>
            </div>
          </div>
        </div>

        <div style={styles.headerInfo}>
          <h2 style={styles.summonName} className="gradient-title">{summon.name}</h2>
          <CapBadge value={summon.capacity} />
          <div style={styles.equippedStatus}>
            {summon.isEquipped ? t('sd_equipped') : t('sd_on_bench')}
          </div>
          <div style={styles.xpBlock}>
            <div style={styles.xpTopRow}>
              <span style={styles.xpLabel}>EXP</span>
              <span style={styles.xpFraction}>
                <span style={styles.xpCurrent}>{summon.currentXp}</span>
                <span style={styles.xpSep}> / </span>
                <span style={styles.xpMax}>{summon.xpToNextLevel}</span>
              </span>
              <span style={styles.xpPctBadge}>{Math.round(xpPct)}%</span>
            </div>
            <div style={styles.xpTrackBg}>
              <div style={{ ...styles.xpTrackFill, width: `${xpPct}%` }}>
                <div style={styles.xpTrackShine} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>{t('sd_section_stats')}</div>
        <div style={styles.statTable}>
          <div style={styles.statHeaderRow}>
            <span style={styles.statHeaderAttr}>{t('sd_attr_header')}</span>
            <span style={styles.statHeaderNum}>{t('sd_value_header')}</span>
          </div>
          {Object.entries(summon.stats)
            .filter(([key]) => SUMMON_STAT_CONFIG[key])
            .map(([key, raw]) => {
              const cfg = SUMMON_STAT_CONFIG[key];
              const color = SUMMON_STAT_COLOR[key] ?? '#e0e0e0';
              let display = '—';
              if (raw !== undefined) {
                display = cfg.pct ? Math.round(raw) + '%' : raw.toFixed(1);
              }
              return (
                <div key={key} style={styles.statRow}>
                  <span style={{ ...styles.statLabel, color }}>{cfg.label}</span>
                  <span style={styles.statValue}>{display}</span>
                </div>
              );
            })}
        </div>
      </div>


      {/* ── Actions ── */}
      <div style={styles.actionsRow}>
        <button
          style={{ ...styles.halveCapBtn, ...(summon.capacityHalved ? styles.halveCapBtnDone : {}) }}
          disabled={summon.capacityHalved}
          onClick={() => !summon.capacityHalved && setConfirmHalve(true)}
          title={summon.capacityHalved ? t('sd_already_halved') : undefined}
        >
          {t('sd_halve_cap_btn')}
        </button>
        <span style={styles.halveCapPrice}>
          {summon.capacityHalved ? t('sd_halve_cap_done') : `💰 ${summon.sellPrice}g`}
        </span>

        <div style={styles.sep} />

        <button style={styles.sellBtn} onClick={() => setConfirmSell(true)}>
          {t('sd_sell_summon_btn')}
        </button>
        <span style={styles.sellPrice}>💰 {summon.sellPrice}g</span>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  backLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    marginBottom: 20,
    padding: '6px 14px 6px 10px',
    borderRadius: 20,
    border: '1px solid rgba(167,139,250,0.25)',
    background: 'linear-gradient(135deg, rgba(167,139,250,0.07) 0%, rgba(96,165,250,0.05) 100%)',
    color: '#a78bfa',
    textDecoration: 'none',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.04em',
    textTransform: 'uppercase' as const,
    fontFamily: 'Inter, sans-serif',
    transition: 'border-color 0.15s, background 0.15s',
  },
  success: {
    backgroundColor: 'rgba(74,222,128,0.1)',
    border: '1px solid rgba(74,222,128,0.3)',
    color: '#4ade80',
    borderRadius: 6,
    padding: '8px 14px',
    fontSize: 13,
    marginBottom: 12,
  },
  error: {
    backgroundColor: 'rgba(233,69,96,0.1)',
    border: '1px solid rgba(233,69,96,0.3)',
    color: '#e94560',
    borderRadius: 6,
    padding: '8px 14px',
    fontSize: 13,
    marginBottom: 12,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 28,
    marginBottom: 28,
  },
  portraitLvlBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    fontSize: 22,
    fontWeight: 900,
    fontStyle: 'italic',
    lineHeight: 1,
    letterSpacing: '-0.01em',
    fontFamily: 'Inter, sans-serif',
    pointerEvents: 'none',
    zIndex: 5,
  },
  xpBarBg: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 19,
    backgroundColor: 'rgba(0,0,0,0.5)',
    overflow: 'hidden',
    zIndex: 4,
  },
  xpBarFill: {
    position: 'absolute' as const,
    top: 0, left: 0,
    height: '100%',
    background: 'linear-gradient(90deg, #78350f, #d97706, #fbbf24)',
    animation: 'summonXpBreathe 2.2s ease-in-out infinite',
    boxShadow: '0 0 6px rgba(251,191,36,0.8)',
    overflow: 'hidden',
    transition: 'width 0.55s cubic-bezier(0.22, 1, 0.36, 1)',
  },
  xpShimmer: {
    position: 'absolute' as const,
    top: 0, bottom: 0,
    width: '35%',
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.38), transparent)',
    animation: 'summonXpShimmer 2.6s ease-in-out infinite',
  },
  xpBarCenter: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
    zIndex: 5,
  },
  xpBarText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: '0.04em',
    textShadow: '0 1px 2px rgba(0,0,0,0.95)',
    fontFamily: 'Inter, sans-serif',
    lineHeight: 1,
  },
  headerInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    alignItems: 'flex-start',
  },
  summonName: {
    margin: 0,
    fontSize: 28,
    fontWeight: 800,
    letterSpacing: '-0.02em',
  },
  equippedStatus: {
    color: '#4ade80',
    fontSize: 13,
  },
  xpBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
    marginTop: 2,
    minWidth: 180,
  },
  xpTopRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
  },
  xpLabel: {
    fontSize: 9,
    fontWeight: 900,
    letterSpacing: '0.12em',
    color: '#fbbf24',
    textTransform: 'uppercase' as const,
    fontFamily: 'Inter, sans-serif',
    textShadow: '0 0 8px rgba(251,191,36,0.6)',
  },
  xpFraction: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Inter, sans-serif',
    fontVariantNumeric: 'tabular-nums',
  },
  xpCurrent: {
    color: '#fde68a',
    fontWeight: 800,
  },
  xpSep: {
    color: '#44446a',
    fontWeight: 400,
  },
  xpMax: {
    color: '#666688',
    fontWeight: 600,
  },
  xpPctBadge: {
    fontSize: 10,
    fontWeight: 800,
    color: '#fbbf24',
    fontFamily: 'Inter, sans-serif',
    background: 'rgba(251,191,36,0.1)',
    border: '1px solid rgba(251,191,36,0.25)',
    borderRadius: 4,
    padding: '1px 5px',
    letterSpacing: '0.04em',
  },
  xpTrackBg: {
    width: '100%',
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 99,
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.04)',
  },
  xpTrackFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #92400e, #d97706, #fbbf24)',
    borderRadius: 99,
    boxShadow: '0 0 6px rgba(251,191,36,0.7)',
    position: 'relative' as const,
    overflow: 'hidden',
    transition: 'width 0.6s cubic-bezier(0.22,1,0.36,1)',
  },
  xpTrackShine: {
    position: 'absolute' as const,
    top: 0, left: '-60%',
    width: '50%', height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)',
    animation: 'summonXpShimmer 2.6s ease-in-out infinite',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#555577',
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  statTable: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.25)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 8,
    padding: '8px 12px',
    maxWidth: 320,
  },
  statHeaderRow: {
    display: 'flex',
    alignItems: 'center',
    paddingBottom: 6,
    marginBottom: 2,
    borderBottom: '1px solid rgba(255,255,255,0.07)',
  },
  statHeaderAttr: {
    flex: 1,
    color: '#555577',
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
  },
  statHeaderNum: {
    width: 60,
    textAlign: 'right' as const,
    color: '#555577',
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
  },
  statRow: {
    display: 'flex',
    alignItems: 'center',
  },
  statLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: 600,
    fontStyle: 'italic',
  },
  statValue: {
    width: 60,
    textAlign: 'right' as const,
    color: '#e0e0e0',
    fontSize: 13,
    fontWeight: 700,
    fontVariantNumeric: 'tabular-nums',
  },
  actionsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap' as const,
    marginTop: 36,
    paddingTop: 10,
    marginBottom: 32,
    borderTop: '1px solid rgba(233,69,96,0.12)',
  },
  halveCapBtn: {
    padding: '7px 16px',
    backgroundColor: 'rgba(167,139,250,0.08)',
    color: '#a78bfa',
    border: '1px solid rgba(167,139,250,0.35)',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: 0.5,
  },
  halveCapBtnDone: {
    opacity: 0.45,
    cursor: 'default',
    borderColor: 'rgba(167,139,250,0.12)',
  },
  halveCapPrice: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: 600,
    fontFamily: 'Inter, sans-serif',
  },
  sep: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.07)',
    margin: '0 4px',
  },
  sellBtn: {
    padding: '7px 18px',
    backgroundColor: '#7f1d1d',
    color: '#fca5a5',
    border: '1px solid #991b1b',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: 0.5,
  },
  sellPrice: {
    color: '#fbbf24',
    fontSize: 13,
    fontWeight: 600,
    fontFamily: 'Inter, sans-serif',
  },
  confirmOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  confirmCard: {
    backgroundColor: '#1a1a2e',
    border: '1px solid #16213e',
    borderRadius: 10,
    padding: 28,
    maxWidth: 360,
    width: '90%',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  confirmTitle: {
    color: '#e0e0e0',
    fontSize: 18,
    fontWeight: 800,
  },
  confirmName: {
    color: '#a78bfa',
    fontSize: 15,
    fontWeight: 700,
  },
  confirmSub: {
    color: '#a0a0b0',
    fontSize: 13,
    lineHeight: 1.5,
  },
  confirmBtns: {
    display: 'flex',
    gap: 10,
    marginTop: 4,
  },
  confirmYes: {
    flex: 1,
    padding: '9px 0',
    backgroundColor: '#e94560',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
  },
  confirmNo: {
    flex: 1,
    padding: '9px 0',
    backgroundColor: '#2a1a20',
    color: '#a0a0b0',
    border: '1px solid #333',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
};
