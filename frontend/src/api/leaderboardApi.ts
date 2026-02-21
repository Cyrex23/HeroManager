import apiClient from './client';
import type { LeaderboardHeroEntry, LeaderboardSummonEntry, LeaderboardTeamEntry } from '../types';

export async function getTopHeroes(): Promise<LeaderboardHeroEntry[]> {
  const res = await apiClient.get<LeaderboardHeroEntry[]>('/leaderboard/heroes');
  return res.data;
}

export async function getTopSummons(): Promise<LeaderboardSummonEntry[]> {
  const res = await apiClient.get<LeaderboardSummonEntry[]>('/leaderboard/summons');
  return res.data;
}

export async function getTopTeams(): Promise<LeaderboardTeamEntry[]> {
  const res = await apiClient.get<LeaderboardTeamEntry[]>('/leaderboard/teams');
  return res.data;
}
