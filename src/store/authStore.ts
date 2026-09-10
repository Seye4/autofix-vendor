import { create } from 'zustand';

import * as SecureStore from 'expo-secure-store';

import { api } from '../api/client';

type User = {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  profile_picture?: string | null;
};

type AuthState = {
  user: User | null;

  token: string | null;

  loading: boolean;

  login: (email: string, password: string) => Promise<void>;

  register: (name: string, email: string, phone: string, password: string) => Promise<void>;

  logout: () => Promise<void>;

  restoreSession: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,

  token: null,

  loading: true,

  login: async (email, password) => {
    const response = await api.post(
      '',
      {
        email,
        password,
      },
      {
        params: {
          path: 'login',
        },
      }
    );

    if (!response.data.success) {
      throw new Error(response.data.message);
    }

    const token = response.data.token;

    const user = response.data.user;

    await SecureStore.setItemAsync('auth_token', token);

    set({
      token,
      user,
    });
  },

  register: async (name, email, phone, password) => {
    const response = await api.post(
      '',
      {
        name,
        email,
        phone,
        password,
      },
      {
        params: {
          path: 'register',
        },
      }
    );

    if (!response.data.success) {
      throw new Error(response.data.message);
    }

    const token = response.data.token;

    const user = response.data.user;

    await SecureStore.setItemAsync('auth_token', token);

    set({
      token,
      user,
    });
  },

  logout: async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');

      if (token) {
        await api.post(
          '',
          {},
          {
            params: {
              path: 'logout',
            },

            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }
    } finally {
      await SecureStore.deleteItemAsync('auth_token');

      set({
        token: null,
        user: null,
      });
    }
  },

  restoreSession: async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');

      if (!token) {
        set({
          loading: false,
        });

        return;
      }

      const response = await api.get('', {
        params: {
          path: 'me',
        },

        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        set({
          token,
          user: response.data.user,
        });
      } else {
        await SecureStore.deleteItemAsync('auth_token');
      }
    } catch {
      await SecureStore.deleteItemAsync('auth_token');
    } finally {
      set({
        loading: false,
      });
    }
  },
}));
