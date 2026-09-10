import { api } from './client';

export async function uploadBookingMedia(bookingId: number, asset: any, token: string) {
  const formData = new FormData();

  const fileName = asset.fileName ?? `upload-${Date.now()}`;

  const mimeType = asset.mimeType ?? (asset.type === 'video' ? 'video/mp4' : 'image/jpeg');

  formData.append('file', {
    uri: asset.uri,

    name: fileName,

    type: mimeType,
  } as any);

  const response = await api.post(
    `/bookings/${bookingId}/media`,

    formData,

    {
      headers: {
        Authorization: `Bearer ${token}`,

        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data;
}
