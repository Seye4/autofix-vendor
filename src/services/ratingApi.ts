import { apiRequest } from '@/api/client'; // Adjust path if needed
import { getToken } from '@/storage/authStorage';

interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  [key: string]: unknown;
}

/**
 * Helper function to inject authentication token
 * before sending requests through apiRequest
 */
async function authenticatedRequest<T = ApiResponse>(
  endpoint: string,
  options: { method?: string; body?: any; isFormData?: boolean } = {}
): Promise<T> {
  const token = await getToken();

  // Normalize endpoint path so double slashes like '//ratings' don't form
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

  const response = await apiRequest<T>(normalizedEndpoint, {
    ...options,
    token,
  });

  return response;
}

export async function createRating(
  bookingId: number | string,
  rating: number,
  review?: string
): Promise<ApiResponse> {
  return authenticatedRequest<ApiResponse>('ratings/create.php', {
    method: 'POST',
    body: {
      booking_id: Number(bookingId),
      rating,
      review: review ? review.trim() : '',
    },
  });
}

export async function getVendorRating(vendorId: number | string): Promise<ApiResponse> {
  return authenticatedRequest<ApiResponse>(`ratings/get-vendor-rating.php?vendor_id=${vendorId}`);
}

export async function getBookingRating(bookingId: number | string): Promise<ApiResponse> {
  return authenticatedRequest<ApiResponse>(
    `ratings/get-booking-rating.php?booking_id=${bookingId}`
  );
}

export async function getMyRatings(): Promise<ApiResponse> {
  return authenticatedRequest<ApiResponse>('ratings/my-ratings.php');
}
