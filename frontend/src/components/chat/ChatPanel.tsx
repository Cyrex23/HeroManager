import { useEffect, useRef, useState, useCallback } from 'react';
import type { ChatMessage, ChatPartner, FriendEntry } from '../../types';
import {
  getGeneralMessages, sendGeneralMessage,
  getWhisperMessages, sendWhisper, getConversations,
} from '../../api/chatApi';
import { searchPlayers } from '../../api/friendApi';
import { usePlayer } from '../../context/PlayerContext';

type Tab = 'general' | 'whispers';

const PANEL_HEIGHT = 440;
const HEADER_H = 44;

function playDing() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.22, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch { /* AudioContext not available */ }
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatPanel() {
  const { player } = usePlayer();
  const chatSoundEnabled = player?.chatSoundEnabled ?? true;

  const [collapsed, setCollapsed] = useState(true);
  const [tab, setTab] = useState<Tab>('general');

  // ── General ──────────────────────────────────────────────
  const [generalMsgs, setGeneralMsgs] = useState<ChatMessage[]>([]);
  const [lastGeneralId, setLastGeneralId] = useState(0);
  const [generalInput, setGeneralInput] = useState('');
  const [generalSending, setGeneralSending] = useState(false);
  const [generalUnread, setGeneralUnread] = useState(0);
  const generalEndRef = useRef<HTMLDivElement>(null);

  // ── Whispers ──────────────────────────────────────────────
  const [conversations, setConversations] = useState<ChatPartner[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<ChatPartner | null>(null);
  const [whisperMsgs, setWhisperMsgs] = useState<ChatMessage[]>([]);
  const [lastWhisperId, setLastWhisperId] = useState(0);
  const [whisperInput, setWhisperInput] = useState('');
  const [whisperSending, setWhisperSending] = useState(false);
  const [whisperSearch, setWhisperSearch] = useState('');
  const [whisperUnread, setWhisperUnread] = useState(0);
  const whisperEndRef = useRef<HTMLDivElement>(null);
  const [playerSearchResults, setPlayerSearchResults] = useState<FriendEntry[] | null>(null);
  const [playerSearching, setPlayerSearching] = useState(false);
  const playerSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refs for use inside intervals without stale closures
  const collapsedRef = useRef(collapsed);
  const tabRef = useRef(tab);
  collapsedRef.current = collapsed;
  tabRef.current = tab;

  // ── Initial general load ──────────────────────────────────
  useEffect(() => {
    getGeneralMessages(0).then((msgs) => {
      setGeneralMsgs(msgs);
      if (msgs.length > 0) setLastGeneralId(msgs[msgs.length - 1].id);
    }).catch(() => {});
  }, []);

  // ── Poll general every 3s ─────────────────────────────────
  const lastGeneralIdRef = useRef(lastGeneralId);
  lastGeneralIdRef.current = lastGeneralId;

  useEffect(() => {
    const id = setInterval(() => {
      getGeneralMessages(lastGeneralIdRef.current).then((msgs) => {
        if (msgs.length === 0) return;
        setGeneralMsgs((prev) => [...prev, ...msgs]);
        setLastGeneralId(msgs[msgs.length - 1].id);
        // Only count as unread if not visible
        const visible = !collapsedRef.current && tabRef.current === 'general';
        if (!visible) setGeneralUnread((n) => n + msgs.length);
        if (chatSoundEnabled) playDing();
      }).catch(() => {});
    }, 3000);
    return () => clearInterval(id);
  }, [chatSoundEnabled]); // chatSoundEnabled is stable enough

  // ── Auto-scroll general ───────────────────────────────────
  useEffect(() => {
    if (!collapsed && tab === 'general') {
      generalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [generalMsgs, collapsed, tab]);

  // Clear general unread when tab becomes visible
  useEffect(() => {
    if (!collapsed && tab === 'general') setGeneralUnread(0);
  }, [collapsed, tab]);

  // ── Conversations ─────────────────────────────────────────
  const loadConversations = useCallback(() => {
    getConversations().then(setConversations).catch(() => {});
  }, []);

  useEffect(() => {
    loadConversations();
    const id = setInterval(loadConversations, 10000);
    return () => clearInterval(id);
  }, [loadConversations]);

  // ── Load whispers when partner selected ───────────────────
  useEffect(() => {
    if (!selectedPartner) return;
    setLastWhisperId(0);
    getWhisperMessages(selectedPartner.playerId, 0).then((msgs) => {
      setWhisperMsgs(msgs);
      if (msgs.length > 0) setLastWhisperId(msgs[msgs.length - 1].id);
    }).catch(() => {});
  }, [selectedPartner]);

  // ── Poll whispers every 5s ────────────────────────────────
  const lastWhisperIdRef = useRef(lastWhisperId);
  lastWhisperIdRef.current = lastWhisperId;

  useEffect(() => {
    if (!selectedPartner) return;
    const id = setInterval(() => {
      getWhisperMessages(selectedPartner.playerId, lastWhisperIdRef.current).then((msgs) => {
        if (msgs.length === 0) return;
        setWhisperMsgs((prev) => [...prev, ...msgs]);
        setLastWhisperId(msgs[msgs.length - 1].id);
        const incoming = msgs.filter((m) => !m.isOwn);
        if (incoming.length > 0) {
          const visible = !collapsedRef.current && tabRef.current === 'whispers';
          if (!visible) setWhisperUnread((n) => n + incoming.length);
          if (chatSoundEnabled) playDing();
        }
      }).catch(() => {});
    }, 5000);
    return () => clearInterval(id);
  }, [selectedPartner, chatSoundEnabled]);

  // ── Auto-scroll whispers ──────────────────────────────────
  useEffect(() => {
    if (!collapsed && tab === 'whispers') {
      whisperEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [whisperMsgs, collapsed, tab]);

  // Clear whisper unread when visible
  useEffect(() => {
    if (!collapsed && tab === 'whispers') setWhisperUnread(0);
  }, [collapsed, tab]);

  // ── Debounced player search ───────────────────────────────
  useEffect(() => {
    if (playerSearchTimer.current) clearTimeout(playerSearchTimer.current);
    if (!whisperSearch.trim()) {
      setPlayerSearchResults(null);
      setPlayerSearching(false);
      return;
    }
    setPlayerSearching(true);
    playerSearchTimer.current = setTimeout(() => {
      searchPlayers(whisperSearch.trim())
        .then((res) => setPlayerSearchResults(res))
        .catch(() => setPlayerSearchResults([]))
        .finally(() => setPlayerSearching(false));
    }, 400);
    return () => {
      if (playerSearchTimer.current) clearTimeout(playerSearchTimer.current);
    };
  }, [whisperSearch]);

  // ── Send handlers ─────────────────────────────────────────
  async function handleSendGeneral(e: React.FormEvent) {
    e.preventDefault();
    if (!generalInput.trim() || generalSending) return;
    setGeneralSending(true);
    try {
      const msg = await sendGeneralMessage(generalInput.trim());
      setGeneralMsgs((prev) => [...prev, msg]);
      setLastGeneralId(msg.id);
      setGeneralInput('');
    } catch { /* ignore */ } finally { setGeneralSending(false); }
  }

  async function handleSendWhisper(e: React.FormEvent) {
    e.preventDefault();
    if (!whisperInput.trim() || !selectedPartner || whisperSending) return;
    setWhisperSending(true);
    try {
      const msg = await sendWhisper(selectedPartner.playerId, whisperInput.trim());
      setWhisperMsgs((prev) => [...prev, msg]);
      setLastWhisperId(msg.id);
      setWhisperInput('');
    } catch { /* ignore */ } finally { setWhisperSending(false); }
  }

  // When user has typed something, show API search results; otherwise show conversations
  const showingSearch = whisperSearch.trim().length > 0;
  const displayedPartners = showingSearch
    ? (playerSearchResults ?? []).map<ChatPartner>((f) => ({
        playerId: f.playerId,
        username: f.username,
        profileImagePath: f.profileImagePath,
        isOnline: f.isOnline,
      }))
    : conversations;

  const totalUnread = generalUnread + whisperUnread;

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      right: 20,
      width: 300,
      height: collapsed ? HEADER_H : PANEL_HEIGHT,
      zIndex: 500,
      backgroundColor: '#0d0d1f',
      border: '1px solid rgba(255,255,255,0.1)',
      borderBottom: 'none',
      borderRadius: '10px 10px 0 0',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      boxShadow: '0 -4px 40px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.04)',
      transition: 'height 0.22s cubic-bezier(0.22,1,0.36,1)',
    }}>

      {/* ── Header (always visible) ── */}
      <div
        style={s.header}
        onClick={() => {
          setCollapsed((v) => !v);
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={s.chatIcon}>💬</span>
          <span style={s.headerTitle}>Chat</span>
          {totalUnread > 0 && collapsed && (
            <span style={s.unreadBadge}>{totalUnread > 99 ? '99+' : totalUnread}</span>
          )}
        </div>
        <span style={s.toggleArrow}>{collapsed ? '▲' : '▼'}</span>
      </div>

      {/* ── Tabs ── */}
      <div style={s.tabs}>
        <button
          style={{ ...s.tab, ...(tab === 'general' ? s.tabActive : {}) }}
          onClick={(e) => { e.stopPropagation(); setTab('general'); }}
        >
          General
          {generalUnread > 0 && tab !== 'general' && (
            <span style={s.tabBadge}>{generalUnread}</span>
          )}
        </button>
        <button
          style={{ ...s.tab, ...(tab === 'whispers' ? s.tabActive : {}) }}
          onClick={(e) => { e.stopPropagation(); setTab('whispers'); }}
        >
          Whispers
          {whisperUnread > 0 && tab !== 'whispers' && (
            <span style={s.tabBadge}>{whisperUnread}</span>
          )}
        </button>
      </div>

      {/* ── Content area (flex:1, hidden under collapsed header via overflow:hidden on parent) ── */}
      <div style={s.content}>

        {/* General tab */}
        {tab === 'general' && (
          <>
            <div style={s.messages}>
              {generalMsgs.length === 0 && (
                <div style={s.emptyHint}>No messages yet. Say hello!</div>
              )}
              {generalMsgs.map((m) => (
                <div key={m.id} style={s.msgRow}>
                  <span style={s.msgTime}>{formatTime(m.createdAt)}</span>
                  <span style={{ ...s.msgUser, color: m.isOwn ? '#a78bfa' : '#60a5fa' }}>
                    {m.senderUsername}:
                  </span>
                  <span style={s.msgText}>{m.content}</span>
                </div>
              ))}
              <div ref={generalEndRef} />
            </div>
            <form style={s.inputRow} onSubmit={handleSendGeneral}>
              <input
                style={s.input}
                value={generalInput}
                onChange={(e) => setGeneralInput(e.target.value)}
                placeholder="Say something..."
                maxLength={500}
                disabled={generalSending}
                onClick={(e) => e.stopPropagation()}
              />
              <button
                style={{
                  ...s.sendBtn,
                  opacity: generalSending || !generalInput.trim() ? 0.4 : 1,
                }}
                type="submit"
                disabled={generalSending || !generalInput.trim()}
              >
                ➤
              </button>
            </form>
          </>
        )}

        {/* Whispers tab */}
        {tab === 'whispers' && (
          <>
            {!selectedPartner ? (
              <>
                <div style={s.partnerSearchWrap}>
                  <input
                    style={s.partnerSearchInput}
                    value={whisperSearch}
                    onChange={(e) => setWhisperSearch(e.target.value)}
                    placeholder="Search any player..."
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div style={s.partnerList}>
                  {playerSearching ? (
                    <div style={s.emptyHint}>Searching...</div>
                  ) : displayedPartners.length === 0 ? (
                    <div style={s.emptyHint}>
                      {showingSearch ? 'No players found' : 'No conversations yet'}
                    </div>
                  ) : (
                    displayedPartners.map((p) => (
                      <div
                        key={p.playerId}
                        style={s.partnerRow}
                        onClick={(e) => { e.stopPropagation(); setSelectedPartner(p); setWhisperSearch(''); setPlayerSearchResults(null); }}
                      >
                        <span style={{
                          width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                          backgroundColor: p.isOnline ? '#4ade80' : '#555', display: 'inline-block',
                        }} />
                        <span style={s.partnerName}>{p.username}</span>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <>
                <div style={s.partnerHeader} onClick={(e) => e.stopPropagation()}>
                  <button style={s.backBtn} onClick={() => setSelectedPartner(null)}>←</button>
                  <span style={{
                    width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                    backgroundColor: selectedPartner.isOnline ? '#4ade80' : '#555', display: 'inline-block',
                  }} />
                  <span style={s.partnerName}>{selectedPartner.username}</span>
                </div>
                <div style={s.messages}>
                  {whisperMsgs.length === 0 && (
                    <div style={s.emptyHint}>Start the conversation!</div>
                  )}
                  {whisperMsgs.map((m) => (
                    <div key={m.id} style={{
                      display: 'flex',
                      justifyContent: m.isOwn ? 'flex-end' : 'flex-start',
                      marginBottom: 4,
                    }}>
                      <div style={{
                        maxWidth: '80%', borderRadius: 8, border: '1px solid',
                        padding: '5px 8px',
                        backgroundColor: m.isOwn ? 'rgba(167,139,250,0.15)' : 'rgba(96,165,250,0.12)',
                        borderColor: m.isOwn ? '#7c3aed' : '#1d4ed8',
                      }}>
                        <div style={{ color: '#d0d0f0', fontSize: 11, wordBreak: 'break-word' as const }}>{m.content}</div>
                        <div style={{ color: '#3a3a5a', fontSize: 9, marginTop: 2, textAlign: 'right' as const }}>{formatTime(m.createdAt)}</div>
                      </div>
                    </div>
                  ))}
                  <div ref={whisperEndRef} />
                </div>
                <form style={s.inputRow} onSubmit={handleSendWhisper}>
                  <input
                    style={s.input}
                    value={whisperInput}
                    onChange={(e) => setWhisperInput(e.target.value)}
                    placeholder={`Message ${selectedPartner.username}...`}
                    maxLength={500}
                    disabled={whisperSending}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <button
                    style={{
                      ...s.sendBtn,
                      opacity: whisperSending || !whisperInput.trim() ? 0.4 : 1,
                    }}
                    type="submit"
                    disabled={whisperSending || !whisperInput.trim()}
                  >
                    ➤
                  </button>
                </form>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 14px',
    height: HEADER_H,
    flexShrink: 0,
    cursor: 'pointer',
    userSelect: 'none',
    borderBottom: '1px solid rgba(255,255,255,0.07)',
  },
  chatIcon: { fontSize: 14 },
  headerTitle: {
    color: '#c0c0e0',
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: '0.05em',
  },
  unreadBadge: {
    backgroundColor: '#e94560',
    color: '#fff',
    borderRadius: 10,
    fontSize: 10,
    fontWeight: 700,
    padding: '1px 6px',
    lineHeight: '16px',
  },
  toggleArrow: {
    color: '#555',
    fontSize: 11,
    lineHeight: 1,
  },

  tabs: {
    display: 'flex',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    flexShrink: 0,
  },
  tab: {
    flex: 1,
    padding: '8px 4px',
    background: 'none',
    border: 'none',
    color: '#555',
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.04em',
    transition: 'color 0.15s',
    position: 'relative',
  },
  tabActive: {
    color: '#a78bfa',
    borderBottom: '2px solid #a78bfa',
  },
  tabBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#e94560',
    color: '#fff',
    fontSize: 9,
    fontWeight: 700,
    marginLeft: 5,
    padding: '0 3px',
    verticalAlign: 'middle',
  },

  // Main content area — takes all remaining height
  content: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0, // critical: allows children to shrink below content size
    overflow: 'hidden',
  },

  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    minHeight: 0,
  },
  emptyHint: {
    color: '#333355',
    fontSize: 11,
    textAlign: 'center',
    padding: '20px 0',
    fontStyle: 'italic',
  },
  msgRow: {
    display: 'flex',
    gap: 4,
    flexWrap: 'wrap',
    alignItems: 'baseline',
    lineHeight: 1.45,
  },
  msgTime: { color: '#2e2e50', fontSize: 9, flexShrink: 0 },
  msgUser: { fontSize: 11, fontWeight: 700, flexShrink: 0 },
  msgText: { color: '#b8b8d8', fontSize: 11, wordBreak: 'break-word' },

  inputRow: {
    display: 'flex',
    gap: 5,
    padding: '7px 8px',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    flexShrink: 0,
    backgroundColor: '#0d0d1f',
  },
  input: {
    flex: 1,
    backgroundColor: '#16162e',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 6,
    padding: '6px 9px',
    color: '#e0e0f4',
    fontSize: 12,
    outline: 'none',
    fontFamily: 'Inter, sans-serif',
  },
  sendBtn: {
    backgroundColor: '#1e1e3e',
    border: '1px solid rgba(167,139,250,0.3)',
    borderRadius: 6,
    color: '#a78bfa',
    cursor: 'pointer',
    fontSize: 13,
    padding: '5px 10px',
    flexShrink: 0,
    transition: 'background 0.15s',
  },

  partnerSearchWrap: {
    padding: '7px 8px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    flexShrink: 0,
  },
  partnerSearchInput: {
    width: '100%',
    backgroundColor: '#16162e',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 6,
    padding: '6px 9px',
    color: '#e0e0f4',
    fontSize: 11,
    outline: 'none',
    boxSizing: 'border-box',
  },
  partnerList: {
    flex: 1,
    overflowY: 'auto',
    minHeight: 0,
  },
  partnerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 14px',
    cursor: 'pointer',
    transition: 'background 0.1s',
  },
  partnerHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 10px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    flexShrink: 0,
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: '#666',
    cursor: 'pointer',
    fontSize: 14,
    padding: '0 4px 0 0',
    lineHeight: 1,
  },
  partnerName: {
    color: '#c0c0e0',
    fontSize: 12,
    fontWeight: 600,
  },
};
