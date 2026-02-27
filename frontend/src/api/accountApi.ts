import apiClient from './client';
import type { AccountData } from '../types';

export async function getAccountData(): Promise<AccountData> {
  const res = await apiClient.get<AccountData>('/account');
  return res.data;
}

export async function setProfileImage(imagePath: string): Promise<void> {
  await apiClient.put('/account/profile-image', { imagePath });
}

export async function changeTeamName(teamName: string): Promise<void> {
  await apiClient.put('/account/team-name', { teamName });
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await apiClient.put('/account/password', { currentPassword, newPassword });
}

export async function setChatSound(enabled: boolean): Promise<void> {
  await apiClient.put('/account/chat-sound', { enabled });
}
