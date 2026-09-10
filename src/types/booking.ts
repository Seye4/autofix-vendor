export type ServiceType = 'ride' | 'mechanic' | 'tow';

export type BookingStatus =
  | 'pending'
  | 'searching'
  | 'assigned'
  | 'accepted'
  | 'en_route'
  | 'arrived'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'rejected';

export type Coordinates = {
  latitude: number;

  longitude: number;
};

export type Booking = {
  id: number;

  booking_number: string;

  user_id: number;

  vendor_id?: number | null;

  service_type: ServiceType;

  status: BookingStatus;

  pickup_address?: string | null;

  pickup_latitude?: number | null;

  pickup_longitude?: number | null;

  destination_address?: string | null;

  destination_latitude?: number | null;

  destination_longitude?: number | null;

  problem_description?: string | null;

  estimated_price?: number | null;

  final_price?: number | null;

  payment_status: string;

  scheduled_at?: string | null;

  created_at: string;

  updated_at?: string;
};

export type CreateBookingRequest = {
  service_type: ServiceType;

  pickup_address?: string;

  pickup_latitude?: number;

  pickup_longitude?: number;

  destination_address?: string;

  destination_latitude?: number;

  destination_longitude?: number;

  problem_description?: string;

  scheduled_at?: string;
};
