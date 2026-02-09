import { usePlayer } from '../../context/PlayerContext';

export default function Sidebar() {
  const { player } = usePlayer();

  return (
    <aside style={{
      width: '220px',
      backgroundColor: '#16213e',
      color: '#eee',
      padding: '20px',
      borderRight: '1px solid #0f3460',
    }}>
      {player ? (
        <div>
          <h3 style={{ margin: '0 0 15px', color: '#e94560' }}>{player.username}</h3>
          <div style={{ marginBottom: '8px' }}>
            <span style={{ color: '#ffd700' }}>Gold: {player.gold}</span>
          </div>
          <div style={{ marginBottom: '8px' }}>
            <span style={{ color: '#00bfff' }}>Diamonds: {player.diamonds}</span>
          </div>
          <hr style={{ borderColor: '#0f3460', margin: '15px 0' }} />
          <div style={{ marginBottom: '8px' }}>
            <span style={{ color: '#4caf50' }}>Arena Energy: {player.arenaEnergy}/{player.arenaEnergyMax}</span>
          </div>
          <div style={{ marginBottom: '8px' }}>
            <span style={{ color: '#ffeb3b' }}>World Energy: {player.worldEnergy}/{player.worldEnergyMax}</span>
          </div>
          {player.nextEnergyTickSeconds && (
            <div style={{ fontSize: '0.85em', color: '#aaa' }}>
              Next +1 in {Math.floor(player.nextEnergyTickSeconds / 60)}:{String(player.nextEnergyTickSeconds % 60).padStart(2, '0')}
            </div>
          )}
          <hr style={{ borderColor: '#0f3460', margin: '15px 0' }} />
          <div>
            <span style={{ color: player.isOnline ? '#4caf50' : '#999' }}>
              {player.isOnline ? '● Online' : '○ Offline'}
            </span>
          </div>
        </div>
      ) : (
        <div>Loading...</div>
      )}
    </aside>
  );
}
