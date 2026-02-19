import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { BattleLog } from '../../types';
import HeroPortrait from '../Hero/HeroPortrait';

// ── Constants ────────────────────────────────────────────────────────────────

const ELEM_SYM: Record<string, string> = {
  FIRE: '🔥', WATER: '💧', WIND: '🌀', EARTH: '⛰️', LIGHTNING: '⚡',
};

// Keyframes injected once into <head>
const ANIM_CSS = `
@keyframes baCR  { 0%{transform:translateX(0) scale(1)} 42%{transform:translateX(150px) scale(1.08)} 68%{transform:translateX(135px) scale(1.03)} 100%{transform:translateX(0) scale(1)} }
@keyframes baCL  { 0%{transform:translateX(0) scale(1)} 42%{transform:translateX(-150px) scale(1.08)} 68%{transform:translateX(-135px) scale(1.03)} 100%{transform:translateX(0) scale(1)} }
@keyframes baHF  { 0%,100%{filter:brightness(1) saturate(1)} 18%{filter:brightness(6) saturate(0) sepia(1) hue-rotate(-30deg)} 55%{filter:brightness(2) saturate(1.5)} }
@keyframes baWP  { 0%,100%{filter:brightness(1) drop-shadow(0 0 0px transparent)} 45%{filter:brightness(1.3) drop-shadow(0 0 20px #4ade80) drop-shadow(0 0 48px rgba(74,222,128,.35))} }
@keyframes baSL  { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-13px)} 40%{transform:translateX(13px)} 60%{transform:translateX(-9px)} 80%{transform:translateX(9px)} }
@keyframes baSR  { 0%,100%{transform:translateX(0)} 20%{transform:translateX(13px)} 40%{transform:translateX(-13px)} 60%{transform:translateX(9px)} 80%{transform:translateX(-9px)} }
@keyframes baIB  { 0%{transform:scale(.08);opacity:1} 38%{transform:scale(1.7);opacity:.9} 70%{transform:scale(1.4);opacity:.4} 100%{transform:scale(2);opacity:0} }
@keyframes baDF  { 0%{opacity:1;transform:translateY(0) scale(1.7)} 28%{opacity:1;transform:translateY(-28px) scale(1.2)} 100%{opacity:0;transform:translateY(-90px) scale(.7)} }
@keyframes baEL  { 0%{filter:brightness(1) grayscale(0);opacity:1;transform:scale(1)} 28%{filter:brightness(3) grayscale(.2);transform:scale(1.06)} 100%{filter:brightness(.25) grayscale(1);opacity:.35;transform:scale(.88)} }
@keyframes baRN  { 0%{opacity:0;transform:translateY(-10px) scale(.88)} 100%{opacity:1;transform:translateY(0) scale(1)} }
@keyframes baSlideIn { 0%{opacity:0;transform:translateX(-16px)} 100%{opacity:1;transform:translateX(0)} }
@keyframes baReadyL { 0%,100%{transform:translateX(0) translateY(0)} 25%{transform:translateX(-4px) translateY(-3px)} 75%{transform:translateX(4px) translateY(3px)} }
@keyframes baReadyR { 0%,100%{transform:translateX(0) translateY(0)} 25%{transform:translateX(4px) translateY(-3px)} 75%{transform:translateX(-4px) translateY(3px)} }
`;

// ── Types ────────────────────────────────────────────────────────────────────

type HeroInfo = { name: string; imagePath: string | null; element?: string; level?: number };
type AnimSlot = { name: string; dur: number; key: number };
const IDLE: AnimSlot = { name: 'none', dur: 0, key: 0 };

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildRoster(rounds: BattleLog['rounds'], side: 'attacker' | 'defender'): HeroInfo[] {
  const seen = new Set<string>();
  const list: HeroInfo[] = [];
  for (const r of rounds) {
    const name = side === 'attacker' ? r.attackerHero : r.defenderHero;
    if (seen.has(name)) continue;
    seen.add(name);
    list.push({
      name,
      imagePath: (side === 'attacker' ? r.attackerImagePath : r.defenderImagePath) ?? null,
      element: side === 'attacker' ? r.attackerElement : r.defenderElement,
      level: side === 'attacker' ? r.attackerLevel : r.defenderLevel,
    });
  }
  return list;
}

function getDefeated(rounds: BattleLog['rounds'], beforeIdx: number, side: 'attacker' | 'defender'): Set<string> {
  const out = new Set<string>();
  for (let i = 0; i < beforeIdx; i++) {
    const r = rounds[i], nx = rounds[i + 1];
    if (side === 'attacker' && r.winner === 'defender' && (!nx || nx.attackerHero !== r.attackerHero)) out.add(r.attackerHero);
    if (side === 'defender' && r.winner === 'attacker' && (!nx || nx.defenderHero !== r.defenderHero)) out.add(r.defenderHero);
  }
  return out;
}

// ── Component ────────────────────────────────────────────────────────────────

interface Props {
  battleLog: BattleLog;
  result?: string | null;
  goldEarned?: number | null;
}

export default function BattleAnimator({ battleLog, result, goldEarned }: Props) {
  const rounds = battleLog.rounds;
  const cRoster = useMemo(() => buildRoster(rounds, 'attacker'), [rounds]);
  const dRoster = useMemo(() => buildRoster(rounds, 'defender'), [rounds]);

  const [roundIdx, setRoundIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [busy, setBusy] = useState(false);

  // Per-side animation slot — key change forces re-mount → restarts animation
  const [lAnim, setLAnim] = useState<AnimSlot>(IDLE);
  const [rAnim, setRAnim] = useState<AnimSlot>(IDLE);
  const [showImpact, setShowImpact] = useState(false);
  const [impactKey, setImpactKey] = useState(0);
  const [dmgL, setDmgL] = useState<{ v: number; k: number } | null>(null);
  const [dmgR, setDmgR] = useState<{ v: number; k: number } | null>(null);
  const [roundRes, setRoundRes] = useState<'attacker' | 'defender' | null>(null);

  const cancelRef = useRef(false);
  const doneRef   = useRef(false); // true only when animation runs to natural completion

  // Inject CSS keyframes once
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'battle-anim-css';
    style.textContent = ANIM_CSS;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  const bump = useCallback((set: React.Dispatch<React.SetStateAction<AnimSlot>>, name: string, dur: number) => {
    set(a => ({ name, dur, key: a.key + 1 }));
  }, []);

  const resetVisuals = useCallback(() => {
    setLAnim(IDLE);
    setRAnim(IDLE);
    setShowImpact(false);
    setRoundRes(null);
    setDmgL(null);
    setDmgR(null);
  }, []);

  const doRound = useCallback(async (idx: number) => {
    if (idx >= rounds.length) return;
    const round = rounds[idx];
    cancelRef.current = false;
    setBusy(true);

    const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms / speed));

    // Champion rule: whoever won last round attacks first.
    // Left (attacker/challenger) always goes first in round 0.
    const leftGoesFirst = idx === 0 ? true : rounds[idx - 1].winner === 'attacker';

    const CHARGE_DUR = 650;
    const PEAK_MS    = 270;  // ~42% of CHARGE_DUR — hero reaches opponent
    const IMPACT_MS  = 190;  // impact burst shown
    const RETRACT_MS = CHARGE_DUR - PEAK_MS - IMPACT_MS; // wait for full retract

    const firstSetter  = leftGoesFirst ? setLAnim : setRAnim;
    const secondSetter = leftGoesFirst ? setRAnim : setLAnim;
    const firstCharge  = leftGoesFirst ? 'baCR' : 'baCL';
    const secondCharge = leftGoesFirst ? 'baCL' : 'baCR';

    // ── Phase 1: Champion charges ─────────────────────────────────────────────
    bump(firstSetter, firstCharge, CHARGE_DUR / speed);
    await sleep(PEAK_MS);
    if (cancelRef.current) { setBusy(false); return; }

    // Impact lands on the OPPONENT (the second/new-entrant hero)
    setShowImpact(true);
    setImpactKey(k => k + 1);
    if (leftGoesFirst) {
      // Left hits right → damage floats above right hero; right flashes
      setDmgR({ v: round.attackerAttackValue, k: Date.now() });
      bump(setRAnim, 'baHF', 500 / speed);
    } else {
      // Right hits left → damage floats above left hero; left flashes
      setDmgL({ v: round.defenderAttackValue, k: Date.now() });
      bump(setLAnim, 'baHF', 500 / speed);
    }
    await sleep(IMPACT_MS);
    if (cancelRef.current) { setBusy(false); return; }
    setShowImpact(false);
    await sleep(RETRACT_MS); // wait for champion to retract to home
    if (cancelRef.current) { setBusy(false); return; }

    // ── Phase 2: New entrant (second) charges back ────────────────────────────
    bump(secondSetter, secondCharge, CHARGE_DUR / speed);
    await sleep(PEAK_MS);
    if (cancelRef.current) { setBusy(false); return; }

    setShowImpact(true);
    setImpactKey(k => k + 1);
    if (leftGoesFirst) {
      // Right hits left → damage floats above left; left flashes
      setDmgL({ v: round.defenderAttackValue, k: Date.now() });
      bump(setLAnim, 'baHF', 500 / speed);
    } else {
      // Left hits right → damage floats above right; right flashes
      setDmgR({ v: round.attackerAttackValue, k: Date.now() });
      bump(setRAnim, 'baHF', 500 / speed);
    }
    await sleep(IMPACT_MS);
    if (cancelRef.current) { setBusy(false); return; }
    setShowImpact(false);
    await sleep(RETRACT_MS);
    if (cancelRef.current) { setBusy(false); return; }

    // ── Phase 3: Resolution — winner glow + loser shake ───────────────────────
    setRoundRes(round.winner);
    if (round.winner === 'attacker') {
      bump(setLAnim, 'baWP', 800 / speed);
      bump(setRAnim, 'baSR', 600 / speed);
    } else {
      bump(setRAnim, 'baWP', 800 / speed);
      bump(setLAnim, 'baSL', 600 / speed);
    }
    await sleep(750);
    if (cancelRef.current) { setBusy(false); return; }

    // ── Phase 4: Elimination if hero knocked out this round ───────────────────
    const cOut = round.winner === 'defender' && (!rounds[idx + 1] || rounds[idx + 1].attackerHero !== round.attackerHero);
    const dOut = round.winner === 'attacker' && (!rounds[idx + 1] || rounds[idx + 1].defenderHero !== round.defenderHero);
    if (cOut) bump(setLAnim, 'baEL', 600 / speed);
    if (dOut) bump(setRAnim, 'baEL', 600 / speed);
    if (cOut || dOut) await sleep(500 / speed);
    if (cancelRef.current) { setBusy(false); return; }

    // ── Reset ─────────────────────────────────────────────────────────────────
    setLAnim(IDLE);
    setRAnim(IDLE);
    setRoundRes(null);
    setDmgL(null);
    setDmgR(null);
    await sleep(160);
    setBusy(false);
  }, [rounds, speed, bump]);

  // Auto-play driver
  useEffect(() => {
    if (!isPlaying || busy) return;
    if (roundIdx >= rounds.length) { setIsPlaying(false); return; }
    doRound(roundIdx).then(() => {
      if (!cancelRef.current) {
        if (roundIdx < rounds.length - 1) setRoundIdx(r => r + 1);
        else { doneRef.current = true; setIsPlaying(false); }
      }
    });
  }, [isPlaying, roundIdx, busy, doRound, rounds.length]);

  // ── Navigation helpers
  const skipTo = useCallback((idx: number) => {
    cancelRef.current = true;
    doneRef.current = false;
    setIsPlaying(false);
    setBusy(false);
    resetVisuals();
    setRoundIdx(Math.max(0, Math.min(idx, rounds.length - 1)));
  }, [rounds.length, resetVisuals]);

  const handlePlay = () => {
    if (!isPlaying && doneRef.current && !busy) {
      // Battle finished naturally → restart from the top
      doneRef.current = false;
      cancelRef.current = true;
      setBusy(false);
      resetVisuals();
      setRoundIdx(0);
      setTimeout(() => setIsPlaying(true), 50);
    } else {
      // Normal play / pause toggle — resume from wherever we are
      if (isPlaying) cancelRef.current = true;
      setIsPlaying(p => !p);
    }
  };

  // ── Derived
  const round = rounds[Math.min(roundIdx, rounds.length - 1)];
  const cDefeated = useMemo(() => getDefeated(rounds, roundIdx, 'attacker'), [rounds, roundIdx]);
  const dDefeated = useMemo(() => getDefeated(rounds, roundIdx, 'defender'), [rounds, roundIdx]);
  const cHero = cRoster.find(h => h.name === round?.attackerHero) ?? cRoster[0];
  const dHero = dRoster.find(h => h.name === round?.defenderHero) ?? dRoster[0];
  const isAtEnd = roundIdx >= rounds.length - 1;
  const finalWinner = battleLog.winner === 'challenger' ? battleLog.challenger.username : battleLog.defender.username;

  // ── Render helpers
  const animStyle = (a: AnimSlot): React.CSSProperties => a.name === 'none' ? {} : {
    animationName: a.name,
    animationDuration: `${a.dur}ms`,
    animationTimingFunction: 'ease-out',
    animationFillMode: 'both',
  };

  const renderHeroColumn = (
    hero: HeroInfo | undefined,
    anim: AnimSlot,
    isLeft: boolean,
    dmg: typeof dmgL,
  ) => {
    if (!hero) return <div style={{ flex: 1 }} />;
    const isWinner = roundRes && ((isLeft && roundRes === 'attacker') || (!isLeft && roundRes === 'defender'));
    const isLoser = roundRes && ((isLeft && roundRes === 'defender') || (!isLeft && roundRes === 'attacker'));
    const elemSym = hero.element ? (ELEM_SYM[hero.element] ?? '') : null;
    const PORTRAIT_SIZE = 160;

    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, position: 'relative' }}>
        {/* Floating damage number */}
        {dmg && (
          <div key={dmg.k} style={{
            position: 'absolute',
            top: 10,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 30,
            fontSize: 30,
            fontWeight: 900,
            color: '#ff6b35',
            textShadow: '0 2px 12px rgba(0,0,0,.9), 0 0 24px rgba(255,107,53,.6)',
            animationName: 'baDF',
            animationDuration: `${900 / speed}ms`,
            animationFillMode: 'forwards',
            animationTimingFunction: 'ease-out',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}>
            💥 {dmg.v.toFixed(1)}
          </div>
        )}

        {/* Animated portrait wrapper — key change restarts animation */}
        <div key={anim.key} style={{ position: 'relative', display: 'inline-block', ...animStyle(anim) }}>
          {/* Glow ring behind portrait */}
          {(isWinner || isLoser) && (
            <div style={{
              position: 'absolute',
              inset: -6,
              borderRadius: 12,
              background: isWinner
                ? 'radial-gradient(ellipse, rgba(74,222,128,.25) 0%, transparent 70%)'
                : 'radial-gradient(ellipse, rgba(233,69,96,.2) 0%, transparent 70%)',
              animation: `${isWinner ? 'baWP' : 'baHF'} ${600 / speed}ms ease-out`,
              pointerEvents: 'none',
              zIndex: 0,
            }} />
          )}

          {hero.imagePath ? (
            <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', boxShadow: isWinner ? '0 0 32px rgba(74,222,128,.55), 0 0 60px rgba(74,222,128,.2)' : isLoser ? '0 0 20px rgba(233,69,96,.4)' : '0 6px 30px rgba(0,0,0,.7)', transition: 'box-shadow 0.4s ease' }}>
              <HeroPortrait imagePath={hero.imagePath} name={hero.name} size={PORTRAIT_SIZE} />
              {/* Level badge — bottom right */}
              <div style={{ position: 'absolute', bottom: 6, right: 6, backgroundColor: 'rgba(0,0,0,.75)', color: '#fff', fontSize: 15, fontWeight: 900, padding: '2px 6px', borderRadius: 4, textShadow: '0 1px 4px #000' }}>
                {hero.level}
              </div>
              {/* Element symbol — top left */}
              {elemSym && (
                <div style={{ position: 'absolute', top: 4, left: 5, fontSize: 20, lineHeight: 1, textShadow: '0 1px 6px rgba(0,0,0,.95), 0 0 10px rgba(0,0,0,.8)', pointerEvents: 'none' }}>
                  {elemSym}
                </div>
              )}
            </div>
          ) : (
            <div style={{ width: PORTRAIT_SIZE, height: Math.round(PORTRAIT_SIZE * 200 / 180), backgroundColor: '#16213e', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a0a0b0', fontSize: 13, fontWeight: 600, border: '2px solid #2a2a4a', padding: 8, textAlign: 'center' }}>
              {elemSym && <span style={{ position: 'absolute', top: 4, left: 5, fontSize: 20 }}>{elemSym}</span>}
              {hero.name}
            </div>
          )}
        </div>

        {/* Hero label — name only, element is on portrait */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#e0e0e0', fontWeight: 700, fontSize: 15, textShadow: '0 1px 6px rgba(0,0,0,.8)' }}>{hero.name}</div>
        </div>
      </div>
    );
  };

  const renderRosterDots = (roster: HeroInfo[], defeated: Set<string>, activeHeroName: string | undefined, align: 'left' | 'right') => (
    <div style={{ display: 'flex', gap: 5, justifyContent: align === 'left' ? 'flex-start' : 'flex-end', flexWrap: 'wrap' }}>
      {roster.map((h, i) => {
        const isDead = defeated.has(h.name);
        const isActive = h.name === activeHeroName && !isDead;
        return (
          <div key={i} title={h.name} style={{
            borderRadius: 5,
            overflow: 'hidden',
            border: isActive ? '2px solid #4ade80' : isDead ? '2px solid #333' : '2px solid #2a2a4a',
            filter: isDead ? 'grayscale(1) brightness(0.35)' : undefined,
            boxShadow: isActive ? '0 0 10px rgba(74,222,128,.5)' : undefined,
            transition: 'filter 0.5s ease, border-color 0.3s ease, box-shadow 0.3s ease',
            flexShrink: 0,
          }}>
            {h.imagePath
              ? <HeroPortrait imagePath={h.imagePath} name={h.name} size={34} />
              : <div style={{ width: 34, height: 38, backgroundColor: '#16213e', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: 10 }}>{h.name.charAt(0)}</div>
            }
          </div>
        );
      })}
    </div>
  );

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={s.wrap}>

      {/* ── Team header ── */}
      <div style={s.header}>
        <div style={s.headerSide}>
          <div style={s.headerName}>{battleLog.challenger.username}</div>
          {renderRosterDots(cRoster, cDefeated, round?.attackerHero, 'left')}
        </div>
        <div style={s.headerVs}>⚔</div>
        <div style={{ ...s.headerSide, alignItems: 'flex-end' }}>
          <div style={s.headerName}>{battleLog.defender.username}</div>
          {renderRosterDots(dRoster, dDefeated, round?.defenderHero, 'right')}
        </div>
      </div>

      {/* ── Arena ── */}
      <div style={s.arena}>

        {/* Subtle arena floor lines */}
        <div style={s.arenaFloor} />

        {renderHeroColumn(cHero, lAnim, true, dmgL)}

        {/* Center panel */}
        <div style={s.center}>
          {round && (
            <div key={roundIdx} style={{ animationName: 'baRN', animationDuration: '0.28s', animationFillMode: 'both', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={s.roundLabel}>Round {round.roundNumber} / {rounds.length}</div>
              <div style={s.vsGlyph}>VS</div>
            </div>
          )}

          {/* Impact burst — key change re-mounts = re-runs animation */}
          {showImpact && (
            <div key={impactKey} style={s.impactBurst} />
          )}

          {/* Final result banner */}
          {isAtEnd && !isPlaying && !busy && (
            <div style={{ marginTop: 10, textAlign: 'center', animation: 'baSlideIn 0.4s ease-out' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: result === 'WIN' ? '#4ade80' : result === 'LOSS' ? '#e94560' : '#fbbf24', textShadow: '0 0 16px currentColor' }}>
                {result === 'WIN' ? '🏆 Victory!' : result === 'LOSS' ? '💀 Defeat' : `🏆 ${finalWinner}`}
              </div>
              {goldEarned != null && goldEarned > 0 && (
                <div style={{ color: '#fbbf24', fontSize: 12, marginTop: 3 }}>+{goldEarned} gold</div>
              )}
            </div>
          )}
        </div>

        {renderHeroColumn(dHero, rAnim, false, dmgR)}
      </div>

      {/* ── Controls ── */}
      <div style={s.controls}>
        <div style={s.btnGroup}>
          <button onClick={() => skipTo(0)} disabled={roundIdx === 0 && !busy} title="First round" style={{ ...s.ctrl, opacity: roundIdx === 0 ? 0.4 : 1 }}>⏮</button>
          <button onClick={() => skipTo(roundIdx - 1)} disabled={roundIdx === 0} title="Previous" style={{ ...s.ctrl, opacity: roundIdx === 0 ? 0.4 : 1 }}>◀</button>
          <button onClick={handlePlay} style={{ ...s.ctrl, ...s.playCtrl }}>
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button onClick={() => skipTo(roundIdx + 1)} disabled={isAtEnd} title="Next" style={{ ...s.ctrl, opacity: isAtEnd ? 0.4 : 1 }}>▶</button>
          <button onClick={() => skipTo(rounds.length - 1)} disabled={isAtEnd} title="Last round" style={{ ...s.ctrl, opacity: isAtEnd ? 0.4 : 1 }}>⏭</button>
        </div>

        <div style={s.speedGroup}>
          <span style={{ color: '#555', fontSize: 11, marginRight: 4 }}>Speed</span>
          {([0.5, 1, 2, 3] as const).map(sp => (
            <button key={sp} onClick={() => setSpeed(sp)} style={{ ...s.speedBtn, ...(speed === sp ? s.speedBtnOn : {}) }}>
              {sp}×
            </button>
          ))}
        </div>

        <div style={{ color: '#444', fontSize: 11 }}>
          {roundIdx + 1} / {rounds.length}
        </div>
      </div>
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  wrap: {
    backgroundColor: '#0b0b1c',
    borderRadius: 14,
    border: '1px solid #1a1a3e',
    overflow: 'hidden',
    marginBottom: 32,
    boxShadow: '0 12px 50px rgba(0,0,0,.8)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 22px',
    background: 'linear-gradient(180deg, #16162e 0%, #12122a 100%)',
    borderBottom: '1px solid #1a1a3e',
    gap: 16,
  },
  headerSide: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  headerName: {
    color: '#e0e0e0',
    fontWeight: 700,
    fontSize: 14,
    letterSpacing: 0.3,
  },
  headerVs: {
    color: '#e94560',
    fontSize: 22,
    fontWeight: 900,
    flexShrink: 0,
    textShadow: '0 0 16px rgba(233,69,96,.5)',
  },
  arena: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '36px 28px',
    minHeight: 340,
    background: 'radial-gradient(ellipse at 50% 60%, #1a1a3e 0%, #0d0d22 55%, #080814 100%)',
    position: 'relative',
    gap: 8,
    overflow: 'hidden',
  },
  arenaFloor: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    background: 'linear-gradient(to top, rgba(233,69,96,.06), transparent)',
    pointerEvents: 'none',
  },
  center: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    minWidth: 110,
    flexShrink: 0,
    position: 'relative',
    zIndex: 10,
  },
  roundLabel: {
    color: '#4a4a7a',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.8,
    fontWeight: 600,
  },
  vsGlyph: {
    color: '#e94560',
    fontSize: 22,
    fontWeight: 900,
    textShadow: '0 0 20px rgba(233,69,96,.6)',
    letterSpacing: 2,
  },
  impactBurst: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(255,255,220,.95) 0%, rgba(233,69,96,.55) 45%, transparent 72%)',
    pointerEvents: 'none',
    animationName: 'baIB',
    animationDuration: '0.52s',
    animationFillMode: 'forwards',
    animationTimingFunction: 'ease-out',
    zIndex: 20,
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 22,
    padding: '13px 22px',
    background: 'linear-gradient(0deg, #12122a 0%, #0f0f20 100%)',
    borderTop: '1px solid #1a1a3e',
    flexWrap: 'wrap',
  },
  btnGroup: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },
  ctrl: {
    background: '#1a1a3e',
    border: '1px solid #2a2a5a',
    color: '#a0a0b0',
    borderRadius: 7,
    padding: '7px 12px',
    cursor: 'pointer',
    fontSize: 14,
    lineHeight: 1,
    transition: 'background 0.15s, color 0.15s',
  },
  playCtrl: {
    backgroundColor: '#e94560',
    borderColor: '#e94560',
    color: '#fff',
    padding: '7px 22px',
    fontSize: 17,
    fontWeight: 700,
    boxShadow: '0 0 16px rgba(233,69,96,.4)',
  },
  speedGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  speedBtn: {
    background: '#161630',
    border: '1px solid #2a2a4a',
    color: '#555',
    borderRadius: 5,
    padding: '3px 9px',
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: 500,
  },
  speedBtnOn: {
    backgroundColor: '#2a2a5a',
    color: '#c0c0e0',
    borderColor: '#4a4a9a',
  },
};
