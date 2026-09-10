import { apiRequest } from './client';

export type TrackingData = {
  id: number;

  booking_number: string;

  service_type: string;

  status: string;

  pickup_latitude?: number;

  pickup_longitude?: number;

  destination_latitude?: number;

  destination_longitude?: number;

  vendor_id?: number;

  business_name?: string;

  phone?: string;

  profile_picture?: string;

  vehicle_type?: string;

  vehicle_make?: string;

  vehicle_model?: string;

  vehicle_color?: string;

  vehicle_plate?: string;

  rating?: number;

  current_latitude?: number;

  current_longitude?: number;

  current_heading?: number;

  current_speed?: number;

  location_updated_at?: string;
};

export type BookingEvent = {
  id: number;

  event_type: string;

  description: string;

  latitude?: number;

  longitude?: number;

  created_at: string;
};

export async function getTracking(token: string, bookingId: number) {
  return apiRequest<{
    success: boolean;

    message: string;

    data: {
      tracking: TrackingData;
    };
  }>(`bookings/tracking.php?booking_id=${bookingId}`, {
    method: 'GET',
    token,
  });
}

export async function getProgress(token: string, bookingId: number) {
  return apiRequest<{
    success: boolean;

    message: string;

    data: {
      booking: any;

      events: BookingEvent[];
    };
  }>(`bookings/progress.php?booking_id=${bookingId}`, {
    method: 'GET',
    token,
  });
}
