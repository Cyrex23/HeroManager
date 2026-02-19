import { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { getBattle } from '../api/arenaApi';
import type { BattleLog, BattleResultResponse } from '../types';
import BattleAnimator from '../components/Battle/BattleAnimator';

const ELEMENT_COLOR: Record<string, string> = {
  FIRE: '#f97316', WATER: '#38bdf8', WIND: '#86efac',
  EARTH: '#a16207', LIGHTNING: '#facc15',
};
const ELEMENT_SYMBOL: Record<string, string> = {
  FIRE: '🔥', WATER: '💧', WIND: '🌀', EARTH: '⛰️', LIGHTNING: '⚡',
};
const ELEM_BEATS: Record<string, string> = {
  FIRE: 'WIND', WATER: 'FIRE', LIGHTNING: 'EARTH', WIND: 'LIGHTNING', EARTH: 'WATER',
};

export default function BattlePage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const passedResult = (location.state as { battleResult?: BattleResultResponse })?.battleResult;

  const [battleLog, setBattleLog] = useState<BattleLog | null>(
    passedResult?.battleLog as BattleLog | null
  );
  const [result] = useState<string | null>(passedResult?.result ?? null);
  const [goldEarned] = useState<number | null>(passedResult?.goldEarned ?? null);
  const [loading, setLoading] = useState(!passedResult);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    if (!passedResult && id) {
      getBattle(Number(id))
        .then((data) => {
          setBattleLog(data);
          setLoading(false);
        })
        .catch(() => { setFetchError(true); setLoading(false); });
    }
  }, [id, passedResult]);

  if (loading) return <div style={{ color: '#a0a0b0' }}>Loading battle...</div>;
  if (fetchError) return <div style={{ color: '#e94560' }}>Failed to load battle. It may not exist or you don't have access.</div>;
  if (!battleLog) return <div style={{ color: '#e94560' }}>Battle not found.</div>;

  return (
    <div>
      <Link to="/arena" style={styles.backLink}>Back to Arena</Link>

      {/* ── Battle Animator ── */}
      <BattleAnimator battleLog={battleLog} result={result} goldEarned={goldEarned} />

      {result && (
        <div style={{
          ...styles.resultBanner,
          backgroundColor: result === 'WIN' ? 'rgba(74, 222, 128, 0.15)' : 'rgba(233, 69, 96, 0.15)',
          borderColor: result === 'WIN' ? '#4ade80' : '#e94560',
        }}>
          <span style={{ fontSize: 24, fontWeight: 700, color: result === 'WIN' ? '#4ade80' : '#e94560' }}>
            {result === 'WIN' ? 'Victory!' : 'Defeat'}
          </span>
          {goldEarned != null && (
            <span style={{ color: '#fbbf24', fontSize: 16 }}>+{goldEarned} gold</span>
          )}
        </div>
      )}

      <div style={styles.teams}>
        <div style={styles.team}>
          <h3 style={styles.teamLabel}>
            {battleLog.challenger.username}
            {battleLog.winner === 'challenger' && <span style={styles.winTag}> Winner</span>}
          </h3>
          <div style={styles.heroList}>
            {battleLog.challenger.heroes.map((h, i) => (
              <span key={i} style={styles.heroName}>{h}</span>
            ))}
          </div>
        </div>
        <div style={styles.vs}>VS</div>
        <div style={styles.team}>
          <h3 style={styles.teamLabel}>
            {battleLog.defender.username}
            {battleLog.winner === 'defender' && <span style={styles.winTag}> Winner</span>}
          </h3>
          <div style={styles.heroList}>
            {battleLog.defender.heroes.map((h, i) => (
              <span key={i} style={styles.heroName}>{h}</span>
            ))}
          </div>
        </div>
      </div>

      <h3 style={styles.subtitle}>Battle Rounds</h3>
      <div style={styles.rounds}>
        {battleLog.rounds.map((round) => (
          <div key={round.roundNumber} style={styles.round}>
            <div style={styles.roundNum}>Round {round.roundNumber}</div>
            <div style={styles.roundContent}>
              <span style={{
                color: round.winner === 'attacker' ? '#4ade80' : '#e0e0e0',
                fontWeight: round.winner === 'attacker' ? 700 : 400,
              }}>
                {round.attackerHero} (Lv.{round.attackerLevel}) - {round.attackerAttackValue.toFixed(2)}
              </span>
              <span style={styles.vsSmall}>vs</span>
              <span style={{
                color: round.winner === 'defender' ? '#4ade80' : '#e0e0e0',
                fontWeight: round.winner === 'defender' ? 700 : 400,
              }}>
                {round.defenderHero} (Lv.{round.defenderLevel}) - {round.defenderAttackValue.toFixed(2)}
              </span>
            </div>
            {((round.attackerStaminaModifier != null && round.attackerStaminaModifier < 1) ||
              (round.defenderStaminaModifier != null && round.defenderStaminaModifier < 1)) && (
              <div style={styles.staminaNote}>
                {round.attackerStaminaModifier != null && round.attackerStaminaModifier < 1 && (
                  <span>Attacker Stamina: {(round.attackerStaminaModifier * 100).toFixed(0)}% </span>
                )}
                {round.defenderStaminaModifier != null && round.defenderStaminaModifier < 1 && (
                  <span>Defender Stamina: {(round.defenderStaminaModifier * 100).toFixed(0)}%</span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {battleLog.xpGained && (
        <>
          <h3 style={styles.subtitle}>XP Gained</h3>
          <div style={styles.xpSection}>
            {Object.entries(battleLog.xpGained.challenger).map(([hero, xp]) => (
              <div key={hero} style={styles.xpEntry}>
                <span style={styles.heroName}>{battleLog.challenger.username}'s {hero}</span>
                <span style={{ color: '#4ade80' }}>+{xp} XP</span>
              </div>
            ))}
            {battleLog.summonXp?.challenger > 0 && (
              <div style={styles.xpEntry}>
                <span style={{ ...styles.heroName, color: '#a78bfa' }}>
                  {battleLog.challenger.username}'s Summon
                </span>
                <span style={{ color: '#4ade80' }}>+{battleLog.summonXp.challenger} XP</span>
              </div>
            )}
            {Object.entries(battleLog.xpGained.defender).map(([hero, xp]) => (
              <div key={hero} style={styles.xpEntry}>
                <span style={styles.heroName}>{battleLog.defender.username}'s {hero}</span>
                <span style={{ color: '#4ade80' }}>+{xp} XP</span>
              </div>
            ))}
            {battleLog.summonXp?.defender > 0 && (
              <div style={styles.xpEntry}>
                <span style={{ ...styles.heroName, color: '#a78bfa' }}>
                  {battleLog.defender.username}'s Summon
                </span>
                <span style={{ color: '#4ade80' }}>+{battleLog.summonXp.defender} XP</span>
              </div>
            )}
          </div>
        </>
      )}

      <h3 style={styles.subtitle}>Battle Logs</h3>
      <div style={styles.rounds}>
        {battleLog.rounds.map((round) => {
          const aElem = round.attackerElement;
          const dElem = round.defenderElement;
          const aHasAdvantage = !!(aElem && dElem && ELEM_BEATS[aElem] === dElem);
          const dHasAdvantage = !!(aElem && dElem && ELEM_BEATS[dElem] === aElem);

          return (
            <div key={`math-${round.roundNumber}`} style={styles.round}>
              <div style={styles.roundNum}>Round {round.roundNumber}</div>

              {/* Element matchup banner */}
              {(aElem || dElem) && (
                <div style={styles.elemMatchup}>
                  <span style={{ color: aElem ? (ELEMENT_COLOR[aElem] ?? '#a0a0b0') : '#555' }}>
                    {aElem ? (ELEMENT_SYMBOL[aElem] ?? aElem) : '—'} {aElem ?? 'No element'}
                  </span>
                  {aHasAdvantage && <span style={styles.elemAdvantageTag}>▶ Advantage</span>}
                  {dHasAdvantage && <span style={styles.elemDisadvantageTag}>◀ Disadvantage</span>}
                  {!aHasAdvantage && !dHasAdvantage && <span style={styles.elemNeutralTag}>↔ Neutral</span>}
                  <span style={{ color: dElem ? (ELEMENT_COLOR[dElem] ?? '#a0a0b0') : '#555' }}>
                    {dElem ? (ELEMENT_SYMBOL[dElem] ?? dElem) : '—'} {dElem ?? 'No element'}
                  </span>
                </div>
              )}

              <div style={styles.mathGrid}>
                {/* Attacker column */}
                <div style={styles.mathCol}>
                  <div style={styles.mathHeroLabel}>
                    {round.attackerHero}
                    {aElem && (
                      <span style={{ color: ELEMENT_COLOR[aElem] ?? '#a0a0b0', marginLeft: 4 }}>
                        {ELEMENT_SYMBOL[aElem] ?? aElem}
                      </span>
                    )}
                  </div>
                  {/* Stats reference */}
                  <div style={styles.statsRef}>
                    <span>PA <strong>{(round.attackerStatPa ?? 0).toFixed(1)}</strong></span>
                    <span>MP <strong>{(round.attackerStatMp ?? 0).toFixed(1)}</strong></span>
                    <span>Dex <strong>{(round.attackerStatDex ?? 0).toFixed(1)}</strong></span>
                    <span>Elem <strong>{(round.attackerStatElem ?? 0).toFixed(1)}</strong></span>
                    <span>Mana <strong>{(round.attackerStatMana ?? 0).toFixed(1)}</strong></span>
                    <span>Stam <strong>{(round.attackerStatStam ?? 0).toFixed(1)}</strong></span>
                  </div>
                  {/* Calculation */}
                  <div style={styles.mathRow}>
                    <span style={styles.mathKey}>PA ×0.5</span>
                    <span style={styles.mathVal}>{(round.attackerPaContrib ?? 0).toFixed(2)}</span>
                  </div>
                  <div style={styles.mathRow}>
                    <span style={styles.mathKey}>MP ×rand</span>
                    <span style={styles.mathVal}>{(round.attackerMpContrib ?? 0).toFixed(2)}</span>
                  </div>
                  <div style={styles.mathRow}>
                    <span style={styles.mathKey}>Dex ×0.33</span>
                    <span style={styles.mathVal}>{(round.attackerDexContrib ?? 0).toFixed(2)}</span>
                  </div>
                  <div style={{ ...styles.mathRow, borderTop: '1px solid #16213e', marginTop: 2, paddingTop: 2 }}>
                    <span style={styles.mathKey}>Raw total</span>
                    <span style={styles.mathVal}>{(round.attackerRawAttack ?? 0).toFixed(2)}</span>
                  </div>
                  {round.attackerStaminaReduction != null && round.attackerStaminaReduction > 0 && (
                    <div style={styles.mathRow}>
                      <span style={styles.mathKey}>Stamina −{((1 - (round.attackerStaminaModifier ?? 1)) * 100).toFixed(0)}%</span>
                      <span style={{ ...styles.mathVal, color: '#fbbf24' }}>−{round.attackerStaminaReduction.toFixed(2)}</span>
                    </div>
                  )}
                  {round.attackerElementBonus != null && round.attackerElementBonus > 0 && (
                    <div style={styles.mathRow}>
                      <span style={styles.mathKey}>Elem bonus</span>
                      <span style={{ ...styles.mathVal, color: '#4ade80' }}>+{round.attackerElementBonus.toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ ...styles.mathRow, marginTop: 4 }}>
                    <span style={{ ...styles.mathKey, color: '#e0e0e0', fontWeight: 700 }}>Final</span>
                    <span style={{ ...styles.mathVal, fontWeight: 700, color: round.winner === 'attacker' ? '#4ade80' : '#e94560' }}>
                      {round.attackerAttackValue.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div style={styles.mathDivider} />

                {/* Defender column */}
                <div style={styles.mathCol}>
                  <div style={styles.mathHeroLabel}>
                    {round.defenderHero}
                    {dElem && (
                      <span style={{ color: ELEMENT_COLOR[dElem] ?? '#a0a0b0', marginLeft: 4 }}>
                        {ELEMENT_SYMBOL[dElem] ?? dElem}
                      </span>
                    )}
                  </div>
                  {/* Stats reference */}
                  <div style={styles.statsRef}>
                    <span>PA <strong>{(round.defenderStatPa ?? 0).toFixed(1)}</strong></span>
                    <span>MP <strong>{(round.defenderStatMp ?? 0).toFixed(1)}</strong></span>
                    <span>Dex <strong>{(round.defenderStatDex ?? 0).toFixed(1)}</strong></span>
                    <span>Elem <strong>{(round.defenderStatElem ?? 0).toFixed(1)}</strong></span>
                    <span>Mana <strong>{(round.defenderStatMana ?? 0).toFixed(1)}</strong></span>
                    <span>Stam <strong>{(round.defenderStatStam ?? 0).toFixed(1)}</strong></span>
                  </div>
                  {/* Calculation */}
                  <div style={styles.mathRow}>
                    <span style={styles.mathKey}>PA ×0.5</span>
                    <span style={styles.mathVal}>{(round.defenderPaContrib ?? 0).toFixed(2)}</span>
                  </div>
                  <div style={styles.mathRow}>
                    <span style={styles.mathKey}>MP ×rand</span>
                    <span style={styles.mathVal}>{(round.defenderMpContrib ?? 0).toFixed(2)}</span>
                  </div>
                  <div style={styles.mathRow}>
                    <span style={styles.mathKey}>Dex ×0.33</span>
                    <span style={styles.mathVal}>{(round.defenderDexContrib ?? 0).toFixed(2)}</span>
                  </div>
                  <div style={{ ...styles.mathRow, borderTop: '1px solid #16213e', marginTop: 2, paddingTop: 2 }}>
                    <span style={styles.mathKey}>Raw total</span>
                    <span style={styles.mathVal}>{(round.defenderRawAttack ?? 0).toFixed(2)}</span>
                  </div>
                  {round.defenderStaminaReduction != null && round.defenderStaminaReduction > 0 && (
                    <div style={styles.mathRow}>
                      <span style={styles.mathKey}>Stamina −{((1 - (round.defenderStaminaModifier ?? 1)) * 100).toFixed(0)}%</span>
                      <span style={{ ...styles.mathVal, color: '#fbbf24' }}>−{round.defenderStaminaReduction.toFixed(2)}</span>
                    </div>
                  )}
                  {round.defenderElementBonus != null && round.defenderElementBonus > 0 && (
                    <div style={styles.mathRow}>
                      <span style={styles.mathKey}>Elem bonus</span>
                      <span style={{ ...styles.mathVal, color: '#4ade80' }}>+{round.defenderElementBonus.toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ ...styles.mathRow, marginTop: 4 }}>
                    <span style={{ ...styles.mathKey, color: '#e0e0e0', fontWeight: 700 }}>Final</span>
                    <span style={{ ...styles.mathVal, fontWeight: 700, color: round.winner === 'defender' ? '#4ade80' : '#e94560' }}>
                      {round.defenderAttackValue.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  backLink: {
    color: '#a0a0b0',
    textDecoration: 'none',
    fontSize: 13,
    display: 'inline-block',
    marginBottom: 16,
  },
  resultBanner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 16,
    borderRadius: 8,
    border: '1px solid',
    marginBottom: 24,
  },
  teams: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 24,
  },
  team: {
    flex: 1,
    textAlign: 'center',
  },
  teamLabel: {
    color: '#e0e0e0',
    fontSize: 16,
    marginBottom: 8,
  },
  winTag: {
    color: '#4ade80',
    fontSize: 12,
  },
  heroList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  heroName: {
    color: '#a0a0b0',
    fontSize: 13,
  },
  vs: {
    color: '#e94560',
    fontWeight: 700,
    fontSize: 18,
    paddingTop: 24,
  },
  subtitle: {
    color: '#e0e0e0',
    marginTop: 24,
    marginBottom: 12,
    fontSize: 16,
  },
  rounds: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  round: {
    padding: '10px 14px',
    backgroundColor: '#1a1a2e',
    borderRadius: 6,
    border: '1px solid #16213e',
  },
  roundNum: {
    color: '#a0a0b0',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  roundContent: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
    flexWrap: 'wrap',
  },
  vsSmall: {
    color: '#666',
    fontSize: 11,
  },
  staminaNote: {
    color: '#fbbf24',
    fontSize: 11,
    marginTop: 4,
  },
  xpSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  xpEntry: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '6px 12px',
    backgroundColor: '#1a1a2e',
    borderRadius: 4,
    fontSize: 13,
  },
  elemMatchup: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    fontSize: 12,
    marginBottom: 8,
    padding: '4px 8px',
    backgroundColor: '#12122a',
    borderRadius: 4,
  },
  elemAdvantageTag: {
    color: '#4ade80',
    fontSize: 11,
    fontWeight: 600,
  },
  elemDisadvantageTag: {
    color: '#e94560',
    fontSize: 11,
    fontWeight: 600,
  },
  elemNeutralTag: {
    color: '#555',
    fontSize: 11,
  },
  statsRef: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '2px 8px',
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
    paddingBottom: 4,
    borderBottom: '1px solid #16213e',
  },
  mathGrid: {
    display: 'flex',
    gap: 0,
  },
  mathCol: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  mathDivider: {
    width: 1,
    backgroundColor: '#16213e',
    margin: '0 12px',
  },
  mathHeroLabel: {
    color: '#a0a0b0',
    fontSize: 11,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 4,
    fontWeight: 600,
  },
  mathRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mathKey: {
    color: '#666',
    fontSize: 11,
  },
  mathVal: {
    color: '#a0a0b0',
    fontSize: 12,
    fontVariantNumeric: 'tabular-nums' as const,
  },
};
