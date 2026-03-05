import { Coins } from 'lucide-react';
import type { ShopItemResponse } from '../../types';
import EquipmentTooltip from '../Equipment/EquipmentTooltip';

interface Props {
  item: ShopItemResponse;
  onBuy: (templateId: number) => void;
  playerGold: number;
  disabled?: boolean;
}

type ItemTier = 'COMMON' | 'RARE' | 'LEGENDARY';

// ── Tier config ───────────────────────────────────────────────────────────────
export function getItemTier(cost: number): ItemTier {
  if (cost >= 600) return 'LEGENDARY';
  if (cost >= 300) return 'RARE';
  return 'COMMON';
}

const TIER_CFG: Record<ItemTier, { label: string; color: string; glow: string; bg: string }> = {
  COMMON: {
    label: 'Common',
    color: '#9ca3af',
    glow: 'rgba(156,163,175,0.18)',
    bg: 'linear-gradient(160deg, rgba(156,163,175,0.07) 0%, rgba(26,26,46,0.9) 100%)',
  },
  RARE: {
    label: 'Rare',
    color: '#a78bfa',
    glow: 'rgba(167,139,250,0.28)',
    bg: 'linear-gradient(160deg, rgba(167,139,250,0.1) 0%, rgba(26,26,46,0.9) 100%)',
  },
  LEGENDARY: {
    label: 'Legendary',
    color: '#f97316',
    glow: 'rgba(249,115,22,0.32)',
    bg: 'linear-gradient(160deg, rgba(249,115,22,0.12) 0%, rgba(26,26,46,0.9) 100%)',
  },
};

// ── Item → icon mapping ───────────────────────────────────────────────────────
const ITEM_ICON: Record<string, string> = {
  'Training Weights': '🏋️',
  'Iron Kunai':       '🗡️',
  'Chakra Scroll':    '📜',
  'Mana Crystal':     '💎',
  'Swift Boots':      '👟',
  'Warrior Armor':    '🛡️',
  'Mystic Tome':      '📖',
  'Shadow Cloak':     '🌑',
  'Legendary Blade':  '⚔️',
  'Sage Staff':       '📿',
};

// ── Stat display config ───────────────────────────────────────────────────────
const STAT_CFG: Record<string, { label: string; color: string; icon: string }> = {
  physicalAttack: { label: 'PA',    color: '#f97316', icon: '⚔'  },
  magicPower:     { label: 'MP',    color: '#60a5fa', icon: '✦'  },
  dexterity:      { label: 'Dex',   color: '#4ade80', icon: '◈'  },
  mana:           { label: 'Mana',  color: '#818cf8', icon: '◆'  },
  stamina:        { label: 'Stam',  color: '#fb923c', icon: '◉'  },
  element:        { label: 'Elem',  color: '#facc15', icon: '⚡' },
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function ShopItemCard({ item, onBuy, playerGold, disabled }: Props) {
  const bonusEntries = Object.entries(item.bonuses).filter(([, v]) => v !== 0);
  const canAfford    = playerGold >= item.cost;
  const tier         = getItemTier(item.cost);
  const tc           = TIER_CFG[tier];
  const icon         = ITEM_ICON[item.name] ?? '📦';

  return (
    <EquipmentTooltip name={item.name} type="item" bonuses={item.bonuses}>
      <div
        style={{
          position: 'relative',
          padding: '18px 14px 14px',
          borderRadius: 12,
          border: `1px solid ${tc.color}38`,
          background: tc.bg,
          boxShadow: `0 4px 24px ${tc.glow}, inset 0 0 0 1px ${tc.color}14`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          overflow: 'hidden',
          transition: 'transform 0.15s, box-shadow 0.15s',
          cursor: 'default',
        }}
      >
        {/* Top color bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: 3, background: tc.color,
          boxShadow: `0 0 8px ${tc.color}`,
        }} />

        {/* Tier badge */}
        <div style={{
          position: 'absolute', top: 10, right: 10,
          fontSize: 9, fontWeight: 800, letterSpacing: '0.1em',
          textTransform: 'uppercase' as const,
          padding: '2px 7px', borderRadius: 8,
          background: tc.color + '22',
          border: `1px solid ${tc.color}55`,
          color: tc.color,
        }}>
          {tc.label}
        </div>

        {/* Icon circle */}
        <div style={{
          width: 62, height: 62, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: tc.color + '16',
          border: `2px solid ${tc.color}44`,
          boxShadow: `0 0 16px ${tc.glow}`,
          marginTop: 6,
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 28, lineHeight: 1 }}>{icon}</span>
        </div>

        {/* Name */}
        <div style={{
          color: '#e8e8f0', fontWeight: 700, fontSize: 14,
          textAlign: 'center', lineHeight: 1.25, marginTop: 2,
        }}>
          {item.name}
        </div>

        {/* Stat chips */}
        {bonusEntries.length > 0 && (
          <div style={{
            display: 'flex', flexWrap: 'wrap' as const,
            gap: 4, justifyContent: 'center',
          }}>
            {bonusEntries.map(([stat, val]) => {
              const sc = STAT_CFG[stat] ?? { label: stat, color: '#9ca3af', icon: '·' };
              return (
                <div key={stat} style={{
                  display: 'flex', alignItems: 'center', gap: 3,
                  padding: '3px 8px', borderRadius: 6,
                  background: sc.color + '14',
                  border: `1px solid ${sc.color}45`,
                }}>
                  <span style={{ color: sc.color, fontSize: 10, lineHeight: 1 }}>{sc.icon}</span>
                  <span style={{ color: sc.color, fontWeight: 800, fontSize: 12, lineHeight: 1 }}>+{val}</span>
                  <span style={{ color: sc.color + 'aa', fontSize: 10, lineHeight: 1 }}>{sc.label}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Gold cost */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
          <span style={{ color: '#fbbf24', filter: 'drop-shadow(0 0 5px rgba(251,191,36,0.7))', display: 'flex' }}>
            <Coins size={15} />
          </span>
          <span style={{
            color: '#fbbf24', fontWeight: 800, fontSize: 17, lineHeight: 1,
            textShadow: '0 0 8px rgba(251,191,36,0.5)',
          }}>
            {item.cost.toLocaleString()}
          </span>
          <span style={{ color: '#fbbf2470', fontSize: 10, fontWeight: 600,
            textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>
            gold
          </span>
        </div>

        {/* Buy button */}
        <button
          onClick={() => onBuy(item.templateId)}
          disabled={disabled || !canAfford}
          style={{
            width: '100%',
            padding: '7px 14px',
            border: `1px solid ${canAfford ? tc.color + '80' : '#333'}`,
            borderRadius: 6,
            fontSize: 11, fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase' as const,
            cursor: canAfford ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s',
            background: canAfford
              ? `linear-gradient(135deg, ${tc.color}dd, ${tc.color}99)`
              : '#1e1e30',
            color: canAfford ? '#fff' : '#4a4a6a',
            boxShadow: canAfford ? `0 2px 12px ${tc.glow}` : 'none',
            marginTop: 2,
          }}
        >
          {canAfford ? 'Purchase' : 'Not enough gold'}
        </button>
      </div>
    </EquipmentTooltip>
  );
}
