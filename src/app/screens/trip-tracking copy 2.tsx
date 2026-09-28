import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';

import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { updateVendorLocation, updateJobStatus, LocationCoords, JobStatus } from '@/api/vendor';

export default function VendorJobScreen() {
  const router = useRouter();

  const { id: bookingId } = useLocalSearchParams<{ id: string }>();

  const mapRef = useRef<MapView | null>(null);

  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  const [currentLocation, setCurrentLocation] = useState<LocationCoords | null>(null);

  const [loading, setLoading] = useState<boolean>(true);

  const [isTracking, setIsTracking] = useState<boolean>(false);

  const [updateCount, setUpdateCount] = useState<number>(0);

  /*
   * Booking status.
   *
   * Flow:
   *
   * accepted
   *     ↓
   * arriving
   *     ↓
   * arrived
   *     ↓
   * in_progress
   *     ↓
   * completed
   */
  const [jobStatus, setJobStatus] = useState<JobStatus>('accepted');

  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);

  /*
   * ==========================================
   * START LOCATION TRACKING
   * ==========================================
   */

  useEffect(() => {
    let isMounted = true;

    console.log(`[VendorJobScreen] 🚀 Mounting tracking screen for bookingId: ${bookingId}`);

    async function setupTracking() {
      try {
        /*
         * Validate booking ID
         */
        if (!bookingId) {
          console.error('[VendorJobScreen] ❌ Missing booking ID');

          Alert.alert('Error', 'Booking ID is missing.');

          setLoading(false);

          return;
        }

        /*
         * Request location permission
         */
        console.log('[GPS Setup] 1️⃣ Requesting location permissions...');

        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== 'granted') {
          console.warn('[GPS Setup] ❌ Permission denied by user');

          if (isMounted) {
            Alert.alert(
              'Permission Denied',
              'Location permissions are required to track active jobs.'
            );

            setLoading(false);
          }

          return;
        }

        /*
         * Get initial position
         */
        console.log('[GPS Setup] 2️⃣ Fetching initial position...');

        const initialLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        const initialCoords: LocationCoords = {
          latitude: initialLocation.coords.latitude,

          longitude: initialLocation.coords.longitude,

          heading: initialLocation.coords.heading ?? undefined,

          speed: initialLocation.coords.speed ?? undefined,

          accuracy: initialLocation.coords.accuracy ?? undefined,
        };

        if (!isMounted) {
          return;
        }

        setCurrentLocation(initialCoords);

        setLoading(false);

        /*
         * Send initial location to backend.
         */
        await sendLocationToBackend(initialCoords);

        /*
         * Start continuous GPS tracking.
         */
        console.log('[GPS Setup] 3️⃣ Starting watchPositionAsync loop...');

        locationSubscription.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,

            /*
             * Send location after moving
             * approximately 10 metres.
             */
            distanceInterval: 10,

            /*
             * Also update every 5 seconds.
             */
            timeInterval: 5000,
          },

          (locationData) => {
            if (!isMounted) {
              return;
            }

            const updatedCoords: LocationCoords = {
              latitude: locationData.coords.latitude,

              longitude: locationData.coords.longitude,

              heading: locationData.coords.heading ?? undefined,

              speed: locationData.coords.speed ?? undefined,

              accuracy: locationData.coords.accuracy ?? undefined,
            };

            /*
             * Update UI.
             */
            setCurrentLocation(updatedCoords);

            setUpdateCount((previous) => previous + 1);

            /*
             * Send GPS position to backend.
             */
            sendLocationToBackend(updatedCoords);

            /*
             * Move map camera.
             */
            if (mapRef.current) {
              mapRef.current.animateCamera(
                {
                  center: {
                    latitude: updatedCoords.latitude,

                    longitude: updatedCoords.longitude,
                  },

                  heading: updatedCoords.heading || 0,

                  pitch: 30,

                  zoom: 17,
                },

                {
                  duration: 1000,
                }
              );
            }
          }
        );

        if (isMounted) {
          setIsTracking(true);
        }

        console.log('[GPS Setup] ✅ Location tracking started');
      } catch (error) {
        console.error('[GPS Setup] 💥 Error initializing location tracking:', error);

        if (isMounted) {
          setLoading(false);

          setIsTracking(false);
        }
      }
    }

    setupTracking();

    /*
     * Cleanup.
     */
    return () => {
      isMounted = false;

      console.log('[VendorJobScreen] 🛑 Cleaning up location tracking');

      if (locationSubscription.current) {
        locationSubscription.current.remove();

        locationSubscription.current = null;
      }

      setIsTracking(false);
    };
  }, [bookingId]);

  /*
   * ==========================================
   * SEND LOCATION TO BACKEND
   * ==========================================
   */

  async function sendLocationToBackend(coords: LocationCoords) {
    if (!bookingId) {
      console.warn('[Location] ⚠️ No booking ID. Location not sent.');

      return;
    }

    const parsedBookingId = parseInt(bookingId, 10);

    if (Number.isNaN(parsedBookingId)) {
      console.warn('[Location] ⚠️ Invalid booking ID:', bookingId);

      return;
    }

    const payload = {
      latitude: coords.latitude,

      longitude: coords.longitude,

      heading: coords.heading,

      speed: coords.speed,

      accuracy: coords.accuracy,

      booking_id: parsedBookingId,
    };

    try {
      await updateVendorLocation(payload);

      console.log('[Location] ✅ Location pushed:', {
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
      });
    } catch (error) {
      console.error('[API] ❌ Failed to push location:', error);
    }
  }

  /*
   * ==========================================
   * STATUS BUTTON CONFIGURATION
   * ==========================================
   */

  const getStatusButtonConfig = () => {
    switch (jobStatus) {
      /*
       * Vendor accepted the job.
       *
       * Next:
       * accepted → arriving
       */
      case 'accepted':
        return {
          nextStatus: 'arriving' as const,

          label: 'Start Driving',

          color: '#2563EB',
        };

      /*
       * Vendor is driving to customer.
       *
       * Next:
       * arriving → arrived
       */
      case 'arriving':
        return {
          nextStatus: 'arrived' as const,

          label: 'I Have Arrived',

          color: '#7C3AED',
        };

      /*
       * Vendor has arrived.
       *
       * Next:
       * arrived → in_progress
       */
      case 'arrived':
        return {
          nextStatus: 'in_progress' as const,

          label: 'Start Service',

          color: '#2563EB',
        };

      /*
       * Service is running.
       *
       * Next:
       * in_progress → completed
       */
      case 'in_progress':
        return {
          nextStatus: 'completed' as const,

          label: 'Mark Service Completed',

          color: '#16A34A',
        };

      default:
        return null;
    }
  };

  /*
   * ==========================================
   * UPDATE BOOKING STATUS
   * ==========================================
   */

  const handleNextStatus = async () => {
    const config = getStatusButtonConfig();

    if (!config || !bookingId) {
      return;
    }

    const parsedBookingId = parseInt(bookingId, 10);

    if (Number.isNaN(parsedBookingId)) {
      Alert.alert('Error', 'Invalid booking ID.');

      return;
    }

    /*
     * Confirmation message.
     */
    let confirmationMessage = 'Are you sure you want to continue?';

    switch (config.nextStatus) {
      case 'arriving':
        confirmationMessage = 'Confirm that you are leaving to the customer location.';

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

    Alert.alert(config.label, confirmationMessage, [
      {
        text: 'Cancel',
        style: 'cancel',
      },

      {
        text: 'Confirm',

        onPress: async () => {
          try {
            setUpdatingStatus(true);

            console.log(
              `[Job Status] Updating booking ${parsedBookingId} from ${jobStatus} to ${config.nextStatus}`
            );

            const response = await updateJobStatus(
              parsedBookingId,

              config.nextStatus,

              ''
            );

            /*
             * Use the server's status when
             * available.
             */
            const updatedStatus = response.current_status || config.nextStatus;

            console.log('[Job Status] ✅ Server returned:', updatedStatus);

            setJobStatus(updatedStatus);

            /*
             * If completed, stop GPS tracking.
             */
            if (updatedStatus === 'completed') {
              if (locationSubscription.current) {
                locationSubscription.current.remove();

                locationSubscription.current = null;
              }

              setIsTracking(false);

              Alert.alert('Job Completed', 'The job has been completed successfully.', [
                {
                  text: 'OK',

                  onPress: () => {
                    router.replace('/');
                  },
                },
              ]);
            }
          } catch (error: any) {
            console.error('[Job Status] ❌ Status update failed:', error);

            Alert.alert('Update Failed', error?.message || 'Could not update the booking status.');
          } finally {
            setUpdatingStatus(false);
          }
        },
      },
    ]);
  };

  /*
   * ==========================================
   * RECENTER MAP
   * ==========================================
   */

  const handleRecenter = () => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: currentLocation.latitude,

          longitude: currentLocation.longitude,

          latitudeDelta: 0.005,

          longitudeDelta: 0.005,
        },

        800
      );
    }
  };

  /*
   * ==========================================
   * LOADING SCREEN
   * ==========================================
   */

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />

        <Text style={styles.loadingTitle}>Initializing GPS</Text>

        <Text style={styles.loadingSubtitle}>Establishing live tracking connection...</Text>
      </View>
    );
  }

  const buttonConfig = getStatusButtonConfig();

  /*
   * ==========================================
   * MAIN SCREEN
   * ==========================================
   */

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* =====================================
          TOP HEADER
      ====================================== */}

      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>✕</Text>
        </TouchableOpacity>

        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerTitle}>Job #{bookingId || 'Active'}</Text>

          <Text style={styles.headerSubtitle}>
            Status: {jobStatus.replace('_', ' ').toUpperCase()}
          </Text>
        </View>

        {/* Live indicator */}

        <View style={styles.liveIndicator}>
          <View style={[styles.pulseDot, isTracking ? styles.dotGreen : styles.dotRed]} />

          <Text style={styles.liveText}>{isTracking ? 'LIVE' : 'OFF'}</Text>
        </View>
      </View>

      {/* =====================================
          MAP
      ====================================== */}

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
            title="Your Position"
            anchor={{
              x: 0.5,
              y: 0.5,
            }}>
            <View style={styles.markerContainer}>
              <View style={styles.markerHalo} />

              <View style={styles.markerCore}>
                <Text style={styles.markerIcon}>🚗</Text>
              </View>
            </View>
          </Marker>
        </MapView>
      ) : null}

      {/* =====================================
          RECENTER BUTTON
      ====================================== */}

      <TouchableOpacity style={styles.recenterButton} onPress={handleRecenter} activeOpacity={0.8}>
        <Text style={styles.recenterIcon}>🎯</Text>
      </TouchableOpacity>

      {/* =====================================
          BOTTOM CONTROL CARD
      ====================================== */}

      <View style={styles.bottomCard}>
        <View style={styles.dragHandle} />

        {/* Status */}

        <View style={styles.statusRow}>
          <View style={styles.statusInfo}>
            <Text style={styles.statusLabel}>BOOKING STATUS</Text>

            <Text style={styles.statusHeading}>
              {jobStatus === 'accepted'
                ? 'Job Accepted'
                : jobStatus === 'arriving'
                  ? 'En Route to Customer'
                  : jobStatus === 'arrived'
                    ? 'Arrived at Customer'
                    : jobStatus === 'in_progress'
                      ? 'Service In Progress'
                      : jobStatus === 'completed'
                        ? 'Service Completed'
                        : 'Job Active'}
            </Text>
          </View>

          <View style={styles.updatesBadge}>
            <Text style={styles.updatesText}>{updateCount} pings sent</Text>
          </View>
        </View>

        {/* =================================
            GPS METRICS
        ================================== */}

        <View style={styles.metricsRow}>
          {/* Speed */}

          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>
              {currentLocation?.speed ? `${(currentLocation.speed * 3.6).toFixed(0)}` : '0'}
            </Text>

            <Text style={styles.metricLabel}>km/h Speed</Text>
          </View>

          <View style={styles.metricDivider} />

          {/* Accuracy */}

          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>
              {currentLocation?.accuracy ? `±${Math.round(currentLocation.accuracy)}m` : 'N/A'}
            </Text>

            <Text style={styles.metricLabel}>GPS Accuracy</Text>
          </View>

          <View style={styles.metricDivider} />

          {/* Sync */}

          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>5s</Text>

            <Text style={styles.metricLabel}>Sync Rate</Text>
          </View>
        </View>

        {/* =================================
            STATUS ACTION BUTTON
        ================================== */}

        {buttonConfig && (
          <TouchableOpacity
            style={[
              styles.actionButton,

              {
                backgroundColor: buttonConfig.color,
              },
            ]}
            onPress={handleNextStatus}
            disabled={updatingStatus}
            activeOpacity={0.85}>
            {updatingStatus ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.actionButtonText}>{buttonConfig.label}</Text>
            )}
          </TouchableOpacity>
        )}

        {/* Completed message */}

        {jobStatus === 'completed' && (
          <View style={styles.completedContainer}>
            <Text style={styles.completedText}>✓ Service Completed</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

/*
 * ============================================
 * STYLES
 * ============================================
 */

const styles = StyleSheet.create({
  container: {
    flex: 1,

    backgroundColor: '#0F172A',
  },

  loadingContainer: {
    flex: 1,

    justifyContent: 'center',

    alignItems: 'center',

    backgroundColor: '#F8FAFC',
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

  map: {
    flex: 1,
  },

  /*
   * Header
   */

  topHeader: {
    position: 'absolute',

    top: Platform.OS === 'ios' ? 60 : 20,

    left: 16,

    right: 16,

    zIndex: 10,

    backgroundColor: '#FFFFFF',

    borderRadius: 16,

    paddingHorizontal: 16,

    paddingVertical: 12,

    flexDirection: 'row',

    alignItems: 'center',

    shadowColor: '#0F172A',

    shadowOffset: {
      width: 0,
      height: 4,
    },

    shadowOpacity: 0.1,

    shadowRadius: 10,

    elevation: 6,
  },

  backButton: {
    width: 32,

    height: 32,

    borderRadius: 16,

    backgroundColor: '#F1F5F9',

    justifyContent: 'center',

    alignItems: 'center',
  },

  backButtonText: {
    fontSize: 14,

    fontWeight: '700',

    color: '#475569',
  },

  headerTitleGroup: {
    flex: 1,

    marginLeft: 12,
  },

  headerTitle: {
    fontSize: 16,

    fontWeight: '800',

    color: '#0F172A',
  },

  headerSubtitle: {
    fontSize: 11,

    color: '#64748B',

    marginTop: 1,
  },

  /*
   * Live indicator
   */

  liveIndicator: {
    flexDirection: 'row',

    alignItems: 'center',

    backgroundColor: '#F8FAFC',

    paddingHorizontal: 10,

    paddingVertical: 5,

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
    fontSize: 11,

    fontWeight: '800',

    color: '#334155',
  },

  /*
   * Marker
   */

  markerContainer: {
    alignItems: 'center',

    justifyContent: 'center',
  },

  markerHalo: {
    position: 'absolute',

    width: 44,

    height: 44,

    borderRadius: 22,

    backgroundColor: 'rgba(37, 99, 235, 0.2)',
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

  markerIcon: {
    fontSize: 14,
  },

  /*
   * Recenter
   */

  recenterButton: {
    position: 'absolute',

    right: 16,

    bottom: 230,

    width: 46,

    height: 46,

    borderRadius: 23,

    backgroundColor: '#FFFFFF',

    justifyContent: 'center',

    alignItems: 'center',

    shadowColor: '#000',

    shadowOffset: {
      width: 0,
      height: 2,
    },

    shadowOpacity: 0.15,

    shadowRadius: 6,

    elevation: 5,
  },

  recenterIcon: {
    fontSize: 20,
  },

  /*
   * Bottom card
   */

  bottomCard: {
    position: 'absolute',

    left: 12,

    right: 12,

    bottom: 16,

    backgroundColor: '#FFFFFF',

    borderRadius: 24,

    padding: 20,

    shadowColor: '#0F172A',

    shadowOffset: {
      width: 0,
      height: 8,
    },

    shadowOpacity: 0.12,

    shadowRadius: 16,

    elevation: 8,
  },

  dragHandle: {
    width: 36,

    height: 4,

    borderRadius: 2,

    backgroundColor: '#E2E8F0',

    alignSelf: 'center',

    marginBottom: 12,
  },

  /*
   * Status
   */

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

    letterSpacing: 0.5,
  },

  statusHeading: {
    fontSize: 17,

    fontWeight: '800',

    color: '#0F172A',

    marginTop: 2,
  },

  updatesBadge: {
    backgroundColor: '#EFF6FF',

    paddingHorizontal: 10,

    paddingVertical: 4,

    borderRadius: 8,
  },

  updatesText: {
    fontSize: 12,

    fontWeight: '700',

    color: '#2563EB',
  },

  /*
   * Metrics
   */

  metricsRow: {
    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',

    backgroundColor: '#F8FAFC',

    borderRadius: 14,

    paddingVertical: 12,

    paddingHorizontal: 16,

    marginTop: 16,
  },

  metricItem: {
    alignItems: 'center',

    flex: 1,
  },

  metricValue: {
    fontSize: 16,

    fontWeight: '800',

    color: '#0F172A',
  },

  metricLabel: {
    fontSize: 11,

    color: '#64748B',

    marginTop: 2,
  },

  metricDivider: {
    width: 1,

    height: 24,

    backgroundColor: '#E2E8F0',
  },

  /*
   * Action button
   */

  actionButton: {
    marginTop: 16,

    borderRadius: 14,

    paddingVertical: 15,

    alignItems: 'center',

    justifyContent: 'center',

    elevation: 4,
  },

  actionButtonText: {
    color: '#FFFFFF',

    fontSize: 15,

    fontWeight: '800',
  },

  /*
   * Completed
   */

  completedContainer: {
    marginTop: 16,

    paddingVertical: 14,

    borderRadius: 14,

    backgroundColor: '#F0FDF4',

    alignItems: 'center',
  },

  completedText: {
    fontSize: 15,

    fontWeight: '800',

    color: '#16A34A',
  },
});
