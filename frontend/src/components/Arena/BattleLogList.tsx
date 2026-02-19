import type { BattleLogEntry } from '../../types';

interface Props {
  battles: BattleLogEntry[];
  onReturnChallenge: (opponentId: number) => void;
  onViewBattle: (battleId: number) => void;
}

export default function BattleLogList({ battles, onReturnChallenge, onViewBattle }: Props) {
  if (battles.length === 0) {
    return <div style={styles.empty}>No battles yet. Challenge an opponent!</div>;
  }

  return (
    <div style={styles.list}>
      {battles.map((b) => (
        <div key={b.battleId} style={styles.entry}>
          <div style={styles.info}>
            <span style={styles.opponent}>vs {b.opponentUsername}</span>
            <span style={{
              ...styles.result,
              color: b.result === 'WIN' ? '#4ade80' : '#e94560',
            }}>
              {b.result}
            </span>
            <span style={styles.gold}>+{b.goldEarned}g</span>
          </div>
          <div style={styles.actions}>
            <button onClick={() => onViewBattle(b.battleId)} style={styles.viewBtn}>View</button>
            {b.canReturnChallenge && (
              <button
                onClick={() => onReturnChallenge(b.opponentId)}
                style={styles.returnBtn}
              >
                Return (4 AE)
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  entry: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 14px',
    backgroundColor: '#1a1a2e',
    borderRadius: 6,
    border: '1px solid #16213e',
  },
  info: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  opponent: {
    color: '#e0e0e0',
    fontWeight: 500,
    fontSize: 13,
  },
  result: {
    fontWeight: 700,
    fontSize: 13,
  },
  gold: {
    color: '#fbbf24',
    fontSize: 12,
  },
  actions: {
    display: 'flex',
    gap: 8,
  },
  viewBtn: {
    padding: '4px 10px',
    backgroundColor: '#16213e',
    color: '#a0a0b0',
    border: '1px solid #333',
    borderRadius: 4,
    fontSize: 12,
    cursor: 'pointer',
  },
  returnBtn: {
    padding: '4px 10px',
    backgroundColor: '#e94560',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    fontSize: 12,
    cursor: 'pointer',
  },
  empty: {
    color: '#666',
    fontSize: 13,
    padding: 16,
  },
};
