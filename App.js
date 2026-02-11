import React, { useState, useEffect, useRef } from 'react';
import { LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  addNotificationResponseListener,
  getLastNotificationResponse,
} from './src/services/notificationService';

import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import OTPVerificationScreen from './src/screens/OTPVerificationScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import HomeScreen from './src/screens/HomeScreen';
import AboutUsScreen from './src/screens/AboutUsScreen';
import ContactUsScreen from './src/screens/ContactUsScreen';
import ProductsScreen from './src/screens/ProductsScreen';
import ProductDetailScreen from './src/screens/ProductDetailScreen';
import CartScreen from './src/screens/CartScreen';
import OrdersScreen from './src/screens/OrdersScreen';
import OrderDetailScreen from './src/screens/OrderDetailScreen';
import GarmentCategoryScreen from './src/screens/GarmentCategoryScreen';
import GarmentProductsScreen from './src/screens/GarmentProductsScreen';
import GarmentProductDetailScreen from './src/screens/GarmentProductDetailScreen';
import WishlistScreen from './src/screens/WishlistScreen';
import FeedbackScreen from './src/screens/FeedbackScreen';
import OffersScreen from './src/screens/OffersScreen';
import OfferDetailScreen from './src/screens/OfferDetailScreen';
import TagProductsScreen from './src/screens/TagProductsScreen';
import MyAccountScreen from './src/screens/MyAccountScreen';
import SearchResultsScreen from './src/screens/SearchResultsScreen';
import LegalPoliciesScreen from './src/screens/LegalPoliciesScreen';
import LatestProductsScreen from './src/screens/LatestProductsScreen';
import TestimonialsScreen from './src/screens/TestimonialsScreen';

LogBox.ignoreLogs(['AsyncStorage', 'Sending']);

const Stack = createNativeStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [initialRoute, setInitialRoute] = useState('Login');
  const [pendingNotification, setPendingNotification] = useState(null);
  const [isNavigationReady, setIsNavigationReady] = useState(false);
  const navigationRef = useRef(null);
  const notificationResponseListener = useRef(null);

  useEffect(() => {
    checkLoginStatus();
    setupNotificationListeners();

    return () => {
      // Cleanup notification listeners
      if (notificationResponseListener.current) {
        notificationResponseListener.current.remove();
      }
    };
  }, []);

  // Handle pending notification after navigation is ready
  useEffect(() => {
    if (pendingNotification && isNavigationReady && navigationRef.current) {
      // Add delay to ensure navigation stack is fully mounted
      setTimeout(() => {
        handleNotificationNavigation(pendingNotification);
        setPendingNotification(null);
      }, 500);
    }
  }, [pendingNotification, isNavigationReady]);

  const setupNotificationListeners = async () => {
    // Check if app was opened from a notification (cold start)
    const lastResponse = await getLastNotificationResponse();
    if (lastResponse) {
      const data = lastResponse.notification.request.content.data;
      console.log('App opened from notification (cold start):', data);
      setPendingNotification(data);
    }

    // Listen for notification taps while app is running (warm start)
    notificationResponseListener.current = addNotificationResponseListener((response) => {
      const data = response.notification.request.content.data;
      console.log('Notification tapped (warm start):', data);
      
      if (isNavigationReady && navigationRef.current) {
        handleNotificationNavigation(data);
      } else {
        setPendingNotification(data);
      }
    });
  };

  const handleNotificationNavigation = (data) => {
    if (!navigationRef.current) {
      console.log('Navigation ref not ready');
      return;
    }

    console.log('Handling notification navigation:', data);

    // Handle order_update notification type (from backend when tracking is added)
    if (data?.type === 'order_update' && data?.order_number) {
      console.log('Navigating to Orders with order:', data.order_number);
      // Navigate to Orders screen with the order number to show tracking modal
      navigationRef.current.navigate('Orders', { 
        openTrackingFor: data.order_number 
      });
    }
  };

  const onNavigationReady = () => {
    setIsNavigationReady(true);
    console.log('Navigation is ready');
  };

  const checkLoginStatus = async () => {
    try {
      // Check if user data exists in AsyncStorage
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        setIsLoggedIn(true);
        setInitialRoute('Home');
      }
    } catch (error) {
      console.log('Error checking login status:', error);
    } finally {
      // Show splash screen for at least 2 seconds
      setTimeout(() => {
        setIsLoading(false);
      }, 2000);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <SplashScreen />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <NavigationContainer ref={navigationRef} onReady={onNavigationReady}>
        <Stack.Navigator
          initialRouteName={initialRoute}
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="AboutUs" component={AboutUsScreen} />
          <Stack.Screen name="ContactUs" component={ContactUsScreen} />
          <Stack.Screen name="Products" component={ProductsScreen} />
          <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
          <Stack.Screen name="Cart" component={CartScreen} />
          <Stack.Screen name="Orders" component={OrdersScreen} />
          <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
          <Stack.Screen name="GarmentCategory" component={GarmentCategoryScreen} />
          <Stack.Screen name="GarmentProducts" component={GarmentProductsScreen} />
          <Stack.Screen name="GarmentProductDetail" component={GarmentProductDetailScreen} />
          <Stack.Screen name="Wishlist" component={WishlistScreen} />
          <Stack.Screen name="Feedback" component={FeedbackScreen} />
          <Stack.Screen name="Offers" component={OffersScreen} />
          <Stack.Screen name="OfferDetail" component={OfferDetailScreen} />
          <Stack.Screen name="TagProducts" component={TagProductsScreen} />
          <Stack.Screen name="Account" component={MyAccountScreen} />
          <Stack.Screen name="SearchResults" component={SearchResultsScreen} />
          <Stack.Screen name="LegalPolicies" component={LegalPoliciesScreen} />
          <Stack.Screen name="LatestProducts" component={LatestProductsScreen} />
          <Stack.Screen name="Testimonials" component={TestimonialsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
