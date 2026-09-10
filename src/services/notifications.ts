import * as Notifications from 'expo-notifications';

import * as Device from 'expo-device';
import Constants from 'expo-constants';

import { Platform } from 'react-native';

import { apiRequest } from '../api/client';

/*
|--------------------------------------------------------------------------
| Configure foreground notifications
|--------------------------------------------------------------------------
*/

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,

    shouldPlaySound: true,

    shouldSetBadge: true,

    shouldShowBanner: true,

    shouldShowList: true,
  }),
});

/*
|--------------------------------------------------------------------------
| Register device
|--------------------------------------------------------------------------
*/

export async function registerForPushNotifications(token: string) {
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device.');

    return null;
  }

  const permissions = await Notifications.getPermissionsAsync();

  let finalStatus = permissions.status;

  if (finalStatus !== Notifications.PermissionStatus.GRANTED) {
    const request = await Notifications.requestPermissionsAsync();

    finalStatus = request.status;
  }

  if (finalStatus !== Notifications.PermissionStatus.GRANTED) {
    console.log('Push notification permission denied.');

    return null;
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) {
    console.warn('Push registration requires a linked EAS project.');
    return null;
  }

  const pushToken = await Notifications.getExpoPushTokenAsync({
    projectId,
  });

  await apiRequest('?path=devices/register', {
    method: 'POST',
    token,
    body: {
      expo_push_token: pushToken.data,
      platform: Platform.OS,
      device_name: Device.deviceName,
    },
  });

  return pushToken.data;
}
