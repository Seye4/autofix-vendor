import { API_URL } from '@/api/client copy';
import { getToken } from '@/storage/authStorage';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  [key: string]: unknown;
}

async function request<T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token: string | null = await getToken();

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const data: ApiResponse<T> = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Something went wrong.');
  }

  return data as T;
}

export async function registerVendor<T = unknown>(data: Record<string, unknown>): Promise<T> {
  return request<T>('/vendors/register.php', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getVendorProfile<T = unknown>(): Promise<T> {
  return request<T>('/vendors/profile.php');
}

export async function updateVendorProfile<T = unknown>(data: Record<string, unknown>): Promise<T> {
  return request<T>('/vendors/update-profile.php', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function addVehicle<T = unknown>(data: Record<string, unknown>): Promise<T> {
  return request<T>('/vendors/add-vehicle.php', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteVehicle<T = unknown>(vehicleId: string | number): Promise<T> {
  return request<T>('/vendors/delete-vehicle.php', {
    method: 'POST',
    body: JSON.stringify({
      vehicle_id: vehicleId,
    }),
  });
}

export async function getVendorDashboard<T = unknown>(): Promise<T> {
  return request<T>('/vendors/dashboard.php');
}

export async function setVendorOnline<T = unknown>(isOnline: boolean): Promise<T> {
  return request<T>('/vendors/set-online.php', {
    method: 'POST',
    body: JSON.stringify({
      is_online: isOnline,
    }),
  });
}

export async function getJobOffers<T = unknown>(): Promise<T> {
  return request<T>('/vendors/job-offers.php');
}

export async function acceptJobOffer<T = unknown>(offerId: string | number): Promise<T> {
  return request<T>('/vendors/accept-offer.php', {
    method: 'POST',
    body: JSON.stringify({
      offer_id: offerId,
    }),
  });
}

export async function declineJobOffer<T = unknown>(offerId: string | number): Promise<T> {
  return request<T>('/vendors/decline-offer.php', {
    method: 'POST',
    body: JSON.stringify({
      offer_id: offerId,
    }),
  });
}
