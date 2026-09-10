import { apiRequest } from './client';

import { CreateBookingRequest } from '../types/booking';
// import { Booking, CreateBookingRequest } from '../types/booking';

export async function createBooking(
  token: string,

  data: CreateBookingRequest
) {
  return apiRequest<{
    success: boolean;

    message: string;

    data: {
      id: number;

      booking_number: string;

      status: string;
    };
  }>('bookings/create.php', {
    method: 'POST',

    token,

    body: data,
  });
}

/* export async function getBookings(token: string) {
  return apiRequest<{
    success: boolean;

    message: string;

    data: Booking[];
  }>('bookings/list.php', {
    token,
  });
}

export async function getBooking(
  token: string,

  bookingId: number
) {
  return apiRequest<{
    success: boolean;

    message: string;

    data: {
      booking: Booking;

      media: any[];

      history: any[];
    };
  }>(`bookings/view.php?id=${bookingId}`, {
    token,
  });
}

export async function cancelBooking(
  token: string,

  bookingId: number,

  reason?: string
) {
  return apiRequest(`bookings/cancel.php?id=${bookingId}`, {
    method: 'POST',

    token,

    body: {
      reason,
    },
  });
} */

export async function uploadBookingMedia(
  token: string,

  bookingId: number,

  file: {
    uri: string;
    type: 'image' | 'video';
    name: string;
  }
) {
  const formData = new FormData();

  formData.append('booking_id', bookingId.toString());

  formData.append('file', {
    uri: file.uri,

    name: file.name,

    type: file.type === 'video' ? 'video/mp4' : 'image/jpeg',
  } as any);

  return apiRequest<{
    success: boolean;

    message: string;

    data: {
      id: number;

      media_type: string;

      file_path: string;
    };
  }>('bookings/upload-media.php', {
    method: 'POST',

    token,

    body: formData,

    isFormData: true,
  });
}

export type Booking = {
  id: number;

  booking_number: string;

  service_type: string;

  status: string;

  pickup_address?: string;

  pickup_latitude?: number;

  pickup_longitude?: number;

  destination_address?: string;

  destination_latitude?: number;

  destination_longitude?: number;

  problem_description?: string;

  estimated_price?: number;

  final_price?: number;

  payment_status?: string;

  scheduled_at?: string;

  started_at?: string;

  completed_at?: string;

  cancelled_at?: string;

  created_at: string;

  updated_at: string;

  vendor_id?: number;

  vendor_name?: string;

  vendor_phone?: string;

  vendor_picture?: string;
};

export async function getBookings(
  token: string,

  status?: string
) {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';

  return apiRequest<{
    success: boolean;

    message: string;

    data: {
      bookings: Booking[];

      page: number;

      limit: number;

      has_more: boolean;
    };
  }>(`bookings/list.php${query}`, {
    method: 'GET',

    token,
  });
}

export async function getBooking(
  token: string,

  bookingId: number
) {
  return apiRequest<{
    success: boolean;

    message: string;

    data: {
      booking: Booking;

      media: any[];

      rating: any;
    };
  }>(`bookings/view.php?id=${bookingId}`, {
    method: 'GET',

    token,
  });
}

export async function getBookingsByGroup(
  token: string,

  group: 'upcoming' | 'past'
) {
  return apiRequest<{
    success: boolean;

    message: string;

    data: {
      bookings: Booking[];

      page: number;

      limit: number;

      has_more: boolean;
    };
  }>(`bookings/list.php?group=${group}`, {
    method: 'GET',

    token,
  });
}

export async function cancelBooking(
  token: string,

  bookingId: number,

  reason?: string
) {
  return apiRequest<{
    success: boolean;

    message: string;

    data: {
      booking_id: number;

      status: string;
    };
  }>('bookings/cancel.php', {
    method: 'POST',

    token,

    body: JSON.stringify({
      booking_id: bookingId,

      reason: reason || '',
    }),
  });
}
