import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { apiRequest } from '@/api/client';

/**
 * Interface representing expected backend API response format.
 */
interface ApiResponse {
  success: boolean;
  message?: string;
  data?: unknown;
}

/*
 * Decide what happens when a notification
 * arrives while the application is open.
 */
Notifications.setNotificationHandler({
  handleNotification: async (): Promise<Notifications.NotificationBehavior> => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/*
 * Register the physical device with Expo.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  /*
   * Push notifications require a physical
   * device for normal production testing.
   */
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device.');
    return null;
  }

  /*
   * Android notification channel.
   */
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2563EB',
    });
  }

  /*
   * Check existing permission.
   */
  const { status: existingStatus } = await Notifications.getPermissionsAsync();

  let finalStatus = existingStatus;

  /*
   * Ask the user if necessary.
   */
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Notification permission was not granted.');
    return null;
  }

  /*
   * EAS project ID.
   *
   * This should be present in app.json/
   * app.config.js after EAS configuration.
   */
  const projectId: string | undefined =
    Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;

  if (!projectId) {
    throw new Error('Expo EAS project ID is missing.');
  }

  const tokenResponse: Notifications.ExpoPushToken = await Notifications.getExpoPushTokenAsync({
    projectId,
  });

  const pushToken: string = tokenResponse.data;

  return pushToken;
}

/*
 * Send the Expo token to PHP.
 */
export async function registerPushToken(): Promise<string | null> {
  const pushToken = await registerForPushNotifications();

  if (!pushToken) {
    return null;
  }

  const data = await apiRequest<ApiResponse>('/notifications/register-token.php', {
    method: 'POST',
    body: {
      expo_push_token: pushToken,
      device_type: Platform.OS,
      app_version: Constants.expoConfig?.version ?? null,
    },
  });
  if (!data.success) {
    throw new Error(data.message || 'Unable to register push token.');
  }

  return pushToken;
}
