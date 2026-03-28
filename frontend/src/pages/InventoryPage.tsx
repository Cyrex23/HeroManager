import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFullInventory, type FullInventoryItem, type FullInventoryAbility } from '../api/playerApi';
import { sellInventoryItem, sellAbility } from '../api/equipmentApi';
import { usePlayer } from '../context/PlayerContext';
import AbilityTierIcon from '../components/Equipment/AbilityTierIcon';
import EquipmentTooltip from '../components/Equipment/EquipmentTooltip';
import { useLanguage } from '../context/LanguageContext';

// ── Tier configs ────────────────────────────────────────────────────────────
type ItemTier = 'COMMON' | 'RARE' | 'LEGENDARY';
const ITEM_TIER_STYLE: Record<ItemTier, { labelKey: string; color: string; glow: string }> = {
  COMMON:    { labelKey: 'inv_tier_common',    color: '#9ca3af', glow: 'rgba(156,163,175,0.15)' },
  RARE:      { labelKey: 'inv_tier_rare',      color: '#a78bfa', glow: 'rgba(167,139,250,0.22)' },
  LEGENDARY: { labelKey: 'inv_tier_legendary', color: '#f97316', glow: 'rgba(249,115,22,0.28)'  },
};
const ABILITY_TIER_COLOR: Record<number, string> = {
  1: '#9ca3af', 2: '#38bdf8', 3: '#a78bfa', 4: '#fb923c',
};
const ABILITY_TIER_LABEL: Record<number, string> = {
  1: 'Tier I', 2: 'Tier II', 3: 'Tier III', 4: 'Tier IV',
};

// ── Stat chips ───────────────────────────────────────────────────────────────
const STAT_CFG: Record<string, { label: string; color: string; icon: string }> = {
  physicalAttack: { label: 'PA',   color: '#f97316', icon: '⚔'  },
  magicPower:     { label: 'MP',   color: '#60a5fa', icon: '✦'  },
  dexterity:      { label: 'Dex',  color: '#4ade80', icon: '◈'  },
  mana:           { label: 'Mana', color: '#818cf8', icon: '◆'  },
  stamina:        { label: 'Stam', color: '#fb923c', icon: '◉'  },
  element:        { label: 'Elem', color: '#facc15', icon: '⚡' },
};

const ITEM_ICON: Record<string, string> = {
  'Training Weights': '🏋️', 'Iron Kunai': '🗡️', 'Chakra Scroll': '📜',
  'Mana Crystal': '💎', 'Swift Boots': '👟', 'Warrior Armor': '🛡️',
  'Mystic Tome': '📖', 'Shadow Cloak': '🌑', 'Legendary Blade': '⚔️', 'Sage Staff': '📿',
};

function getItemTier(sellPrice: number): ItemTier {
  if (sellPrice >= 300) return 'LEGENDARY';
  if (sellPrice >= 150) return 'RARE';
  return 'COMMON';
}

function StatChips({ bonuses }: { bonuses: Record<string, number> }) {
  const entries = Object.entries(bonuses).filter(([, v]) => v !== 0);
  if (!entries.length) return <span style={{ color: '#2a2a4a', fontSize: 11 }}>—</span>;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
      {entries.map(([stat, val]) => {
        const sc = STAT_CFG[stat] ?? { label: stat, color: '#9ca3af', icon: '·' };
        return (
          <span key={stat} style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            padding: '2px 7px', borderRadius: 6,
            background: sc.color + '14', border: `1px solid ${sc.color}40`,
          }}>
            <span style={{ color: sc.color, fontSize: 9 }}>{sc.icon}</span>
            <span style={{ color: sc.color, fontWeight: 800, fontSize: 11 }}>+{val}</span>
            <span style={{ color: sc.color + 'aa', fontSize: 9 }}>{sc.label}</span>
          </span>
        );
      })}
    </div>
  );
}

export default function InventoryPage() {
  const navigate = useNavigate();
  const { fetchPlayer } = usePlayer();
  const { t } = useLanguage();
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
      setError(t('inv_err_load'));
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
    } catch { setError(t('inv_err_sell_item')); }
    finally { setConfirmSell(null); }
  }

  async function handleSellAbility(equippedAbilityId: number) {
    setError(''); setMessage('');
    try {
      const res = await sellAbility(equippedAbilityId);
      setMessage(res.message);
      await Promise.all([load(), fetchPlayer()]);
    } catch { setError(t('inv_err_sell_ability')); }
    finally { setConfirmSell(null); }
  }

  const abilitiesByHero: Record<string, FullInventoryAbility[]> = {};
  for (const ab of abilities) {
    if (!abilitiesByHero[ab.heroName]) abilitiesByHero[ab.heroName] = [];
    abilitiesByHero[ab.heroName].push(ab);
  }

  if (loading) return (
    <div style={{ color: '#a0a0b0', display: 'flex', alignItems: 'center', gap: 10 }}>
      <span className="spinner" style={{ width: 18, height: 18 }} />{t('inv_loading')}
    </div>
  );

  return (
    <div style={{ maxWidth: 900, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Page title */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#e8e8f0', letterSpacing: 1 }} className="gradient-title">
          {t('inv_title')}
        </h2>
        <span style={{
          color: '#a78bfa', fontSize: 12, fontWeight: 700,
          background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.25)',
          padding: '2px 10px', borderRadius: 20,
        }}>
          {t('inv_items_total').replace('{count}', String(items.length + abilities.length))}
        </span>
      </div>

      {message && (
        <div style={{ color: '#4ade80', fontSize: 13, padding: '10px 16px', backgroundColor: 'rgba(74,222,128,0.08)', borderRadius: 8, border: '1px solid rgba(74,222,128,0.2)' }}>
          {message}
        </div>
      )}
      {error && (
        <div style={{ color: '#e94560', fontSize: 13, padding: '10px 16px', backgroundColor: 'rgba(233,69,96,0.08)', borderRadius: 8, border: '1px solid rgba(233,69,96,0.2)' }}>
          {error}
        </div>
      )}

      {/* ── Confirm sell dialog ─────────────────────────────────────────────── */}
      {confirmSell && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
          backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            background: 'linear-gradient(160deg, #0e0e20, #0a0a18)',
            border: '1px solid rgba(233,69,96,0.35)',
            borderTop: '2px solid #e94560',
            borderRadius: 14, padding: '32px 36px',
            minWidth: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
            boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 30px rgba(233,69,96,0.1)',
          }}>
            <div style={{ fontSize: 28 }}>💰</div>
            <div style={{ color: '#fca5a5', fontSize: 15, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase' }}>
              {t('inv_confirm_title')}
            </div>
            <div style={{ color: '#e0e0e0', fontSize: 14, fontWeight: 600 }}>{confirmSell.name}</div>
            <div style={{
              background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)',
              borderRadius: 8, padding: '8px 20px', color: '#a0a0b0', fontSize: 13,
            }}>
              {t('inv_confirm_receive')}{' '}
              <span style={{ color: '#fbbf24', fontWeight: 800, fontSize: 15 }}>{confirmSell.price}</span>
              <span style={{ color: '#fbbf24aa', fontSize: 11, marginLeft: 3 }}>{t('inv_confirm_gold')}</span>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button
                onClick={() => confirmSell.type === 'item' ? handleSellItem(confirmSell.id) : handleSellAbility(confirmSell.id)}
                style={{
                  padding: '9px 28px', background: 'linear-gradient(135deg, #991b1b, #7f1d1d)',
                  color: '#fff', border: '1px solid #b91c1c', borderRadius: 8,
                  fontSize: 13, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.05em',
                }}
              >
                {t('inv_sell_btn')}
              </button>
              <button
                onClick={() => setConfirmSell(null)}
                style={{
                  padding: '9px 28px', background: 'transparent',
                  color: '#6b7280', border: '1px solid #374151', borderRadius: 8,
                  fontSize: 13, cursor: 'pointer',
                }}
              >
                {t('inv_cancel_btn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Items section ──────────────────────────────────────────────────── */}
      <section style={{
        background: 'rgba(10,10,24,0.6)', borderRadius: 14,
        border: '1px solid rgba(255,255,255,0.05)',
      }}>
        {/* Section header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '16px 22px',
          background: 'linear-gradient(90deg, rgba(251,191,36,0.06) 0%, transparent 60%)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}>
          <span style={{ fontSize: 18 }}>🎒</span>
          <span style={{ color: '#e8e8f0', fontSize: 15, fontWeight: 700, letterSpacing: '0.04em' }}>{t('inv_section_items')}</span>
          <span style={{
            background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.25)',
            color: '#fbbf24', fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 20,
          }}>
            {items.length}
          </span>
        </div>

        {items.length === 0 ? (
          <div style={{ color: '#2a2a4a', fontSize: 13, padding: '28px 22px', textAlign: 'center', fontStyle: 'italic' }}>
            {t('inv_empty_items')}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {items.map((item, i) => {
              const tier = getItemTier(item.sellPrice);
              const tc = ITEM_TIER_STYLE[tier];
              return (
                <EquipmentTooltip key={item.equippedItemId} name={item.name} type="item" bonuses={item.bonuses} sellPrice={item.sellPrice} block>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '12px 22px', width: '100%', boxSizing: 'border-box',
                    borderBottom: i < items.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    borderLeft: `3px solid ${tc.color}`,
                    background: `linear-gradient(90deg, ${tc.color}08 0%, transparent 40%)`,
                    transition: 'background 0.15s',
                    cursor: 'default',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = `linear-gradient(90deg, ${tc.color}14 0%, transparent 50%)`}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = `linear-gradient(90deg, ${tc.color}08 0%, transparent 40%)`}
                  >
                    {/* Icon circle */}
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: tc.color + '16', border: `2px solid ${tc.color}40`,
                      fontSize: 18, boxShadow: `0 0 12px ${tc.glow}`,
                    }}>
                      {ITEM_ICON[item.name] ?? '📦'}
                    </div>

                    {/* Name + tier badge */}
                    <div style={{ minWidth: 160, flexShrink: 0 }}>
                      <div style={{ color: '#e8e8f0', fontWeight: 700, fontSize: 13 }}>{item.name}</div>
                      <span style={{
                        fontSize: 9, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase',
                        padding: '1px 6px', borderRadius: 4,
                        background: tc.color + '20', border: `1px solid ${tc.color}50`, color: tc.color,
                      }}>
                        {t(tc.labelKey as Parameters<typeof t>[0])}
                      </span>
                    </div>

                    {/* Stat chips */}
                    <div style={{ flex: 1 }}>
                      <StatChips bonuses={item.bonuses} />
                    </div>

                    {/* Equipped on */}
                    <div style={{ minWidth: 110, textAlign: 'center' }}>
                      {item.equippedToHeroName ? (
                        <button onClick={() => navigate(`/hero/${item.equippedToHeroId}`)} style={{
                          background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.3)',
                          color: '#60a5fa', borderRadius: 6, padding: '3px 10px',
                          fontSize: 11, fontWeight: 600, cursor: 'pointer',
                        }}>
                          {item.equippedToHeroName}
                        </button>
                      ) : (
                        <span style={{
                          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                          color: '#3a3a5a', borderRadius: 6, padding: '3px 10px', fontSize: 11,
                        }}>
                          {t('inv_unequipped')}
                        </span>
                      )}
                    </div>

                    {/* Gold */}
                    <div style={{ minWidth: 70, textAlign: 'right', flexShrink: 0, marginLeft: 'auto' }}>
                      <span style={{ color: '#fbbf24', fontWeight: 800, fontSize: 14 }}>{item.sellPrice}</span>
                      <span style={{ color: '#fbbf2466', fontSize: 10, marginLeft: 3 }}>g</span>
                    </div>

                    {/* Sell */}
                    <button
                      onClick={() => setConfirmSell({ type: 'item', id: item.equippedItemId, name: item.name, price: item.sellPrice })}
                      style={{
                        padding: '5px 14px', flexShrink: 0,
                        background: 'linear-gradient(135deg, rgba(153,27,27,0.8), rgba(127,29,29,0.6))',
                        color: '#fca5a5', border: '1px solid rgba(185,28,28,0.5)',
                        borderRadius: 7, fontSize: 11, fontWeight: 700,
                        cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase',
                      }}
                    >
                      {t('inv_sell_btn')}
                    </button>
                  </div>
                </EquipmentTooltip>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Abilities section ──────────────────────────────────────────────── */}
      <section style={{
        background: 'rgba(10,10,24,0.6)', borderRadius: 14,
        border: '1px solid rgba(255,255,255,0.05)',
      }}>
        {/* Section header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '16px 22px',
          background: 'linear-gradient(90deg, rgba(167,139,250,0.07) 0%, transparent 60%)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}>
          <span style={{ fontSize: 18 }}>✦</span>
          <span style={{ color: '#e8e8f0', fontSize: 15, fontWeight: 700, letterSpacing: '0.04em' }}>{t('inv_section_abilities')}</span>
          <span style={{
            background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.25)',
            color: '#a78bfa', fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 20,
          }}>
            {abilities.length}
          </span>
        </div>

        {abilities.length === 0 ? (
          <div style={{ color: '#2a2a4a', fontSize: 13, padding: '28px 22px', textAlign: 'center', fontStyle: 'italic' }}>
            {t('inv_empty_abilities')}
          </div>
        ) : (
          Object.entries(abilitiesByHero).map(([heroName, heroAbilities], groupIdx, arr) => (
            <div key={heroName}>
              {/* Hero group label */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 22px',
                background: 'linear-gradient(90deg, rgba(167,139,250,0.08) 0%, transparent 50%)',
                borderBottom: '1px solid rgba(167,139,250,0.1)',
                borderTop: groupIdx > 0 ? '1px solid rgba(255,255,255,0.04)' : undefined,
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#a78bfa', boxShadow: '0 0 6px #a78bfa' }} />
                <span style={{ color: '#a78bfa', fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  {heroName}
                </span>
              </div>

              {heroAbilities.map((ab, i) => {
                const tc = ABILITY_TIER_COLOR[ab.tier] ?? '#9ca3af';
                return (
                  <EquipmentTooltip key={ab.equippedAbilityId} name={ab.name} type="ability" bonuses={ab.bonuses} tier={ab.tier} sellPrice={ab.sellPrice} spells={ab.spells ?? []} block>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '12px 22px', width: '100%', boxSizing: 'border-box',
                      borderBottom: i < heroAbilities.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                      borderLeft: `3px solid ${tc}`,
                      background: `linear-gradient(90deg, ${tc}08 0%, transparent 40%)`,
                      cursor: 'default',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = `linear-gradient(90deg, ${tc}14 0%, transparent 50%)`}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = `linear-gradient(90deg, ${tc}08 0%, transparent 40%)`}
                    >
                      {/* Tier icon */}
                      <div style={{
                        width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: tc + '16', border: `2px solid ${tc}40`,
                        boxShadow: `0 0 12px ${tc}33`,
                      }}>
                        <AbilityTierIcon tier={ab.tier} size={22} />
                      </div>

                      {/* Name + badges */}
                      <div style={{ minWidth: 160, flexShrink: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                          <span style={{ color: '#e8e8f0', fontWeight: 700, fontSize: 13 }}>{ab.name}</span>
                          {ab.spells && ab.spells.length > 0 && (
                            <span style={{
                              fontSize: 8, fontWeight: 800, padding: '1px 5px', borderRadius: 4,
                              background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.3)',
                              color: '#60a5fa', letterSpacing: '0.06em', textTransform: 'uppercase',
                            }}>{ab.spells.length > 1 ? t('inv_spells_badge').replace('{n}', String(ab.spells.length)) : t('inv_spell_badge')}</span>
                          )}
                        </div>
                        <span style={{
                          fontSize: 9, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase',
                          padding: '1px 6px', borderRadius: 4,
                          background: tc + '20', border: `1px solid ${tc}50`, color: tc,
                        }}>
                          {ABILITY_TIER_LABEL[ab.tier]}
                        </span>
                      </div>

                      {/* Stat chips */}
                      <div style={{ flex: 1 }}>
                        <StatChips bonuses={ab.bonuses} />
                      </div>

                      {/* Slot */}
                      <div style={{ minWidth: 110, textAlign: 'center' }}>
                        {ab.slotNumber !== null ? (
                          <span style={{
                            background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)',
                            color: '#4ade80', borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 600,
                          }}>
                            {t('inv_slot_badge').replace('{n}', String(ab.slotNumber))}
                          </span>
                        ) : (
                          <span style={{
                            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                            color: '#3a3a5a', borderRadius: 6, padding: '3px 10px', fontSize: 11,
                          }}>
                            {t('inv_unslotted')}
                          </span>
                        )}
                      </div>

                      {/* Gold */}
                      <div style={{ minWidth: 70, textAlign: 'right', flexShrink: 0, marginLeft: 'auto' }}>
                        <span style={{ color: '#fbbf24', fontWeight: 800, fontSize: 14 }}>{ab.sellPrice}</span>
                        <span style={{ color: '#fbbf2466', fontSize: 10, marginLeft: 3 }}>g</span>
                      </div>

                      {/* Sell */}
                      <button
                        onClick={() => setConfirmSell({ type: 'ability', id: ab.equippedAbilityId, name: ab.name, price: ab.sellPrice })}
                        style={{
                          padding: '5px 14px', flexShrink: 0,
                          background: 'linear-gradient(135deg, rgba(153,27,27,0.8), rgba(127,29,29,0.6))',
                          color: '#fca5a5', border: '1px solid rgba(185,28,28,0.5)',
                          borderRadius: 7, fontSize: 11, fontWeight: 700,
                          cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase',
                        }}
                      >
                        Sell
                      </button>
                    </div>
                  </EquipmentTooltip>
                );
              })}

              {groupIdx < arr.length - 1 && (
                <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(167,139,250,0.15), transparent)' }} />
              )}
            </div>
          ))
        )}
      </section>
    </div>
  );
}
