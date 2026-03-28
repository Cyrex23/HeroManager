import type { ShopSummonResponse } from '../../types';
import HeroPortrait from '../Hero/HeroPortrait';
import CapBadge from '../Hero/CapBadge';
import { SUMMON_STAT_CONFIG } from '../../utils/summonStatConfig';
import { useLanguage } from '../../context/LanguageContext';

interface Props {
  summon: ShopSummonResponse;
  playerGold: number;
  onBuy: () => void;
}

export default function ShopSummonCard({ summon, playerGold, onBuy }: Props) {
  const canBuy = !summon.owned && playerGold >= summon.cost;
  const { t } = useLanguage();

  return (
    <div style={{ ...styles.card, opacity: summon.owned ? 0.6 : 1 }} className="card-hover">
      {/* Top row: portrait col + info */}
      <div style={styles.topRow}>
        {/* Left: portrait + cap + gold stacked */}
        <div style={styles.portraitCol}>
          <HeroPortrait imagePath={summon.imagePath} name={summon.name} size={100} />
          <div style={styles.portraitMeta}>
            <CapBadge value={summon.capacity} />
          </div>
        </div>

        <div style={styles.info}>
          {/* Name row */}
          <div style={styles.name}>{summon.name}</div>

          {/* Attributes table */}
          <div style={styles.statTable}>
            <div style={styles.statHeader}>
              <span style={styles.statHeaderAttr}>{t('shop_summon_attribute')}</span>
              <span style={styles.statHeaderNum}>{t('shop_summon_base')}</span>
              <span style={styles.statHeaderNum}>{t('shop_summon_growth')}</span>
            </div>
            {Object.entries(summon.baseStats)
              .filter(([key]) => SUMMON_STAT_CONFIG[key])
              .map(([key, base]) => {
                const cfg = SUMMON_STAT_CONFIG[key];
                const growth = summon.growthStats[key as keyof typeof summon.growthStats] ?? 0;
                return (
                  <div key={key} style={styles.statRow}>
                    <span style={styles.statLabel}>{cfg.label}</span>
                    <span style={styles.statBase}>{base}{cfg.pct ? '%' : ''}</span>
                    <span style={styles.statGrowth}>+{growth}{cfg.pct ? '%' : ''}</span>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Bottom: gold + button */}
      <div style={styles.bottomRow}>
        <div style={styles.costDisplay}>
          <span style={styles.goldIcon}>💰</span>
          <span style={styles.gold}>{summon.cost}g</span>
        </div>
        {summon.owned ? (
          <div style={styles.ownedBadge}>{t('shop_owned')}</div>
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
            {t('shop_buy')}
          </button>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    padding: 16,
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    border: '1px solid #16213e',
  },
  topRow: {
    display: 'flex',
    gap: 16,
  },
  portraitCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  portraitMeta: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  info: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  name: {
    color: '#e0e0e0',
    fontWeight: 700,
    fontSize: 16,
  },
  gold: {
    color: '#fbbf24',
    fontWeight: 600,
    fontSize: 13,
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

  bottomRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  costDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  goldIcon: {
    fontSize: 18,
    lineHeight: 1,
  },
  buyBtn: {
    padding: '8px 24px',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    fontSize: 13,
    fontWeight: 600,
  },
  ownedBadge: {
    padding: '8px 24px',
    backgroundColor: '#16213e',
    color: '#4ade80',
    borderRadius: 4,
    fontSize: 13,
    fontWeight: 600,
    textAlign: 'center' as const,
  },
};
