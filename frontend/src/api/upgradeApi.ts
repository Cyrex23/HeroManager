import apiClient from './client';

export interface UpgradeResult {
  message: string;
  goldRemaining?: number;
  diamondsRemaining?: number;
}

export const buyExtraLineupGold       = (): Promise<UpgradeResult> => apiClient.post('/upgrades/extra-lineup-gold').then(r => r.data);
export const buyExtraLineupDiamonds   = (): Promise<UpgradeResult> => apiClient.post('/upgrades/extra-lineup-diamonds').then(r => r.data);
export const buyEnergyPlus            = (): Promise<UpgradeResult> => apiClient.post('/upgrades/energy-plus').then(r => r.data);
export const buyHeroPlusCapacity      = (): Promise<UpgradeResult> => apiClient.post('/upgrades/hero-capacity-plus').then(r => r.data);
export const buyCapacityPlus          = (): Promise<UpgradeResult> => apiClient.post('/upgrades/capacity-plus').then(r => r.data);
export const buyStatReset             = (): Promise<UpgradeResult> => apiClient.post('/upgrades/stat-reset').then(r => r.data);
export const buyExtraCraftingSlot     = (): Promise<UpgradeResult> => apiClient.post('/upgrades/extra-crafting-slot').then(r => r.data);
export const buyDoubleSpin            = (): Promise<UpgradeResult> => apiClient.post('/upgrades/double-spin').then(r => r.data);
export const buyBattleLog             = (): Promise<UpgradeResult> => apiClient.post('/upgrades/battle-log').then(r => r.data);
export const buyReturnCap             = (): Promise<UpgradeResult> => apiClient.post('/upgrades/return-cap').then(r => r.data);
export const buyChallengeLimitUpgrade = (): Promise<UpgradeResult> => apiClient.post('/upgrades/challenge-limit').then(r => r.data);
export const buyEnergyGainUpgrade     = (): Promise<UpgradeResult> => apiClient.post('/upgrades/energy-gain').then(r => r.data);
