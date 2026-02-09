import { Link } from 'react-router-dom';
import { BattleLogEntry } from '../../types';

interface BattleLogListProps {
  battles: BattleLogEntry[];
  onReturnChallenge: (opponentId: number) => void;
}

export default function BattleLogList({ battles, onReturnChallenge }: BattleLogListProps) {
  if (battles.length === 0) {
    return <div style={{ color: '#999', padding: '16px' }}>No battles yet.</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {battles.map((battle) => (
        <div
          key={battle.battleId}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#16213e',
            border: '1px solid #0f3460',
            borderRadius: '6px',
            padding: '10px 16px',
            gap: '12px',
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span
                style={{
                  color: battle.result === 'WIN' ? '#4caf50' : '#e94560',
                  fontWeight: 'bold',
                  fontSize: '0.9em',
                }}
              >
                {battle.result}
              </span>
              <span style={{ color: '#eee' }}>
                vs <strong>{battle.opponentUsername}</strong>
              </span>
            </div>
            <div style={{ display: 'flex', gap: '12px', fontSize: '0.8em', color: '#999' }}>
              <span style={{ color: '#ffd700' }}>
                {battle.goldEarned > 0 ? `+${battle.goldEarned}g` : `${battle.goldEarned}g`}
              </span>
              <span>{battle.wasChallenger ? 'Attacked' : 'Defended'}</span>
              <span>{new Date(battle.createdAt).toLocaleString()}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Link
              to={`/battle/${battle.battleId}`}
              style={{
                color: '#e94560',
                textDecoration: 'none',
                fontSize: '0.85em',
                padding: '4px 10px',
                border: '1px solid #e94560',
                borderRadius: '4px',
              }}
            >
              Details
            </Link>
            {battle.canReturnChallenge && (
              <button
                onClick={() => onReturnChallenge(battle.opponentId)}
                style={{
                  backgroundColor: '#e94560',
                  color: '#fff',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.8em',
                }}
              >
                Return ({battle.returnEnergyCost} AE)
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
