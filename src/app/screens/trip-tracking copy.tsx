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
import { updateVendorLocation, LocationCoords } from '@/api/vendor';

export default function VendorJobScreen() {
  const router = useRouter();
  const { id: bookingId } = useLocalSearchParams<{ id: string }>();

  const mapRef = useRef<MapView | null>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  const [currentLocation, setCurrentLocation] = useState<LocationCoords | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [updateCount, setUpdateCount] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    console.log(`[VendorJobScreen] 🚀 Mounting tracking screen for bookingId: ${bookingId}`);

    async function setupTracking() {
      try {
        // 1. Request foreground permissions
        console.log('[GPS Setup] 1️⃣ Requesting location permissions...');
        const { status } = await Location.requestForegroundPermissionsAsync();
        console.log(`[GPS Setup] Permission status: ${status}`);

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

        // 2. Initial position acquisition
        console.log('[GPS Setup] 2️⃣ Fetching initial position...');
        const initialLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const initialCoords: LocationCoords = {
          latitude: initialLocation.coords.latitude,
          longitude: initialLocation.coords.longitude,
          heading: initialLocation.coords.heading ?? undefined,
          speed: initialLocation.coords.speed ?? undefined,
          accuracy: initialLocation.coords.accuracy ?? undefined,
        };

        console.log('[GPS Setup] 📍 Initial coordinates obtained:', initialCoords);

        if (!isMounted) return;

        setCurrentLocation(initialCoords);
        setLoading(false);

        // Send initial location
        sendLocationToBackend(initialCoords);

        // 3. Optimized position watching
        console.log('[GPS Setup] 3️⃣ Starting watchPositionAsync loop...');
        locationSubscription.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            distanceInterval: 10, // Updates when moving > 10m
            timeInterval: 5000, // Updates at most every 5 seconds
          },
          (locationData) => {
            if (!isMounted) return;

            const updatedCoords: LocationCoords = {
              latitude: locationData.coords.latitude,
              longitude: locationData.coords.longitude,
              heading: locationData.coords.heading ?? undefined,
              speed: locationData.coords.speed ?? undefined,
              accuracy: locationData.coords.accuracy ?? undefined,
            };

            console.log('[GPS Loop] 🛰️ New location ping received:', updatedCoords);

            setCurrentLocation(updatedCoords);
            setUpdateCount((prev) => {
              const newCount = prev + 1;
              console.log(`[GPS Loop] 📊 Total pings sent: ${newCount}`);
              return newCount;
            });

            sendLocationToBackend(updatedCoords);

            // Smoothly animate map camera to follow vendor
            if (mapRef.current) {
              console.log('[Map] 🎥 Animating camera to updated position');
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
                { duration: 1000 }
              );
            }
          }
        );

        setIsTracking(true);
        console.log('[GPS Setup] ✅ Live tracking loop successfully established');
      } catch (error) {
        console.error('[GPS Setup] 💥 Error initializing location tracking:', error);
        if (isMounted) setLoading(false);
      }
    }

    setupTracking();

    return () => {
      console.log('[VendorJobScreen] 🧹 Unmounting screen. Cleaning up location listeners...');
      isMounted = false;
      if (locationSubscription.current) {
        locationSubscription.current.remove();
        locationSubscription.current = null;
        console.log('[VendorJobScreen] 🛑 Location subscription successfully removed');
      }
    };
  }, [bookingId]);

  async function sendLocationToBackend(coords: LocationCoords) {
    const payload = {
      ...coords,
      booking_id: bookingId ? parseInt(bookingId, 10) : undefined,
    };

    console.log('[API] 📤 Sending payload via updateVendorLocation:', payload);

    try {
      const response = await updateVendorLocation(payload);
      console.log('[API] ✅ Location update response:', response);
    } catch (error) {
      console.error('[API] ❌ Failed to push location via updateVendorLocation:', error);
    }
  }

  const handleRecenter = () => {
    console.log('[Map UI] 🎯 Recenter button pressed');
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
    } else {
      console.warn('[Map UI] Recenter failed: currentLocation or mapRef missing');
    }
  };

  const handleCompleteJob = () => {
    console.log('[Job Action] 🏁 Complete Job button pressed');
    Alert.alert('Complete Job', 'Are you sure you have arrived and completed the service?', [
      {
        text: 'Cancel',
        style: 'cancel',
        onPress: () => console.log('[Job Action] Job completion canceled'),
      },
      {
        text: 'Yes, Complete',
        style: 'default',
        onPress: () => {
          console.log('[Job Action] Job completed. Navigating to home screen...');
          router.replace('/');
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingTitle}>Initializing GPS</Text>
        <Text style={styles.loadingSubtitle}>Establishing live tracking connection...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Top Header Floating Card */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>✕</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerTitle}>Job #{bookingId || 'Active'}</Text>
          <Text style={styles.headerSubtitle}>Live Location Sharing Active</Text>
        </View>
        <View style={styles.liveIndicator}>
          <View style={[styles.pulseDot, isTracking ? styles.dotGreen : styles.dotRed]} />
          <Text style={styles.liveText}>{isTracking ? 'LIVE' : 'OFF'}</Text>
        </View>
      </View>

      {/* Map View */}
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
            anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.markerContainer}>
              <View style={styles.markerHalo} />
              <View style={styles.markerCore}>
                <Text style={styles.markerIcon}>🚗</Text>
              </View>
            </View>
          </Marker>
        </MapView>
      ) : null}

      {/* Recenter Map Button */}
      <TouchableOpacity style={styles.recenterButton} onPress={handleRecenter} activeOpacity={0.8}>
        <Text style={styles.recenterIcon}>🎯</Text>
      </TouchableOpacity>

      {/* Bottom Floating Control Card */}
      <View style={styles.bottomCard}>
        <View style={styles.dragHandle} />

        <View style={styles.statusRow}>
          <View style={styles.statusInfo}>
            <Text style={styles.statusLabel}>TRACKING STATUS</Text>
            <Text style={styles.statusHeading}>
              {isTracking ? 'En Route to Customer' : 'Tracking Suspended'}
            </Text>
          </View>
          <View style={styles.updatesBadge}>
            <Text style={styles.updatesText}>{updateCount} pings sent</Text>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>
              {currentLocation?.speed ? `${(currentLocation.speed * 3.6).toFixed(0)}` : '0'}
            </Text>
            <Text style={styles.metricLabel}>km/h Speed</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>
              {currentLocation?.accuracy ? `±${Math.round(currentLocation.accuracy)}m` : 'N/A'}
            </Text>
            <Text style={styles.metricLabel}>GPS Accuracy</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>5s</Text>
            <Text style={styles.metricLabel}>Sync Rate</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleCompleteJob}
          activeOpacity={0.85}>
          <Text style={styles.actionButtonText}>Mark Service Completed</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

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
    shadowOffset: { width: 0, height: 4 },
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  recenterIcon: {
    fontSize: 20,
  },
  bottomCard: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
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
  actionButton: {
    marginTop: 16,
    backgroundColor: '#16A34A',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});

/* 
<MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          customMapStyle={mapStyle}
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
            anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.markerContainer}>
              <View style={styles.markerHalo} />
              <View style={styles.markerCore}>
                <Text style={styles.markerIcon}>🚗</Text>
              </View>
            </View>
          </Marker>
        </MapView>
*/
