import client from './client';
import { LoginResponse } from '../types';

export async function register(email: string, username: string, password: string) {
  const res = await client.post('/auth/register', { email, username, password });
  return res.data;
}

export async function login(loginStr: string, password: string): Promise<LoginResponse> {
  const res = await client.post('/auth/login', { login: loginStr, password });
  return res.data;
}

export async function confirmEmail(token: string) {
  const res = await client.get(`/auth/confirm?token=${token}`);
  return res.data;
}

export async function resendConfirmation(email: string) {
  const res = await client.post('/auth/resend-confirmation', { email });
  return res.data;
}
