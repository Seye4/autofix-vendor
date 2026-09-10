import { api } from './client';

export async function getMessages(bookingId: number, token: string) {
  const response = await api.get('', {
    params: {
      path: `bookings/${bookingId}/messages`,
    },

    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}

export async function sendMessage(bookingId: number, message: string, token: string) {
  const response = await api.post(
    '',
    {
      message,
    },
    {
      params: {
        path: `bookings/${bookingId}/messages`,
      },

      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
}
