import { useState } from 'react';
import { BookOpen, Activity, AlertTriangle } from 'lucide-react';

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
    desc: 'Raw melee and weapon power. The primary offensive stat for most heroes. Scales with every stat purchase, equipment, and ability bonus.',
  },
  {
    abbr: 'MP', label: 'Magic Power', color: '#60a5fa', rgb: '96,165,250',
    desc: "Arcane and spell damage. Amplified by hero abilities and your summon's team-wide MP aura. Dominant in magic-focused roster builds.",
  },
  {
    abbr: 'DEX', label: 'Dexterity', color: '#4ade80', rgb: '74,222,128',
    desc: 'Speed and precision. Contributes to total attack and improves critical hit chance and evasion in the sub-stat table.',
  },
  {
    abbr: 'ELEM', label: 'Element', color: '#facc15', rgb: '250,204,21',
    desc: "Elemental affinity. Deals bonus damage when your element counters your opponent's — Fire beats Wind, Water beats Fire, Lightning beats Earth, Wind beats Lightning, Earth beats Water.",
  },
  {
    abbr: 'MANA', label: 'Mana', color: '#a78bfa', rgb: '167,139,250',
    desc: 'Ability fuel. Heroes share a single mana pool per battle — every spell fired costs mana from this pool. Summons add a flat bonus to the pool.',
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

// ── shared section wrapper ────────────────────────────────────────────────────
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
      {/* ambient glow corner */}
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

// ── label used throughout ─────────────────────────────────────────────────────
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

// ── main page ─────────────────────────────────────────────────────────────────
export default function GuidePage() {
  const [previewStam, setPreviewStam] = useState(80);
  const [previewLevel, setPreviewLevel] = useState(15);

  const staEff = Math.min(1.0, previewStam / (60 + previewLevel * 2.5));
  const effPct = staEff * 100;

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', padding: '4px 0 64px' }}>

      {/* ── Page header ──────────────────────────────────────────────────────── */}
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

        {/* Element chain */}
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
          SECTION 2 — STAMINA DEEP DIVE
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

        {/* ── Stamina Effectiveness ───────────────────────────────────────── */}
        <div style={{ marginBottom: 26 }}>
          <SubLabel>Stamina Effectiveness Formula</SubLabel>
          <div style={{
            background: 'rgba(251,113,133,0.05)',
            border: '1px solid rgba(251,113,133,0.18)',
            borderRadius: 10, padding: '18px 22px',
          }}>
            {/* Formula line */}
            <div style={{
              fontFamily: 'monospace', fontSize: 14.5, lineHeight: 2.2,
              marginBottom: 14, letterSpacing: '0.01em',
            }}>
              <span style={{ color: '#fb7185', fontWeight: 700 }}>sta_eff</span>
              <span style={{ color: '#444466' }}> = min(</span>
              <span style={{ color: '#4ade80' }}>1.0</span>
              <span style={{ color: '#444466' }}>, </span>
              <span style={{ color: '#fb7185' }}>hero_stamina</span>
              <span style={{ color: '#444466' }}> / (</span>
              <span style={{ color: '#fbbf24' }}>60</span>
              <span style={{ color: '#444466' }}> + </span>
              <span style={{ color: '#a78bfa' }}>level</span>
              <span style={{ color: '#444466' }}> × </span>
              <span style={{ color: '#fbbf24' }}>2.5</span>
              <span style={{ color: '#444466' }}>))</span>
            </div>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10,
            }}>
              {[
                { label: 'Min stamina needed for 100% at Lv.1', val: '62.5', color: '#60a5fa' },
                { label: 'Min stamina needed for 100% at Lv.25', val: '122.5', color: '#a78bfa' },
                { label: 'Min stamina needed for 100% at Lv.50', val: '185.0', color: '#fbbf24' },
              ].map(({ label, val, color }) => (
                <div key={label} style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 7, padding: '9px 11px',
                }}>
                  <div style={{ color, fontWeight: 800, fontSize: 18, fontFamily: 'Inter, sans-serif', lineHeight: 1 }}>{val}</div>
                  <div style={{ color: '#3e3e60', fontSize: 11, marginTop: 5, fontFamily: 'Inter, sans-serif', lineHeight: 1.4 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Interactive preview ─────────────────────────────────────────── */}
        <div style={{ marginBottom: 26 }}>
          <SubLabel>Live Preview</SubLabel>
          <div style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 10, padding: '18px 20px',
          }}>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 16 }}>
              <div style={{ flex: 1, minWidth: 160 }}>
                <label style={{
                  color: '#5a5a84', fontSize: 11.5, fontFamily: 'Inter, sans-serif',
                  display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8,
                }}>
                  Hero Stamina Stat
                  <span style={{ color: '#fb7185', fontWeight: 800, fontSize: 15 }}>{previewStam}</span>
                </label>
                <input
                  type="range" min={1} max={300} value={previewStam}
                  onChange={(e) => setPreviewStam(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#fb7185', cursor: 'pointer' }}
                />
              </div>
              <div style={{ flex: 1, minWidth: 160 }}>
                <label style={{
                  color: '#5a5a84', fontSize: 11.5, fontFamily: 'Inter, sans-serif',
                  display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8,
                }}>
                  Hero Level
                  <span style={{ color: '#a78bfa', fontWeight: 800, fontSize: 15 }}>{previewLevel}</span>
                </label>
                <input
                  type="range" min={1} max={50} value={previewLevel}
                  onChange={(e) => setPreviewLevel(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#a78bfa', cursor: 'pointer' }}
                />
              </div>
            </div>

            {/* Effectiveness readout */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <div style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 7, padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0,
              }}>
                <span style={{ color: '#3e3e60', fontSize: 10, fontFamily: 'Inter, sans-serif' }}>Required for 100%</span>
                <span style={{ color: '#fbbf24', fontWeight: 800, fontSize: 16, fontFamily: 'Inter, sans-serif' }}>
                  {(60 + previewLevel * 2.5).toFixed(1)}
                </span>
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 7, padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0,
              }}>
                <span style={{ color: '#3e3e60', fontSize: 10, fontFamily: 'Inter, sans-serif' }}>Stamina Effectiveness</span>
                <span style={{ color: capColor(effPct), fontWeight: 800, fontSize: 16, fontFamily: 'Inter, sans-serif' }}>
                  {effPct.toFixed(1)}%
                </span>
              </div>
              <div style={{ flex: 1, minWidth: 120 }}>
                <div style={{
                  height: 8, backgroundColor: 'rgba(255,255,255,0.06)',
                  borderRadius: 4, overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.min(100, effPct)}%`,
                    background: `linear-gradient(90deg, #e94560, ${capColor(effPct)})`,
                    borderRadius: 4,
                    transition: 'width 0.3s ease',
                    boxShadow: `0 0 8px ${capColor(effPct)}60`,
                  }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Turn Capacity table ─────────────────────────────────────────── */}
        <div style={{ marginBottom: 26 }}>
          <SubLabel>Turn Capacity — Attack % of Full Power</SubLabel>
          <p style={{
            color: '#4a4a72', fontSize: 12.5, lineHeight: 1.7,
            margin: '0 0 14px', fontFamily: 'Inter, sans-serif',
          }}>
            Each time a hero wins a clash, their capacity for the <em>next</em> clash drops based on stamina
            effectiveness. Losing a clash resets the chain to zero — a new opposing hero always starts fresh.
            The <span style={{ color: '#fbbf24', fontWeight: 600 }}>Preview</span> column updates with your
            sliders above.
          </p>

          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%', borderCollapse: 'collapse',
              fontFamily: 'Inter, sans-serif', fontSize: 12,
            }}>
              <thead>
                <tr>
                  <th style={{
                    color: '#44446a', fontWeight: 600, textAlign: 'left',
                    padding: '8px 12px 12px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.07)',
                    whiteSpace: 'nowrap',
                  }}>
                    Clash #
                  </th>
                  {CAPACITY_COLS.map(({ label, color }) => (
                    <th key={label} style={{
                      color, fontWeight: 700, textAlign: 'center',
                      padding: '8px 10px 12px',
                      borderBottom: '1px solid rgba(255,255,255,0.07)',
                      whiteSpace: 'nowrap',
                      fontSize: 11,
                    }}>
                      Eff {label}
                    </th>
                  ))}
                  <th style={{
                    color: '#fbbf24', fontWeight: 700, textAlign: 'center',
                    padding: '8px 10px 12px',
                    borderBottom: '1px solid rgba(255,255,255,0.07)',
                    whiteSpace: 'nowrap',
                    fontSize: 11,
                  }}>
                    Preview ({effPct.toFixed(1)}%)
                  </th>
                </tr>
              </thead>
              <tbody>
                {WIN_ROWS.map((wins) => {
                  const previewCap = getCapacity(wins, staEff);
                  const isFirst = wins === 0;
                  const clashLabel = wins === 7
                    ? '8th+ clash'
                    : `${ordinal(wins + 1)} clash`;

                  return (
                    <tr
                      key={wins}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        background: isFirst ? 'rgba(74,222,128,0.04)' : 'transparent',
                      }}
                    >
                      <td style={{ padding: '9px 12px 9px 0', color: '#7070a0', whiteSpace: 'nowrap' }}>
                        {clashLabel}
                        {isFirst && (
                          <span style={{
                            color: '#4ade80', fontSize: 9.5, fontWeight: 700,
                            marginLeft: 7, letterSpacing: '0.08em',
                            background: 'rgba(74,222,128,0.12)',
                            border: '1px solid rgba(74,222,128,0.25)',
                            borderRadius: 4, padding: '1px 5px',
                          }}>FRESH</span>
                        )}
                      </td>
                      {CAPACITY_COLS.map(({ val }) => {
                        const cap = getCapacity(wins, val);
                        const c = capColor(cap);
                        return (
                          <td key={val} style={{ padding: '9px 10px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                              <span style={{ color: c, fontWeight: 700, fontSize: 12.5 }}>
                                {cap.toFixed(1)}%
                              </span>
                              <div style={{
                                width: 56, height: 4,
                                backgroundColor: 'rgba(255,255,255,0.06)',
                                borderRadius: 2, overflow: 'hidden',
                              }}>
                                <div style={{
                                  height: '100%',
                                  width: `${Math.max(0, cap)}%`,
                                  backgroundColor: c,
                                  borderRadius: 2,
                                }} />
                              </div>
                            </div>
                          </td>
                        );
                      })}
                      {/* Preview column */}
                      <td style={{ padding: '9px 10px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                          <span style={{ color: capColor(previewCap), fontWeight: 800, fontSize: 13.5 }}>
                            {previewCap.toFixed(1)}%
                          </span>
                          <div style={{
                            width: 56, height: 6,
                            backgroundColor: 'rgba(255,255,255,0.07)',
                            borderRadius: 3, overflow: 'hidden',
                            border: '1px solid rgba(255,255,255,0.08)',
                          }}>
                            <div style={{
                              height: '100%',
                              width: `${Math.max(0, previewCap)}%`,
                              background: `linear-gradient(90deg, #fb7185, ${capColor(previewCap)})`,
                              borderRadius: 3,
                              transition: 'width 0.3s ease',
                              boxShadow: `0 0 4px ${capColor(previewCap)}80`,
                            }} />
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

        {/* ── Off-Positioning Penalty ─────────────────────────────────────── */}
        <div>
          <SubLabel>Off-Positioning Penalty</SubLabel>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
            <AlertTriangle size={14} color="#fbbf24" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{
              color: '#4a4a72', fontSize: 12.5, lineHeight: 1.7,
              margin: 0, fontFamily: 'Inter, sans-serif',
            }}>
              Placing a hero in a slot of a <em>different tier</em> reduces their stamina stat before effectiveness
              is calculated. The required stamina scales with the hero's level and the slot's tier. If the hero's
              stamina is below the slot's requirement, a proportional penalty is applied up to the slot's maximum.
            </p>
          </div>

          {/* Penalty formula */}
          <div style={{
            background: 'rgba(251,191,36,0.04)',
            border: '1px solid rgba(251,191,36,0.16)',
            borderRadius: 10, padding: '14px 18px', marginBottom: 16,
            fontFamily: 'monospace', fontSize: 13.5, lineHeight: 2.1,
          }}>
            <div>
              <span style={{ color: '#a78bfa', fontWeight: 700 }}>required</span>
              <span style={{ color: '#444466' }}> = </span>
              <span style={{ color: '#fbbf24' }}>base</span>
              <span style={{ color: '#444466' }}> + </span>
              <span style={{ color: '#a78bfa' }}>level</span>
              <span style={{ color: '#444466' }}> × </span>
              <span style={{ color: '#fbbf24' }}>3</span>
            </div>
            <div>
              <span style={{ color: '#f97316', fontWeight: 700 }}>penalty</span>
              <span style={{ color: '#444466' }}> = </span>
              <span style={{ color: '#fbbf24' }}>max_penalty</span>
              <span style={{ color: '#444466' }}> × max(</span>
              <span style={{ color: '#4ade80' }}>0</span>
              <span style={{ color: '#444466' }}>,  </span>
              <span style={{ color: '#4ade80' }}>1</span>
              <span style={{ color: '#444466' }}> − </span>
              <span style={{ color: '#fb7185' }}>hero_stamina</span>
              <span style={{ color: '#444466' }}> / </span>
              <span style={{ color: '#a78bfa' }}>required</span>
              <span style={{ color: '#444466' }}>)</span>
            </div>
            <div>
              <span style={{ color: '#fb7185', fontWeight: 700 }}>stamina_after</span>
              <span style={{ color: '#444466' }}> = </span>
              <span style={{ color: '#fb7185' }}>hero_stamina</span>
              <span style={{ color: '#444466' }}> × (</span>
              <span style={{ color: '#4ade80' }}>1</span>
              <span style={{ color: '#444466' }}> − </span>
              <span style={{ color: '#f97316' }}>penalty</span>
              <span style={{ color: '#444466' }}>)</span>
            </div>
          </div>

          {/* Tier cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 14 }}>
            {OFF_POS.map(({ tier, color, rgb, req, maxPenalty }) => (
              <div key={tier} style={{
                background: `rgba(${rgb},0.05)`,
                border: `1px solid rgba(${rgb},0.18)`,
                borderTop: `2px solid ${color}`,
                borderRadius: 10, padding: '14px 16px',
              }}>
                <div style={{
                  color, fontWeight: 800, fontSize: 14,
                  marginBottom: 12, fontFamily: 'Inter, sans-serif',
                  filter: `drop-shadow(0 0 6px rgba(${rgb},0.5))`,
                }}>
                  {tier} Slot
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[1, 25, 50].map((lvl) => (
                    <div key={lvl} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      fontSize: 12, fontFamily: 'Inter, sans-serif',
                    }}>
                      <span style={{ color: '#44446a' }}>Lv.{lvl} req:</span>
                      <span style={{ color: '#b0b0d0', fontWeight: 700 }}>{req(lvl)}</span>
                    </div>
                  ))}
                  <div style={{
                    marginTop: 6, paddingTop: 8,
                    borderTop: `1px solid rgba(${rgb},0.15)`,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    fontSize: 12, fontFamily: 'Inter, sans-serif',
                  }}>
                    <span style={{ color: '#44446a' }}>Max penalty:</span>
                    <span style={{ color, fontWeight: 800, fontSize: 14 }}>{maxPenalty}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p style={{
            color: '#333355', fontSize: 11.5, lineHeight: 1.7,
            margin: 0, fontFamily: 'Inter, sans-serif', fontStyle: 'italic',
          }}>
            If hero_stamina ≥ required, no penalty applies regardless of the tier mismatch — building enough
            stamina can fully negate off-positioning for any slot.
          </p>
        </div>
      </SectionCard>

    </div>
  );
}
