import { useState, useRef } from 'react';
import type { TeamResponse } from '../../types';
import { getOpponentTeam } from '../../api/arenaApi';
import HeroPortrait from '../Hero/HeroPortrait';
import TeamInspectBody, { INSPECT_CSS } from '../Arena/TeamInspectBody';

const POPUP_WIDTH = 560;

interface Props {
  playerId: number;
  username: string;
  teamName: string;
  profileImagePath?: string | null;
  children: React.ReactNode;
}

export default function TeamInspectHover({
  playerId, username, teamName, profileImagePath, children,
}: Props) {
  const [show, setShow] = useState(false);
  const [team, setTeam] = useState<TeamResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function cancelClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }

  function scheduleClose() {
    closeTimer.current = setTimeout(() => setShow(false), 150);
  }

  async function handleEnter() {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const left = Math.max(8, Math.min(rect.left, window.innerWidth - POPUP_WIDTH - 8));
      setPopupStyle({ top: rect.bottom + 8, left, width: POPUP_WIDTH });
    }
    setShow(true);
    if (!team && !loading) {
      setLoading(true);
      try {
        const data = await getOpponentTeam(playerId);
        setTeam(data);
      } catch {
        // non-fatal
      } finally {
        setLoading(false);
      }
    }
  }

  return (
    <div
      ref={triggerRef}
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => { cancelClose(); handleEnter(); }}
      onMouseLeave={scheduleClose}
    >
      {children}

      {show && (
        <div
          style={{ ...styles.popup, ...popupStyle }}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        >
          <style>{INSPECT_CSS}</style>

          {/* Header */}
          <div style={styles.header}>
            {profileImagePath ? (
              <HeroPortrait imagePath={profileImagePath} name={username} size={52} />
            ) : (
              <div style={styles.avatar}>{username.charAt(0).toUpperCase()}</div>
            )}
            <div style={styles.infoBlock}>
              <div style={styles.playerName}>{username}</div>
              {teamName !== username && <div style={styles.teamNameText}>{teamName}</div>}
              {team && <div style={styles.power}>⚔ {team.teamPower.toFixed(0)}</div>}
            </div>
          </div>

          {loading ? (
            <div style={styles.loading}>Loading...</div>
          ) : team ? (
            <TeamInspectBody team={team} />
          ) : null}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  popup: {
    position: 'fixed',
    backgroundColor: '#0e0e22',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10,
    padding: '14px 14px 12px',
    zIndex: 9999,
    boxShadow: '0 8px 40px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.04)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
    paddingBottom: 12,
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  avatar: {
    width: 52, height: 52, borderRadius: '50%',
    backgroundColor: '#16213e',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 22, fontWeight: 700, color: '#e0e0e0', flexShrink: 0,
    border: '2px solid #2a2a4a',
  },
  infoBlock: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 3,
    flex: 1,
    minWidth: 0,
  },
  playerName: { color: '#e8e8f0', fontSize: 17, fontWeight: 700 },
  teamNameText: { color: '#a78bfa', fontSize: 12, fontWeight: 500 },
  power: { color: '#e94560', fontSize: 15, fontWeight: 700 },
  loading: { color: '#666', fontSize: 12, textAlign: 'center' as const, padding: '8px 0' },
};
