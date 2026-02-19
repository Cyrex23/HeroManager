import apiClient from './client';
import type { PlayerResponse, HeroResponse, SummonResponse } from '../types';

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
