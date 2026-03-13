import { useState } from 'react';
import { BookOpen, Activity, AlertTriangle, Sword, Shuffle, Zap, Wind, Sparkles, Flame, Star, Coins } from 'lucide-react';

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
  {
    abbr: 'PA', label: 'Physical Attack', color: '#f97316', rgb: '249,115,22',
    desc: 'Raw offensive power. One of three core stats that determine clash damage, alongside MP and DEX.',
  },
  {
    abbr: 'MP', label: 'Magic Power', color: '#60a5fa', rgb: '96,165,250',
    desc: 'One of three core stats that determine clash damage, alongside PA and DEX. Its contribution is determined by a random roll each clash — the higher your MP, the more that roll is worth.',
  },
  {
    abbr: 'DEX', label: 'Dexterity', color: '#4ade80', rgb: '74,222,128',
    desc: 'Agility and combat rhythm. Each round, a portion of your current DEX is consumed as energy — then partially recovered based on DEX Posture. High DEX sustains attack contributions across long fights.',
  },
  {
    abbr: 'ELEM', label: 'Element', color: '#facc15', rgb: '250,204,21',
    desc: "Elemental affinity. Deals bonus damage when your element counters your opponent's — Fire beats Wind, Water beats Fire, Lightning beats Earth, Wind beats Lightning, Earth beats Water.",
  },
  {
    abbr: 'MANA', label: 'Mana', color: '#a78bfa', rgb: '167,139,250',
    desc: 'Ability fuel. Heroes share a single mana pool per battle — every spell fired costs mana from this pool. Manage it carefully; run dry and your spells go silent.',
  },
  {
    abbr: 'STAM', label: 'Stamina', color: '#fb7185', rgb: '251,113,133',
    desc: 'Battle endurance. Determines how well a hero sustains their attack power through consecutive clash wins. Low-stamina heroes degrade quickly.',
  },
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
            Game Guide
          </h1>
          <p style={{
            margin: 0, color: '#4a4a72', fontSize: 13,
            fontFamily: 'Inter, sans-serif', lineHeight: 1.5,
          }}>
            Mechanics, formulas, and strategy — everything you need to build a winning team.
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 1 — HERO STATS OVERVIEW
      ══════════════════════════════════════════════════════════════════════ */}
      <SectionCard icon={<Activity size={16} />} title="Hero Stats" color="#60a5fa">
        <p style={{
          color: '#5a5a84', fontSize: 13, lineHeight: 1.8,
          margin: '0 0 20px', fontFamily: 'Inter, sans-serif',
        }}>
          Every hero has six core stats. Your hero's battle attack is derived from{' '}
          <span style={{ color: '#f97316' }}>PA</span>,{' '}
          <span style={{ color: '#60a5fa' }}>MP</span>, and{' '}
          <span style={{ color: '#4ade80' }}>DEX</span> weighted together, then scaled by their{' '}
          <span style={{ color: '#fb7185' }}>stamina capacity</span> and elemental matchup.
          Stats grow with level and can be boosted through purchases, equipment, and abilities.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {STAT_DEFS.map(({ abbr, label, color, rgb, desc }) => (
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
                  {label}
                </div>
                <div style={{
                  color: '#5a5a84', fontSize: 12, lineHeight: 1.65,
                  fontFamily: 'Inter, sans-serif',
                }}>
                  {desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 22 }}>
          <SubLabel>Element Advantage Chain</SubLabel>
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
                <span style={{ color: '#333355', fontSize: 11 }}>beats</span>
                <span style={{ color: toC, fontWeight: 700, fontSize: 12, fontFamily: 'Inter, sans-serif' }}>{to}</span>
              </div>
            ))}
            <div style={{
              display: 'flex', alignItems: 'center',
              color: '#3a3a5a', fontSize: 11, fontFamily: 'Inter, sans-serif',
              fontStyle: 'italic', paddingLeft: 4,
            }}>
              Bonus only applies when attacker ELEM stat &gt; defender ELEM stat.
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 2 — STAMINA
      ══════════════════════════════════════════════════════════════════════ */}
      <SectionCard icon={<Activity size={16} />} title="Stamina — Battle Endurance" color="#fb7185">

        <p style={{
          color: '#5a5a84', fontSize: 13, lineHeight: 1.8,
          margin: '0 0 24px', fontFamily: 'Inter, sans-serif',
        }}>
          Stamina does not contribute directly to your hero's raw attack value — instead it acts as a{' '}
          <span style={{ color: '#fb7185', fontWeight: 600 }}>capacity modifier</span>: a multiplier on how much of
          their full attack power they can deliver. A hero with high stamina can chain multiple wins at near-full
          power. A hero with low stamina degrades rapidly after the first clash.
        </p>

        <div style={{ marginBottom: 26 }}>
          <SubLabel>Stamina Effectiveness Formula</SubLabel>
          <FormulaBox color="251,113,133">
            <Kw c="#fb7185">sta_eff</Kw><Dim> = min(</Dim><Kw c="#4ade80">1.0</Kw><Dim>, </Dim>
            <Kw c="#fb7185">hero_stamina</Kw><Dim> / (</Dim><Kw c="#fbbf24">60</Kw>
            <Dim> + </Dim><Kw c="#a78bfa">level</Kw><Dim> × </Dim><Kw c="#fbbf24">2.5</Kw><Dim>))</Dim>
          </FormulaBox>
          <StatGrid items={[
            { label: 'Min stamina needed for 100% at Lv.1',  val: '62.5',  color: '#60a5fa' },
            { label: 'Min stamina needed for 100% at Lv.25', val: '122.5', color: '#a78bfa' },
            { label: 'Min stamina needed for 100% at Lv.50', val: '185.0', color: '#fbbf24' },
          ]} />
        </div>

        <div style={{ marginBottom: 26 }}>
          <SubLabel>Live Preview</SubLabel>
          <div style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 10, padding: '18px 20px',
          }}>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 16 }}>
              <div style={{ flex: 1, minWidth: 160 }}>
                <label style={{ color: '#5a5a84', fontSize: 11.5, fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  Hero Stamina Stat <span style={{ color: '#fb7185', fontWeight: 800, fontSize: 15 }}>{previewStam}</span>
                </label>
                <input type="range" min={1} max={300} value={previewStam} onChange={(e) => setPreviewStam(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#fb7185', cursor: 'pointer' }} />
              </div>
              <div style={{ flex: 1, minWidth: 160 }}>
                <label style={{ color: '#5a5a84', fontSize: 11.5, fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  Hero Level <span style={{ color: '#a78bfa', fontWeight: 800, fontSize: 15 }}>{previewLevel}</span>
                </label>
                <input type="range" min={1} max={50} value={previewLevel} onChange={(e) => setPreviewLevel(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#a78bfa', cursor: 'pointer' }} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 7, padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
                <span style={{ color: '#3e3e60', fontSize: 10, fontFamily: 'Inter, sans-serif' }}>Required for 100%</span>
                <span style={{ color: '#fbbf24', fontWeight: 800, fontSize: 16, fontFamily: 'Inter, sans-serif' }}>{(60 + previewLevel * 2.5).toFixed(1)}</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 7, padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
                <span style={{ color: '#3e3e60', fontSize: 10, fontFamily: 'Inter, sans-serif' }}>Stamina Effectiveness</span>
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
          <SubLabel>Turn Capacity — Attack % of Full Power</SubLabel>
          <p style={{ color: '#4a4a72', fontSize: 12.5, lineHeight: 1.7, margin: '0 0 14px', fontFamily: 'Inter, sans-serif' }}>
            Each time a hero wins a clash, their capacity for the <em>next</em> clash drops based on stamina
            effectiveness. Losing a clash resets the chain to zero — a new opposing hero always starts fresh.
            The <span style={{ color: '#fbbf24', fontWeight: 600 }}>Preview</span> column updates with your sliders above.
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Inter, sans-serif', fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={{ color: '#44446a', fontWeight: 600, textAlign: 'left', padding: '8px 12px 12px 0', borderBottom: '1px solid rgba(255,255,255,0.07)', whiteSpace: 'nowrap' }}>Clash #</th>
                  {CAPACITY_COLS.map(({ label, color }) => (
                    <th key={label} style={{ color, fontWeight: 700, textAlign: 'center', padding: '8px 10px 12px', borderBottom: '1px solid rgba(255,255,255,0.07)', whiteSpace: 'nowrap', fontSize: 11 }}>Eff {label}</th>
                  ))}
                  <th style={{ color: '#fbbf24', fontWeight: 700, textAlign: 'center', padding: '8px 10px 12px', borderBottom: '1px solid rgba(255,255,255,0.07)', whiteSpace: 'nowrap', fontSize: 11 }}>Preview ({effPct.toFixed(1)}%)</th>
                </tr>
              </thead>
              <tbody>
                {WIN_ROWS.map((wins) => {
                  const previewCap = getCapacity(wins, staEff);
                  const isFirst = wins === 0;
                  const clashLabel = wins === 7 ? '8th+ clash' : `${ordinal(wins + 1)} clash`;
                  return (
                    <tr key={wins} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: isFirst ? 'rgba(74,222,128,0.04)' : 'transparent' }}>
                      <td style={{ padding: '9px 12px 9px 0', color: '#7070a0', whiteSpace: 'nowrap' }}>
                        {clashLabel}
                        {isFirst && <span style={{ color: '#4ade80', fontSize: 9.5, fontWeight: 700, marginLeft: 7, letterSpacing: '0.08em', background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: 4, padding: '1px 5px' }}>FRESH</span>}
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
          <SubLabel>Off-Positioning Penalty</SubLabel>
          <InsightBox color="#fbbf24" rgb="251,191,36">
            Placing a hero in a slot of a <em>different tier</em> reduces their stamina stat before effectiveness
            is calculated. The required stamina scales with the hero's level and the slot's tier. If the hero's
            stamina is below the slot's requirement, a proportional penalty is applied up to the slot's maximum.
          </InsightBox>
          <FormulaBox color="251,191,36">
            <div><Kw c="#a78bfa">required</Kw><Dim> = </Dim><Kw c="#fbbf24">base</Kw><Dim> + </Dim><Kw c="#a78bfa">level</Kw><Dim> × </Dim><Kw c="#fbbf24">3</Kw></div>
            <div><Kw c="#f97316">penalty</Kw><Dim> = </Dim><Kw c="#fbbf24">max_penalty</Kw><Dim> × max(</Dim><Kw c="#4ade80">0</Kw><Dim>, </Dim><Kw c="#4ade80">1</Kw><Dim> − </Dim><Kw c="#fb7185">hero_stamina</Kw><Dim> / </Dim><Kw c="#a78bfa">required</Kw><Dim>)</Dim></div>
            <div><Kw c="#fb7185">stamina_after</Kw><Dim> = </Dim><Kw c="#fb7185">hero_stamina</Kw><Dim> × (</Dim><Kw c="#4ade80">1</Kw><Dim> − </Dim><Kw c="#f97316">penalty</Kw><Dim>)</Dim></div>
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
                    <span style={{ color: '#44446a' }}>Max penalty:</span>
                    <span style={{ color, fontWeight: 800, fontSize: 14 }}>{maxPenalty}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p style={{ color: '#333355', fontSize: 11.5, lineHeight: 1.7, margin: 0, fontFamily: 'Inter, sans-serif', fontStyle: 'italic' }}>
            If hero_stamina ≥ required, no penalty applies regardless of the tier mismatch — building enough stamina can fully negate off-positioning for any slot.
          </p>
        </div>
      </SectionCard>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 3 — ATTACK (FLAT)
      ══════════════════════════════════════════════════════════════════════ */}
      <SectionCard icon={<Sword size={16} />} title="Attack — Pure Damage" color="#f97316">
        <p style={{ color: '#5a5a84', fontSize: 13, lineHeight: 1.8, margin: '0 0 20px', fontFamily: 'Inter, sans-serif' }}>
          Attack is the most direct form of damage in the game. Unlike PA, MP, or DEX, this flat value bypasses
          the stamina multiplier entirely and is added straight to the final attack total. It rewards you every
          round <span style={{ color: '#f97316', fontWeight: 600 }}>no matter how exhausted your hero is</span>.
        </p>

        <div style={{ marginBottom: 22 }}>
          <SubLabel>Attack Formula Position</SubLabel>
          <FormulaBox color="249,115,22">
            <div><Kw c="#a0a0c0">raw_total</Kw><Dim> = (</Dim><Kw c="#f97316">PA</Kw><Dim>×0.5 + </Dim><Kw c="#60a5fa">MP</Kw><Dim>×roll + </Dim><Kw c="#4ade80">DEX</Kw><Dim>×factor) × </Dim><Kw c="#fb7185">stamina</Kw></div>
            <div><Kw c="#fbbf24">final</Kw><Dim> = </Dim><Kw c="#a0a0c0">raw_total</Kw><Dim> + </Dim><Kw c="#f97316">crit_pa_bonus</Kw><Dim> + </Dim><Kw c="#f97316">attack_flat</Kw></div>
          </FormulaBox>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
          {[
            { title: 'Stamina Independent', desc: 'Attack is added after the stamina multiplier. A hero at 5% stamina still deals full attack flat damage — it never decays.', color: '#f97316', rgb: '249,115,22' },
            { title: 'Crit Independent', desc: 'Critical hits boost PA contribution only. Attack flat is always added as-is, making it consistent and reliable every round.', color: '#fbbf24', rgb: '251,191,36' },
            { title: 'Sources', desc: 'Equipment items, equipped abilities, and certain summons can grant flat Attack. Stack multiple sources for significant passive damage.', color: '#fb7185', rgb: '251,113,133' },
            { title: 'Best With Low PA', desc: 'Heroes with weak PA gain more from flat Attack than from investing in PA. It is a great equaliser for support-oriented builds.', color: '#a78bfa', rgb: '167,139,250' },
          ].map(({ title, desc, color, rgb }) => (
            <div key={title} style={{ background: `rgba(${rgb},0.05)`, border: `1px solid rgba(${rgb},0.15)`, borderLeft: `3px solid ${color}`, borderRadius: 9, padding: '12px 14px' }}>
              <div style={{ color, fontWeight: 700, fontSize: 12.5, marginBottom: 5, fontFamily: 'Inter, sans-serif' }}>{title}</div>
              <div style={{ color: '#4a4a72', fontSize: 12, lineHeight: 1.65, fontFamily: 'Inter, sans-serif' }}>{desc}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 4 — MAGIC PROFICIENCY
      ══════════════════════════════════════════════════════════════════════ */}
      <SectionCard icon={<Shuffle size={16} />} title="Magic Proficiency — The Reroll" color="#60a5fa">
        <p style={{ color: '#5a5a84', fontSize: 13, lineHeight: 1.8, margin: '0 0 20px', fontFamily: 'Inter, sans-serif' }}>
          Every clash, your MP contribution is determined by a random roll between 0 and 1. Magic Proficiency grants
          you <span style={{ color: '#60a5fa', fontWeight: 600 }}>extra rolls — keeping the highest</span>. Every full
          100% is a <em>guaranteed</em> extra roll. The remainder is a <em>chance</em> at one more.
          At <strong style={{ color: '#60a5fa' }}>230%</strong> you always roll 3 times, with a 30% shot at a 4th.
        </p>

        <div style={{ marginBottom: 22 }}>
          <SubLabel>Magic Proficiency Formula</SubLabel>
          <FormulaBox color="96,165,250">
            <div><Kw c="#a78bfa">guaranteed</Kw><Dim> = floor(</Dim><Kw c="#60a5fa">magic_proficiency</Kw><Dim> / 100)</Dim></div>
            <div><Kw c="#fbbf24">partial</Kw><Dim>    = (</Dim><Kw c="#60a5fa">magic_proficiency</Kw><Dim> % 100) / 100</Dim></div>
            <div style={{ marginTop: 6 }}><Kw c="#60a5fa">mp_contrib</Kw><Dim> = </Dim><Kw c="#60a5fa">MP</Kw><Dim> × </Dim><Kw c="#fbbf24">roll()</Kw><Dim>  ← base roll</Dim></div>
            <div><Dim>for i in range(</Dim><Kw c="#a78bfa">guaranteed</Kw><Dim>):  mp_contrib = max(mp_contrib, </Dim><Kw c="#60a5fa">MP</Kw><Dim> × </Dim><Kw c="#fbbf24">roll()</Kw><Dim>)</Dim></div>
            <div><Dim>if random() {'<'} </Dim><Kw c="#fbbf24">partial</Kw><Dim>:  mp_contrib = max(mp_contrib, </Dim><Kw c="#60a5fa">MP</Kw><Dim> × </Dim><Kw c="#fbbf24">roll()</Kw><Dim>)</Dim></div>
          </FormulaBox>
        </div>

        <div style={{ marginBottom: 22 }}>
          <SubLabel>Live Preview</SubLabel>
          <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '18px 20px' }}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ color: '#5a5a84', fontSize: 11.5, fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                Magic Proficiency <span style={{ color: '#60a5fa', fontWeight: 800, fontSize: 15 }}>{previewMagProf}%</span>
                <span style={{ color: '#a78bfa', fontSize: 11, marginLeft: 4 }}>
                  ({magGuaranteed} guaranteed{magPartial > 0 ? ` + ${Math.round(magPartial * 100)}% chance of 1 more` : ''} reroll{magGuaranteed !== 1 ? 's' : ''})
                </span>
              </label>
              <input type="range" min={0} max={300} value={previewMagProf} onChange={(e) => setPreviewMagProf(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#60a5fa', cursor: 'pointer' }} />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '10px 14px' }}>
                <div style={{ color: '#3e3e60', fontSize: 10, fontFamily: 'Inter, sans-serif', marginBottom: 4 }}>Expected roll (no proficiency)</div>
                <div style={{ color: '#a0a0c0', fontWeight: 800, fontSize: 17, fontFamily: 'Inter, sans-serif' }}>×{expectedRollNoProf.toFixed(3)}</div>
              </div>
              <div style={{ flex: 1, background: 'rgba(96,165,250,0.07)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 8, padding: '10px 14px' }}>
                <div style={{ color: '#3e3e60', fontSize: 10, fontFamily: 'Inter, sans-serif', marginBottom: 4 }}>Expected roll at {previewMagProf}%</div>
                <div style={{ color: '#60a5fa', fontWeight: 800, fontSize: 17, fontFamily: 'Inter, sans-serif' }}>×{expectedRollWithProf.toFixed(3)}</div>
              </div>
              <div style={{ flex: 1, background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.18)', borderRadius: 8, padding: '10px 14px' }}>
                <div style={{ color: '#3e3e60', fontSize: 10, fontFamily: 'Inter, sans-serif', marginBottom: 4 }}>Average MP gain</div>
                <div style={{ color: '#4ade80', fontWeight: 800, fontSize: 17, fontFamily: 'Inter, sans-serif' }}>+{((expectedRollWithProf - expectedRollNoProf) * 100).toFixed(1)}%</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { title: 'Scales With MP', desc: 'Extra rolls only help if your MP stat is high. Pairing high Magic Proficiency with a strong MP investment creates enormous ceiling swings.', color: '#60a5fa', rgb: '96,165,250' },
            { title: 'No Hard Cap', desc: 'Magic Proficiency can exceed 100%. At 200% you get 2 guaranteed rerolls. At 230% you get 2 guaranteed + 30% chance of a 3rd. Each 100% adds a free roll.', color: '#a78bfa', rgb: '167,139,250' },
          ].map(({ title, desc, color, rgb }) => (
            <div key={title} style={{ background: `rgba(${rgb},0.05)`, border: `1px solid rgba(${rgb},0.15)`, borderLeft: `3px solid ${color}`, borderRadius: 9, padding: '12px 14px' }}>
              <div style={{ color, fontWeight: 700, fontSize: 12.5, marginBottom: 5, fontFamily: 'Inter, sans-serif' }}>{title}</div>
              <div style={{ color: '#4a4a72', fontSize: 12, lineHeight: 1.65, fontFamily: 'Inter, sans-serif' }}>{desc}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 5 — CRITICAL CHANCE & DAMAGE
      ══════════════════════════════════════════════════════════════════════ */}
      <SectionCard icon={<Zap size={16} />} title="Critical Chance & Damage — The Strike" color="#fb923c">
        <p style={{ color: '#5a5a84', fontSize: 13, lineHeight: 1.8, margin: '0 0 20px', fontFamily: 'Inter, sans-serif' }}>
          Critical hits amplify your <span style={{ color: '#f97316', fontWeight: 600 }}>Physical Attack contribution</span> by
          a bonus multiplier. They are purely physical — MP and DEX contributions are unaffected — so crits reward
          heroes who invest heavily in PA and stack Critical Damage alongside Critical Chance.
        </p>

        <div style={{ marginBottom: 22 }}>
          <SubLabel>Critical Hit Formula</SubLabel>
          <FormulaBox color="249,115,22">
            <div><Dim>if random() {'<'} </Dim><Kw c="#fb923c">crit_chance</Kw><Dim>:</Dim></div>
            <div><Dim>{'    '}</Dim><Kw c="#fb923c">crit_pa_bonus</Kw><Dim> = </Dim><Kw c="#f97316">pa_contrib</Kw><Dim> × </Dim><Kw c="#fb923c">crit_damage</Kw></div>
            <div><Kw c="#fbbf24">final</Kw><Dim> = raw_total + </Dim><Kw c="#fb923c">crit_pa_bonus</Kw><Dim> + attack_flat</Dim></div>
          </FormulaBox>
          <InsightBox color="#fb923c" rgb="251,146,60">
            The base Critical Damage is 25% (+0.25). This means a crit adds 25% of your PA contribution on top of the normal PA damage — not 25% of total attack. Higher Crit Damage pushes this multiplier higher.
          </InsightBox>
        </div>

        <div style={{ marginBottom: 22 }}>
          <SubLabel>Live Preview</SubLabel>
          <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '18px 20px' }}>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 16 }}>
              <div style={{ flex: 1, minWidth: 160 }}>
                <label style={{ color: '#5a5a84', fontSize: 11.5, fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  Crit Chance <span style={{ color: '#fb923c', fontWeight: 800, fontSize: 15 }}>{previewCritChance}%</span>
                </label>
                <input type="range" min={0} max={100} value={previewCritChance} onChange={(e) => setPreviewCritChance(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#fb923c', cursor: 'pointer' }} />
              </div>
              <div style={{ flex: 1, minWidth: 160 }}>
                <label style={{ color: '#5a5a84', fontSize: 11.5, fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  Crit Damage bonus <span style={{ color: '#fbbf24', fontWeight: 800, fontSize: 15 }}>{previewCritDmg}%</span>
                </label>
                <input type="range" min={0} max={200} value={previewCritDmg} onChange={(e) => setPreviewCritDmg(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#fbbf24', cursor: 'pointer' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '10px 14px' }}>
                <div style={{ color: '#3e3e60', fontSize: 10, fontFamily: 'Inter, sans-serif', marginBottom: 4 }}>On-crit PA multiplier</div>
                <div style={{ color: '#fbbf24', fontWeight: 800, fontSize: 17, fontFamily: 'Inter, sans-serif' }}>×{(1 + previewCritDmg / 100).toFixed(2)}</div>
              </div>
              <div style={{ flex: 1, background: 'rgba(251,146,60,0.07)', border: '1px solid rgba(251,146,60,0.2)', borderRadius: 8, padding: '10px 14px' }}>
                <div style={{ color: '#3e3e60', fontSize: 10, fontFamily: 'Inter, sans-serif', marginBottom: 4 }}>Expected PA bonus per round</div>
                <div style={{ color: '#fb923c', fontWeight: 800, fontSize: 17, fontFamily: 'Inter, sans-serif' }}>+{(critExpectedBonus * 100).toFixed(1)}% of PA</div>
              </div>
              <div style={{ flex: 1, background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.18)', borderRadius: 8, padding: '10px 14px' }}>
                <div style={{ color: '#3e3e60', fontSize: 10, fontFamily: 'Inter, sans-serif', marginBottom: 4 }}>Crit frequency</div>
                <div style={{ color: previewCritChance >= 50 ? '#4ade80' : previewCritChance >= 25 ? '#fbbf24' : '#f97316', fontWeight: 800, fontSize: 17, fontFamily: 'Inter, sans-serif' }}>
                  {previewCritChance >= 50 ? 'Often' : previewCritChance >= 25 ? 'Moderate' : previewCritChance >= 10 ? 'Rare' : 'Very rare'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 6 — DEX PROFICIENCY & POSTURE
      ══════════════════════════════════════════════════════════════════════ */}
      <SectionCard icon={<Wind size={16} />} title="Dex Proficiency & Posture — The Cycle" color="#4ade80">
        <p style={{ color: '#5a5a84', fontSize: 13, lineHeight: 1.8, margin: '0 0 20px', fontFamily: 'Inter, sans-serif' }}>
          DEX is the only combat stat that <span style={{ color: '#4ade80', fontWeight: 600 }}>decays round-to-round</span>.
          Each clash, a portion of your current DEX is consumed as attack output. What remains determines how
          powerful your DEX strikes are next round. Dex Posture is your recovery — the fraction of consumed DEX
          that regenerates before the next clash begins.
        </p>

        <div style={{ marginBottom: 22 }}>
          <SubLabel>DEX Cycle Formula</SubLabel>
          <FormulaBox color="74,222,128">
            <div><Kw c="#4ade80">dex_factor</Kw><Dim> = </Dim><Kw c="#fbbf24">0.33</Kw><Dim> + </Dim><Kw c="#4ade80">dex_proficiency</Kw></div>
            <div><Kw c="#f87171">dex_used</Kw><Dim>     = </Dim><Kw c="#4ade80">current_dex</Kw><Dim> × </Dim><Kw c="#4ade80">dex_factor</Kw></div>
            <div><Kw c="#34d399">dex_recovered</Kw><Dim> = </Dim><Kw c="#6ee7b7">dex_posture</Kw><Dim> × </Dim><Kw c="#f87171">dex_used</Kw></div>
            <div><Kw c="#4ade80">next_dex</Kw><Dim>     = </Dim><Kw c="#4ade80">current_dex</Kw><Dim> − </Dim><Kw c="#f87171">dex_used</Kw><Dim> + </Dim><Kw c="#34d399">dex_recovered</Kw></div>
          </FormulaBox>
        </div>

        <div style={{ marginBottom: 22 }}>
          <SubLabel>Live Preview — Round 1</SubLabel>
          <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '18px 20px' }}>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 16 }}>
              <div style={{ flex: 1, minWidth: 120 }}>
                <label style={{ color: '#5a5a84', fontSize: 11.5, fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  DEX stat <span style={{ color: '#4ade80', fontWeight: 800, fontSize: 15 }}>{previewDex}</span>
                </label>
                <input type="range" min={1} max={300} value={previewDex} onChange={(e) => setPreviewDex(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#4ade80', cursor: 'pointer' }} />
              </div>
              <div style={{ flex: 1, minWidth: 120 }}>
                <label style={{ color: '#5a5a84', fontSize: 11.5, fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  Dex Prof <span style={{ color: '#4ade80', fontWeight: 800, fontSize: 15 }}>{previewDexProf}%</span>
                </label>
                <input type="range" min={0} max={100} value={previewDexProf} onChange={(e) => setPreviewDexProf(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#4ade80', cursor: 'pointer' }} />
              </div>
              <div style={{ flex: 1, minWidth: 120 }}>
                <label style={{ color: '#5a5a84', fontSize: 11.5, fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  Dex Posture <span style={{ color: '#34d399', fontWeight: 800, fontSize: 15 }}>{previewDexPosture}%</span>
                </label>
                <input type="range" min={0} max={100} value={previewDexPosture} onChange={(e) => setPreviewDexPosture(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#34d399', cursor: 'pointer' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {[
                { label: 'DEX factor', val: `${(dexFactor * 100).toFixed(0)}%`, color: '#4ade80' },
                { label: 'DEX used (attack)', val: dexUsed.toFixed(1), color: '#f87171' },
                { label: 'DEX recovered', val: dexRecovered.toFixed(1), color: '#34d399' },
                { label: 'DEX next round', val: dexRemaining.toFixed(1), color: '#4ade80' },
                { label: 'Retention rate', val: `${((dexRemaining / previewDex) * 100).toFixed(1)}%`, color: dexRemaining / previewDex >= 0.7 ? '#4ade80' : dexRemaining / previewDex >= 0.4 ? '#fbbf24' : '#e94560' },
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
            { title: 'High Prof, No Posture', desc: 'Maximum damage output per round — but your DEX bleeds out fast. By round 3–4 you are attacking on fumes. Ideal for short brutal fights.', color: '#f87171', rgb: '248,113,113' },
            { title: 'High Posture', desc: 'DEX recovery keeps your damage consistent across long battles. A hero with 100% Posture never loses any DEX — perfect for marathon chains.', color: '#34d399', rgb: '52,211,153' },
            { title: 'Base 33%', desc: 'Every hero has a built-in 33% DEX factor. Even without any Dex Proficiency investment, DEX contributes — and it still decays each round.', color: '#4ade80', rgb: '74,222,128' },
            { title: 'Green Sword Badge', desc: 'When a hero\'s total DEX factor reaches 80% or higher, a green sword badge appears in the Battle Simulator — a sign of a DEX-specialist at work.', color: '#a3e635', rgb: '163,230,53' },
          ].map(({ title, desc, color, rgb }) => (
            <div key={title} style={{ background: `rgba(${rgb},0.05)`, border: `1px solid rgba(${rgb},0.15)`, borderLeft: `3px solid ${color}`, borderRadius: 9, padding: '12px 14px' }}>
              <div style={{ color, fontWeight: 700, fontSize: 12.5, marginBottom: 5, fontFamily: 'Inter, sans-serif' }}>{title}</div>
              <div style={{ color: '#4a4a72', fontSize: 12, lineHeight: 1.65, fontFamily: 'Inter, sans-serif' }}>{desc}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 7 — SPELL MASTERY
      ══════════════════════════════════════════════════════════════════════ */}
      <SectionCard icon={<Sparkles size={16} />} title="Spell Mastery" color="#c084fc">
        <p style={{ color: '#5a5a84', fontSize: 13, lineHeight: 1.8, margin: '0 0 20px', fontFamily: 'Inter, sans-serif' }}>
          Spell Mastery makes your hero an arcane virtuoso — they channel abilities with less mana and extract more
          power from the most advanced techniques. It is the stat that separates a hero who <em>uses</em> spells
          from one who <span style={{ color: '#c084fc', fontWeight: 600 }}>masters</span> them.
        </p>

        <div style={{ marginBottom: 22 }}>
          <SubLabel>Spell Mastery Effects</SubLabel>
          <FormulaBox color="192,132,252">
            <div><Kw c="#c084fc">effective_cost</Kw><Dim> = </Dim><Kw c="#a78bfa">mana_cost</Kw><Dim> × (</Dim><Kw c="#4ade80">1</Kw><Dim> − </Dim><Kw c="#c084fc">spell_mastery</Kw><Dim>)</Dim></div>
            <div style={{ marginTop: 4, color: '#555575', fontSize: 12 }}>— for Tier 3 spells only —</div>
            <div><Kw c="#fbbf24">mastery_mult</Kw><Dim> = </Dim><Kw c="#4ade80">1.0</Kw><Dim> + </Dim><Kw c="#c084fc">spell_mastery</Kw></div>
            <div><Kw c="#fbbf24">stat_bonus</Kw><Dim> = </Dim><Kw c="#a78bfa">base_bonus</Kw><Dim> × </Dim><Kw c="#fbbf24">mastery_mult</Kw></div>
          </FormulaBox>
        </div>

        <div style={{ marginBottom: 22 }}>
          <SubLabel>Live Preview</SubLabel>
          <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '18px 20px' }}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ color: '#5a5a84', fontSize: 11.5, fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                Spell Mastery <span style={{ color: '#c084fc', fontWeight: 800, fontSize: 15 }}>{previewSpellMastery}%</span>
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
                <div style={{ color: '#6a6a40', fontSize: 10, fontFamily: 'Inter, sans-serif', marginBottom: 4, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Tier 3 spell stat amplification</div>
                <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: 14, fontFamily: 'Inter, sans-serif' }}>×{(1 + spellMasteryDec).toFixed(2)} multiplier on all T3 stat bonuses</div>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { title: 'Mana Efficiency', desc: 'With 50% Mastery, every spell costs half its listed mana — effectively doubling your spell budget per battle without a single mana investment.', color: '#c084fc', rgb: '192,132,252' },
            { title: 'Tier 3 Amplification', desc: 'T3 spells are the rarest and most powerful ability tier. Mastery boosts their stat bonuses — a 100% mastery hero doubles every T3 effect.', color: '#fbbf24', rgb: '251,191,36' },
          ].map(({ title, desc, color, rgb }) => (
            <div key={title} style={{ background: `rgba(${rgb},0.05)`, border: `1px solid rgba(${rgb},0.15)`, borderLeft: `3px solid ${color}`, borderRadius: 9, padding: '12px 14px' }}>
              <div style={{ color, fontWeight: 700, fontSize: 12.5, marginBottom: 5, fontFamily: 'Inter, sans-serif' }}>{title}</div>
              <div style={{ color: '#4a4a72', fontSize: 12, lineHeight: 1.65, fontFamily: 'Inter, sans-serif' }}>{desc}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 8 — SPELL ACTIVATION
      ══════════════════════════════════════════════════════════════════════ */}
      <SectionCard icon={<Flame size={16} />} title="Spell Activation" color="#e879f9">
        <p style={{ color: '#5a5a84', fontSize: 13, lineHeight: 1.8, margin: '0 0 20px', fontFamily: 'Inter, sans-serif' }}>
          Every spell has a base activation chance — the probability it fires when the conditions are met.
          Spell Activation is a flat bonus added to that chance, making your abilities{' '}
          <span style={{ color: '#e879f9', fontWeight: 600 }}>trigger more reliably every round</span>.
          It applies to ability spells of all tiers and to weapon spells alike.
        </p>

        <div style={{ marginBottom: 22 }}>
          <SubLabel>Spell Activation Formula</SubLabel>
          <FormulaBox color="232,121,249">
            <div><Kw c="#e879f9">effective_chance</Kw><Dim> = min(</Dim><Kw c="#4ade80">1.0</Kw><Dim>, </Dim><Kw c="#a0a0c0">base_chance</Kw><Dim> + </Dim><Kw c="#e879f9">spell_activation</Kw><Dim>)</Dim></div>
            <div><Dim>if random() {'<'} </Dim><Kw c="#e879f9">effective_chance</Kw><Dim>: spell fires</Dim></div>
          </FormulaBox>
        </div>

        <div style={{ marginBottom: 22 }}>
          <SubLabel>Live Preview</SubLabel>
          <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '18px 20px' }}>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 16 }}>
              <div style={{ flex: 1, minWidth: 160 }}>
                <label style={{ color: '#5a5a84', fontSize: 11.5, fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  Spell base chance <span style={{ color: '#a0a0c0', fontWeight: 800, fontSize: 15 }}>{previewBaseChance}%</span>
                </label>
                <input type="range" min={0} max={100} value={previewBaseChance} onChange={(e) => setPreviewBaseChance(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#a0a0c0', cursor: 'pointer' }} />
              </div>
              <div style={{ flex: 1, minWidth: 160 }}>
                <label style={{ color: '#5a5a84', fontSize: 11.5, fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  Spell Activation <span style={{ color: '#e879f9', fontWeight: 800, fontSize: 15 }}>{previewSpellAct}%</span>
                </label>
                <input type="range" min={0} max={100} value={previewSpellAct} onChange={(e) => setPreviewSpellAct(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#e879f9', cursor: 'pointer' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '10px 14px' }}>
                <div style={{ color: '#3e3e60', fontSize: 10, fontFamily: 'Inter, sans-serif', marginBottom: 4 }}>Base chance</div>
                <div style={{ color: '#a0a0c0', fontWeight: 800, fontSize: 17, fontFamily: 'Inter, sans-serif' }}>{previewBaseChance}%</div>
              </div>
              <div style={{ color: '#444466', fontSize: 18, fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>+</div>
              <div style={{ flex: 1, background: 'rgba(232,121,249,0.07)', border: '1px solid rgba(232,121,249,0.2)', borderRadius: 8, padding: '10px 14px' }}>
                <div style={{ color: '#3e3e60', fontSize: 10, fontFamily: 'Inter, sans-serif', marginBottom: 4 }}>Activation bonus</div>
                <div style={{ color: '#e879f9', fontWeight: 800, fontSize: 17, fontFamily: 'Inter, sans-serif' }}>+{previewSpellAct}%</div>
              </div>
              <div style={{ color: '#444466', fontSize: 18, fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>=</div>
              <div style={{ flex: 1, background: effectiveChance >= 100 ? 'rgba(74,222,128,0.08)' : 'rgba(232,121,249,0.06)', border: `1px solid ${effectiveChance >= 100 ? 'rgba(74,222,128,0.25)' : 'rgba(232,121,249,0.18)'}`, borderRadius: 8, padding: '10px 14px' }}>
                <div style={{ color: '#3e3e60', fontSize: 10, fontFamily: 'Inter, sans-serif', marginBottom: 4 }}>Effective trigger chance</div>
                <div style={{ color: effectiveChance >= 100 ? '#4ade80' : '#e879f9', fontWeight: 800, fontSize: 17, fontFamily: 'Inter, sans-serif' }}>
                  {effectiveChance}%{effectiveChance >= 100 ? ' (guaranteed)' : ''}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { title: 'All Spell Tiers', desc: 'Spell Activation boosts every ability tier — T1, T2, T3, T4 — and every weapon spell. No build is left behind.', color: '#e879f9', rgb: '232,121,249' },
            { title: 'Capped at 100%', desc: 'Effective chance is capped at 100%. Once you reach guaranteed activation, additional Spell Activation is wasted — invest elsewhere.', color: '#f87171', rgb: '248,113,113' },
            { title: 'Seal Contribution', desc: 'Your hero\'s seal level grants Spell Activation alongside Magic Proficiency and Crit Chance. Upgrading your seal is a passive spell reliability boost.', color: '#fbbf24', rgb: '251,191,36' },
            { title: 'Synergy With Mastery', desc: 'Spell Activation fires spells more often. Spell Mastery makes each cast cheaper and stronger. Together they define a spell-engine hero.', color: '#a78bfa', rgb: '167,139,250' },
          ].map(({ title, desc, color, rgb }) => (
            <div key={title} style={{ background: `rgba(${rgb},0.05)`, border: `1px solid rgba(${rgb},0.15)`, borderLeft: `3px solid ${color}`, borderRadius: 9, padding: '12px 14px' }}>
              <div style={{ color, fontWeight: 700, fontSize: 12.5, marginBottom: 5, fontFamily: 'Inter, sans-serif' }}>{title}</div>
              <div style={{ color: '#4a4a72', fontSize: 12, lineHeight: 1.65, fontFamily: 'Inter, sans-serif' }}>{desc}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 9 — XP & LEVELING
      ══════════════════════════════════════════════════════════════════════ */}
      <SectionCard icon={<Star size={16} />} title="XP & Leveling" color="#fbbf24">
        <p style={{ color: '#5a5a84', fontSize: 13, lineHeight: 1.8, margin: '0 0 20px', fontFamily: 'Inter, sans-serif' }}>
          Heroes earn XP by <span style={{ color: '#fbbf24', fontWeight: 600 }}>winning clashes</span> in battle.
          Each victory rewards XP based on the defeated hero's level — the tougher the opponent, the bigger the reward.
          Summons earn XP only when their team wins the entire battle.
        </p>

        <div style={{ marginBottom: 22 }}>
          <SubLabel>XP Formula</SubLabel>
          <FormulaBox color="251,191,36">
            <div><Kw c="#fbbf24">base_xp</Kw><Dim>    = 4 + 2 × </Dim><Kw c="#60a5fa">opponent_level</Kw></div>
            <div><Kw c="#4ade80">total_xp</Kw><Dim>   = </Dim><Kw c="#fbbf24">base_xp</Kw><Dim> × (1 + </Dim><Kw c="#a78bfa">exp_bonus</Kw><Dim>)</Dim></div>
          </FormulaBox>
        </div>

        <div style={{ marginBottom: 22 }}>
          <SubLabel>How It Accumulates</SubLabel>
          <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '16px 20px', color: '#5a5a84', fontSize: 13, lineHeight: 1.9, fontFamily: 'Inter, sans-serif' }}>
            A hero can win <span style={{ color: '#fbbf24', fontWeight: 600 }}>multiple clashes</span> in a single battle — XP stacks from each one.
            A hero who defeats three opponents in a row earns XP three times, making high-stamina heroes especially efficient at farming experience.
            Heroes that lose every clash they enter earn <span style={{ color: '#e94560', fontWeight: 600 }}>no XP</span>.
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { title: 'Exp Bonus', desc: 'Gained from summon auras, equipment, and abilities. A 15% Exp Bonus on 20 base XP yields 23 XP — the multiplier applies after the base is calculated.', color: '#fbbf24', rgb: '251,191,36' },
            { title: 'Opponent Level Matters', desc: 'Fighting higher-level opponents rewards more XP per clash. A level 20 opponent gives 44 base XP; a level 5 gives only 14. Seek strong opponents to level faster.', color: '#fb923c', rgb: '251,146,60' },
            { title: 'Summons Level Slowly', desc: 'Summons earn only 1 XP per battle, and only on a win. Their growth is tied to your win rate — not individual clash performance.', color: '#a78bfa', rgb: '167,139,250' },
            { title: 'Level-Up Effect', desc: "Leveling up increases your hero's base stats. Prioritize XP gain early to compound stat growth — a level advantage snowballs over time.", color: '#4ade80', rgb: '74,222,128' },
          ].map(({ title, desc, color, rgb }) => (
            <div key={title} style={{ background: `rgba(${rgb},0.05)`, border: `1px solid rgba(${rgb},0.15)`, borderLeft: `3px solid ${color}`, borderRadius: 9, padding: '12px 14px' }}>
              <div style={{ color, fontWeight: 700, fontSize: 12.5, marginBottom: 5, fontFamily: 'Inter, sans-serif' }}>{title}</div>
              <div style={{ color: '#4a4a72', fontSize: 12, lineHeight: 1.65, fontFamily: 'Inter, sans-serif' }}>{desc}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard icon={<Coins size={16} />} title="Gold & Gold Bonus" color="#fbbf24">
        <p style={{ color: '#5a5a84', fontSize: 13, lineHeight: 1.8, margin: '0 0 20px', fontFamily: 'Inter, sans-serif' }}>
          Gold is the primary currency, earned from <span style={{ color: '#fbbf24', fontWeight: 600 }}>arena battles</span>.
          Every fight rewards gold regardless of outcome — winners earn more.
          The <span style={{ color: '#fbbf24', fontWeight: 600 }}>Gold Bonus</span> stat multiplies your base gold reward, stacking additively across all sources.
        </p>

        <div style={{ marginBottom: 22 }}>
          <SubLabel>Gold Formula</SubLabel>
          <FormulaBox color="251,191,36">
            <div><Kw c="#a3a3c2">base_gold</Kw><Dim>  = 2 (win) or 1 (loss)</Dim></div>
            <div><Kw c="#fbbf24">total_gold</Kw><Dim> = </Dim><Kw c="#a3a3c2">base_gold</Kw><Dim> × (1 + </Dim><Kw c="#fbbf24">gold_bonus</Kw><Dim>)</Dim></div>
            <div style={{ marginTop: 6 }}><Kw c="#4ade80">item_disc</Kw><Dim>  → chance of +1 bonus gold on top</Dim></div>
          </FormulaBox>
        </div>

        <div style={{ marginBottom: 22 }}>
          <SubLabel>Sources of Gold Bonus</SubLabel>
          <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '16px 20px', color: '#5a5a84', fontSize: 13, lineHeight: 1.9, fontFamily: 'Inter, sans-serif' }}>
            Gold Bonus accumulates from your <span style={{ color: '#fbbf24', fontWeight: 600 }}>summon's aura</span>, equipped <span style={{ color: '#fbbf24', fontWeight: 600 }}>weapons</span>, hero <span style={{ color: '#fbbf24', fontWeight: 600 }}>abilities</span>, and bought <span style={{ color: '#fbbf24', fontWeight: 600 }}>upgrades</span> in the shop.
            All sources are summed additively. A team with 50% Gold Bonus turns a 2-gold win into 3 gold, and a 1-gold loss into 1 gold (rounded).
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { title: 'Win vs Loss', desc: 'Winning grants 2 base gold; losing grants 1. Gold Bonus applies to both — so even losses are worth farming if your bonus is high.', color: '#fbbf24', rgb: '251,191,36' },
            { title: 'Gold Bonus Stacks Additively', desc: 'If your summon grants +20% and a weapon grants +15%, your total Gold Bonus is 35%. There is no hard cap.', color: '#4ade80', rgb: '74,222,128' },
            { title: 'Battle Result Breakdown', desc: 'After each arena battle the result screen shows: base gold + bonus amount (%) = total. Gold is awarded even if you lose.', color: '#a78bfa', rgb: '167,139,250' },
          ].map(({ title, desc, color, rgb }) => (
            <div key={title} style={{ background: `rgba(${rgb},0.05)`, border: `1px solid rgba(${rgb},0.15)`, borderLeft: `3px solid ${color}`, borderRadius: 9, padding: '12px 14px' }}>
              <div style={{ color, fontWeight: 700, fontSize: 12.5, marginBottom: 5, fontFamily: 'Inter, sans-serif' }}>{title}</div>
              <div style={{ color: '#4a4a72', fontSize: 12, lineHeight: 1.65, fontFamily: 'Inter, sans-serif' }}>{desc}</div>
            </div>
          ))}
        </div>
      </SectionCard>

    </div>
  );
}
