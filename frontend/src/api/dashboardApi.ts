import apiClient from './client';
import type { DashboardResponse } from '../types';

export async function getDashboard(playerId: number): Promise<DashboardResponse> {
  const res = await apiClient.get<DashboardResponse>(`/dashboard/${playerId}`);
  return res.data;
}
