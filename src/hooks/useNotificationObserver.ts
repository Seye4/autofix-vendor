import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';

export function useNotificationObserver() {
  useEffect(() => {
    // 1. Handle notifications tapped while app is in background/foreground
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      handleNotificationNavigation(data);
    });

    // 2. Handle cold start (app was completely closed when user tapped notification)
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response?.notification) {
        const data = response.notification.request.content.data;
        handleNotificationNavigation(data);
      }
    });

    return () => subscription.remove();
  }, []);
}

function handleNotificationNavigation(data: any) {
  if (!data?.screen) return;

  switch (data.screen) {
    case 'Chat':
      if (data.conversation_id) {
        router.push({
          pathname: '/Chat',
          params: { conversationId: data.conversation_id },
        });
      }
      break;

    case 'BookingProgress':
      if (data.booking_id) {
        router.push({
          pathname: '/BookingProgress',
          params: { bookingId: data.booking_id },
        });
      }
      break;

    case 'VendorJobOffer':
      if (data.booking_id && data.offer_id) {
        router.push({
          pathname: '/VendorJobOffer',
          params: { bookingId: data.booking_id, offerId: data.offer_id },
        });
      }
      break;

    case 'RateService':
      if (data.booking_id && data.vendor_id) {
        router.push({
          pathname: '/RateService',
          params: { bookingId: data.booking_id, vendorId: data.vendor_id },
        });
      }
      break;
  }
}
