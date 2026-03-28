import { useState } from 'react';
import { BookOpen, Activity, AlertTriangle, Sword, Shuffle, Zap, Wind, Sparkles, Flame, Star, Coins, Shield, Droplets, Biohazard, GitBranch, Users, Layers } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

// ── helpers ───────────────────────────────────────────────────────────────────
function getCapacity(wins: number, staEff: number): number {
  switch (wins) {
    case 0: return 100;
    case 1: return 60 + 35 * staEff;
    case 2: return 30 + 50 * staEff;
    case 3: return 10 + 55 * staEff;
    case 4: return 50 * staEff;
    case 5: return 35 * staEff;
    case 6: return 20 * staEff;
    default: return 5 * staEff;
  }
}

function capColor(pct: number): string {
  if (pct >= 80) return '#4ade80';
  if (pct >= 60) return '#a3e635';
  if (pct >= 40) return '#fbbf24';
  if (pct >= 20) return '#f97316';
  return '#e94560';
}

function ordinal(n: number): string {
  if (n === 1) return '1st';
  if (n === 2) return '2nd';
  if (n === 3) return '3rd';
  return `${n}th`;
}

// ── data ─────────────────────────────────────────────────────────────────────
const STAT_DEFS = [
  { abbr: 'PA',   labelKey: 'guide_stat_pa_label',   descKey: 'guide_stat_pa_desc',   color: '#f97316', rgb: '249,115,22' },
  { abbr: 'MP',   labelKey: 'guide_stat_mp_label',   descKey: 'guide_stat_mp_desc',   color: '#60a5fa', rgb: '96,165,250' },
  { abbr: 'DEX',  labelKey: 'guide_stat_dex_label',  descKey: 'guide_stat_dex_desc',  color: '#4ade80', rgb: '74,222,128' },
  { abbr: 'ELEM', labelKey: 'guide_stat_elem_label', descKey: 'guide_stat_elem_desc', color: '#facc15', rgb: '250,204,21' },
  { abbr: 'MANA', labelKey: 'guide_stat_mana_label', descKey: 'guide_stat_mana_desc', color: '#a78bfa', rgb: '167,139,250' },
  { abbr: 'STAM', labelKey: 'guide_stat_stam_label', descKey: 'guide_stat_stam_desc', color: '#fb7185', rgb: '251,113,133' },
];

const ELEM_CHAIN = [
  { from: 'Fire',      to: 'Wind',      fromC: '#f97316', toC: '#4ade80' },
  { from: 'Water',     to: 'Fire',      fromC: '#38bdf8', toC: '#f97316' },
  { from: 'Lightning', to: 'Earth',     fromC: '#facc15', toC: '#a16207' },
  { from: 'Wind',      to: 'Lightning', fromC: '#4ade80', toC: '#facc15' },
  { from: 'Earth',     to: 'Water',     fromC: '#a16207', toC: '#38bdf8' },
];

const CAPACITY_COLS = [
  { label: '25%',  val: 0.25, color: '#e94560' },
  { label: '50%',  val: 0.50, color: '#f97316' },
  { label: '75%',  val: 0.75, color: '#fbbf24' },
  { label: '100%', val: 1.00, color: '#4ade80' },
];

const WIN_ROWS = [0, 1, 2, 3, 4, 5, 6, 7];

const OFF_POS = [
  { tier: 'Commoner',  color: '#94a3b8', rgb: '148,163,184', req: (l: number) => 50  + l * 3, maxPenalty: 80 },
  { tier: 'Elite',     color: '#a78bfa', rgb: '167,139,250', req: (l: number) => 100 + l * 3, maxPenalty: 65 },
  { tier: 'Legendary', color: '#fbbf24', rgb: '251,191,36',  req: (l: number) => 150 + l * 3, maxPenalty: 50 },
];

// ── shared components ─────────────────────────────────────────────────────────
function SectionCard({
  icon, title, color = '#60a5fa', children,
}: {
  icon: React.ReactNode; title: string; color?: string; children: React.ReactNode;
}) {
  return (
    <div style={{
      background: 'rgba(10,10,24,0.78)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderTop: `2px solid ${color}`,
      borderRadius: 14,
      padding: '24px 26px',
      marginBottom: 18,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: -32, right: -32, width: 120, height: 120,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${color}10, transparent 70%)`,
        pointerEvents: 'none',
      }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 20 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 9,
          background: `${color}14`, border: `1px solid ${color}28`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color, flexShrink: 0, filter: `drop-shadow(0 0 7px ${color}50)`,
        }}>
          {icon}
        </div>
        <h2 style={{
          margin: 0, fontSize: 15, fontWeight: 800, color: '#e4e4f4',
          fontFamily: 'Inter, sans-serif', letterSpacing: '0.01em',
        }}>
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

function SubLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      color: '#6060a0', fontSize: 10, fontWeight: 700,
      letterSpacing: '0.14em', textTransform: 'uppercase',
      fontFamily: 'Inter, sans-serif', marginBottom: 10,
    }}>
      {children}
    </div>
  );
}

function FormulaBox({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: `rgba(${color},0.05)`,
      border: `1px solid rgba(${color},0.18)`,
      borderRadius: 10, padding: '16px 20px',
      fontFamily: 'monospace', fontSize: 14, lineHeight: 2.2,
      marginBottom: 20,
    }}>
      {children}
    </div>
  );
}

function Kw({ c, children }: { c: string; children: React.ReactNode }) {
  return <span style={{ color: c, fontWeight: 700 }}>{children}</span>;
}
function Dim({ children }: { children: React.ReactNode }) {
  return <span style={{ color: '#444466' }}>{children}</span>;
}

function InsightBox({ color, rgb, children }: { color: string; rgb: string; children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', gap: 10, alignItems: 'flex-start',
      background: `rgba(${rgb},0.05)`,
      border: `1px solid rgba(${rgb},0.18)`,
      borderRadius: 9, padding: '12px 14px', marginBottom: 14,
    }}>
      <AlertTriangle size={14} color={color} style={{ flexShrink: 0, marginTop: 2 }} />
      <p style={{ color: '#4a4a72', fontSize: 12.5, lineHeight: 1.7, margin: 0, fontFamily: 'Inter, sans-serif' }}>
        {children}
      </p>
    </div>
  );
}

function StatGrid({ items }: { items: { label: string; val: string; color: string }[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${items.length}, 1fr)`, gap: 10, marginBottom: 18 }}>
      {items.map(({ label, val, color }) => (
        <div key={label} style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 8, padding: '10px 12px',
        }}>
          <div style={{ color, fontWeight: 800, fontSize: 18, fontFamily: 'Inter, sans-serif', lineHeight: 1 }}>{val}</div>
          <div style={{ color: '#3e3e60', fontSize: 11, marginTop: 5, fontFamily: 'Inter, sans-serif', lineHeight: 1.4 }}>{label}</div>
        </div>
      ))}
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────
export default function GuidePage() {
  const { t } = useLanguage();
  const [previewStam, setPreviewStam] = useState(80);
  const [previewLevel, setPreviewLevel] = useState(15);
  const [previewCritChance, setPreviewCritChance] = useState(13);
  const [previewCritDmg, setPreviewCritDmg] = useState(25);
  const [previewMagProf, setPreviewMagProf] = useState(18);
  const [previewDexProf, setPreviewDexProf] = useState(33);
  const [previewDexPosture, setPreviewDexPosture] = useState(20);
  const [previewDex, setPreviewDex] = useState(100);
  const [previewSpellMastery, setPreviewSpellMastery] = useState(10);
  const [previewSpellAct, setPreviewSpellAct] = useState(22);
  const [previewBaseChance, setPreviewBaseChance] = useState(50);

  const staEff = Math.min(1.0, previewStam / (60 + previewLevel * 2.5));
  const effPct = staEff * 100;

  // Crit preview
  const critExpectedBonus = (previewCritChance / 100) * (previewCritDmg / 100);

  // Magic prof preview — multi-reroll expected MP roll improvement
  // guaranteed rerolls = floor(magProf/100), partial chance = magProf%100
  const magGuaranteed = Math.floor(previewMagProf / 100);
  const magPartial = (previewMagProf % 100) / 100;
  const nBase = magGuaranteed + 1; // total rolls (base + guaranteed)
  const expectedRollNoProf = 0.5;
  // E[max of n uniform] = n/(n+1); blend with partial chance of one more
  const expectedRollWithProf = (1 - magPartial) * (nBase / (nBase + 1)) + magPartial * ((nBase + 1) / (nBase + 2));

  // DEX cycle preview
  const dexProfDec = previewDexProf / 100;
  const dexPostureDec = previewDexPosture / 100;
  const dexFactor = 0.33 + dexProfDec;
  const dexUsed = previewDex * dexFactor;
  const dexRecovered = dexPostureDec * dexUsed;
  const dexRemaining = Math.max(0, previewDex - dexUsed + dexRecovered);

  // Spell mastery preview
  const spellMasteryDec = previewSpellMastery / 100;

  // Spell activation preview
  const effectiveChance = Math.min(100, previewBaseChance + previewSpellAct);

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', padding: '4px 0 64px' }}>

      {/* ── Page header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 26 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.22)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#60a5fa', filter: 'drop-shadow(0 0 10px rgba(96,165,250,0.45))',
          flexShrink: 0,
        }}>
          <BookOpen size={20} />
        </div>
        <div>
          <h1 style={{
            margin: '0 0 4px', fontSize: 24, fontWeight: 900,
            color: '#e8e8f8', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.01em',
          }}>
            {t('guide_title')}
          </h1>
          <p style={{
            margin: 0, color: '#4a4a72', fontSize: 13,
            fontFamily: 'Inter, sans-serif', lineHeight: 1.5,
          }}>
            {t('guide_subtitle')}
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 1 — HERO STATS OVERVIEW
      ══════════════════════════════════════════════════════════════════════ */}
      <SectionCard icon={<Activity size={16} />} title={t('guide_s_hero_stats')} color="#60a5fa">
        <p style={{
          color: '#5a5a84', fontSize: 13, lineHeight: 1.8,
          margin: '0 0 20px', fontFamily: 'Inter, sans-serif',
        }}>
          {t('guide_hero_stats_body')}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {STAT_DEFS.map(({ abbr, labelKey, color, rgb, descKey }) => (
            <div key={abbr} style={{
              display: 'flex', gap: 12, alignItems: 'flex-start',
              background: `rgba(${rgb},0.04)`,
              border: `1px solid rgba(${rgb},0.18)`,
              borderLeft: `3px solid ${color}`,
              borderRadius: 9, padding: '11px 13px',
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: 8, flexShrink: 0,
                background: `rgba(${rgb},0.12)`, border: `1px solid rgba(${rgb},0.28)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color, fontSize: 9.5, fontWeight: 900, letterSpacing: '0.05em',
                fontFamily: 'Inter, sans-serif',
                filter: `drop-shadow(0 0 6px rgba(${rgb},0.55))`,
              }}>
                {abbr}
              </div>
              <div>
                <div style={{
                  color: '#c8c8e8', fontWeight: 700, fontSize: 13,
                  marginBottom: 4, fontFamily: 'Inter, sans-serif',
                }}>
                  {t(labelKey as Parameters<typeof t>[0])}
                </div>
                <div style={{
                  color: '#5a5a84', fontSize: 12, lineHeight: 1.65,
                  fontFamily: 'Inter, sans-serif',
                }}>
                  {t(descKey as Parameters<typeof t>[0])}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 22 }}>
          <SubLabel>{t('guide_elem_adv_chain')}</SubLabel>
          <div style={{
            display: 'flex', gap: 8, flexWrap: 'wrap',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 10, padding: '14px 16px',
          }}>
            {ELEM_CHAIN.map(({ from, to, fromC, toC }) => (
              <div key={from} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 7, padding: '6px 10px',
              }}>
                <span style={{ color: fromC, fontWeight: 700, fontSize: 12, fontFamily: 'Inter, sans-serif' }}>{from}</span>
                <span style={{ color: '#333355', fontSize: 11 }}>{t('guide_elem_beats')}</span>
                <span style={{ color: toC, fontWeight: 700, fontSize: 12, fontFamily: 'Inter, sans-serif' }}>{to}</span>
              </div>
            ))}
            <div style={{
              display: 'flex', alignItems: 'center',
              color: '#3a3a5a', fontSize: 11, fontFamily: 'Inter, sans-serif',
              fontStyle: 'italic', paddingLeft: 4,
            }}>
              {t('guide_elem_note')}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 2 — STAMINA
      ══════════════════════════════════════════════════════════════════════ */}
      <SectionCard icon={<Activity size={16} />} title={t('guide_s_stamina')} color="#fb7185">

        <p style={{
          color: '#5a5a84', fontSize: 13, lineHeight: 1.8,
          margin: '0 0 24px', fontFamily: 'Inter, sans-serif',
        }}>
          {t('guide_stam_body')}
        </p>

        <div style={{ marginBottom: 26 }}>
          <SubLabel>{t('guide_stam_formula_label')}</SubLabel>
          <FormulaBox color="251,113,133">
            <Kw c="#fb7185">sta_eff</Kw><Dim> = min(</Dim><Kw c="#4ade80">1.0</Kw><Dim>, </Dim>
            <Kw c="#fb7185">hero_stamina</Kw><Dim> / (</Dim><Kw c="#fbbf24">60</Kw>
            <Dim> + </Dim><Kw c="#a78bfa">level</Kw><Dim> × </Dim><Kw c="#fbbf24">2.5</Kw><Dim>))</Dim>
          </FormulaBox>
          <StatGrid items={[
            { label: t('guide_stam_lv1'),  val: '62.5',  color: '#60a5fa' },
            { label: t('guide_stam_lv25'), val: '122.5', color: '#a78bfa' },
            { label: t('guide_stam_lv50'), val: '185.0', color: '#fbbf24' },
          ]} />
        </div>

        <div style={{ marginBottom: 26 }}>
          <SubLabel>{t('guide_live_preview')}</SubLabel>
          <div style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 10, padding: '18px 20px',
          }}>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 16 }}>
              <div style={{ flex: 1, minWidth: 160 }}>
                <label style={{ color: '#5a5a84', fontSize: 11.5, fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  {t('guide_stam_slider_stam')} <span style={{ color: '#fb7185', fontWeight: 800, fontSize: 15 }}>{previewStam}</span>
                </label>
                <input type="range" min={1} max={300} value={previewStam} onChange={(e) => setPreviewStam(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#fb7185', cursor: 'pointer' }} />
              </div>
              <div style={{ flex: 1, minWidth: 160 }}>
                <label style={{ color: '#5a5a84', fontSize: 11.5, fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  {t('guide_stam_slider_level')} <span style={{ color: '#a78bfa', fontWeight: 800, fontSize: 15 }}>{previewLevel}</span>
                </label>
                <input type="range" min={1} max={50} value={previewLevel} onChange={(e) => setPreviewLevel(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#a78bfa', cursor: 'pointer' }} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 7, padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
                <span style={{ color: '#3e3e60', fontSize: 10, fontFamily: 'Inter, sans-serif' }}>{t('guide_stam_required')}</span>
                <span style={{ color: '#fbbf24', fontWeight: 800, fontSize: 16, fontFamily: 'Inter, sans-serif' }}>{(60 + previewLevel * 2.5).toFixed(1)}</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 7, padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
                <span style={{ color: '#3e3e60', fontSize: 10, fontFamily: 'Inter, sans-serif' }}>{t('guide_stam_effectiveness')}</span>
                <span style={{ color: capColor(effPct), fontWeight: 800, fontSize: 16, fontFamily: 'Inter, sans-serif' }}>{effPct.toFixed(1)}%</span>
              </div>
              <div style={{ flex: 1, minWidth: 120 }}>
                <div style={{ height: 8, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(100, effPct)}%`, background: `linear-gradient(90deg, #e94560, ${capColor(effPct)})`, borderRadius: 4, transition: 'width 0.3s ease', boxShadow: `0 0 8px ${capColor(effPct)}60` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 26 }}>
          <SubLabel>{t('guide_stam_turn_cap')}</SubLabel>
          <p style={{ color: '#4a4a72', fontSize: 12.5, lineHeight: 1.7, margin: '0 0 14px', fontFamily: 'Inter, sans-serif' }}>
            {t('guide_stam_turn_cap_body')}
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Inter, sans-serif', fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={{ color: '#44446a', fontWeight: 600, textAlign: 'left', padding: '8px 12px 12px 0', borderBottom: '1px solid rgba(255,255,255,0.07)', whiteSpace: 'nowrap' }}>{t('guide_stam_clash_col')}</th>
                  {CAPACITY_COLS.map(({ label, color }) => (
                    <th key={label} style={{ color, fontWeight: 700, textAlign: 'center', padding: '8px 10px 12px', borderBottom: '1px solid rgba(255,255,255,0.07)', whiteSpace: 'nowrap', fontSize: 11 }}>{t('guide_stam_eff_col')} {label}</th>
                  ))}
                  <th style={{ color: '#fbbf24', fontWeight: 700, textAlign: 'center', padding: '8px 10px 12px', borderBottom: '1px solid rgba(255,255,255,0.07)', whiteSpace: 'nowrap', fontSize: 11 }}>{t('guide_stam_preview_col')} ({effPct.toFixed(1)}%)</th>
                </tr>
              </thead>
              <tbody>
                {WIN_ROWS.map((wins) => {
                  const previewCap = getCapacity(wins, staEff);
                  const isFirst = wins === 0;
                  const clashLabel = wins === 7 ? t('guide_stam_clash_8') : `${ordinal(wins + 1)} clash`;
                  return (
                    <tr key={wins} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: isFirst ? 'rgba(74,222,128,0.04)' : 'transparent' }}>
                      <td style={{ padding: '9px 12px 9px 0', color: '#7070a0', whiteSpace: 'nowrap' }}>
                        {clashLabel}
                        {isFirst && <span style={{ color: '#4ade80', fontSize: 9.5, fontWeight: 700, marginLeft: 7, letterSpacing: '0.08em', background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: 4, padding: '1px 5px' }}>{t('guide_stam_fresh')}</span>}
                      </td>
                      {CAPACITY_COLS.map(({ val }) => {
                        const cap = getCapacity(wins, val);
                        const c = capColor(cap);
                        return (
                          <td key={val} style={{ padding: '9px 10px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                              <span style={{ color: c, fontWeight: 700, fontSize: 12.5 }}>{cap.toFixed(1)}%</span>
                              <div style={{ width: 56, height: 4, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${Math.max(0, cap)}%`, backgroundColor: c, borderRadius: 2 }} />
                              </div>
                            </div>
                          </td>
                        );
                      })}
                      <td style={{ padding: '9px 10px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                          <span style={{ color: capColor(previewCap), fontWeight: 800, fontSize: 13.5 }}>{previewCap.toFixed(1)}%</span>
                          <div style={{ width: 56, height: 6, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <div style={{ height: '100%', width: `${Math.max(0, previewCap)}%`, background: `linear-gradient(90deg, #fb7185, ${capColor(previewCap)})`, borderRadius: 3, transition: 'width 0.3s ease', boxShadow: `0 0 4px ${capColor(previewCap)}80` }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <SubLabel>{t('guide_stam_off_pos')}</SubLabel>
          <InsightBox color="#fbbf24" rgb="251,191,36">
            {t('guide_stam_off_pos_insight')}
          </InsightBox>
          <FormulaBox color="251,191,36">
            <div><Kw c="#a78bfa">required</Kw><Dim> = </Dim><Kw c="#fbbf24">base</Kw><Dim> + </Dim><Kw c="#a78bfa">level</Kw><Dim> × </Dim><Kw c="#fbbf24">3</Kw></div>
            <div><Kw c="#fbbf24">eff_max</Kw><Dim> = </Dim><Kw c="#fbbf24">slot_max</Kw><Dim> × (</Dim><Kw c="#4ade80">1</Kw><Dim> − </Dim><Kw c="#94a3b8">off_positioning</Kw><Dim>)</Dim></div>
            <div><Kw c="#f97316">penalty</Kw><Dim> = </Dim><Kw c="#fbbf24">eff_max</Kw><Dim> × max(</Dim><Kw c="#4ade80">0</Kw><Dim>, </Dim><Kw c="#4ade80">1</Kw><Dim> − </Dim><Kw c="#fb7185">stamina</Kw><Dim> / </Dim><Kw c="#a78bfa">required</Kw><Dim>)</Dim></div>
            <div><Kw c="#fb7185">stamina_after</Kw><Dim> = </Dim><Kw c="#fb7185">stamina</Kw><Dim> × (</Dim><Kw c="#4ade80">1</Kw><Dim> − </Dim><Kw c="#f97316">penalty</Kw><Dim>)</Dim></div>
          </FormulaBox>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 14 }}>
            {OFF_POS.map(({ tier, color, rgb, req, maxPenalty }) => (
              <div key={tier} style={{ background: `rgba(${rgb},0.05)`, border: `1px solid rgba(${rgb},0.18)`, borderTop: `2px solid ${color}`, borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ color, fontWeight: 800, fontSize: 14, marginBottom: 12, fontFamily: 'Inter, sans-serif', filter: `drop-shadow(0 0 6px rgba(${rgb},0.5))` }}>{tier} Slot</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[1, 25, 50].map((lvl) => (
                    <div key={lvl} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, fontFamily: 'Inter, sans-serif' }}>
                      <span style={{ color: '#44446a' }}>Lv.{lvl} req:</span>
                      <span style={{ color: '#b0b0d0', fontWeight: 700 }}>{req(lvl)}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 6, paddingTop: 8, borderTop: `1px solid rgba(${rgb},0.15)`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, fontFamily: 'Inter, sans-serif' }}>
                    <span style={{ color: '#44446a' }}>{t('guide_stam_max_penalty')}</span>
                    <span style={{ color, fontWeight: 800, fontSize: 14 }}>{maxPenalty}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p style={{ color: '#333355', fontSize: 11.5, lineHeight: 1.7, margin: '0 0 18px', fontFamily: 'Inter, sans-serif', fontStyle: 'italic' }}>
            {t('guide_stam_off_pos_note')}
          </p>

          {/* Off-Positioning stat explainer */}
          <SubLabel>{t('guide_stam_off_pos_substat')}</SubLabel>
          <InsightBox color="#94a3b8" rgb="148,163,184">
            {t('guide_stam_off_pos_insight2')}
          </InsightBox>

          {/* Interactive: show eff max penalty at different off-positioning values */}
          <div style={{ overflowX: 'auto', marginBottom: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, fontFamily: 'Inter, sans-serif' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left', color: '#44446a', fontWeight: 700 }}>{t('guide_stam_slot_col')}</th>
                  <th style={{ padding: '8px 12px', textAlign: 'center', color: '#44446a', fontWeight: 700 }}>{t('guide_stam_base_max_col')}</th>
                  {[0, 25, 50, 75, 100].map(v => (
                    <th key={v} style={{ padding: '8px 12px', textAlign: 'center', color: v === 0 ? '#44446a' : '#fbbf24', fontWeight: 700 }}>
                      {v === 0 ? t('guide_stam_no_stat') : `${v}% off-pos`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {OFF_POS.map(({ tier, color, rgb, maxPenalty }) => (
                  <tr key={tier} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '9px 12px', color, fontWeight: 700 }}>{tier}</td>
                    <td style={{ padding: '9px 12px', textAlign: 'center', color: '#b0b0d0', fontWeight: 700 }}>{maxPenalty}%</td>
                    {[0, 25, 50, 75, 100].map(v => {
                      const eff = +(maxPenalty * (1 - v / 100)).toFixed(1);
                      const gone = eff === 0;
                      return (
                        <td key={v} style={{ padding: '9px 12px', textAlign: 'center' }}>
                          <span style={{ color: gone ? '#4ade80' : `rgba(${rgb},${0.9 - v * 0.006})`, fontWeight: 700 }}>
                            {gone ? '✓ 0%' : `${eff}%`}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ color: '#333355', fontSize: 11, lineHeight: 1.7, margin: 0, fontFamily: 'Inter, sans-serif', fontStyle: 'italic' }}>
            {t('guide_stam_off_pos_note2')}
          </p>
        </div>
      </SectionCard>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 3 — TENACITY
      ══════════════════════════════════════════════════════════════════════ */}
      <SectionCard icon={<Activity size={16} />} title={t('guide_s_tenacity')} color="#06b6d4">
        <p style={{ color: '#5a5a84', fontSize: 13, lineHeight: 1.8, margin: '0 0 16px', fontFamily: 'Inter, sans-serif' }}>
          {t('guide_ten_body')}
        </p>

        <div style={{ marginBottom: 18 }}>
          <SubLabel>{t('guide_ten_how_it_works')}</SubLabel>
          <InsightBox color="#06b6d4" rgb="6,182,212">
            {t('guide_ten_insight')}
          </InsightBox>
          <FormulaBox color="6,182,212">
            <div><Kw c="#06b6d4">eff_ten</Kw><Dim> = t ≤ 60 ? t : </Dim><Kw c="#4ade80">60</Kw><Dim> + (t−60)×60 / (t−60+60)</Dim></div>
            <div><Kw c="#f97316">penalty</Kw><Dim> = (</Dim><Kw c="#4ade80">1</Kw><Dim> − </Dim><Kw c="#fbbf24">raw_capacity</Kw><Dim>) × </Dim><Kw c="#4ade80">200</Kw><Dim> / (</Dim><Kw c="#4ade80">200</Kw><Dim> + </Dim><Kw c="#06b6d4">eff_ten</Kw><Dim>)</Dim></div>
            <div><Kw c="#fbbf24">final_capacity</Kw><Dim> = </Dim><Kw c="#4ade80">1</Kw><Dim> − </Dim><Kw c="#f97316">penalty</Kw></div>
          </FormulaBox>
        </div>

        <div style={{ marginBottom: 18 }}>
          <SubLabel>{t('guide_ten_soft_cap')}</SubLabel>
          <p style={{ color: '#5a5a84', fontSize: 12.5, lineHeight: 1.7, margin: '0 0 12px', fontFamily: 'Inter, sans-serif' }}>
            {t('guide_ten_soft_cap_body')}
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, fontFamily: 'Inter, sans-serif' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  {([t('guide_ten_raw_col'), 30, 60, 80, 100, 130, 160, 200] as (string | number)[]).map(v => (
                    <th key={String(v)} style={{ padding: '7px 12px', textAlign: 'center', color: v === t('guide_ten_raw_col') ? '#44446a' : (v as number) <= 60 ? '#06b6d4' : '#22d3ee', fontWeight: 700 }}>{v}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '7px 12px', textAlign: 'center', color: '#44446a', fontWeight: 700 }}>{t('guide_ten_eff_col')}</td>
                  {[30, 60, 80, 100, 130, 160, 200].map(t => {
                    const eff = t <= 60 ? t : 60 + (t - 60) * 60 / (t - 60 + 60);
                    return (
                      <td key={t} style={{ padding: '7px 12px', textAlign: 'center', color: t <= 60 ? '#06b6d4' : '#94a3b8', fontWeight: 700 }}>{eff.toFixed(1)}</td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <SubLabel>{t('guide_ten_example')}</SubLabel>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: 'Inter, sans-serif' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  {[t('guide_ten_sta_eff'), t('guide_ten_raw_cap'), 'Ten 0', 'Ten 50', 'Ten 100', 'Ten 200'].map(h => (
                    <th key={h} style={{ padding: '7px 10px', textAlign: 'center', color: '#44446a', fontWeight: 700 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[0, 0.5, 0.75, 1.0].map(sta => {
                  const rawCap = (60 + 35 * sta) / 100;
                  const penalty = 1 - rawCap;
                  const finalCap = (ten: number) => {
                    if (ten === 0 || penalty === 0) return rawCap;
                    const eff = ten <= 60 ? ten : 60 + (ten - 60) * 60 / (ten - 60 + 60);
                    return 1 - penalty * 200 / (200 + eff);
                  };
                  return (
                    <tr key={sta} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '8px 10px', textAlign: 'center', color: '#b0b0d0', fontWeight: 700 }}>{Math.round(sta * 100)}%</td>
                      <td style={{ padding: '8px 10px', textAlign: 'center', color: '#fbbf24', fontWeight: 700 }}>{(rawCap * 100).toFixed(0)}%</td>
                      {[0, 50, 100, 200].map(ten => (
                        <td key={ten} style={{ padding: '8px 10px', textAlign: 'center', color: ten === 0 ? '#6b7280' : '#06b6d4', fontWeight: ten > 0 ? 700 : 400 }}>
                          {(finalCap(ten) * 100).toFixed(0)}%
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p style={{ color: '#333355', fontSize: 11, lineHeight: 1.7, margin: '12px 0 0', fontFamily: 'Inter, sans-serif', fontStyle: 'italic' }}>
            {t('guide_ten_note')}
          </p>
        </div>
      </SectionCard>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 4 — FATIGUE RECOVERY
      ══════════════════════════════════════════════════════════════════════ */}
      <SectionCard icon={<Droplets size={16} />} title={t('guide_s_fatigue')} color="#34d399">
        <p style={{ color: '#5a5a84', fontSize: 13, lineHeight: 1.8, margin: '0 0 16px', fontFamily: 'Inter, sans-serif' }}>
          {t('guide_fat_body')}
        </p>

        <div style={{ marginBottom: 18 }}>
          <SubLabel>{t('guide_fat_how_it_works')}</SubLabel>
          <InsightBox color="#34d399" rgb="52,211,153">
            {t('guide_fat_insight')}
          </InsightBox>
          <FormulaBox color="52,211,153">
            <div><Kw c="#34d399">eff_FR</Kw><Dim> = fr ≤ 0.30 ? fr : </Dim><Kw c="#4ade80">0.30</Kw><Dim> + (fr−0.30)×0.30 / (fr−0.30+0.50)</Dim></div>
            <div><Kw c="#fbbf24">capacity_final</Kw><Dim> = min(</Dim><Kw c="#4ade80">1.0</Kw><Dim>, </Dim><Kw c="#fbbf24">capacity</Kw><Dim> + </Dim><Kw c="#34d399">eff_FR</Kw><Dim>)</Dim></div>
          </FormulaBox>
        </div>

        <div style={{ marginBottom: 18 }}>
          <SubLabel>{t('guide_fat_soft_cap')}</SubLabel>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, fontFamily: 'Inter, sans-serif' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  {[10, 20, 30, 40, 50, 70, 100].map(v => (
                    <th key={v} style={{ padding: '7px 12px', textAlign: 'center', color: v <= 30 ? '#34d399' : '#6ee7b7', fontWeight: 700 }}>{v}%</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {[10, 20, 30, 40, 50, 70, 100].map(raw => {
                    const fr = raw / 100;
                    const eff = fr <= 0.30 ? fr : 0.30 + (fr - 0.30) * 0.30 / (fr - 0.30 + 0.50);
                    return (
                      <td key={raw} style={{ padding: '7px 12px', textAlign: 'center', color: raw <= 30 ? '#34d399' : '#94a3b8', fontWeight: 700 }}>
                        {(eff * 100).toFixed(1)}%
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <SubLabel>{t('guide_fat_example')}</SubLabel>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: 'Inter, sans-serif' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  {[t('guide_fat_turn_col'), t('guide_fat_base_range_col'), t('guide_fat_with10_col')].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: h === t('guide_fat_turn_col') ? 'center' : 'left', color: '#44446a', fontWeight: 700 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { turn: '2nd', min: 60, max: 95 },
                  { turn: '3rd', min: 30, max: 80 },
                  { turn: '4th', min: 10, max: 65 },
                ].map(({ turn, min, max }) => (
                  <tr key={turn} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '9px 12px', textAlign: 'center', color: '#b0b0d0', fontWeight: 700 }}>{turn}</td>
                    <td style={{ padding: '9px 12px', color: '#6b7280' }}>{min}% – {max}%</td>
                    <td style={{ padding: '9px 12px', color: '#34d399', fontWeight: 700 }}>
                      {Math.min(100, min + 10)}% – {Math.min(100, max + 10)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ color: '#333355', fontSize: 11, lineHeight: 1.7, margin: '12px 0 0', fontFamily: 'Inter, sans-serif', fontStyle: 'italic' }}>
            {t('guide_fat_note')}
          </p>
        </div>
      </SectionCard>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 5 — CLEANSE
      ══════════════════════════════════════════════════════════════════════ */}
      <SectionCard icon={<Sparkles size={16} />} title={t('guide_s_cleanse')} color="#a5f3fc">
        <p style={{ color: '#5a5a84', fontSize: 13, lineHeight: 1.8, margin: '0 0 16px', fontFamily: 'Inter, sans-serif' }}>
          {t('guide_cleanse_body')}
        </p>

        <div style={{ marginBottom: 18 }}>
          <SubLabel>{t('guide_cleanse_how_it_works')}</SubLabel>
          <InsightBox color="#a5f3fc" rgb="165,243,252">
            {t('guide_cleanse_insight')}
          </InsightBox>
          <FormulaBox color="165,243,252">
            <div><Dim>each round: </Dim><Kw c="#f97316">roll</Kw><Dim> = random [0, 1)</Dim></div>
            <div><Kw c="#4ade80">if</Kw><Dim> roll &lt; </Dim><Kw c="#a5f3fc">cleanse_chance</Kw><Dim> → all conditions removed</Dim></div>
          </FormulaBox>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {([
            { titleKey: 'guide_cleanse_timing_title', bodyKey: 'guide_cleanse_timing_body' },
            { titleKey: 'guide_cleanse_nocap_title', bodyKey: 'guide_cleanse_nocap_body' },
            { titleKey: 'guide_cleanse_reapply_title', bodyKey: 'guide_cleanse_reapply_body' },
            { titleKey: 'guide_cleanse_future_title', bodyKey: 'guide_cleanse_future_body' },
          ] as { titleKey: Parameters<typeof t>[0]; bodyKey: Parameters<typeof t>[0] }[]).map(({ titleKey, bodyKey }) => (
            <div key={titleKey} style={{ background: 'rgba(165,243,252,0.04)', border: '1px solid rgba(165,243,252,0.15)', borderTop: '2px solid #a5f3fc', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ color: '#a5f3fc', fontWeight: 800, fontSize: 13, marginBottom: 8, fontFamily: 'Inter, sans-serif' }}>{t(titleKey)}</div>
              <p style={{ color: '#5a5a84', fontSize: 12, lineHeight: 1.6, margin: 0, fontFamily: 'Inter, sans-serif' }}>{t(bodyKey)}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 6 — ATTACK (FLAT)
      ══════════════════════════════════════════════════════════════════════ */}
      <SectionCard icon={<Sword size={16} />} title={t('guide_s_attack')} color="#f97316">
        <p style={{ color: '#5a5a84', fontSize: 13, lineHeight: 1.8, margin: '0 0 20px', fontFamily: 'Inter, sans-serif' }}>
          {t('guide_atk_body')}
        </p>

        <div style={{ marginBottom: 22 }}>
          <SubLabel>{t('guide_atk_formula_label')}</SubLabel>
          <FormulaBox color="249,115,22">
            <div><Kw c="#a0a0c0">raw_total</Kw><Dim> = (</Dim><Kw c="#f97316">PA</Kw><Dim>×0.5 + </Dim><Kw c="#60a5fa">MP</Kw><Dim>×roll + </Dim><Kw c="#4ade80">DEX</Kw><Dim>×factor) × </Dim><Kw c="#fb7185">stamina</Kw></div>
            <div><Kw c="#fbbf24">final</Kw><Dim> = </Dim><Kw c="#a0a0c0">raw_total</Kw><Dim> + </Dim><Kw c="#f97316">crit_pa_bonus</Kw><Dim> + </Dim><Kw c="#f97316">attack_flat</Kw></div>
          </FormulaBox>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
          {[
            { titleKey: 'guide_atk_stam_ind_title', descKey: 'guide_atk_stam_ind_desc', color: '#f97316', rgb: '249,115,22' },
            { titleKey: 'guide_atk_crit_ind_title', descKey: 'guide_atk_crit_ind_desc', color: '#fbbf24', rgb: '251,191,36' },
            { titleKey: 'guide_atk_sources_title',  descKey: 'guide_atk_sources_desc',  color: '#fb7185', rgb: '251,113,133' },
            { titleKey: 'guide_atk_low_pa_title',   descKey: 'guide_atk_low_pa_desc',   color: '#a78bfa', rgb: '167,139,250' },
          ].map(({ titleKey, descKey, color, rgb }) => {
            const title = t(titleKey as Parameters<typeof t>[0]);
            const desc  = t(descKey  as Parameters<typeof t>[0]);
            return (
            <div key={title} style={{ background: `rgba(${rgb},0.05)`, border: `1px solid rgba(${rgb},0.15)`, borderLeft: `3px solid ${color}`, borderRadius: 9, padding: '12px 14px' }}>
              <div style={{ color, fontWeight: 700, fontSize: 12.5, marginBottom: 5, fontFamily: 'Inter, sans-serif' }}>{title}</div>
              <div style={{ color: '#4a4a72', fontSize: 12, lineHeight: 1.65, fontFamily: 'Inter, sans-serif' }}>{desc}</div>
            </div>
          );
          })}
        </div>
      </SectionCard>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 4 — MAGIC PROFICIENCY
      ══════════════════════════════════════════════════════════════════════ */}
      <SectionCard icon={<Shuffle size={16} />} title={t('guide_s_magic_prof')} color="#60a5fa">
        <p style={{ color: '#5a5a84', fontSize: 13, lineHeight: 1.8, margin: '0 0 20px', fontFamily: 'Inter, sans-serif' }}>
          {t('guide_magprof_body')}
        </p>

        <div style={{ marginBottom: 22 }}>
          <SubLabel>{t('guide_magprof_formula_label')}</SubLabel>
          <FormulaBox color="96,165,250">
            <div><Kw c="#a78bfa">guaranteed</Kw><Dim> = floor(</Dim><Kw c="#60a5fa">magic_proficiency</Kw><Dim> / 100)</Dim></div>
            <div><Kw c="#fbbf24">partial</Kw><Dim>    = (</Dim><Kw c="#60a5fa">magic_proficiency</Kw><Dim> % 100) / 100</Dim></div>
            <div style={{ marginTop: 6 }}><Kw c="#60a5fa">mp_contrib</Kw><Dim> = </Dim><Kw c="#60a5fa">MP</Kw><Dim> × </Dim><Kw c="#fbbf24">roll()</Kw><Dim>  ← base roll</Dim></div>
            <div><Dim>for i in range(</Dim><Kw c="#a78bfa">guaranteed</Kw><Dim>):  mp_contrib = max(mp_contrib, </Dim><Kw c="#60a5fa">MP</Kw><Dim> × </Dim><Kw c="#fbbf24">roll()</Kw><Dim>)</Dim></div>
            <div><Dim>if random() {'<'} </Dim><Kw c="#fbbf24">partial</Kw><Dim>:  mp_contrib = max(mp_contrib, </Dim><Kw c="#60a5fa">MP</Kw><Dim> × </Dim><Kw c="#fbbf24">roll()</Kw><Dim>)</Dim></div>
          </FormulaBox>
        </div>

        <div style={{ marginBottom: 22 }}>
          <SubLabel>{t('guide_live_preview')}</SubLabel>
          <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '18px 20px' }}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ color: '#5a5a84', fontSize: 11.5, fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                {t('guide_magprof_slider_label')} <span style={{ color: '#60a5fa', fontWeight: 800, fontSize: 15 }}>{previewMagProf}%</span>
                <span style={{ color: '#a78bfa', fontSize: 11, marginLeft: 4 }}>
                  ({magGuaranteed} guaranteed{magPartial > 0 ? ` + ${Math.round(magPartial * 100)}% chance of 1 more` : ''} reroll{magGuaranteed !== 1 ? 's' : ''})
                </span>
              </label>
              <input type="range" min={0} max={300} value={previewMagProf} onChange={(e) => setPreviewMagProf(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#60a5fa', cursor: 'pointer' }} />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '10px 14px' }}>
                <div style={{ color: '#3e3e60', fontSize: 10, fontFamily: 'Inter, sans-serif', marginBottom: 4 }}>{t('guide_magprof_no_prof')}</div>
                <div style={{ color: '#a0a0c0', fontWeight: 800, fontSize: 17, fontFamily: 'Inter, sans-serif' }}>×{expectedRollNoProf.toFixed(3)}</div>
              </div>
              <div style={{ flex: 1, background: 'rgba(96,165,250,0.07)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 8, padding: '10px 14px' }}>
                <div style={{ color: '#3e3e60', fontSize: 10, fontFamily: 'Inter, sans-serif', marginBottom: 4 }}>{t('guide_magprof_with_prof').replace('{pct}', String(previewMagProf))}</div>
                <div style={{ color: '#60a5fa', fontWeight: 800, fontSize: 17, fontFamily: 'Inter, sans-serif' }}>×{expectedRollWithProf.toFixed(3)}</div>
              </div>
              <div style={{ flex: 1, background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.18)', borderRadius: 8, padding: '10px 14px' }}>
                <div style={{ color: '#3e3e60', fontSize: 10, fontFamily: 'Inter, sans-serif', marginBottom: 4 }}>{t('guide_magprof_avg_gain')}</div>
                <div style={{ color: '#4ade80', fontWeight: 800, fontSize: 17, fontFamily: 'Inter, sans-serif' }}>+{((expectedRollWithProf - expectedRollNoProf) * 100).toFixed(1)}%</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { titleKey: 'guide_magprof_scales_title', descKey: 'guide_magprof_scales_desc', color: '#60a5fa', rgb: '96,165,250' },
            { titleKey: 'guide_magprof_nocap_title',  descKey: 'guide_magprof_nocap_desc',  color: '#a78bfa', rgb: '167,139,250' },
          ].map(({ titleKey, descKey, color, rgb }) => (
            <div key={titleKey} style={{ background: `rgba(${rgb},0.05)`, border: `1px solid rgba(${rgb},0.15)`, borderLeft: `3px solid ${color}`, borderRadius: 9, padding: '12px 14px' }}>
              <div style={{ color, fontWeight: 700, fontSize: 12.5, marginBottom: 5, fontFamily: 'Inter, sans-serif' }}>{t(titleKey as Parameters<typeof t>[0])}</div>
              <div style={{ color: '#4a4a72', fontSize: 12, lineHeight: 1.65, fontFamily: 'Inter, sans-serif' }}>{t(descKey as Parameters<typeof t>[0])}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 5 — CRITICAL CHANCE & DAMAGE
      ══════════════════════════════════════════════════════════════════════ */}
      <SectionCard icon={<Zap size={16} />} title={t('guide_s_crit')} color="#fb923c">
        <p style={{ color: '#5a5a84', fontSize: 13, lineHeight: 1.8, margin: '0 0 20px', fontFamily: 'Inter, sans-serif' }}>
          {t('guide_crit_body')}
        </p>

        <div style={{ marginBottom: 22 }}>
          <SubLabel>{t('guide_crit_formula_label')}</SubLabel>
          <FormulaBox color="249,115,22">
            <div><Dim>if random() {'<'} </Dim><Kw c="#fb923c">crit_chance</Kw><Dim>:</Dim></div>
            <div><Dim>{'    '}</Dim><Kw c="#fb923c">crit_pa_bonus</Kw><Dim> = </Dim><Kw c="#f97316">pa_contrib</Kw><Dim> × </Dim><Kw c="#fb923c">crit_damage</Kw></div>
            <div><Kw c="#fbbf24">final</Kw><Dim> = raw_total + </Dim><Kw c="#fb923c">crit_pa_bonus</Kw><Dim> + attack_flat</Dim></div>
          </FormulaBox>
          <InsightBox color="#fb923c" rgb="251,146,60">
            {t('guide_crit_insight')}
          </InsightBox>
        </div>

        <div style={{ marginBottom: 22 }}>
          <SubLabel>{t('guide_live_preview')}</SubLabel>
          <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '18px 20px' }}>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 16 }}>
              <div style={{ flex: 1, minWidth: 160 }}>
                <label style={{ color: '#5a5a84', fontSize: 11.5, fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  {t('guide_crit_slider_chance')} <span style={{ color: '#fb923c', fontWeight: 800, fontSize: 15 }}>{previewCritChance}%</span>
                </label>
                <input type="range" min={0} max={100} value={previewCritChance} onChange={(e) => setPreviewCritChance(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#fb923c', cursor: 'pointer' }} />
              </div>
              <div style={{ flex: 1, minWidth: 160 }}>
                <label style={{ color: '#5a5a84', fontSize: 11.5, fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  {t('guide_crit_slider_dmg')} <span style={{ color: '#fbbf24', fontWeight: 800, fontSize: 15 }}>{previewCritDmg}%</span>
                </label>
                <input type="range" min={0} max={200} value={previewCritDmg} onChange={(e) => setPreviewCritDmg(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#fbbf24', cursor: 'pointer' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '10px 14px' }}>
                <div style={{ color: '#3e3e60', fontSize: 10, fontFamily: 'Inter, sans-serif', marginBottom: 4 }}>{t('guide_crit_oncrit_mult')}</div>
                <div style={{ color: '#fbbf24', fontWeight: 800, fontSize: 17, fontFamily: 'Inter, sans-serif' }}>×{(1 + previewCritDmg / 100).toFixed(2)}</div>
              </div>
              <div style={{ flex: 1, background: 'rgba(251,146,60,0.07)', border: '1px solid rgba(251,146,60,0.2)', borderRadius: 8, padding: '10px 14px' }}>
                <div style={{ color: '#3e3e60', fontSize: 10, fontFamily: 'Inter, sans-serif', marginBottom: 4 }}>{t('guide_crit_expected_bonus')}</div>
                <div style={{ color: '#fb923c', fontWeight: 800, fontSize: 17, fontFamily: 'Inter, sans-serif' }}>+{(critExpectedBonus * 100).toFixed(1)}% of PA</div>
              </div>
              <div style={{ flex: 1, background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.18)', borderRadius: 8, padding: '10px 14px' }}>
                <div style={{ color: '#3e3e60', fontSize: 10, fontFamily: 'Inter, sans-serif', marginBottom: 4 }}>{t('guide_crit_freq')}</div>
                <div style={{ color: previewCritChance >= 50 ? '#4ade80' : previewCritChance >= 25 ? '#fbbf24' : '#f97316', fontWeight: 800, fontSize: 17, fontFamily: 'Inter, sans-serif' }}>
                  {previewCritChance >= 50 ? t('guide_crit_often') : previewCritChance >= 25 ? t('guide_crit_moderate') : previewCritChance >= 10 ? t('guide_crit_rare') : t('guide_crit_very_rare')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 6 — DEX PROFICIENCY & POSTURE
      ══════════════════════════════════════════════════════════════════════ */}
      <SectionCard icon={<Wind size={16} />} title={t('guide_s_dex_cycle')} color="#4ade80">
        <p style={{ color: '#5a5a84', fontSize: 13, lineHeight: 1.8, margin: '0 0 20px', fontFamily: 'Inter, sans-serif' }}>
          {t('guide_dex_body')}
        </p>

        <div style={{ marginBottom: 22 }}>
          <SubLabel>{t('guide_dex_formula_label')}</SubLabel>
          <FormulaBox color="74,222,128">
            <div><Kw c="#4ade80">dex_factor</Kw><Dim> = </Dim><Kw c="#fbbf24">0.33</Kw><Dim> + </Dim><Kw c="#4ade80">dex_proficiency</Kw></div>
            <div><Kw c="#f87171">dex_used</Kw><Dim>     = </Dim><Kw c="#4ade80">current_dex</Kw><Dim> × </Dim><Kw c="#4ade80">dex_factor</Kw></div>
            <div><Kw c="#34d399">dex_recovered</Kw><Dim> = </Dim><Kw c="#6ee7b7">dex_posture</Kw><Dim> × </Dim><Kw c="#f87171">dex_used</Kw></div>
            <div><Kw c="#4ade80">next_dex</Kw><Dim>     = </Dim><Kw c="#4ade80">current_dex</Kw><Dim> − </Dim><Kw c="#f87171">dex_used</Kw><Dim> + </Dim><Kw c="#34d399">dex_recovered</Kw></div>
          </FormulaBox>
        </div>

        <div style={{ marginBottom: 22 }}>
          <SubLabel>{t('guide_dex_live_label')}</SubLabel>
          <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '18px 20px' }}>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 16 }}>
              <div style={{ flex: 1, minWidth: 120 }}>
                <label style={{ color: '#5a5a84', fontSize: 11.5, fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  {t('guide_dex_slider_dex')} <span style={{ color: '#4ade80', fontWeight: 800, fontSize: 15 }}>{previewDex}</span>
                </label>
                <input type="range" min={1} max={300} value={previewDex} onChange={(e) => setPreviewDex(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#4ade80', cursor: 'pointer' }} />
              </div>
              <div style={{ flex: 1, minWidth: 120 }}>
                <label style={{ color: '#5a5a84', fontSize: 11.5, fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  {t('guide_dex_slider_prof')} <span style={{ color: '#4ade80', fontWeight: 800, fontSize: 15 }}>{previewDexProf}%</span>
                </label>
                <input type="range" min={0} max={100} value={previewDexProf} onChange={(e) => setPreviewDexProf(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#4ade80', cursor: 'pointer' }} />
              </div>
              <div style={{ flex: 1, minWidth: 120 }}>
                <label style={{ color: '#5a5a84', fontSize: 11.5, fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  {t('guide_dex_slider_posture')} <span style={{ color: '#34d399', fontWeight: 800, fontSize: 15 }}>{previewDexPosture}%</span>
                </label>
                <input type="range" min={0} max={100} value={previewDexPosture} onChange={(e) => setPreviewDexPosture(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#34d399', cursor: 'pointer' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {[
                { label: t('guide_dex_factor'),    val: `${(dexFactor * 100).toFixed(0)}%`, color: '#4ade80' },
                { label: t('guide_dex_used'),       val: dexUsed.toFixed(1),                color: '#f87171' },
                { label: t('guide_dex_recovered'),  val: dexRecovered.toFixed(1),           color: '#34d399' },
                { label: t('guide_dex_next'),       val: dexRemaining.toFixed(1),           color: '#4ade80' },
                { label: t('guide_dex_retention'),  val: `${((dexRemaining / previewDex) * 100).toFixed(1)}%`, color: dexRemaining / previewDex >= 0.7 ? '#4ade80' : dexRemaining / previewDex >= 0.4 ? '#fbbf24' : '#e94560' },
              ].map(({ label, val, color }) => (
                <div key={label} style={{ flex: 1, minWidth: 90, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '9px 12px' }}>
                  <div style={{ color: '#3e3e60', fontSize: 10, fontFamily: 'Inter, sans-serif', marginBottom: 4 }}>{label}</div>
                  <div style={{ color, fontWeight: 800, fontSize: 16, fontFamily: 'Inter, sans-serif' }}>{val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { titleKey: 'guide_dex_high_prof_title',    descKey: 'guide_dex_high_prof_desc',    color: '#f87171', rgb: '248,113,113' },
            { titleKey: 'guide_dex_high_posture_title', descKey: 'guide_dex_high_posture_desc', color: '#34d399', rgb: '52,211,153' },
            { titleKey: 'guide_dex_base33_title',       descKey: 'guide_dex_base33_desc',       color: '#4ade80', rgb: '74,222,128' },
            { titleKey: 'guide_dex_badge_title',        descKey: 'guide_dex_badge_desc',        color: '#a3e635', rgb: '163,230,53' },
          ].map(({ titleKey, descKey, color, rgb }) => (
            <div key={titleKey} style={{ background: `rgba(${rgb},0.05)`, border: `1px solid rgba(${rgb},0.15)`, borderLeft: `3px solid ${color}`, borderRadius: 9, padding: '12px 14px' }}>
              <div style={{ color, fontWeight: 700, fontSize: 12.5, marginBottom: 5, fontFamily: 'Inter, sans-serif' }}>{t(titleKey as Parameters<typeof t>[0])}</div>
              <div style={{ color: '#4a4a72', fontSize: 12, lineHeight: 1.65, fontFamily: 'Inter, sans-serif' }}>{t(descKey as Parameters<typeof t>[0])}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ══════════════════════════════════════════════════════════════════════
          DEX MAX POSTURE
      ══════════════════════════════════════════════════════════════════════ */}
      <SectionCard icon={<Activity size={16} />} title={t('guide_s_dex_max')} color="#6ee7b7">
        <p style={{ color: '#5a5a84', fontSize: 13, lineHeight: 1.8, margin: '0 0 20px', fontFamily: 'Inter, sans-serif' }}>
          {t('guide_dexmax_body')}
        </p>

        <div style={{ marginBottom: 20 }}>
          <SubLabel>{t('guide_dexmax_formula_label')}</SubLabel>
          <FormulaBox color="110,231,183">
            <div><Kw c="#6ee7b7">recovery</Kw><Dim> = </Dim><Kw c="#34d399">dex_used</Kw><Dim> × </Dim><Kw c="#6ee7b7">dex_posture</Kw><Dim> + </Dim><Kw c="#fbbf24">max_dex</Kw><Dim> × </Dim><Kw c="#6ee7b7">dex_max_posture</Kw></div>
            <div style={{ marginTop: 4 }}><Kw c="#4ade80">next_dex</Kw><Dim> = </Dim><Kw c="#fbbf24">current_dex</Kw><Dim> − </Dim><Kw c="#34d399">dex_used</Kw><Dim> + </Dim><Kw c="#6ee7b7">recovery</Kw></div>
          </FormulaBox>
        </div>

        <div style={{ marginBottom: 20 }}>
          <SubLabel>{t('guide_dexmax_example_label')}</SubLabel>
          <FormulaBox color="110,231,183">
            <div><Dim>Hero has </Dim><Kw c="#fbbf24">100 DEX</Kw><Dim>, spent </Dim><Kw c="#f87171">40</Kw><Dim>, Dex Posture </Dim><Kw c="#6ee7b7">20%</Kw><Dim>, Dex Max Posture </Dim><Kw c="#6ee7b7">10%</Kw></div>
            <div style={{ marginTop: 4 }}><Kw c="#6ee7b7">recovery</Kw><Dim> = 40 × 0.20 + 100 × 0.10 = </Dim><Kw c="#4ade80">8 + 10 = 18</Kw></div>
            <div style={{ marginTop: 4 }}><Kw c="#4ade80">next_dex</Kw><Dim> = 100 − 40 + 18 = </Dim><Kw c="#fbbf24">78</Kw></div>
          </FormulaBox>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { titleKey: 'guide_dexmax_vs_posture_title', descKey: 'guide_dexmax_vs_posture_desc', color: '#6ee7b7', rgb: '110,231,183' },
            { titleKey: 'guide_dexmax_rare_title',       descKey: 'guide_dexmax_rare_desc',       color: '#fbbf24', rgb: '251,191,36' },
            { titleKey: 'guide_dexmax_stacks_title',     descKey: 'guide_dexmax_stacks_desc',     color: '#34d399', rgb: '52,211,153' },
            { titleKey: 'guide_dexmax_best_title',       descKey: 'guide_dexmax_best_desc',       color: '#a5f3fc', rgb: '165,243,252' },
          ].map(({ titleKey, descKey, color, rgb }) => (
            <div key={titleKey} style={{ background: `rgba(${rgb},0.05)`, border: `1px solid rgba(${rgb},0.15)`, borderLeft: `3px solid ${color}`, borderRadius: 9, padding: '12px 14px' }}>
              <div style={{ color, fontWeight: 700, fontSize: 12.5, marginBottom: 5, fontFamily: 'Inter, sans-serif' }}>{t(titleKey as Parameters<typeof t>[0])}</div>
              <div style={{ color: '#4a4a72', fontSize: 12, lineHeight: 1.65, fontFamily: 'Inter, sans-serif' }}>{t(descKey as Parameters<typeof t>[0])}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 7 — SPELL MASTERY
      ══════════════════════════════════════════════════════════════════════ */}
      <SectionCard icon={<Sparkles size={16} />} title={t('guide_s_spell_mastery')} color="#c084fc">
        <p style={{ color: '#5a5a84', fontSize: 13, lineHeight: 1.8, margin: '0 0 20px', fontFamily: 'Inter, sans-serif' }}>
          {t('guide_spellm_body')}
        </p>

        <div style={{ marginBottom: 22 }}>
          <SubLabel>{t('guide_spellm_effects_label')}</SubLabel>
          <FormulaBox color="192,132,252">
            <div><Kw c="#c084fc">effective_cost</Kw><Dim> = </Dim><Kw c="#a78bfa">mana_cost</Kw><Dim> × (</Dim><Kw c="#4ade80">1</Kw><Dim> − </Dim><Kw c="#c084fc">spell_mastery</Kw><Dim>)</Dim></div>
            <div style={{ marginTop: 4, color: '#555575', fontSize: 12 }}>— for Tier 3 spells only —</div>
            <div><Kw c="#fbbf24">mastery_mult</Kw><Dim> = </Dim><Kw c="#4ade80">1.0</Kw><Dim> + </Dim><Kw c="#c084fc">spell_mastery</Kw></div>
            <div><Kw c="#fbbf24">stat_bonus</Kw><Dim> = </Dim><Kw c="#a78bfa">base_bonus</Kw><Dim> × </Dim><Kw c="#fbbf24">mastery_mult</Kw></div>
          </FormulaBox>
        </div>

        <div style={{ marginBottom: 22 }}>
          <SubLabel>{t('guide_live_preview')}</SubLabel>
          <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '18px 20px' }}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ color: '#5a5a84', fontSize: 11.5, fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                {t('guide_spellm_slider_label')} <span style={{ color: '#c084fc', fontWeight: 800, fontSize: 15 }}>{previewSpellMastery}%</span>
              </label>
              <input type="range" min={0} max={100} value={previewSpellMastery} onChange={(e) => setPreviewSpellMastery(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#c084fc', cursor: 'pointer' }} />
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {[50, 80, 120, 200].map((baseCost) => (
                <div key={baseCost} style={{ flex: 1, minWidth: 90, background: 'rgba(192,132,252,0.07)', border: '1px solid rgba(192,132,252,0.18)', borderRadius: 8, padding: '9px 12px' }}>
                  <div style={{ color: '#3e3e60', fontSize: 10, fontFamily: 'Inter, sans-serif', marginBottom: 4 }}>{baseCost} MP spell</div>
                  <div style={{ color: '#a0a0c0', fontSize: 11, textDecoration: 'line-through', fontFamily: 'Inter, sans-serif' }}>{baseCost} MP</div>
                  <div style={{ color: '#c084fc', fontWeight: 800, fontSize: 16, fontFamily: 'Inter, sans-serif' }}>{Math.max(0, baseCost * (1 - spellMasteryDec)).toFixed(1)} MP</div>
                  <div style={{ color: '#4ade80', fontSize: 10, fontFamily: 'Inter, sans-serif', marginTop: 2 }}>−{(baseCost * spellMasteryDec).toFixed(1)} saved</div>
                </div>
              ))}
            </div>
            {previewSpellMastery > 0 && (
              <div style={{ marginTop: 12, background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)', borderRadius: 8, padding: '10px 14px' }}>
                <div style={{ color: '#6a6a40', fontSize: 10, fontFamily: 'Inter, sans-serif', marginBottom: 4, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{t('guide_spellm_t3_amp_label')}</div>
                <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: 14, fontFamily: 'Inter, sans-serif' }}>×{(1 + spellMasteryDec).toFixed(2)}{t('guide_spellm_t3_mult_suffix')}</div>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { titleKey: 'guide_spellm_mana_eff_title', descKey: 'guide_spellm_mana_eff_desc', color: '#c084fc', rgb: '192,132,252' },
            { titleKey: 'guide_spellm_t3_title',       descKey: 'guide_spellm_t3_desc',       color: '#fbbf24', rgb: '251,191,36' },
          ].map(({ titleKey, descKey, color, rgb }) => (
            <div key={titleKey} style={{ background: `rgba(${rgb},0.05)`, border: `1px solid rgba(${rgb},0.15)`, borderLeft: `3px solid ${color}`, borderRadius: 9, padding: '12px 14px' }}>
              <div style={{ color, fontWeight: 700, fontSize: 12.5, marginBottom: 5, fontFamily: 'Inter, sans-serif' }}>{t(titleKey as Parameters<typeof t>[0])}</div>
              <div style={{ color: '#4a4a72', fontSize: 12, lineHeight: 1.65, fontFamily: 'Inter, sans-serif' }}>{t(descKey as Parameters<typeof t>[0])}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 8 — SPELL ACTIVATION
      ══════════════════════════════════════════════════════════════════════ */}
      <SectionCard icon={<Flame size={16} />} title={t('guide_s_spell_act')} color="#e879f9">
        <p style={{ color: '#5a5a84', fontSize: 13, lineHeight: 1.8, margin: '0 0 20px', fontFamily: 'Inter, sans-serif' }}>
          {t('guide_spellact_body')}
        </p>

        <div style={{ marginBottom: 22 }}>
          <SubLabel>{t('guide_spellact_formula_label')}</SubLabel>
          <FormulaBox color="232,121,249">
            <div><Kw c="#e879f9">effective_chance</Kw><Dim> = min(</Dim><Kw c="#4ade80">1.0</Kw><Dim>, </Dim><Kw c="#a0a0c0">base_chance</Kw><Dim> + </Dim><Kw c="#e879f9">spell_activation</Kw><Dim>)</Dim></div>
            <div><Dim>if random() {'<'} </Dim><Kw c="#e879f9">effective_chance</Kw><Dim>: spell fires</Dim></div>
          </FormulaBox>
        </div>

        <div style={{ marginBottom: 22 }}>
          <SubLabel>{t('guide_live_preview')}</SubLabel>
          <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '18px 20px' }}>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 16 }}>
              <div style={{ flex: 1, minWidth: 160 }}>
                <label style={{ color: '#5a5a84', fontSize: 11.5, fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  {t('guide_spellact_slider_base')} <span style={{ color: '#a0a0c0', fontWeight: 800, fontSize: 15 }}>{previewBaseChance}%</span>
                </label>
                <input type="range" min={0} max={100} value={previewBaseChance} onChange={(e) => setPreviewBaseChance(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#a0a0c0', cursor: 'pointer' }} />
              </div>
              <div style={{ flex: 1, minWidth: 160 }}>
                <label style={{ color: '#5a5a84', fontSize: 11.5, fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  {t('guide_spellact_slider_act')} <span style={{ color: '#e879f9', fontWeight: 800, fontSize: 15 }}>{previewSpellAct}%</span>
                </label>
                <input type="range" min={0} max={100} value={previewSpellAct} onChange={(e) => setPreviewSpellAct(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#e879f9', cursor: 'pointer' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '10px 14px' }}>
                <div style={{ color: '#3e3e60', fontSize: 10, fontFamily: 'Inter, sans-serif', marginBottom: 4 }}>{t('guide_spellact_base_chance')}</div>
                <div style={{ color: '#a0a0c0', fontWeight: 800, fontSize: 17, fontFamily: 'Inter, sans-serif' }}>{previewBaseChance}%</div>
              </div>
              <div style={{ color: '#444466', fontSize: 18, fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>+</div>
              <div style={{ flex: 1, background: 'rgba(232,121,249,0.07)', border: '1px solid rgba(232,121,249,0.2)', borderRadius: 8, padding: '10px 14px' }}>
                <div style={{ color: '#3e3e60', fontSize: 10, fontFamily: 'Inter, sans-serif', marginBottom: 4 }}>{t('guide_spellact_activation_bonus')}</div>
                <div style={{ color: '#e879f9', fontWeight: 800, fontSize: 17, fontFamily: 'Inter, sans-serif' }}>+{previewSpellAct}%</div>
              </div>
              <div style={{ color: '#444466', fontSize: 18, fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>=</div>
              <div style={{ flex: 1, background: effectiveChance >= 100 ? 'rgba(74,222,128,0.08)' : 'rgba(232,121,249,0.06)', border: `1px solid ${effectiveChance >= 100 ? 'rgba(74,222,128,0.25)' : 'rgba(232,121,249,0.18)'}`, borderRadius: 8, padding: '10px 14px' }}>
                <div style={{ color: '#3e3e60', fontSize: 10, fontFamily: 'Inter, sans-serif', marginBottom: 4 }}>{t('guide_spellact_effective')}</div>
                <div style={{ color: effectiveChance >= 100 ? '#4ade80' : '#e879f9', fontWeight: 800, fontSize: 17, fontFamily: 'Inter, sans-serif' }}>
                  {effectiveChance}%{effectiveChance >= 100 ? t('guide_spellact_guaranteed') : ''}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { titleKey: 'guide_spellact_all_tiers_title', descKey: 'guide_spellact_all_tiers_desc', color: '#e879f9', rgb: '232,121,249' },
            { titleKey: 'guide_spellact_capped_title',    descKey: 'guide_spellact_capped_desc',    color: '#f87171', rgb: '248,113,113' },
            { titleKey: 'guide_spellact_seal_title',      descKey: 'guide_spellact_seal_desc',      color: '#fbbf24', rgb: '251,191,36' },
            { titleKey: 'guide_spellact_synergy_title',   descKey: 'guide_spellact_synergy_desc',   color: '#a78bfa', rgb: '167,139,250' },
          ].map(({ titleKey, descKey, color, rgb }) => (
            <div key={titleKey} style={{ background: `rgba(${rgb},0.05)`, border: `1px solid rgba(${rgb},0.15)`, borderLeft: `3px solid ${color}`, borderRadius: 9, padding: '12px 14px' }}>
              <div style={{ color, fontWeight: 700, fontSize: 12.5, marginBottom: 5, fontFamily: 'Inter, sans-serif' }}>{t(titleKey as Parameters<typeof t>[0])}</div>
              <div style={{ color: '#4a4a72', fontSize: 12, lineHeight: 1.65, fontFamily: 'Inter, sans-serif' }}>{t(descKey as Parameters<typeof t>[0])}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 9 — XP & LEVELING
      ══════════════════════════════════════════════════════════════════════ */}
      <SectionCard icon={<Star size={16} />} title={t('guide_s_xp')} color="#fbbf24">
        <p style={{ color: '#5a5a84', fontSize: 13, lineHeight: 1.8, margin: '0 0 20px', fontFamily: 'Inter, sans-serif' }}>
          {t('guide_xp_body')}
        </p>

        <div style={{ marginBottom: 22 }}>
          <SubLabel>{t('guide_xp_formula_label')}</SubLabel>
          <FormulaBox color="251,191,36">
            <div><Kw c="#fbbf24">base_xp</Kw><Dim>    = 4 + 2 × </Dim><Kw c="#60a5fa">opponent_level</Kw></div>
            <div><Kw c="#4ade80">total_xp</Kw><Dim>   = </Dim><Kw c="#fbbf24">base_xp</Kw><Dim> × (1 + </Dim><Kw c="#a78bfa">exp_bonus</Kw><Dim>)</Dim></div>
          </FormulaBox>
        </div>

        <div style={{ marginBottom: 22 }}>
          <SubLabel>{t('guide_xp_accumulates_label')}</SubLabel>
          <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '16px 20px', color: '#5a5a84', fontSize: 13, lineHeight: 1.9, fontFamily: 'Inter, sans-serif' }}>
            {t('guide_xp_accumulates_body')}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { titleKey: 'guide_xp_exp_bonus_title', descKey: 'guide_xp_exp_bonus_desc', color: '#fbbf24', rgb: '251,191,36' },
            { titleKey: 'guide_xp_opp_lvl_title',   descKey: 'guide_xp_opp_lvl_desc',   color: '#fb923c', rgb: '251,146,60' },
            { titleKey: 'guide_xp_summons_title',    descKey: 'guide_xp_summons_desc',    color: '#a78bfa', rgb: '167,139,250' },
            { titleKey: 'guide_xp_levelup_title',    descKey: 'guide_xp_levelup_desc',    color: '#4ade80', rgb: '74,222,128' },
          ].map(({ titleKey, descKey, color, rgb }) => (
            <div key={titleKey} style={{ background: `rgba(${rgb},0.05)`, border: `1px solid rgba(${rgb},0.15)`, borderLeft: `3px solid ${color}`, borderRadius: 9, padding: '12px 14px' }}>
              <div style={{ color, fontWeight: 700, fontSize: 12.5, marginBottom: 5, fontFamily: 'Inter, sans-serif' }}>{t(titleKey as Parameters<typeof t>[0])}</div>
              <div style={{ color: '#4a4a72', fontSize: 12, lineHeight: 1.65, fontFamily: 'Inter, sans-serif' }}>{t(descKey as Parameters<typeof t>[0])}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard icon={<Coins size={16} />} title={t('guide_s_gold')} color="#fbbf24">
        <p style={{ color: '#5a5a84', fontSize: 13, lineHeight: 1.8, margin: '0 0 20px', fontFamily: 'Inter, sans-serif' }}>
          {t('guide_gold_body')}
        </p>

        <div style={{ marginBottom: 22 }}>
          <SubLabel>{t('guide_gold_formula_label')}</SubLabel>
          <FormulaBox color="251,191,36">
            <div><Kw c="#a3a3c2">base_gold</Kw><Dim>  = 2 (win) or 1 (loss)</Dim></div>
            <div><Kw c="#fbbf24">total_gold</Kw><Dim> = </Dim><Kw c="#a3a3c2">base_gold</Kw><Dim> × (1 + </Dim><Kw c="#fbbf24">gold_bonus</Kw><Dim>)</Dim></div>
            <div style={{ marginTop: 6 }}><Kw c="#4ade80">item_disc</Kw><Dim>  → chance of +1 bonus gold on top</Dim></div>
          </FormulaBox>
        </div>

        <div style={{ marginBottom: 22 }}>
          <SubLabel>{t('guide_gold_sources_label')}</SubLabel>
          <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '16px 20px', color: '#5a5a84', fontSize: 13, lineHeight: 1.9, fontFamily: 'Inter, sans-serif' }}>
            {t('guide_gold_sources_body')}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { titleKey: 'guide_gold_win_loss_title',  descKey: 'guide_gold_win_loss_desc',  color: '#fbbf24', rgb: '251,191,36' },
            { titleKey: 'guide_gold_stacks_title',    descKey: 'guide_gold_stacks_desc',    color: '#4ade80', rgb: '74,222,128' },
            { titleKey: 'guide_gold_breakdown_title', descKey: 'guide_gold_breakdown_desc', color: '#a78bfa', rgb: '167,139,250' },
          ].map(({ titleKey, descKey, color, rgb }) => (
            <div key={titleKey} style={{ background: `rgba(${rgb},0.05)`, border: `1px solid rgba(${rgb},0.15)`, borderLeft: `3px solid ${color}`, borderRadius: 9, padding: '12px 14px' }}>
              <div style={{ color, fontWeight: 700, fontSize: 12.5, marginBottom: 5, fontFamily: 'Inter, sans-serif' }}>{t(titleKey as Parameters<typeof t>[0])}</div>
              <div style={{ color: '#4a4a72', fontSize: 12, lineHeight: 1.65, fontFamily: 'Inter, sans-serif' }}>{t(descKey as Parameters<typeof t>[0])}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ══════════════════════════════════════════════════════════════════════
          IMMUNITIES
      ══════════════════════════════════════════════════════════════════════ */}
      <SectionCard icon={<Shield size={16} />} title={t('guide_s_immunities')} color="#34d399">
        <p style={{ color: '#5a5a84', fontSize: 13, lineHeight: 1.8, margin: '0 0 20px', fontFamily: 'Inter, sans-serif' }}>
          {t('guide_imm_body')}
        </p>

        <div style={{ marginBottom: 22 }}>
          <SubLabel>{t('guide_imm_three_types')}</SubLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            {[
              { titleKey: 'guide_imm_phys_title', descKey: 'guide_imm_phys_desc', color: '#f87171', rgb: '248,113,113' },
              { titleKey: 'guide_imm_magic_title', descKey: 'guide_imm_magic_desc', color: '#60a5fa', rgb: '96,165,250' },
              { titleKey: 'guide_imm_dex_title', descKey: 'guide_imm_dex_desc', color: '#4ade80', rgb: '74,222,128' },
            ].map(({ titleKey, descKey, color, rgb }) => (
              <div key={titleKey} style={{ background: `rgba(${rgb},0.05)`, border: `1px solid rgba(${rgb},0.15)`, borderLeft: `3px solid ${color}`, borderRadius: 9, padding: '12px 14px' }}>
                <div style={{ color, fontWeight: 700, fontSize: 12.5, marginBottom: 5, fontFamily: 'Inter, sans-serif' }}>{t(titleKey as Parameters<typeof t>[0])}</div>
                <div style={{ color: '#4a4a72', fontSize: 12, lineHeight: 1.65, fontFamily: 'Inter, sans-serif' }}>{t(descKey as Parameters<typeof t>[0])}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 22 }}>
          <SubLabel>{t('guide_imm_how_works')}</SubLabel>
          <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '16px 20px', color: '#5a5a84', fontSize: 13, lineHeight: 1.9, fontFamily: 'Inter, sans-serif' }}>
            {t('guide_imm_how_works_body')}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { titleKey: 'guide_imm_stacks_up_title', descKey: 'guide_imm_stacks_up_desc', color: '#34d399', rgb: '52,211,153' },
            { titleKey: 'guide_imm_stacks_add_title', descKey: 'guide_imm_stacks_add_desc', color: '#60a5fa', rgb: '96,165,250' },
            { titleKey: 'guide_imm_multi_title',      descKey: 'guide_imm_multi_desc',      color: '#a78bfa', rgb: '167,139,250' },
            { titleKey: 'guide_imm_denied_title',     descKey: 'guide_imm_denied_desc',     color: '#fbbf24', rgb: '251,191,36' },
          ].map(({ titleKey, descKey, color, rgb }) => (
            <div key={titleKey} style={{ background: `rgba(${rgb},0.05)`, border: `1px solid rgba(${rgb},0.15)`, borderLeft: `3px solid ${color}`, borderRadius: 9, padding: '12px 14px' }}>
              <div style={{ color, fontWeight: 700, fontSize: 12.5, marginBottom: 5, fontFamily: 'Inter, sans-serif' }}>{t(titleKey as Parameters<typeof t>[0])}</div>
              <div style={{ color: '#4a4a72', fontSize: 12, lineHeight: 1.65, fontFamily: 'Inter, sans-serif' }}>{t(descKey as Parameters<typeof t>[0])}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ══════════════════════════════════════════════════════════════════════
          MANA RECHARGE
      ══════════════════════════════════════════════════════════════════════ */}
      <SectionCard icon={<Droplets size={16} />} title={t('guide_s_mana_recharge')} color="#38bdf8">
        <p style={{ color: '#5a5a84', fontSize: 13, lineHeight: 1.8, margin: '0 0 20px', fontFamily: 'Inter, sans-serif' }}>
          {t('guide_mana_rch_body')}
        </p>

        <div style={{ marginBottom: 22 }}>
          <SubLabel>{t('guide_mana_rch_formula_label')}</SubLabel>
          <div style={{ background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.18)', borderRadius: 10, padding: '16px 20px', color: '#5a5a84', fontSize: 13, lineHeight: 1.9, fontFamily: 'Inter, sans-serif', whiteSpace: 'pre-line' }}>
            {t('guide_mana_rch_formula_body')}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { titleKey: 'guide_mana_rch_dim_title',    descKey: 'guide_mana_rch_dim_desc',    color: '#38bdf8', rgb: '56,189,248' },
            { titleKey: 'guide_mana_rch_every_title',  descKey: 'guide_mana_rch_every_desc',  color: '#60a5fa', rgb: '96,165,250' },
            { titleKey: 'guide_mana_rch_synergy_title', descKey: 'guide_mana_rch_synergy_desc', color: '#c084fc', rgb: '192,132,252' },
            { titleKey: 'guide_mana_rch_multi_title',  descKey: 'guide_mana_rch_multi_desc',  color: '#a78bfa', rgb: '167,139,250' },
          ].map(({ titleKey, descKey, color, rgb }) => (
            <div key={titleKey} style={{ background: `rgba(${rgb},0.05)`, border: `1px solid rgba(${rgb},0.15)`, borderLeft: `3px solid ${color}`, borderRadius: 9, padding: '12px 14px' }}>
              <div style={{ color, fontWeight: 700, fontSize: 12.5, marginBottom: 5, fontFamily: 'Inter, sans-serif' }}>{t(titleKey as Parameters<typeof t>[0])}</div>
              <div style={{ color: '#4a4a72', fontSize: 12, lineHeight: 1.65, fontFamily: 'Inter, sans-serif' }}>{t(descKey as Parameters<typeof t>[0])}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ══════════════════════════════════════════════════════════════════════
          SPELL LEARN
      ══════════════════════════════════════════════════════════════════════ */}
      <SectionCard icon={<BookOpen size={16} />} title={t('guide_s_spell_learn')} color="#a78bfa">
        <p style={{ color: '#5a5a84', fontSize: 13, lineHeight: 1.8, margin: '0 0 20px', fontFamily: 'Inter, sans-serif' }}>
          {t('guide_spelllearn_body')}
        </p>

        <div style={{ marginBottom: 22 }}>
          <SubLabel>{t('guide_spelllearn_how_works')}</SubLabel>
          <div style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.18)', borderRadius: 10, padding: '16px 20px', color: '#5a5a84', fontSize: 13, lineHeight: 1.9, fontFamily: 'Inter, sans-serif' }}>
            {t('guide_spelllearn_how_works_body')}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { titleKey: 'guide_spelllearn_ability_title', descKey: 'guide_spelllearn_ability_desc', color: '#a78bfa', rgb: '167,139,250' },
            { titleKey: 'guide_spelllearn_log_title',     descKey: 'guide_spelllearn_log_desc',     color: '#c084fc', rgb: '192,132,252' },
            { titleKey: 'guide_spelllearn_mana_title',    descKey: 'guide_spelllearn_mana_desc',    color: '#38bdf8', rgb: '56,189,248' },
            { titleKey: 'guide_spelllearn_multi_title',   descKey: 'guide_spelllearn_multi_desc',   color: '#fbbf24', rgb: '251,191,36' },
          ].map(({ titleKey, descKey, color, rgb }) => (
            <div key={titleKey} style={{ background: `rgba(${rgb},0.05)`, border: `1px solid rgba(${rgb},0.15)`, borderLeft: `3px solid ${color}`, borderRadius: 9, padding: '12px 14px' }}>
              <div style={{ color, fontWeight: 700, fontSize: 12.5, marginBottom: 5, fontFamily: 'Inter, sans-serif' }}>{t(titleKey as Parameters<typeof t>[0])}</div>
              <div style={{ color: '#4a4a72', fontSize: 12, lineHeight: 1.65, fontFamily: 'Inter, sans-serif' }}>{t(descKey as Parameters<typeof t>[0])}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ══════════════════════════════════════════════════════════════════════
          SPELL COPY
      ══════════════════════════════════════════════════════════════════════ */}
      <SectionCard icon={<Shuffle size={16} />} title={t('guide_s_spell_copy')} color="#f87171">
        <p style={{ color: '#5a5a84', fontSize: 13, lineHeight: 1.8, margin: '0 0 20px', fontFamily: 'Inter, sans-serif' }}>
          {t('guide_spellcopy_body')}
        </p>

        <div style={{ marginBottom: 22 }}>
          <SubLabel>{t('guide_spellcopy_how_works')}</SubLabel>
          <div style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.18)', borderRadius: 10, padding: '16px 20px', color: '#5a5a84', fontSize: 13, lineHeight: 1.9, fontFamily: 'Inter, sans-serif' }}>
            {t('guide_spellcopy_how_works_body')}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { titleKey: 'guide_spellcopy_free_title',    descKey: 'guide_spellcopy_free_desc',    color: '#4ade80', rgb: '74,222,128' },
            { titleKey: 'guide_spellcopy_log_title',     descKey: 'guide_spellcopy_log_desc',     color: '#f87171', rgb: '248,113,113' },
            { titleKey: 'guide_spellcopy_ability_title', descKey: 'guide_spellcopy_ability_desc', color: '#a78bfa', rgb: '167,139,250' },
            { titleKey: 'guide_spellcopy_multi_title',   descKey: 'guide_spellcopy_multi_desc',   color: '#fbbf24', rgb: '251,191,36' },
          ].map(({ titleKey, descKey, color, rgb }) => (
            <div key={titleKey} style={{ background: `rgba(${rgb},0.05)`, border: `1px solid rgba(${rgb},0.15)`, borderLeft: `3px solid ${color}`, borderRadius: 9, padding: '12px 14px' }}>
              <div style={{ color, fontWeight: 700, fontSize: 12.5, marginBottom: 5, fontFamily: 'Inter, sans-serif' }}>{t(titleKey as Parameters<typeof t>[0])}</div>
              <div style={{ color: '#4a4a72', fontSize: 12, lineHeight: 1.65, fontFamily: 'Inter, sans-serif' }}>{t(descKey as Parameters<typeof t>[0])}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ══════════════════════════════════════════════════════════════════════
          SPELL ABSORB
      ══════════════════════════════════════════════════════════════════════ */}
      <SectionCard icon={<Shield size={16} />} title={t('guide_s_spell_absorb')} color="#34d399">
        <p style={{ color: '#5a5a84', fontSize: 13, lineHeight: 1.8, margin: '0 0 20px', fontFamily: 'Inter, sans-serif' }}>
          {t('guide_spellabs_body')}
        </p>

        <div style={{ marginBottom: 22 }}>
          <SubLabel>{t('guide_spellabs_how_works')}</SubLabel>
          <div style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.18)', borderRadius: 10, padding: '16px 20px', color: '#5a5a84', fontSize: 13, lineHeight: 1.9, fontFamily: 'Inter, sans-serif' }}>
            {t('guide_spellabs_how_works_body')}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { titleKey: 'guide_spellabs_all_title',   descKey: 'guide_spellabs_all_desc',   color: '#34d399', rgb: '52,211,153' },
            { titleKey: 'guide_spellabs_log_title',   descKey: 'guide_spellabs_log_desc',   color: '#6b7280', rgb: '107,114,128' },
            { titleKey: 'guide_spellabs_swing_title', descKey: 'guide_spellabs_swing_desc', color: '#38bdf8', rgb: '56,189,248' },
            { titleKey: 'guide_spellabs_multi_title', descKey: 'guide_spellabs_multi_desc', color: '#fbbf24', rgb: '251,191,36' },
          ].map(({ titleKey, descKey, color, rgb }) => (
            <div key={titleKey} style={{ background: `rgba(${rgb},0.05)`, border: `1px solid rgba(${rgb},0.15)`, borderLeft: `3px solid ${color}`, borderRadius: 9, padding: '12px 14px' }}>
              <div style={{ color, fontWeight: 700, fontSize: 12.5, marginBottom: 5, fontFamily: 'Inter, sans-serif' }}>{t(titleKey as Parameters<typeof t>[0])}</div>
              <div style={{ color: '#4a4a72', fontSize: 12, lineHeight: 1.65, fontFamily: 'Inter, sans-serif' }}>{t(descKey as Parameters<typeof t>[0])}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard icon={<Biohazard size={16} />} title={t('guide_s_rot')} color="#dc2626">
        <p style={{ color: '#4a4a72', fontSize: 13, lineHeight: 1.75, marginBottom: 14, fontFamily: 'Inter, sans-serif' }}>
          {t('guide_rot_body')}
        </p>

        <div style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
          <div style={{ color: '#dc2626', fontWeight: 800, fontSize: 12, marginBottom: 10, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'Inter, sans-serif' }}>{t('guide_rot_how_works')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { labelKey: 'guide_rot_trigger_label', valueKey: 'guide_rot_trigger_val' },
              { labelKey: 'guide_rot_duration_label', valueKey: 'guide_rot_duration_val' },
              { labelKey: 'guide_rot_imm_red_label',  valueKey: 'guide_rot_imm_red_val' },
              { labelKey: 'guide_rot_decay_label',    valueKey: 'guide_rot_decay_val' },
              { labelKey: 'guide_rot_max_red_label',  valueKey: 'guide_rot_max_red_val' },
            ].map(({ labelKey, valueKey }) => (
              <div key={labelKey} style={{ display: 'flex', gap: 10, fontSize: 12.5, fontFamily: 'Inter, sans-serif' }}>
                <span style={{ color: '#dc2626', fontWeight: 700, minWidth: 130, flexShrink: 0 }}>{t(labelKey as Parameters<typeof t>[0])}</span>
                <span style={{ color: '#4a4a72', lineHeight: 1.6 }}>{t(valueKey as Parameters<typeof t>[0])}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
          <div style={{ color: '#dc2626', fontWeight: 800, fontSize: 12, marginBottom: 10, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'Inter, sans-serif' }}>{t('guide_rot_special')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { labelKey: 'guide_rot_crit_label',    valueKey: 'guide_rot_crit_val' },
              { labelKey: 'guide_rot_stack_label',   valueKey: 'guide_rot_stack_val' },
              { labelKey: 'guide_rot_imm_req_label', valueKey: 'guide_rot_imm_req_val' },
              { labelKey: 'guide_rot_log_label',     valueKey: 'guide_rot_log_val' },
            ].map(({ labelKey, valueKey }) => (
              <div key={labelKey} style={{ display: 'flex', gap: 10, fontSize: 12.5, fontFamily: 'Inter, sans-serif' }}>
                <span style={{ color: '#dc2626', fontWeight: 700, minWidth: 130, flexShrink: 0 }}>{t(labelKey as Parameters<typeof t>[0])}</span>
                <span style={{ color: '#4a4a72', lineHeight: 1.6 }}>{t(valueKey as Parameters<typeof t>[0])}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
          {[
            { titleKey: 'guide_rot_multi_title',   descKey: 'guide_rot_multi_desc',   color: '#dc2626', rgb: '220,38,38' },
            { titleKey: 'guide_rot_dex_title',     descKey: 'guide_rot_dex_desc',     color: '#ef4444', rgb: '239,68,68' },
            { titleKey: 'guide_rot_counter_title', descKey: 'guide_rot_counter_desc', color: '#f87171', rgb: '248,113,113' },
          ].map(({ titleKey, descKey, color, rgb }) => (
            <div key={titleKey} style={{ background: `rgba(${rgb},0.05)`, border: `1px solid rgba(${rgb},0.15)`, borderLeft: `3px solid ${color}`, borderRadius: 9, padding: '12px 14px' }}>
              <div style={{ color, fontWeight: 700, fontSize: 12.5, marginBottom: 5, fontFamily: 'Inter, sans-serif' }}>{t(titleKey as Parameters<typeof t>[0])}</div>
              <div style={{ color: '#4a4a72', fontSize: 12, lineHeight: 1.65, fontFamily: 'Inter, sans-serif' }}>{t(descKey as Parameters<typeof t>[0])}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ── § 15  Spell Conditions ── */}
      <SectionCard icon={<GitBranch size={17} />} title={t('guide_spellcond_title')} color="#a78bfa">
        <p style={{ color: '#4a4a72', fontSize: 13, lineHeight: 1.75, marginBottom: 20, fontFamily: 'Inter, sans-serif' }}>
          {t('guide_spellcond_body')}
        </p>

        {/* Pre-clash */}
        <div style={{ color: '#a78bfa', fontWeight: 800, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6, fontFamily: 'Inter, sans-serif' }}>
          {t('guide_spellcond_pre_header')}
        </div>
        <div style={{ color: '#4a4a72', fontSize: 11.5, marginBottom: 14, fontStyle: 'italic' }}>{t('guide_spellcond_pre_sub')}</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {([
            { nameKey: 'guide_spellcond_entrance_name',      whenKey: 'guide_spellcond_entrance_when',      descKey: 'guide_spellcond_entrance_desc',      color: '#60a5fa', rgb: '96,165,250' },
            { nameKey: 'guide_spellcond_opp_entrance_name',  whenKey: 'guide_spellcond_opp_entrance_when',  descKey: 'guide_spellcond_opp_entrance_desc',  color: '#38bdf8', rgb: '56,189,248' },
            { nameKey: 'guide_spellcond_attack_name',        whenKey: 'guide_spellcond_attack_when',        descKey: 'guide_spellcond_attack_desc',        color: '#f97316', rgb: '249,115,22' },
            { nameKey: 'guide_spellcond_attack_rotted_name', whenKey: 'guide_spellcond_attack_rotted_when', descKey: 'guide_spellcond_attack_rotted_desc', color: '#dc2626', rgb: '220,38,38' },
            { nameKey: 'guide_spellcond_before_turn_name',   whenKey: 'guide_spellcond_before_turn_when',   descKey: 'guide_spellcond_before_turn_desc',   color: '#fbbf24', rgb: '251,191,36' },
            { nameKey: 'guide_spellcond_after_turn_name',    whenKey: 'guide_spellcond_after_turn_when',    descKey: 'guide_spellcond_after_turn_desc',    color: '#4ade80', rgb: '74,222,128' },
          ] as const).map(({ nameKey, whenKey, descKey, color, rgb }) => (
            <div key={nameKey} style={{ background: `rgba(${rgb},0.05)`, border: `1px solid rgba(${rgb},0.15)`, borderLeft: `3px solid ${color}`, borderRadius: 9, padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4, flexWrap: 'wrap' as const }}>
                <span style={{ color, fontWeight: 800, fontSize: 11, letterSpacing: '0.1em', fontFamily: 'monospace' }}>{t(nameKey as Parameters<typeof t>[0])}</span>
                <span style={{ color: '#5a5a80', fontSize: 11, fontStyle: 'italic' }}>{t(whenKey as Parameters<typeof t>[0])}</span>
              </div>
              <div style={{ color: '#4a4a72', fontSize: 12, lineHeight: 1.65, fontFamily: 'Inter, sans-serif' }}>{t(descKey as Parameters<typeof t>[0])}</div>
            </div>
          ))}
        </div>

        {/* Post-clash */}
        <div style={{ color: '#a78bfa', fontWeight: 800, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6, fontFamily: 'Inter, sans-serif' }}>
          {t('guide_spellcond_post_header')}
        </div>
        <div style={{ color: '#4a4a72', fontSize: 11.5, marginBottom: 14, fontStyle: 'italic' }}>{t('guide_spellcond_post_sub')}</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {([
            { nameKey: 'guide_spellcond_after_clash_name', whenKey: 'guide_spellcond_after_clash_when', descKey: 'guide_spellcond_after_clash_desc', color: '#c084fc', rgb: '192,132,252' },
            { nameKey: 'guide_spellcond_after_crit_name',  whenKey: 'guide_spellcond_after_crit_when',  descKey: 'guide_spellcond_after_crit_desc',  color: '#f87171', rgb: '248,113,113' },
            { nameKey: 'guide_spellcond_after_magic_name', whenKey: 'guide_spellcond_after_magic_when', descKey: 'guide_spellcond_after_magic_desc', color: '#818cf8', rgb: '129,140,248' },
            { nameKey: 'guide_spellcond_on_death_name',    whenKey: 'guide_spellcond_on_death_when',    descKey: 'guide_spellcond_on_death_desc',    color: '#e11d48', rgb: '225,29,72'  },
          ] as const).map(({ nameKey, whenKey, descKey, color, rgb }) => (
            <div key={nameKey} style={{ background: `rgba(${rgb},0.05)`, border: `1px solid rgba(${rgb},0.15)`, borderLeft: `3px solid ${color}`, borderRadius: 9, padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4, flexWrap: 'wrap' as const }}>
                <span style={{ color, fontWeight: 800, fontSize: 11, letterSpacing: '0.1em', fontFamily: 'monospace' }}>{t(nameKey as Parameters<typeof t>[0])}</span>
                <span style={{ color: '#5a5a80', fontSize: 11, fontStyle: 'italic' }}>{t(whenKey as Parameters<typeof t>[0])}</span>
              </div>
              <div style={{ color: '#4a4a72', fontSize: 12, lineHeight: 1.65, fontFamily: 'Inter, sans-serif' }}>{t(descKey as Parameters<typeof t>[0])}</div>
            </div>
          ))}
        </div>

        {/* Scope note */}
        <div style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.18)', borderRadius: 9, padding: '12px 14px', marginBottom: 24 }}>
          <div style={{ color: '#a78bfa', fontWeight: 700, fontSize: 11, marginBottom: 5, letterSpacing: '0.05em', textTransform: 'uppercase' as const }}>{t('guide_spellcond_note_header')}</div>
          <div style={{ color: '#4a4a72', fontSize: 12, lineHeight: 1.65, fontFamily: 'Inter, sans-serif' }}>{t('guide_spellcond_note_body')}</div>
        </div>

        {/* Max usages */}
        <div style={{ color: '#a78bfa', fontWeight: 800, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6, fontFamily: 'Inter, sans-serif' }}>
          {t('guide_spellcond_maxuses_header')}
        </div>
        <p style={{ color: '#4a4a72', fontSize: 13, lineHeight: 1.75, marginBottom: 14, fontFamily: 'Inter, sans-serif' }}>
          {t('guide_spellcond_maxuses_body')}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {([
            { titleKey: 'guide_spellcond_maxuses_0_title', descKey: 'guide_spellcond_maxuses_0_desc', color: '#4ade80', rgb: '74,222,128' },
            { titleKey: 'guide_spellcond_maxuses_1_title', descKey: 'guide_spellcond_maxuses_1_desc', color: '#fbbf24', rgb: '251,191,36' },
            { titleKey: 'guide_spellcond_maxuses_n_title', descKey: 'guide_spellcond_maxuses_n_desc', color: '#f97316', rgb: '249,115,22' },
          ] as const).map(({ titleKey, descKey, color, rgb }) => (
            <div key={titleKey} style={{ background: `rgba(${rgb},0.05)`, border: `1px solid rgba(${rgb},0.15)`, borderLeft: `3px solid ${color}`, borderRadius: 9, padding: '12px 14px' }}>
              <div style={{ color, fontWeight: 700, fontSize: 12.5, marginBottom: 5, fontFamily: 'Inter, sans-serif' }}>{t(titleKey as Parameters<typeof t>[0])}</div>
              <div style={{ color: '#4a4a72', fontSize: 12, lineHeight: 1.65, fontFamily: 'Inter, sans-serif' }}>{t(descKey as Parameters<typeof t>[0])}</div>
            </div>
          ))}
        </div>

        {/* Duration */}
        <div style={{ color: '#a78bfa', fontWeight: 800, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 24, marginBottom: 6, fontFamily: 'Inter, sans-serif' }}>
          {t('guide_spellcond_duration_header')}
        </div>
        <p style={{ color: '#4a4a72', fontSize: 13, lineHeight: 1.75, marginBottom: 14, fontFamily: 'Inter, sans-serif' }}>
          {t('guide_spellcond_duration_body')}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {([
            { titleKey: 'guide_spellcond_duration_instant_title', descKey: 'guide_spellcond_duration_instant_desc', color: '#60a5fa', rgb: '96,165,250' },
            { titleKey: 'guide_spellcond_duration_lasting_title', descKey: 'guide_spellcond_duration_lasting_desc', color: '#a78bfa', rgb: '167,139,250' },
            { titleKey: 'guide_spellcond_duration_stack_title',   descKey: 'guide_spellcond_duration_stack_desc',   color: '#fbbf24', rgb: '251,191,36' },
            { titleKey: 'guide_spellcond_duration_hero_title',    descKey: 'guide_spellcond_duration_hero_desc',    color: '#4ade80', rgb: '74,222,128' },
          ] as const).map(({ titleKey, descKey, color, rgb }) => (
            <div key={titleKey} style={{ background: `rgba(${rgb},0.05)`, border: `1px solid rgba(${rgb},0.15)`, borderLeft: `3px solid ${color}`, borderRadius: 9, padding: '12px 14px' }}>
              <div style={{ color, fontWeight: 700, fontSize: 12.5, marginBottom: 5, fontFamily: 'Inter, sans-serif' }}>{t(titleKey as Parameters<typeof t>[0])}</div>
              <div style={{ color: '#4a4a72', fontSize: 12, lineHeight: 1.65, fontFamily: 'Inter, sans-serif' }}>{t(descKey as Parameters<typeof t>[0])}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ── § 16  Team Spells ── */}
      <SectionCard icon={<Users size={17} />} title={t('guide_teamspell_title')} color="#2dd4bf">
        <p style={{ color: '#4a4a72', fontSize: 13, lineHeight: 1.75, marginBottom: 20, fontFamily: 'Inter, sans-serif' }}>
          {t('guide_teamspell_body')}
        </p>

        <SubLabel>{t('guide_teamspell_how_header')}</SubLabel>
        <div style={{ background: 'rgba(20,184,166,0.06)', border: '1px solid rgba(20,184,166,0.2)', borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
          <p style={{ color: '#4a4a72', fontSize: 13, lineHeight: 1.75, margin: 0, fontFamily: 'Inter, sans-serif' }}>
            {t('guide_teamspell_how_body')}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {([
            { titleKey: 'guide_teamspell_once_title',    descKey: 'guide_teamspell_once_desc',    color: '#2dd4bf', rgb: '45,212,191' },
            { titleKey: 'guide_teamspell_owner_title',   descKey: 'guide_teamspell_owner_desc',   color: '#34d399', rgb: '52,211,153' },
            { titleKey: 'guide_teamspell_tooltip_title', descKey: 'guide_teamspell_tooltip_desc', color: '#5eead4', rgb: '94,234,212' },
            { titleKey: 'guide_teamspell_log_title',     descKey: 'guide_teamspell_log_desc',     color: '#0d9488', rgb: '13,148,136' },
          ] as const).map(({ titleKey, descKey, color, rgb }) => (
            <div key={titleKey} style={{ background: `rgba(${rgb},0.05)`, border: `1px solid rgba(${rgb},0.15)`, borderLeft: `3px solid ${color}`, borderRadius: 9, padding: '12px 14px' }}>
              <div style={{ color, fontWeight: 700, fontSize: 12.5, marginBottom: 5, fontFamily: 'Inter, sans-serif' }}>{t(titleKey as Parameters<typeof t>[0])}</div>
              <div style={{ color: '#4a4a72', fontSize: 12, lineHeight: 1.65, fontFamily: 'Inter, sans-serif' }}>{t(descKey as Parameters<typeof t>[0])}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ── § 17  Multi-Spell Abilities ── */}
      <SectionCard icon={<Layers size={17} />} title={t('guide_multispell_title')} color="#f59e0b">
        <p style={{ color: '#4a4a72', fontSize: 13, lineHeight: 1.75, marginBottom: 20, fontFamily: 'Inter, sans-serif' }}>
          {t('guide_multispell_body')}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {([
            { titleKey: 'guide_multispell_rolls_title',      descKey: 'guide_multispell_rolls_desc',      color: '#f59e0b', rgb: '245,158,11'  },
            { titleKey: 'guide_multispell_conditions_title', descKey: 'guide_multispell_conditions_desc', color: '#fb923c', rgb: '251,146,60'  },
            { titleKey: 'guide_multispell_stacking_title',   descKey: 'guide_multispell_stacking_desc',   color: '#fbbf24', rgb: '251,191,36'  },
            { titleKey: 'guide_multispell_tooltip_title',    descKey: 'guide_multispell_tooltip_desc',    color: '#d97706', rgb: '217,119,6'   },
          ] as const).map(({ titleKey, descKey, color, rgb }) => (
            <div key={titleKey} style={{ background: `rgba(${rgb},0.05)`, border: `1px solid rgba(${rgb},0.15)`, borderLeft: `3px solid ${color}`, borderRadius: 9, padding: '12px 14px' }}>
              <div style={{ color, fontWeight: 700, fontSize: 12.5, marginBottom: 5, fontFamily: 'Inter, sans-serif' }}>{t(titleKey as Parameters<typeof t>[0])}</div>
              <div style={{ color: '#4a4a72', fontSize: 12, lineHeight: 1.65, fontFamily: 'Inter, sans-serif' }}>{t(descKey as Parameters<typeof t>[0])}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ── § 18  Spell Overcharge ── */}
      <SectionCard icon={<Zap size={17} />} title={t('guide_overcharge_title')} color="#fbbf24">
        <p style={{ color: '#4a4a72', fontSize: 13, lineHeight: 1.75, marginBottom: 20, fontFamily: 'Inter, sans-serif' }}>
          {t('guide_overcharge_body')}
        </p>

        {/* How it works */}
        <SubLabel>{t('guide_overcharge_how_header')}</SubLabel>
        <div style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
          <p style={{ color: '#4a4a72', fontSize: 13, lineHeight: 1.75, margin: 0, fontFamily: 'Inter, sans-serif' }}>
            {t('guide_overcharge_how_body')}
          </p>
        </div>

        {/* Power levels */}
        <SubLabel>{t('guide_overcharge_levels_header')}</SubLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {([
            { key: 'guide_overcharge_level_1', mult: '×1.0', color: '#9ca3af', rgb: '156,163,175' },
            { key: 'guide_overcharge_level_2', mult: '×1.6', color: '#fbbf24', rgb: '251,191,36'  },
            { key: 'guide_overcharge_level_3', mult: '×2.2', color: '#f97316', rgb: '249,115,22'  },
            { key: 'guide_overcharge_level_4', mult: '×2.8+', color: '#ef4444', rgb: '239,68,68'  },
          ] as const).map(({ key, mult, color, rgb }) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 12, background: `rgba(${rgb},0.05)`, border: `1px solid rgba(${rgb},0.18)`, borderLeft: `3px solid ${color}`, borderRadius: 9, padding: '10px 14px' }}>
              <span style={{ fontWeight: 900, fontSize: 13, color, fontFamily: 'monospace', minWidth: 42, textShadow: color !== '#9ca3af' ? `0 0 8px ${color}88` : undefined }}>{mult}</span>
              <span style={{ color: '#4a4a72', fontSize: 12, lineHeight: 1.6, fontFamily: 'Inter, sans-serif' }}>{t(key as Parameters<typeof t>[0])}</span>
            </div>
          ))}
        </div>

        {/* Example */}
        <SubLabel>{t('guide_overcharge_example_header')}</SubLabel>
        <div style={{ background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.18)', borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
          <p style={{ color: '#4a4a72', fontSize: 13, lineHeight: 1.75, margin: 0, fontFamily: 'Inter, sans-serif' }}>
            {t('guide_overcharge_example_body')}
          </p>
        </div>

        {/* Bottom cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {([
            { titleKey: 'guide_overcharge_display_header',    descKey: 'guide_overcharge_display_body',    color: '#fbbf24', rgb: '251,191,36' },
            { titleKey: 'guide_overcharge_activation_header', descKey: 'guide_overcharge_activation_body', color: '#fb923c', rgb: '251,146,60' },
          ] as const).map(({ titleKey, descKey, color, rgb }) => (
            <div key={titleKey} style={{ background: `rgba(${rgb},0.05)`, border: `1px solid rgba(${rgb},0.15)`, borderLeft: `3px solid ${color}`, borderRadius: 9, padding: '12px 14px' }}>
              <div style={{ color, fontWeight: 700, fontSize: 12.5, marginBottom: 5, fontFamily: 'Inter, sans-serif' }}>{t(titleKey as Parameters<typeof t>[0])}</div>
              <div style={{ color: '#4a4a72', fontSize: 12, lineHeight: 1.65, fontFamily: 'Inter, sans-serif' }}>{t(descKey as Parameters<typeof t>[0])}</div>
            </div>
          ))}
        </div>
      </SectionCard>

    </div>
  );
}
