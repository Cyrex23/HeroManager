import { Link } from 'react-router-dom';
import { TeamSlotResponse } from '../../types';
import HeroPortrait from '../Hero/HeroPortrait';

interface TeamSlotProps {
  slot: TeamSlotResponse;
  onEquip: (slotNumber: number) => void;
  onUnequip: (slotNumber: number) => void;
}

export default function TeamSlot({ slot, onEquip, onUnequip }: TeamSlotProps) {
  const isEmpty = slot.type === 'hero' ? !slot.hero : !slot.summon;
  const isSummonSlot = slot.type === 'summon';

  if (isEmpty) {
    return (
      <div
        style={{
          backgroundColor: '#16213e',
          border: '2px dashed #0f3460',
          borderRadius: '8px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '160px',
          gap: '10px',
        }}
      >
        <div style={{ color: '#999', fontSize: '0.9em' }}>
          {isSummonSlot ? 'Summon Slot' : `Slot ${slot.slotNumber}`} - Empty
        </div>
        <button
          onClick={() => onEquip(slot.slotNumber)}
          style={{
            backgroundColor: '#4caf50',
            color: '#fff',
            border: 'none',
            padding: '6px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.85em',
          }}
        >
          Equip
        </button>
      </div>
    );
  }

  if (isSummonSlot && slot.summon) {
    return (
      <div
        style={{
          backgroundColor: '#16213e',
          border: '1px solid #0f3460',
          borderRadius: '8px',
          padding: '12px',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
        }}
      >
        <HeroPortrait imagePath={slot.summon.imagePath} size={0.5} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 'bold', color: '#eee', marginBottom: '4px' }}>
            {slot.summon.name}
          </div>
          <div style={{ color: '#999', fontSize: '0.85em', marginBottom: '4px' }}>
            Lv. {slot.summon.level} | Cap: {slot.summon.capacity}
          </div>
          <div style={{ color: '#4caf50', fontSize: '0.8em', marginBottom: '8px' }}>
            {slot.summon.teamBonus}
          </div>
          <button
            onClick={() => onUnequip(slot.slotNumber)}
            style={{
              backgroundColor: '#e94560',
              color: '#fff',
              border: 'none',
              padding: '4px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.8em',
            }}
          >
            Unequip
          </button>
        </div>
      </div>
    );
  }

  if (slot.hero) {
    const hero = slot.hero;
    const totalPower =
      hero.totalStats.physicalAttack +
      hero.totalStats.magicPower +
      hero.totalStats.dexterity +
      hero.totalStats.element +
      hero.totalStats.mana +
      hero.totalStats.stamina;

    return (
      <div
        style={{
          backgroundColor: '#16213e',
          border: '1px solid #0f3460',
          borderRadius: '8px',
          padding: '12px',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
        }}
      >
        <HeroPortrait imagePath={hero.imagePath} size={0.5} />
        <div style={{ flex: 1 }}>
          <Link
            to={`/hero/${hero.id}`}
            style={{ fontWeight: 'bold', color: '#e94560', textDecoration: 'none', fontSize: '1em', marginBottom: '4px', display: 'block' }}
          >
            {hero.name}
          </Link>
          <div style={{ color: '#999', fontSize: '0.85em', marginBottom: '4px' }}>
            Lv. {hero.level} | Cap: {hero.capacity}
          </div>
          <div style={{ color: '#ffd700', fontSize: '0.8em', marginBottom: '8px' }}>
            Power: {totalPower}
          </div>
          <button
            onClick={() => onUnequip(slot.slotNumber)}
            style={{
              backgroundColor: '#e94560',
              color: '#fff',
              border: 'none',
              padding: '4px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.8em',
            }}
          >
            Unequip
          </button>
        </div>
      </div>
    );
  }

  return null;
}
