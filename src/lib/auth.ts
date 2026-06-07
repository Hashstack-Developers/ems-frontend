import Cookies from 'js-cookie';
import type { User } from '@/types';

const TOKEN_KEY = 'ems_token';
const USER_KEY = 'ems_user';

export function getToken(): string | undefined {
  return Cookies.get(TOKEN_KEY);
}

export function setAuth(token: string, user: User): void {
  Cookies.set(TOKEN_KEY, token, { expires: 1, sameSite: 'strict' });
  Cookies.set(USER_KEY, JSON.stringify(user), { expires: 1, sameSite: 'strict' });
}

export function getUser(): User | null {
  const raw = Cookies.get(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function clearAuth(): void {
  Cookies.remove(TOKEN_KEY);
  Cookies.remove(USER_KEY);
}

export function isAuthenticated(): boolean {
  return !!getToken();
}
