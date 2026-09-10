import { apiRequest } from './client';

// ==========================================
// Base & Enums / Types
// ==========================================

export type VendorType = 'mechanic' | 'tow_driver' | 'ride_driver';

export type VehicleType =
  'car' | 'motorcycle' | 'pickup' | 'tow_truck' | 'flatbed' | 'van' | 'suv' | 'other';

export type VendorStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export type JobStatus =
  'pending' | 'accepted' | 'en_route' | 'in_progress' | 'completed' | 'cancelled' | 'expired';

export interface BaseApiResponse {
  success: boolean;
  message?: string;
}

// ==========================================
// Models & Payload Interfaces
// ==========================================

export interface LocationCoords {
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  accuracy?: number;
}

export interface VendorProfile {
  id: number;
  user_id: number;
  vendor_type: VendorType;
  business_name: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  bio: string | null;
  years_experience: number;
  status: VendorStatus;
  is_online: number;
  rating: number;
  total_reviews: number;
  created_at: string;
  updated_at: string;
  name?: string;
  email?: string;
  profile_picture?: string | null;
}

export interface VendorVehicle {
  id: number;
  vendor_id: number;
  vehicle_type: VehicleType;
  make: string;
  model: string;
  year: number | null;
  color: string | null;
  license_plate: string | null;
  registration_number: string | null;
  vehicle_image: string | null;
  is_primary: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface VendorJob {
  assignment_id: number;
  booking_id: number;
  assignment_status: string;
  offered_at: string;
  expires_at: string;
  booking_number: string;
  service_type: VendorType;
  booking_status: JobStatus;
  pickup_address?: string;
  pickup_latitude?: number;
  pickup_longitude?: number;
  destination_address?: string;
  destination_latitude?: number;
  destination_longitude?: number;
  problem_description?: string;
  estimated_price?: number;
  created_at: string;
}

export interface DashboardStats {
  today_earnings: number;
  completed_jobs: number;
  pending_jobs: number;
}

export interface EarningsSummary {
  today_earnings: number;
  weekly_earnings: number;
  total_lifetime: number;
  available_balance: number;
}

export interface EarningHistoryItem {
  earning_id: number;
  job_id: number;
  gross_amount: number | string;
  platform_fee: number | string;
  net_earnings: number | string;
  created_at: string;
  service_type: VendorType;
  pickup_address: string;
}

// ==========================================
// Request / Response DTOs
// ==========================================

export interface RegisterVendorPayload {
  vendor_type: VendorType;
  business_name?: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  years_experience?: number;
  bio?: string;
}

export interface RegisterVendorResponse extends BaseApiResponse {
  vendor_id?: number;
  status?: VendorStatus;
}

export interface GetVendorProfileResponse extends BaseApiResponse {
  vendor: VendorProfile;
  vehicles: VendorVehicle[];
}

export interface UpdateVendorProfilePayload {
  business_name?: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  bio?: string;
  years_experience?: number;
}

export interface AddVehiclePayload {
  vehicle_type: VehicleType;
  make: string;
  model: string;
  year?: number | null;
  color?: string;
  license_plate?: string;
  registration_number?: string;
}

export interface AddVehicleResponse extends BaseApiResponse {
  vehicle_id?: number;
}

export interface ToggleOnlineResponse extends BaseApiResponse {
  is_online?: number;
}

export interface VendorDashboardResponse extends BaseApiResponse {
  vendor: Pick<
    VendorProfile,
    'id' | 'vendor_type' | 'status' | 'is_online' | 'rating' | 'total_reviews' | 'name'
  >;
  stats: DashboardStats;
  available_jobs: VendorJob[];
}

export interface GetIncomingOffersResponse extends BaseApiResponse {
  offers: VendorJob[];
}

export interface RespondOfferResponse extends BaseApiResponse {
  job_id?: number;
}

export interface GetJobDetailsResponse extends BaseApiResponse {
  job: VendorJob;
}

export interface UpdateJobStatusResponse extends BaseApiResponse {
  current_status?: JobStatus;
}

export interface GetEarningsResponse extends BaseApiResponse {
  summary: EarningsSummary;
  history: EarningHistoryItem[];
}

export interface RequestPayoutResponse extends BaseApiResponse {
  payout_id?: number;
}

// ==========================================
// API Service Methods
// ==========================================

// Module 1: Profile & Vehicle Management
export async function registerVendor(
  payload: RegisterVendorPayload
): Promise<RegisterVendorResponse> {
  return apiRequest<RegisterVendorResponse>('vendors/register.php', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getVendorProfile(): Promise<GetVendorProfileResponse> {
  return apiRequest<GetVendorProfileResponse>('vendors/profile.php');
}

export async function updateVendorProfile(
  payload: UpdateVendorProfilePayload
): Promise<BaseApiResponse> {
  return apiRequest<BaseApiResponse>('vendors/update-profile.php', {
    method: 'POST',
    body: JSON.stringify(payload), // Stringify payload here
  });
}

export async function addVehicle(payload: AddVehiclePayload): Promise<AddVehicleResponse> {
  return apiRequest<AddVehicleResponse>('vendors/add-vehicle.php', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function deleteVehicle(vehicleId: number): Promise<BaseApiResponse> {
  return apiRequest<BaseApiResponse>('vendors/delete-vehicle.php', {
    method: 'POST',
    body: JSON.stringify({ vehicle_id: vehicleId }),
  });
}

// Module 2: Dashboard, Location & Status Toggle
export async function toggleOnlineStatus(
  isOnline: boolean,
  location: Partial<LocationCoords> | null = null
): Promise<ToggleOnlineResponse> {
  return apiRequest<ToggleOnlineResponse>('vendors/toggle-online.php', {
    method: 'POST',
    body: JSON.stringify({
      is_online: isOnline,
      latitude: location?.latitude,
      longitude: location?.longitude,
    }),
  });
}

export async function updateVendorLocation(
  data: { booking_id?: number } & LocationCoords
): Promise<BaseApiResponse> {
  return apiRequest<BaseApiResponse>('vendors/location.php', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getVendorDashboard(): Promise<VendorDashboardResponse> {
  return apiRequest<VendorDashboardResponse>('vendors/dashboard.php');
}

// Module 3: Booking Engine & Job Requests
export async function getVendorJobs(): Promise<GetIncomingOffersResponse> {
  return apiRequest<GetIncomingOffersResponse>('vendors/jobs.php');
}

export async function respondToOffer(
  assignmentId: number,
  action: 'accept' | 'decline',
  reason?: string
): Promise<RespondOfferResponse> {
  const endpoint = action === 'accept' ? 'vendors/accept-job.php' : 'vendors/reject-job.php';
  return apiRequest<RespondOfferResponse>(endpoint, {
    method: 'POST',
    body: JSON.stringify({
      assignment_id: assignmentId,
      ...(reason ? { reason } : {}),
    }),
  });
}

// Module 4: Job Execution & Status Progress
export async function updateJobStatus(
  bookingId: number,
  status: Extract<JobStatus, 'en_route' | 'in_progress' | 'completed' | 'cancelled'>,
  notes: string = ''
): Promise<UpdateJobStatusResponse> {
  return apiRequest<UpdateJobStatusResponse>('vendors/update-booking-status.php', {
    method: 'POST',
    body: JSON.stringify({
      booking_id: bookingId,
      status,
      notes,
    }),
  });
}

export async function getJobDetails(bookingId: number): Promise<GetJobDetailsResponse> {
  return apiRequest<GetJobDetailsResponse>(`jobs/details.php?id=${bookingId}`);
}

// Module 5: Earnings & Payout Settlement
export async function getVendorEarnings(): Promise<GetEarningsResponse> {
  return apiRequest<GetEarningsResponse>('vendors/earnings.php');
}

export async function requestVendorPayout(amount: number): Promise<RequestPayoutResponse> {
  return apiRequest<RequestPayoutResponse>('vendors/request-payout.php', {
    method: 'POST',
    body: JSON.stringify({ amount }),
  });
}

interface SetVendorOnlineResponse {
  success?: boolean;
  message?: string;
  [key: string]: unknown;
}

export async function setVendorOnline(
  isOnline: boolean | number
): Promise<SetVendorOnlineResponse> {
  return apiRequest<SetVendorOnlineResponse>('/vendors/set-online.php', {
    method: 'POST',
    body: JSON.stringify({
      is_online: isOnline,
    }),
  });
}

// ==========================================
// Types & DTOs
// ==========================================

/* export interface JobOffer {
  id: number;
  booking_id: number;
  vendor_id: number;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  distance_km: number;
  estimated_earnings: number;
  expires_at: string;
  created_at?: string;
} */
export interface JobOffer {
  offer_id: string | number;
  service_type: 'ride' | 'mechanic' | 'tow' | string;
  booking_number: string | number;
  distance_km: number | string;
  pickup_address?: string;
  destination_address?: string;
  problem_description?: string;
  estimated_earnings: number | string;
  expires_at: string;
}

export interface GetJobOffersResponse extends BaseApiResponse {
  offers: JobOffer[];
}

export interface RespondJobOfferResponse extends BaseApiResponse {
  booking_id?: number;
  offer_id?: number;
}

// ==========================================
// API Methods
// ==========================================

export async function getJobOffers(): Promise<GetJobOffersResponse> {
  return apiRequest<GetJobOffersResponse>('/vendors/job-offers.php');
}

export async function acceptJobOffer(offerId: number): Promise<RespondJobOfferResponse> {
  return apiRequest<RespondJobOfferResponse>('/vendors/accept-offer.php', {
    method: 'POST',
    body: JSON.stringify({
      offer_id: offerId,
    }),
  });
}

export async function declineJobOffer(offerId: number): Promise<RespondJobOfferResponse> {
  return apiRequest<RespondJobOfferResponse>('/vendors/decline-offer.php', {
    method: 'POST',
    body: JSON.stringify({
      offer_id: offerId,
    }),
  });
}

export interface ServiceTypePayload {
  service_type: 'ride' | 'mechanic' | 'tow' | string;
  is_active: boolean;
}

export async function updateVendorServices(
  services: ServiceTypePayload[]
): Promise<BaseApiResponse> {
  return apiRequest('/vendors/update-services.php', {
    method: 'POST',
    body: JSON.stringify({ services }),
  });
}

export interface LocationUpdatePayload {
  latitude: number;
  longitude: number;
}

export async function updateLocation(
  coords: LocationUpdatePayload
): Promise<{ success: boolean; message: string }> {
  return apiRequest('/vendors/update-location.php', {
    method: 'POST',
    body: JSON.stringify(coords),
  });
}
