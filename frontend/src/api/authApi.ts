import apiClient from './client';
import type {
  RegisterRequest,
  LoginRequest,
  LoginResponse,
  MessageResponse,
  ConfirmResponse,
} from '../types';

export async function register(data: RegisterRequest): Promise<MessageResponse> {
  const res = await apiClient.post<MessageResponse>('/auth/register', data);
  return res.data;
}

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const res = await apiClient.post<LoginResponse>('/auth/login', data);
  return res.data;
}

export async function confirmEmail(token: string): Promise<ConfirmResponse> {
  const res = await apiClient.get<ConfirmResponse>('/auth/confirm', {
    params: { token },
  });
  return res.data;
}

export async function resendConfirmation(email: string): Promise<MessageResponse> {
  const res = await apiClient.post<MessageResponse>('/auth/resend-confirmation', { email });
  return res.data;
}

export async function forgotPassword(email: string): Promise<MessageResponse> {
  const res = await apiClient.post<MessageResponse>('/auth/forgot-password', { email });
  return res.data;
}

export async function resetPassword(token: string, newPassword: string): Promise<MessageResponse> {
  const res = await apiClient.post<MessageResponse>('/auth/reset-password', { token, newPassword });
  return res.data;
}
