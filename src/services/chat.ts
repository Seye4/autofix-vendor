import { apiRequest } from '@/api/client';
import { BaseApiResponse } from '@/api/vendor';

export interface Conversation {
  id: number;
  booking_id: number;
  vendor_id?: number;
  customer_id?: number;

  status?: string;

  booking_number?: string;
  service_type?: string;
  booking_status?: string;

  other_user_id?: number;
  other_user_name?: string;

  last_message?: string;
  last_message_at?: string;

  unread_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ChatMessage {
  id: number;
  conversation_id: number;
  sender_id: number;
  message: string;
  created_at: string;
  is_read?: boolean;
}

export interface GetConversationsResponse extends BaseApiResponse {
  conversations: Conversation[];
}

export interface GetMessagesResponse extends BaseApiResponse {
  messages: ChatMessage[];
}

export interface SendMessageResponse extends BaseApiResponse {
  message_id?: number;
}

export interface MarkReadResponse extends BaseApiResponse {
  affected_rows?: number;
}

export async function getConversations(): Promise<GetConversationsResponse> {
  return apiRequest<GetConversationsResponse>('/chat/conversations.php');
}

export async function getMessages(
  conversationId: number | string,
  afterId: number = 0
): Promise<GetMessagesResponse> {
  return apiRequest<GetMessagesResponse>(
    `/chat/messages.php?conversation_id=${conversationId}&after_id=${afterId}`
  );
}

export async function sendMessage(
  conversationId: number | string,
  message: string
): Promise<SendMessageResponse> {
  return apiRequest<SendMessageResponse>('/chat/send.php', {
    method: 'POST',
    body: JSON.stringify({
      conversation_id: conversationId,
      message,
    }),
  });
}

export async function markMessagesRead(conversationId: number | string): Promise<MarkReadResponse> {
  return apiRequest<MarkReadResponse>('/chat/read.php', {
    method: 'POST',
    body: JSON.stringify({
      conversation_id: conversationId,
    }),
  });
}

export async function getConversationForBooking(
  bookingId: number | string
): Promise<Conversation | null> {
  const response = await getConversations();

  if (!response.success) {
    throw new Error(response.message || 'Unable to load conversations.');
  }

  return (
    response.conversations?.find(
      (conversation) =>
        Number(conversation.booking_id) === Number(bookingId)
    ) || null
  );
}
