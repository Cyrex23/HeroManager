import apiClient from './client';
import type { PlayerResponse, HeroResponse, SummonResponse, SellItemResponse } from '../types';

export async function getMe(): Promise<PlayerResponse> {
  const res = await apiClient.get<PlayerResponse>('/player/me');
  return res.data;
}

export async function getHeroes(): Promise<HeroResponse[]> {
  const res = await apiClient.get<{ heroes: HeroResponse[] }>('/player/heroes');
  return res.data.heroes;
}

export async function getHero(heroId: number): Promise<HeroResponse | null> {
  try {
    const res = await apiClient.get<HeroResponse>(`/player/hero/${heroId}`);
    return res.data;
  } catch {
    return null;
  }
}

export async function getSummons(): Promise<SummonResponse[]> {
  const res = await apiClient.get<{ summons: SummonResponse[] }>('/player/summons');
  return res.data.summons;
}

export async function getSummon(summonId: number): Promise<SummonResponse | null> {
  try {
    const res = await apiClient.get<SummonResponse>(`/player/summon/${summonId}`);
    return res.data;
  } catch {
    return null;
  }
}

export async function sellSummon(summonId: number): Promise<{ message: string; goldEarned: number; goldTotal: number }> {
  const res = await apiClient.post('/player/sell-summon', { summonId });
  return res.data;
}

export async function halveSummonCapacity(summonId: number): Promise<{ message: string; newCapacity: number; goldSpent: number; goldTotal: number }> {
  const res = await apiClient.post(`/player/summon/${summonId}/halve-capacity`);
  return res.data;
}

export interface FullInventoryItem {
  equippedItemId: number;
  itemTemplateId: number;
  name: string;
  bonuses: Record<string, number>;
  sellPrice: number;
  equippedToHeroId: number | null;
  equippedToHeroName: string | null;
  slotNumber: number | null;
}

export interface FullInventoryAbility {
  equippedAbilityId: number;
  abilityTemplateId: number;
  name: string;
  tier: number;
  bonuses: Record<string, number>;
  sellPrice: number;
  heroId: number;
  heroName: string;
  slotNumber: number | null;
  spell?: { name: string; manaCost: number; trigger: 'ENTRANCE' | 'ATTACK'; chance: number; bonuses: Record<string, number> } | null;
}

export interface FullInventoryResponse {
  items: FullInventoryItem[];
  abilities: FullInventoryAbility[];
}

export async function getFullInventory(): Promise<FullInventoryResponse> {
  const res = await apiClient.get<FullInventoryResponse>('/player/full-inventory');
  return res.data;
}

export async function sellHero(heroId: number): Promise<SellItemResponse> {
  const res = await apiClient.post<SellItemResponse>('/player/sell-hero', { heroId });
  return res.data;
}

export async function halveCapacity(heroId: number): Promise<{ message: string; newCapacity: number; goldSpent: number; goldTotal: number }> {
  const res = await apiClient.post(`/player/hero/${heroId}/halve-capacity`);
  return res.data;
}

export async function buyStats(heroId: number, allocation: Record<string, number>): Promise<{ message: string; goldSpent: number; goldTotal: number }> {
  const res = await apiClient.post(`/player/hero/${heroId}/buy-stats`, allocation);
  return res.data;
}

export async function getOnlineCount(): Promise<number> {
  const res = await apiClient.get<{ count: number }>('/player/online-count');
  return res.data.count;
}
