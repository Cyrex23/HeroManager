import apiClient from './client';
import type {
  HeroEquipmentResponse,
  PlayerInventoryResponse,
  SellItemResponse,
  MessageResponse,
} from '../types';

export async function getHeroEquipment(heroId: number): Promise<HeroEquipmentResponse> {
  const res = await apiClient.get<HeroEquipmentResponse>(`/equipment/hero/${heroId}`);
  return res.data;
}

export async function getPlayerInventory(): Promise<PlayerInventoryResponse> {
  const res = await apiClient.get<PlayerInventoryResponse>('/equipment/inventory');
  return res.data;
}

export async function equipItemToSlot(equippedItemId: number, heroId: number, slotNumber: number): Promise<MessageResponse> {
  const res = await apiClient.post<MessageResponse>('/equipment/equip-item-slot', { equippedItemId, heroId, slotNumber });
  return res.data;
}

export async function unequipItemFromSlot(heroId: number, slotNumber: number): Promise<MessageResponse> {
  const res = await apiClient.post<MessageResponse>('/equipment/unequip-item-slot', { heroId, slotNumber });
  return res.data;
}

export async function equipAbilityToSlot(equippedAbilityId: number, slotNumber: number): Promise<MessageResponse> {
  const res = await apiClient.post<MessageResponse>('/equipment/equip-ability-slot', { equippedAbilityId, slotNumber });
  return res.data;
}

export async function unequipAbilityFromSlot(heroId: number, slotNumber: number): Promise<MessageResponse> {
  const res = await apiClient.post<MessageResponse>('/equipment/unequip-ability-slot', { heroId, slotNumber });
  return res.data;
}

export async function sellInventoryItem(equippedItemId: number): Promise<SellItemResponse> {
  const res = await apiClient.post<SellItemResponse>('/equipment/sell-item', { equippedItemId });
  return res.data;
}

export async function sellAbility(equippedAbilityId: number): Promise<SellItemResponse> {
  const res = await apiClient.post<SellItemResponse>('/equipment/sell-ability', { equippedAbilityId });
  return res.data;
}
