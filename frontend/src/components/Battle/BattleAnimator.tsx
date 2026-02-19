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
@keyframes baDF  { 0%{opacity:1;transform:translateY(0) scale(1.8)} 25%{opacity:1;transform:translateY(-30px) scale(1.35)} 60%{opacity:1;transform:translateY(-58px) scale(1.1)} 100%{opacity:1;transform:translateY(-78px) scale(1)} }
@keyframes baEL  { 0%{filter:brightness(1) grayscale(0);opacity:1;transform:scale(1)} 28%{filter:brightness(3) grayscale(.2);transform:scale(1.06)} 100%{filter:brightness(.25) grayscale(1);opacity:.35;transform:scale(.88)} }
@keyframes baRN  { 0%{opacity:0;transform:translateY(-10px) scale(.88)} 100%{opacity:1;transform:translateY(0) scale(1)} }
@keyframes baSlideIn { 0%{opacity:0;transform:translateX(-16px)} 100%{opacity:1;transform:translateX(0)} }
@keyframes baReadyL { 0%,100%{transform:translateX(0) translateY(0)} 25%{transform:translateX(-4px) translateY(-3px)} 75%{transform:translateX(4px) translateY(3px)} }
@keyframes baReadyR { 0%,100%{transform:translateX(0) translateY(0)} 25%{transform:translateX(4px) translateY(-3px)} 75%{transform:translateX(-4px) translateY(3px)} }
@keyframes baEnterL { 0%{opacity:0;transform:translateX(-200px) scale(.8)} 55%{opacity:1;transform:translateX(10px) scale(1.04)} 75%{transform:translateX(-5px) scale(1)} 100%{opacity:1;transform:translateX(0) scale(1)} }
@keyframes baEnterR { 0%{opacity:0;transform:translateX(200px) scale(.8)} 55%{opacity:1;transform:translateX(-10px) scale(1.04)} 75%{transform:translateX(5px) scale(1)} 100%{opacity:1;transform:translateX(0) scale(1)} }
@keyframes baPunch  { 0%{opacity:0;transform:translate(-30px,0) scale(.3)} 22%{opacity:1;transform:translate(6px,0) scale(1.7)} 55%{opacity:.85;transform:translate(0,0) scale(1.3)} 100%{opacity:0;transform:translate(10px,0) scale(.6)} }
@keyframes baMagic  { 0%{opacity:0;transform:scale(.2) rotate(0deg)} 30%{opacity:1;transform:scale(1.6) rotate(180deg)} 60%{opacity:.85;transform:scale(1.2) rotate(310deg)} 100%{opacity:0;transform:scale(.3) rotate(450deg)} }
@keyframes baSlash  { 0%{opacity:0;transform:rotate(-60deg) scale(.3) translate(-20px,-20px)} 28%{opacity:1;transform:rotate(-45deg) scale(1.7) translate(0,0)} 60%{opacity:.75;transform:rotate(-42deg) scale(1.2)} 100%{opacity:0;transform:rotate(-28deg) scale(.5) translate(14px,14px)} }
@keyframes baHide   { 0%,100%{opacity:0} }
@keyframes baScrLine { 0%{opacity:0;transform:translate(-50%,-50%) rotate(-40deg) scaleY(0)} 18%{opacity:1;transform:translate(-50%,-50%) rotate(-40deg) scaleY(1.05)} 55%{opacity:.9;transform:translate(-50%,-50%) rotate(-40deg) scaleY(1)} 100%{opacity:0;transform:translate(-50%,-50%) rotate(-40deg) scaleY(1)} }
@keyframes baRasCor { 0%{opacity:0;transform:scale(0) rotate(0deg)} 30%{opacity:1;transform:scale(1.1) rotate(300deg)} 65%{opacity:1;transform:scale(1) rotate(680deg)} 100%{opacity:0;transform:scale(1.2) rotate(1040deg)} }
@keyframes baRasOrb { 0%{opacity:0;transform:scale(0) rotate(0deg)} 30%{opacity:.6;transform:scale(1.2) rotate(-240deg)} 65%{opacity:.4;transform:scale(1.4) rotate(-560deg)} 100%{opacity:0;transform:scale(1.7) rotate(-820deg)} }
@keyframes baSlashGrow { 0%{opacity:0;transform:translate(-50%,-50%) rotate(-45deg) scaleX(0)} 16%{opacity:1;transform:translate(-50%,-50%) rotate(-45deg) scaleX(1.08)} 50%{opacity:.85;transform:translate(-50%,-50%) rotate(-45deg) scaleX(1)} 100%{opacity:0;transform:translate(-50%,-50%) rotate(-45deg) scaleX(1.1)} }
@keyframes baBloodMain { 0%{opacity:0;transform:translate(-50%,-50%) scale(0) rotate(-12deg)} 28%{opacity:1;transform:translate(-50%,-50%) scale(1.3) rotate(-14deg)} 55%{transform:translate(-50%,-50%) scale(0.88) rotate(-11deg)} 100%{opacity:1;transform:translate(-50%,-50%) scale(1) rotate(-12deg)} }
@keyframes baBloodDrop { 0%{opacity:0;transform:translate(-50%,-50%) scale(0)} 38%{opacity:1;transform:translate(-50%,-50%) scale(1.3)} 65%{transform:translate(-50%,-50%) scale(0.85)} 100%{opacity:1;transform:translate(-50%,-50%) scale(1)} }
@keyframes baXP { 0%{opacity:0;transform:translateY(10px) scale(.75)} 55%{opacity:1;transform:translateY(-2px) scale(1.08)} 100%{opacity:1;transform:translateY(0) scale(1)} }
`;

// ── Types ────────────────────────────────────────────────────────────────────

type HeroInfo = { name: string; imagePath: string | null; element?: string; level?: number };
type AnimSlot = { name: string; dur: number; key: number };
const IDLE: AnimSlot = { name: 'none', dur: 0, key: 0 };

// ── Helpers ──────────────────────────────────────────────────────────────────

type HitType = 'PA' | 'MP' | 'DEX';

function getDominantStat(pa?: number, mp?: number, dex?: number): HitType {
  const p = pa ?? 0, m = mp ?? 0, d = dex ?? 0;
  if (p >= m && p >= d) return 'PA';
  if (m >= d) return 'MP';
  return 'DEX';
}

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
  const [hitInd, setHitInd] = useState<{ type: HitType; side: 'left' | 'right'; k: number } | null>(null);

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
    setHitInd(null);
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

    // ── Phase 0: Entrance animation for new heroes ────────────────────────────
    const prevRound = idx > 0 ? rounds[idx - 1] : null;
    const leftEntering  = prevRound != null && prevRound.attackerHero !== round.attackerHero;
    const rightEntering = prevRound != null && prevRound.defenderHero !== round.defenderHero;
    if (leftEntering)  bump(setLAnim, 'baEnterL', 950 / speed);
    if (rightEntering) bump(setRAnim, 'baEnterR', 950 / speed);
    if (leftEntering || rightEntering) {
      await sleep(950);
      if (cancelRef.current) { setBusy(false); return; }
    }

    const CHARGE_DUR = 950;
    const PEAK_MS    = 390;  // ~41% of CHARGE_DUR — hero reaches opponent
    const IMPACT_MS  = 260;  // impact burst shown
    const RETRACT_MS = CHARGE_DUR - PEAK_MS - IMPACT_MS; // wait for full retract

    const firstSetter  = leftGoesFirst ? setLAnim : setRAnim;
    const secondSetter = leftGoesFirst ? setRAnim : setLAnim;
    const firstCharge  = leftGoesFirst ? 'baCR' : 'baCL';
    const secondCharge = leftGoesFirst ? 'baCL' : 'baCR';

    // Dominant stat for each hero's attack — drives the hit indicator visual
    const leftDom  = getDominantStat(round.attackerPaContrib, round.attackerMpContrib, round.attackerDexContrib);
    const rightDom = getDominantStat(round.defenderPaContrib, round.defenderMpContrib, round.defenderDexContrib);

    // ── Phase 1: Champion charges ─────────────────────────────────────────────
    bump(firstSetter, firstCharge, CHARGE_DUR / speed);
    await sleep(PEAK_MS);
    if (cancelRef.current) { setBusy(false); return; }

    // Impact lands on the OPPONENT (the second/new-entrant hero)
    setShowImpact(true);
    setImpactKey(k => k + 1);
    if (leftGoesFirst) {
      // Left hits right → indicator + damage on right; right flashes
      setHitInd({ type: leftDom, side: 'right', k: Date.now() });
      setDmgR({ v: round.attackerAttackValue, k: Date.now() + 1 });
      bump(setRAnim, 'baHF', 700 / speed);
    } else {
      // Right hits left → indicator + damage on left; left flashes
      setHitInd({ type: rightDom, side: 'left', k: Date.now() });
      setDmgL({ v: round.defenderAttackValue, k: Date.now() + 1 });
      bump(setLAnim, 'baHF', 700 / speed);
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
      // Right hits left → indicator + damage on left; left flashes
      setHitInd({ type: rightDom, side: 'left', k: Date.now() });
      setDmgL({ v: round.defenderAttackValue, k: Date.now() + 1 });
      bump(setLAnim, 'baHF', 700 / speed);
    } else {
      // Left hits right → indicator + damage on right; right flashes
      setHitInd({ type: leftDom, side: 'right', k: Date.now() });
      setDmgR({ v: round.attackerAttackValue, k: Date.now() + 1 });
      bump(setRAnim, 'baHF', 700 / speed);
    }
    await sleep(IMPACT_MS);
    if (cancelRef.current) { setBusy(false); return; }
    setShowImpact(false);
    await sleep(RETRACT_MS);
    if (cancelRef.current) { setBusy(false); return; }

    // ── Phase 3: Resolution — winner glow + loser shake ───────────────────────
    setRoundRes(round.winner);
    if (round.winner === 'attacker') {
      bump(setLAnim, 'baWP', 1100 / speed);
      bump(setRAnim, 'baSR', 800 / speed);
    } else {
      bump(setRAnim, 'baWP', 1100 / speed);
      bump(setLAnim, 'baSL', 800 / speed);
    }
    await sleep(1100);
    if (cancelRef.current) { setBusy(false); return; }

    // ── Phase 4: Elimination if hero knocked out this round ───────────────────
    const cOut = round.winner === 'defender' && (!rounds[idx + 1] || rounds[idx + 1].attackerHero !== round.attackerHero);
    const dOut = round.winner === 'attacker' && (!rounds[idx + 1] || rounds[idx + 1].defenderHero !== round.defenderHero);
    if (cOut) bump(setLAnim, 'baEL', 800 / speed);
    if (dOut) bump(setRAnim, 'baEL', 800 / speed);
    if (cOut || dOut) await sleep(700);   // sleep() already divides by speed
    if (cancelRef.current) { setBusy(false); return; }

    // ── Reset ─────────────────────────────────────────────────────────────────
    // Keep eliminated hero slots invisible (opacity 0) to avoid a full-color flash
    // before the new hero's entrance animation starts from opacity 0.
    if (cOut) bump(setLAnim, 'baHide', 99999); else setLAnim(IDLE);
    if (dOut) bump(setRAnim, 'baHide', 99999); else setRAnim(IDLE);
    setRoundRes(null);
    setDmgL(null);
    setDmgR(null);
    setHitInd(null);
    await sleep(280);
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
  // Flat hero-name → xp lookup covering both sides
  const xpData = useMemo(() => {
    const out: Record<string, number> = {};
    if (battleLog.xpGained) {
      Object.entries(battleLog.xpGained.challenger).forEach(([h, xp]) => { out[h] = xp; });
      Object.entries(battleLog.xpGained.defender).forEach(([h, xp]) => { out[h] = xp; });
    }
    return out;
  }, [battleLog.xpGained]);

  const round = rounds[Math.min(roundIdx, rounds.length - 1)];
  const cDefeated = useMemo(() => getDefeated(rounds, roundIdx, 'attacker'), [rounds, roundIdx]);
  const dDefeated = useMemo(() => getDefeated(rounds, roundIdx, 'defender'), [rounds, roundIdx]);
  const cHero = cRoster.find(h => h.name === round?.attackerHero) ?? cRoster[0];
  const dHero = dRoster.find(h => h.name === round?.defenderHero) ?? dRoster[0];
  const isAtEnd = roundIdx >= rounds.length - 1;
  const finalWinner = battleLog.winner === 'challenger' ? battleLog.challenger.username : battleLog.defender.username;

  // ── Hit effect helpers (rendered inside portrait, clipped by overflow:hidden)

  const renderScratch = (sp: number) => (
    <>
      {([-18, 0, 18] as const).map((xOff, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: '50%',
          left: `calc(50% + ${xOff}px)`,
          width: 5,
          height: '85%',
          background: 'linear-gradient(to bottom, transparent 0%, #ff5500 12%, #ff2200 45%, #ff5500 88%, transparent 100%)',
          filter: 'drop-shadow(0 0 5px #ff4400)',
          animationName: 'baScrLine',
          animationDuration: `${1050 / sp}ms`,
          animationDelay: `${i * 75}ms`,
          animationFillMode: 'both',
          animationTimingFunction: 'ease-out',
          pointerEvents: 'none',
        }} />
      ))}
    </>
  );

  const renderRasengan = (sp: number) => {
    const dur = `${1100 / sp}ms`;
    return (
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
        {/* Outer counter-rotating orbit ring */}
        <div style={{
          position: 'absolute', width: 90, height: 90, borderRadius: '50%',
          border: '3px solid rgba(96,165,250,0.8)',
          boxShadow: '0 0 18px #3b82f6, inset 0 0 14px rgba(59,130,246,0.4)',
          animationName: 'baRasOrb', animationDuration: dur,
          animationFillMode: 'forwards', animationTimingFunction: 'linear',
        }} />
        {/* Spinning conic-gradient core ball */}
        <div style={{
          position: 'absolute', width: 65, height: 65, borderRadius: '50%',
          background: 'conic-gradient(from 0deg, #1e3a8a 0%, #60a5fa 30%, #bfdbfe 50%, #3b82f6 70%, #1d4ed8 85%, #60a5fa 100%)',
          filter: 'blur(1px) drop-shadow(0 0 14px #3b82f6) drop-shadow(0 0 28px rgba(59,130,246,0.5))',
          animationName: 'baRasCor', animationDuration: dur,
          animationFillMode: 'forwards', animationTimingFunction: 'ease-out',
        }} />
        {/* Bright center glow */}
        <div style={{
          position: 'absolute', width: 22, height: 22, borderRadius: '50%',
          background: 'radial-gradient(circle, #ffffff 0%, #93c5fd 55%, transparent 100%)',
          filter: 'blur(2px)',
          animationName: 'baRasCor', animationDuration: dur,
          animationFillMode: 'forwards', animationTimingFunction: 'ease-out',
        }} />
      </div>
    );
  };

  const renderSlash = (sp: number) => (
    <>
      {/* Main slash streak — centered on portrait */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%', width: '120%', height: 7,
        background: 'linear-gradient(to right, transparent, rgba(251,191,36,0.6), #fbbf24, #ffffff, #fbbf24, rgba(251,191,36,0.4), transparent)',
        filter: 'drop-shadow(0 0 10px #fbbf24) drop-shadow(0 0 20px rgba(251,191,36,0.6))',
        animationName: 'baSlashGrow', animationDuration: `${950 / sp}ms`,
        animationFillMode: 'forwards', animationTimingFunction: 'ease-out',
        pointerEvents: 'none',
      }} />
      {/* Secondary thinner slash — slight offset for depth */}
      <div style={{
        position: 'absolute', top: 'calc(50% - 10px)', left: 'calc(50% - 8px)', width: '100%', height: 3,
        background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.4), #ffffff, rgba(255,255,255,0.3), transparent)',
        filter: 'blur(1px)',
        animationName: 'baSlashGrow', animationDuration: `${850 / sp}ms`,
        animationDelay: '40ms',
        animationFillMode: 'forwards', animationTimingFunction: 'ease-out',
        pointerEvents: 'none',
      }} />
    </>
  );

  const renderBloodSplatter = (sp: number, label: string) => {
    const poolDur = `${900 / sp}ms`;
    // Droplets scattered just outside the pool edges (pool is ~144×58)
    const droplets = [
      { w: 14, h: 9,  tOff: -34, lOff: -16, delay: '80ms'  },
      { w: 10, h: 7,  tOff: -36, lOff:  24, delay: '140ms' },
      { w: 16, h: 10, tOff: -26, lOff: -58, delay: '60ms'  },
      { w: 8,  h: 6,  tOff: -24, lOff:  56, delay: '180ms' },
      { w: 12, h: 8,  tOff:  26, lOff: -50, delay: '100ms' },
      { w: 9,  h: 6,  tOff:  24, lOff:  46, delay: '120ms' },
    ];
    return (
      <div style={{ position: 'relative', width: 148, height: 62, pointerEvents: 'none', flexShrink: 0 }}>
        {/* Main blood pool — centered, grows from nothing */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          width: 144, height: 58, borderRadius: '50%',
          background: 'radial-gradient(ellipse at 46% 40%, #cc1500 0%, #880000 42%, #550000 78%, rgba(40,0,0,0.9) 100%)',
          filter: 'drop-shadow(0 0 8px rgba(160,0,0,.75))',
          animationName: 'baBloodMain', animationDuration: poolDur,
          animationFillMode: 'both', animationTimingFunction: 'ease-out',
          zIndex: 1,
        }} />
        {/* Scatter droplets */}
        {droplets.map((d, i) => (
          <div key={i} style={{
            position: 'absolute',
            top: `calc(50% + ${d.tOff}px)`, left: `calc(50% + ${d.lOff}px)`,
            width: d.w, height: d.h, borderRadius: '50%',
            background: 'radial-gradient(ellipse, #cc1100 0%, #880000 72%, transparent 100%)',
            animationName: 'baBloodDrop', animationDuration: `${760 / sp}ms`,
            animationDelay: d.delay, animationFillMode: 'both', animationTimingFunction: 'ease-out',
            zIndex: 1,
          }} />
        ))}
        {/* Number centered over the pool */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
          <span style={{
            fontSize: 42, fontWeight: 900, color: '#fff',
            textShadow: '0 0 8px rgba(0,0,0,1), 0 1px 3px rgba(0,0,0,1), 0 0 20px rgba(160,0,0,.9)',
            whiteSpace: 'nowrap', lineHeight: 1,
          }}>
            {label}
          </span>
        </div>
      </div>
    );
  };

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
    const PORTRAIT_SIZE = 200;
    const showHit = !!(hitInd && ((isLeft && hitInd.side === 'left') || (!isLeft && hitInd.side === 'right')));

    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, position: 'relative' }}>
        {/* Floating damage number — floats up beside portrait, stays until end of round */}
        {dmg && (
          <div key={dmg.k} style={{
            position: 'absolute',
            top: 72,
            // Inner side (toward center): left hero → right of portrait; right hero → left of portrait
            ...(isLeft ? { left: 'calc(50% + 88px)' } : { right: 'calc(50% + 88px)' }),
            zIndex: 30,
            animationName: 'baDF',
            animationDuration: `${870 / speed}ms`,
            animationFillMode: 'both',
            animationTimingFunction: 'ease-out',
            pointerEvents: 'none',
          }}>
            {renderBloodSplatter(speed, dmg.v.toFixed(1))}
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
              {/* Hit effect — clipped to portrait bounds */}
              {showHit && (
                <div key={hitInd!.k} style={{ position: 'absolute', inset: 0, zIndex: 40, pointerEvents: 'none' }}>
                  {hitInd!.type === 'PA' && renderScratch(speed)}
                  {hitInd!.type === 'MP' && renderRasengan(speed)}
                  {hitInd!.type === 'DEX' && renderSlash(speed)}
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

  const DOT_SIZE = 62;
  const renderRosterDots = (roster: HeroInfo[], defeated: Set<string>, activeHeroName: string | undefined, align: 'left' | 'right') => (
    <div style={{ display: 'flex', gap: 6, justifyContent: align === 'left' ? 'flex-start' : 'flex-end', flexWrap: 'wrap' }}>
      {roster.map((h, i) => {
        const isDead = defeated.has(h.name);
        const isActive = h.name === activeHeroName && !isDead;
        const heroXp = isAtEnd && !isPlaying && !busy ? xpData[h.name] : undefined;
        return (
          <div key={i} title={h.name} style={{
            position: 'relative',
            borderRadius: 6,
            overflow: 'hidden',
            flexShrink: 0,
            border: isActive ? '2px solid #4ade80' : isDead ? '2px solid #333' : '2px solid #2a2a4a',
            filter: isDead ? 'grayscale(1) brightness(0.35)' : undefined,
            boxShadow: isActive ? '0 0 12px rgba(74,222,128,.55)' : undefined,
            transition: 'filter 0.5s ease, border-color 0.3s ease, box-shadow 0.3s ease',
          }}>
            {h.imagePath
              ? <HeroPortrait imagePath={h.imagePath} name={h.name} size={DOT_SIZE} />
              : <div style={{ width: DOT_SIZE, height: Math.round(DOT_SIZE * 200 / 180), backgroundColor: '#16213e', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: 11 }}>{h.name.charAt(0)}</div>
            }
            {/* XP overlay — bottom strip inside the portrait */}
            {heroXp != null && (
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                backgroundColor: 'rgba(0,0,0,0.72)',
                textAlign: 'center',
                color: '#4ade80',
                fontSize: 11, fontWeight: 800,
                padding: '3px 0',
                textShadow: '0 0 6px rgba(74,222,128,.8)',
                whiteSpace: 'nowrap',
                animationName: 'baXP', animationDuration: '0.45s',
                animationFillMode: 'both', animationTimingFunction: 'ease-out',
                pointerEvents: 'none',
              }}>
                +{heroXp} XP
              </div>
            )}
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
    padding: '12px 22px',
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
    minHeight: 440,
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
