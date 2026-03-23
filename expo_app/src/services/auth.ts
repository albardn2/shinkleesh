import api from "./api";
import { setTokens, clearTokens } from "./tokenStorage";
import type { TokenResponse, UserRead } from "../types/api";

export async function login(
  usernameOrEmail: string,
  password: string
): Promise<TokenResponse> {
  const { data } = await api.post<TokenResponse>("/auth/login", {
    username_or_email: usernameOrEmail,
    password,
  });
  await setTokens(data.access_token, data.refresh_token);
  return data;
}

export async function register(params: {
  username: string;
  password: string;
  email?: string;
  phone_number?: string;
}): Promise<UserRead> {
  const { data } = await api.post<UserRead>("/auth/register", params);
  return data;
}

export async function logout(): Promise<void> {
  try {
    await api.post("/auth/logout");
  } catch {
    // ignore logout errors
  }
  await clearTokens();
}

export async function getMe(): Promise<UserRead> {
  const { data } = await api.get<UserRead>("/auth/me");
  return data;
}

export async function updateMe(
  params: Partial<{
    username: string;
    email: string;
    phone_number: string;
    language: string;
    password: string;
  }>
): Promise<UserRead> {
  const { data } = await api.put<UserRead>("/auth/me", params);
  return data;
}
