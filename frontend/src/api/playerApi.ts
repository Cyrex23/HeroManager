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

export async function getSummons(): Promise<SummonResponse[]> {
  const res = await apiClient.get<{ summons: SummonResponse[] }>('/player/summons');
  return res.data.summons;
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
  spell?: { name: string; manaCost: number; trigger: string; chance: number; bonuses: Record<string, number> } | null;
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
