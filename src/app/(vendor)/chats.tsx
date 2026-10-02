import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';

import { Conversation, getConversations } from '@/services/chat';

/* ============================================================================
   MAIN COMPONENT
   ============================================================================ */

export default function ConversationListScreen(): React.JSX.Element {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  /*
   * ==========================================
   * DATA FETCHING
   * ==========================================
   */

  const fetchConversations = useCallback(
    async (isManualRefresh: boolean = false): Promise<void> => {
      if (isManualRefresh) {
        setRefreshing(true);
      }

      try {
        const response = await getConversations();
        setConversations(response.conversations || []);
      } catch (error) {
        console.error('Failed to load conversations:', error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchConversations();

    const interval = setInterval(() => {
      fetchConversations();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchConversations]);

  /*
   * ==========================================
   * NAVIGATION HANDLER
   * ==========================================
   */

  const handleOpenChat = (item: Conversation) => {
    router.push({
      pathname: '/screens/chat',
      params: {
        conversationId: String(item.id),
        /* providerName: item.other_user_name || formatService((item as any).service_type),
        serviceType: formatService((item as any).service_type), */
        providerName: formatService(item.service_type),
        serviceType: formatService(item.service_type),
      },
    });
  };

  /*
   * ==========================================
   * RENDER ITEM
   * ==========================================
   */

  const renderConversation = ({ item }: { item: Conversation }) => {
    // const serviceType = (item as any).service_type;
    const serviceType = item.service_type;

    const bookingNumber = (item as any).booking_number || item.booking_id;
    const hasUnread = Number(item.unread_count) > 0;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => handleOpenChat(item)}>
        {/* AVATAR / ICON */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getServiceIcon(serviceType)}</Text>
        </View>

        {/* DETAILS */}
        <View style={styles.content}>
          <View style={styles.topRow}>
            <Text style={styles.title} numberOfLines={1}>
              {item.other_user_name || formatService(serviceType)}
              {/* {item.vendor_id || formatService(serviceType)} */}
            </Text>

            {item.updated_at && (
              <Text style={[styles.time, hasUnread && styles.timeUnread]}>
                {formatTimestamp(item.updated_at)}
              </Text>
            )}
          </View>

          <Text style={styles.subtitle}>
            {formatService(serviceType)} {bookingNumber ? `• #${bookingNumber}` : ''}
          </Text>

          <View style={styles.bottomRow}>
            <Text
              style={[styles.lastMessage, hasUnread && styles.lastMessageUnread]}
              numberOfLines={1}>
              {item.last_message || 'No messages yet'}
            </Text>

            {hasUnread && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {item.unread_count! > 99 ? '99+' : item.unread_count}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
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
      </View>
    );
  }

  /*
   * ==========================================
   * MAIN UI
   * ==========================================
   */

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <Text style={styles.headerSubtitle}>Your active service conversations</Text>
      </View>

      {/* LIST */}
      <FlatList
        data={conversations}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderConversation}
        contentContainerStyle={conversations.length === 0 ? styles.emptyListContainer : styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchConversations(true)}
            tintColor="#2563EB"
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconCircle}>
              <Text style={styles.emptyIcon}>💬</Text>
            </View>
            <Text style={styles.emptyTitle}>No conversations yet</Text>
            <Text style={styles.emptyText}>
              Conversations will appear here when a service booking is active.
            </Text>
          </View>
        }
      />
    </View>
  );
}

/* ============================================================================
   HELPERS
   ============================================================================ */

function formatService(type?: string): string {
  if (!type) return 'Service';

  const names: Record<string, string> = {
    ride: 'Ride Service',
    mechanic: 'Mechanic Service',
    tow: 'Towing Service',
  };

  return names[type.toLowerCase()] || 'Service';
}

function getServiceIcon(type?: string): string {
  if (!type) return '💬';

  const icons: Record<string, string> = {
    ride: '🚗',
    mechanic: '🔧',
    tow: '🚛',
  };

  return icons[type.toLowerCase()] || '💬';
}

function formatTimestamp(value?: string): string {
  if (!value) return '';

  const isoFormatted = value.includes('T') ? value : value.replace(' ', 'T');
  const date = new Date(isoFormatted);
  const now = new Date();

  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 172800) return 'Yesterday';

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

/* ============================================================================
   STYLES
   ============================================================================ */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },

  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },

  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },

  headerSubtitle: {
    marginTop: 2,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '400',
  },

  list: {
    padding: 16,
  },

  emptyListContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },

  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatarText: {
    fontSize: 22,
  },

  content: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    marginRight: 8,
  },

  time: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },

  timeUnread: {
    color: '#2563EB',
    fontWeight: '600',
  },

  subtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },

  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },

  lastMessage: {
    fontSize: 14,
    color: '#64748B',
    flex: 1,
    marginRight: 8,
  },

  lastMessageUnread: {
    color: '#0F172A',
    fontWeight: '600',
  },

  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },

  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },

  empty: {
    alignItems: 'center',
    justifyContent: 'center',
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
    maxWidth: 260,
  },
});
