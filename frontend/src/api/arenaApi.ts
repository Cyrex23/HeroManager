import apiClient from './client';
import type {
  ArenaOpponentListResponse,
  ChallengeRequest,
  BattleResultResponse,
  BattleLogListResponse,
  BattleLog,
  TeamResponse,
} from '../types';

export async function getOpponents(page = 0, size = 20): Promise<ArenaOpponentListResponse> {
  const res = await apiClient.get<ArenaOpponentListResponse>('/arena/opponents', {
    params: { page, size },
  });
  return res.data;
}

export async function challenge(data: ChallengeRequest): Promise<BattleResultResponse> {
  const res = await apiClient.post<BattleResultResponse>('/arena/challenge', data);
  return res.data;
}

export async function getBattleLog(page = 0, size = 10): Promise<BattleLogListResponse> {
  const res = await apiClient.get<BattleLogListResponse>('/arena/battle-log', {
    params: { page, size },
  });
  return res.data;
}

export async function getBattle(battleId: number): Promise<BattleLog> {
  const res = await apiClient.get<BattleLog>(`/arena/battle/${battleId}`);
  return res.data;
}

export async function getOpponentTeam(playerId: number): Promise<TeamResponse> {
  const res = await apiClient.get<TeamResponse>(`/arena/team/${playerId}`);
  return res.data;
}
