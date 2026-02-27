import type { ShopSummonResponse } from '../../types';
import HeroPortrait from '../Hero/HeroPortrait';
import CapBadge from '../Hero/CapBadge';

interface Props {
  summon: ShopSummonResponse;
  playerGold: number;
  onBuy: () => void;
}

const STAT_ROWS: { key: 'magicPower' | 'mana'; label: string }[] = [
  { key: 'magicPower', label: 'Magic Power' },
  { key: 'mana',       label: 'Mana'        },
];

export default function ShopSummonCard({ summon, playerGold, onBuy }: Props) {
  const canBuy = !summon.owned && playerGold >= summon.cost;

  return (
    <div style={{ ...styles.card, opacity: summon.owned ? 0.6 : 1 }} className="card-hover">
      <HeroPortrait imagePath={summon.imagePath} name={summon.name} size={100} />

      <div style={styles.info}>
        {/* Name + cost row */}
        <div style={styles.nameRow}>
          <div style={styles.name}>{summon.name}</div>
          <CapBadge value={summon.capacity} />
        </div>
        <div style={styles.costRow}>
          <span style={styles.gold}>{summon.cost}g</span>
        </div>

        {/* Attributes table */}
        <div style={styles.statTable}>
          <div style={styles.statHeader}>
            <span style={styles.statHeaderAttr}>Attribute</span>
            <span style={styles.statHeaderNum}>Base</span>
            <span style={styles.statHeaderNum}>Growth</span>
          </div>
          {STAT_ROWS.map(({ key, label }) => (
            <div key={key} style={styles.statRow}>
              <span style={styles.statLabel}>{label}</span>
              <span style={styles.statBase}>{summon.baseStats[key]}</span>
              <span style={styles.statGrowth}>+{summon.growthStats[key]}</span>
            </div>
          ))}
        </div>

        {/* Buy / Owned */}
        {summon.owned ? (
          <div style={styles.ownedBadge}>Owned</div>
        ) : (
          <button
            onClick={onBuy}
            disabled={!canBuy}
            className={canBuy ? 'btn-shimmer' : ''}
            style={{
              ...styles.buyBtn,
              background: canBuy ? 'linear-gradient(135deg, #e94560 0%, #c73652 100%)' : '#2a1a20',
              opacity: canBuy ? 1 : 0.5,
              cursor: canBuy ? 'pointer' : 'not-allowed',
            }}
          >
            {playerGold < summon.cost ? 'Not enough gold' : 'Buy'}
          </button>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    display: 'flex',
    gap: 16,
    padding: 16,
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    border: '1px solid #16213e',
  },
  info: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  nameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    color: '#e0e0e0',
    fontWeight: 700,
    fontSize: 16,
    flex: 1,
  },
  costRow: {
    display: 'flex',
    gap: 12,
    fontSize: 13,
  },
  gold: {
    color: '#fbbf24',
    fontWeight: 600,
  },

  // ── Stat table ─────────────────────────────────────────────
  statTable: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.25)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 6,
    padding: '7px 10px',
    marginTop: 2,
  },
  statHeader: {
    display: 'flex',
    alignItems: 'center',
    paddingBottom: 5,
    marginBottom: 2,
    borderBottom: '1px solid rgba(255,255,255,0.07)',
  },
  statHeaderAttr: {
    flex: 1,
    color: '#555577',
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
  },
  statHeaderNum: {
    width: 52,
    textAlign: 'right' as const,
    color: '#555577',
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
  },
  statRow: {
    display: 'flex',
    alignItems: 'center',
  },
  statLabel: {
    flex: 1,
    color: '#b0b0c8',
    fontSize: 12,
    fontWeight: 500,
    fontStyle: 'italic',
  },
  statBase: {
    width: 52,
    textAlign: 'right' as const,
    color: '#e0e0e0',
    fontSize: 12,
    fontWeight: 700,
    fontVariantNumeric: 'tabular-nums',
  },
  statGrowth: {
    width: 52,
    textAlign: 'right' as const,
    color: '#4ade80',
    fontSize: 12,
    fontWeight: 700,
    fontVariantNumeric: 'tabular-nums',
  },

  buyBtn: {
    padding: '8px 16px',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    fontSize: 13,
    fontWeight: 600,
    marginTop: 'auto',
  },
  ownedBadge: {
    padding: '8px 16px',
    backgroundColor: '#16213e',
    color: '#4ade80',
    borderRadius: 4,
    fontSize: 13,
    fontWeight: 600,
    textAlign: 'center' as const,
    marginTop: 'auto',
  },
};
