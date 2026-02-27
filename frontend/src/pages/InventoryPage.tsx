import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFullInventory, type FullInventoryItem, type FullInventoryAbility } from '../api/playerApi';
import { sellInventoryItem, sellAbility } from '../api/equipmentApi';
import { usePlayer } from '../context/PlayerContext';
import EquipmentTooltip from '../components/Equipment/EquipmentTooltip';

const STAT_LABELS: Record<string, string> = {
  physicalAttack: 'PA', magicPower: 'MP', dexterity: 'Dex',
  element: 'Elem', mana: 'Mana', stamina: 'Stam',
};

function formatBonuses(bonuses: Record<string, number>): string {
  return Object.entries(bonuses)
    .filter(([, v]) => v !== 0)
    .map(([k, v]) => `+${v} ${STAT_LABELS[k] ?? k}`)
    .join('  ');
}

export default function InventoryPage() {
  const navigate = useNavigate();
  const { fetchPlayer } = usePlayer();
  const [items, setItems] = useState<FullInventoryItem[]>([]);
  const [abilities, setAbilities] = useState<FullInventoryAbility[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [confirmSell, setConfirmSell] = useState<{ type: 'item' | 'ability'; id: number; name: string; price: number } | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await getFullInventory();
      setItems(data.items);
      setAbilities(data.abilities);
    } catch {
      setError('Failed to load inventory.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSellItem(equippedItemId: number) {
    setError(''); setMessage('');
    try {
      const res = await sellInventoryItem(equippedItemId);
      setMessage(res.message);
      await Promise.all([load(), fetchPlayer()]);
    } catch {
      setError('Failed to sell item.');
    } finally {
      setConfirmSell(null);
    }
  }

  async function handleSellAbility(equippedAbilityId: number) {
    setError(''); setMessage('');
    try {
      const res = await sellAbility(equippedAbilityId);
      setMessage(res.message);
      await Promise.all([load(), fetchPlayer()]);
    } catch {
      setError('Failed to sell ability.');
    } finally {
      setConfirmSell(null);
    }
  }

  // Group abilities by hero
  const abilitiesByHero: Record<string, FullInventoryAbility[]> = {};
  for (const ab of abilities) {
    const key = ab.heroName;
    if (!abilitiesByHero[key]) abilitiesByHero[key] = [];
    abilitiesByHero[key].push(ab);
  }

  if (loading) return <div style={{ color: '#a0a0b0', display: 'flex', alignItems: 'center', gap: 10 }}><span className="spinner" style={{ width: 18, height: 18 }} />Loading inventory...</div>;

  return (
    <div style={styles.page}>
      <h2 style={styles.pageTitle} className="gradient-title">Inventory</h2>

      {message && <div style={styles.success}>{message}</div>}
      {error && <div style={styles.error}>{error}</div>}

      {/* ── Confirm sell dialog ── */}
      {confirmSell && (
        <div style={styles.confirmOverlay}>
          <div style={styles.confirmCard}>
            <div style={styles.confirmTitle}>Sell Item?</div>
            <div style={styles.confirmName}>{confirmSell.name}</div>
            <div style={styles.confirmPrice}>You will receive <span style={styles.gold}>{confirmSell.price}g</span></div>
            <div style={styles.confirmBtns}>
              <button
                style={styles.confirmYes}
                onClick={() => {
                  if (confirmSell.type === 'item') handleSellItem(confirmSell.id);
                  else handleSellAbility(confirmSell.id);
                }}
              >
                Sell
              </button>
              <button style={styles.confirmNo} onClick={() => setConfirmSell(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Items ── */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionTitle}>Items</span>
          <span style={styles.sectionCount}>{items.length}</span>
        </div>
        {items.length === 0 ? (
          <div style={styles.empty}>No items owned.</div>
        ) : (
          <div style={styles.table}>
            <div style={styles.tableHead}>
              <span style={styles.colName}>Name</span>
              <span style={styles.colBonuses}>Bonuses</span>
              <span style={styles.colHero}>Equipped on</span>
              <span style={styles.colPrice}>Sell price</span>
              <span style={styles.colAction} />
            </div>
            {items.map((item) => (
              <EquipmentTooltip
                key={item.equippedItemId}
                name={item.name}
                type="item"
                bonuses={item.bonuses}
                sellPrice={item.sellPrice}
              >
                <div style={styles.row}>
                  <span style={styles.colName}>
                    <span style={styles.itemName}>{item.name}</span>
                  </span>
                  <span style={{ ...styles.colBonuses, color: '#4ade80', fontSize: 11 }}>
                    {formatBonuses(item.bonuses) || '—'}
                  </span>
                  <span style={styles.colHero}>
                    {item.equippedToHeroName ? (
                      <button
                        style={styles.heroLink}
                        onClick={() => navigate(`/hero/${item.equippedToHeroId}`)}
                      >
                        {item.equippedToHeroName}
                      </button>
                    ) : (
                      <span style={styles.unequipped}>Unequipped</span>
                    )}
                  </span>
                  <span style={{ ...styles.colPrice, color: '#fbbf24' }}>{item.sellPrice}g</span>
                  <span style={styles.colAction}>
                    <button
                      style={styles.sellBtn}
                      onClick={() => setConfirmSell({ type: 'item', id: item.equippedItemId, name: item.name, price: item.sellPrice })}
                    >
                      Sell
                    </button>
                  </span>
                </div>
              </EquipmentTooltip>
            ))}
          </div>
        )}
      </section>

      {/* ── Abilities ── */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionTitle}>Abilities</span>
          <span style={styles.sectionCount}>{abilities.length}</span>
        </div>
        {abilities.length === 0 ? (
          <div style={styles.empty}>No abilities owned.</div>
        ) : (
          Object.entries(abilitiesByHero).map(([heroName, heroAbilities]) => (
            <div key={heroName} style={styles.heroGroup}>
              <div style={styles.heroGroupLabel}>{heroName}</div>
              <div style={styles.table}>
                <div style={styles.tableHead}>
                  <span style={styles.colName}>Name</span>
                  <span style={styles.colTier}>Tier</span>
                  <span style={styles.colBonuses}>Bonuses</span>
                  <span style={styles.colHero}>Slot</span>
                  <span style={styles.colPrice}>Sell price</span>
                  <span style={styles.colAction} />
                </div>
                {heroAbilities.map((ab) => (
                  <EquipmentTooltip
                    key={ab.equippedAbilityId}
                    name={ab.name}
                    type="ability"
                    bonuses={ab.bonuses}
                    tier={ab.tier}
                    sellPrice={ab.sellPrice}
                    spell={ab.spell ?? null}
                  >
                    <div style={styles.row}>
                      <span style={styles.colName}>
                        <span style={styles.itemName}>{ab.name}</span>
                      </span>
                      <span style={{ ...styles.colTier, color: '#60a5fa' }}>T{ab.tier}</span>
                      <span style={{ ...styles.colBonuses, color: '#4ade80', fontSize: 11 }}>
                        {formatBonuses(ab.bonuses) || '—'}
                      </span>
                      <span style={styles.colHero}>
                        {ab.slotNumber !== null
                          ? <span style={{ color: '#a78bfa' }}>Slot {ab.slotNumber}</span>
                          : <span style={styles.unequipped}>Unslotted</span>
                        }
                      </span>
                      <span style={{ ...styles.colPrice, color: '#fbbf24' }}>{ab.sellPrice}g</span>
                      <span style={styles.colAction}>
                        <button
                          style={styles.sellBtn}
                          onClick={() => setConfirmSell({ type: 'ability', id: ab.equippedAbilityId, name: ab.name, price: ab.sellPrice })}
                        >
                          Sell
                        </button>
                      </span>
                    </div>
                  </EquipmentTooltip>
                ))}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: 860, display: 'flex', flexDirection: 'column', gap: 24 },
  pageTitle: { color: '#e0e0e0', fontSize: 20, fontWeight: 700, margin: 0 },
  success: {
    color: '#4ade80', fontSize: 13, padding: '8px 12px',
    backgroundColor: 'rgba(74,222,128,0.1)', borderRadius: 4,
  },
  error: {
    color: '#e94560', fontSize: 13, padding: '8px 12px',
    backgroundColor: 'rgba(233,69,96,0.1)', borderRadius: 4,
  },
  section: {
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    border: '1px solid #16213e',
    overflow: 'hidden',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '14px 18px',
    borderBottom: '1px solid #16213e',
    backgroundColor: '#12122a',
  },
  sectionTitle: { color: '#e0e0e0', fontSize: 15, fontWeight: 700 },
  sectionCount: {
    backgroundColor: '#16213e',
    color: '#a0a0b0',
    fontSize: 11,
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: 10,
  },
  heroGroup: { borderBottom: '1px solid #16213e' },
  heroGroupLabel: {
    color: '#a78bfa',
    fontSize: 12,
    fontWeight: 700,
    padding: '8px 18px 4px',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    backgroundColor: 'rgba(167,139,250,0.06)',
  },
  table: { display: 'flex', flexDirection: 'column' },
  tableHead: {
    display: 'flex',
    alignItems: 'center',
    padding: '6px 18px',
    backgroundColor: '#16213e',
    fontSize: 10,
    color: '#555',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    gap: 8,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    padding: '9px 18px',
    borderBottom: '1px solid #16213e',
    gap: 8,
    transition: 'background-color 0.1s',
  },
  colName: { flex: 2, minWidth: 0 },
  colTier: { width: 32, flexShrink: 0, textAlign: 'center' as const },
  colBonuses: { flex: 2.5, minWidth: 0, fontSize: 11, color: '#a0a0b0' },
  colHero: { flex: 1.5, minWidth: 0, fontSize: 12 },
  colPrice: { width: 56, flexShrink: 0, textAlign: 'right' as const, fontSize: 12 },
  colAction: { width: 52, flexShrink: 0, textAlign: 'right' as const },
  itemName: { color: '#e0e0e0', fontSize: 13, fontWeight: 500 },
  heroLink: {
    background: 'none',
    border: 'none',
    color: '#60a5fa',
    fontSize: 12,
    cursor: 'pointer',
    padding: 0,
    fontWeight: 500,
    textDecoration: 'underline',
    textDecorationStyle: 'dotted',
  },
  unequipped: { color: '#4b5563', fontSize: 12 },
  sellBtn: {
    padding: '4px 10px',
    backgroundColor: '#7f1d1d',
    color: '#fca5a5',
    border: '1px solid #991b1b',
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
  },
  empty: { color: '#555', fontSize: 13, padding: '16px 18px' },
  // Confirm dialog
  confirmOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.65)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  confirmCard: {
    backgroundColor: '#0d0d1f',
    border: '1px solid #991b1b',
    borderRadius: 12,
    padding: '28px 32px',
    minWidth: 280,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },
  confirmTitle: { color: '#fca5a5', fontSize: 16, fontWeight: 700, letterSpacing: 0.5 },
  confirmName: { color: '#e0e0e0', fontSize: 14, fontWeight: 600 },
  confirmPrice: { color: '#a0a0b0', fontSize: 13 },
  gold: { color: '#fbbf24', fontWeight: 700 },
  confirmBtns: { display: 'flex', gap: 10, marginTop: 4 },
  confirmYes: {
    padding: '8px 24px',
    backgroundColor: '#991b1b',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
  },
  confirmNo: {
    padding: '8px 24px',
    backgroundColor: '#1f2937',
    color: '#9ca3af',
    border: '1px solid #374151',
    borderRadius: 6,
    fontSize: 13,
    cursor: 'pointer',
  },
};
