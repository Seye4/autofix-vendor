export const BOOKING_STATUS = {
  SEARCHING: 'searching',

  ACCEPTED: 'accepted',

  ARRIVING: 'arriving',

  ARRIVED: 'arrived',

  IN_PROGRESS: 'in_progress',

  COMPLETED: 'completed',

  CANCELLED: 'cancelled',

  REJECTED: 'rejected',
} as const;

export type BookingStatus = (typeof BOOKING_STATUS)[keyof typeof BOOKING_STATUS];

export function getBookingStatusLabel(status: string): string {
  switch (status) {
    case 'searching':
      return 'Searching for provider';

    case 'accepted':
      return 'Provider assigned';

    case 'arriving':
      return 'Provider is on the way';

    case 'arrived':
      return 'Provider has arrived';

    case 'in_progress':
      return 'Service in progress';

    case 'completed':
      return 'Completed';

    case 'cancelled':
      return 'Cancelled';

    case 'rejected':
      return 'Rejected';

    default:
      return 'Unknown';
  }
}
