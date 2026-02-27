import apiClient from './client';
import type {
  TeamResponse,
  TeamSetupResponse,
  EquipHeroRequest,
  UnequipHeroRequest,
  EquipSummonRequest,
  ReorderRequest,
  EquipResponse,
  MessageResponse,
} from '../types';

export async function getTeam(): Promise<TeamResponse> {
  const res = await apiClient.get<TeamResponse>('/team');
  return res.data;
}

export async function equipHero(data: EquipHeroRequest): Promise<EquipResponse> {
  const res = await apiClient.post<EquipResponse>('/team/equip-hero', data);
  return res.data;
}

export async function unequipHero(data: UnequipHeroRequest): Promise<EquipResponse> {
  const res = await apiClient.post<EquipResponse>('/team/unequip-hero', data);
  return res.data;
}

export async function equipSummon(data: EquipSummonRequest): Promise<EquipResponse> {
  const res = await apiClient.post<EquipResponse>('/team/equip-summon', data);
  return res.data;
}

export async function unequipSummon(): Promise<EquipResponse> {
  const res = await apiClient.post<EquipResponse>('/team/unequip-summon', {});
  return res.data;
}

export async function reorderTeam(data: ReorderRequest): Promise<MessageResponse> {
  const res = await apiClient.post<MessageResponse>('/team/reorder', data);
  return res.data;
}

export async function getTeamSetups(): Promise<TeamSetupResponse[]> {
  const res = await apiClient.get<TeamSetupResponse[]>('/team/setups');
  return res.data;
}

export async function switchTeamSetup(setupIndex: number): Promise<TeamResponse> {
  const res = await apiClient.post<TeamResponse>('/team/setups/switch', { setupIndex });
  return res.data;
}

export async function renameTeamSetup(setupIndex: number, name: string): Promise<MessageResponse> {
  const res = await apiClient.put<MessageResponse>(`/team/setups/${setupIndex}/name`, { name });
  return res.data;
}
