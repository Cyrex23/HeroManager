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
@keyframes baSpell { 0%{opacity:0;transform:translateY(12px) scale(0.72) rotate(0deg)} 7%{opacity:1;transform:translateY(0) scale(1.1) rotate(0deg);filter:brightness(2.8) saturate(2)} 12%{transform:scale(1.06) rotate(9deg);filter:brightness(2)} 17%{transform:scale(1.04) rotate(-7deg);filter:brightness(1.7)} 22%{transform:scale(1.02) rotate(6deg);filter:brightness(1.5)} 27%{transform:scale(1.01) rotate(-5deg);filter:brightness(1.35)} 32%{transform:scale(1) rotate(4deg);filter:brightness(1.22)} 37%{transform:rotate(-3.2deg);filter:brightness(1.14)} 42%{transform:rotate(2.6deg);filter:brightness(1.08)} 47%{transform:rotate(-2deg)} 52%{transform:rotate(1.6deg)} 57%{transform:rotate(-1.2deg)} 62%{transform:rotate(0.9deg)} 67%{transform:rotate(-0.6deg)} 72%{transform:rotate(0.3deg)} 78%{transform:rotate(-0.15deg)} 100%{opacity:1;transform:scale(1) rotate(0deg);filter:brightness(1)} }
@keyframes baManaGlow { 0%,100%{box-shadow:0 0 8px rgba(59,130,246,0.55),0 0 0 rgba(96,165,250,0)} 50%{box-shadow:0 0 28px rgba(59,130,246,1),0 0 56px rgba(96,165,250,0.7),0 0 90px rgba(147,197,253,0.35)} }
@keyframes baManaRegen { 0%{opacity:0;transform:translateY(0) scale(0.7)} 15%{opacity:1;transform:translateY(-6px) scale(1.1)} 70%{opacity:1;transform:translateY(-28px) scale(1)} 100%{opacity:0;transform:translateY(-44px) scale(0.85)} }
@keyframes baOverlayIn { 0%{opacity:0;transform:scale(0.92)} 100%{opacity:1;transform:scale(1)} }
@keyframes baTitleIn { 0%{opacity:0;transform:translateY(-18px)} 100%{opacity:1;transform:translateY(0)} }
@keyframes baSwordsIn { 0%{opacity:0;transform:scale(0.5) rotate(-20deg)} 100%{opacity:1;transform:scale(1) rotate(0deg)} }
@keyframes baDexFloat { 0%{opacity:0;transform:translateY(2px) scale(0.75)} 16%{opacity:1;transform:translateY(-10px) scale(1.25)} 60%{opacity:1;transform:translateY(-20px) scale(1.05)} 100%{opacity:0;transform:translateY(-32px) scale(0.85)} }
@keyframes introOverlayFade{0%{opacity:0}4%{opacity:1}82%{opacity:1}100%{opacity:0}}
@keyframes introHeroL{0%{opacity:0;transform:translateX(-420px) scale(0.7)}22%{opacity:1;transform:translateX(0) scale(1.06)}25%{transform:translateX(0) scale(1)}76%{opacity:1;transform:translateX(0) scale(1)}91%{opacity:0;transform:translateX(-240px) scale(0.8)}100%{opacity:0}}
@keyframes introHeroR{0%{opacity:0;transform:translateX(420px) scale(0.7)}22%{opacity:1;transform:translateX(0) scale(1.06)}25%{transform:translateX(0) scale(1)}76%{opacity:1;transform:translateX(0) scale(1)}91%{opacity:0;transform:translateX(240px) scale(0.8)}100%{opacity:0}}
@keyframes introNameL{0%,20%{opacity:0;transform:translateY(18px)}28%{opacity:1;transform:translateY(0)}76%{opacity:1}90%{opacity:0}100%{opacity:0}}
@keyframes introNameR{0%,20%{opacity:0;transform:translateY(18px)}28%{opacity:1;transform:translateY(0)}76%{opacity:1}90%{opacity:0}100%{opacity:0}}
@keyframes introVs{0%,6%{opacity:0;transform:translate(-50%,-50%) scale(0.5)}16%{opacity:1;transform:translate(-50%,-50%) scale(1.12)}20%{transform:translate(-50%,-50%) scale(1)}74%{opacity:1}87%{opacity:0}100%{opacity:0}}
@keyframes introFlash{0%,21.5%{opacity:0}22.2%{opacity:0.92}27%{opacity:0}100%{opacity:0}}
@keyframes introShock{0%,21.5%{transform:translate(-50%,-50%) scale(0.05);opacity:0;border-width:16px}22.3%{opacity:1;border-width:10px;transform:translate(-50%,-50%) scale(0.12)}48%{transform:translate(-50%,-50%) scale(5);opacity:0;border-width:1px}100%{opacity:0}}
@keyframes introClashBurst{0%,21.5%{transform:translate(-50%,-50%) scale(0);opacity:0}22.2%{opacity:1;transform:translate(-50%,-50%) scale(0.3)}54%{transform:translate(-50%,-50%) scale(4.5);opacity:0}100%{opacity:0}}
@keyframes introSparks{0%,21.5%{transform:translate(-50%,-50%) scale(0) rotate(0deg);opacity:0}22.2%{opacity:1;transform:translate(-50%,-50%) scale(0.15) rotate(0deg)}58%{opacity:0.55;transform:translate(-50%,-50%) scale(2.4) rotate(225deg)}72%{opacity:0}100%{opacity:0}}
@keyframes introShake{0%,20%{transform:translateX(0)}22.2%{transform:translateX(-16px)}23.7%{transform:translateX(16px)}25.2%{transform:translateX(-11px)}26.7%{transform:translateX(11px)}28.2%{transform:translateX(-6px)}29.7%{transform:translateX(6px)}31.2%{transform:translateX(0)}100%{transform:translateX(0)}}
@keyframes introFight{0%,22%{opacity:0;transform:translate(-50%,-50%) scale(0.06) rotate(-20deg)}29%{opacity:1;transform:translate(-50%,-50%) scale(1.26) rotate(5deg)}38%{transform:translate(-50%,-50%) scale(0.86) rotate(-2.5deg)}47%{transform:translate(-50%,-50%) scale(1.1) rotate(1.2deg)}55%{transform:translate(-50%,-50%) scale(0.96) rotate(-0.5deg)}63%{opacity:1;transform:translate(-50%,-50%) scale(1.03)}74%{opacity:1;transform:translate(-50%,-50%) scale(1)}87%{opacity:0;transform:translate(-50%,-50%) scale(3) rotate(12deg)}100%{opacity:0}}
@keyframes introFightPulse{0%,63%{filter:drop-shadow(0 0 18px rgba(255,120,0,0.9)) drop-shadow(5px 8px 0 rgba(0,0,0,0.98))}70%{filter:drop-shadow(0 0 40px rgba(255,180,0,1)) drop-shadow(0 0 80px rgba(255,60,0,0.7)) drop-shadow(5px 8px 0 rgba(0,0,0,0.98))}80%{filter:drop-shadow(0 0 20px rgba(255,100,0,0.9)) drop-shadow(5px 8px 0 rgba(0,0,0,0.98))}90%{filter:drop-shadow(0 0 50px rgba(255,200,0,1)) drop-shadow(0 0 100px rgba(255,80,0,0.8)) drop-shadow(5px 8px 0 rgba(0,0,0,0.98))}}
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

const BANIM_STAT_LABELS: Record<string, string> = {
  physicalAttack: 'PA', magicPower: 'MP', dexterity: 'DEX', element: 'Elem',
  mana: 'Mana', stamina: 'Stam', attack: 'Atk%', magicProficiency: 'MagP%',
  spellMastery: 'SpellM%', spellActivation: 'SpellAct%', dexProficiency: 'DexP%',
  dexPosture: 'DexPost%', critChance: 'Crit%', critDamage: 'CritDmg%',
  expBonus: 'EXP%', goldBonus: 'Gold%', itemDiscovery: 'ItemDisc%',
  physicalImmunity: 'PhysImm%', magicImmunity: 'MagImm%', dexEvasiveness: 'DEXEvas%',
};
const BANIM_STAT_COLORS: Record<string, string> = {
  physicalAttack: '#f97316', magicPower: '#a78bfa', dexterity: '#fbbf24',
  element: '#60a5fa', mana: '#38bdf8', stamina: '#4ade80',
  attack: '#f97316', magicProficiency: '#a78bfa', spellMastery: '#c084fc',
  spellActivation: '#e879f9', dexProficiency: '#fbbf24', dexPosture: '#fbbf24',
  critChance: '#ef4444', critDamage: '#ef4444', expBonus: '#4ade80',
  goldBonus: '#fbbf24', itemDiscovery: '#38bdf8', physicalImmunity: '#94a3b8',
  magicImmunity: '#a78bfa', dexEvasiveness: '#fbbf24',
};
const BANIM_TRIGGER_LABELS: Record<string, string> = {
  ATTACK: 'ON ATTACK', ENTRANCE: 'ON ENTRANCE', OPPONENT_ENTRANCE: 'VS ENTRANCE',
  BEFORE_TURN_X: 'BEFORE TURN', AFTER_TURN_X: 'AFTER TURN',
};

type LearnedSpell = { name: string; bonuses?: Record<string, number>; trigger?: string; chance?: number; manaCost?: number };
function computeLearnedSpells(rounds: BattleLog['rounds'], upToIdx: number, side: 'attacker' | 'defender'): LearnedSpell[] {
  const learned = new Map<string, LearnedSpell>();
  for (let i = 0; i < upToIdx && i < rounds.length; i++) {
    const r = rounds[i];
    const prevR = i > 0 ? rounds[i - 1] : null;
    if (prevR) {
      const cur = side === 'attacker' ? r.attackerHero : r.defenderHero;
      const prev = side === 'attacker' ? prevR.attackerHero : prevR.defenderHero;
      if (cur !== prev) learned.clear();
    }
    const spells = ((side === 'attacker' ? r.challengerSpells : r.defenderSpells) as Array<{ spellName: string; justLearned?: boolean; bonuses?: Record<string, number>; trigger?: string; chance?: number; manaCost?: number }> | undefined);
    if (spells) {
      for (const sp of spells) {
        if (sp.justLearned) learned.set(sp.spellName, { name: sp.spellName, bonuses: sp.bonuses, trigger: sp.trigger, chance: sp.chance, manaCost: sp.manaCost });
      }
    }
  }
  // Post-loop: if the current round has a different hero than the last processed round, clear
  if (upToIdx > 0 && upToIdx < rounds.length) {
    const curHero  = side === 'attacker' ? rounds[upToIdx].attackerHero     : rounds[upToIdx].defenderHero;
    const prevHero = side === 'attacker' ? rounds[upToIdx - 1].attackerHero : rounds[upToIdx - 1].defenderHero;
    if (curHero !== prevHero) learned.clear();
  }
  return Array.from(learned.values());
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
  const [showRotL, setShowRotL] = useState(false);
  const [showRotR, setShowRotR] = useState(false);
  const [showBattleIntro, setShowBattleIntro] = useState(false);
  const [introKey, setIntroKey] = useState(0);
  const [dmgL, setDmgL] = useState<{ v: number; k: number; elemBonus?: number; elem?: string; rawAttack?: number; staminaLost?: number; crit?: boolean; magicProf?: boolean; attackFlat?: number; highDex?: boolean; physImmunity?: number; magicImmunity?: number; dexEvasiveness?: number } | null>(null);
  const [dmgR, setDmgR] = useState<{ v: number; k: number; elemBonus?: number; elem?: string; rawAttack?: number; staminaLost?: number; crit?: boolean; magicProf?: boolean; attackFlat?: number; highDex?: boolean; physImmunity?: number; magicImmunity?: number; dexEvasiveness?: number } | null>(null);
  const [roundRes, setRoundRes] = useState<'attacker' | 'defender' | null>(null);
  const [hitInd, setHitInd] = useState<{ type: HitType; side: 'left' | 'right'; k: number } | null>(null);
  const [cSpellNotif, setCSpellNotif] = useState<{ spells: Array<{ name: string; manaCost: number; spellType?: 'normal' | 'copied' | 'absorbed' | 'fromLearned' | 'justLearned'; bonuses?: Record<string, number>; lastsTurns?: number; trigger?: string; chance?: number }>; k: number } | null>(null);
  const [dSpellNotif, setDSpellNotif] = useState<{ spells: Array<{ name: string; manaCost: number; spellType?: 'normal' | 'copied' | 'absorbed' | 'fromLearned' | 'justLearned'; bonuses?: Record<string, number>; lastsTurns?: number; trigger?: string; chance?: number }>; k: number } | null>(null);
  const [animSpellTooltip, setAnimSpellTooltip] = useState<{
    name: string; manaCost?: number; trigger?: string; chance?: number;
    bonuses?: Record<string, number>; lastsTurns?: number;
    x: number; y: number;
  } | null>(null);
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
  const [manaRegenL, setManaRegenL] = useState<{ v: number; k: number } | null>(null);
  const [manaRegenR, setManaRegenR] = useState<{ v: number; k: number } | null>(null);
  const [manaShowRecharged, setManaShowRecharged] = useState(false);

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

  // Battle intro cinematic — plays automatically on mount (navigation from Arena)
  useEffect(() => {
    setShowBattleIntro(true);
    setIntroKey(k => k + 1);
    const t = setTimeout(() => setShowBattleIntro(false), 2750);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
    setManaRegenL(null);
    setManaRegenR(null);
    setManaShowRecharged(false);
    setShowRotL(false);
    setShowRotR(false);
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
    type RawSpell = { spellName: string; manaCost: number; fired?: boolean; absorbed?: boolean; copied?: boolean; fromLearned?: boolean; justLearned?: boolean; bonuses?: Record<string, number>; lastsTurns?: number; trigger?: string; chance?: number };
    const cSp = ((round as any).challengerSpells as RawSpell[] | undefined)?.filter(sp => sp.fired !== false || sp.absorbed || sp.justLearned);
    const dSp = ((round as any).defenderSpells as RawSpell[] | undefined)?.filter(sp => sp.fired !== false || sp.absorbed || sp.justLearned);
    const spType = (sp: RawSpell) => sp.absorbed ? 'absorbed' : sp.copied ? 'copied' : sp.fromLearned ? 'fromLearned' : sp.justLearned ? 'justLearned' : 'normal' as const;
    if (cSp?.length) setCSpellNotif({ spells: cSp.map(sp => ({ name: sp.spellName, manaCost: sp.manaCost, spellType: spType(sp), bonuses: sp.bonuses, lastsTurns: sp.lastsTurns, trigger: sp.trigger, chance: sp.chance })), k: Date.now() });
    if (dSp?.length) setDSpellNotif({ spells: dSp.map(sp => ({ name: sp.spellName, manaCost: sp.manaCost, spellType: spType(sp), bonuses: sp.bonuses, lastsTurns: sp.lastsTurns, trigger: sp.trigger, chance: sp.chance })), k: Date.now() + 1 });
    if (cSp?.length || dSp?.length) {
      setManaShowRecharged(false);
      setManaDisplayIdx(idx);  // show post-spell (pre-recharge) mana when spell visually fires
    }

    // Show rot icon immediately if it was already active BEFORE this round (not newly applied now)
    // attackerAppliedRot = left hero applied rot to right; defenderAppliedRot = right applied to left
    setShowRotL(!!(round.attackerRotActive && !round.defenderAppliedRot));
    setShowRotR(!!(round.defenderRotActive && !round.attackerAppliedRot));

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
    // Reveal rot icon on the target if this attack newly applies rot
    if (leftGoesFirst && round.attackerAppliedRot) setShowRotR(true);
    if (!leftGoesFirst && round.defenderAppliedRot) setShowRotL(true);
    if (leftGoesFirst) {
      // Left hits right → indicator + damage on right; right flashes
      setHitInd({ type: leftDom, side: 'right', k: Date.now() });
      setDmgR({ v: round.attackerAttackValue, k: Date.now() + 1, elemBonus: round.attackerElementBonus, elem: round.attackerElement, rawAttack: round.attackerRawAttack, staminaLost: round.attackerStaminaReduction, crit: round.attackerCrit, magicProf: round.attackerMagicProf, attackFlat: round.attackerStatAttack, highDex: round.attackerHighDex, physImmunity: round.defenderPhysImmunity, magicImmunity: round.defenderMagicImmunity, dexEvasiveness: round.defenderDexEvasiveness });
      bump(setRAnim, 'baHF', 700 / speed);
      // DEX expenditure for Phase-1 attacker (left = attacker)
      { const used = round.attackerDexUsed ?? 0; const rec = round.attackerDexRecovered ?? 0; const rem = round.attackerDexRemaining;
        if (used > 0 && rem != null) { setDexValL(rem - rec); setDexExpDeltaL({ net: -used, k: Date.now() + 2 }); } }
    } else {
      // Right hits left → indicator + damage on left; left flashes
      setHitInd({ type: rightDom, side: 'left', k: Date.now() });
      setDmgL({ v: round.defenderAttackValue, k: Date.now() + 1, elemBonus: round.defenderElementBonus, elem: round.defenderElement, rawAttack: round.defenderRawAttack, staminaLost: round.defenderStaminaReduction, crit: round.defenderCrit, magicProf: round.defenderMagicProf, attackFlat: round.defenderStatAttack, highDex: round.defenderHighDex, physImmunity: round.attackerPhysImmunity, magicImmunity: round.attackerMagicImmunity, dexEvasiveness: round.attackerDexEvasiveness });
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
    // Reveal rot icon on the target if this attack newly applies rot
    if (leftGoesFirst && round.defenderAppliedRot) setShowRotL(true);
    if (!leftGoesFirst && round.attackerAppliedRot) setShowRotR(true);
    if (leftGoesFirst) {
      // Right hits left → indicator + damage on left; left flashes
      setHitInd({ type: rightDom, side: 'left', k: Date.now() });
      setDmgL({ v: round.defenderAttackValue, k: Date.now() + 1, elemBonus: round.defenderElementBonus, elem: round.defenderElement, rawAttack: round.defenderRawAttack, staminaLost: round.defenderStaminaReduction, crit: round.defenderCrit, magicProf: round.defenderMagicProf, attackFlat: round.defenderStatAttack, highDex: round.defenderHighDex, physImmunity: round.attackerPhysImmunity, magicImmunity: round.attackerMagicImmunity, dexEvasiveness: round.attackerDexEvasiveness });
      bump(setLAnim, 'baHF', 700 / speed);
      // DEX expenditure for Phase-2 attacker (right = defender)
      { const used = round.defenderDexUsed ?? 0; const rec = round.defenderDexRecovered ?? 0; const rem = round.defenderDexRemaining;
        if (used > 0 && rem != null) { setDexValR(rem - rec); setDexExpDeltaR({ net: -used, k: Date.now() + 2 }); } }
    } else {
      // Left hits right → indicator + damage on right; right flashes
      setHitInd({ type: leftDom, side: 'right', k: Date.now() });
      setDmgR({ v: round.attackerAttackValue, k: Date.now() + 1, elemBonus: round.attackerElementBonus, elem: round.attackerElement, rawAttack: round.attackerRawAttack, staminaLost: round.attackerStaminaReduction, crit: round.attackerCrit, magicProf: round.attackerMagicProf, attackFlat: round.attackerStatAttack, highDex: round.attackerHighDex, physImmunity: round.defenderPhysImmunity, magicImmunity: round.defenderMagicImmunity, dexEvasiveness: round.defenderDexEvasiveness });
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

    // ── Mana Regen float ──────────────────────────────────────────────────────
    if (round.challengerManaRegen != null && round.challengerManaRegen > 0)
      setManaRegenL({ v: round.challengerManaRegen, k: Date.now() });
    if (round.defenderManaRegen != null && round.defenderManaRegen > 0)
      setManaRegenR({ v: round.defenderManaRegen, k: Date.now() + 1 });
    setManaShowRecharged(true);
    setManaDisplayIdx(idx);

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
    setManaShowRecharged(true);  // when skipping, show the fully resolved (recharged) value
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
  const cLearnedSpells = useMemo(() => computeLearnedSpells(rounds, roundIdx, 'attacker'), [rounds, roundIdx]);
  const dLearnedSpells = useMemo(() => computeLearnedSpells(rounds, roundIdx, 'defender'), [rounds, roundIdx]);
  const cHero = cRoster.find(h => h.name === round?.attackerHero) ?? cRoster[0];
  const dHero = dRoster.find(h => h.name === round?.defenderHero) ?? dRoster[0];
  const isAtEnd = roundIdx >= rounds.length - 1;
  const cIntroElemColor = cRoster[0]?.element ? (ELEM_COLOR[cRoster[0].element] ?? '#fbbf24') : '#fbbf24';
  const dIntroElemColor = dRoster[0]?.element ? (ELEM_COLOR[dRoster[0].element] ?? '#60a5fa') : '#60a5fa';

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

  const renderBloodSplatter = (sp: number, label: string, elemBonus?: number, elem?: string, rawAttack?: number, staminaLost?: number, crit?: boolean, magicProf?: boolean, isLeft?: boolean, attackFlat?: number, highDex?: boolean, _physImmunity?: number, _magicImmunity?: number, _dexEvasiveness?: number) => {
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
    spellNotif: { spells: Array<{ name: string; manaCost: number; spellType?: 'normal' | 'copied' | 'absorbed' | 'fromLearned' | 'justLearned'; bonuses?: Record<string, number>; lastsTurns?: number; trigger?: string; chance?: number }>; k: number } | null,
    dexMax: number,
    dexCur: number,
    _dexExpDelta: { net: number; k: number } | null,
    _dexRecDelta: { net: number; k: number } | null,
    dexRecovering: boolean,
    _manaRegen: { v: number; k: number } | null,
    learnedSpells: LearnedSpell[],
    rotActive: boolean,
    rotRemaining: number,
    rotTotal: number,
  ) => {
    if (!hero) return <div style={{ flex: 1 }} />;
    const isWinner = roundRes && ((isLeft && roundRes === 'attacker') || (!isLeft && roundRes === 'defender'));
    const isLoser = roundRes && ((isLeft && roundRes === 'defender') || (!isLeft && roundRes === 'attacker'));
    const elemSym = hero.element ? (ELEM_SYM[hero.element] ?? '') : null;
    const PORTRAIT_SIZE = 200;
    const showHit = !!(hitInd && ((isLeft && hitInd.side === 'left') || (!isLeft && hitInd.side === 'right')));

    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, position: 'relative', overflow: 'visible' }}>
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
            {renderBloodSplatter(speed, dmg.v.toFixed(1), dmg.elemBonus, dmg.elem, dmg.rawAttack, dmg.staminaLost, dmg.crit, dmg.magicProf, isLeft, dmg.attackFlat, dmg.highDex, dmg.physImmunity, dmg.magicImmunity, dmg.dexEvasiveness)}
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
                  const fill = `linear-gradient(90deg, #2e2c10 0%, #5c5820 25%, #8a8432 55%, #b0aa3e 80%, #d8d455 100%)`;
                  const glow = 'rgba(216,212,85,0.55)';
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
                      {/* Shuriken icon */}
                      <svg width="20" height="20" viewBox="0 0 20 20"
                        style={{ position: 'absolute', left: 4, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', zIndex: 15, filter: 'drop-shadow(0 0 4px rgba(251,191,36,0.9)) drop-shadow(0 0 8px rgba(251,191,36,0.5))' }}>
                        <g transform="translate(10,10)">
                          {/* 4 blades — twisted shuriken shape */}
                          {/* Top-right blade */}
                          <polygon points="0,-8.5 3.5,0 0,-2.5 -1.5,-3" fill="#fbbf24" />
                          {/* Right-bottom blade */}
                          <polygon points="8.5,0 0,3.5 2.5,0 3,-1.5" fill="#d97706" />
                          {/* Bottom-left blade */}
                          <polygon points="0,8.5 -3.5,0 0,2.5 1.5,3" fill="#fbbf24" />
                          {/* Left-top blade */}
                          <polygon points="-8.5,0 0,-3.5 -2.5,0 -3,1.5" fill="#d97706" />
                          {/* Blade highlights */}
                          <polygon points="0,-8.5 1.5,-4 0,-2.5" fill="rgba(255,236,153,0.55)" />
                          <polygon points="8.5,0 4,1.5 2.5,0" fill="rgba(255,236,153,0.35)" />
                          <polygon points="0,8.5 -1.5,4 0,2.5" fill="rgba(255,236,153,0.55)" />
                          <polygon points="-8.5,0 -4,-1.5 -2.5,0" fill="rgba(255,236,153,0.35)" />
                          {/* Center hole ring */}
                          <circle cx="0" cy="0" r="2.8" fill="#1a0e00" />
                          <circle cx="0" cy="0" r="2.8" fill="none" stroke="#b45309" strokeWidth="0.8" />
                          <circle cx="0" cy="0" r="1.2" fill="#92400e" />
                          <circle cx="-0.6" cy="-0.6" r="0.6" fill="rgba(255,220,100,0.3)" />
                        </g>
                      </svg>
                      {/* DEX label — next to shuriken (left), value on right */}
                      <div style={{ position: 'absolute', left: 28, top: 0, bottom: 0, display: 'flex', alignItems: 'center', gap: 2, pointerEvents: 'none' }}>
                        <span style={{
                          fontSize: 11, fontWeight: 900, color: '#d8d455', letterSpacing: '0.18em', lineHeight: 1,
                          textTransform: 'uppercase',
                          textShadow: '0 0 8px rgba(216,212,85,0.95), 0 0 18px rgba(216,212,85,0.6), 0 0 32px rgba(216,212,85,0.35), -1px -1px 0 rgba(0,0,0,1), 1px -1px 0 rgba(0,0,0,1), -1px 1px 0 rgba(0,0,0,1), 1px 1px 0 rgba(0,0,0,1)',
                        }}>DEX</span>
                      </div>
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 7, gap: 1, pointerEvents: 'none' }}>
                        <span style={{
                          fontSize: 12, fontWeight: 900, color: '#d8d455', fontVariantNumeric: 'tabular-nums', lineHeight: 1,
                          textShadow: '0 0 10px rgba(216,212,85,0.9), 0 0 22px rgba(216,212,85,0.5), -1px -1px 0 rgba(0,0,0,1), 1px -1px 0 rgba(0,0,0,1), -1px 1px 0 rgba(0,0,0,1), 1px 1px 0 rgba(0,0,0,1), 0 2px 8px rgba(0,0,0,1)',
                        }}>{Math.round(dexCur)}</span>
                        <span style={{
                          fontSize: 12, fontWeight: 900, color: 'rgba(216,212,85,0.85)', lineHeight: 1,
                          textShadow: '-1px -1px 0 rgba(0,0,0,1), 1px -1px 0 rgba(0,0,0,1), -1px 1px 0 rgba(0,0,0,1), 1px 1px 0 rgba(0,0,0,1)',
                        }}>/</span>
                        <span style={{
                          fontSize: 14, fontWeight: 900, color: '#d8d455', fontVariantNumeric: 'tabular-nums', lineHeight: 1,
                          textShadow: '0 0 10px rgba(216,212,85,0.85), -1px -1px 0 rgba(0,0,0,0.9), 1px -1px 0 rgba(0,0,0,0.9), -1px 1px 0 rgba(0,0,0,0.9), 1px 1px 0 rgba(0,0,0,0.9)',
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

          {/* Rot icon — biological pathogen cell cluster */}
          {rotActive && rotRemaining > 0 && (
            <div style={{
              position: 'absolute', bottom: 0, zIndex: 20, pointerEvents: 'none',
              ...(isLeft ? { left: 'calc(100% + 5px)' } : { right: 'calc(100% + 5px)' }),
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            }}>
              <div style={{
                width: 50, height: 50,
                background: '#080100',
                border: '2px solid rgba(160,20,20,0.85)',
                borderRadius: 9,
                boxShadow: '0 0 0 1px rgba(50,0,0,0.8), 0 0 14px rgba(190,20,20,0.8), 0 0 30px rgba(150,10,10,0.4), inset 0 0 16px rgba(60,0,0,0.9)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative', overflow: 'hidden',
              }}>
                {/* Subtle organic background warmth */}
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: 7,
                  background: 'radial-gradient(ellipse at 35% 30%, rgba(50,5,2,0.7) 0%, transparent 55%), radial-gradient(ellipse at 70% 72%, rgba(35,3,2,0.5) 0%, transparent 45%)',
                }} />
                {/* Pulsing disease glow */}
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: 7,
                  background: 'radial-gradient(circle at 50% 50%, rgba(160,20,20,0.22) 0%, transparent 58%)',
                  animation: 'baManaGlow 1.6s ease-in-out infinite',
                }} />
                <svg width="40" height="40" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ position: 'relative', zIndex: 1 }}>
                  {/* ── Filaments (drawn behind cells) ── */}
                  <path d="M6 7 Q9 10 13 13.5" stroke="#4a0505" strokeWidth="0.55" opacity="0.8" />
                  <path d="M6 7 Q11 8.5 15.5 11" stroke="#3a0404" strokeWidth="0.4" opacity="0.65" />
                  <path d="M25 5 Q22 9 18.5 13" stroke="#4a0505" strokeWidth="0.55" opacity="0.8" />
                  <path d="M25 5 Q20.5 7.5 16 11" stroke="#3a0404" strokeWidth="0.4" opacity="0.65" />
                  <path d="M27 21 Q23.5 20 19 18" stroke="#4a0505" strokeWidth="0.55" opacity="0.8" />
                  <path d="M27 21 Q22.5 23 18.5 20" stroke="#3a0404" strokeWidth="0.4" opacity="0.6" />
                  <path d="M5 24 Q9 22 13 19" stroke="#4a0505" strokeWidth="0.55" opacity="0.8" />
                  <path d="M5 24 Q8 20.5 13.5 18" stroke="#3a0404" strokeWidth="0.4" opacity="0.6" />
                  <path d="M6 7 Q11 14 10 20" stroke="#300404" strokeWidth="0.35" opacity="0.5" />
                  <path d="M25 5 Q25 15 27 21" stroke="#300404" strokeWidth="0.35" opacity="0.5" />
                  <path d="M5 24 Q13.5 21 21 27" stroke="#300404" strokeWidth="0.35" opacity="0.45" />
                  <path d="M13 3 Q14 7.5 15.5 11" stroke="#3a0404" strokeWidth="0.4" opacity="0.6" />
                  <path d="M21 27 Q19.5 24 18 21" stroke="#3a0404" strokeWidth="0.4" opacity="0.6" />
                  <path d="M22 11 Q20.5 13.5 18.5 15.5" stroke="#4a0505" strokeWidth="0.45" opacity="0.7" />
                  <path d="M10 21 Q12 19.5 13.5 17.5" stroke="#4a0505" strokeWidth="0.45" opacity="0.7" />
                  <path d="M28 11 Q25.5 14 22 11" stroke="#3a0404" strokeWidth="0.4" opacity="0.55" />
                  <path d="M4 15 Q7 15.5 6 7" stroke="#300404" strokeWidth="0.35" opacity="0.5" />
                  {/* ── Tiny satellite cells ── */}
                  {/* (cx, cy, r): shadow → dark base → mid → highlight dot */}
                  <circle cx="13" cy="3" r="2.3" fill="#030000" />
                  <circle cx="13" cy="3" r="1.9" fill="#5a0000" />
                  <circle cx="12.3" cy="2.4" r="1.0" fill="#991b1b" opacity="0.75" />
                  <circle cx="12.0" cy="2.1" r="0.38" fill="#fca5a5" opacity="0.55" />

                  <circle cx="28" cy="11" r="2.1" fill="#030000" />
                  <circle cx="28" cy="11" r="1.7" fill="#5a0000" />
                  <circle cx="27.4" cy="10.4" r="0.9" fill="#991b1b" opacity="0.75" />
                  <circle cx="27.1" cy="10.1" r="0.34" fill="#fca5a5" opacity="0.55" />

                  <circle cx="4" cy="15" r="1.8" fill="#030000" />
                  <circle cx="4" cy="15" r="1.4" fill="#5a0000" />
                  <circle cx="3.5" cy="14.5" r="0.7" fill="#991b1b" opacity="0.7" />

                  <circle cx="21" cy="27" r="2.4" fill="#030000" />
                  <circle cx="21" cy="27" r="2.0" fill="#5a0000" />
                  <circle cx="20.3" cy="26.3" r="1.0" fill="#991b1b" opacity="0.75" />
                  <circle cx="20.0" cy="26.0" r="0.4" fill="#fca5a5" opacity="0.55" />
                  {/* ── Medium cells ── */}
                  <circle cx="22" cy="11" r="3.2" fill="#020000" />
                  <circle cx="22" cy="11" r="2.7" fill="#6b0000" />
                  <circle cx="20.8" cy="9.9" r="1.4" fill="#b91c1c" opacity="0.72" />
                  <circle cx="20.4" cy="9.5" r="0.55" fill="#fca5a5" opacity="0.6" />
                  <circle cx="20.2" cy="9.3" r="0.22" fill="white" opacity="0.38" />

                  <circle cx="10" cy="21" r="2.9" fill="#020000" />
                  <circle cx="10" cy="21" r="2.4" fill="#6b0000" />
                  <circle cx="9.0" cy="20.0" r="1.2" fill="#b91c1c" opacity="0.7" />
                  <circle cx="8.6" cy="19.6" r="0.5" fill="#fca5a5" opacity="0.58" />
                  <circle cx="8.4" cy="19.4" r="0.2" fill="white" opacity="0.35" />
                  {/* ── Large outer cells ── */}
                  <circle cx="6" cy="7" r="5.0" fill="#010000" />
                  <circle cx="6" cy="7" r="4.3" fill="#7f0000" />
                  <circle cx="4.5" cy="5.6" r="2.1" fill="#c0392b" opacity="0.68" />
                  <circle cx="4.0" cy="5.1" r="0.85" fill="#fca5a5" opacity="0.58" />
                  <circle cx="3.7" cy="4.8" r="0.35" fill="white" opacity="0.42" />

                  <circle cx="25" cy="5" r="4.5" fill="#010000" />
                  <circle cx="25" cy="5" r="3.8" fill="#7f0000" />
                  <circle cx="23.6" cy="3.7" r="1.9" fill="#c0392b" opacity="0.68" />
                  <circle cx="23.1" cy="3.2" r="0.75" fill="#fca5a5" opacity="0.58" />
                  <circle cx="22.8" cy="2.9" r="0.3" fill="white" opacity="0.42" />

                  <circle cx="27" cy="21" r="4.8" fill="#010000" />
                  <circle cx="27" cy="21" r="4.1" fill="#7f0000" />
                  <circle cx="25.4" cy="19.5" r="2.0" fill="#c0392b" opacity="0.68" />
                  <circle cx="24.9" cy="19.0" r="0.8" fill="#fca5a5" opacity="0.58" />
                  <circle cx="24.6" cy="18.7" r="0.32" fill="white" opacity="0.42" />

                  <circle cx="5" cy="24" r="4.2" fill="#010000" />
                  <circle cx="5" cy="24" r="3.5" fill="#7f0000" />
                  <circle cx="3.7" cy="22.7" r="1.7" fill="#c0392b" opacity="0.65" />
                  <circle cx="3.3" cy="22.3" r="0.68" fill="#fca5a5" opacity="0.55" />
                  <circle cx="3.0" cy="22.0" r="0.28" fill="white" opacity="0.38" />
                  {/* ── Dominant central cell ── */}
                  <circle cx="16" cy="16" r="7.2" fill="#010000" />
                  <circle cx="16" cy="16" r="6.3" fill="#8b0000" />
                  <circle cx="14.2" cy="14.2" r="3.1" fill="#c0392b" opacity="0.7" />
                  <circle cx="13.5" cy="13.5" r="1.3" fill="#fca5a5" opacity="0.62" />
                  <circle cx="13.1" cy="13.1" r="0.55" fill="white" opacity="0.45" />
                </svg>
              </div>
              {/* Turn counter */}
              <div style={{
                background: 'rgba(0,0,0,0.9)',
                border: '1px solid rgba(160,20,20,0.7)',
                borderRadius: 10, padding: '1px 7px',
                display: 'flex', alignItems: 'baseline', gap: 1,
                boxShadow: '0 0 6px rgba(160,20,20,0.45)',
              }}>
                <span style={{
                  fontSize: 13, fontWeight: 900, color: '#ffffff',
                  textShadow: '0 0 10px rgba(200,30,30,1), 0 1px 3px #000',
                  fontVariantNumeric: 'tabular-nums', lineHeight: 1,
                }}>{rotRemaining}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#8b1010', lineHeight: 1 }}>/{rotTotal}</span>
              </div>
            </div>
          )}

          {/* Learned spells panel — left side of portrait for left hero, right side for right hero */}
          {learnedSpells.length > 0 && (
            <div style={{
              position: 'absolute', top: 0, zIndex: 10,
              ...(isLeft ? { right: 'calc(100% + 8px)' } : { left: 'calc(100% + 8px)' }),
              minWidth: 110, display: 'flex', flexDirection: 'column', gap: 4,
            }}>
              <div style={{ fontSize: 8, fontWeight: 900, color: '#9f7aea', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 2, textShadow: '0 0 6px rgba(159,122,234,0.6)' }}>Learned</div>
              {learnedSpells.map(sp => (
                <span key={sp.name}
                  onMouseEnter={(e) => setAnimSpellTooltip({ name: sp.name, bonuses: sp.bonuses, trigger: sp.trigger, chance: sp.chance, manaCost: sp.manaCost, x: e.clientX, y: e.clientY })}
                  onMouseMove={(e) => setAnimSpellTooltip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null)}
                  onMouseLeave={() => setAnimSpellTooltip(null)}
                  style={{
                    fontSize: 9, fontWeight: 800, color: '#c084fc',
                    backgroundColor: 'rgba(192,132,252,0.12)',
                    border: '1px solid rgba(192,132,252,0.4)', borderRadius: 4,
                    padding: '3px 6px', whiteSpace: 'nowrap',
                    textShadow: '0 0 8px rgba(192,132,252,0.7)',
                    cursor: 'help',
                  }}>◈ {sp.name}</span>
              ))}
            </div>
          )}
        </div>

        {/* Mana bar — below the name, only if team has mana */}
        {manaTotal > 0 && (() => {
          const pct = Math.max(0, Math.min(1, manaCurrent / manaTotal));
          return (
            <div style={{ width: PORTRAIT_SIZE + 100, display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
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

        {/* Spell notifications — absolutely positioned below so they don't shift the portrait */}
        {spellNotif && (
          <div key={spellNotif.k} style={{ ...s.spellNotifWrap, width: PORTRAIT_SIZE + 40, position: 'absolute', top: '100%', marginTop: 8, left: '50%', transform: 'translateX(-50%)', zIndex: 20 }}>
            {spellNotif.spells.map((sp, i) => {
              const t = sp.spellType ?? 'normal';
              const isAbsorbed = t === 'absorbed';
              const notifColor = t === 'copied' ? '#f87171' : t === 'fromLearned' ? '#a78bfa' : t === 'justLearned' ? '#c084fc' : isAbsorbed ? '#6b7280' : '#60a5fa';
              const notifIcon = t === 'copied' ? '✦' : t === 'fromLearned' ? '◈' : t === 'justLearned' ? '★' : isAbsorbed ? '⊘' : '✦';
              return (
                <div key={sp.name + i} onMouseEnter={(e) => setAnimSpellTooltip({ name: sp.name, manaCost: sp.manaCost, trigger: sp.trigger, chance: sp.chance, bonuses: sp.bonuses, lastsTurns: sp.lastsTurns, x: e.clientX, y: e.clientY })} onMouseMove={(e) => setAnimSpellTooltip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null)} onMouseLeave={() => setAnimSpellTooltip(null)} style={{
                  ...s.spellNotif,
                  animationDelay: `${i * 600}ms`,
                  borderColor: `${notifColor}99`,
                  boxShadow: `0 0 22px ${notifColor}44, 0 0 50px ${notifColor}18`,
                  opacity: isAbsorbed ? 0.6 : 1,
                }}>
                  <span style={{ ...s.spellNotifIcon, color: notifColor, textShadow: `0 0 12px ${notifColor}, 0 0 24px ${notifColor}88` }}>{notifIcon}</span>
                  <span style={{ ...s.spellNotifName, color: isAbsorbed ? '#9ca3af' : `${notifColor}ee` }}>
                    {sp.name}
                    {t === 'justLearned' && <span style={{ color: '#c084fc', fontSize: 9, marginLeft: 5, fontWeight: 900, letterSpacing: '0.12em' }}>LEARNED</span>}
                    {isAbsorbed && <span style={{ color: '#6b7280', fontSize: 9, marginLeft: 5, letterSpacing: '0.12em' }}>BLOCKED</span>}
                  </span>
                  {!isAbsorbed && t !== 'justLearned' && <span style={{ ...s.spellNotifCost, color: notifColor, backgroundColor: `${notifColor}22`, borderColor: `${notifColor}55`, textShadow: `0 0 8px ${notifColor}` }}>{sp.manaCost}</span>}
                </div>
              );
            })}
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
          manaDisplayIdx >= 0
            ? (manaShowRecharged
                ? (rounds[manaDisplayIdx]?.challengerManaAfter ?? (battleLog.challengerManaTotal ?? 0))
                : (rounds[manaDisplayIdx]?.challengerManaBeforeRecharge ?? rounds[manaDisplayIdx]?.challengerManaAfter ?? (battleLog.challengerManaTotal ?? 0)))
            : (battleLog.challengerManaTotal ?? 0),
          cSpellNotif,
          cMaxDex, cCurDex, dexExpDeltaL, dexRecDeltaL, dexRecoveringL,
          manaRegenL, cLearnedSpells,
          !!(busy ? showRotL : round?.attackerRotActive),
          round?.attackerRotRemaining ?? 0,
          round?.attackerRotTotal ?? 0,
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
          manaDisplayIdx >= 0
            ? (manaShowRecharged
                ? (rounds[manaDisplayIdx]?.defenderManaAfter ?? (battleLog.defenderManaTotal ?? 0))
                : (rounds[manaDisplayIdx]?.defenderManaBeforeRecharge ?? rounds[manaDisplayIdx]?.defenderManaAfter ?? (battleLog.defenderManaTotal ?? 0)))
            : (battleLog.defenderManaTotal ?? 0),
          dSpellNotif,
          dMaxDex, dCurDex, dexExpDeltaR, dexRecDeltaR, dexRecoveringR,
          manaRegenR, dLearnedSpells,
          !!(busy ? showRotR : round?.defenderRotActive),
          round?.defenderRotRemaining ?? 0,
          round?.defenderRotTotal ?? 0,
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
      {animSpellTooltip && (
        <div style={{
          position: 'fixed',
          left: animSpellTooltip.x > window.innerWidth / 2 ? animSpellTooltip.x - 220 : animSpellTooltip.x + 14,
          top: Math.min(animSpellTooltip.y - 10, window.innerHeight - 160),
          zIndex: 9999,
          background: 'linear-gradient(145deg, #0f172a 0%, #1a1040 100%)',
          border: '1px solid rgba(139,92,246,0.45)',
          borderRadius: 10,
          padding: '10px 13px',
          minWidth: 190,
          maxWidth: 270,
          pointerEvents: 'none',
          boxShadow: '0 8px 32px rgba(0,0,0,0.85), 0 0 18px rgba(139,92,246,0.18)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
            <span style={{ color: '#e2e8f0', fontWeight: 800, fontSize: 13 }}>✦ {animSpellTooltip.name}</span>
            {animSpellTooltip.manaCost != null && animSpellTooltip.manaCost > 0 && (
              <span style={{ background: 'rgba(59,130,246,0.18)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.45)', borderRadius: 6, padding: '2px 9px', fontSize: 11, fontWeight: 800, whiteSpace: 'nowrap' }}>
                {animSpellTooltip.manaCost} MP
              </span>
            )}
          </div>
          {animSpellTooltip.trigger && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
              <span style={{ background: 'rgba(30,41,59,0.9)', color: '#94a3b8', border: '1px solid #334155', borderRadius: 4, padding: '2px 8px', fontSize: 10, fontWeight: 800, letterSpacing: '0.08em' }}>
                {BANIM_TRIGGER_LABELS[animSpellTooltip.trigger] ?? animSpellTooltip.trigger}
              </span>
              {animSpellTooltip.chance != null && (
                <span style={{ color: '#94a3b8', fontSize: 11 }}>{animSpellTooltip.chance}% chance</span>
              )}
            </div>
          )}
          {animSpellTooltip.bonuses && Object.keys(animSpellTooltip.bonuses).length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {Object.entries(animSpellTooltip.bonuses).map(([k, v]) => {
                const c = BANIM_STAT_COLORS[k] ?? '#60a5fa';
                return (
                  <span key={k} style={{ background: `${c}22`, color: c, border: `1px solid ${c}44`, borderRadius: 5, padding: '2px 8px', fontSize: 11, fontWeight: 800 }}>
                    {v > 0 ? '+' : ''}{v} {BANIM_STAT_LABELS[k] ?? k}
                  </span>
                );
              })}
            </div>
          )}
          {animSpellTooltip.lastsTurns != null && animSpellTooltip.lastsTurns > 0 && (
            <div style={{ color: '#64748b', fontSize: 10, marginTop: 5 }}>Lasts {animSpellTooltip.lastsTurns} turns</div>
          )}
        </div>
      )}

      {/* ── Battle intro cinematic ── */}
      {showBattleIntro && (
        <div key={introKey} style={{ position: 'fixed', inset: 0, zIndex: 10000, overflow: 'hidden', animation: 'introOverlayFade 2.75s ease forwards', pointerEvents: 'none' }}>
          {/* Deep dark arena background */}
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 90% 65% at 50% 50%, #1a0505 0%, #060008 55%, #000 100%)' }} />
          {/* CRT scan lines */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg,rgba(0,0,0,0.14) 0px,rgba(0,0,0,0.14) 1px,transparent 1px,transparent 3px)', pointerEvents: 'none' }} />
          {/* Atmospheric floor glow */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '30%', background: 'linear-gradient(to top, rgba(180,30,0,0.12), transparent)', pointerEvents: 'none' }} />

          {/* Screen-shake wrapper */}
          <div style={{ position: 'absolute', inset: 0, animation: 'introShake 2.75s linear forwards' }}>

            {/* ── Left panel (challenger) ── */}
            <div style={{ position: 'absolute', left: '8%', top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, animation: 'introHeroL 2.75s ease forwards' }}>
              <div style={{ fontSize: 10, fontWeight: 900, color: '#fbbf24', letterSpacing: '0.2em', textTransform: 'uppercase', textShadow: '0 0 10px rgba(251,191,36,0.85)', marginBottom: -2 }}>PLAYER 1</div>
              {/* Account portrait */}
              <div style={{ width: 180, height: 200, border: `2.5px solid ${cIntroElemColor}`, boxShadow: `0 0 32px ${cIntroElemColor}, 0 0 80px rgba(255,100,0,0.18), inset 0 0 20px rgba(0,0,0,0.5)`, borderRadius: 8, overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                {battleLog.challenger.profileImagePath
                  ? <HeroPortrait imagePath={battleLog.challenger.profileImagePath} name={battleLog.challenger.username} size={180} />
                  : <div style={{ width: 180, height: 200, background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: 56 }}>{battleLog.challenger.username.charAt(0).toUpperCase()}</div>
                }
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 50%)', pointerEvents: 'none' }} />
              </div>
              {/* Username */}
              <div style={{ fontFamily: '"Impact","Arial Black",sans-serif', fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '0.07em', textTransform: 'uppercase', textShadow: `0 0 14px ${cIntroElemColor}, 2px 2px 0 rgba(0,0,0,0.95)`, animation: 'introNameL 2.75s ease forwards', textAlign: 'center' }}>
                {battleLog.challenger.username}
              </div>
              {/* Team power */}
              {battleLog.challenger.teamPower != null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, animation: 'introNameL 2.75s ease forwards' }}>
                  <span style={{ fontSize: 11, color: '#a0a0b0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Power</span>
                  <span style={{ fontSize: 16, fontWeight: 900, color: '#fbbf24', textShadow: '0 0 10px rgba(251,191,36,0.9), 1px 1px 0 rgba(0,0,0,0.9)' }}>{Math.round(battleLog.challenger.teamPower).toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* ── Right panel (defender) ── */}
            <div style={{ position: 'absolute', right: '8%', top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, animation: 'introHeroR 2.75s ease forwards' }}>
              <div style={{ fontSize: 10, fontWeight: 900, color: '#60a5fa', letterSpacing: '0.2em', textTransform: 'uppercase', textShadow: '0 0 10px rgba(96,165,250,0.85)', marginBottom: -2 }}>OPPONENT</div>
              {/* Account portrait */}
              <div style={{ width: 180, height: 200, border: `2.5px solid ${dIntroElemColor}`, boxShadow: `0 0 32px ${dIntroElemColor}, 0 0 80px rgba(50,100,255,0.18), inset 0 0 20px rgba(0,0,0,0.5)`, borderRadius: 8, overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                {battleLog.defender.profileImagePath
                  ? <HeroPortrait imagePath={battleLog.defender.profileImagePath} name={battleLog.defender.username} size={180} />
                  : <div style={{ width: 180, height: 200, background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: 56 }}>{battleLog.defender.username.charAt(0).toUpperCase()}</div>
                }
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 50%)', pointerEvents: 'none' }} />
              </div>
              {/* Username */}
              <div style={{ fontFamily: '"Impact","Arial Black",sans-serif', fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '0.07em', textTransform: 'uppercase', textShadow: `0 0 14px ${dIntroElemColor}, 2px 2px 0 rgba(0,0,0,0.95)`, animation: 'introNameR 2.75s ease forwards', textAlign: 'center' }}>
                {battleLog.defender.username}
              </div>
              {/* Team power */}
              {battleLog.defender.teamPower != null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, animation: 'introNameR 2.75s ease forwards' }}>
                  <span style={{ fontSize: 11, color: '#a0a0b0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Power</span>
                  <span style={{ fontSize: 16, fontWeight: 900, color: '#fbbf24', textShadow: '0 0 10px rgba(251,191,36,0.9), 1px 1px 0 rgba(0,0,0,0.9)' }}>{Math.round(battleLog.defender.teamPower).toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* ── VS — visible while heroes approach ── */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', animation: 'introVs 2.75s ease forwards', pointerEvents: 'none' }}>
              <span style={{ fontFamily: '"Impact","Arial Black",sans-serif', fontSize: 56, fontWeight: 900, color: 'transparent', backgroundImage: 'linear-gradient(180deg,#ffe000 0%,#ff8c00 45%,#cc2200 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', filter: 'drop-shadow(2px 4px 0 rgba(0,0,0,0.95)) drop-shadow(0 0 18px rgba(255,150,0,0.75))', letterSpacing: '0.06em', lineHeight: 1, display: 'block' }}>VS</span>
            </div>

            {/* ── Clash effects (baked timing: 22% of 2750ms ≈ 605ms) ── */}
            {/* White screen flash */}
            <div style={{ position: 'absolute', inset: 0, background: 'white', animation: 'introFlash 2.75s linear forwards', pointerEvents: 'none' }} />
            {/* Expanding shockwave ring */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', width: 90, height: 90, borderRadius: '50%', border: '12px solid rgba(255,230,50,0.95)', animation: 'introShock 2.75s linear forwards', pointerEvents: 'none' }} />
            {/* Radial gold burst */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', width: 110, height: 110, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,230,60,1) 0%, rgba(255,120,0,0.75) 35%, transparent 68%)', animation: 'introClashBurst 2.75s linear forwards', pointerEvents: 'none' }} />
            {/* Spark starburst */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', width: 260, height: 260, animation: 'introSparks 2.75s linear forwards', pointerEvents: 'none' }}>
              <svg width="260" height="260" viewBox="0 0 260 260" style={{ position: 'absolute', top: '-130px', left: '-130px', overflow: 'visible' }}>
                {[0,22,45,67,90,112,135,157,180,202,225,247,270,292,315,337].map((angle, i) => {
                  const rad = angle * Math.PI / 180;
                  const len = i % 4 === 0 ? 120 : i % 4 === 1 ? 85 : i % 4 === 2 ? 65 : 45;
                  return (
                    <line key={i} x1="130" y1="130" x2={130 + len * Math.cos(rad)} y2={130 + len * Math.sin(rad)}
                      stroke={i % 3 === 0 ? '#fbbf24' : i % 3 === 1 ? '#ff8c00' : '#fff'} strokeWidth={i % 4 === 0 ? 2.8 : 1.5} strokeLinecap="round" opacity="0.95" />
                  );
                })}
              </svg>
            </div>

            {/* ── FIGHT! text — Street Fighter SVG style ── */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', animation: 'introFight 2.75s ease forwards', pointerEvents: 'none', userSelect: 'none' }}>
              <svg width="680" height="145" viewBox="0 0 680 145" style={{ overflow: 'visible', display: 'block', transform: 'translate(-50%, -50%)' }}>
                <defs>
                  {/* Fire face gradient */}
                  <linearGradient id="sfFire" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#fffde7"/>
                    <stop offset="10%"  stopColor="#ffd600"/>
                    <stop offset="32%"  stopColor="#ff8f00"/>
                    <stop offset="60%"  stopColor="#e53935"/>
                    <stop offset="85%"  stopColor="#b71c1c"/>
                    <stop offset="100%" stopColor="#3e0000"/>
                  </linearGradient>
                  {/* Extrusion depth gradient */}
                  <linearGradient id="sfExtr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#6a0000"/>
                    <stop offset="100%" stopColor="#180000"/>
                  </linearGradient>
                  {/* Inner highlight gradient — top quarter only */}
                  <linearGradient id="sfSheen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="rgba(255,255,220,0.55)"/>
                    <stop offset="40%"  stopColor="rgba(255,200,80,0.15)"/>
                    <stop offset="100%" stopColor="rgba(255,200,80,0)"/>
                  </linearGradient>
                  {/* Outer fire haze filter */}
                  <filter id="sfHaze" x="-22%" y="-55%" width="144%" height="210%">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="14" result="b1"/>
                    <feFlood floodColor="#ff5500" floodOpacity="0.75" result="c1"/>
                    <feComposite in="c1" in2="b1" operator="in" result="haze"/>
                    <feGaussianBlur in="SourceAlpha" stdDeviation="28" result="b2"/>
                    <feFlood floodColor="#ff2200" floodOpacity="0.4" result="c2"/>
                    <feComposite in="c2" in2="b2" operator="in" result="haze2"/>
                    <feMerge>
                      <feMergeNode in="haze2"/>
                      <feMergeNode in="haze"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>

                {/* — 3D extrusion stack (darkest bottom → lightest top) — */}
                {[10,9,8,7,6,5,4,3,2,1].map(i => (
                  <text key={i} x="340" y="112" textAnchor="middle"
                    fontFamily='"Impact","Arial Black",sans-serif' fontSize="115"
                    fontStyle="italic" fontWeight="900"
                    fill={i > 6 ? '#1a0000' : '#4a0000'}
                    transform={`translate(${i * 1.4}, ${i * 1.4})`}
                    opacity={0.95 - i * 0.04}>FIGHT!</text>
                ))}

                {/* — Thick black outer stroke — */}
                <text x="340" y="112" textAnchor="middle"
                  fontFamily='"Impact","Arial Black",sans-serif' fontSize="115"
                  fontStyle="italic" fontWeight="900"
                  fill="none" stroke="#000" strokeWidth="9" strokeLinejoin="round" strokeLinecap="round">FIGHT!</text>

                {/* — Fire face with glow filter — */}
                <text x="340" y="112" textAnchor="middle"
                  fontFamily='"Impact","Arial Black",sans-serif' fontSize="115"
                  fontStyle="italic" fontWeight="900"
                  fill="url(#sfFire)" filter="url(#sfHaze)">FIGHT!</text>

                {/* — Crimson mid-stroke for depth separation — */}
                <text x="340" y="112" textAnchor="middle"
                  fontFamily='"Impact","Arial Black",sans-serif' fontSize="115"
                  fontStyle="italic" fontWeight="900"
                  fill="none" stroke="rgba(160,20,0,0.45)" strokeWidth="3">FIGHT!</text>

                {/* — White-yellow sheen overlay (top highlight) — */}
                <text x="340" y="112" textAnchor="middle"
                  fontFamily='"Impact","Arial Black",sans-serif' fontSize="115"
                  fontStyle="italic" fontWeight="900"
                  fill="url(#sfSheen)">FIGHT!</text>
              </svg>
            </div>

          </div>{/* end shake wrapper */}

          {/* Vignette */}
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 50%, transparent 28%, rgba(0,0,0,0.7) 100%)', pointerEvents: 'none' }} />
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
    gap: 3,
    marginTop: 4,
  },
  spellNotif: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 10px',
    backgroundColor: 'rgba(15,25,55,0.97)',
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
    fontSize: 13,
    textShadow: '0 0 12px #3b82f6, 0 0 24px rgba(96,165,250,0.8)',
    flexShrink: 0,
  },
  spellNotifName: {
    color: '#bfdbfe',
    fontWeight: 800,
    fontSize: 11,
    letterSpacing: 0.3,
    flex: 1,
    textShadow: '0 0 10px rgba(147,197,253,0.7)',
  },
  spellNotifCost: {
    color: '#93c5fd',
    fontWeight: 900,
    fontSize: 11,
    backgroundColor: 'rgba(59,130,246,0.3)',
    border: '1px solid rgba(96,165,250,0.4)',
    borderRadius: 4,
    padding: '1px 5px',
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
