import apiClient from './client';
import type { ChatMessage, ChatPartner } from '../types';

export async function getGeneralMessages(since = 0): Promise<ChatMessage[]> {
  const res = await apiClient.get<ChatMessage[]>('/chat/general', { params: { since } });
  return res.data;
}

export async function sendGeneralMessage(content: string): Promise<ChatMessage> {
  const res = await apiClient.post<ChatMessage>('/chat/general', { content });
  return res.data;
}

export async function getWhisperMessages(otherId: number, since = 0): Promise<ChatMessage[]> {
  const res = await apiClient.get<ChatMessage[]>(`/chat/whisper/${otherId}`, { params: { since } });
  return res.data;
}

export async function sendWhisper(receiverId: number, content: string): Promise<ChatMessage> {
  const res = await apiClient.post<ChatMessage>('/chat/whisper', { receiverId, content });
  return res.data;
}

export async function getConversations(): Promise<ChatPartner[]> {
  const res = await apiClient.get<ChatPartner[]>('/chat/conversations');
  return res.data;
}
