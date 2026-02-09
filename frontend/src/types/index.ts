// Player
export interface PlayerInfo {
  id: number;
  username: string;
  gold: number;
  diamonds: number;
  arenaEnergy: number;
  arenaEnergyMax: number;
  worldEnergy: number;
  worldEnergyMax: number;
  nextEnergyTickSeconds: number | null;
  isOnline: boolean;
  onlineMinutesRemaining: number | null;
}

// Hero Stats
export interface HeroStats {
  physicalAttack: number;
  magicPower: number;
  dexterity: number;
  element: number;
  mana: number;
  stamina: number;
}

// Equipped Item Summary
export interface EquippedItemSummary {
  slotNumber: number;
  itemId: number;
  name: string;
  bonusPa?: number;
  bonusMp?: number;
  bonusDex?: number;
  bonusElem?: number;
  bonusMana?: number;
  bonusStam?: number;
}

// Equipped Ability Summary
export interface EquippedAbilitySummary {
  abilityId: number;
  name: string;
  bonusPa?: number;
  bonusMp?: number;
  bonusDex?: number;
  bonusElem?: number;
  bonusMana?: number;
  bonusStam?: number;
}

// Hero
export interface HeroResponse {
  id: number;
  templateId: number;
  name: string;
  imagePath: string;
  level: number;
  currentXp: number;
  xpToNextLevel: number;
  capacity: number;
  isEquipped: boolean;
  teamSlot: number | null;
  stats: HeroStats;
  bonusStats: HeroStats;
  equippedItems: EquippedItemSummary[];
  equippedAbilities: EquippedAbilitySummary[];
}

// Summon
export interface SummonResponse {
  id: number;
  templateId: number;
  name: string;
  imagePath: string;
  level: number;
  currentXp: number;
  xpToNextLevel: number;
  capacity: number;
  isEquipped: boolean;
  stats: { mana: number; magicPower: number };
  teamBonus: string;
}

// Team
export interface TeamSlotResponse {
  slotNumber: number;
  type: 'hero' | 'summon';
  hero?: {
    id: number;
    name: string;
    imagePath: string;
    level: number;
    capacity: number;
    totalStats: HeroStats;
  } | null;
  summon?: {
    id: number;
    name: string;
    imagePath: string;
    level: number;
    capacity: number;
    teamBonus: string;
  } | null;
}

export interface TeamResponse {
  capacity: { used: number; max: number };
  teamPower: number;
  slots: TeamSlotResponse[];
}

// Shop
export interface ShopHero {
  templateId: number;
  name: string;
  displayName: string;
  imagePath: string;
  cost: number;
  capacity: number;
  baseStats: HeroStats;
  growthStats: HeroStats;
  owned: boolean;
}

export interface ShopSummon {
  templateId: number;
  name: string;
  imagePath: string;
  cost: number;
  capacity: number;
  baseStats: { mana: number; magicPower: number };
  growthStats: { mana: number; magicPower: number };
  owned: boolean;
}

export interface ShopItem {
  templateId: number;
  name: string;
  cost: number;
  bonuses: Record<string, number>;
}

export interface ShopAbility {
  templateId: number;
  name: string;
  cost: number;
  tier: number;
  bonuses: Record<string, number>;
  owned: boolean;
}

// Arena
export interface ArenaOpponent {
  playerId: number;
  username: string;
  teamPower: number;
  isOnline: boolean;
  heroCount: number;
  hasPendingReturn: boolean;
  energyCost: number;
}

// Battle
export interface BattleRound {
  roundNumber: number;
  attackerHero: string;
  attackerLevel: number;
  attackerAttackValue: number;
  defenderHero: string;
  defenderLevel: number;
  defenderAttackValue: number;
  winner: 'attacker' | 'defender';
  attackerStaminaModifier?: number;
  defenderStaminaModifier?: number;
}

export interface BattleLogDetail {
  challenger: { username: string; heroes: string[] };
  defender: { username: string; heroes: string[] };
  rounds: BattleRound[];
  winner: 'challenger' | 'defender';
  xpGained: { challenger: Record<string, number>; defender: Record<string, number> };
  summonXp: { challenger: number; defender: number };
}

export interface BattleResult {
  battleId: number;
  result: 'WIN' | 'LOSS';
  goldEarned: number;
  energyCost: number;
  arenaEnergyRemaining: number;
  battleLog: BattleLogDetail;
}

export interface BattleLogEntry {
  battleId: number;
  opponentUsername: string;
  opponentId: number;
  result: 'WIN' | 'LOSS';
  goldEarned: number;
  wasChallenger: boolean;
  canReturnChallenge: boolean;
  returnEnergyCost: number | null;
  createdAt: string;
}

// Equipment detail
export interface EquipmentItemSlot {
  slotNumber: number;
  equippedItemId: number | null;
  itemTemplateId: number | null;
  name: string | null;
  bonuses: Record<string, number> | null;
  sellPrice: number | null;
}

export interface EquipmentAbility {
  equippedAbilityId: number;
  abilityTemplateId: number;
  name: string;
  tier: number;
  bonuses: Record<string, number>;
}

export interface HeroEquipment {
  heroId: number;
  heroName: string;
  items: EquipmentItemSlot[];
  abilities: EquipmentAbility[];
}

// Auth
export interface LoginResponse {
  token: string;
  playerId: number;
  username: string;
}
