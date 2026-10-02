import React, { useState, useEffect, useRef, useCallback } from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform,
  Linking,
  ScrollView,
  Modal,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
} from 'react-native';

import MapView, { Marker } from 'react-native-maps';

import * as Location from 'expo-location';

import { useLocalSearchParams, useRouter } from 'expo-router';

import {
  Phone,
  MessageSquare,
  Navigation,
  Send,
  X,
  CheckCircle2,
  MapPin,
  Clock,
  Gauge,
  ArrowLeft,
  User,
  ChevronRight,
} from 'lucide-react-native';

import {
  getBookingProgress,
  updateVendorLocation,
  updateJobStatus,
  type BookingProgress,
  type BookingEvent,
  type LocationCoords,
  type JobStatus,
  getJobDetails,
} from '@/api/vendor';
import { Conversation, getConversationForBooking } from '@/services/chat';

type Job = BookingProgress;

type JobUpdateStatus = 'arriving' | 'arrived' | 'in_progress' | 'completed';

type ChatMessage = {
  id: string;
  sender: 'vendor' | 'customer';
  text: string;
  timestamp: string;
};

const PRESET_RESPONSES = [
  'I am on my way!',
  'Traffic is a bit heavy, I may be a few minutes late.',
  'I have arrived at the location.',
];

export default function VendorJobScreen() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    id?: string;
    bookingId?: string;
    booking_id?: string;
  }>();

  // Support links created by both the current jobs screen and older links.
  const bookingIdParam = params.id ?? params.bookingId ?? params.booking_id;

  const bookingId = Number(bookingIdParam);

  const mapRef = useRef<MapView | null>(null);

  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  const chatListRef = useRef<FlatList | null>(null);

  const [job, setJob] = useState<Job | null>(null);

  const [events, setEvents] = useState<BookingEvent[]>([]);

  const [currentLocation, setCurrentLocation] = useState<LocationCoords | null>(null);

  const [loading, setLoading] = useState(true);

  const [updating, setUpdating] = useState(false);

  const [isTracking, setIsTracking] = useState(false);

  const [updateCount, setUpdateCount] = useState(0);

  const [error, setError] = useState<string | null>(null);

  // Chat
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [chatLoading, setChatLoading] = useState(false);

  const [isChatOpen, setIsChatOpen] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [inputText, setInputText] = useState('');

  const [unreadCount, setUnreadCount] = useState(0);

  const loadConversation = useCallback(async () => {
    if (!bookingId || Number.isNaN(bookingId)) {
      setConversation(null);
      return;
    }

    try {
      setChatLoading(true);

      const result = await getConversationForBooking(bookingId);

      setConversation(result);
    } catch (error) {
      console.error('[Chat] Failed to load conversation:', error);
      setConversation(null);
    } finally {
      setChatLoading(false);
    }
  }, [bookingId]);

  /*
   * ==========================================
   * LOAD JOB
   * ==========================================
   */

  const loadJob = useCallback(async () => {
    if (!bookingId || Number.isNaN(bookingId)) {
      setError('Invalid booking ID.');

      setLoading(false);

      return;
    }

    try {
      console.log(`[VendorJobScreen] Loading booking ${bookingId}`);

      const response = await getJobDetails(bookingId);

      if (!response.success || !response.data?.booking) {
        throw new Error(response.message || 'Unable to load booking.');
      }

      setJob(response.data.booking);

      setEvents(response.data.events || []);

      setError(null);

      /*
       * Use vendor's latest backend location
       * if available.
       */

      if (
        response.data?.booking.vendor_latitude !== null &&
        response.data?.booking.vendor_latitude !== undefined &&
        response.data?.booking.vendor_longitude !== null &&
        response.data?.booking.vendor_longitude !== undefined
      ) {
        setCurrentLocation({
          latitude: Number(response.data?.booking.vendor_latitude),

          longitude: Number(response.data?.booking.vendor_longitude),
        });
      }
    } catch (err: any) {
      console.error('[VendorJobScreen] Failed to load job:', err);

      setError(err?.message || 'Unable to load job details.');
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  /*
   * ==========================================
   * INITIAL LOAD
   * ==========================================
   */

  useEffect(() => {
    loadJob();
    loadConversation();
  }, [loadJob, loadConversation]);

  /*
   * ==========================================
   * REFRESH JOB FROM SERVER
   * ==========================================
   */

  useEffect(() => {
    if (!bookingId) return;

    const interval = setInterval(() => {
      loadJob();
    }, 10000);

    return () => {
      clearInterval(interval);
    };
  }, [bookingId, loadJob]);

  /*
   * ==========================================
   * LOCATION TRACKING
   * ==========================================
   */

  useEffect(() => {
    if (!job) return;

    if (
      job.status !== 'accepted' &&
      job.status !== 'arriving' &&
      job.status !== 'arrived' &&
      job.status !== 'in_progress'
    ) {
      return;
    }

    let mounted = true;

    const startTracking = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== 'granted') {
          Alert.alert(
            'Location Permission Required',
            'Location permission is required while working on an active job.'
          );

          return;
        }

        /*
         * Get initial GPS position.
         */

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        if (!mounted) return;

        const coords: LocationCoords = {
          latitude: location.coords.latitude,

          longitude: location.coords.longitude,

          heading: location.coords.heading ?? undefined,

          speed: location.coords.speed ?? undefined,

          accuracy: location.coords.accuracy ?? undefined,
        };

        setCurrentLocation(coords);

        /*
         * Send initial location.
         */

        sendLocationToBackend(coords);

        /*
         * Start GPS watcher.
         */

        locationSubscription.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,

            distanceInterval: 10,

            timeInterval: 5000,
          },

          (locationData) => {
            if (!mounted) return;

            const gps = locationData.coords;

            const updatedLocation: LocationCoords = {
              latitude: gps.latitude,

              longitude: gps.longitude,

              heading: gps.heading ?? undefined,

              speed: gps.speed ?? undefined,

              accuracy: gps.accuracy ?? undefined,
            };

            setCurrentLocation(updatedLocation);

            setUpdateCount((count) => count + 1);

            sendLocationToBackend(updatedLocation);

            /*
             * Keep map centered.
             */

            mapRef.current?.animateCamera(
              {
                center: {
                  latitude: updatedLocation.latitude,

                  longitude: updatedLocation.longitude,
                },

                heading: updatedLocation.heading || 0,

                pitch: 30,

                zoom: 17,
              },

              {
                duration: 1000,
              }
            );
          }
        );

        setIsTracking(true);
      } catch (err) {
        console.error('[GPS] Tracking error:', err);

        setIsTracking(false);
      }
    };

    startTracking();

    return () => {
      mounted = false;

      if (locationSubscription.current) {
        locationSubscription.current.remove();

        locationSubscription.current = null;
      }

      setIsTracking(false);
    };
  }, [job?.status]);

  /*
   * ==========================================
   * SEND LOCATION TO PHP
   * ==========================================
   */

  async function sendLocationToBackend(coords: LocationCoords) {
    if (!bookingId) return;

    try {
      await updateVendorLocation({
        ...coords,

        booking_id: bookingId,
      });
    } catch (error) {
      console.error('[API] Location update failed:', error);
    }
  }

  /*
   * ==========================================
   * STATUS BUTTON
   * ==========================================
   */

  const getStatusButtonConfig = () => {
    if (!job) return null;

    switch (job.status) {
      case 'accepted':
        return {
          nextStatus: 'arriving' as JobUpdateStatus,

          label: 'Start Driving',

          color: '#2563EB',
        };

      case 'arriving':
        return {
          nextStatus: 'arrived' as JobUpdateStatus,

          label: 'I Have Arrived',

          color: '#7C3AED',
        };

      case 'arrived':
        return {
          nextStatus: 'in_progress' as JobUpdateStatus,

          label: 'Start Service',

          color: '#2563EB',
        };

      case 'in_progress':
        return {
          nextStatus: 'completed' as JobUpdateStatus,

          label: 'Mark Service Completed',

          color: '#059669',
        };

      default:
        return null;
    }
  };

  /*
   * ==========================================
   * UPDATE STATUS
   * ==========================================
   */

  const handleNextStatus = async () => {
    if (!job || !bookingId) return;

    const config = getStatusButtonConfig();

    if (!config) return;

    let confirmationMessage = 'Are you sure you want to continue?';

    switch (config.nextStatus) {
      case 'arriving':
        confirmationMessage = 'Confirm that you are leaving for the customer location.';

        break;

      case 'arrived':
        confirmationMessage = 'Confirm that you have arrived at the customer location.';

        break;

      case 'in_progress':
        confirmationMessage = 'Confirm that you are starting the service.';

        break;

      case 'completed':
        confirmationMessage = 'Confirm that the service has been completed.';

        break;
    }

    Alert.alert(
      config.label,

      confirmationMessage,

      [
        {
          text: 'Cancel',
          style: 'cancel',
        },

        {
          text: 'Confirm',

          onPress: async () => {
            try {
              setUpdating(true);

              console.log(`[Status] Updating booking ${bookingId} to ${config.nextStatus}`);

              const response = await updateJobStatus(
                bookingId,

                config.nextStatus,

                ''
              );

              if (!response.success) {
                throw new Error(response.message || 'Status update failed.');
              }

              /*
               * Reload the actual database state.
               */

              await loadJob();

              if (config.nextStatus === 'completed') {
                if (locationSubscription.current) {
                  locationSubscription.current.remove();

                  locationSubscription.current = null;
                }

                setIsTracking(false);

                Alert.alert('Job Completed', 'The job has been completed successfully.', [
                  {
                    text: 'OK',

                    onPress: () => router.replace('/'),
                  },
                ]);
              }
            } catch (error: any) {
              console.error('[Status]', error);

              Alert.alert(
                'Update Failed',
                error?.message || 'Something went wrong while updating the job.'
              );
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  /*
   * ==========================================
   * CALL CUSTOMER
   * ==========================================
   */

  const handleCallCustomer = async () => {
    if (!job?.customer_phone) {
      Alert.alert('No Phone Number', 'This customer does not have a phone number.');

      return;
    }

    const phoneUrl = `tel:${job.customer_phone}`;

    try {
      const supported = await Linking.canOpenURL(phoneUrl);

      if (!supported) {
        Alert.alert('Unable to Call', 'Your device cannot make phone calls.');

        return;
      }

      await Linking.openURL(phoneUrl);
    } catch {
      Alert.alert('Call Failed', 'Unable to open the phone application.');
    }
  };

  /*
   * ==========================================
   * RECENTER
   * ==========================================
   */

  const handleRecenter = () => {
    if (!currentLocation || !mapRef.current) return;

    mapRef.current.animateToRegion(
      {
        latitude: currentLocation.latitude,

        longitude: currentLocation.longitude,

        latitudeDelta: 0.005,

        longitudeDelta: 0.005,
      },

      800
    );
  };

  /*
   * ==========================================
   * CHAT
   * ==========================================
   */

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputText;

    if (!text.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),

      sender: 'vendor',

      text: text.trim(),

      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setMessages((previous) => [...previous, newMessage]);

    if (!textToSend) {
      setInputText('');
    }

    setTimeout(() => {
      chatListRef.current?.scrollToEnd({
        animated: true,
      });
    }, 100);
  };

  /* const openChat = () => {
    setIsChatOpen(true);

    setUnreadCount(0);
  }; */

  const openChat = () => {
    if (chatLoading) {
      return;
    }

    if (!conversation) {
      Alert.alert('Chat Unavailable', 'There is no active conversation for this booking yet.');

      return;
    }

    router.push({
      pathname: '/screens/chat',
      params: {
        conversationId: String(conversation.id),
        providerName: conversation.other_user_name || job?.customer_name || 'Customer',
        serviceType: conversation.service_type || '',
        bookingNumber: conversation.booking_number || job?.booking_number || String(job?.id),
      },
    });
  };

  /*
   * ==========================================
   * LOADING
   * ==========================================
   */

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563EB" />

        <Text style={styles.loadingTitle}>Loading Job Details</Text>

        <Text style={styles.loadingSubtitle}>Connecting to the server...</Text>
      </View>
    );
  }

  /*
   * ==========================================
   * ERROR
   * ==========================================
   */

  if (!job) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorTitle}>Job Not Found</Text>

        <Text style={styles.errorText}>{error || 'The requested job could not be loaded.'}</Text>

        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const buttonConfig = getStatusButtonConfig();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* HEADER */}

      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backCircle} onPress={() => router.back()}>
          <ArrowLeft size={18} color="#475569" />
        </TouchableOpacity>

        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerTitle}>Job #{job.booking_number || job.id}</Text>

          <Text style={styles.headerSubtitle}>
            Status: {job.status.replace('_', ' ').toUpperCase()}
          </Text>
        </View>

        <View style={styles.liveIndicator}>
          <View style={[styles.pulseDot, isTracking ? styles.dotGreen : styles.dotRed]} />

          <Text style={styles.liveText}>{isTracking ? 'LIVE' : 'OFF'}</Text>
        </View>
      </View>

      {/* MAP */}

      {currentLocation ? (
        <MapView
          ref={mapRef}
          style={styles.map}

          initialRegion={{
            latitude: currentLocation.latitude,

            longitude: currentLocation.longitude,

            latitudeDelta: 0.008,

            longitudeDelta: 0.008,
          }}

          showsUserLocation={false}
          showsCompass={false}>
          <Marker
            coordinate={{
              latitude: currentLocation.latitude,

              longitude: currentLocation.longitude,
            }}

            anchor={{
              x: 0.5,
              y: 0.5,
            }}>
            <View style={styles.markerContainer}>
              <View style={styles.markerHalo} />

              <View style={styles.markerCore}>
                <Navigation size={16} color="#FFFFFF" />
              </View>
            </View>
          </Marker>
        </MapView>
      ) : (
        <View style={styles.mapLoading}>
          <ActivityIndicator size="large" color="#2563EB" />

          <Text style={styles.mapLoadingText}>Acquiring GPS Signal...</Text>
        </View>
      )}

      {/* MAP BUTTONS */}

      <View style={styles.mapFloatingActions}>
        <TouchableOpacity style={styles.chatFabButton} onPress={openChat}>
          <MessageSquare size={20} color="#2563EB" />

          {unreadCount > 0 && (
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.recenterButton} onPress={handleRecenter}>
          <Navigation size={20} color="#0F172A" />
        </TouchableOpacity>
      </View>

      {/* BOTTOM CARD */}

      <View style={styles.bottomCard}>
        <View style={styles.dragHandle} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          {/* STATUS */}

          <View style={styles.statusRow}>
            <View style={styles.statusInfo}>
              <Text style={styles.statusLabel}>CURRENT STATUS</Text>

              <Text style={styles.statusHeading}>
                {job.status === 'accepted'
                  ? 'Job Accepted'
                  : job.status === 'arriving'
                    ? 'En Route to Customer'
                    : job.status === 'arrived'
                      ? 'Arrived at Location'
                      : job.status === 'in_progress'
                        ? 'Service In Progress'
                        : job.status === 'completed'
                          ? 'Service Completed'
                          : job.status.replace('_', ' ')}
              </Text>
            </View>

            <View style={styles.updatesBadge}>
              <Text style={styles.updatesText}>{updateCount} pings</Text>
            </View>
          </View>

          {/* TELEMETRY */}

          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <View style={styles.metricHeaderRow}>
                <Gauge size={14} color="#64748B" style={styles.metricIcon} />

                <Text style={styles.metricValue}>
                  {currentLocation?.speed ? (currentLocation.speed * 3.6).toFixed(0) : '0'}
                </Text>
              </View>

              <Text style={styles.metricLabel}>km/h Speed</Text>
            </View>

            <View style={styles.metricDivider} />

            <View style={styles.metricItem}>
              <View style={styles.metricHeaderRow}>
                <MapPin size={14} color="#64748B" style={styles.metricIcon} />

                <Text style={styles.metricValue}>
                  {currentLocation?.accuracy ? `±${Math.round(currentLocation.accuracy)}m` : 'N/A'}
                </Text>
              </View>

              <Text style={styles.metricLabel}>GPS Accuracy</Text>
            </View>

            <View style={styles.metricDivider} />

            <View style={styles.metricItem}>
              <View style={styles.metricHeaderRow}>
                <Clock size={14} color="#64748B" style={styles.metricIcon} />

                <Text style={styles.metricValue}>5s</Text>
              </View>

              <Text style={styles.metricLabel}>Sync Interval</Text>
            </View>
          </View>

          {/* CUSTOMER */}

          <View style={styles.cardSection}>
            <Text style={styles.sectionTitle}>CUSTOMER DETAILS</Text>

            <View style={styles.customerRow}>
              <View style={styles.avatarContainer}>
                <User size={20} color="#2563EB" />
              </View>

              <View style={styles.customerInfo}>
                <Text style={styles.customerName}>{job.customer_name || 'Customer'}</Text>

                {job.customer_phone ? (
                  <Text style={styles.phoneText}>{job.customer_phone}</Text>
                ) : (
                  <Text style={styles.noPhoneText}>No phone available</Text>
                )}
              </View>

              <View style={styles.actionIconButtonGroup}>
                <TouchableOpacity style={styles.chatCircleBtn} onPress={openChat}>
                  <MessageSquare size={18} color="#2563EB" />
                </TouchableOpacity>

                {job.customer_phone && (
                  <TouchableOpacity style={styles.callCircleBtn} onPress={handleCallCustomer}>
                    <Phone size={18} color="#16A34A" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* LOCATION */}

          <View style={styles.cardSection}>
            <Text style={styles.sectionTitle}>SERVICE LOCATION</Text>

            <View style={styles.locationBlock}>
              <View style={styles.locationDotPickup} />

              <View style={styles.locationTextGroup}>
                <Text style={styles.locationTag}>PICKUP</Text>

                <Text style={styles.locationAddress}>
                  {job.pickup_address || 'Pickup location'}
                </Text>
              </View>
            </View>

            {job.destination_address && (
              <View style={[styles.locationBlock, { marginTop: 12 }]}>
                <View style={styles.locationDotDropoff} />
                <View style={styles.locationTextGroup}>
                  <Text style={styles.locationTag}>DROP-OFF</Text>
                  <Text style={styles.locationAddress}>{job.destination_address}</Text>
                </View>
              </View>
            )}
          </View>

          {/* PROBLEM DETAILS */}
          {job.problem_description && (
            <View style={styles.cardSection}>
              <Text style={styles.sectionTitle}>REPORTED ISSUE</Text>
              <Text style={styles.problemText}>{job.problem_description}</Text>
            </View>
          )}

          {/* EVENTS */}

          {events.length > 0 && (
            <View style={styles.cardSection}>
              <Text style={styles.sectionTitle}>JOB ACTIVITY</Text>

              {events
                .slice()
                .reverse()
                .slice(0, 5)
                .map((event) => (
                  <View
                    key={event.id}
                    style={{
                      marginBottom: 10,
                    }}>
                    <Text
                      style={{
                        fontWeight: '700',
                        color: '#0F172A',
                      }}>
                      {event.description || event.event_type}
                    </Text>

                    <Text
                      style={{
                        fontSize: 11,
                        color: '#64748B',
                        marginTop: 2,
                      }}>
                      {event.created_at}
                    </Text>
                  </View>
                ))}
            </View>
          )}

          {/* ACTION */}

          {buttonConfig && (
            <TouchableOpacity
              style={[
                styles.actionButton,
                {
                  backgroundColor: buttonConfig.color,
                },
              ]}
              onPress={handleNextStatus}
              disabled={updating}
              activeOpacity={0.88}>
              {updating ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <View style={styles.actionBtnContent}>
                  <Text style={styles.actionButtonText}>{buttonConfig.label}</Text>

                  <ChevronRight
                    size={18}
                    color="#FFFFFF"
                    style={{
                      marginLeft: 6,
                    }}
                  />
                </View>
              )}
            </TouchableOpacity>
          )}

          {job.status === 'completed' && (
            <View style={styles.completedContainer}>
              <CheckCircle2
                size={20}
                color="#16A34A"
                style={{
                  marginRight: 8,
                }}
              />

              <Text style={styles.completedText}>Service Completed</Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* CHAT */}

      <Modal
        visible={isChatOpen}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setIsChatOpen(false)}>
        <SafeAreaView style={styles.chatModalContainer}>
          <View style={styles.chatHeader}>
            <TouchableOpacity onPress={() => setIsChatOpen(false)} style={styles.chatCloseBtn}>
              <X size={20} color="#0F172A" />
            </TouchableOpacity>

            <View style={styles.chatHeaderInfo}>
              <Text style={styles.chatHeaderTitle}>{job.customer_name || 'Customer'}</Text>

              <Text style={styles.chatHeaderSubtitle}>Job #{job.booking_number}</Text>
            </View>

            {job.customer_phone && (
              <TouchableOpacity style={styles.chatHeaderCallBtn} onPress={handleCallCustomer}>
                <Phone size={18} color="#2563EB" />
              </TouchableOpacity>
            )}
          </View>

          <KeyboardAvoidingView
            style={styles.chatKeyboardAvoid}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <FlatList
              ref={chatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.chatMessagesList}
              renderItem={({ item }) => {
                const isVendor = item.sender === 'vendor';

                return (
                  <View
                    style={[
                      styles.messageWrapper,

                      isVendor ? styles.messageVendorWrapper : styles.messageCustomerWrapper,
                    ]}>
                    <View
                      style={[
                        styles.messageBubble,

                        isVendor ? styles.messageBubbleVendor : styles.messageBubbleCustomer,
                      ]}>
                      <Text
                        style={[
                          styles.messageText,

                          isVendor ? styles.messageTextVendor : styles.messageTextCustomer,
                        ]}>
                        {item.text}
                      </Text>

                      <Text
                        style={[
                          styles.messageTime,

                          isVendor ? styles.messageTimeVendor : styles.messageTimeCustomer,
                        ]}>
                        {item.timestamp}
                      </Text>
                    </View>
                  </View>
                );
              }}
            />

            <View style={styles.presetsContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {PRESET_RESPONSES.map((preset, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.presetChip}
                    onPress={() => handleSendMessage(preset)}>
                    <Text style={styles.presetChipText}>{preset}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.chatInputRow}>
              <TextInput
                style={styles.chatInput}
                placeholder="Type a message..."
                placeholderTextColor="#94A3B8"
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={() => handleSendMessage()}
              />

              <TouchableOpacity
                style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                disabled={!inputText.trim()}
                onPress={() => handleSendMessage()}>
                <Send size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 24,
  },
  loadingTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  loadingSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#64748B',
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
  },
  backBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  map: {
    flex: 1,
  },
  mapLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
  },
  mapLoadingText: {
    marginTop: 10,
    color: '#475569',
    fontWeight: '500',
  },
  topHeader: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 16,
    left: 16,
    right: 16,
    zIndex: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 8,
  },
  backCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleGroup: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  demoBadge: {
    marginLeft: 8,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  demoBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#D97706',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  dotGreen: {
    backgroundColor: '#16A34A',
  },
  dotRed: {
    backgroundColor: '#EF4444',
  },
  liveText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#334155',
    letterSpacing: 0.5,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerHalo: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(37, 99, 235, 0.25)',
  },
  markerCore: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  mapFloatingActions: {
    position: 'absolute',
    right: 16,
    bottom: '53%',
    zIndex: 5,
    gap: 10,
  },
  chatFabButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  badgeContainer: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  recenterButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  bottomCard: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '52%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 12,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 12,
  },
  scrollContent: {
    paddingBottom: Platform.OS === 'ios' ? 32 : 20,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  statusHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 3,
  },
  updatesBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  updatesText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricIcon: {
    marginRight: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#E2E8F0',
  },
  cardSection: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  phoneText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 1,
  },
  noPhoneText: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 1,
  },
  actionIconButtonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chatCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  callCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  locationBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationDotPickup: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2563EB',
    marginTop: 4,
    marginRight: 10,
  },
  locationDotDropoff: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#059669',
    marginTop: 4,
    marginRight: 10,
  },
  locationTextGroup: {
    flex: 1,
  },
  locationTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
  },
  locationAddress: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1E293B',
    marginTop: 2,
  },
  problemText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 19,
  },
  actionButton: {
    marginTop: 20,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  completedContainer: {
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#F0FDF4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  completedText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#16A34A',
  },

  /* CHAT MODAL STYLES */
  chatModalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  chatCloseBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  chatHeaderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  chatHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  chatHeaderSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  chatHeaderCallBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatKeyboardAvoid: {
    flex: 1,
  },
  chatMessagesList: {
    padding: 16,
    gap: 12,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  messageVendorWrapper: {
    justifyContent: 'flex-end',
  },
  messageCustomerWrapper: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  messageBubbleVendor: {
    backgroundColor: '#2563EB',
    borderBottomRightRadius: 4,
  },
  messageBubbleCustomer: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageTextVendor: {
    color: '#FFFFFF',
  },
  messageTextCustomer: {
    color: '#0F172A',
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  messageTimeVendor: {
    color: '#93C5FD',
  },
  messageTimeCustomer: {
    color: '#94A3B8',
  },
  presetsContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  presetChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 8,
  },
  chatInput: {
    flex: 1,
    height: 42,
    backgroundColor: '#F8FAFC',
    borderRadius: 21,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
});
