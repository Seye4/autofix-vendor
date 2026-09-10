import { apiRequest } from './client';

export type Profile = {
  id: number;

  name: string;

  email: string;

  phone?: string | null;

  profile_image?: string | null;

  profile_image_url?: string | null;
};

export async function getProfile(token: string) {
  return apiRequest<{
    success: boolean;

    message: string;

    data: Profile;
  }>('profile/get.php', {
    token,
  });
}

export async function updateProfile(
  token: string,
  data: {
    name: string;
    phone?: string;
  }
) {
  return apiRequest('profile/update.php', {
    method: 'PUT',

    token,

    body: data,
  });
}

export async function uploadProfilePicture(token: string, uri: string, mimeType: string) {
  const formData = new FormData();

  formData.append('profile_image', {
    uri,

    name: `profile-${Date.now()}.jpg`,

    type: mimeType,
  } as any);

  return apiRequest('profile/upload-picture.php', {
    method: 'POST',

    token,

    body: formData,

    isFormData: true,
  });
}

export async function deleteProfilePicture(token: string) {
  return apiRequest('profile/delete-picture.php', {
    method: 'DELETE',

    token,
  });
}
