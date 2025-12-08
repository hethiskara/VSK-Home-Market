import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tokenManager } from '../services/api';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.8;

const menuItems = [
  { id: 'home', label: 'Home', screen: 'Home' },
  { id: 'pickles', label: 'Pickles', screen: 'Products', params: { sectionId: '26', sectionTitle: 'Pickles' } },
  { id: 'garments', label: 'Garment Products', screen: 'Products', params: { sectionId: '27', sectionTitle: 'Garment Products' } },
  { id: 'divider1', type: 'divider' },
  { id: 'account', label: 'My Account', screen: 'Account' },
  { id: 'orders', label: 'Order Status', screen: 'Orders' },
  { id: 'logout', label: 'Logout', action: 'logout' },
  { id: 'divider2', type: 'divider' },
  { id: 'about', label: 'About Us', screen: 'AboutUs' },
  { id: 'contact', label: 'Contact Us', screen: 'ContactUs' },
  { id: 'resources', label: 'Resources', screen: 'Resources' },
  { id: 'offers', label: 'View all Offers', screen: 'Offers' },
  { id: 'feedback', label: 'Feedback', screen: 'Feedback' },
];

const Drawer = ({ visible, onClose, navigation }) => {
  const handleMenuPress = async (item) => {
    onClose();
    
    if (item.action === 'logout') {
      await tokenManager.clearAll();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } else if (item.screen === 'Home') {
      // Already on home, just close drawer
    } else if (item.screen === 'Products') {
      navigation.navigate('Products', item.params);
    } else if (item.screen === 'AboutUs' || item.screen === 'ContactUs') {
      navigation.navigate(item.screen);
    } else {
      // Coming soon screens
      console.log('Navigate to:', item.screen);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={onClose}
        />
        <View style={styles.drawer}>
          <SafeAreaView style={styles.container} edges={['top']}>
            {/* Close Button */}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeIcon}>×</Text>
            </TouchableOpacity>

            {/* Logo */}
            <View style={styles.header}>
              <Image
                source={require('../../assets/Logos/logo.jpg')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            {/* Menu Items */}
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
                    {(item.screen === 'Products' || item.params) && (
                      <Text style={styles.arrow}>›</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Version 1.0.0</Text>
            </View>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  drawer: {
    width: DRAWER_WIDTH,
    backgroundColor: '#2C4A6B',
    height: '100%',
  },
  container: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 16,
    zIndex: 10,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: '300',
  },
  header: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    paddingTop: 60,
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

export default Drawer;
