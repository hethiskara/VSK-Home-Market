import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const FCM_TOKEN_KEY = '@fcm_token';

/**
 * Register for push notifications and get the native FCM token
 * @returns {Promise<string|null>} The FCM token or null if registration fails
 */
export async function registerForPushNotifications() {
  let token = null;

  // Check if it's a physical device (notifications don't work on simulators)
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  try {
    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not already granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission not granted');
      return null;
    }

    // Configure Android notification channel FIRST (required for Android 8+)
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('order-updates', {
        name: 'Order Updates',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2C4A6B',
        sound: 'default',
      });
    }

    // Get the NATIVE device push token (FCM token for Android, APNs token for iOS)
    // This is what Firebase needs to send notifications directly
    const tokenData = await Notifications.getDevicePushTokenAsync();
    token = tokenData.data;
    console.log('Native FCM Token:', token);
    console.log('Token type:', tokenData.type); // Should be 'fcm' for Android

    // Store token locally
    await AsyncStorage.setItem(FCM_TOKEN_KEY, token);

    return token;
  } catch (error) {
    console.log('Error registering for push notifications:', error);
    return null;
  }
}

/**
 * Save FCM token to backend
 * @param {string} userId - The user's ID
 * @param {string} token - The FCM token
 * @returns {Promise<boolean>} Success status
 */
export async function saveFCMTokenToBackend(userId, token) {
  if (!userId || !token) {
    console.log('Missing userId or token for FCM registration');
    return false;
  }

  try {
    const deviceType = Platform.OS; // 'android' or 'ios'
    
    const response = await api.get('/save-fcm-token-json', {
      params: {
        user_id: userId,
        fcm_token: token,
        device_type: deviceType,
      },
    });

    console.log('FCM Token saved to backend:', response.data);
    return response.data?.status === true;
  } catch (error) {
    console.log('Error saving FCM token to backend:', error);
    return false;
  }
}

/**
 * Register device and save token to backend
 * Call this after user logs in
 * @param {string} userId - The logged-in user's ID
 */
export async function initializePushNotifications(userId) {
  try {
    // Get or register for push token
    const token = await registerForPushNotifications();
    
    if (token && userId) {
      // Save to backend
      await saveFCMTokenToBackend(userId, token);
    }
    
    return token;
  } catch (error) {
    console.log('Error initializing push notifications:', error);
    return null;
  }
}

/**
 * Get stored FCM token
 * @returns {Promise<string|null>}
 */
export async function getStoredFCMToken() {
  try {
    return await AsyncStorage.getItem(FCM_TOKEN_KEY);
  } catch (error) {
    console.log('Error getting stored FCM token:', error);
    return null;
  }
}

/**
 * Add listener for notification received while app is in foreground
 * @param {Function} callback - Function to call when notification is received
 * @returns {Object} Subscription object (call .remove() to unsubscribe)
 */
export function addNotificationReceivedListener(callback) {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Add listener for when user taps on a notification
 * @param {Function} callback - Function to call when notification is tapped
 * @returns {Object} Subscription object (call .remove() to unsubscribe)
 */
export function addNotificationResponseListener(callback) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * Get the last notification response (if app was opened from a notification)
 * @returns {Promise<Object|null>}
 */
export async function getLastNotificationResponse() {
  return await Notifications.getLastNotificationResponseAsync();
}

export default {
  registerForPushNotifications,
  saveFCMTokenToBackend,
  initializePushNotifications,
  getStoredFCMToken,
  addNotificationReceivedListener,
  addNotificationResponseListener,
  getLastNotificationResponse,
};
