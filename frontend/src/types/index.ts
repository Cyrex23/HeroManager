// ============================================================
// Auth Types
// ============================================================

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface LoginRequest {
  login: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  playerId: number;
  username: string;
}

export interface ResendConfirmationRequest {
  email: string;
}

export interface MessageResponse {
  message: string;
}

export interface ConfirmResponse {
  message: string;
  alreadyConfirmed: boolean;
}

export interface ErrorResponse {
  error: string;
  message: string;
}

// ============================================================
// Player Types
// ============================================================

export interface PlayerResponse {
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
  onlineMinutesRemaining: number;
  profileImagePath: string | null;
  teamName: string;
  chatSoundEnabled: boolean;
  extraLineupGoldPurchased: boolean;
  extraLineupDiamondsPurchased: boolean;
  energyPlusPurchased: boolean;
  heroPlusCapacityPurchased: boolean;
  capacityPlusCount: number;
  statResetUnlocked: boolean;
  extraCraftingSlotPurchased: boolean;
  doubleSpinPurchased: boolean;
  battleLogUnlocked: boolean;
  returnCapUpgraded: boolean;
  challengeLimitUpgraded: boolean;
  energyGainUpgraded: boolean;
  nextTickGain: number;
  lineupSlots: number;
  heroRosterMax: number;
  teamCapacityMax: number;
}

// ============================================================
// Stats Types
// ============================================================

export interface HeroStats {
  physicalAttack: number;
  magicPower: number;
  dexterity: number;
  element: number;
  mana: number;
  stamina: number;
  // Sub-stats (base values + equipment bonuses)
  dexProficiency?: number;
  dexPosture?: number;
  critDamage?: number;
  critChance?: number;
  attack?: number;
  magicProficiency?: number;
  spellMastery?: number;
  spellActivation?: number;
  expBonus?: number;
  goldBonus?: number;
  itemDiscovery?: number;
  physicalImmunity?: number;
  magicImmunity?: number;
  dexEvasiveness?: number;
  offPositioning?: number;
  tenacity?: number;
  fatigueRecovery?: number;
  cleanse?: number;
  dexMaxPosture?: number;
  rot?: number;
}

export type SummonStats = Record<string, number>;

// ============================================================
// Hero Types
// ============================================================

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
  baseStats: HeroStats;
  growthStats: HeroStats;
  bonusStats: HeroStats;
  summonStats: Partial<HeroStats>;
  equippedItems: EquippedItemSummary[];
  equippedAbilities: EquippedAbilitySummary[];
  tier: 'COMMONER' | 'ELITE' | 'LEGENDARY' | null;
  element: string | null;
  clashesWon: number;
  clashesLost: number;
  currentWinStreak: number;
  currentLossStreak: number;
  bestWinStreak: number;
  bestLossStreak: number;
  maxDamageDealt: number;
  maxDamageReceived: number;
  maxPaDamage: number;
  maxMpDamage: number;
  maxDexDamage: number;
  maxElemDamage: number;
  totalPaDamage: number;
  totalMpDamage: number;
  totalDexDamage: number;
  totalElemDamage: number;
  sellPrice: number;
  statPurchaseCount: number;
  nextStatCost: number;
  unallocatedStatPoints: number;
  statResetCount: number;
  nextResetCost: number;
  seal: number;
  sealPoints: number;
  capacityHalved: boolean;
  purchasedStats: HeroStats;
}

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
  stats: SummonStats;
  teamBonus: string;
  sellPrice: number;
  capacityHalved: boolean;
}

// ============================================================
// Team Types
// ============================================================

export interface Capacity {
  used: number;
  max: number;
}

export interface TeamSlotHero {
  id: number;
  name: string;
  imagePath: string;
  level: number;
  capacity: number;
  totalStats: HeroStats;
  currentXp: number;
  xpToNextLevel: number;
  tier: 'COMMONER' | 'ELITE' | 'LEGENDARY' | null;
  element: string | null;
  equippedSlots?: Array<{
    slotNumber: number;
    type: 'item' | 'ability' | null;
    name: string | null;
    bonuses?: Partial<HeroStats>;
    tier?: number | null;
    cost?: number | null;
    copies?: number | null;
    spells?: SpellInfo[];
  }>;
}

export interface TeamSlotSummon {
  id: number;
  name: string;
  imagePath: string;
  level: number;
  capacity: number;
  teamBonus: string;
  stats: SummonStats;
  currentXp: number;
  xpToNextLevel: number;
}

export interface TeamSlot {
  slotNumber: number;
  type: 'hero' | 'summon';
  slotTier: 'COMMONER' | 'ELITE' | 'LEGENDARY' | null;
  hero: TeamSlotHero | null;
  summon: TeamSlotSummon | null;
}

export interface TeamResponse {
  capacity: Capacity;
  teamPower: number;
  slots: TeamSlot[];
}

export interface EquipHeroRequest {
  heroId: number;
  slotNumber: number;
}

export interface UnequipHeroRequest {
  slotNumber: number;
}

export interface EquipSummonRequest {
  summonId: number;
}

export interface ReorderRequest {
  order: (number | null)[];
}

export interface EquipResponse {
  message: string;
  capacity: Capacity;
}

// ============================================================
// Shop Types
// ============================================================

export interface ShopHeroResponse {
  templateId: number;
  name: string;
  displayName: string;
  imagePath: string;
  cost: number;
  capacity: number;
  baseStats: HeroStats;
  growthStats: HeroStats;
  owned: boolean;
  tier: 'COMMONER' | 'ELITE' | 'LEGENDARY' | null;
  element: string | null;
}

export interface ShopSummonResponse {
  templateId: number;
  name: string;
  imagePath: string;
  cost: number;
  capacity: number;
  baseStats: SummonStats;
  growthStats: SummonStats;
  owned: boolean;
}

export interface ShopListResponse {
  heroes: ShopHeroResponse[];
  summons: ShopSummonResponse[];
}

export interface BuyHeroRequest {
  templateId: number;
}

export interface BuyHeroResponse {
  message: string;
  heroId: number;
  goldRemaining: number;
}

export interface BuySummonRequest {
  templateId: number;
}

export interface BuySummonResponse {
  message: string;
  summonId: number;
  goldRemaining: number;
}

export interface ShopItemResponse {
  templateId: number;
  name: string;
  cost: number;
  bonuses: Partial<HeroStats>;
}

export interface ShopItemListResponse {
  items: ShopItemResponse[];
}

export interface BuyItemRequest {
  itemTemplateId: number;
}

export interface BuyItemResponse {
  message: string;
  goldRemaining: number;
}

export interface SpellInfo {
  name: string;
  manaCost: number;
  trigger: string; // ENTRANCE, ATTACK, AFTER_CLASH, AFTER_CLASH_CRIT, OPPONENT_ENTRANCE, BEFORE_TURN_X, AFTER_TURN_X
  chance: number;
  bonuses: Partial<HeroStats>;
  maxUsages?: number;
  lastsTurns?: number;
  affectsOpponent?: boolean;
  passOnType?: 'NEXT' | 'TEAM' | 'BATTLEFIELD';
  /** Team sub-spell that activates for all teammates when this parent spell triggers once */
  teamSpell?: SpellInfo;
}

export interface SpellEvent {
  spellName: string;
  manaCost: number;
  originalManaCost?: number;
  heroName: string;
  trigger: string;
  fired?: boolean;
  chance?: number;
  absorbed?: boolean;
  copied?: boolean;
  justLearned?: boolean;
  fromLearned?: boolean;
  bonuses?: Record<string, number>;
  lastsTurns?: number;
  overflowMult?: number;
}

export interface ShopAbilityResponse {
  templateId: number;
  name: string;
  cost: number;
  tier: number;
  bonuses: Partial<HeroStats>;
  owned: boolean;
  spells?: SpellInfo[];
}

export interface ShopAbilityListResponse {
  heroName: string;
  abilities: ShopAbilityResponse[];
}

export interface BuyAbilityRequest {
  abilityTemplateId: number;
  heroId: number;
}

export interface BuyAbilityResponse {
  message: string;
  goldRemaining: number;
}

// ============================================================
// Arena Types
// ============================================================

export interface ArenaOpponentResponse {
  playerId: number;
  username: string;
  teamPower: number;
  isOnline: boolean;
  heroCount: number;
  pendingReturnCount: number;
  energyCost: number;
  profileImagePath: string | null;
  teamName: string;
  wins: number;
  losses: number;
  directChallengesToday: number;
  directChallengeLimit: number;
}

export interface ArenaOpponentListResponse {
  opponents: ArenaOpponentResponse[];
  totalPlayers: number;
  page: number;
  size: number;
}

export interface ChallengeRequest {
  defenderId: number;
  returnChallenge?: boolean;
}

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
  attackerElementBonus?: number;
  defenderElementBonus?: number;
  attackerPaContrib?: number;
  attackerMpContrib?: number;
  attackerDexContrib?: number;
  attackerRawAttack?: number;
  attackerStaminaReduction?: number;
  attackerStatPa?: number;
  attackerStatMp?: number;
  attackerStatDex?: number;
  attackerStatAttack?: number;
  attackerStatSpellActivation?: number;
  attackerStatElem?: number;
  attackerStatMana?: number;
  attackerStatStam?: number;
  attackerElement?: string;
  defenderPaContrib?: number;
  defenderMpContrib?: number;
  defenderDexContrib?: number;
  defenderRawAttack?: number;
  defenderStaminaReduction?: number;
  defenderStatPa?: number;
  defenderStatMp?: number;
  defenderStatDex?: number;
  defenderStatAttack?: number;
  defenderStatSpellActivation?: number;
  defenderStatElem?: number;
  defenderStatMana?: number;
  defenderStatStam?: number;
  defenderElement?: string;
  attackerCrit?: boolean;
  defenderCrit?: boolean;
  attackerMagicProf?: boolean;
  defenderMagicProf?: boolean;
  attackerHighDex?: boolean;
  defenderHighDex?: boolean;
  attackerDexFactor?: number;
  defenderDexFactor?: number;
  attackerDexProficiency?: number;
  defenderDexProficiency?: number;
  attackerDexPosture?: number;
  defenderDexPosture?: number;
  attackerDexMaxPosture?: number;
  defenderDexMaxPosture?: number;
  attackerDexMaxPostureRecov?: number;
  defenderDexMaxPostureRecov?: number;
  attackerOffPositioning?: number;
  defenderOffPositioning?: number;
  attackerOffSlotPenalty?: number;
  defenderOffSlotPenalty?: number;
  attackerOffSlotRawMax?: number;
  defenderOffSlotRawMax?: number;
  attackerOffSlotEffMax?: number;
  defenderOffSlotEffMax?: number;
  attackerCritDamagePct?: number;
  defenderCritDamagePct?: number;
  attackerCritPaBonus?: number;
  defenderCritPaBonus?: number;
  attackerMpRoll?: number;
  defenderMpRoll?: number;
  attackerMpFirstRoll?: number;
  defenderMpFirstRoll?: number;
  attackerCritChance?: number;
  defenderCritChance?: number;
  attackerMagicProfChance?: number;
  defenderMagicProfChance?: number;
  attackerImagePath?: string;
  defenderImagePath?: string;
  challengerSpells?: SpellEvent[];
  defenderSpells?: SpellEvent[];
  challengerManaAfter?: number;
  defenderManaAfter?: number;
  attackerSpellMastery?: number;
  defenderSpellMastery?: number;
  attackerDexUsed?: number;
  attackerDexRecovered?: number;
  attackerDexRemaining?: number;
  defenderDexUsed?: number;
  defenderDexRecovered?: number;
  defenderDexRemaining?: number;
  attackerPhysImmunity?: number;
  attackerMagicImmunity?: number;
  attackerDexEvasiveness?: number;
  attackerPhysDenied?: number;
  attackerMagicDenied?: number;
  attackerDexDenied?: number;
  defenderPhysImmunity?: number;
  defenderMagicImmunity?: number;
  defenderDexEvasiveness?: number;
  defenderPhysDenied?: number;
  defenderMagicDenied?: number;
  defenderDexDenied?: number;
  challengerManaBeforeRecharge?: number;
  defenderManaBeforeRecharge?: number;
  challengerManaRegen?: number;
  challengerManaRechargeRate?: number;
  defenderManaRegen?: number;
  defenderManaRechargeRate?: number;
  attackerSpellLearn?: number;
  attackerSpellCopy?: number;
  attackerSpellAbsorb?: number;
  defenderSpellLearn?: number;
  defenderSpellCopy?: number;
  defenderSpellAbsorb?: number;
  challengerLearnedSpells?: string[];
  defenderLearnedSpells?: string[];
  // Tenacity
  attackerTenacity?: number;
  defenderTenacity?: number;
  attackerCapacityRaw?: number;
  defenderCapacityRaw?: number;
  // Cleanse
  attackerCleanseChance?: number;
  defenderCleanseChance?: number;
  attackerCleansed?: boolean;
  defenderCleansed?: boolean;
  // Fatigue Recovery
  attackerFatigueRec?: number;
  defenderFatigueRec?: number;
  attackerCapacityBeforeFR?: number;
  defenderCapacityBeforeFR?: number;
  // Rot
  attackerRotChance?: number;
  defenderRotChance?: number;
  attackerAppliedRot?: boolean;
  defenderAppliedRot?: boolean;
  attackerRotActive?: boolean;
  defenderRotActive?: boolean;
  attackerRotRemaining?: number;
  attackerRotTotal?: number;
  attackerRotReduction?: number;
  defenderRotRemaining?: number;
  defenderRotTotal?: number;
  defenderRotReduction?: number;
}

export interface BattleHeroInfo {
  name: string;
  imagePath: string;
  level: number;
  element?: string;
}

export interface LevelUpInfo {
  heroName: string;
  imagePath: string | null;
  newLevel: number;
  oldLevel: number;
  gainPa: number;
  gainMp: number;
  gainDex: number;
  gainElem: number;
  gainMana: number;
  gainStam: number;
}

export interface BattleLog {
  challenger: {
    username: string;
    teamPower?: number;
    profileImagePath?: string | null;
    heroes: BattleHeroInfo[];
    summon?: { name: string; imagePath: string } | null;
  };
  defender: {
    username: string;
    teamPower?: number;
    profileImagePath?: string | null;
    heroes: BattleHeroInfo[];
    summon?: { name: string; imagePath: string } | null;
  };
  rounds: BattleRound[];
  winner: 'challenger' | 'defender';
  levelUps?: {
    challenger: Record<string, LevelUpInfo>;
    defender: Record<string, LevelUpInfo>;
  };
  xpGained: {
    challenger: Record<string, number>;
    defender: Record<string, number>;
  };
  xpBonusPercent?: {
    challenger: Record<string, number>;
    defender: Record<string, number>;
  };
  summonXp: {
    challenger: number;
    defender: number;
  };
  challengerManaTotal?: number;
  defenderManaTotal?: number;
}

export interface BattleResultResponse {
  battleId: number;
  result: 'WIN' | 'LOSS';
  goldEarned: number;
  goldBase?: number;
  goldBonusPct?: number;
  energyCost: number;
  arenaEnergyRemaining: number;
  battleLog: BattleLog;
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

export interface BattleLogListResponse {
  battles: BattleLogEntry[];
  page: number;
  size: number;
}

// ============================================================
// Equipment Types
// ============================================================

export interface InventoryItem {
  equippedItemId: number;
  itemTemplateId: number;
  name: string;
  bonuses: Partial<HeroStats>;
  sellPrice: number;
  copies: number;
}

export interface HeroAbilityEntry {
  equippedAbilityId: number;
  abilityTemplateId: number;
  name: string;
  tier: number;
  bonuses: Partial<HeroStats>;
  slotNumber: number | null;
  copies: number;
  spells?: SpellInfo[];
}

export interface CombinedSlot {
  slotNumber: number;
  type: 'item' | 'ability' | null;
  id: number | null;
  templateId: number | null;
  name: string | null;
  bonuses: Partial<HeroStats> | null;
  sellPrice: number | null;
  copies: number | null;
  spells?: SpellInfo[];
}

export interface HeroEquipmentResponse {
  heroId: number;
  heroName: string;
  slots: CombinedSlot[];
  inventoryItems: InventoryItem[];
  heroAbilities: HeroAbilityEntry[];
}

export interface PlayerInventoryResponse {
  items: InventoryItem[];
}

export interface SellItemResponse {
  message: string;
  goldEarned: number;
  goldTotal: number;
}

// ============================================================
// Account Types
// ============================================================

export interface AvatarOption {
  imagePath: string;
  heroName: string;
}

export interface AccountData {
  username: string;
  teamName: string;
  profileImagePath: string | null;
  memberSince: string;
  totalBattles: number;
  wins: number;
  losses: number;
  winStreak: number;
  lossStreak: number;
  bestWinStreak: number;
  bestLossStreak: number;
  avatarOptions: AvatarOption[];
  canChangeTeamName: boolean;
  daysUntilTeamNameChange: number;
  chatSoundEnabled: boolean;
}

// ============================================================
// Chat Types
// ============================================================

export interface ChatMessage {
  id: number;
  senderId: number;
  senderUsername: string;
  content: string;
  createdAt: string;
  isOwn: boolean;
  receiverId: number | null;
}

export interface ChatPartner {
  playerId: number;
  username: string;
  profileImagePath: string | null;
  isOnline: boolean;
}

// ============================================================
// Leaderboard Types
// ============================================================

export interface LeaderboardHeroEntry {
  rank: number;
  heroId: number;
  name: string;
  imagePath: string;
  tier: 'COMMONER' | 'ELITE' | 'LEGENDARY' | null;
  element: string | null;
  level: number;
  clashesWon: number;
  clashesLost: number;
  ownerPlayerId: number;
  ownerUsername: string;
  ownerTeamName: string;
  ownerProfileImagePath: string | null;
}

export interface LeaderboardSummonEntry {
  rank: number;
  summonId: number;
  name: string;
  imagePath: string;
  level: number;
  ownerPlayerId: number;
  ownerUsername: string;
  ownerTeamName: string;
  ownerProfileImagePath: string | null;
}

export interface LeaderboardTeamEntry {
  rank: number;
  playerId: number;
  username: string;
  teamName: string;
  profileImagePath: string | null;
  teamPower: number;
  heroCount: number;
}

// ============================================================
// Friends
// ============================================================

export interface FriendEntry {
  playerId: number;
  username: string;
  teamName: string | null;
  profileImagePath: string | null;
  isOnline: boolean;
  relationStatus: 'ACCEPTED' | 'PENDING_SENT' | 'PENDING_RECEIVED' | 'NONE';
}

// ============================================================
// Team Setup Types
// ============================================================

export interface TeamSetupResponse {
  id: number;
  setupIndex: number;
  name: string;
  isActive: boolean;
}

// ============================================================
// Blacksmith
// ============================================================

export interface MaterialTemplate {
  id: number;
  name: string;
  iconKey: string;
  tier: number;
  category: string;
  quantity: number;
}

export interface WeaponIngredient {
  materialId: number;
  materialName: string;
  iconKey: string;
  required: number;
  have: number;
}

export interface WeaponSpellInfo {
  name: string;
  manaCost: number;
  trigger: string;
  chance: number;
  // Base stats
  bonusPa: number;
  bonusMp: number;
  bonusDex: number;
  bonusElem: number;
  bonusMana: number;
  bonusStam: number;
  // Combat modifiers
  bonusAttack: number;
  bonusMagicProficiency: number;
  bonusSpellMastery: number;
  bonusSpellActivation: number;
  bonusDexProficiency: number;
  bonusDexPosture: number;
  bonusCritChance: number;
  bonusCritDamage: number;
  // Progression
  bonusExpBonus: number;
  bonusGoldBonus: number;
  bonusItemDiscovery: number;
  // Immunities
  bonusPhysicalImmunity: number;
  bonusMagicImmunity: number;
  bonusDexEvasiveness: number;
  // Meta
  maxUsages: number;
  lastsTurns: number;
  affectsOpponent: boolean;
  turnThreshold: number;
}

export interface WeaponRecipe {
  recipeId: number;
  itemTemplateId: number;
  name: string;
  iconKey: string;
  weaponTier: 'COMMON' | 'EPIC' | 'LEGENDARY';
  cost: number;
  // Base stats
  bonusPa: number;
  bonusMp: number;
  bonusDex: number;
  bonusElem: number;
  bonusMana: number;
  bonusStam: number;
  // Combat modifiers
  bonusAttack: number;
  bonusMagicProficiency: number;
  bonusSpellMastery: number;
  bonusSpellActivation: number;
  bonusDexProficiency: number;
  bonusDexPosture: number;
  bonusCritChance: number;
  bonusCritDamage: number;
  // Progression
  bonusExpBonus: number;
  bonusGoldBonus: number;
  bonusItemDiscovery: number;
  // Defenses
  bonusPhysicalImmunity: number;
  bonusMagicImmunity: number;
  bonusDexEvasiveness: number;
  // Spells
  spells: WeaponSpellInfo[];
  craftHours: number;
  ingredients: WeaponIngredient[];
}

export interface MaterialRecipeIngredient {
  materialId: number;
  materialName: string;
  iconKey: string;
  required: number;
  have: number;
}

export interface MaterialRecipe {
  recipeId: number;
  outputMaterialId: number;
  outputName: string;
  outputIconKey: string;
  outputTier: number;
  outputQuantity: number;
  currentQuantity: number;
  craftHours: number;
  ingredients: MaterialRecipeIngredient[];
}

// ============================================================
// Dashboard
// ============================================================

export interface DashboardPeriodStats {
  battles: number;
  wins: number;
  losses: number;
  goldEarned: number;
  winRate: number;
}

export interface DashboardHeroSummary {
  id: number;
  name: string;
  imagePath: string;
  level: number;
  currentXp: number;
  xpToNextLevel: number;
  tier: string | null;
  element: string | null;
  clashesWon: number;
  clashesLost: number;
  currentWinStreak: number;
  maxDamageDealt: number;
  xpGainedToday: number;
  xpGainedWeek: number;
  xpGainedMonth: number;
  xpGainedAllTime: number;
}

export interface DashboardResponse {
  today: DashboardPeriodStats;
  week: DashboardPeriodStats;
  month: DashboardPeriodStats;
  allTime: DashboardPeriodStats;
  heroes: DashboardHeroSummary[];
}
