export interface SummonStatDisplay {
  label: string;
  pct?: boolean;
}

export const SUMMON_STAT_CONFIG: Record<string, SummonStatDisplay> = {
  mana:             { label: 'Mana'                   },
  magicPower:       { label: 'Magic Power'       },
  magicProficiency: { label: 'Magic Prof',    pct: true },
  spellMastery:     { label: 'Spell Mastery',  pct: true },
  critChance:       { label: 'Crit Chance',   pct: true },
  critDamage:       { label: 'Crit Damage',   pct: true },
  dexterity:        { label: 'Dexterity'          },
  dexProficiency:   { label: 'Dex Prof',      pct: true },
  dexPosture:       { label: 'Dex Posture',   pct: true },
  goldBonus:        { label: 'Gold Bonus',        pct: true },
  itemFind:         { label: 'Item Find'               },
  xpBonus:          { label: 'XP Bonus',          pct: true },
  attack:           { label: 'Attack'                  },
  spellActivation:  { label: 'Spell Activation',  pct: true },
  stamina:          { label: 'Stamina'                 },
  physicalAttack:   { label: 'Phys Attack'             },
};
