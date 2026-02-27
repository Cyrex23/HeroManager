import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { BattleLog } from '../../types';
import HeroPortrait from '../Hero/HeroPortrait';

// ── Constants ────────────────────────────────────────────────────────────────

const ELEM_SYM: Record<string, string> = {
  FIRE: '🔥', WATER: '🌊', WIND: '🌀', EARTH: '⛰️', LIGHTNING: '⚡',
};

const ELEM_COLOR: Record<string, string> = {
  FIRE: '#f97316', WATER: '#38bdf8', WIND: '#4ade80', EARTH: '#a16207', LIGHTNING: '#facc15',
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
@keyframes baSlashV1 { 0%{opacity:0;transform:translate(-50%,-50%) rotate(-52deg) scaleX(0);filter:brightness(5)} 6%{opacity:1;transform:translate(-50%,-50%) rotate(-52deg) scaleX(1.12);filter:brightness(3.5)} 18%{transform:translate(-50%,-50%) rotate(-52deg) scaleX(0.96);filter:brightness(2)} 55%{opacity:1;transform:translate(-50%,-50%) rotate(-52deg) scaleX(1);filter:brightness(1.4)} 100%{opacity:0;transform:translate(-50%,-50%) rotate(-52deg) scaleX(1);filter:brightness(1)} }
@keyframes baSlashV2 { 0%{opacity:0;transform:translate(-50%,-50%) rotate(40deg) scaleX(0)} 6%{opacity:1;transform:translate(-50%,-50%) rotate(40deg) scaleX(1.1)} 18%{transform:translate(-50%,-50%) rotate(40deg) scaleX(0.97)} 52%{opacity:0.8;transform:translate(-50%,-50%) rotate(40deg) scaleX(1)} 100%{opacity:0;transform:translate(-50%,-50%) rotate(40deg) scaleX(1)} }
@keyframes baSlashBurst { 0%{opacity:0;transform:translate(-50%,-50%) scale(0)} 11%{opacity:1;transform:translate(-50%,-50%) scale(1.5)} 36%{opacity:0.65;transform:translate(-50%,-50%) scale(1.1)} 100%{opacity:0;transform:translate(-50%,-50%) scale(2)} }
@keyframes baSlashLine { 0%{opacity:0;transform:scaleY(0)} 13%{opacity:0.7;transform:scaleY(1)} 60%{opacity:0.35} 100%{opacity:0;transform:scaleY(1)} }
@keyframes baBloodMain { 0%{opacity:0;transform:translate(-50%,-50%) scale(0) rotate(-12deg)} 28%{opacity:1;transform:translate(-50%,-50%) scale(1.3) rotate(-14deg)} 55%{transform:translate(-50%,-50%) scale(0.88) rotate(-11deg)} 100%{opacity:1;transform:translate(-50%,-50%) scale(1) rotate(-12deg)} }
@keyframes baBloodDrop { 0%{opacity:0;transform:translate(-50%,-50%) scale(0)} 38%{opacity:1;transform:translate(-50%,-50%) scale(1.3)} 65%{transform:translate(-50%,-50%) scale(0.85)} 100%{opacity:1;transform:translate(-50%,-50%) scale(1)} }
@keyframes baXP { 0%{opacity:0;transform:translateY(10px) scale(.75)} 55%{opacity:1;transform:translateY(-2px) scale(1.08)} 100%{opacity:1;transform:translateY(0) scale(1)} }
@keyframes baSpell { 0%{opacity:0;transform:translateY(18px) scale(0.68);filter:brightness(1)} 7%{opacity:1;transform:translateY(-7px) scale(1.22);filter:brightness(3) saturate(2.2)} 15%{transform:translateX(-8px) scale(1.14);filter:brightness(2.4)} 23%{transform:translateX(8px) scale(1.17);filter:brightness(2.8)} 31%{transform:translateX(-6px) scale(1.10);filter:brightness(2.1)} 39%{transform:translateX(6px) scale(1.08);filter:brightness(1.8)} 47%{transform:translateX(-4px) scale(1.05);filter:brightness(1.5)} 55%{transform:translateX(3px) scale(1.03);filter:brightness(1.3)} 63%{transform:translateX(0) scale(1.01);filter:brightness(1.1)} 100%{opacity:1;transform:scale(1);filter:brightness(1)} }
@keyframes baManaGlow { 0%,100%{box-shadow:0 0 8px rgba(59,130,246,0.55),0 0 0 rgba(96,165,250,0)} 50%{box-shadow:0 0 28px rgba(59,130,246,1),0 0 56px rgba(96,165,250,0.7),0 0 90px rgba(147,197,253,0.35)} }
@keyframes baOverlayIn { 0%{opacity:0;transform:scale(0.92)} 100%{opacity:1;transform:scale(1)} }
@keyframes baTitleIn { 0%{opacity:0;transform:translateY(-18px)} 100%{opacity:1;transform:translateY(0)} }
@keyframes baSwordsIn { 0%{opacity:0;transform:scale(0.5) rotate(-20deg)} 100%{opacity:1;transform:scale(1) rotate(0deg)} }
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

function buildRoster(
  teamHeroes: Array<{ name: string; imagePath: string; level: number; element?: string } | string>,
  rounds: BattleLog['rounds'],
  side: 'attacker' | 'defender',
  summon?: { name: string; imagePath: string } | null,
): HeroInfo[] {
  // Build a map from rounds for supplemental data (backward compat + image fallback)
  const roundMap = new Map<string, { imagePath: string | null; level?: number; element?: string }>();
  for (const r of rounds) {
    const name = side === 'attacker' ? r.attackerHero : r.defenderHero;
    if (!roundMap.has(name)) {
      roundMap.set(name, {
        imagePath: (side === 'attacker' ? r.attackerImagePath : r.defenderImagePath) ?? null,
        level: side === 'attacker' ? r.attackerLevel : r.defenderLevel,
        element: side === 'attacker' ? r.attackerElement : r.defenderElement,
      });
    }
  }

  const list: HeroInfo[] = teamHeroes.map(h => {
    if (typeof h === 'string') {
      // Old format (legacy battle logs stored as plain strings)
      const rd = roundMap.get(h);
      return { name: h, imagePath: rd?.imagePath ?? null, level: rd?.level, element: rd?.element };
    }
    return { name: h.name, imagePath: h.imagePath || null, level: h.level, element: h.element };
  });

  if (summon) {
    list.push({ name: summon.name, imagePath: summon.imagePath || null });
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
  const navigate = useNavigate();
  const rounds = battleLog.rounds;
  const cRoster = useMemo(
    () => buildRoster(battleLog.challenger.heroes as any, rounds, 'attacker', battleLog.challenger.summon),
    [battleLog, rounds],
  );
  const dRoster = useMemo(
    () => buildRoster(battleLog.defender.heroes as any, rounds, 'defender', battleLog.defender.summon),
    [battleLog, rounds],
  );

  const [roundIdx, setRoundIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [busy, setBusy] = useState(false);

  // Per-side animation slot — key change forces re-mount → restarts animation
  const [lAnim, setLAnim] = useState<AnimSlot>(IDLE);
  const [rAnim, setRAnim] = useState<AnimSlot>(IDLE);
  const [showImpact, setShowImpact] = useState(false);
  const [impactKey, setImpactKey] = useState(0);
  const [dmgL, setDmgL] = useState<{ v: number; k: number; elemBonus?: number; elem?: string; rawAttack?: number; staminaLost?: number } | null>(null);
  const [dmgR, setDmgR] = useState<{ v: number; k: number; elemBonus?: number; elem?: string; rawAttack?: number; staminaLost?: number } | null>(null);
  const [roundRes, setRoundRes] = useState<'attacker' | 'defender' | null>(null);
  const [hitInd, setHitInd] = useState<{ type: HitType; side: 'left' | 'right'; k: number } | null>(null);
  const [cSpellNotif, setCSpellNotif] = useState<{ spells: Array<{ name: string; manaCost: number }>; k: number } | null>(null);
  const [dSpellNotif, setDSpellNotif] = useState<{ spells: Array<{ name: string; manaCost: number }>; k: number } | null>(null);
  // -1 = show full mana (before any round plays); >= 0 = show mana after that round index
  const [manaDisplayIdx, setManaDisplayIdx] = useState(-1);

  const [showEndOverlay, setShowEndOverlay] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

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

  // Show end overlay when battle finishes (after user has interacted)
  useEffect(() => {
    if (!hasInteracted) return;
    if (roundIdx >= rounds.length - 1 && !isPlaying && !busy) {
      const t = setTimeout(() => setShowEndOverlay(true), 420);
      return () => clearTimeout(t);
    }
  }, [hasInteracted, roundIdx, rounds.length, isPlaying, busy]);

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
    setCSpellNotif(null);
    setDSpellNotif(null);
    setManaDisplayIdx(-1);
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

    // ── Spell notifications ───────────────────────────────────────────────────
    const cSp = (round as any).challengerSpells as Array<{ spellName: string; manaCost: number }> | undefined;
    const dSp = (round as any).defenderSpells as Array<{ spellName: string; manaCost: number }> | undefined;
    if (cSp?.length) setCSpellNotif({ spells: cSp.map(sp => ({ name: sp.spellName, manaCost: sp.manaCost })), k: Date.now() });
    if (dSp?.length) setDSpellNotif({ spells: dSp.map(sp => ({ name: sp.spellName, manaCost: sp.manaCost })), k: Date.now() + 1 });
    if (cSp?.length || dSp?.length) {
      setManaDisplayIdx(idx);  // update bar only now that the spell visually fires
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
      setDmgR({ v: round.attackerAttackValue, k: Date.now() + 1, elemBonus: round.attackerElementBonus, elem: round.attackerElement, rawAttack: round.attackerRawAttack, staminaLost: round.attackerStaminaReduction });
      bump(setRAnim, 'baHF', 700 / speed);
    } else {
      // Right hits left → indicator + damage on left; left flashes
      setHitInd({ type: rightDom, side: 'left', k: Date.now() });
      setDmgL({ v: round.defenderAttackValue, k: Date.now() + 1, elemBonus: round.defenderElementBonus, elem: round.defenderElement, rawAttack: round.defenderRawAttack, staminaLost: round.defenderStaminaReduction });
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
      setDmgL({ v: round.defenderAttackValue, k: Date.now() + 1, elemBonus: round.defenderElementBonus, elem: round.defenderElement, rawAttack: round.defenderRawAttack, staminaLost: round.defenderStaminaReduction });
      bump(setLAnim, 'baHF', 700 / speed);
    } else {
      // Left hits right → indicator + damage on right; right flashes
      setHitInd({ type: leftDom, side: 'right', k: Date.now() });
      setDmgR({ v: round.attackerAttackValue, k: Date.now() + 1, elemBonus: round.attackerElementBonus, elem: round.attackerElement, rawAttack: round.attackerRawAttack, staminaLost: round.attackerStaminaReduction });
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
    setCSpellNotif(null);
    setDSpellNotif(null);
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
    const clamped = Math.max(0, Math.min(idx, rounds.length - 1));
    setRoundIdx(clamped);
    // Show accumulated mana state: mana after the previous round (idx-1), or full at start (idx=0)
    setManaDisplayIdx(clamped - 1);
  }, [rounds.length, resetVisuals]);

  const handlePlay = () => {
    setHasInteracted(true);
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

  const handleSkipAll = () => {
    setHasInteracted(true);
    skipTo(rounds.length - 1);
  };

  const handleRewatch = () => {
    setShowEndOverlay(false);
    doneRef.current = false;
    cancelRef.current = true;
    setBusy(false);
    resetVisuals();
    setRoundIdx(0);
    setTimeout(() => setIsPlaying(true), 80);
  };

  // ── Derived
  // Flat hero-name → xp lookup covering both sides
  const xpData = useMemo(() => {
    const out: Record<string, number> = {};
    if (battleLog.xpGained) {
      Object.entries(battleLog.xpGained.challenger).forEach(([h, xp]) => { out[h] = xp; });
      Object.entries(battleLog.xpGained.defender).forEach(([h, xp]) => { out[h] = xp; });
    }
    if (battleLog.summonXp) {
      const cs = battleLog.challenger.summon;
      const ds = battleLog.defender.summon;
      if (cs && battleLog.summonXp.challenger > 0) out[cs.name] = battleLog.summonXp.challenger;
      if (ds && battleLog.summonXp.defender   > 0) out[ds.name] = battleLog.summonXp.defender;
    }
    return out;
  }, [battleLog.xpGained, battleLog.summonXp, battleLog.challenger.summon, battleLog.defender.summon]);

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

  const renderSlash = (sp: number) => {
    const dur = 950 / sp;
    const core = '#ffffff';
    const edge = '#a5f3fc';  // light cyan
    const glow = '#06b6d4';  // cyan
    const speedLines = [
      { x: -54, delay: 0,  h: '82%' },
      { x: -22, delay: 22, h: '74%' },
      { x:  18, delay: 12, h: '78%' },
      { x:  50, delay: 38, h: '68%' },
    ];
    const aFill = 'both' as const;
    const aEase = 'ease-out';
    return (
      <>
        {/* Vertical speed lines — extreme speed feel */}
        {speedLines.map((ln, i) => (
          <div key={i} style={{
            position: 'absolute', top: '12%', left: `calc(50% + ${ln.x}px)`,
            width: 1.5, height: ln.h, transformOrigin: 'top center',
            background: `linear-gradient(to bottom, transparent, ${edge}bb 25%, ${edge}66 75%, transparent)`,
            filter: `drop-shadow(0 0 3px ${glow})`,
            animationName: 'baSlashLine', animationDuration: `${dur * 0.7}ms`,
            animationDelay: `${ln.delay}ms`, animationFillMode: aFill, animationTimingFunction: aEase,
            pointerEvents: 'none',
          }} />
        ))}
        {/* Primary slash: wide glow halo (renders behind) */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%', width: '135%', height: 20,
          background: `linear-gradient(to right, transparent, ${glow}33, ${glow}55, ${glow}33, transparent)`,
          filter: 'blur(6px)',
          animationName: 'baSlashV1', animationDuration: `${dur * 1.08}ms`,
          animationDelay: '6ms', animationFillMode: aFill, animationTimingFunction: aEase,
          pointerEvents: 'none',
        }} />
        {/* Primary slash: sharp bright core */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%', width: '135%', height: 5,
          background: `linear-gradient(to right, transparent, ${edge}99, ${core}, ${core}, ${edge}99, transparent)`,
          filter: `drop-shadow(0 0 8px ${glow}) drop-shadow(0 0 18px ${glow}aa)`,
          animationName: 'baSlashV1', animationDuration: `${dur}ms`,
          animationFillMode: aFill, animationTimingFunction: aEase,
          pointerEvents: 'none',
        }} />
        {/* Primary slash: motion trail (delayed, offset) */}
        <div style={{
          position: 'absolute', top: 'calc(50% + 7px)', left: '50%', width: '125%', height: 3,
          background: `linear-gradient(to right, transparent, ${edge}55, ${edge}88, ${edge}55, transparent)`,
          filter: 'blur(2px)',
          animationName: 'baSlashV1', animationDuration: `${dur * 1.18}ms`,
          animationDelay: '32ms', animationFillMode: aFill, animationTimingFunction: aEase,
          pointerEvents: 'none',
        }} />
        {/* Counter-slash: secondary X stroke (delayed) */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%', width: '115%', height: 4,
          background: `linear-gradient(to right, transparent, ${edge}77, ${core}dd, ${edge}77, transparent)`,
          filter: `drop-shadow(0 0 6px ${glow})`,
          animationName: 'baSlashV2', animationDuration: `${dur * 0.88}ms`,
          animationDelay: '88ms', animationFillMode: aFill, animationTimingFunction: aEase,
          pointerEvents: 'none',
        }} />
        {/* Center impact burst */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%', width: 72, height: 72,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(255,255,255,0.98) 0%, ${glow}cc 30%, ${glow}44 60%, transparent 75%)`,
          filter: `drop-shadow(0 0 12px ${glow}) drop-shadow(0 0 28px ${glow}88)`,
          animationName: 'baSlashBurst', animationDuration: `${dur * 0.62}ms`,
          animationFillMode: aFill, animationTimingFunction: aEase,
          pointerEvents: 'none',
        }} />
      </>
    );
  };

  const renderBloodSplatter = (sp: number, label: string, elemBonus?: number, elem?: string, rawAttack?: number, staminaLost?: number) => {
    const poolDur = `${900 / sp}ms`;
    const hasStamina = staminaLost != null && staminaLost > 0;
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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none', gap: 3 }}>
        {/* Raw total damage — shown above when stamina reduced it */}
        {hasStamina && rawAttack != null && (
          <span style={{
            fontSize: 17, fontWeight: 800, color: 'rgba(255,255,255,0.55)',
            textShadow: '0 1px 4px rgba(0,0,0,0.9)',
            textDecoration: 'line-through',
            textDecorationColor: 'rgba(251,113,133,0.6)',
            whiteSpace: 'nowrap', lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {rawAttack.toFixed(1)}
          </span>
        )}

        {/* Blood pool + real damage number */}
        <div style={{ position: 'relative', width: 148, height: 62, flexShrink: 0 }}>
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
          {/* Elemental bonus badge — bottom-right corner */}
          {elemBonus != null && elemBonus > 0 && elem && (
            <div style={{
              position: 'absolute', bottom: -6, right: -12,
              display: 'flex', alignItems: 'center', gap: 2,
              backgroundColor: 'rgba(0,0,0,0.82)',
              border: `1px solid ${ELEM_COLOR[elem] ?? '#fff'}`,
              borderRadius: 5,
              padding: '2px 6px',
              zIndex: 3,
              boxShadow: `0 0 8px ${ELEM_COLOR[elem] ?? '#fff'}55`,
            }}>
              <span style={{ fontSize: 12, lineHeight: 1 }}>{ELEM_SYM[elem] ?? '⚡'}</span>
              <span style={{
                color: ELEM_COLOR[elem] ?? '#fff',
                fontWeight: 900, fontSize: 14, lineHeight: 1,
                textShadow: `0 0 8px ${ELEM_COLOR[elem] ?? '#fff'}`,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {elemBonus.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {/* Stamina reduction — shown below when applicable */}
        {hasStamina && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            backgroundColor: 'rgba(0,0,0,0.72)',
            border: '1px solid rgba(251,113,133,0.35)',
            borderRadius: 6,
            padding: '2px 8px',
          }}>
            <span style={{ fontSize: 14, color: '#fb7185', lineHeight: 1 }}>↓</span>
            <span style={{
              fontSize: 14, fontWeight: 800, color: '#fb7185',
              textShadow: '0 0 6px rgba(251,113,133,0.6)',
              fontVariantNumeric: 'tabular-nums', lineHeight: 1,
            }}>
              {staminaLost!.toFixed(1)}
            </span>
            <span style={{ fontSize: 10, color: 'rgba(251,113,133,0.55)', fontWeight: 600, letterSpacing: '0.05em' }}>
              STAM
            </span>
          </div>
        )}
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
    manaTotal: number,
    manaCurrent: number,
    spellNotif: { spells: Array<{ name: string; manaCost: number }>; k: number } | null,
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
            {renderBloodSplatter(speed, dmg.v.toFixed(1), dmg.elemBonus, dmg.elem, dmg.rawAttack, dmg.staminaLost)}
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

        {/* Mana bar — below the name, only if team has mana */}
        {manaTotal > 0 && (() => {
          const pct = Math.max(0, Math.min(1, manaCurrent / manaTotal));
          return (
            <div style={{ width: PORTRAIT_SIZE + 100, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, ...s.manaBarTrack }}>
                <div style={{
                  ...s.manaBarFill,
                  width: `${pct * 100}%`,
                  animationName: spellNotif ? 'baManaGlow' : 'none',
                  animationDuration: '0.9s',
                  animationIterationCount: 'infinite',
                }} />
              </div>
              <span style={s.manaBarLabel}>{Math.round(manaCurrent)}/{Math.round(manaTotal)} Mana Pool</span>
            </div>
          );
        })()}

        {/* Spell notifications — each row pops in sequentially */}
        {spellNotif && (
          <div key={spellNotif.k} style={{ ...s.spellNotifWrap, width: PORTRAIT_SIZE + 40 }}>
            {spellNotif.spells.map((sp, i) => (
              <div key={sp.name + i} style={{
                ...s.spellNotif,
                animationDelay: `${i * 600}ms`,
              }}>
                <span style={s.spellNotifIcon}>✦</span>
                <span style={s.spellNotifName}>{sp.name}</span>
                <span style={s.spellNotifCost}>−{sp.manaCost} MP</span>
              </div>
            ))}
          </div>
        )}
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

        {renderHeroColumn(cHero, lAnim, true, dmgL,
          battleLog.challengerManaTotal ?? 0,
          manaDisplayIdx >= 0 ? (rounds[manaDisplayIdx]?.challengerManaAfter ?? (battleLog.challengerManaTotal ?? 0)) : (battleLog.challengerManaTotal ?? 0),
          cSpellNotif,
        )}

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

        {renderHeroColumn(dHero, rAnim, false, dmgR,
          battleLog.defenderManaTotal ?? 0,
          manaDisplayIdx >= 0 ? (rounds[manaDisplayIdx]?.defenderManaAfter ?? (battleLog.defenderManaTotal ?? 0)) : (battleLog.defenderManaTotal ?? 0),
          dSpellNotif,
        )}
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
          <button onClick={handleSkipAll} disabled={isAtEnd} title="Skip to end" style={{ ...s.ctrl, ...s.skipCtrl, opacity: isAtEnd ? 0.4 : 1 }}>SKIP</button>
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

      {/* ── End overlay ── */}
      {showEndOverlay && (
        <div style={s.overlayBackdrop}>
          <div style={s.overlayCard}>
            {(() => {
              const challengerWon = result === 'WIN' || (!result && battleLog.winner === 'challenger');
              const defenderWon   = result === 'LOSS' || (!result && battleLog.winner === 'defender');
              const renderSide = (
                won: boolean,
                imagePath: string | undefined,
                name: string | undefined,
                username: string,
              ) => (
                <div style={{ ...s.overlayPlayerSide, opacity: won ? 1 : 0.45 }}>
                  <div style={{
                    ...s.overlayResultTitle,
                    fontSize: won ? 26 : 18,
                    color: won ? '#4ade80' : '#e94560',
                    textShadow: won ? '0 0 28px rgba(74,222,128,0.8), 0 0 6px rgba(74,222,128,0.5)' : '0 0 10px rgba(233,69,96,0.4)',
                  }}>
                    {won ? 'VICTORY' : 'DEFEAT'}
                  </div>
                  {imagePath && (
                    <div style={{
                      borderRadius: 10,
                      overflow: 'hidden',
                      boxShadow: won
                        ? '0 0 0 2px #4ade80, 0 0 30px rgba(74,222,128,0.55), 0 0 60px rgba(74,222,128,0.2)'
                        : '0 0 20px rgba(0,0,0,.8)',
                      transform: won ? 'scale(1.08)' : 'scale(0.92)',
                      transition: 'transform 0.3s ease',
                      filter: won ? 'none' : 'grayscale(40%) brightness(0.7)',
                    }}>
                      <HeroPortrait imagePath={imagePath} name={name ?? ''} size={won ? 110 : 80} />
                    </div>
                  )}
                  <div style={{ ...s.overlayUsername, color: won ? '#e0e0f0' : '#6a6a8a' }}>{username}</div>
                </div>
              );
              return (
                <div style={s.overlaySides}>
                  {renderSide(challengerWon, battleLog.challenger.profileImagePath ?? cRoster[0]?.imagePath ?? undefined, battleLog.challenger.username, battleLog.challenger.username)}
                  <div style={s.overlayVsDivider}>VS</div>
                  {renderSide(defenderWon, battleLog.defender.profileImagePath ?? dRoster[0]?.imagePath ?? undefined, battleLog.defender.username, battleLog.defender.username)}
                </div>
              );
            })()}

            {goldEarned != null && goldEarned > 0 && (
              <div style={s.overlayGoldRow}>
                <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                  {/* bottom coin */}
                  <ellipse cx="13" cy="21" rx="8" ry="3" fill="#92400e" stroke="#fbbf24" strokeWidth="1.2"/>
                  <ellipse cx="13" cy="20" rx="8" ry="3" fill="#d97706" stroke="#fbbf24" strokeWidth="1.2"/>
                  {/* middle coin */}
                  <ellipse cx="13" cy="16" rx="8" ry="3" fill="#92400e" stroke="#fbbf24" strokeWidth="1.2"/>
                  <ellipse cx="13" cy="15" rx="8" ry="3" fill="#d97706" stroke="#fbbf24" strokeWidth="1.2"/>
                  {/* top coin */}
                  <ellipse cx="13" cy="11" rx="8" ry="3" fill="#92400e" stroke="#fbbf24" strokeWidth="1.2"/>
                  <ellipse cx="13" cy="10" rx="8" ry="3" fill="#fbbf24" stroke="#fbbf24" strokeWidth="1.2"/>
                  <ellipse cx="13" cy="10" rx="5" ry="1.8" fill="#fde68a" opacity="0.5"/>
                </svg>
                <span style={s.overlayGoldText}>+{goldEarned}</span>
              </div>
            )}

            <div style={s.overlayActions}>
              <button onClick={handleRewatch} style={s.overlayBtnRewatch}>⟳ Rewatch</button>
              <button onClick={() => navigate('/arena')} style={s.overlayBtnFinish}>Finish</button>
            </div>
          </div>
        </div>
      )}
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
  manaBarWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  manaBarTrack: {
    flex: 1,
    height: 13,
    backgroundColor: 'rgba(20,20,50,0.95)',
    borderRadius: 7,
    border: '1px solid rgba(59,130,246,0.35)',
    overflow: 'hidden',
    position: 'relative',
  },
  manaBarFill: {
    height: '100%',
    background: 'linear-gradient(to right, #1e3a8a, #2563eb, #3b82f6, #60a5fa)',
    borderRadius: 7,
    transition: 'width 0.6s ease',
    boxShadow: '0 0 8px rgba(59,130,246,0.5)',
  },
  manaBarLabel: {
    color: '#93c5fd',
    fontSize: 12,
    fontWeight: 800,
    whiteSpace: 'nowrap',
    fontVariantNumeric: 'tabular-nums',
    letterSpacing: 0.3,
    textShadow: '0 0 6px rgba(59,130,246,0.5)',
  },
  spellNotifWrap: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 5,
    marginTop: 6,
  },
  spellNotif: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '7px 14px',
    backgroundColor: 'rgba(59,130,246,0.18)',
    border: '1px solid rgba(96,165,250,0.6)',
    borderRadius: 8,
    animationName: 'baSpell',
    animationDuration: '3.5s',
    animationFillMode: 'both',
    animationTimingFunction: 'ease-out',
    boxShadow: '0 0 22px rgba(59,130,246,0.55), 0 0 50px rgba(96,165,250,0.2)',
  },
  spellNotifIcon: {
    color: '#60a5fa',
    fontSize: 16,
    textShadow: '0 0 12px #3b82f6, 0 0 24px rgba(96,165,250,0.8)',
    flexShrink: 0,
  },
  spellNotifName: {
    color: '#bfdbfe',
    fontWeight: 800,
    fontSize: 13,
    letterSpacing: 0.4,
    flex: 1,
    textShadow: '0 0 10px rgba(147,197,253,0.7)',
  },
  spellNotifCost: {
    color: '#93c5fd',
    fontWeight: 900,
    fontSize: 12,
    backgroundColor: 'rgba(59,130,246,0.3)',
    border: '1px solid rgba(96,165,250,0.4)',
    borderRadius: 4,
    padding: '2px 7px',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    textShadow: '0 0 8px rgba(96,165,250,0.9)',
  },
  skipCtrl: {
    backgroundColor: 'rgba(251,191,36,0.1)',
    borderColor: 'rgba(251,191,36,0.28)',
    color: '#fbbf24',
    fontWeight: 700,
    fontSize: 11,
    letterSpacing: 0.8,
  },
  overlayBackdrop: {
    position: 'fixed' as const,
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.52)',
    backdropFilter: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  overlayCard: {
    backgroundColor: '#0e0e22',
    border: '1px solid #2a2a50',
    borderRadius: 18,
    padding: '40px 56px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 26,
    boxShadow: '0 30px 90px rgba(0,0,0,.95), 0 0 0 1px rgba(255,255,255,0.04)',
    animationName: 'baOverlayIn',
    animationDuration: '0.42s',
    animationFillMode: 'both' as const,
    animationTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
    minWidth: 460,
  },
  overlaySwords: {
    fontSize: 30,
    color: '#e94560',
    textShadow: '0 0 22px rgba(233,69,96,.65)',
    animationName: 'baSwordsIn',
    animationDuration: '0.5s',
    animationFillMode: 'both' as const,
    animationTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
    animationDelay: '0.1s',
  },
  overlaySides: {
    display: 'flex',
    alignItems: 'center',
    gap: 44,
    animationName: 'baTitleIn',
    animationDuration: '0.45s',
    animationFillMode: 'both' as const,
    animationDelay: '0.15s',
  },
  overlayPlayerSide: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 10,
  },
  overlayResultTitle: {
    fontSize: 22,
    fontWeight: 900,
    letterSpacing: 2.5,
    textTransform: 'uppercase' as const,
    textShadow: '0 0 22px currentColor',
  },
  overlayUsername: {
    color: '#c0c0e0',
    fontWeight: 700,
    fontSize: 14,
    letterSpacing: 0.3,
  },
  overlayVsDivider: {
    color: '#3a3a6a',
    fontSize: 13,
    fontWeight: 900,
    letterSpacing: 3,
    flexShrink: 0,
    paddingBottom: 28,
  },
  overlayGoldRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(251,191,36,0.07)',
    border: '1px solid rgba(251,191,36,0.22)',
    borderRadius: 10,
    padding: '10px 26px',
    animationName: 'baTitleIn',
    animationDuration: '0.45s',
    animationFillMode: 'both' as const,
    animationDelay: '0.25s',
  },
  overlayGoldText: {
    color: '#fbbf24',
    fontWeight: 800,
    fontSize: 18,
    textShadow: '0 0 14px rgba(251,191,36,.5)',
    fontVariantNumeric: 'tabular-nums' as const,
  },
  overlayActions: {
    display: 'flex',
    gap: 14,
    animationName: 'baTitleIn',
    animationDuration: '0.45s',
    animationFillMode: 'both' as const,
    animationDelay: '0.32s',
  },
  overlayBtnRewatch: {
    padding: '10px 28px',
    backgroundColor: 'transparent',
    color: '#a0a0c0',
    border: '1px solid #2a2a50',
    borderRadius: 9,
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: 0.4,
  },
  overlayBtnFinish: {
    padding: '10px 28px',
    backgroundColor: '#e94560',
    color: '#fff',
    border: 'none',
    borderRadius: 9,
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: 0.4,
    boxShadow: '0 0 20px rgba(233,69,96,.4)',
  },
};
