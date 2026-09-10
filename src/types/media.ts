export type BookingMedia = {
  id: number;

  booking_id: number;

  media_type: 'image' | 'video';

  file_path: string;

  file_url?: string;

  original_name?: string;

  mime_type?: string;

  file_size?: number;
};
