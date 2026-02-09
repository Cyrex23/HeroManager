import { ArenaOpponent } from '../../types';
import ChallengeButton from './ChallengeButton';

interface OpponentRowProps {
  opponent: ArenaOpponent;
  onChallenge: (defenderId: number) => void;
  disabled?: boolean;
}

export default function OpponentRow({ opponent, onChallenge, disabled = false }: OpponentRowProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#16213e',
        border: '1px solid #0f3460',
        borderRadius: '6px',
        padding: '12px 16px',
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
        <span
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: opponent.isOnline ? '#4caf50' : '#666',
            display: 'inline-block',
            flexShrink: 0,
          }}
        />
        <div>
          <div style={{ color: '#eee', fontWeight: 'bold' }}>{opponent.username}</div>
          <div style={{ color: '#999', fontSize: '0.8em' }}>
            Power: {opponent.teamPower} | Heroes: {opponent.heroCount}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span
          style={{
            backgroundColor: '#0f3460',
            color: '#ffd700',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '0.8em',
          }}
        >
          {opponent.energyCost} AE
        </span>
        <ChallengeButton
          energyCost={opponent.energyCost}
          disabled={disabled}
          onClick={() => onChallenge(opponent.playerId)}
        />
      </div>
    </div>
  );
}
