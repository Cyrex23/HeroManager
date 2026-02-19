import { Link } from 'react-router-dom';
import { usePlayer } from '../../context/PlayerContext';
import { useAuth } from '../../context/AuthContext';
import EnergyBar from './EnergyBar';
import HeroPortrait from '../Hero/HeroPortrait';

export default function Sidebar() {
  const { player, fetchPlayer } = usePlayer();
  const { logout } = useAuth();

  return (
    <aside style={styles.sidebar}>
      {player ? (
        <>
          <div style={styles.section}>
            <div style={styles.profileRow}>
              {player.profileImagePath ? (
                <HeroPortrait imagePath={player.profileImagePath} name={player.username} size={48} />
              ) : (
                <div style={styles.avatarPlaceholder}>
                  {player.username.charAt(0).toUpperCase()}
                </div>
              )}
              <div style={styles.profileInfo}>
                <div style={styles.username}>{player.username}</div>
                {player.teamName && player.teamName !== player.username && (
                  <div style={styles.teamName}>{player.teamName}</div>
                )}
              </div>
            </div>
            <div style={styles.onlineStatus}>
              <span style={{
                display: 'inline-block',
                width: 8, height: 8, borderRadius: '50%',
                backgroundColor: player.isOnline ? '#4ade80' : '#666',
                marginRight: 6,
              }} />
              {player.isOnline
                ? `Online · ${player.onlineMinutesRemaining}m left`
                : 'Offline'}
            </div>
          </div>

          <div style={styles.section}>
            <div style={styles.label}>Resources</div>
            <div style={styles.resource}>
              <span style={{ color: '#fbbf24' }}>Gold</span>
              <span>{player.gold}</span>
            </div>
            <div style={styles.resource}>
              <span style={{ color: '#60a5fa' }}>Diamonds</span>
              <span>{player.diamonds}</span>
            </div>
          </div>

          <div style={styles.section}>
            <div style={styles.label}>Energy</div>
            <EnergyBar
              label="Arena"
              current={player.arenaEnergy}
              max={player.arenaEnergyMax}
              color="#4ade80"
              nextTickSeconds={player.nextEnergyTickSeconds}
              onTickComplete={fetchPlayer}
            />
            <EnergyBar
              label="World"
              current={player.worldEnergy}
              max={player.worldEnergyMax}
              color="#fbbf24"
              nextTickSeconds={player.nextEnergyTickSeconds}
              onTickComplete={fetchPlayer}
            />
          </div>

          <div style={styles.navLinks}>
            <Link to="/account" style={styles.accountLink}>Account</Link>
            <button onClick={logout} style={styles.logoutBtn}>Logout</button>
          </div>
        </>
      ) : (
        <div style={styles.section}>
          <div style={styles.label}>Player Info</div>
          <div style={styles.placeholder}>Loading...</div>
        </div>
      )}
    </aside>
  );
}

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: 220,
    backgroundColor: '#1a1a2e',
    borderRight: '1px solid #16213e',
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  section: { display: 'flex', flexDirection: 'column', gap: 6 },
  profileRow: { display: 'flex', alignItems: 'center', gap: 10 },
  avatarPlaceholder: {
    width: 48, height: 48, borderRadius: '50%',
    backgroundColor: '#16213e',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 20, fontWeight: 700, color: '#e0e0e0', flexShrink: 0,
  },
  profileInfo: { display: 'flex', flexDirection: 'column', gap: 2, overflow: 'hidden' },
  username: {
    color: '#e0e0e0', fontWeight: 600, fontSize: 14,
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
  },
  teamName: {
    color: '#a78bfa', fontSize: 16, fontWeight: 500,
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
  },
  label: { color: '#a0a0b0', fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: 1 },
  onlineStatus: { color: '#a0a0b0', fontSize: 12, display: 'flex', alignItems: 'center' },
  resource: { display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#e0e0e0' },
  placeholder: { color: '#666', fontSize: 13 },
  navLinks: { marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 },
  accountLink: {
    display: 'block',
    padding: '8px 0',
    textAlign: 'center' as const,
    backgroundColor: 'transparent',
    color: '#a0a0b0',
    border: '1px solid #333',
    borderRadius: 4,
    fontSize: 13,
    textDecoration: 'none',
  },
  logoutBtn: {
    padding: '8px 0',
    backgroundColor: 'transparent',
    color: '#a0a0b0',
    border: '1px solid #333',
    borderRadius: 4,
    fontSize: 13,
    cursor: 'pointer',
  },
};
