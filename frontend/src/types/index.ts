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
}

export interface SummonStats {
  mana: number;
  magicPower: number;
}

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
  equippedItems: EquippedItemSummary[];
  equippedAbilities: EquippedAbilitySummary[];
  tier: 'COMMONER' | 'ELITE' | 'LEGENDARY' | null;
  element: string | null;
  clashesWon: number;
  clashesLost: number;
  currentWinStreak: number;
  currentLossStreak: number;
  maxDamageDealt: number;
  maxDamageReceived: number;
  sellPrice: number;
  statPurchaseCount: number;
  nextStatCost: number;
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
    copies?: number | null;
  }>;
}

export interface TeamSlotSummon {
  id: number;
  name: string;
  imagePath: string;
  level: number;
  capacity: number;
  teamBonus: string;
  magicPower: number;
  mana: number;
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
  trigger: 'ENTRANCE' | 'ATTACK';
  chance: number;
  bonuses: Partial<HeroStats>;
}

export interface SpellEvent {
  spellName: string;
  manaCost: number;
  heroName: string;
  trigger: 'ENTRANCE' | 'ATTACK';
}

export interface ShopAbilityResponse {
  templateId: number;
  name: string;
  cost: number;
  tier: number;
  bonuses: Partial<HeroStats>;
  owned: boolean;
  spell?: SpellInfo | null;
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
  hasPendingReturn: boolean;
  energyCost: number;
  profileImagePath: string | null;
  teamName: string;
  wins: number;
  losses: number;
}

export interface ArenaOpponentListResponse {
  opponents: ArenaOpponentResponse[];
  totalPlayers: number;
  page: number;
  size: number;
}

export interface ChallengeRequest {
  defenderId: number;
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
  defenderStatElem?: number;
  defenderStatMana?: number;
  defenderStatStam?: number;
  defenderElement?: string;
  attackerImagePath?: string;
  defenderImagePath?: string;
  challengerSpells?: SpellEvent[];
  defenderSpells?: SpellEvent[];
  challengerManaAfter?: number;
  defenderManaAfter?: number;
}

export interface BattleHeroInfo {
  name: string;
  imagePath: string;
  level: number;
  element?: string;
}

export interface BattleLog {
  challenger: {
    username: string;
    profileImagePath?: string | null;
    heroes: BattleHeroInfo[];
    summon?: { name: string; imagePath: string } | null;
  };
  defender: {
    username: string;
    profileImagePath?: string | null;
    heroes: BattleHeroInfo[];
    summon?: { name: string; imagePath: string } | null;
  };
  rounds: BattleRound[];
  winner: 'challenger' | 'defender';
  xpGained: {
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
  spell?: SpellInfo | null;
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
  spell?: SpellInfo | null;
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
