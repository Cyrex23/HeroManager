import apiClient from './client';
import type { FriendEntry } from '../types';

export async function getFriends(): Promise<FriendEntry[]> {
  const res = await apiClient.get<FriendEntry[]>('/friends');
  return res.data;
}

export async function searchPlayers(q: string): Promise<FriendEntry[]> {
  const res = await apiClient.get<FriendEntry[]>('/friends/search', { params: { q } });
  return res.data;
}

export async function sendFriendRequest(receiverId: number): Promise<void> {
  await apiClient.post('/friends/request', { receiverId });
}

export async function acceptFriendRequest(requesterId: number): Promise<void> {
  await apiClient.post('/friends/accept', { requesterId });
}

export async function deleteFriend(otherId: number): Promise<void> {
  await apiClient.delete(`/friends/${otherId}`);
}
