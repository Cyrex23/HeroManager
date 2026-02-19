import apiClient from './client';
import type {
  HeroEquipmentResponse,
  EquipItemRequest,
  UnequipItemRequest,
  SellItemRequest,
  SellItemResponse,
  UnequipAbilityRequest,
  MessageResponse,
} from '../types';

export async function getHeroEquipment(heroId: number): Promise<HeroEquipmentResponse> {
  const res = await apiClient.get<HeroEquipmentResponse>(`/equipment/hero/${heroId}`);
  return res.data;
}

export async function equipItem(data: EquipItemRequest): Promise<MessageResponse> {
  const res = await apiClient.post<MessageResponse>('/equipment/equip-item', data);
  return res.data;
}

export async function unequipItem(data: UnequipItemRequest): Promise<MessageResponse> {
  const res = await apiClient.post<MessageResponse>('/equipment/unequip-item', data);
  return res.data;
}

export async function sellItem(data: SellItemRequest): Promise<SellItemResponse> {
  const res = await apiClient.post<SellItemResponse>('/equipment/sell-item', data);
  return res.data;
}

export async function unequipAbility(data: UnequipAbilityRequest): Promise<MessageResponse> {
  const res = await apiClient.post<MessageResponse>('/equipment/unequip-ability', data);
  return res.data;
}
