import { useEffect, useState } from 'react';
import type { TeamResponse } from '../../types';
import { getOpponentTeam } from '../../api/arenaApi';
import HeroPortrait from '../Hero/HeroPortrait';
import EquipmentTooltip from '../Equipment/EquipmentTooltip';

const ELEMENT_SYMBOL: Record<string, string> = {
  FIRE: '🔥', WATER: '🌊', WIND: '🌀', EARTH: '⛰️', LIGHTNING: '⚡',
};
const ELEMENT_COLOR: Record<string, string> = {
  FIRE: '#f97316', WATER: '#38bdf8', WIND: '#86efac',
  EARTH: '#a16207', LIGHTNING: '#facc15',
};
const TIER_CARD_BORDER: Record<string, string> = {
  COMMONER: '#374151', ELITE: '#5b3fa8', LEGENDARY: '#c2410c',
};

interface Props {
  playerId: number;
  username: string;
  teamName: string | null;
  profileImagePath: string | null;
  isOnline: boolean;
  onClose: () => void;
}

export default function FriendTeamModal({ playerId, username, teamName, profileImagePath, isOnline, onClose }: Props) {
  const [team, setTeam] = useState<TeamResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOpponentTeam(playerId)
      .then(setTeam)
      .finally(() => setLoading(false));
  }, [playerId]);

  // Close on backdrop click
  function handleBackdrop(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div style={s.overlay} onClick={handleBackdrop}>
      <div style={s.modal}>
        {/* Header */}
        <div style={s.header}>
          <div style={s.headerLeft}>
            {profileImagePath ? (
              <HeroPortrait imagePath={profileImagePath} name={username} size={52} />
            ) : (
              <div style={s.avatar}>{username.charAt(0).toUpperCase()}</div>
            )}
            <div style={s.headerInfo}>
              <div style={s.username}>{username}</div>
              {teamName && teamName !== username && (
                <div style={s.teamName}>{teamName}</div>
              )}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 3,
              }}>
                <span style={{
                  width: 7, height: 7, borderRadius: '50%',
                  backgroundColor: isOnline ? '#4ade80' : '#555',
                  display: 'inline-block',
                }} />
                <span style={{ fontSize: 11, color: isOnline ? '#4ade80' : '#666' }}>
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
          {team && (
            <div style={s.power}>⚔ {team.teamPower.toFixed(0)}</div>
          )}
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Body */}
        {loading ? (
          <div style={s.loading}>Loading team...</div>
        ) : team ? (
          <>
            <div style={s.heroGrid}>
              {team.slots.filter((sl) => sl.type === 'hero').map((slot) => {
                const h = slot.hero;
                if (!h) return (
                  <div key={slot.slotNumber} style={s.heroCard}>
                    <div style={s.emptyPortrait} />
                  </div>
                );
                const elemColor = h.element ? (ELEMENT_COLOR[h.element] ?? '#a0a0b0') : null;
                const elemSymbol = h.element ? (ELEMENT_SYMBOL[h.element] ?? '') : null;
                const xpPct = h.xpToNextLevel > 0 ? Math.min((h.currentXp / h.xpToNextLevel) * 100, 100) : 100;
                const cardBorder = h.tier ? (TIER_CARD_BORDER[h.tier] ?? '#1e1e3a') : '#1e1e3a';
                const gearSlots = Array.from({ length: 6 }, (_, i) => {
                  const sn = i + 1;
                  return (
                    h.equippedSlots?.find((g) => g.slotNumber === sn) ??
                    { slotNumber: sn, type: null as null, name: null as null, bonuses: undefined as undefined, tier: null as null, copies: null as null }
                  );
                });

                return (
                  <div key={slot.slotNumber} style={{ ...s.heroCard, borderColor: cardBorder }}>
                    <div style={s.portraitWrap}>
                      <HeroPortrait imagePath={h.imagePath} name={h.name} size={52} tier={h.tier} />
                      <div style={s.lvlBadge}>{h.level}</div>
                      {elemSymbol && (
                        <div style={{ ...s.elemBadge, color: elemColor ?? '#fff' }}>{elemSymbol}</div>
                      )}
                    </div>
                    <div style={s.heroName}>
                      {h.name.length > 13 ? h.name.slice(0, 13) + '…' : h.name}
                    </div>
                    <div style={s.xpBarWrap}>
                      <div style={{ ...s.xpBarFill, width: `${xpPct}%` }} />
                    </div>
                    <div style={s.xpLabel}>{h.currentXp} / {h.xpToNextLevel} XP</div>
                    <div style={s.gearGrid}>
                      {gearSlots.map((gs) =>
                        gs.type ? (
                          <EquipmentTooltip
                            key={gs.slotNumber}
                            name={gs.name ?? ''}
                            type={gs.type as 'item' | 'ability'}
                            bonuses={gs.bonuses ?? {}}
                            tier={gs.type === 'ability' ? (gs.tier ?? null) : null}
                            copies={gs.copies ?? undefined}
                          >
                            <div style={{
                              ...s.gearSlot,
                              borderColor: gs.type === 'ability' ? '#5b3fa8' : '#1e4a8a',
                              backgroundColor: gs.type === 'ability' ? 'rgba(91,63,168,0.15)' : 'rgba(30,74,138,0.15)',
                            }}>
                              <span style={{ color: gs.type === 'ability' ? '#a78bfa' : '#60a5fa', fontWeight: 900, fontSize: 8, flexShrink: 0 }}>
                                {gs.type === 'ability' ? 'A' : 'I'}
                              </span>
                              <span style={s.gearSlotName}>
                                {gs.name && gs.name.length > 9 ? gs.name.slice(0, 9) + '…' : (gs.name ?? '')}
                              </span>
                            </div>
                          </EquipmentTooltip>
                        ) : (
                          <div key={gs.slotNumber} style={s.gearSlotEmpty} />
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summon */}
            <div style={s.summonRow}>
              <div style={s.summonLabel}>SUMMON</div>
              {(() => {
                const summonSlot = team.slots.find((sl) => sl.type === 'summon');
                const sm = summonSlot?.summon;
                if (!sm) return <div style={s.emptySummon}>No summon equipped</div>;
                const xpPct = sm.xpToNextLevel > 0 ? Math.min((sm.currentXp / sm.xpToNextLevel) * 100, 100) : 100;
                return (
                  <div style={s.summonContent}>
                    <HeroPortrait imagePath={sm.imagePath} name={sm.name} size={38} />
                    <div style={s.summonInfo}>
                      <div style={s.summonTitleRow}>
                        <span style={s.summonName}>{sm.name}</span>
                        <span style={s.summonLv}>Lv {sm.level}</span>
                      </div>
                      <div style={s.summonXpWrap}>
                        <div style={{ ...s.summonXpFill, width: `${xpPct}%` }} />
                      </div>
                      <div style={s.xpLabel}>{sm.currentXp} / {sm.xpToNextLevel} XP</div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </>
        ) : (
          <div style={s.loading}>No team data</div>
        )}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 9999,
    backgroundColor: 'rgba(0,0,0,0.72)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    backdropFilter: 'blur(4px)',
  },
  modal: {
    width: 600, maxWidth: '95vw', maxHeight: '85vh', overflowY: 'auto',
    backgroundColor: '#0e0e22',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 14, padding: '18px 18px 14px',
    boxShadow: '0 8px 60px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.04)',
  },
  header: {
    display: 'flex', alignItems: 'center', gap: 12,
    marginBottom: 16, paddingBottom: 14,
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 },
  avatar: {
    width: 52, height: 52, borderRadius: '50%',
    backgroundColor: '#16213e', border: '2px solid #2a2a4a',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 22, fontWeight: 700, color: '#e0e0e0', flexShrink: 0,
  },
  headerInfo: { display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 },
  username: { color: '#e8e8f0', fontSize: 17, fontWeight: 700 },
  teamName: { color: '#a78bfa', fontSize: 12, fontWeight: 500 },
  power: { color: '#e94560', fontSize: 15, fontWeight: 700, flexShrink: 0 },
  closeBtn: {
    background: 'none', border: 'none', color: '#555', cursor: 'pointer',
    fontSize: 18, padding: '4px 6px', lineHeight: 1, flexShrink: 0,
    transition: 'color 0.15s',
  },
  loading: { color: '#555', fontSize: 13, textAlign: 'center', padding: '24px 0' },

  heroGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 },
  heroCard: {
    backgroundColor: '#12122a', borderRadius: 8, padding: '10px 8px 8px',
    border: '1px solid', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
  },
  emptyPortrait: { width: 52, height: 52, borderRadius: 6, backgroundColor: '#1a1a2e' },
  portraitWrap: { position: 'relative', flexShrink: 0 },
  lvlBadge: {
    position: 'absolute', bottom: 3, right: 3,
    backgroundColor: 'rgba(0,0,0,0.75)', color: '#fff',
    fontSize: 11, fontWeight: 700, borderRadius: 4, padding: '0 3px', lineHeight: '16px',
  },
  elemBadge: {
    position: 'absolute', top: 2, left: 2, fontSize: 10, lineHeight: 1,
    filter: 'drop-shadow(0 0 3px currentColor)',
  },
  heroName: { color: '#c8c8e8', fontSize: 11, fontWeight: 600, textAlign: 'center' },
  xpBarWrap: {
    width: '100%', height: 4, borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.5)', overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%', borderRadius: 2,
    background: 'linear-gradient(90deg, #60a5fa, #a78bfa 50%, #60a5fa)',
    backgroundSize: '200% 100%',
    animation: 'xpShimmer 2.5s linear infinite',
  },
  xpLabel: { color: '#555577', fontSize: 9, textAlign: 'center' },

  gearGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr',
    gap: 3, width: '100%',
  },
  gearSlot: {
    display: 'flex', alignItems: 'center', gap: 3,
    padding: '2px 4px', borderRadius: 3, border: '1px solid',
    overflow: 'hidden',
  },
  gearSlotName: { color: '#a0a0b0', fontSize: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  gearSlotEmpty: {
    height: 18, borderRadius: 3,
    border: '1px solid rgba(255,255,255,0.04)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },

  summonRow: {
    display: 'flex', alignItems: 'center', gap: 10,
    borderTop: '1px solid rgba(255,255,255,0.05)',
    paddingTop: 10, marginTop: 4,
  },
  summonLabel: { color: '#444466', fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', flexShrink: 0 },
  emptySummon: { color: '#444466', fontSize: 11 },
  summonContent: { display: 'flex', alignItems: 'center', gap: 10 },
  summonInfo: { display: 'flex', flexDirection: 'column', gap: 3 },
  summonTitleRow: { display: 'flex', alignItems: 'center', gap: 8 },
  summonName: { color: '#c8c8e8', fontSize: 12, fontWeight: 600 },
  summonLv: { color: '#60a5fa', fontSize: 10, fontWeight: 600 },
  summonXpWrap: {
    width: 120, height: 3, borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.5)', overflow: 'hidden',
  },
  summonXpFill: {
    height: '100%', borderRadius: 2,
    background: 'linear-gradient(90deg, #60a5fa, #a78bfa 50%, #60a5fa)',
    backgroundSize: '200% 100%',
    animation: 'xpShimmer 2.5s linear infinite',
  },
};
