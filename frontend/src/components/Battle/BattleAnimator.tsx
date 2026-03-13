import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coins } from 'lucide-react';
import type { BattleLog } from '../../types';
import HeroPortrait from '../Hero/HeroPortrait';

// ── Constants ────────────────────────────────────────────────────────────────

const ELEM_SYM: Record<string, string> = {
  FIRE: '🔥', WATER: '🌊', WIND: '🌀', EARTH: '⛰️', LIGHTNING: '⚡',
};

const ELEM_COLOR: Record<string, string> = {
  FIRE: '#f97316', WATER: '#38bdf8', WIND: '#7dd3fc', EARTH: '#a16207', LIGHTNING: '#facc15',
};

// Keyframes injected once into <head>
const ANIM_CSS = `
@keyframes baCR  { 0%{transform:translateX(0) scale(1)} 42%{transform:translateX(150px) scale(1.08)} 68%{transform:translateX(135px) scale(1.03)} 100%{transform:translateX(0) scale(1)} }
@keyframes baCL  { 0%{transform:translateX(0) scale(1)} 42%{transform:translateX(-150px) scale(1.08)} 68%{transform:translateX(-135px) scale(1.03)} 100%{transform:translateX(0) scale(1)} }
@keyframes baHF  { 0%,100%{filter:brightness(1) saturate(1)} 18%{filter:brightness(6) saturate(0) sepia(1) hue-rotate(-30deg)} 55%{filter:brightness(2) saturate(1.5)} }
@keyframes baWP  { 0%,100%{filter:brightness(1) drop-shadow(0 0 0px transparent)} 45%{filter:brightness(1.3) drop-shadow(0 0 20px #4ade80) drop-shadow(0 0 48px rgba(74,222,128,.35))} }
@keyframes baSL  { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-13px)} 40%{transform:translateX(13px)} 60%{transform:translateX(-9px)} 80%{transform:translateX(9px)} }
@keyframes baSR  { 0%,100%{transform:translateX(0)} 20%{transform:translateX(13px)} 40%{transform:translateX(-13px)} 60%{transform:translateX(9px)} 80%{transform:translateX(-9px)} }
@keyframes baBadgePop { 0%{transform:scale(0) rotate(-15deg);opacity:0} 65%{transform:scale(1.2) rotate(4deg);opacity:1} 100%{transform:scale(1) rotate(0deg);opacity:1} }
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
@keyframes baXPJump { 0%{transform:scale(1);filter:brightness(1)} 25%{transform:scale(1.6);filter:brightness(1.8)} 55%{transform:scale(1.4);filter:brightness(1.4)} 75%{transform:scale(1.1);filter:brightness(1.1)} 100%{transform:scale(1);filter:brightness(1)} }
@keyframes baSpell { 0%{opacity:0;transform:translateY(12px) scale(0.72) rotate(0deg)} 7%{opacity:1;transform:translateY(0) scale(1.1) rotate(0deg);filter:brightness(2.8) saturate(2)} 16%{transform:scale(1.06) rotate(22deg);filter:brightness(2)} 25%{transform:scale(1.03) rotate(-17deg);filter:brightness(1.6)} 33%{transform:scale(1.01) rotate(12deg);filter:brightness(1.35)} 41%{transform:scale(1) rotate(-8deg);filter:brightness(1.2)} 49%{transform:rotate(5deg);filter:brightness(1.1)} 57%{transform:rotate(-3deg)} 64%{transform:rotate(1.8deg)} 71%{transform:rotate(-1deg)} 78%{transform:rotate(0.5deg)} 100%{opacity:1;transform:scale(1) rotate(0deg);filter:brightness(1)} }
@keyframes baManaGlow { 0%,100%{box-shadow:0 0 8px rgba(59,130,246,0.55),0 0 0 rgba(96,165,250,0)} 50%{box-shadow:0 0 28px rgba(59,130,246,1),0 0 56px rgba(96,165,250,0.7),0 0 90px rgba(147,197,253,0.35)} }
@keyframes baOverlayIn { 0%{opacity:0;transform:scale(0.92)} 100%{opacity:1;transform:scale(1)} }
@keyframes baTitleIn { 0%{opacity:0;transform:translateY(-18px)} 100%{opacity:1;transform:translateY(0)} }
@keyframes baSwordsIn { 0%{opacity:0;transform:scale(0.5) rotate(-20deg)} 100%{opacity:1;transform:scale(1) rotate(0deg)} }
@keyframes baDexFloat { 0%{opacity:0;transform:translateY(2px) scale(0.75)} 16%{opacity:1;transform:translateY(-10px) scale(1.25)} 60%{opacity:1;transform:translateY(-20px) scale(1.05)} 100%{opacity:0;transform:translateY(-32px) scale(0.85)} }
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
  goldBase?: number | null;
  goldBonusPct?: number | null;
}

export default function BattleAnimator({ battleLog, result, goldEarned, goldBonusPct }: Props) {
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
  const [dmgL, setDmgL] = useState<{ v: number; k: number; elemBonus?: number; elem?: string; rawAttack?: number; staminaLost?: number; crit?: boolean; magicProf?: boolean; attackFlat?: number; highDex?: boolean } | null>(null);
  const [dmgR, setDmgR] = useState<{ v: number; k: number; elemBonus?: number; elem?: string; rawAttack?: number; staminaLost?: number; crit?: boolean; magicProf?: boolean; attackFlat?: number; highDex?: boolean } | null>(null);
  const [roundRes, setRoundRes] = useState<'attacker' | 'defender' | null>(null);
  const [hitInd, setHitInd] = useState<{ type: HitType; side: 'left' | 'right'; k: number } | null>(null);
  const [cSpellNotif, setCSpellNotif] = useState<{ spells: Array<{ name: string; manaCost: number }>; k: number } | null>(null);
  const [dSpellNotif, setDSpellNotif] = useState<{ spells: Array<{ name: string; manaCost: number }>; k: number } | null>(null);
  // -1 = show full mana (before any round plays); >= 0 = show mana after that round index
  const [manaDisplayIdx, setManaDisplayIdx] = useState(-1);
  // DEX display — null means show full (max); number = tracked current value
  const [dexValL, setDexValL] = useState<number | null>(null);
  const [dexValR, setDexValR] = useState<number | null>(null);
  // dexRecovering: true = slow 1.0s transition (recovering), false = fast 0.35s (expenditure)
  const [dexRecoveringL, setDexRecoveringL] = useState(false);
  const [dexRecoveringR, setDexRecoveringR] = useState(false);
  const [dexExpDeltaL, setDexExpDeltaL] = useState<{ net: number; k: number } | null>(null);
  const [dexExpDeltaR, setDexExpDeltaR] = useState<{ net: number; k: number } | null>(null);
  const [dexRecDeltaL, setDexRecDeltaL] = useState<{ net: number; k: number } | null>(null);
  const [dexRecDeltaR, setDexRecDeltaR] = useState<{ net: number; k: number } | null>(null);

  const [showEndOverlay, setShowEndOverlay] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [displayedXp, setDisplayedXp] = useState<Record<string, number>>({});

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
    setDexValL(null);
    setDexValR(null);
    setDexRecoveringL(false);
    setDexRecoveringR(false);
    setDexExpDeltaL(null);
    setDexExpDeltaR(null);
    setDexRecDeltaL(null);
    setDexRecDeltaR(null);
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
    if (leftEntering)  { bump(setLAnim, 'baEnterL', 950 / speed); setDexValL(null); }
    if (rightEntering) { bump(setRAnim, 'baEnterR', 950 / speed); setDexValR(null); }
    if (leftEntering || rightEntering) {
      await sleep(950);
      if (cancelRef.current) { setBusy(false); return; }
    }

    // ── Spell notifications ───────────────────────────────────────────────────
    const cSp = ((round as any).challengerSpells as Array<{ spellName: string; manaCost: number; fired?: boolean }> | undefined)?.filter(sp => sp.fired !== false);
    const dSp = ((round as any).defenderSpells as Array<{ spellName: string; manaCost: number; fired?: boolean }> | undefined)?.filter(sp => sp.fired !== false);
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
      setDmgR({ v: round.attackerAttackValue, k: Date.now() + 1, elemBonus: round.attackerElementBonus, elem: round.attackerElement, rawAttack: round.attackerRawAttack, staminaLost: round.attackerStaminaReduction, crit: round.attackerCrit, magicProf: round.attackerMagicProf, attackFlat: round.attackerStatAttack, highDex: round.attackerHighDex });
      bump(setRAnim, 'baHF', 700 / speed);
      // DEX expenditure for Phase-1 attacker (left = attacker)
      { const used = round.attackerDexUsed ?? 0; const rec = round.attackerDexRecovered ?? 0; const rem = round.attackerDexRemaining;
        if (used > 0 && rem != null) { setDexValL(rem - rec); setDexExpDeltaL({ net: -used, k: Date.now() + 2 }); } }
    } else {
      // Right hits left → indicator + damage on left; left flashes
      setHitInd({ type: rightDom, side: 'left', k: Date.now() });
      setDmgL({ v: round.defenderAttackValue, k: Date.now() + 1, elemBonus: round.defenderElementBonus, elem: round.defenderElement, rawAttack: round.defenderRawAttack, staminaLost: round.defenderStaminaReduction, crit: round.defenderCrit, magicProf: round.defenderMagicProf, attackFlat: round.defenderStatAttack, highDex: round.defenderHighDex });
      bump(setLAnim, 'baHF', 700 / speed);
      // DEX expenditure for Phase-1 attacker (right = defender)
      { const used = round.defenderDexUsed ?? 0; const rec = round.defenderDexRecovered ?? 0; const rem = round.defenderDexRemaining;
        if (used > 0 && rem != null) { setDexValR(rem - rec); setDexExpDeltaR({ net: -used, k: Date.now() + 2 }); } }
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
      setDmgL({ v: round.defenderAttackValue, k: Date.now() + 1, elemBonus: round.defenderElementBonus, elem: round.defenderElement, rawAttack: round.defenderRawAttack, staminaLost: round.defenderStaminaReduction, crit: round.defenderCrit, magicProf: round.defenderMagicProf, attackFlat: round.defenderStatAttack, highDex: round.defenderHighDex });
      bump(setLAnim, 'baHF', 700 / speed);
      // DEX expenditure for Phase-2 attacker (right = defender)
      { const used = round.defenderDexUsed ?? 0; const rec = round.defenderDexRecovered ?? 0; const rem = round.defenderDexRemaining;
        if (used > 0 && rem != null) { setDexValR(rem - rec); setDexExpDeltaR({ net: -used, k: Date.now() + 2 }); } }
    } else {
      // Left hits right → indicator + damage on right; right flashes
      setHitInd({ type: leftDom, side: 'right', k: Date.now() });
      setDmgR({ v: round.attackerAttackValue, k: Date.now() + 1, elemBonus: round.attackerElementBonus, elem: round.attackerElement, rawAttack: round.attackerRawAttack, staminaLost: round.attackerStaminaReduction, crit: round.attackerCrit, magicProf: round.attackerMagicProf, attackFlat: round.attackerStatAttack, highDex: round.attackerHighDex });
      bump(setRAnim, 'baHF', 700 / speed);
      // DEX expenditure for Phase-2 attacker (left = attacker)
      { const used = round.attackerDexUsed ?? 0; const rec = round.attackerDexRecovered ?? 0; const rem = round.attackerDexRemaining;
        if (used > 0 && rem != null) { setDexValL(rem - rec); setDexExpDeltaL({ net: -used, k: Date.now() + 2 }); } }
    }
    await sleep(IMPACT_MS);
    if (cancelRef.current) { setBusy(false); return; }
    setShowImpact(false);
    await sleep(RETRACT_MS);
    if (cancelRef.current) { setBusy(false); return; }

    // ── Phase 3: Resolution — winner glow + loser shake ───────────────────────
    setRoundRes(round.winner);
    // DEX recovery — set slow-transition flag, then defer value update via rAF (no blocking)
    { const cRec = round.attackerDexRecovered ?? 0; const dRec = round.defenderDexRecovered ?? 0;
      const hasRecL = cRec > 0 && round.attackerDexRemaining != null;
      const hasRecR = dRec > 0 && round.defenderDexRemaining != null;
      const remL = round.attackerDexRemaining;
      const remR = round.defenderDexRemaining;
      if (hasRecL) setDexRecoveringL(true);
      if (hasRecR) setDexRecoveringR(true);
      // rAF fires after browser paints the slow-transition state — no await, no blocking
      requestAnimationFrame(() => {
        if (remL != null) setDexValL(remL);
        if (remR != null) setDexValR(remR);
        if (hasRecL) setTimeout(() => setDexRecoveringL(false), 1100);
        if (hasRecR) setTimeout(() => setDexRecoveringR(false), 1100);
      }); }
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
    // DEX deltas are NOT cleared here — they fade out naturally via animation (1.4s)
    // and get replaced by the next round's delta. Clearing them early cuts the recovery anim short.
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
    // DEX: show final value of previous round for current hero (reset to null=full if hero changed)
    const prevR = clamped > 0 ? rounds[clamped - 1] : null;
    const curR = rounds[clamped];
    setDexValL(prevR && prevR.attackerHero === curR?.attackerHero ? (prevR.attackerDexRemaining ?? null) : null);
    setDexValR(prevR && prevR.defenderHero === curR?.defenderHero ? (prevR.defenderDexRemaining ?? null) : null);
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
  // xpData: hero name → BASE xp (before bonus)
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

  // xpBonusData: hero name → bonus %
  const xpBonusData = useMemo(() => {
    const out: Record<string, number> = {};
    if (battleLog.xpBonusPercent) {
      Object.entries(battleLog.xpBonusPercent.challenger).forEach(([h, p]) => { if (p > 0) out[h] = p; });
      Object.entries(battleLog.xpBonusPercent.defender).forEach(([h, p]) => { if (p > 0) out[h] = p; });
    }
    return out;
  }, [battleLog.xpBonusPercent]);

  const round = rounds[Math.min(roundIdx, rounds.length - 1)];
  const cDefeated = useMemo(() => getDefeated(rounds, roundIdx, 'attacker'), [rounds, roundIdx]);
  const dDefeated = useMemo(() => getDefeated(rounds, roundIdx, 'defender'), [rounds, roundIdx]);
  const cHero = cRoster.find(h => h.name === round?.attackerHero) ?? cRoster[0];
  const dHero = dRoster.find(h => h.name === round?.defenderHero) ?? dRoster[0];
  const isAtEnd = roundIdx >= rounds.length - 1;

  // DEX helpers
  const getMaxDex = (heroName: string | undefined, side: 'attacker' | 'defender') => {
    if (!heroName) return 0;
    const fr = rounds.find(r => (side === 'attacker' ? r.attackerHero : r.defenderHero) === heroName);
    if (!fr) return 0;
    const rem = (side === 'attacker' ? fr.attackerDexRemaining : fr.defenderDexRemaining) ?? 0;
    const used = (side === 'attacker' ? fr.attackerDexUsed : fr.defenderDexUsed) ?? 0;
    const rec = (side === 'attacker' ? fr.attackerDexRecovered : fr.defenderDexRecovered) ?? 0;
    return rem + used - rec;
  };
  const cMaxDex = getMaxDex(cHero?.name, 'attacker');
  const dMaxDex = getMaxDex(dHero?.name, 'defender');
  const cCurDex = dexValL ?? cMaxDex;
  const dCurDex = dexValR ?? dMaxDex;

  // Animate XP count-up from base → total for heroes with bonus
  useEffect(() => {
    if (!isAtEnd || isPlaying || busy) return;
    const base: Record<string, number> = {};
    Object.keys(xpData).forEach(name => { base[name] = xpData[name]; });
    setDisplayedXp(base);

    // Only animate heroes that actually earned XP (won at least one clash)
    const heroes = Object.keys(xpBonusData).filter(name => xpData[name] != null && xpData[name] > 0);
    if (heroes.length === 0) { return; }

    // Dynamic step duration: target ~1500ms total regardless of diff size, clamped 80–750ms
    const maxDiff = Math.max(...heroes.map(name => Math.round(xpData[name] * (1 + xpBonusData[name] / 100)) - xpData[name]));
    const STEP_MS = Math.max(80, Math.min(750, Math.round(1500 / maxDiff)));
    const startTime = Date.now();
    let raf: number;
    const animate = () => {
      const steps = Math.floor((Date.now() - startTime) / STEP_MS);
      const next: Record<string, number> = { ...base };
      let allDone = true;
      heroes.forEach(name => {
        const total = Math.round(xpData[name] * (1 + xpBonusData[name] / 100));
        const current = Math.min(xpData[name] + steps, total);
        next[name] = current;
        if (current < total) { allDone = false; }
      });
      setDisplayedXp(next);
      if (!allDone) { raf = requestAnimationFrame(animate); }
    };
    const timeout = setTimeout(() => { raf = requestAnimationFrame(animate); }, 400);
    return () => { clearTimeout(timeout); cancelAnimationFrame(raf); };
  }, [isAtEnd, isPlaying, busy]); // eslint-disable-line react-hooks/exhaustive-deps
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

  const renderBloodSplatter = (sp: number, label: string, elemBonus?: number, elem?: string, rawAttack?: number, staminaLost?: number, crit?: boolean, magicProf?: boolean, isLeft?: boolean, attackFlat?: number, highDex?: boolean) => {
    const poolDur = `${900 / sp}ms`;
    const hasStamina = staminaLost != null && staminaLost > 0;
    const hasAttackFlat = attackFlat != null && attackFlat > 0;
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

        {/* Blood pool + proc icons row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexDirection: isLeft ? 'row' : 'row-reverse' }}>
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

        {/* Proc icons — crit (runner), magic proficiency (dice), high dex (sword) */}
        {(crit || magicProf || highDex) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'center' }}>
            {crit && (
              <div title="Critical Hit" style={{
                width: 30, height: 30,
                background: 'linear-gradient(135deg, rgba(251,146,60,0.18), rgba(251,191,36,0.10))',
                border: '1.5px solid rgba(251,146,60,0.7)',
                borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 10px rgba(251,146,60,0.5)',
                animationName: 'baBadgePop', animationDuration: '0.3s',
                animationFillMode: 'both', animationTimingFunction: 'ease-out',
              }}>
                {/* Kick SVG */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  {/* Head */}
                  <circle cx="7" cy="3.2" r="2.3" fill="#fb923c"/>
                  {/* Torso leaning forward */}
                  <line x1="7" y1="5.5" x2="10" y2="13" stroke="#fb923c" strokeWidth="1.8" strokeLinecap="round"/>
                  {/* Kicking leg extended right */}
                  <line x1="10" y1="13" x2="22" y2="9.5" stroke="#fb923c" strokeWidth="1.8" strokeLinecap="round"/>
                  {/* Kick foot */}
                  <circle cx="22" cy="9.5" r="1.3" fill="#fb923c"/>
                  {/* Standing leg bent back */}
                  <path d="M10 13 L8.5 18.5 L5.5 22" stroke="#fb923c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  {/* Front arm reaching forward */}
                  <line x1="8" y1="8.5" x2="14.5" y2="5.5" stroke="#fb923c" strokeWidth="1.4" strokeLinecap="round"/>
                  {/* Back arm swinging back */}
                  <line x1="8" y1="8.5" x2="3.5" y2="12" stroke="#fb923c" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              </div>
            )}
            {magicProf && (
              <div title="Magic Proficiency" style={{
                width: 30, height: 30,
                background: 'linear-gradient(135deg, rgba(124,58,237,0.28), rgba(88,28,135,0.18))',
                border: '1.5px solid rgba(167,139,250,0.85)',
                borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 14px rgba(139,92,246,0.7), 0 0 28px rgba(109,40,217,0.35)',
                animationName: 'baBadgePop', animationDuration: '0.3s',
                animationFillMode: 'both', animationTimingFunction: 'ease-out',
                animationDelay: crit ? '0.08s' : '0s',
              }}>
                {/* Isometric d6 — arcane purple */}
                <svg width="19" height="19" viewBox="0 0 20 20" fill="none">
                  {/* Left face */}
                  <polygon points="2,5.5 10,10 10,19 2,14.5" fill="#3b0764" stroke="#7c3aed" strokeWidth="0.6"/>
                  {/* Right face */}
                  <polygon points="18,5.5 18,14.5 10,19 10,10" fill="#4c1d95" stroke="#6d28d9" strokeWidth="0.6"/>
                  {/* Top face */}
                  <polygon points="10,1 18,5.5 10,10 2,5.5" fill="#7c3aed" stroke="#c4b5fd" strokeWidth="0.8"/>
                  {/* Top-face edge highlight */}
                  <line x1="10" y1="1" x2="18" y2="5.5" stroke="#ede9fe" strokeWidth="0.7" opacity="0.75"/>
                  <line x1="10" y1="1" x2="2"  y2="5.5" stroke="#ede9fe" strokeWidth="0.7" opacity="0.75"/>
                  {/* Pip dots on top face */}
                  <circle cx="8"    cy="7.2"  r="1.15" fill="white" opacity="0.95"/>
                  <circle cx="10"   cy="5.3"  r="1.15" fill="white" opacity="0.95"/>
                  <circle cx="12"   cy="3.5"  r="1.15" fill="white" opacity="0.95"/>
                </svg>
              </div>
            )}
            {highDex && (
              <div title="High DEX Consumption" style={{
                width: 30, height: 30,
                background: 'linear-gradient(135deg, rgba(34,197,94,0.22), rgba(16,185,129,0.12))',
                border: '1.5px solid rgba(74,222,128,0.75)',
                borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 12px rgba(74,222,128,0.65), 0 0 24px rgba(16,185,129,0.3)',
                animationName: 'baBadgePop', animationDuration: '0.3s',
                animationFillMode: 'both', animationTimingFunction: 'ease-out',
                animationDelay: (crit && magicProf) ? '0.16s' : (crit || magicProf) ? '0.08s' : '0s',
              }}>
                {/* Sword SVG */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  {/* Blade */}
                  <line x1="4" y1="20" x2="18" y2="4" stroke="#4ade80" strokeWidth="2" strokeLinecap="round"/>
                  {/* Tip shine */}
                  <circle cx="18.5" cy="3.5" r="1.2" fill="#86efac"/>
                  {/* Crossguard */}
                  <line x1="8" y1="16" x2="14" y2="10" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="6" y1="14" x2="8" y2="16" stroke="#86efac" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="14" y1="10" x2="16" y2="8" stroke="#86efac" strokeWidth="1.5" strokeLinecap="round"/>
                  {/* Handle */}
                  <line x1="4" y1="20" x2="6" y2="18" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              </div>
            )}
          </div>
        )}
        </div>{/* end pool+icons row */}

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
        {/* Flat attack bonus — shown below when applicable */}
        {hasAttackFlat && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            backgroundColor: 'rgba(0,0,0,0.72)',
            border: '1px solid rgba(249,115,22,0.35)',
            borderRadius: 6,
            padding: '2px 8px',
          }}>
            <span style={{ fontSize: 14, color: '#f97316', lineHeight: 1 }}>↑</span>
            <span style={{
              fontSize: 14, fontWeight: 800, color: '#f97316',
              textShadow: '0 0 6px rgba(249,115,22,0.6)',
              fontVariantNumeric: 'tabular-nums', lineHeight: 1,
            }}>
              {attackFlat!.toFixed(1)}
            </span>
            <span style={{ fontSize: 10, color: 'rgba(249,115,22,0.55)', fontWeight: 600, letterSpacing: '0.05em' }}>
              ATK
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
    dexMax: number,
    dexCur: number,
    _dexExpDelta: { net: number; k: number } | null,
    _dexRecDelta: { net: number; k: number } | null,
    dexRecovering: boolean,
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
            {renderBloodSplatter(speed, dmg.v.toFixed(1), dmg.elemBonus, dmg.elem, dmg.rawAttack, dmg.staminaLost, dmg.crit, dmg.magicProf, isLeft, dmg.attackFlat, dmg.highDex)}
          </div>
        )}

        {/* Portrait outer — holds animated wrapper + DEX delta (no overflow clip here) */}
        <div style={{ position: 'relative', display: 'inline-block' }}>
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
              <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: '2.5px solid #4b5563', boxShadow: isWinner ? '0 0 32px rgba(74,222,128,.55), 0 0 60px rgba(74,222,128,.2)' : isLoser ? '0 0 20px rgba(233,69,96,.4)' : '0 6px 30px rgba(0,0,0,.8)', transition: 'box-shadow 0.4s ease' }}>
                <HeroPortrait imagePath={hero.imagePath} name={hero.name} size={PORTRAIT_SIZE} />
                {/* Level badge — above DEX bar */}
                {/* Level badge — epic styled, sits just above DEX bar */}
                <div style={{
                  position: 'absolute', bottom: 20, right: 5,
                  background: 'linear-gradient(160deg, #2a1a04 0%, #3d2509 40%, #2a1a04 100%)',
                  border: '1.5px solid #92400e',
                  borderRadius: 6,
                  padding: '3px 7px 4px',
                  display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 3,
                  boxShadow: '0 0 10px rgba(251,191,36,0.5), 0 0 22px rgba(251,191,36,0.18), 0 2px 8px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,210,80,0.22), inset 0 -1px 0 rgba(0,0,0,0.6)',
                  zIndex: 5,
                }}>
                  {/* Top shine */}
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '42%', background: 'linear-gradient(to bottom, rgba(255,220,100,0.13), transparent)', borderRadius: '5px 5px 0 0', pointerEvents: 'none' }} />
                  <span style={{ fontSize: 8, fontWeight: 800, color: '#d97706', letterSpacing: '0.12em', lineHeight: 1, textShadow: '0 1px 3px rgba(0,0,0,1)', fontFamily: 'Inter, sans-serif', marginTop: 1 }}>LV</span>
                  <span style={{
                    fontSize: 19, fontWeight: 900, color: '#fde68a', lineHeight: 1,
                    fontFamily: 'Inter, sans-serif',
                    textShadow: '0 0 8px rgba(251,191,36,0.95), 0 0 18px rgba(251,191,36,0.5), -1px -1px 0 rgba(0,0,0,1), 1px -1px 0 rgba(0,0,0,1), -1px 1px 0 rgba(0,0,0,1), 1px 1px 0 rgba(0,0,0,1), 0 2px 6px rgba(0,0,0,1)',
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {hero.level}
                  </span>
                </div>
                {/* Element symbol with color square behind it */}
                {elemSym && hero.element && (
                  <div style={{ position: 'absolute', top: 4, left: 5, pointerEvents: 'none', zIndex: 5 }}>
                    <div style={{ position: 'absolute', inset: 0, borderRadius: 4, background: hero.element === 'WIND' ? 'linear-gradient(135deg, #7dd3fc, #e0f2fe, #7dd3fc)' : (ELEM_COLOR[hero.element] ?? '#888'), boxShadow: `0 0 10px ${ELEM_COLOR[hero.element] ?? '#888'}, 0 0 20px ${ELEM_COLOR[hero.element] ?? '#888'}55`, opacity: 0.55, zIndex: 0 }} />
                    <span style={{ position: 'relative', fontSize: 20, lineHeight: 1, zIndex: 1, textShadow: '0 1px 6px rgba(0,0,0,.95), 0 0 10px rgba(0,0,0,.8)' }}>{elemSym}</span>
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
                {/* DEX bar — bottom of portrait */}
                {dexMax > 0 && (() => {
                  const pct = Math.max(0, Math.min(1, dexCur / dexMax));
                  const fill = `linear-gradient(90deg, #052e16 0%, #0f3d20 25%, #14532d 55%, #166534 80%, #15803d 100%)`;
                  const glow = 'rgba(21,128,61,0.6)';
                  return (
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 22, backgroundColor: '#3a3a4a', zIndex: 10, borderTop: '1px solid rgba(255,255,255,0.12)', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.6)' }}>
                      {/* Fill */}
                      <div style={{
                        position: 'absolute', top: 0, left: 0, bottom: 0,
                        width: `${pct * 100}%`,
                        background: fill,
                        boxShadow: `0 0 10px ${glow}, inset 0 1px 0 rgba(255,255,255,0.18)`,
                        transition: `width ${dexRecovering ? '1.0s' : '0.35s'} ${dexRecovering ? 'ease-in-out' : 'ease-out'}`,
                        borderRight: pct > 0 && pct < 1 ? `1px solid ${glow}` : 'none',
                      }}>
                        {/* Top shine */}
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: 'linear-gradient(to bottom, rgba(255,255,255,0.22), transparent)', pointerEvents: 'none' }} />
                      </div>
                      {/* Dragon Slayer — diagonal, overflows upward into portrait */}
                      <svg width="115" height="46" viewBox="0 0 115 46"
                        style={{ position: 'absolute', left: 3, bottom: 0, pointerEvents: 'none', zIndex: 15, overflow: 'visible', filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.9))', transform: 'scale(0.41)', transformOrigin: 'left bottom' }}>
                        {/* Wado Ichimonji — crosses Dragon Slayer, handle lower-right blade upper-left */}
                        <g transform="translate(108,42) rotate(202)">
                          {/* Kashira (pommel) — small rounded silver cap */}
                          <ellipse cx="0" cy="0" rx="3.2" ry="2.8" fill="#c8c8d4" />
                          <ellipse cx="0" cy="0" rx="3.2" ry="2.8" fill="none" stroke="#9090a8" strokeWidth="0.7" />
                          <ellipse cx="-0.8" cy="-0.8" rx="1.4" ry="1" fill="rgba(255,255,255,0.3)" />
                          {/* Tsuka (handle) — black with white ito wrap */}
                          <rect x="3.2" y="-2.8" width="19" height="5.6" rx="1.5" fill="#0d0d14" />
                          <rect x="3.2" y="-2.8" width="19" height="1.4" rx="1" fill="rgba(255,255,255,0.06)" />
                          {/* Diamond ito wrap — white silk */}
                          <line x1="5.5"  y1="-2.8" x2="7"   y2="2.8"  stroke="rgba(230,230,245,0.7)" strokeWidth="0.9" />
                          <line x1="8.5"  y1="-2.8" x2="10"  y2="2.8"  stroke="rgba(230,230,245,0.7)" strokeWidth="0.9" />
                          <line x1="11.5" y1="-2.8" x2="13"  y2="2.8"  stroke="rgba(230,230,245,0.7)" strokeWidth="0.9" />
                          <line x1="14.5" y1="-2.8" x2="16"  y2="2.8"  stroke="rgba(230,230,245,0.7)" strokeWidth="0.9" />
                          <line x1="17.5" y1="-2.8" x2="19"  y2="2.8"  stroke="rgba(230,230,245,0.7)" strokeWidth="0.9" />
                          <line x1="5.5"  y1="2.8"  x2="7"   y2="-2.8" stroke="rgba(200,200,225,0.4)" strokeWidth="0.6" />
                          <line x1="8.5"  y1="2.8"  x2="10"  y2="-2.8" stroke="rgba(200,200,225,0.4)" strokeWidth="0.6" />
                          <line x1="11.5" y1="2.8"  x2="13"  y2="-2.8" stroke="rgba(200,200,225,0.4)" strokeWidth="0.6" />
                          <line x1="14.5" y1="2.8"  x2="16"  y2="-2.8" stroke="rgba(200,200,225,0.4)" strokeWidth="0.6" />
                          <line x1="17.5" y1="2.8"  x2="19"  y2="-2.8" stroke="rgba(200,200,225,0.4)" strokeWidth="0.6" />
                          {/* Tsuba — circular iron guard, Wado's signature */}
                          <circle cx="22.2" cy="0" r="5.8" fill="#72728a" />
                          <circle cx="22.2" cy="0" r="5.8" fill="none" stroke="#505068" strokeWidth="0.9" />
                          <circle cx="22.2" cy="0" r="4.2" fill="none" stroke="rgba(180,180,210,0.35)" strokeWidth="0.5" />
                          <circle cx="22.2" cy="0" r="1.8" fill="rgba(200,200,230,0.15)" />
                          <ellipse cx="20.8" cy="-1.4" rx="1.8" ry="1.1" fill="rgba(255,255,255,0.18)" />
                          {/* Habaki (blade collar) — silver */}
                          <rect x="28" y="-2.2" width="3.5" height="4.4" rx="0.5" fill="#b8b8cc" />
                          <rect x="28" y="-2.2" width="3.5" height="4.4" rx="0.5" fill="none" stroke="#9090a8" strokeWidth="0.5" />
                          {/* Blade — pure white, slender and elegant */}
                          <polygon points="31.5,-2.2 100,0 31.5,2.2" fill="#eeeef8" />
                          {/* Blade top edge — bright white cutting edge */}
                          <line x1="31.5" y1="-2.2" x2="100" y2="0" stroke="rgba(255,255,255,0.95)" strokeWidth="0.7" />
                          {/* Shinogi-ji (flat of blade) sheen */}
                          <polygon points="31.5,-2.2 95,-0.4 95,0 31.5,-1.2" fill="rgba(255,255,255,0.18)" />
                          {/* Bo-hi (fuller groove) */}
                          <line x1="32" y1="-0.9" x2="88" y2="-0.35" stroke="rgba(140,150,190,0.55)" strokeWidth="0.7" />
                          {/* Mune (spine) */}
                          <line x1="31.5" y1="2.2" x2="96" y2="0.3" stroke="rgba(160,165,200,0.45)" strokeWidth="0.5" />
                          {/* Yokote line */}
                          <line x1="93" y1="-1.8" x2="93" y2="1.5" stroke="rgba(170,175,210,0.6)" strokeWidth="0.6" />
                          {/* Kissaki (tip) — elegant curved point */}
                          <polygon points="93,-1.8 100,0 93,1.5" fill="#f4f4ff" />
                          <line x1="96" y1="-1" x2="100" y2="0" stroke="rgba(255,255,255,0.8)" strokeWidth="0.5" />
                        </g>
                        <g transform="translate(4,42) rotate(-22)">
                          {/* Pommel — heavy iron disc */}
                          <ellipse cx="0" cy="0" rx="5.5" ry="5" fill="#2c2c35" />
                          <ellipse cx="0" cy="0" rx="5.5" ry="5" fill="none" stroke="#444455" strokeWidth="1" />
                          <ellipse cx="-1" cy="-1.5" rx="2.5" ry="1.8" fill="rgba(255,255,255,0.1)" />
                          {/* Handle — thick wrapped grip */}
                          <rect x="5" y="-3.8" width="22" height="7.5" rx="2" fill="#1e0e04" />
                          <rect x="5" y="-3.8" width="22" height="2" rx="1.5" fill="rgba(255,255,255,0.07)" />
                          <line x1="8"  y1="-3.8" x2="7"  y2="3.7" stroke="rgba(160,120,50,0.55)" strokeWidth="1.1" />
                          <line x1="12" y1="-3.8" x2="11" y2="3.7" stroke="rgba(160,120,50,0.55)" strokeWidth="1.1" />
                          <line x1="16" y1="-3.8" x2="15" y2="3.7" stroke="rgba(160,120,50,0.55)" strokeWidth="1.1" />
                          <line x1="20" y1="-3.8" x2="19" y2="3.7" stroke="rgba(160,120,50,0.55)" strokeWidth="1.1" />
                          <line x1="24" y1="-3.8" x2="23" y2="3.7" stroke="rgba(160,120,50,0.55)" strokeWidth="1.1" />
                          {/* Crossguard — wide asymmetric slab */}
                          <rect x="26" y="-9" width="6" height="18" rx="1.5" fill="#252530" />
                          <rect x="26" y="-9" width="6" height="18" rx="1.5" fill="none" stroke="#3a3a48" strokeWidth="0.8" />
                          <rect x="26.5" y="-9" width="2" height="8" rx="1" fill="rgba(255,255,255,0.08)" />
                          {/* Blade — Dragon Slayer massive iron slab */}
                          <polygon points="31,-7 108,-3.5 108,3.5 31,7" fill="#18181f" />
                          {/* Blade bevel — top face */}
                          <polygon points="31,-7 108,-3.5 108,-1.5 31,-5" fill="#252532" />
                          {/* Spine highlight */}
                          <line x1="32" y1="-6.2" x2="107" y2="-3.2" stroke="rgba(140,155,185,0.5)" strokeWidth="0.9" />
                          {/* Secondary edge sheen */}
                          <line x1="32" y1="-4.5" x2="107" y2="-2" stroke="rgba(100,115,145,0.3)" strokeWidth="0.6" />
                          {/* Fuller groove */}
                          <line x1="32" y1="-1.2" x2="106" y2="-0.6" stroke="rgba(0,0,0,0.55)" strokeWidth="1.4" />
                          {/* Bottom rough edge */}
                          <line x1="31" y1="7" x2="108" y2="3.5" stroke="#111118" strokeWidth="0.8" />
                          {/* Battle notches — Dragon Slayer is heavily used */}
                          <polygon points="48,7 50,5 52,7"   fill="#18181f" />
                          <polygon points="65,6.5 67,4.5 69,6.5" fill="#18181f" />
                          <polygon points="83,5.8 85,4 87,5.8" fill="#18181f" />
                          <polygon points="97,5.2 99,3.5 101,5.2" fill="#18181f" />
                          {/* Tip — flat brutish end */}
                          <polygon points="106,-3.5 112,0 106,3.5" fill="#1e1e28" />
                          <line x1="109" y1="-2" x2="112" y2="0" stroke="rgba(130,145,175,0.35)" strokeWidth="0.7" />
                          {/* BLOOD — dark dried stains */}
                          <ellipse cx="50" cy="1" rx="9" ry="5" fill="rgba(140,5,5,0.72)" />
                          <ellipse cx="49" cy="0" rx="5.5" ry="3" fill="rgba(180,10,10,0.55)" />
                          <ellipse cx="53" cy="2.5" rx="3" ry="1.8" fill="rgba(120,0,0,0.5)" />
                          <ellipse cx="78" cy="-0.5" rx="7" ry="4" fill="rgba(130,5,5,0.65)" />
                          <ellipse cx="77" cy="-1.5" rx="4" ry="2.2" fill="rgba(170,8,8,0.5)" />
                          {/* Blood drip 1 */}
                          <path d="M52 6 Q52.5 10 52 13 Q51.5 15 52 17" stroke="rgba(160,5,5,0.75)" strokeWidth="1.8" fill="none" strokeLinecap="round" />
                          <ellipse cx="52" cy="18" rx="1.5" ry="1.1" fill="rgba(150,5,5,0.65)" />
                          {/* Blood drip 2 */}
                          <path d="M76 5.5 Q76.5 9 76 12" stroke="rgba(140,5,5,0.7)" strokeWidth="1.4" fill="none" strokeLinecap="round" />
                          <ellipse cx="76" cy="12.8" rx="1.2" ry="0.9" fill="rgba(140,5,5,0.6)" />
                          {/* Scattered drops */}
                          <circle cx="60" cy="-3" r="1.8" fill="rgba(130,5,5,0.55)" />
                          <circle cx="67" cy="4"  r="1.3" fill="rgba(140,5,5,0.5)" />
                          <circle cx="88" cy="-2" r="1.5" fill="rgba(120,5,5,0.5)" />
                          <circle cx="95" cy="3"  r="1"   fill="rgba(135,5,5,0.45)" />
                          <circle cx="44" cy="-4" r="1"   fill="rgba(140,5,5,0.45)" />
                        </g>
                      </svg>
                      {/* DEX label — next to sword (left), value on right */}
                      <div style={{ position: 'absolute', left: 62, top: 0, bottom: 0, display: 'flex', alignItems: 'center', gap: 2, pointerEvents: 'none' }}>
                        <span style={{
                          fontSize: 11, fontWeight: 900, color: '#4ade80', letterSpacing: '0.18em', lineHeight: 1,
                          textTransform: 'uppercase',
                          textShadow: '0 0 8px rgba(74,222,128,0.95), 0 0 18px rgba(74,222,128,0.6), 0 0 32px rgba(74,222,128,0.35), -1px -1px 0 rgba(0,0,0,1), 1px -1px 0 rgba(0,0,0,1), -1px 1px 0 rgba(0,0,0,1), 1px 1px 0 rgba(0,0,0,1)',
                        }}>DEX</span>
                      </div>
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 7, gap: 1, pointerEvents: 'none' }}>
                        <span style={{
                          fontSize: 12, fontWeight: 900, color: '#d1fae5', fontVariantNumeric: 'tabular-nums', lineHeight: 1,
                          textShadow: '0 0 10px rgba(74,222,128,0.9), 0 0 22px rgba(74,222,128,0.5), -1px -1px 0 rgba(0,0,0,1), 1px -1px 0 rgba(0,0,0,1), -1px 1px 0 rgba(0,0,0,1), 1px 1px 0 rgba(0,0,0,1), 0 2px 8px rgba(0,0,0,1)',
                        }}>{Math.round(dexCur)}</span>
                        <span style={{
                          fontSize: 12, fontWeight: 700, color: 'rgba(134,239,172,0.55)', lineHeight: 1,
                          textShadow: '-1px -1px 0 rgba(0,0,0,0.8), 1px 1px 0 rgba(0,0,0,0.8)',
                        }}>/</span>
                        <span style={{
                          fontSize: 12, fontWeight: 700, color: 'rgba(134,239,172,0.65)', fontVariantNumeric: 'tabular-nums', lineHeight: 1,
                          textShadow: '-1px -1px 0 rgba(0,0,0,0.9), 1px -1px 0 rgba(0,0,0,0.9), -1px 1px 0 rgba(0,0,0,0.9), 1px 1px 0 rgba(0,0,0,0.9)',
                        }}>{Math.round(dexMax)}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div style={{ width: PORTRAIT_SIZE, height: Math.round(PORTRAIT_SIZE * 200 / 180), backgroundColor: '#16213e', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a0a0b0', fontSize: 13, fontWeight: 600, border: '2px solid #2a2a4a', padding: 8, textAlign: 'center' }}>
                {elemSym && <span style={{ position: 'absolute', top: 4, left: 5, fontSize: 20 }}>{elemSym}</span>}
                {hero.name}
              </div>
            )}
          </div>

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
                }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 7, background: 'linear-gradient(to bottom, rgba(255,255,255,0.2), transparent)', pointerEvents: 'none' }} />
                </div>
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
        // Show XP when dead (during battle) OR for all at the end
        const showXp = isDead || (isAtEnd && !isPlaying && !busy);
        const heroXp = showXp ? (Object.keys(displayedXp).length > 0 ? (displayedXp[h.name] ?? xpData[h.name]) : xpData[h.name]) : undefined;
        const hasBonus = !!xpBonusData[h.name];
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
            {/* Element symbol — top left of dot portrait */}
            {h.element && ELEM_SYM[h.element] && (
              <div style={{ position: 'absolute', top: 2, left: 2, fontSize: 11, lineHeight: 1, textShadow: '0 1px 4px rgba(0,0,0,.95)', pointerEvents: 'none', zIndex: 5 }}>
                {ELEM_SYM[h.element]}
              </div>
            )}
            {/* XP overlay — bottom strip inside the portrait */}
            {heroXp != null && (
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                backgroundColor: 'rgba(0,0,0,0.72)',
                textAlign: 'center',
                color: hasBonus ? '#fbbf24' : '#4ade80',
                fontSize: 11, fontWeight: 800,
                padding: '3px 0',
                textShadow: hasBonus ? '0 0 6px rgba(251,191,36,.9)' : '0 0 6px rgba(74,222,128,.8)',
                whiteSpace: 'nowrap',
                animationName: 'baXP',
                animationDuration: '0.45s',
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

        {/* Akatsuki battle background */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
          <img src="/akatsuki-bg.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', opacity: 0.35, filter: 'blur(4px) saturate(0.7)', transform: 'scale(1.05)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.05) 50%, rgba(0,0,0,0.35) 100%)' }} />
        </div>

        {/* Subtle arena floor lines */}
        <div style={s.arenaFloor} />

        {renderHeroColumn(cHero, lAnim, true, dmgL,
          battleLog.challengerManaTotal ?? 0,
          manaDisplayIdx >= 0 ? (rounds[manaDisplayIdx]?.challengerManaAfter ?? (battleLog.challengerManaTotal ?? 0)) : (battleLog.challengerManaTotal ?? 0),
          cSpellNotif,
          cMaxDex, cCurDex, dexExpDeltaL, dexRecDeltaL, dexRecoveringL,
        )}

        {/* Center panel */}
        <div style={s.center}>
          {round && (
            <div key={roundIdx} style={{ animationName: 'baRN', animationDuration: '0.28s', animationFillMode: 'both', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>

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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: '#fbbf24', fontSize: 12, marginTop: 3 }}>
                  <span style={{ fontWeight: 700 }}>+{goldEarned} gold</span>
                  {goldBonusPct != null && goldBonusPct > 0 && (
                    <span style={{ color: '#4ade80', fontSize: 11, fontWeight: 700 }}>↑ {goldBonusPct}%</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {renderHeroColumn(dHero, rAnim, false, dmgR,
          battleLog.defenderManaTotal ?? 0,
          manaDisplayIdx >= 0 ? (rounds[manaDisplayIdx]?.defenderManaAfter ?? (battleLog.defenderManaTotal ?? 0)) : (battleLog.defenderManaTotal ?? 0),
          dSpellNotif,
          dMaxDex, dCurDex, dexExpDeltaR, dexRecDeltaR, dexRecoveringR,
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
                <Coins size={26} color="#fbbf24" />
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={s.overlayGoldText}>+{goldEarned}</span>
                  {goldBonusPct != null && goldBonusPct > 0 && (
                    <span style={{ color: '#4ade80', fontSize: 13, fontWeight: 700 }}>↑ {goldBonusPct}%</span>
                  )}
                </span>
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
    background: '#08000a',
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
    background: 'linear-gradient(to top, rgba(120,0,0,.12), transparent)',
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
    height: 18,
    backgroundColor: '#080818',
    borderRadius: 3,
    border: '1.5px solid #1e3a8a',
    overflow: 'hidden',
    position: 'relative',
    boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.8), 0 0 10px rgba(37,99,235,0.2)',
  },
  manaBarFill: {
    height: '100%',
    background: 'linear-gradient(to right, #0f1f6e 0%, #1d4ed8 35%, #2563eb 60%, #3b82f6 80%, #60a5fa 100%)',
    borderRadius: 0,
    transition: 'width 1.4s ease-in-out',
    boxShadow: '0 0 14px rgba(59,130,246,0.7), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.4)',
    position: 'relative',
  },
  manaBarLabel: {
    color: '#bfdbfe',
    fontSize: 11,
    fontWeight: 900,
    whiteSpace: 'nowrap',
    fontVariantNumeric: 'tabular-nums',
    letterSpacing: 0.4,
    textShadow: '0 0 8px rgba(59,130,246,0.9), -1px -1px 0 rgba(0,0,0,0.9), 1px -1px 0 rgba(0,0,0,0.9), -1px 1px 0 rgba(0,0,0,0.9), 1px 1px 0 rgba(0,0,0,0.9)',
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
    animationDuration: '2.8s',
    animationFillMode: 'both',
    animationTimingFunction: 'linear',
    transformOrigin: 'center top',
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
    backgroundColor: 'rgba(0,0,0,0.30)',
    backdropFilter: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  overlayCard: {
    backgroundColor: '#252545',
    border: '1px solid #3a3a65',
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
