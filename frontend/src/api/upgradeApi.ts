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
