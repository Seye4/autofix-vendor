import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  ListRenderItemInfo,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';

import { ChatMessage, getMessages, markMessagesRead, sendMessage } from '@/services/chat';
import { useAuth } from '../../context/AuthContext';

export default function ChatScreen(): React.JSX.Element {
  // 1. Read route parameters safely via Expo Router hook
  const params = useLocalSearchParams<{
    conversationId?: string;
    providerName?: string;
    serviceType?: string;
    bookingNumber?: string;
  }>();

  const conversationId = params.conversationId;
  const providerName = params.providerName;
  const serviceType = params.serviceType;
  const bookingNumber = params.bookingNumber;

  const { user } = useAuth();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [sending, setSending] = useState<boolean>(false);

  const lastMessageId = useRef<number>(0);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  /*
   * ==========================================
   * LOAD MESSAGES
   * ==========================================
   */

  const loadMessages = useCallback(
    async (initial: boolean = false): Promise<void> => {
      // If no conversationId is passed in params, skip network call
      if (!conversationId) {
        setLoading(false);
        return;
      }

      try {
        const response = await getMessages(conversationId, initial ? 0 : lastMessageId.current);

        const newMessages: ChatMessage[] = response.messages || [];

        if (newMessages.length > 0) {
          setMessages((current) => {
            if (initial) {
              return newMessages;
            }

            const existingIds = new Set(current.map((item) => item.id));
            const unique = newMessages.filter((item) => !existingIds.has(item.id));

            return [...current, ...unique];
          });

          lastMessageId.current = Number(newMessages[newMessages.length - 1].id);
        }

        await markMessagesRead(conversationId);
      } catch (error: any) {
        console.error('Chat error:', error);
      } finally {
        setLoading(false);
      }
    },
    [conversationId]
  );

  /*
   * ==========================================
   * POLLING & INITIALIZATION
   * ==========================================
   */

  useEffect(() => {
    loadMessages(true);

    if (!conversationId) return;

    const interval = setInterval(() => {
      loadMessages(false);
    }, 3000);

    return () => clearInterval(interval);
  }, [loadMessages, conversationId]);

  /*
   * ==========================================
   * ACTION HANDLERS
   * ==========================================
   */

  const handleSend = async (): Promise<void> => {
    const value = text.trim();

    if (!value || sending || !conversationId) {
      return;
    }

    setSending(true);

    try {
      await sendMessage(conversationId, value);
      setText('');

      await loadMessages(false);

      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error: any) {
      Alert.alert('Unable to send', error?.message || 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  /*
   * ==========================================
   * RENDER ITEM
   * ==========================================
   */

  const renderMessage = ({ item }: ListRenderItemInfo<ChatMessage>): React.JSX.Element => {
    const isMine = Number(item.sender_id) === Number(user?.id);

    return (
      <View style={[styles.messageRow, isMine ? styles.mineRow : styles.theirRow]}>
        <View style={[styles.messageBubble, isMine ? styles.mineBubble : styles.theirBubble]}>
          <Text style={[styles.messageText, isMine && styles.mineText]}>{item.message}</Text>
          <Text style={[styles.time, isMine && styles.mineTime]}>
            {formatTime(item.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  /*
   * ==========================================
   * LOADING STATE
   * ==========================================
   */

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading conversation...</Text>
      </View>
    );
  }

  /*
   * ==========================================
   * EMPTY / NO CONVERSATION ID STATE
   * ==========================================
   */

  if (!conversationId) {
    return (
      <View style={styles.noConversationContainer}>
        <View style={styles.emptyIconCircle}>
          <Text style={styles.emptyIcon}>💬</Text>
        </View>
        <Text style={styles.emptyTitle}>No Active Chat</Text>
        <Text style={styles.emptyText}>
          Select a booking or service request from your list to open a chat.
        </Text>
      </View>
    );
  }

  /*
   * ==========================================
   * MAIN UI
   * ==========================================
   */

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>{providerName || 'Service Provider'}</Text>
          <View style={styles.subtitleRow}>
            <View style={styles.onlineBadge} />
            {/* <Text style={styles.subtitle}>
              Booking #{conversationId} {serviceType ? `• ${serviceType}` : ''}
            </Text> */}
            <Text style={styles.subtitle}>
              Booking #{bookingNumber || conversationId}
              {serviceType ? ` • ${serviceType}` : ''}
            </Text>
          </View>
        </View>
      </View>

      {/* MESSAGES LIST */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderMessage}
        contentContainerStyle={
          messages.length === 0 ? styles.emptyMessagesContainer : styles.messages
        }
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconCircle}>
              <Text style={styles.emptyIcon}>💬</Text>
            </View>
            <Text style={styles.emptyTitle}>Start the conversation</Text>
            <Text style={styles.emptyText}>
              Send a message to discuss your service request details.
            </Text>
          </View>
        }
      />

      {/* INPUT AREA */}
      <View style={styles.inputArea}>
        <TouchableOpacity
          style={styles.attachButton}
          activeOpacity={0.7}
          onPress={() =>
            Alert.alert(
              'Coming Soon',
              'Photo and video attachments will be enabled in the next update.'
            )
          }>
          <Text style={styles.attachText}>＋</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Type a message..."
          placeholderTextColor="#94A3B8"
          multiline
          maxLength={5000}
        />

        <TouchableOpacity
          style={[styles.sendButton, (!text.trim() || sending) && styles.sendButtonDisabled]}
          disabled={!text.trim() || sending}
          onPress={handleSend}
          activeOpacity={0.8}>
          {sending ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.sendIcon}>➔</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function formatTime(value: string): string {
  if (!value) return '';
  const isoFormatted = value.includes('T') ? value : value.replace(' ', 'T');
  const date = new Date(isoFormatted);

  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
  },
  noConversationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 55,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    zIndex: 10,
  },
  headerContent: {
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  onlineBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
    marginRight: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  messages: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  emptyMessagesContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  messageRow: {
    width: '100%',
    marginBottom: 12,
    flexDirection: 'row',
  },
  mineRow: {
    justifyContent: 'flex-end',
  },
  theirRow: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  mineBubble: {
    backgroundColor: '#2563EB',
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  messageText: {
    color: '#0F172A',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
  },
  mineText: {
    color: '#FFFFFF',
  },
  time: {
    marginTop: 4,
    fontSize: 10,
    fontWeight: '500',
    color: '#94A3B8',
    alignSelf: 'flex-end',
  },
  mineTime: {
    color: '#BFDBFE',
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  attachButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  attachText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#64748B',
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 42,
    backgroundColor: '#F8FAFC',
    borderRadius: 21,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    color: '#0F172A',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sendButton: {
    width: 42,
    height: 42,
    marginLeft: 10,
    borderRadius: 21,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  sendIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  sendButtonDisabled: {
    backgroundColor: '#CBD5E1',
    shadowOpacity: 0,
    elevation: 0,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyIcon: {
    fontSize: 28,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  emptyText: {
    marginTop: 6,
    color: '#64748B',
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
});
