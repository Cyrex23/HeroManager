import apiClient from './client';
import type { MaterialTemplate, WeaponRecipe, MaterialRecipe } from '../types';

export async function getMaterials(): Promise<MaterialTemplate[]> {
  const res = await apiClient.get<MaterialTemplate[]>('/blacksmith/materials');
  return res.data;
}

export async function getWeaponRecipes(): Promise<WeaponRecipe[]> {
  const res = await apiClient.get<WeaponRecipe[]>('/blacksmith/weapon-recipes');
  return res.data;
}

export async function getMaterialRecipes(): Promise<MaterialRecipe[]> {
  const res = await apiClient.get<MaterialRecipe[]>('/blacksmith/material-recipes');
  return res.data;
}

export async function craftWeapon(itemTemplateId: number): Promise<void> {
  await apiClient.post('/blacksmith/craft-weapon', { itemTemplateId });
}

export async function craftMaterial(materialRecipeId: number): Promise<void> {
  await apiClient.post('/blacksmith/craft-material', { materialRecipeId });
}

export interface SpinStatus { canSpin: boolean; nextResetMs: number }
export interface SpinResult { materialId: number; name: string; iconKey: string; tier: number; wonQty: number; nextResetMs: number }

export async function getSpinStatus(): Promise<SpinStatus> {
  const res = await apiClient.get<SpinStatus>('/blacksmith/daily-spin/status');
  return res.data;
}

export async function claimDailySpin(): Promise<SpinResult> {
  const res = await apiClient.post<SpinResult>('/blacksmith/daily-spin');
  return res.data;
}

export async function claimSpinReward(choice: 'material' | 'gold' | 'diamond'): Promise<void> {
  await apiClient.post('/blacksmith/daily-spin/claim', { choice });
}

export async function finishCraftNow(tier: string): Promise<{ diamondsRemaining: number }> {
  const res = await apiClient.post<{ diamondsRemaining: number }>('/blacksmith/finish-now', { tier });
  return res.data;
}
