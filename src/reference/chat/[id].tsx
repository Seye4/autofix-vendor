import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useLocalSearchParams, router } from 'expo-router';

import { api } from '../../api/client';

import { useAuthStore } from '../../store/authStore';

type Message = {
  id: number;

  sender_id: number;

  sender_name?: string;

  message: string;

  created_at?: string;
};

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const token = useAuthStore((state) => state.token);

  const user = useAuthStore((state) => state.user);

  const [conversationId, setConversationId] = useState<number | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);

  const [text, setText] = useState('');

  const [sending, setSending] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  /*
    |--------------------------------------------------------------------------
    | Find conversation
    |--------------------------------------------------------------------------
    */

  const loadConversation = useCallback(async () => {
    try {
      const response = await api.get('', {
        params: {
          path: `bookings/${id}/conversation`,
        },

        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setConversationId(response.data.conversation.id);
      }
    } catch (error: any) {
      Alert.alert('Chat unavailable', error.response?.data?.message ?? 'Unable to open chat.');
    }
  }, [id, token]);

  /*
    |--------------------------------------------------------------------------
    | Load messages
    |--------------------------------------------------------------------------
    */

  const loadMessages = useCallback(async () => {
    if (!conversationId) {
      return;
    }

    try {
      const response = await api.get('', {
        params: {
          path: `conversations/${conversationId}/messages`,
        },

        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setMessages(response.data.messages);
      }
    } catch {
      // Ignore temporary
      // polling errors.
    }
  }, [conversationId, token]);

  /*
    |--------------------------------------------------------------------------
    | Initial conversation
    |--------------------------------------------------------------------------
    */

  useEffect(() => {
    loadConversation();
  }, [loadConversation]);

  /*
    |--------------------------------------------------------------------------
    | Poll messages
    |--------------------------------------------------------------------------
    */

  useEffect(() => {
    if (!conversationId) {
      return;
    }

    loadMessages();

    const interval = setInterval(loadMessages, 3000);

    return () => clearInterval(interval);
  }, [conversationId, loadMessages]);

  /*
    |--------------------------------------------------------------------------
    | Scroll to bottom
    |--------------------------------------------------------------------------
    */

  useEffect(() => {
    if (messages.length === 0) {
      return;
    }

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({
        animated: true,
      });
    }, 100);
  }, [messages.length]);

  /*
    |--------------------------------------------------------------------------
    | Send
    |--------------------------------------------------------------------------
    */

  async function sendMessage() {
    const message = text.trim();

    if (!message || !conversationId || sending) {
      return;
    }

    try {
      setSending(true);

      const response = await api.post(
        '',
        {
          message,
        },
        {
          params: {
            path: `conversations/${conversationId}/messages`,
          },

          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      setText('');

      await loadMessages();
    } catch (error: any) {
      Alert.alert(
        'Message failed',
        error.response?.data?.message ?? error.message ?? 'Unable to send message.'
      );
    } finally {
      setSending(false);
    }
  }

  function renderMessage({ item }: { item: Message }) {
    const mine = Number(item.sender_id) === Number(user?.id);

    return (
      <View style={[styles.messageRow, mine ? styles.myRow : styles.otherRow]}>
        <View style={[styles.bubble, mine ? styles.myBubble : styles.otherBubble]}>
          <Text style={[styles.messageText, mine && styles.myMessageText]}>{item.message}</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>

        <View>
          <Text style={styles.headerTitle}>Service Chat</Text>

          <Text style={styles.headerSubtitle}>Booking #{id}</Text>
        </View>
      </View>

      <FlatList
        ref={flatListRef}

        data={messages}

        keyExtractor={(item) => String(item.id)}

        renderItem={renderMessage}

        contentContainerStyle={styles.messages}

        keyboardShouldPersistTaps="handled"

        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No messages yet</Text>

            <Text style={styles.emptyText}>Send a message to your service provider.</Text>
          </View>
        }
      />

      <View style={styles.composer}>
        <TextInput
          value={text}

          onChangeText={setText}

          placeholder={'Type a message...'}

          multiline

          maxLength={5000}

          style={styles.input}
        />

        <TouchableOpacity
          style={[styles.sendButton, (!text.trim() || sending) && styles.disabledButton]}

          disabled={!text.trim() || sending}

          onPress={sendMessage}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  header: {
    paddingTop: 55,
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
  },

  back: {
    fontSize: 30,
    marginRight: 15,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
  },

  headerSubtitle: {
    color: '#6B7280',
    marginTop: 2,
  },

  messages: {
    padding: 16,
    flexGrow: 1,
  },

  messageRow: {
    marginBottom: 10,
    flexDirection: 'row',
  },

  myRow: {
    justifyContent: 'flex-end',
  },

  otherRow: {
    justifyContent: 'flex-start',
  },

  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderRadius: 18,
  },

  myBubble: {
    backgroundColor: '#16A34A',
    borderBottomRightRadius: 4,
  },

  otherBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
  },

  messageText: {
    color: '#111827',
    lineHeight: 20,
  },

  myMessageText: {
    color: '#FFFFFF',
  },

  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },

  input: {
    flex: 1,
    maxHeight: 120,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
  },

  sendButton: {
    marginLeft: 8,
    backgroundColor: '#16A34A',
    paddingHorizontal: 17,
    paddingVertical: 12,
    borderRadius: 20,
  },

  disabledButton: {
    opacity: 0.5,
  },

  sendText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },

  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
  },

  emptyText: {
    marginTop: 5,
    color: '#6B7280',
    textAlign: 'center',
  },
});
