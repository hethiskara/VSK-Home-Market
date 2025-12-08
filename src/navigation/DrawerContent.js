import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tokenManager } from '../services/api';

const menuItems = [
  { id: 'home', label: 'Home', screen: 'HomeMain' },
  { id: 'pickles', label: 'Pickles', screen: 'Pickles', hasSubmenu: true },
  { id: 'garments', label: 'Garment Products', screen: 'Garments' },
  { id: 'divider1', type: 'divider' },
  { id: 'account', label: 'My Account', screen: 'Account' },
  { id: 'orders', label: 'Order Status', screen: 'Orders' },
  { id: 'logout', label: 'Logout', action: 'logout' },
  { id: 'divider2', type: 'divider' },
  { id: 'about', label: 'About Us', screen: 'About' },
  { id: 'contact', label: 'Contact Us', screen: 'Contact' },
  { id: 'resources', label: 'Resources', screen: 'Resources' },
  { id: 'offers', label: 'View all Offers', screen: 'Offers' },
  { id: 'feedback', label: 'Feedback', screen: 'Feedback' },
];

const DrawerContent = ({ navigation }) => {
  const handleMenuPress = async (item) => {
    if (item.action === 'logout') {
      await tokenManager.clearAll();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } else if (item.screen) {
      navigation.navigate(item.screen);
    }
    navigation.closeDrawer();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Image
          source={require('../../assets/Logos/logo.jpg')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <ScrollView style={styles.menuContainer} showsVerticalScrollIndicator={false}>
        {menuItems.map((item) => {
          if (item.type === 'divider') {
            return <View key={item.id} style={styles.divider} />;
          }

          return (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => handleMenuPress(item)}
              activeOpacity={0.7}
            >
              <Text style={styles.menuLabel}>{item.label}</Text>
              {item.hasSubmenu && (
                <Text style={styles.arrow}>›</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Version 1.0.0</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2C4A6B',
  },
  header: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  logo: {
    width: 160,
    height: 55,
  },
  menuContainer: {
    flex: 1,
    paddingTop: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  menuLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  arrow: {
    fontSize: 24,
    color: '#FFFFFF',
    opacity: 0.6,
  },
  divider: {
    height: 12,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
});

export default DrawerContent;

