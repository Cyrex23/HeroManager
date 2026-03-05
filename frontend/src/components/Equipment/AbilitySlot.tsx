import { useState } from 'react';
import type { HeroAbilityEntry } from '../../types';
import EquipmentTooltip from './EquipmentTooltip';
import AbilityTierIcon from './AbilityTierIcon';

interface Props {
  ability: HeroAbilityEntry;
  onUnequip: (slotNumber: number) => void;
  emptySlots?: Array<{ slotNumber: number }>;
  onEquip?: (slotNumber: number) => void;
}

const TIER_CFG: Record<number, { label: string; color: string; glow: string; bg: string }> = {
  1: { label: 'Tier I',   color: '#9ca3af', glow: 'rgba(156,163,175,0.18)', bg: 'linear-gradient(160deg, rgba(156,163,175,0.07) 0%, rgba(26,26,46,0.9) 100%)' },
  2: { label: 'Tier II',  color: '#38bdf8', glow: 'rgba(56,189,248,0.25)',  bg: 'linear-gradient(160deg, rgba(56,189,248,0.1) 0%, rgba(26,26,46,0.9) 100%)'  },
  3: { label: 'Tier III', color: '#a78bfa', glow: 'rgba(167,139,250,0.28)', bg: 'linear-gradient(160deg, rgba(167,139,250,0.1) 0%, rgba(26,26,46,0.9) 100%)' },
  4: { label: 'Tier IV',  color: '#fb923c', glow: 'rgba(251,146,60,0.32)',  bg: 'linear-gradient(160deg, rgba(251,146,60,0.12) 0%, rgba(26,26,46,0.9) 100%)' },
};

const STAT_CFG: Record<string, { label: string; color: string; icon: string }> = {
  physicalAttack: { label: 'PA',   color: '#f97316', icon: '⚔'  },
  magicPower:     { label: 'MP',   color: '#60a5fa', icon: '✦'  },
  dexterity:      { label: 'Dex',  color: '#4ade80', icon: '◈'  },
  mana:           { label: 'Mana', color: '#818cf8', icon: '◆'  },
  stamina:        { label: 'Stam', color: '#fb923c', icon: '◉'  },
  element:        { label: 'Elem', color: '#facc15', icon: '⚡' },
};

export default function AbilitySlot({ ability, onUnequip, emptySlots, onEquip }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const tc = TIER_CFG[ability.tier] ?? TIER_CFG[1];
  const bonusEntries = Object.entries(ability.bonuses).filter(([, v]) => v !== 0);
  const isEquipped = ability.slotNumber !== null;
  const canEquip = !isEquipped && emptySlots !== undefined && onEquip !== undefined;

  return (
    <EquipmentTooltip
      name={ability.name}
      type="ability"
      bonuses={ability.bonuses}
      tier={ability.tier}
      copies={ability.copies}
      spell={ability.spell ?? null}
    >
      <div style={{
        position: 'relative',
        padding: '14px 14px 12px',
        borderRadius: 10,
        border: `1px solid ${tc.color}38`,
        background: tc.bg,
        boxShadow: `0 4px 20px ${tc.glow}, inset 0 0 0 1px ${tc.color}14`,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        overflow: 'hidden',
        cursor: 'default',
        height: '100%',
        boxSizing: 'border-box',
      }}>
        {/* Top color bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: 3, background: tc.color,
          boxShadow: `0 0 8px ${tc.color}`,
        }} />

        {/* Tier badge (top-right) */}
        <div style={{
          position: 'absolute', top: 8, right: 8,
          fontSize: 8, fontWeight: 800, letterSpacing: '0.1em',
          textTransform: 'uppercase' as const,
          padding: '2px 6px', borderRadius: 6,
          background: tc.color + '22',
          border: `1px solid ${tc.color}55`,
          color: tc.color,
        }}>
          {tc.label}
        </div>

        {/* SPELL badge (top-left) */}
        {ability.spell && (
          <div style={{
            position: 'absolute', top: 8, left: 8,
            fontSize: 8, fontWeight: 800, letterSpacing: '0.05em',
            padding: '2px 5px', borderRadius: 6,
            background: 'rgba(96,165,250,0.15)',
            border: '1px solid rgba(96,165,250,0.35)',
            color: '#60a5fa',
            textTransform: 'uppercase' as const,
          }}>
            SPELL
          </div>
        )}

        {/* Icon + Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
          <AbilityTierIcon tier={ability.tier} size={36} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              color: '#e8e8f0', fontWeight: 700, fontSize: 13, lineHeight: 1.25,
              whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {ability.name}
            </div>
            {isEquipped && (
              <div style={{
                color: '#4ade80', fontSize: 9, fontWeight: 700,
                letterSpacing: '0.06em', textTransform: 'uppercase' as const, marginTop: 2,
              }}>
                ✓ Slot {ability.slotNumber}
              </div>
            )}
          </div>
        </div>

        {/* Stat chips */}
        {bonusEntries.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 4 }}>
            {bonusEntries.map(([stat, val]) => {
              const sc = STAT_CFG[stat] ?? { label: stat, color: '#9ca3af', icon: '·' };
              return (
                <div key={stat} style={{
                  display: 'flex', alignItems: 'center', gap: 3,
                  padding: '2px 7px', borderRadius: 6,
                  background: sc.color + '14',
                  border: `1px solid ${sc.color}45`,
                }}>
                  <span style={{ color: sc.color, fontSize: 9, lineHeight: 1 }}>{sc.icon}</span>
                  <span style={{ color: sc.color, fontWeight: 800, fontSize: 11, lineHeight: 1 }}>+{val}</span>
                  <span style={{ color: sc.color + 'aa', fontSize: 9, lineHeight: 1 }}>{sc.label}</span>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* Unslot button (only if slotted) */}
        {isEquipped && (
          <button
            onClick={() => onUnequip(ability.slotNumber!)}
            style={{
              padding: '5px 12px',
              background: 'transparent',
              border: `1px solid ${tc.color}33`,
              borderRadius: 5,
              color: tc.color + 'cc',
              fontSize: 10, fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase' as const,
              cursor: 'pointer',
              alignSelf: 'flex-start',
            }}
          >
            Unslot
          </button>
        )}

        {/* Equip button (only if not slotted) */}
        {canEquip && (
          <div style={{ position: 'relative' as const }} onClick={(e) => e.stopPropagation()}>
            <button
              disabled={emptySlots!.length === 0}
              onClick={() => setPickerOpen((o) => !o)}
              style={{
                padding: '5px 12px',
                background: emptySlots!.length > 0
                  ? `linear-gradient(135deg, ${tc.color}dd, ${tc.color}99)`
                  : '#1e1e30',
                border: `1px solid ${emptySlots!.length > 0 ? tc.color + '80' : '#333'}`,
                borderRadius: 5,
                color: emptySlots!.length > 0 ? '#fff' : '#4a4a6a',
                fontSize: 10, fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase' as const,
                cursor: emptySlots!.length > 0 ? 'pointer' : 'not-allowed',
                boxShadow: emptySlots!.length > 0 ? `0 2px 10px ${tc.glow}` : 'none',
              }}
            >
              {emptySlots!.length === 0 ? 'No Empty Slots' : '+ Equip'}
            </button>
            {pickerOpen && emptySlots!.length > 0 && (
              <div
                style={{ position: 'absolute' as const, bottom: 'calc(100% + 6px)', left: 0, zIndex: 50, backgroundColor: '#0e0e1e', border: '1px solid #2a2a4e', borderRadius: 7, padding: '4px', boxShadow: '0 4px 16px rgba(0,0,0,0.8)', minWidth: 120 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ color: '#44446a', fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, padding: '3px 8px 5px', borderBottom: '1px solid #1a1a35' }}>
                  Choose slot
                </div>
                {emptySlots!.map((s) => (
                  <button
                    key={s.slotNumber}
                    onClick={() => { onEquip!(s.slotNumber); setPickerOpen(false); }}
                    style={{ display: 'block', width: '100%', textAlign: 'left' as const, padding: '6px 10px', background: 'transparent', border: 'none', color: '#c0c0d8', fontSize: 12, fontWeight: 600, cursor: 'pointer', borderRadius: 4 }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#ffffff10'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
                  >
                    Slot {s.slotNumber}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </EquipmentTooltip>
  );
}
