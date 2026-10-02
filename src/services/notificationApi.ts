import { API_KEY, getToken } from '@/storage/authStorage';

/**
 * Standard API Response structure returned by your PHP backend.
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  notifications?: NotificationItem[];
  unread_count?: number;
}

/**
 * Notification Item shape based on your database schema.
 */
export interface NotificationItem {
  id: number;
  user_id: number;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  is_read: number;
  read_at: string | null;
  created_at: string;
}

/**
 * Generic request wrapper to fetch data with Bearer token authentication.
 */
async function request<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token: string | null = await getToken();

  const response = await fetch(`${API_KEY}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token ?? ''}`,
      ...(options.headers || {}),
    },
  });

  const data: ApiResponse<T> = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Notification request failed.');
  }

  return data;
}

/**
 * Fetch paginated notification list.
 */
export async function getNotifications(page: number = 1): Promise<ApiResponse<NotificationItem[]>> {
  return request<NotificationItem[]>(`/notifications/list.php?page=${page}`);
}

/**
 * Mark a single notification as read.
 */
export async function markNotificationRead(notificationId: number): Promise<ApiResponse<null>> {
  return request<null>('/notifications/read.php', {
    method: 'POST',
    body: JSON.stringify({
      notification_id: notificationId,
    }),
  });
}

/**
 * Retrieve total unread notifications count.
 */
export async function getUnreadCount(): Promise<ApiResponse<{ unread_count: number }>> {
  return request<{ unread_count: number }>('/notifications/unread-count.php');
}
