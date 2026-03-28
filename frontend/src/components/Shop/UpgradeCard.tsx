import type { ReactNode } from 'react';
import { Coins } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface UpgradeCardProps {
  icon: ReactNode;
  name: string;
  description: string;
  cost: number;
  currency: 'gold' | 'diamonds';
  purchased?: boolean;
  maxed?: boolean;
  canAfford: boolean;
  onBuy: () => void;
}

const GOLD_COLOR    = '#fbbf24';
const DIAMOND_COLOR = '#a78bfa';
const CARD_BG       = 'linear-gradient(135deg, rgba(40,28,10,0.95), rgba(28,18,6,0.98))';

export default function UpgradeCard({
  icon, name, description, cost, currency,
  purchased = false, maxed = false, canAfford, onBuy,
}: UpgradeCardProps) {
  const { t } = useLanguage();
  const currencyColor = currency === 'gold' ? GOLD_COLOR : DIAMOND_COLOR;
  const disabled = purchased || maxed || !canAfford;
  const currencyIcon = currency === 'gold'
    ? <Coins size={15} style={{ color: currencyColor, filter: `drop-shadow(0 0 4px ${currencyColor}99)` }} />
    : <span style={{ fontSize: 13 }}>💎</span>;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      background: CARD_BG,
      border: `1px solid ${purchased || maxed ? '#3a2a10' : 'rgba(180,110,20,0.4)'}`,
      borderLeft: `3px solid ${purchased || maxed ? '#4a3a18' : currencyColor}`,
      borderRadius: 6,
      padding: '12px 16px',
      opacity: purchased || maxed ? 0.6 : 1,
    }}>
      {/* Icon */}
      <div style={{
        fontSize: 22, flexShrink: 0, width: 32, textAlign: 'center',
        color: purchased || maxed ? '#5a4a28' : currencyColor,
        filter: purchased || maxed ? 'none' : `drop-shadow(0 0 6px ${currencyColor}66)`,
      }}>
        {icon}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontStyle: 'italic', fontWeight: 700, fontSize: 14,
          color: purchased || maxed ? '#7a6a3a' : currencyColor,
          letterSpacing: 0.3, marginBottom: 3,
        }}>
          {name}
          {purchased && <span style={{ color: '#4ade80', fontStyle: 'normal', fontWeight: 600, fontSize: 11, marginLeft: 8 }}>{t('upgrade_owned')}</span>}
          {maxed && !purchased && <span style={{ color: '#e94560', fontStyle: 'normal', fontWeight: 600, fontSize: 11, marginLeft: 8 }}>{t('upgrade_max')}</span>}
        </div>
        <div style={{ color: '#a08060', fontSize: 11, lineHeight: 1.4 }}>
          {description}
        </div>
      </div>

      {/* Price + Buy */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {!purchased && !maxed && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: 'rgba(0,0,0,0.5)', border: `1px solid ${currencyColor}55`,
            borderRadius: 4, padding: '4px 10px',
          }}>
            <span style={{ color: currencyColor, fontWeight: 800, fontSize: 15 }}>{cost}</span>
            {currencyIcon}
          </div>
        )}
        <button
          onClick={onBuy}
          disabled={disabled}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: disabled ? '#2a1f08' : 'linear-gradient(135deg, #3a7a2a, #2a5a1a)',
            border: `1px solid ${disabled ? '#3a2a10' : '#4ade8055'}`,
            borderRadius: 4, padding: '6px 14px', cursor: disabled ? 'default' : 'pointer',
            color: disabled ? '#4a3a18' : '#4ade80',
            fontWeight: 700, fontSize: 13, letterSpacing: 0.5,
            transition: 'filter 0.15s',
          }}
          onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.2)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.filter = 'none'; }}
        >
          {purchased ? t('upgrade_owned') : maxed ? t('upgrade_maxed') : t('upgrade_buy')}
        </button>
      </div>
    </div>
  );
}
