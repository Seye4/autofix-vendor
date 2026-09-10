import { apiRequest } from './client';

export type UserRole = 'vendor' | 'customer';

export type User = {
  id: number;
  name: string;
  email: string;
  role: UserRole; // Added role field
  phone?: string | null;
  profile_image?: string | null;
  profile_image_url?: string | null;
};

type AuthResponse = {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: User;
  };
};

export async function login(email: string, password: string) {
  return apiRequest<AuthResponse>('auth/login.php', {
    method: 'POST',
    body: { email, password },
  });
}

export async function register(
  name: string,
  email: string,
  password: string,
  phone?: string,
  role: UserRole = 'vendor'
) {
  return apiRequest<{
    success: boolean;
    message: string;
    data: { user_id: number };
  }>('auth/register.php', {
    method: 'POST',
    body: { name, email, password, phone, role },
  });
}

export async function getCurrentUser(token: string) {
  return apiRequest<{
    success: boolean;
    message: string;
    data: User;
  }>('auth/me.php', { token });
}

export async function logout(token: string) {
  return apiRequest('auth/logout.php', {
    method: 'POST',
    token,
  });
}
