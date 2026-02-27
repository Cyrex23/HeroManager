import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Coins, Gem, User, LogOut, Shield, Users, ChevronDown, ChevronUp, Search, Trophy, Newspaper, BookOpen, Star } from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import { useAuth } from '../../context/AuthContext';
import HeroPortrait from '../Hero/HeroPortrait';
import FriendTeamModal from '../friends/FriendTeamModal';
import { getOpponentTeam } from '../../api/arenaApi';
import {
  getFriends, searchPlayers, sendFriendRequest,
  acceptFriendRequest, deleteFriend,
} from '../../api/friendApi';
import type { FriendEntry, TeamResponse } from '../../types';
import TeamInspectBody, { INSPECT_CSS } from '../Arena/TeamInspectBody';


/** Game-HUD resource card with glowing border + icon box */
function ResourceCard({
  icon, label, value, textClass, color, rgb,
}: {
  icon: React.ReactNode; label: string; value: number | string;
  textClass: string; color: string; rgb: string;
}) {
  return (
    <motion.div
      style={{
        position: 'relative', padding: '11px 13px', borderRadius: 10,
        background: `linear-gradient(135deg, rgba(${rgb},0.1) 0%, rgba(${rgb},0.04) 100%)`,
        border: `1px solid rgba(${rgb},0.22)`,
        display: 'flex', alignItems: 'center', gap: 11, overflow: 'hidden',
      }}
      whileHover={{ scale: 1.02, x: 2 }}
      transition={{ duration: 0.18 }}
    >
      <div style={{
        position: 'absolute', top: -18, right: -18, width: 65, height: 65,
        borderRadius: '50%',
        background: `radial-gradient(circle, rgba(${rgb},0.25), transparent 70%)`,
        pointerEvents: 'none',
      }} />
      <div style={{
        width: 36, height: 36, borderRadius: 8,
        background: `rgba(${rgb},0.1)`, border: `1px solid rgba(${rgb},0.25)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color, flexShrink: 0, filter: `drop-shadow(0 0 6px rgba(${rgb},0.6))`,
      }}>
        {icon}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{
          color: '#9090c0', fontSize: 10, textTransform: 'uppercase' as const,
          letterSpacing: 1.4, fontWeight: 700,
        }}>
          {label}
        </span>
        <span className={textClass} style={{ fontSize: 17, fontWeight: 800, lineHeight: 1 }}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
      </div>
    </motion.div>
  );
}

export default function Sidebar() {
  const { player } = usePlayer();
  const { logout } = useAuth();

  // ── Friends ───────────────────────────────────────────────
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [friendsOpen, setFriendsOpen] = useState(false);
  const [friendSearch, setFriendSearch] = useState('');
  const [searchResults, setSearchResults] = useState<FriendEntry[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [inspectFriend, setInspectFriend] = useState<FriendEntry | null>(null);
  const [teamCache, setTeamCache] = useState<Record<number, TeamResponse>>({});
  const [hoverFriend, setHoverFriend] = useState<{ friend: FriendEntry; pos: { top: number; left: number } } | null>(null);
  const hoverCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function loadFriends() {
    getFriends().then(setFriends).catch(() => {});
  }

  useEffect(() => { loadFriends(); }, []);

  function handleSearchInput(val: string) {
    setFriendSearch(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!val.trim()) { setSearchResults(null); return; }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchPlayers(val.trim());
        setSearchResults(res);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  }

  async function handleAddFriend(receiverId: number) {
    try {
      await sendFriendRequest(receiverId);
      loadFriends();
      if (searchResults) {
        setSearchResults(searchResults.map((r) =>
          r.playerId === receiverId ? { ...r, relationStatus: 'PENDING_SENT' } : r
        ));
      }
    } catch { /* ignore */ }
  }

  async function handleAccept(requesterId: number) {
    try {
      await acceptFriendRequest(requesterId);
      loadFriends();
    } catch { /* ignore */ }
  }

  function handleFriendNameEnter(e: React.MouseEvent<HTMLElement>, f: FriendEntry) {
    if (hoverCloseTimer.current) clearTimeout(hoverCloseTimer.current);
    const rect = e.currentTarget.getBoundingClientRect();
    setHoverFriend({ friend: f, pos: { top: rect.top, left: rect.right + 10 } });
    if (!teamCache[f.playerId]) {
      getOpponentTeam(f.playerId).then((team) => {
        setTeamCache((prev) => ({ ...prev, [f.playerId]: team }));
      }).catch(() => {});
    }
  }

  function handleFriendNameLeave() {
    hoverCloseTimer.current = setTimeout(() => setHoverFriend(null), 150);
  }

  async function handleDelete(otherId: number) {
    try {
      await deleteFriend(otherId);
      setFriends((prev) => prev.filter((f) => f.playerId !== otherId));
    } catch { /* ignore */ }
  }

  const [newsOpen, setNewsOpen] = useState(true);

  const pendingReceived = friends.filter((f) => f.relationStatus === 'PENDING_RECEIVED');
  const accepted = friends.filter((f) => f.relationStatus === 'ACCEPTED');
  const pendingCount = pendingReceived.length;

  return (
    <>
      <style>{`.sidebar-inner::-webkit-scrollbar{display:none}.sidebar-inner{scrollbar-width:none;-ms-overflow-style:none}`}</style>
      <aside className="sidebar-inner" style={styles.sidebar}>
        {player ? (
          <>
            {/* ── Profile ─────────────────────────── */}
            <div style={styles.section}>
              <div style={styles.profileRow}>
                <div style={styles.avatarWrap}>
                  {player.profileImagePath ? (
                    <HeroPortrait imagePath={player.profileImagePath} name={player.username} size={60} />
                  ) : (
                    <div style={styles.avatarPlaceholder}>
                      {player.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div style={{
                    ...styles.onlineDot,
                    backgroundColor: player.isOnline ? '#4ade80' : '#444',
                    boxShadow: player.isOnline ? '0 0 6px rgba(74,222,128,0.8)' : 'none',
                  }} />
                </div>
                <div style={styles.profileInfo}>
                  <div style={styles.username}>{player.username}</div>
                  {player.teamName && player.teamName !== player.username && (
                    <div style={styles.teamName}>{player.teamName}</div>
                  )}
                  <div style={styles.onlineStatus}>
                    {player.isOnline
                      ? <span style={{ color: '#4ade80', fontSize: 11 }}>Online · {player.onlineMinutesRemaining}m</span>
                      : <span style={{ color: '#555', fontSize: 11 }}>Offline</span>
                    }
                  </div>
                </div>
              </div>
            </div>

            <div style={styles.divider} />

            {/* ── Resources ───────────────────────── */}
            <div style={styles.section}>
              <div style={styles.sectionLabel}>
                <Shield size={10} style={{ opacity: 0.5 }} />
                Resources
              </div>
              <ResourceCard icon={<Coins size={18} />} label="Gold" value={player.gold}
                textClass="gold-text gold-text-animated" color="#fbbf24" rgb="251,191,36" />
              <ResourceCard icon={<Gem size={18} />} label="Diamonds" value={player.diamonds}
                textClass="diamond-text" color="#c084fc" rgb="192,132,252" />
            </div>

            <div style={styles.divider} />

            {/* ── Friends ─────────────────────────── */}
            <div style={styles.section}>
              <button style={styles.friendsHeader} onClick={() => setFriendsOpen((o) => !o)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Users size={12} color="#a78bfa" />
                  <span style={styles.sectionLabel}>Friends</span>
                  {pendingCount > 0 && (
                    <span style={styles.pendingBadge}>{pendingCount}</span>
                  )}
                </div>
                {friendsOpen ? <ChevronUp size={12} color="#555" /> : <ChevronDown size={12} color="#555" />}
              </button>

              {friendsOpen && (
                <div style={styles.friendsBody}>
                  <div style={styles.searchRow}>
                    <div style={styles.searchInputWrap}>
                      <Search size={11} color="#555" style={{ flexShrink: 0 }} />
                      <input
                        type="text"
                        placeholder="Search players..."
                        value={friendSearch}
                        onChange={(e) => handleSearchInput(e.target.value)}
                        style={styles.searchInput}
                      />
                    </div>
                  </div>

                  {searching && (
                    <div style={styles.emptyMsg}>Searching...</div>
                  )}
                  {!searching && searchResults !== null && (
                    <div style={styles.resultList}>
                      {searchResults.length === 0 ? (
                        <div style={styles.emptyMsg}>No players found</div>
                      ) : (
                        searchResults.map((r) => (
                          <div key={r.playerId} style={styles.resultRow}>
                            <div style={styles.friendAvatar}>
                              {r.profileImagePath
                                ? <HeroPortrait imagePath={r.profileImagePath} name={r.username} size={24} />
                                : <span style={styles.friendAvatarLetter}>{r.username.charAt(0).toUpperCase()}</span>}
                            </div>
                            <span style={styles.friendName}>{r.username}</span>
                            {r.relationStatus === 'NONE' && (
                              <button style={styles.addBtn} onClick={() => handleAddFriend(r.playerId)}>+ Add</button>
                            )}
                            {r.relationStatus === 'PENDING_SENT' && (
                              <span style={styles.pendingLabel}>Pending</span>
                            )}
                            {r.relationStatus === 'ACCEPTED' && (
                              <span style={styles.friendsLabel}>Friends</span>
                            )}
                            {r.relationStatus === 'PENDING_RECEIVED' && (
                              <button style={styles.acceptBtn} onClick={() => handleAccept(r.playerId)}>Accept</button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {!searching && searchResults === null && pendingReceived.length > 0 && (
                    <>
                      <div style={styles.subLabel}>PENDING ({pendingReceived.length})</div>
                      {pendingReceived.map((f) => (
                        <div key={f.playerId} style={styles.friendRow}>
                          <div style={styles.friendAvatar}>
                            {f.profileImagePath
                              ? <HeroPortrait imagePath={f.profileImagePath} name={f.username} size={24} />
                              : <span style={styles.friendAvatarLetter}>{f.username.charAt(0).toUpperCase()}</span>}
                          </div>
                          <span style={{ ...styles.friendName, flex: 1 }}>{f.username}</span>
                          <button style={styles.acceptBtn} onClick={() => handleAccept(f.playerId)}>✓</button>
                          <button style={styles.declineBtn} onClick={() => handleDelete(f.playerId)}>✕</button>
                        </div>
                      ))}
                    </>
                  )}

                  {!searching && searchResults === null && (
                    <>
                      {accepted.length > 0 && (
                        <div style={styles.subLabel}>FRIENDS ({accepted.length})</div>
                      )}
                      <div style={styles.friendList}>
                        {accepted.length === 0 ? (
                          <div style={styles.emptyMsg}>No friends yet</div>
                        ) : (
                          accepted.map((f) => (
                            <div key={f.playerId} style={styles.friendRow}>
                              <div style={{ position: 'relative', flexShrink: 0 }}>
                                <div style={styles.friendAvatar}>
                                  {f.profileImagePath
                                    ? <HeroPortrait imagePath={f.profileImagePath} name={f.username} size={24} />
                                    : <span style={styles.friendAvatarLetter}>{f.username.charAt(0).toUpperCase()}</span>}
                                </div>
                                <span style={{
                                  position: 'absolute', bottom: 0, right: 0,
                                  width: 7, height: 7, borderRadius: '50%',
                                  backgroundColor: f.isOnline ? '#4ade80' : '#444',
                                  border: '1px solid rgba(7,6,26,0.9)',
                                }} />
                              </div>
                              <span
                                style={{ ...styles.friendName, flex: 1, cursor: 'default' }}
                                onMouseEnter={(e) => handleFriendNameEnter(e, f)}
                                onMouseLeave={handleFriendNameLeave}
                              >
                                {f.username}
                              </span>
                              <button style={styles.inspectBtn} title="Inspect team"
                                onClick={() => setInspectFriend(f)}>👁</button>
                              <button style={styles.declineBtn} title="Remove friend"
                                onClick={() => handleDelete(f.playerId)}>✕</button>
                            </div>
                          ))
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <div style={styles.divider} />

            {/* ── News ────────────────────────────── */}
            <div style={styles.section}>
              <button style={styles.friendsHeader} onClick={() => setNewsOpen((o) => !o)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Newspaper size={12} color="#e94560" />
                  <span style={styles.sectionLabel}>News</span>
                  <span style={styles.newsBadge}>NEW</span>
                </div>
                {newsOpen ? <ChevronUp size={12} color="#555" /> : <ChevronDown size={12} color="#555" />}
              </button>

              {newsOpen && (
                <Link to="/news" style={{ textDecoration: 'none' }}>
                  <div style={{ ...styles.newsCard, cursor: 'pointer' }}>
                    <div style={styles.newsDateRow}>
                      <span style={styles.newsDate}>Feb 2026</span>
                      <span style={styles.newsTagDev}>Dev</span>
                    </div>
                    <div style={styles.newsTitle}>Development begins!</div>
                    <div style={styles.newsBody}>
                      HeroManager is now in active development. Recruit heroes, build your team, and battle your way to the top of the leaderboard. More features coming soon!
                    </div>
                  </div>
                </Link>
              )}
            </div>

            <div style={{ ...styles.divider, marginTop: 'auto' }} />

            {/* ── Nav links ───────────────────────── */}
            <div style={styles.navLinks}>
              <motion.div whileHover={{ x: 3 }} transition={{ duration: 0.15 }}>
                <Link to="/guide" style={styles.accountLink}>
                  <BookOpen size={13} />
                  Guide
                </Link>
              </motion.div>
              <span style={styles.lockedLink} title="Coming soon">
                <Star size={13} />
                Achievements
                <span style={styles.lockBadge}>🔒</span>
              </span>
              <motion.div whileHover={{ x: 3 }} transition={{ duration: 0.15 }}>
                <Link to="/leaderboard" style={styles.accountLink}>
                  <Trophy size={13} />
                  Ranks
                </Link>
              </motion.div>
              <motion.div whileHover={{ x: 3 }} transition={{ duration: 0.15 }}>
                <Link to="/account" style={styles.accountLink}>
                  <User size={13} />
                  Account
                </Link>
              </motion.div>
              <motion.button onClick={logout} whileHover={{ x: 3 }} transition={{ duration: 0.15 }}
                style={styles.logoutBtn}>
                <LogOut size={13} />
                Logout
              </motion.button>
            </div>
          </>
        ) : (
          <div style={styles.section}>
            <div style={styles.sectionLabel}>Player Info</div>
            <div style={{ color: '#444', fontSize: 13 }}>Loading...</div>
          </div>
        )}
      </aside>

      {/* Friend team inspect modal */}
      {inspectFriend && (
        <FriendTeamModal
          playerId={inspectFriend.playerId}
          username={inspectFriend.username}
          teamName={inspectFriend.teamName}
          profileImagePath={inspectFriend.profileImagePath}
          isOnline={inspectFriend.isOnline}
          onClose={() => setInspectFriend(null)}
        />
      )}

      {/* Hover inspect popup */}
      {hoverFriend && (
        <div
          style={{
            position: 'fixed',
            top: hoverFriend.pos.top,
            left: Math.min(hoverFriend.pos.left, window.innerWidth - 576),
            zIndex: 9998,
            width: 560,
            backgroundColor: '#0e0e22',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10,
            padding: '14px 14px 12px',
            boxShadow: '0 8px 40px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.04)',
            pointerEvents: 'auto',
          }}
          onMouseEnter={() => { if (hoverCloseTimer.current) clearTimeout(hoverCloseTimer.current); }}
          onMouseLeave={handleFriendNameLeave}
        >
          <style>{INSPECT_CSS}</style>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {hoverFriend.friend.profileImagePath
              ? <HeroPortrait imagePath={hoverFriend.friend.profileImagePath} name={hoverFriend.friend.username} size={52} />
              : <div style={{ width: 52, height: 52, borderRadius: '50%', backgroundColor: '#16213e', border: '2px solid #2a2a4a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#e0e0e0', flexShrink: 0 }}>
                  {hoverFriend.friend.username.charAt(0).toUpperCase()}
                </div>
            }
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, minWidth: 0 }}>
              <span style={{ color: '#e8e8f0', fontSize: 17, fontWeight: 700 }}>{hoverFriend.friend.username}</span>
              {hoverFriend.friend.teamName && hoverFriend.friend.teamName !== hoverFriend.friend.username && (
                <span style={{ color: '#a78bfa', fontSize: 12, fontWeight: 500 }}>{hoverFriend.friend.teamName}</span>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: hoverFriend.friend.isOnline ? '#4ade80' : '#555', display: 'inline-block' }} />
                <span style={{ fontSize: 11, color: hoverFriend.friend.isOnline ? '#4ade80' : '#666' }}>
                  {hoverFriend.friend.isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              {teamCache[hoverFriend.friend.playerId] && (
                <span style={{ color: '#e94560', fontSize: 15, fontWeight: 700 }}>
                  ⚔ {teamCache[hoverFriend.friend.playerId].teamPower.toFixed(0)}
                </span>
              )}
            </div>
          </div>

          {/* Team body */}
          {!teamCache[hoverFriend.friend.playerId] ? (
            <div style={{ color: '#555', fontSize: 12, textAlign: 'center', padding: '10px 0' }}>Loading...</div>
          ) : (
            <TeamInspectBody team={teamCache[hoverFriend.friend.playerId]} />
          )}
        </div>
      )}
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: 220,
    backgroundColor: 'rgba(7, 6, 26, 0.82)',
    backdropFilter: 'blur(22px)',
    WebkitBackdropFilter: 'blur(22px)',
    borderRight: '1px solid rgba(255, 255, 255, 0.04)',
    padding: '18px 14px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    flexShrink: 0,
    position: 'relative',
    zIndex: 1,
    overflowY: 'auto',
  },
  section: { display: 'flex', flexDirection: 'column', gap: 8 },
  sectionLabel: {
    color: '#9090c8', fontSize: 11, textTransform: 'uppercase' as const,
    letterSpacing: '0.14em', fontWeight: 700, fontFamily: 'Inter, sans-serif',
    display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2,
  },
  divider: {
    height: 1,
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)',
    flexShrink: 0,
  },
  profileRow: { display: 'flex', alignItems: 'center', gap: 12 },
  avatarWrap: { position: 'relative', flexShrink: 0 },
  avatarPlaceholder: {
    width: 60, height: 60, borderRadius: '50%',
    background: 'linear-gradient(135deg, #1e1e3e, #2a2a5a)',
    border: '2px solid rgba(233,69,96,0.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 26, fontWeight: 800, color: '#e94560', fontFamily: 'Cinzel, serif',
  },
  onlineDot: {
    position: 'absolute', bottom: 2, right: 2,
    width: 11, height: 11, borderRadius: '50%',
    border: '2px solid rgba(7,6,26,0.9)',
  },
  profileInfo: { display: 'flex', flexDirection: 'column', gap: 2, overflow: 'hidden', flex: 1 },
  username: {
    color: '#e0e0e0', fontWeight: 700, fontSize: 16,
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
    fontFamily: 'Inter, sans-serif',
  },
  teamName: {
    color: '#a78bfa', fontSize: 13, fontWeight: 500,
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
  },
  onlineStatus: { marginTop: 1 },

  // ── Friends ────────────────────────────────────────────────
  friendsHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0', width: '100%',
  },
  pendingBadge: {
    backgroundColor: '#e94560', color: '#fff',
    fontSize: 9, fontWeight: 700, borderRadius: 8,
    padding: '1px 5px', lineHeight: '14px',
    fontFamily: 'Inter, sans-serif',
  },
  friendsBody: { display: 'flex', flexDirection: 'column', gap: 6 },

  searchRow: { display: 'flex', gap: 6 },
  searchInputWrap: {
    flex: 1, display: 'flex', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 6, padding: '5px 8px',
  },
  searchInput: {
    flex: 1, background: 'none', border: 'none', outline: 'none',
    color: '#e0e0e0', fontSize: 11, fontFamily: 'Inter, sans-serif',
  },

  subLabel: {
    color: '#444466', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
    textTransform: 'uppercase' as const, paddingTop: 4,
  },
  resultList: { display: 'flex', flexDirection: 'column', gap: 4 },
  friendList: { display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 180, overflowY: 'auto' as const },

  resultRow: { display: 'flex', alignItems: 'center', gap: 6 },
  friendRow: { display: 'flex', alignItems: 'center', gap: 6 },
  friendAvatar: {
    width: 24, height: 24, borderRadius: '50%',
    backgroundColor: '#16213e', border: '1px solid rgba(255,255,255,0.08)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    overflow: 'hidden',
  },
  friendAvatarLetter: { color: '#a78bfa', fontSize: 11, fontWeight: 700 },
  friendName: {
    color: '#c8c8e8', fontSize: 11, fontWeight: 500,
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
  },
  emptyMsg: { color: '#444466', fontSize: 11, textAlign: 'center', padding: '6px 0' },

  addBtn: {
    background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.3)',
    color: '#a78bfa', borderRadius: 4, fontSize: 10, fontWeight: 600,
    padding: '2px 6px', cursor: 'pointer', flexShrink: 0, fontFamily: 'Inter, sans-serif',
  },
  acceptBtn: {
    background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)',
    color: '#4ade80', borderRadius: 4, fontSize: 10, fontWeight: 700,
    padding: '2px 6px', cursor: 'pointer', flexShrink: 0, fontFamily: 'Inter, sans-serif',
  },
  declineBtn: {
    background: 'none', border: 'none', color: '#444466',
    fontSize: 11, cursor: 'pointer', padding: '2px 3px', flexShrink: 0,
    lineHeight: 1,
  },
  inspectBtn: {
    background: 'none', border: 'none', color: '#555577',
    fontSize: 12, cursor: 'pointer', padding: '2px 3px', flexShrink: 0, lineHeight: 1,
  },
  pendingLabel: { color: '#555', fontSize: 10, flexShrink: 0 },
  friendsLabel: { color: '#4ade80', fontSize: 10, flexShrink: 0 },

  // ── News ───────────────────────────────────────────────────
  newsBadge: {
    backgroundColor: 'rgba(233,69,96,0.15)', color: '#e94560',
    fontSize: 8, fontWeight: 800, borderRadius: 4,
    padding: '1px 5px', letterSpacing: '0.08em',
    border: '1px solid rgba(233,69,96,0.3)',
    fontFamily: 'Inter, sans-serif',
  },
  newsCard: {
    background: 'linear-gradient(135deg, rgba(233,69,96,0.07) 0%, rgba(233,69,96,0.02) 100%)',
    border: '1px solid rgba(233,69,96,0.18)',
    borderRadius: 8,
    padding: '10px 11px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 5,
  },
  newsDateRow: { display: 'flex', alignItems: 'center', gap: 6 },
  newsDate: { color: '#555577', fontSize: 9, fontWeight: 600, fontFamily: 'Inter, sans-serif' },
  newsTagDev: {
    backgroundColor: 'rgba(167,139,250,0.12)', color: '#a78bfa',
    fontSize: 8, fontWeight: 700, borderRadius: 3,
    padding: '1px 5px', letterSpacing: '0.06em',
    border: '1px solid rgba(167,139,250,0.25)',
    fontFamily: 'Inter, sans-serif',
  },
  newsTitle: {
    color: '#e8e8f0', fontSize: 12, fontWeight: 700,
    fontFamily: 'Inter, sans-serif', lineHeight: 1.3,
  },
  newsBody: {
    color: '#7070a0', fontSize: 10, lineHeight: 1.6,
    fontFamily: 'Inter, sans-serif',
  },

  // ── Nav links ──────────────────────────────────────────────
  navLinks: { display: 'flex', flexDirection: 'column', gap: 6 },
  lockedLink: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '9px 12px', backgroundColor: 'rgba(0,0,0,0.15)',
    color: '#2e2e50', border: '1px solid rgba(255,255,255,0.03)',
    borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'not-allowed',
    userSelect: 'none' as const,
  },
  lockBadge: { marginLeft: 'auto', fontSize: 9, opacity: 0.5 },
  accountLink: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '9px 12px', backgroundColor: 'rgba(255,255,255,0.03)',
    color: '#8888a8', border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 8, fontSize: 13, textDecoration: 'none', fontWeight: 500,
    transition: 'all 0.2s ease',
  },
  logoutBtn: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '9px 12px', backgroundColor: 'transparent',
    color: '#8888a8', border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 8, fontSize: 13, cursor: 'pointer',
    fontFamily: 'Inter, sans-serif', fontWeight: 500, width: '100%',
    transition: 'all 0.2s ease',
  },
};
