import { useState } from 'react';
import { BookOpen, Activity, AlertTriangle, Sword, Shuffle, Zap, Wind, Sparkles, Flame, Star, Coins, Shield, Droplets, Biohazard } from 'lucide-react';

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
            Placing a hero in a slot of a <em>different tier</em> reduces their stamina before effectiveness is
            calculated. The required stamina scales with the hero's level and the slot's tier. The{' '}
            <span style={{ color: '#fbbf24', fontWeight: 700 }}>Off-Positioning</span> sub-stat directly reduces the
            maximum possible penalty cap — a 50% Off-Positioning stat halves every slot's maximum penalty, letting
            you freely mis-slot heroes at the cost of stacking this rare attribute.
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
                    <span style={{ color: '#44446a' }}>Max penalty:</span>
                    <span style={{ color, fontWeight: 800, fontSize: 14 }}>{maxPenalty}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p style={{ color: '#333355', fontSize: 11.5, lineHeight: 1.7, margin: '0 0 18px', fontFamily: 'Inter, sans-serif', fontStyle: 'italic' }}>
            If hero_stamina ≥ required, no penalty applies regardless of the tier mismatch — building enough stamina can fully negate off-positioning for any slot.
          </p>

          {/* Off-Positioning stat explainer */}
          <SubLabel>Off-Positioning Sub-Stat</SubLabel>
          <InsightBox color="#94a3b8" rgb="148,163,184">
            <span style={{ color: '#fbbf24', fontWeight: 700 }}>Off-Positioning</span> is a rare sub-stat obtainable
            from equipment, weapons, and certain combos. It directly scales down the maximum penalty cap for every
            slot tier. A hero with 100% Off-Positioning suffers <em>zero</em> penalty no matter how mis-slotted they are.
          </InsightBox>

          {/* Interactive: show eff max penalty at different off-positioning values */}
          <div style={{ overflowX: 'auto', marginBottom: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, fontFamily: 'Inter, sans-serif' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left', color: '#44446a', fontWeight: 700 }}>Slot</th>
                  <th style={{ padding: '8px 12px', textAlign: 'center', color: '#44446a', fontWeight: 700 }}>Base max</th>
                  {[0, 25, 50, 75, 100].map(v => (
                    <th key={v} style={{ padding: '8px 12px', textAlign: 'center', color: v === 0 ? '#44446a' : '#fbbf24', fontWeight: 700 }}>
                      {v === 0 ? 'No stat' : `${v}% off-pos`}
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
            Off-Positioning is applied multiplicatively before the stamina check. Even partial values meaningfully reduce the worst-case scenario when intentionally mis-slotting strong heroes.
          </p>
        </div>
      </SectionCard>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 3 — TENACITY
      ══════════════════════════════════════════════════════════════════════ */}
      <SectionCard icon={<Activity size={16} />} title="Tenacity — Fatigue Resistance" color="#06b6d4">
        <p style={{ color: '#5a5a84', fontSize: 13, lineHeight: 1.8, margin: '0 0 16px', fontFamily: 'Inter, sans-serif' }}>
          Tenacity reduces the penalty your hero takes from consecutive hits. The effect is most powerful in long battles
          where your hero survives many rounds — each time an opponent strings wins together, Tenacity softens how much
          your damage output drops. Stamina prevents capacity loss from exhaustion; Tenacity mitigates the penalty
          <em> once that exhaustion kicks in</em>.
        </p>

        <div style={{ marginBottom: 18 }}>
          <SubLabel>How It Works</SubLabel>
          <InsightBox color="#06b6d4" rgb="6,182,212">
            After the raw capacity modifier is computed from consecutive wins + stamina effectiveness, Tenacity
            applies a <span style={{ color: '#06b6d4', fontWeight: 700 }}>percentage reduction to the damage penalty</span>.
            A hero with 200 Tenacity halves every consecutive-win penalty. The stat is flat (not a %) — higher
            numbers give more resistance, with diminishing returns above 60.
          </InsightBox>
          <FormulaBox color="6,182,212">
            <div><Kw c="#06b6d4">eff_ten</Kw><Dim> = t ≤ 60 ? t : </Dim><Kw c="#4ade80">60</Kw><Dim> + (t−60)×60 / (t−60+60)</Dim></div>
            <div><Kw c="#f97316">penalty</Kw><Dim> = (</Dim><Kw c="#4ade80">1</Kw><Dim> − </Dim><Kw c="#fbbf24">raw_capacity</Kw><Dim>) × </Dim><Kw c="#4ade80">200</Kw><Dim> / (</Dim><Kw c="#4ade80">200</Kw><Dim> + </Dim><Kw c="#06b6d4">eff_ten</Kw><Dim>)</Dim></div>
            <div><Kw c="#fbbf24">final_capacity</Kw><Dim> = </Dim><Kw c="#4ade80">1</Kw><Dim> − </Dim><Kw c="#f97316">penalty</Kw></div>
          </FormulaBox>
        </div>

        <div style={{ marginBottom: 18 }}>
          <SubLabel>Soft Cap at 60</SubLabel>
          <p style={{ color: '#5a5a84', fontSize: 12.5, lineHeight: 1.7, margin: '0 0 12px', fontFamily: 'Inter, sans-serif' }}>
            Tenacity has diminishing returns above 60. Each additional point above the cap yields less effective
            Tenacity. The table below shows effective values at key breakpoints:
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, fontFamily: 'Inter, sans-serif' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  {(['Raw', 30, 60, 80, 100, 130, 160, 200] as (string | number)[]).map(v => (
                    <th key={String(v)} style={{ padding: '7px 12px', textAlign: 'center', color: v === 'Raw' ? '#44446a' : (v as number) <= 60 ? '#06b6d4' : '#22d3ee', fontWeight: 700 }}>{v}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '7px 12px', textAlign: 'center', color: '#44446a', fontWeight: 700 }}>Effective</td>
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
          <SubLabel>Example — Consecutive Win Penalty at Round 2</SubLabel>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: 'Inter, sans-serif' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  {['Sta Eff.', 'Raw Cap', 'Ten 0', 'Ten 50', 'Ten 100', 'Ten 200'].map(h => (
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
            Tenacity only activates when consecutive wins create a penalty (consecWins &gt; 0). On the first win of a streak it has no effect.
          </p>
        </div>
      </SectionCard>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 4 — FATIGUE RECOVERY
      ══════════════════════════════════════════════════════════════════════ */}
      <SectionCard icon={<Droplets size={16} />} title="Fatigue Recovery — Capacity Window Boost" color="#34d399">
        <p style={{ color: '#5a5a84', fontSize: 13, lineHeight: 1.8, margin: '0 0 16px', fontFamily: 'Inter, sans-serif' }}>
          Fatigue Recovery shifts the entire capacity window upward by a flat amount, raising both the minimum and maximum
          capacity your hero can output during consecutive-win rounds. Unlike Tenacity (which reduces the penalty percentage),
          Fatigue Recovery <em>adds directly to the result</em>, capped at 100%.
          It's a very powerful but rare attribute.
        </p>

        <div style={{ marginBottom: 18 }}>
          <SubLabel>How It Works</SubLabel>
          <InsightBox color="#34d399" rgb="52,211,153">
            After the raw capacity is computed (and optionally adjusted by Tenacity), Fatigue Recovery adds its effective
            value directly: <span style={{ color: '#34d399', fontWeight: 700 }}>capacity_final = min(1.0, capacity + eff_FR)</span>.
            Soft-capped at 30% — values above 30% give diminishing returns. Example: 70% Fatigue Recovery → effective 43%.
          </InsightBox>
          <FormulaBox color="52,211,153">
            <div><Kw c="#34d399">eff_FR</Kw><Dim> = fr ≤ 0.30 ? fr : </Dim><Kw c="#4ade80">0.30</Kw><Dim> + (fr−0.30)×0.30 / (fr−0.30+0.50)</Dim></div>
            <div><Kw c="#fbbf24">capacity_final</Kw><Dim> = min(</Dim><Kw c="#4ade80">1.0</Kw><Dim>, </Dim><Kw c="#fbbf24">capacity</Kw><Dim> + </Dim><Kw c="#34d399">eff_FR</Kw><Dim>)</Dim></div>
          </FormulaBox>
        </div>

        <div style={{ marginBottom: 18 }}>
          <SubLabel>Soft Cap at 30%</SubLabel>
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
          <SubLabel>Example — 10% Fatigue Recovery</SubLabel>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: 'Inter, sans-serif' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  {['Turn', 'Base capacity range', 'With 10% Fat. Rec.'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: h === 'Turn' ? 'center' : 'left', color: '#44446a', fontWeight: 700 }}>{h}</th>
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
            Fatigue Recovery only activates when consecutive wins create a penalty (consecWins &gt; 0). Stacks with Tenacity — Tenacity reduces the penalty first, then Fatigue Recovery adds on top.
          </p>
        </div>
      </SectionCard>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 5 — CLEANSE
      ══════════════════════════════════════════════════════════════════════ */}
      <SectionCard icon={<Sparkles size={16} />} title="Cleanse — Condition Removal" color="#a5f3fc">
        <p style={{ color: '#5a5a84', fontSize: 13, lineHeight: 1.8, margin: '0 0 16px', fontFamily: 'Inter, sans-serif' }}>
          Cleanse gives a hero a percentage chance each round to automatically remove all negative conditions
          applied by the opposing hero. Currently the only condition is <span style={{ color: '#4ade80', fontWeight: 600 }}>Rot</span>,
          but as new status effects are added to the game, Cleanse will counter all of them.
        </p>

        <div style={{ marginBottom: 18 }}>
          <SubLabel>How It Works</SubLabel>
          <InsightBox color="#a5f3fc" rgb="165,243,252">
            At the start of each round, before any conditions are applied, the game rolls against the hero's Cleanse %.
            A successful roll <span style={{ color: '#a5f3fc', fontWeight: 700 }}>removes all active conditions instantly</span> —
            the conditions have no effect that round or any future round until reapplied by the opponent.
          </InsightBox>
          <FormulaBox color="165,243,252">
            <div><Dim>each round: </Dim><Kw c="#f97316">roll</Kw><Dim> = random [0, 1)</Dim></div>
            <div><Kw c="#4ade80">if</Kw><Dim> roll &lt; </Dim><Kw c="#a5f3fc">cleanse_chance</Kw><Dim> → all conditions removed</Dim></div>
          </FormulaBox>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ background: 'rgba(165,243,252,0.04)', border: '1px solid rgba(165,243,252,0.15)', borderTop: '2px solid #a5f3fc', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ color: '#a5f3fc', fontWeight: 800, fontSize: 13, marginBottom: 8, fontFamily: 'Inter, sans-serif' }}>Timing</div>
            <p style={{ color: '#5a5a84', fontSize: 12, lineHeight: 1.6, margin: 0, fontFamily: 'Inter, sans-serif' }}>
              Cleanse triggers <strong style={{ color: '#b0b0d0' }}>before</strong> conditions are evaluated. A successful
              cleanse means the condition deals zero effect for that round and is fully removed from the hero's state.
            </p>
          </div>
          <div style={{ background: 'rgba(165,243,252,0.04)', border: '1px solid rgba(165,243,252,0.15)', borderTop: '2px solid #a5f3fc', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ color: '#a5f3fc', fontWeight: 800, fontSize: 13, marginBottom: 8, fontFamily: 'Inter, sans-serif' }}>No Soft Cap</div>
            <p style={{ color: '#5a5a84', fontSize: 12, lineHeight: 1.6, margin: 0, fontFamily: 'Inter, sans-serif' }}>
              Unlike Stamina or Fatigue Recovery, Cleanse has no soft cap. 60% Cleanse gives a true 60% chance
              per round. Stacking multiple sources adds up directly.
            </p>
          </div>
          <div style={{ background: 'rgba(165,243,252,0.04)', border: '1px solid rgba(165,243,252,0.15)', borderTop: '2px solid #a5f3fc', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ color: '#a5f3fc', fontWeight: 800, fontSize: 13, marginBottom: 8, fontFamily: 'Inter, sans-serif' }}>Reapplication</div>
            <p style={{ color: '#5a5a84', fontSize: 12, lineHeight: 1.6, margin: 0, fontFamily: 'Inter, sans-serif' }}>
              Cleansing removes the condition entirely. The opponent can reapply it the same round if they have the
              stat for it — Cleanse does not grant immunity, only reactive removal.
            </p>
          </div>
          <div style={{ background: 'rgba(165,243,252,0.04)', border: '1px solid rgba(165,243,252,0.15)', borderTop: '2px solid #a5f3fc', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ color: '#a5f3fc', fontWeight: 800, fontSize: 13, marginBottom: 8, fontFamily: 'Inter, sans-serif' }}>Future Conditions</div>
            <p style={{ color: '#5a5a84', fontSize: 12, lineHeight: 1.6, margin: 0, fontFamily: 'Inter, sans-serif' }}>
              Cleanse is designed to counter <em>all</em> opponent-applied conditions. Any future status effect added
              to the game will automatically be removed by a successful Cleanse roll.
            </p>
          </div>
        </div>
      </SectionCard>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 6 — ATTACK (FLAT)
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
          DEX MAX POSTURE
      ══════════════════════════════════════════════════════════════════════ */}
      <SectionCard icon={<Activity size={16} />} title="Dex Max Posture — Passive DEX Regeneration" color="#6ee7b7">
        <p style={{ color: '#5a5a84', fontSize: 13, lineHeight: 1.8, margin: '0 0 20px', fontFamily: 'Inter, sans-serif' }}>
          Dex Max Posture is a rare sub-stat that recovers DEX each round as a fraction of the hero's
          <span style={{ color: '#6ee7b7', fontWeight: 600 }}> maximum DEX</span>, regardless of how much was spent.
          Unlike Dex Posture (which scales with DEX used), this stat provides a flat passive regeneration floor —
          making it especially valuable for heroes who spend DEX heavily.
        </p>

        <div style={{ marginBottom: 20 }}>
          <SubLabel>Formula</SubLabel>
          <FormulaBox color="110,231,183">
            <div><Kw c="#6ee7b7">recovery</Kw><Dim> = </Dim><Kw c="#34d399">dex_used</Kw><Dim> × </Dim><Kw c="#6ee7b7">dex_posture</Kw><Dim> + </Dim><Kw c="#fbbf24">max_dex</Kw><Dim> × </Dim><Kw c="#6ee7b7">dex_max_posture</Kw></div>
            <div style={{ marginTop: 4 }}><Kw c="#4ade80">next_dex</Kw><Dim> = </Dim><Kw c="#fbbf24">current_dex</Kw><Dim> − </Dim><Kw c="#34d399">dex_used</Kw><Dim> + </Dim><Kw c="#6ee7b7">recovery</Kw></div>
          </FormulaBox>
        </div>

        <div style={{ marginBottom: 20 }}>
          <SubLabel>Example</SubLabel>
          <FormulaBox color="110,231,183">
            <div><Dim>Hero has </Dim><Kw c="#fbbf24">100 DEX</Kw><Dim>, spent </Dim><Kw c="#f87171">40</Kw><Dim>, Dex Posture </Dim><Kw c="#6ee7b7">20%</Kw><Dim>, Dex Max Posture </Dim><Kw c="#6ee7b7">10%</Kw></div>
            <div style={{ marginTop: 4 }}><Kw c="#6ee7b7">recovery</Kw><Dim> = 40 × 0.20 + 100 × 0.10 = </Dim><Kw c="#4ade80">8 + 10 = 18</Kw></div>
            <div style={{ marginTop: 4 }}><Kw c="#4ade80">next_dex</Kw><Dim> = 100 − 40 + 18 = </Dim><Kw c="#fbbf24">78</Kw></div>
          </FormulaBox>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { title: 'vs. Dex Posture', desc: 'Dex Posture recovers a % of DEX used — so it weakens as your DEX pool shrinks. Dex Max Posture always scales off your full base DEX, providing a stable recovery floor.', color: '#6ee7b7', rgb: '110,231,183' },
            { title: 'Rare Sub-stat', desc: 'Dex Max Posture is intentionally rare. It can only be obtained from specific high-tier equipment, weapons, or abilities — it cannot be gained from common sources.', color: '#fbbf24', rgb: '251,191,36' },
            { title: 'Stacks Additively', desc: 'Dex Max Posture adds its contribution on top of the standard Dex Posture recovery. Both stats work simultaneously — they are not mutually exclusive.', color: '#34d399', rgb: '52,211,153' },
            { title: 'Best for DEX Fighters', desc: 'Heroes who rely on high Dex Proficiency benefit most — they spend more DEX per round, making the flat Max DEX recovery proportionally more impactful.', color: '#a5f3fc', rgb: '165,243,252' },
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

      {/* ══════════════════════════════════════════════════════════════════════
          IMMUNITIES
      ══════════════════════════════════════════════════════════════════════ */}
      <SectionCard icon={<Shield size={16} />} title="Immunities — Damage Reduction" color="#34d399">
        <p style={{ color: '#5a5a84', fontSize: 13, lineHeight: 1.8, margin: '0 0 20px', fontFamily: 'Inter, sans-serif' }}>
          Immunities reduce how much damage a hero takes from a specific damage component each round.
          Each type targets one of the three core damage sources: <span style={{ color: '#f87171', fontWeight: 600 }}>Physical Attack</span>,{' '}
          <span style={{ color: '#60a5fa', fontWeight: 600 }}>Magic Power</span>, and{' '}
          <span style={{ color: '#4ade80', fontWeight: 600 }}>Dexterity</span>.
        </p>

        <div style={{ marginBottom: 22 }}>
          <SubLabel>The Three Immunity Types</SubLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            {[
              { title: 'Physical Immunity', color: '#f87171', rgb: '248,113,113', desc: 'Reduces the PA contribution of incoming attacks. A 30% Physical Immunity means only 70% of the opponent\'s PA component lands.' },
              { title: 'Magic Immunity', color: '#60a5fa', rgb: '96,165,250', desc: 'Reduces the MP contribution of incoming attacks. Because MP is rolled randomly each round, Magic Immunity becomes even more valuable when facing high-MP enemies.' },
              { title: 'Dex Evasiveness', color: '#4ade80', rgb: '74,222,128', desc: 'Reduces the DEX contribution of incoming attacks. Counters fast DEX-heavy heroes who rely on dexterity output for consistent damage.' },
            ].map(({ title, color, rgb, desc }) => (
              <div key={title} style={{ background: `rgba(${rgb},0.05)`, border: `1px solid rgba(${rgb},0.15)`, borderLeft: `3px solid ${color}`, borderRadius: 9, padding: '12px 14px' }}>
                <div style={{ color, fontWeight: 700, fontSize: 12.5, marginBottom: 5, fontFamily: 'Inter, sans-serif' }}>{title}</div>
                <div style={{ color: '#4a4a72', fontSize: 12, lineHeight: 1.65, fontFamily: 'Inter, sans-serif' }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 22 }}>
          <SubLabel>How It Works in Battle</SubLabel>
          <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '16px 20px', color: '#5a5a84', fontSize: 13, lineHeight: 1.9, fontFamily: 'Inter, sans-serif' }}>
            During each clash, each damage component is reduced individually before being summed into the total attack.
            For example, if your hero has <span style={{ color: '#34d399', fontWeight: 600 }}>25% Physical Immunity</span>, the opponent's PA contribution is multiplied by <strong style={{ color: '#e2e2ff' }}>0.75</strong> before it counts.
            The battle log shows both the immunity percentage and the exact amount of damage denied per component — visible under each attacker's PA / MP / Dex lines.
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { title: 'Stacks Up', desc: 'The higher the immunity value, the less damage that component deals. A 50% Physical Immunity cuts the PA contribution in half every round.', color: '#34d399', rgb: '52,211,153' },
            { title: 'Stacks Additively', desc: 'Multiple sources of the same immunity type (summons, equipment, abilities) add together. 10% + 15% = 25% total.', color: '#60a5fa', rgb: '96,165,250' },
            { title: 'Multiple Sources', desc: 'Immunities can come from summons, hero abilities, craftable weapons, buyable weapons, or spell stats — any source stacks additively.', color: '#a78bfa', rgb: '167,139,250' },
            { title: 'Denied Damage Visible', desc: 'In the detailed battle log breakdown, you can see exactly how much damage each immunity blocked per round — labelled with a 🛡 shield under the attacker\'s stats.', color: '#fbbf24', rgb: '251,191,36' },
          ].map(({ title, desc, color, rgb }) => (
            <div key={title} style={{ background: `rgba(${rgb},0.05)`, border: `1px solid rgba(${rgb},0.15)`, borderLeft: `3px solid ${color}`, borderRadius: 9, padding: '12px 14px' }}>
              <div style={{ color, fontWeight: 700, fontSize: 12.5, marginBottom: 5, fontFamily: 'Inter, sans-serif' }}>{title}</div>
              <div style={{ color: '#4a4a72', fontSize: 12, lineHeight: 1.65, fontFamily: 'Inter, sans-serif' }}>{desc}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ══════════════════════════════════════════════════════════════════════
          MANA RECHARGE
      ══════════════════════════════════════════════════════════════════════ */}
      <SectionCard icon={<Droplets size={16} />} title="Mana Recharge — Passive Recovery" color="#38bdf8">
        <p style={{ color: '#5a5a84', fontSize: 13, lineHeight: 1.8, margin: '0 0 20px', fontFamily: 'Inter, sans-serif' }}>
          Mana Recharge is a passive aura stat that recovers a percentage of your team's{' '}
          <span style={{ color: '#38bdf8', fontWeight: 600 }}>missing mana</span> at the end of every round —
          after spells fire but before the round closes. The more mana has been spent, the more gets returned.
        </p>

        <div style={{ marginBottom: 22 }}>
          <SubLabel>The Formula</SubLabel>
          <div style={{ background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.18)', borderRadius: 10, padding: '16px 20px', color: '#5a5a84', fontSize: 13, lineHeight: 1.9, fontFamily: 'Inter, sans-serif' }}>
            <strong style={{ color: '#38bdf8' }}>Mana Recovered = Mana Recharge % × Missing Mana</strong>
            <br />
            Missing Mana = Mana Total − Current Mana
            <br /><br />
            Example: Mana Total = <strong style={{ color: '#e2e2ff' }}>100</strong>, Current Mana = <strong style={{ color: '#e2e2ff' }}>60</strong>, Mana Recharge = <strong style={{ color: '#38bdf8' }}>8%</strong>
            <br />
            → Missing = 40 &nbsp;→&nbsp; Recovery = 40 × 0.08 = <strong style={{ color: '#4ade80' }}>+3.2 mana</strong>
            <br /><br />
            Recovery is capped at Mana Total — you can never overfill. As mana approaches full, recovery diminishes naturally.
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { title: 'Diminishing Returns', desc: 'Because recovery is based on missing mana, the more mana you have the less you recover per round. A full mana pool returns nothing — it naturally self-balances.', color: '#38bdf8', rgb: '56,189,248' },
            { title: 'Fires Every Round', desc: 'If the current hero has Mana Recharge, it triggers at the end of every round — including rounds where no spells were cast — as long as mana is not already full.', color: '#60a5fa', rgb: '96,165,250' },
            { title: 'Synergy With Spells', desc: 'The higher your spell costs and the more spells fire, the more missing mana there is — making Mana Recharge scale better on spell-heavy teams.', color: '#c084fc', rgb: '192,132,252' },
            { title: 'Multiple Sources', desc: 'Mana Recharge can come from summons, hero abilities, weapons, or spells. Any source that grants the stat contributes to the total recovered each round.', color: '#a78bfa', rgb: '167,139,250' },
          ].map(({ title, desc, color, rgb }) => (
            <div key={title} style={{ background: `rgba(${rgb},0.05)`, border: `1px solid rgba(${rgb},0.15)`, borderLeft: `3px solid ${color}`, borderRadius: 9, padding: '12px 14px' }}>
              <div style={{ color, fontWeight: 700, fontSize: 12.5, marginBottom: 5, fontFamily: 'Inter, sans-serif' }}>{title}</div>
              <div style={{ color: '#4a4a72', fontSize: 12, lineHeight: 1.65, fontFamily: 'Inter, sans-serif' }}>{desc}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ══════════════════════════════════════════════════════════════════════
          SPELL LEARN
      ══════════════════════════════════════════════════════════════════════ */}
      <SectionCard icon={<BookOpen size={16} />} title="Spell Learn — Steal the Enemy's Arsenal" color="#a78bfa">
        <p style={{ color: '#5a5a84', fontSize: 13, lineHeight: 1.8, margin: '0 0 20px', fontFamily: 'Inter, sans-serif' }}>
          Spell Learn gives your hero a percentage chance to{' '}
          <span style={{ color: '#a78bfa', fontWeight: 600 }}>permanently learn an opponent's ability spell</span>{' '}
          the moment it is fired — and then cast it themselves in subsequent rounds.
          Learned spells remain active for the rest of the battle, until the hero is eliminated.
        </p>

        <div style={{ marginBottom: 22 }}>
          <SubLabel>How It Works</SubLabel>
          <div style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.18)', borderRadius: 10, padding: '16px 20px', color: '#5a5a84', fontSize: 13, lineHeight: 1.9, fontFamily: 'Inter, sans-serif' }}>
            When the opponent fires an <strong style={{ color: '#e2e2ff' }}>ability spell</strong>, your Spell Learn % is rolled.
            On success, your hero learns that spell and will attempt to cast it every round —
            consuming mana from your team's mana pool, subject to its normal trigger chance and mana cost.
            <br /><br />
            A hero can accumulate <strong style={{ color: '#a78bfa' }}>multiple learned spells</strong> over a battle — one for each successful learn roll.
            All learned spells are cleared when the hero is eliminated and the next hero enters.
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { title: 'Ability Spells Only', desc: 'Spell Learn only triggers on opponent ability spells — not weapon spells. Weapon spells are too fleeting to be learned during battle.', color: '#a78bfa', rgb: '167,139,250' },
            { title: 'Purple ◈ in Battle Log', desc: 'Learned spells appear as a ★ LEARNED badge the round they are acquired, then fire with a ◈ icon in purple in all subsequent rounds.', color: '#c084fc', rgb: '192,132,252' },
            { title: 'Uses Your Mana Pool', desc: 'Learned spells cost mana from your own team pool — just like your native spells. High Spell Learn rates demand a healthy mana supply to sustain.', color: '#38bdf8', rgb: '56,189,248' },
            { title: 'Multiple Sources', desc: 'Spell Learn can come from summons, hero abilities, weapons, or spell stats. Any source granting the stat contributes to the per-spell learn chance.', color: '#fbbf24', rgb: '251,191,36' },
          ].map(({ title, desc, color, rgb }) => (
            <div key={title} style={{ background: `rgba(${rgb},0.05)`, border: `1px solid rgba(${rgb},0.15)`, borderLeft: `3px solid ${color}`, borderRadius: 9, padding: '12px 14px' }}>
              <div style={{ color, fontWeight: 700, fontSize: 12.5, marginBottom: 5, fontFamily: 'Inter, sans-serif' }}>{title}</div>
              <div style={{ color: '#4a4a72', fontSize: 12, lineHeight: 1.65, fontFamily: 'Inter, sans-serif' }}>{desc}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ══════════════════════════════════════════════════════════════════════
          SPELL COPY
      ══════════════════════════════════════════════════════════════════════ */}
      <SectionCard icon={<Shuffle size={16} />} title="Spell Copy — Instant Mirror Cast" color="#f87171">
        <p style={{ color: '#5a5a84', fontSize: 13, lineHeight: 1.8, margin: '0 0 20px', fontFamily: 'Inter, sans-serif' }}>
          Spell Copy gives your hero a percentage chance to{' '}
          <span style={{ color: '#f87171', fontWeight: 600 }}>instantly mirror an opponent's ability spell</span>{' '}
          the moment it fires — at <strong style={{ color: '#4ade80' }}>zero mana cost</strong>.
          The copy fires in the same round, but is not retained afterwards.
        </p>

        <div style={{ marginBottom: 22 }}>
          <SubLabel>How It Works</SubLabel>
          <div style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.18)', borderRadius: 10, padding: '16px 20px', color: '#5a5a84', fontSize: 13, lineHeight: 1.9, fontFamily: 'Inter, sans-serif' }}>
            When the opponent fires an <strong style={{ color: '#e2e2ff' }}>ability spell</strong>, your Spell Copy % is rolled.
            On success, your hero immediately casts an identical version of that spell —
            applying its full stat bonuses to your own attack — without spending any mana.
            <br /><br />
            The copy is <strong style={{ color: '#f87171' }}>one-time only</strong>: it fires this round and is gone.
            Unlike Spell Learn, nothing is retained between rounds.
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { title: 'Free Mana', desc: 'Copied spells cost 0 mana. You get the full spell effect without touching your mana pool — making Copy valuable even on mana-starved teams.', color: '#4ade80', rgb: '74,222,128' },
            { title: 'Red ✦ in Battle Log', desc: "Copied spells appear in red in the battle log — distinct from your own purple spells and the opponent's fuchsia spells.", color: '#f87171', rgb: '248,113,113' },
            { title: 'Ability Spells Only', desc: 'Like Spell Learn, Spell Copy only triggers on opponent ability spells, not weapon spells.', color: '#a78bfa', rgb: '167,139,250' },
            { title: 'Multiple Sources', desc: 'Spell Copy can come from summons, hero abilities, weapons, or spell stats. Independent roll from Spell Learn — both can trigger on the same spell in the same round.', color: '#fbbf24', rgb: '251,191,36' },
          ].map(({ title, desc, color, rgb }) => (
            <div key={title} style={{ background: `rgba(${rgb},0.05)`, border: `1px solid rgba(${rgb},0.15)`, borderLeft: `3px solid ${color}`, borderRadius: 9, padding: '12px 14px' }}>
              <div style={{ color, fontWeight: 700, fontSize: 12.5, marginBottom: 5, fontFamily: 'Inter, sans-serif' }}>{title}</div>
              <div style={{ color: '#4a4a72', fontSize: 12, lineHeight: 1.65, fontFamily: 'Inter, sans-serif' }}>{desc}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ══════════════════════════════════════════════════════════════════════
          SPELL ABSORB
      ══════════════════════════════════════════════════════════════════════ */}
      <SectionCard icon={<Shield size={16} />} title="Spell Absorb — Block and Drain" color="#34d399">
        <p style={{ color: '#5a5a84', fontSize: 13, lineHeight: 1.8, margin: '0 0 20px', fontFamily: 'Inter, sans-serif' }}>
          Spell Absorb gives your hero a percentage chance to{' '}
          <span style={{ color: '#34d399', fontWeight: 600 }}>completely block an opponent's spell</span>{' '}
          — nullifying its effect entirely while{' '}
          <span style={{ color: '#38bdf8', fontWeight: 600 }}>stealing the mana cost</span>{' '}
          from the caster and adding it to your own pool.
        </p>

        <div style={{ marginBottom: 22 }}>
          <SubLabel>How It Works</SubLabel>
          <div style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.18)', borderRadius: 10, padding: '16px 20px', color: '#5a5a84', fontSize: 13, lineHeight: 1.9, fontFamily: 'Inter, sans-serif' }}>
            When the opponent fires <strong style={{ color: '#e2e2ff' }}>any spell</strong> (ability or weapon), your Spell Absorb % is rolled.
            On success, the spell is blocked — its stat bonuses are cancelled and deal no effect.
            The caster still loses the mana cost, but instead of it being spent, your team{' '}
            <strong style={{ color: '#4ade80' }}>gains that mana</strong>.
            <br /><br />
            This makes Absorb especially powerful against costly spells:
            blocking a 30-mana spell means the opponent loses 30 mana <em>and</em> you gain 30.
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { title: 'Works on All Spells', desc: 'Unlike Learn and Copy, Spell Absorb checks against both ability spells and weapon spells — it is the broadest of the three reactive mechanics.', color: '#34d399', rgb: '52,211,153' },
            { title: '⊘ Blocked in Battle Log', desc: 'Absorbed spells appear with a ⊘ BLOCKED label in grey in the battle log — both in the round summary and the detailed attacker/defender breakdown.', color: '#6b7280', rgb: '107,114,128' },
            { title: 'Mana Swing', desc: 'Each absorb creates a double mana swing: the opponent loses the spell cost AND you gain it. Against high-mana spells, a single absorb can shift the entire mana economy.', color: '#38bdf8', rgb: '56,189,248' },
            { title: 'Multiple Sources', desc: 'Spell Absorb can come from summons, hero abilities, weapons, or spell stats. Rolls independently from Learn and Copy — all three can technically trigger on the same spell, though only one can affect the mana outcome.', color: '#fbbf24', rgb: '251,191,36' },
          ].map(({ title, desc, color, rgb }) => (
            <div key={title} style={{ background: `rgba(${rgb},0.05)`, border: `1px solid rgba(${rgb},0.15)`, borderLeft: `3px solid ${color}`, borderRadius: 9, padding: '12px 14px' }}>
              <div style={{ color, fontWeight: 700, fontSize: 12.5, marginBottom: 5, fontFamily: 'Inter, sans-serif' }}>{title}</div>
              <div style={{ color: '#4a4a72', fontSize: 12, lineHeight: 1.65, fontFamily: 'Inter, sans-serif' }}>{desc}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard icon={<Biohazard size={16} />} title="Rot — Spreading Immunity Decay" color="#dc2626">
        <p style={{ color: '#4a4a72', fontSize: 13, lineHeight: 1.75, marginBottom: 14, fontFamily: 'Inter, sans-serif' }}>
          Rot is a dark status effect. When active, it gives your hero a percentage chance each round to{' '}
          <strong style={{ color: '#e2e2ff' }}>infect the opposing hero</strong>, weakening all of their immunities for several turns.
          Like a spreading disease, the affliction decays naturally over time — but crits extend its duration and stacking reapplication makes it worse.
        </p>

        <div style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
          <div style={{ color: '#dc2626', fontWeight: 800, fontSize: 12, marginBottom: 10, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'Inter, sans-serif' }}>How Rot Works</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Trigger', value: 'Rolled each round after attack. If the attacker\'s Rot % succeeds, the defender is afflicted for several turns.' },
              { label: 'Duration', value: '3 turns base. +1 extra turn for every 10% of Dex Proficiency above 30% (e.g. 50% Dex Prof = +2 bonus turns = 5 total).' },
              { label: 'Immunity Reduction', value: 'Each turn, the afflicted hero loses X% of all their immunities (Physical, Magic, Dex Evasiveness). This is multiplicative — 10% immunity with 33% rot becomes 10% × 0.67 = 6.7%.' },
              { label: 'Decay Formula', value: 'Reduction = (maxReduction + stackBonus) × remainingTurns / totalTurns. Starts strong and weakens each turn as it decays.' },
              { label: 'Max Reduction', value: 'Scales with Dex Proficiency of the attacker: min(75%, 50% + DexProf × 50%). Without any DexProf, max is 50%.' },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', gap: 10, fontSize: 12.5, fontFamily: 'Inter, sans-serif' }}>
                <span style={{ color: '#dc2626', fontWeight: 700, minWidth: 130, flexShrink: 0 }}>{label}</span>
                <span style={{ color: '#4a4a72', lineHeight: 1.6 }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
          <div style={{ color: '#dc2626', fontWeight: 800, fontSize: 12, marginBottom: 10, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'Inter, sans-serif' }}>Special Interactions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Crit Extends Rot', value: 'When an attacker crits against a hero already under Rot, both remainingTurns and totalTurns increase by 1 — keeping the decay curve intact but lasting longer.' },
              { label: 'Stacking', value: 'Reapplying Rot to a hero already afflicted adds +3% to the stackBonus (max +15%). This raises the effective max reduction beyond the base cap, up to 75% + 15% = 90% in extreme cases.' },
              { label: 'Immunity Required', value: 'Rot only has visible effect on heroes who have Physical, Magic, or Dex Evasiveness immunities. Heroes with no immunities are unaffected.' },
              { label: 'Battle Log', value: 'When a hero is Rotting, the reduced immunity values still appear in the log — allowing you to see the exact weakened state used during the damage calculation.' },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', gap: 10, fontSize: 12.5, fontFamily: 'Inter, sans-serif' }}>
                <span style={{ color: '#dc2626', fontWeight: 700, minWidth: 130, flexShrink: 0 }}>{label}</span>
                <span style={{ color: '#4a4a72', lineHeight: 1.6 }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
          {[
            { title: 'Multiple Sources', desc: 'Rot can come from summons, hero abilities, craftable weapons, buyable weapons, or spell stats. Any source granting the Rot stat contributes to the per-round infection chance.', color: '#dc2626', rgb: '220,38,38' },
            { title: 'Dex Proficiency Synergy', desc: 'Higher Dex Proficiency increases both the duration and the max reduction of Rot.', color: '#ef4444', rgb: '239,68,68' },
            { title: 'Immunity Counter', desc: 'Rot is a direct counter to high-immunity builds. A hero stacking Physical and Magic immunities becomes significantly weaker under sustained Rot pressure.', color: '#f87171', rgb: '248,113,113' },
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
