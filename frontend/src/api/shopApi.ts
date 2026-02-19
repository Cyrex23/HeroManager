import apiClient from './client';
import type {
  ShopListResponse,
  BuyHeroRequest,
  BuyHeroResponse,
  BuySummonRequest,
  BuySummonResponse,
  ShopItemListResponse,
  BuyItemRequest,
  BuyItemResponse,
  ShopAbilityListResponse,
  BuyAbilityRequest,
  BuyAbilityResponse,
} from '../types';

export async function listHeroes(): Promise<ShopListResponse> {
  const res = await apiClient.get<ShopListResponse>('/shop/heroes');
  return res.data;
}

export async function buyHero(data: BuyHeroRequest): Promise<BuyHeroResponse> {
  const res = await apiClient.post<BuyHeroResponse>('/shop/buy-hero', data);
  return res.data;
}

export async function buySummon(data: BuySummonRequest): Promise<BuySummonResponse> {
  const res = await apiClient.post<BuySummonResponse>('/shop/buy-summon', data);
  return res.data;
}

export async function listItems(): Promise<ShopItemListResponse> {
  const res = await apiClient.get<ShopItemListResponse>('/shop/items');
  return res.data;
}

export async function buyItem(data: BuyItemRequest): Promise<BuyItemResponse> {
  const res = await apiClient.post<BuyItemResponse>('/shop/buy-item', data);
  return res.data;
}

export async function listAbilities(heroId: number): Promise<ShopAbilityListResponse> {
  const res = await apiClient.get<ShopAbilityListResponse>(`/shop/abilities?heroId=${heroId}`);
  return res.data;
}

export async function buyAbility(data: BuyAbilityRequest): Promise<BuyAbilityResponse> {
  const res = await apiClient.post<BuyAbilityResponse>('/shop/buy-ability', data);
  return res.data;
}
