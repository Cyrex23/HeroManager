import { useEffect, useRef, useState } from 'react';
import type { LevelUpInfo } from '../types';
import HeroPortrait from './Hero/HeroPortrait';

// ── Storage key ──────────────────────────────────────────────────────────────
export const LEVEL_UP_QUEUE_KEY = 'levelUpQueue';

// Module-level set survives StrictMode unmount/remount — prevents double-enqueue
const _enqueuedKeys = new Set<string>();

export function enqueueLevelUps(infos: LevelUpInfo[]) {
  const toAdd = infos.filter(info => {
    const key = `${info.heroName}:${info.newLevel}`;
    if (_enqueuedKeys.has(key)) return false;
    _enqueuedKeys.add(key);
    return true;
  });
  if (toAdd.length === 0) return;
  const existing: LevelUpInfo[] = JSON.parse(localStorage.getItem(LEVEL_UP_QUEUE_KEY) || '[]');
  localStorage.setItem(LEVEL_UP_QUEUE_KEY, JSON.stringify([...existing, ...toAdd]));
  window.dispatchEvent(new Event('levelUpQueued'));
}

// ── Keyframe CSS ─────────────────────────────────────────────────────────────
const CSS = `
@keyframes luSlideIn  { 0%{opacity:0;transform:translateX(120px) scale(0.92)} 60%{opacity:1;transform:translateX(-6px) scale(1.02)} 100%{opacity:1;transform:translateX(0) scale(1)} }
@keyframes luSlideOut { 0%{opacity:1;transform:translateX(0) scale(1)} 100%{opacity:0;transform:translateX(120px) scale(0.9)} }
@keyframes luTitle    { 0%{opacity:0;transform:translateY(-8px)} 100%{opacity:1;transform:translateY(0)} }
@keyframes luBarFill  { 0%{width:0%} 100%{width:var(--bar-w)} }
@keyframes luShimmer  { 0%{background-position:200% center} 100%{background-position:-200% center} }
@keyframes luGlow     { 0%,100%{box-shadow:0 0 18px rgba(255,140,0,0.4)} 50%{box-shadow:0 0 36px rgba(255,140,0,0.75), 0 0 60px rgba(255,140,0,0.25)} }
@keyframes luStar     { 0%{opacity:0;transform:scale(0) rotate(-30deg)} 60%{opacity:1;transform:scale(1.3) rotate(8deg)} 100%{opacity:1;transform:scale(1) rotate(0deg)} }
@keyframes luLvBadge  { 0%{opacity:0;transform:scale(0.4) rotate(-15deg)} 55%{transform:scale(1.18) rotate(4deg)} 100%{opacity:1;transform:scale(1) rotate(0deg)} }
`;

// ── Stat config ───────────────────────────────────────────────────────────────
const STATS = [
  { key: 'gainPa',   label: 'PA',   color: '#e55', bar: '#e55' },
  { key: 'gainMp',   label: 'MP',   color: '#7bf', bar: '#4af' },
  { key: 'gainDex',  label: 'DEX',  color: '#4d4', bar: '#4d4' },
  { key: 'gainElem', label: 'ELEM', color: '#fa0', bar: '#fa0' },
  { key: 'gainMana', label: 'MANA', color: '#a7f', bar: '#a7f' },
  { key: 'gainStam', label: 'STAM', color: '#f87', bar: '#f97' },
] as const;

const MAX_BAR = 10; // gain that fills 100% bar width

// ── Component ─────────────────────────────────────────────────────────────────
export default function LevelUpNotification() {
  const [queue, setQueue] = useState<LevelUpInfo[]>([]);
  const [current, setCurrent] = useState<LevelUpInfo | null>(null);
  const [exiting, setExiting] = useState(false);
  const [barsReady, setBarsReady] = useState(false);
  const styleRef = useRef<HTMLStyleElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Inject CSS once
  useEffect(() => {
    if (!styleRef.current) {
      const el = document.createElement('style');
      el.textContent = CSS;
      document.head.appendChild(el);
      styleRef.current = el;
    }
    return () => { styleRef.current?.remove(); styleRef.current = null; };
  }, []);

  // Load queue from storage
  const loadQueue = () => {
    const stored: LevelUpInfo[] = JSON.parse(localStorage.getItem(LEVEL_UP_QUEUE_KEY) || '[]');
    setQueue(stored);
  };

  useEffect(() => {
    loadQueue();
    window.addEventListener('levelUpQueued', loadQueue);
    return () => window.removeEventListener('levelUpQueued', loadQueue);
  }, []);

  // Dequeue next when idle
  useEffect(() => {
    if (!current && queue.length > 0) {
      const [next, ...rest] = queue;
      localStorage.setItem(LEVEL_UP_QUEUE_KEY, JSON.stringify(rest));
      setQueue(rest);
      setCurrent(next);
      setExiting(false);
      setBarsReady(false);
      setTimeout(() => setBarsReady(true), 400);
    }
  }, [current, queue]);

  const dismiss = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setExiting(true);
    setTimeout(() => { setCurrent(null); setExiting(false); }, 420);
  };

  if (!current) return null;

  return (
    <div
      onClick={dismiss}
      style={{
        position: 'fixed', top: 24, right: 24, zIndex: 9999,
        width: 310,
        background: 'linear-gradient(160deg, #1a1008 0%, #120c04 60%, #0e0a02 100%)',
        border: '2px solid #7a5010',
        borderRadius: 10,
        boxShadow: '0 0 0 1px rgba(255,160,30,0.15), 0 0 28px rgba(255,120,0,0.35), 0 8px 40px rgba(0,0,0,0.9)',
        overflow: 'hidden',
        cursor: 'pointer',
        animation: exiting ? 'luSlideOut 0.4s ease-in forwards' : 'luSlideIn 0.55s cubic-bezier(0.22,1,0.36,1) forwards',
      }}
    >
      {/* Top shimmer line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: 'linear-gradient(90deg, transparent, #f97316, #fbbf24, #f97316, transparent)',
        backgroundSize: '200% auto',
        animation: 'luShimmer 2s linear infinite',
      }} />

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px 8px' }}>
        {/* Portrait */}
        <div style={{
          flexShrink: 0, borderRadius: 6, overflow: 'hidden',
          border: '2px solid #92400e',
          boxShadow: '0 0 12px rgba(251,191,36,0.5)',
          animation: 'luGlow 2.5s ease-in-out infinite',
        }}>
          {current.imagePath
            ? <HeroPortrait imagePath={current.imagePath} name={current.heroName} size={52} />
            : <div style={{ width: 52, height: 58, background: '#1a1008', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f97316', fontWeight: 900, fontSize: 20 }}>
                {current.heroName.charAt(0)}
              </div>
          }
        </div>

        {/* Title */}
        <div style={{ flex: 1, animation: 'luTitle 0.5s 0.15s ease-out both' }}>
          <div style={{
            fontSize: 13, fontWeight: 900, fontStyle: 'italic',
            background: 'linear-gradient(90deg, #fbbf24, #f97316, #fbbf24)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            animation: 'luShimmer 3s linear infinite',
            lineHeight: 1.2,
          }}>
            {current.heroName}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: '#d97706',
              animation: 'luTitle 0.5s 0.2s ease-out both',
            }}>
              {current.oldLevel} →
            </div>
            {/* New level badge */}
            <div style={{
              background: 'linear-gradient(160deg, #92400e, #b45309, #78350f)',
              border: '1.5px solid #d97706',
              borderRadius: 5, padding: '2px 8px',
              fontSize: 16, fontWeight: 900, color: '#fde68a',
              textShadow: '0 0 8px rgba(251,191,36,0.9)',
              boxShadow: '0 0 10px rgba(251,191,36,0.4)',
              animation: 'luLvBadge 0.6s 0.25s cubic-bezier(0.34,1.56,0.64,1) both',
              letterSpacing: '0.04em',
            }}>
              LV {current.newLevel}
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,140,30,0.4), transparent)', margin: '0 10px' }} />

      {/* Stat bars */}
      <div style={{ padding: '8px 14px 12px', display: 'flex', flexDirection: 'column', gap: 5 }}>
        {STATS.map(({ key, label, color, bar }, i) => {
          const gain = current[key as keyof LevelUpInfo] as number;
          if (!gain || gain <= 0) return null;
          const pct = Math.min(100, (gain / MAX_BAR) * 100);
          return (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8,
              animation: `luTitle 0.35s ${0.35 + i * 0.07}s ease-out both` }}>
              {/* Label */}
              <span style={{
                width: 36, fontSize: 10, fontWeight: 900, color,
                textShadow: `0 0 6px ${color}88`,
                letterSpacing: '0.06em', flexShrink: 0, textAlign: 'right',
              }}>{label}</span>

              {/* Bar track */}
              <div style={{
                flex: 1, height: 13, borderRadius: 3,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                overflow: 'hidden', position: 'relative',
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.6)',
              }}>
                {barsReady && (
                  <div style={{
                    position: 'absolute', top: 0, left: 0, bottom: 0,
                    '--bar-w': `${pct}%`,
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, ${bar}99, ${bar}cc, ${bar}ff)`,
                    boxShadow: `0 0 8px ${bar}88, inset 0 1px 0 rgba(255,255,255,0.25)`,
                    animation: `luBarFill 0.7s ${i * 0.08}s cubic-bezier(0.22,1,0.36,1) both`,
                    borderRadius: 3,
                  } as React.CSSProperties}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 5, background: 'linear-gradient(to bottom, rgba(255,255,255,0.25), transparent)', borderRadius: 3 }} />
                  </div>
                )}
              </div>

              {/* Gain value */}
              <span style={{
                width: 34, fontSize: 11, fontWeight: 900, color: '#fde68a',
                textAlign: 'right', flexShrink: 0,
                textShadow: '0 0 6px rgba(251,191,36,0.7)',
              }}>+{gain.toFixed(1)}</span>
            </div>
          );
        })}
      </div>

      {/* Tap to dismiss hint */}
      <div style={{
        textAlign: 'center', fontSize: 9, color: 'rgba(255,255,255,0.2)',
        paddingBottom: 7, letterSpacing: '0.08em',
      }}>TAP TO DISMISS</div>
    </div>
  );
}
