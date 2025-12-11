import React, { useState, useEffect } from 'react';
import { View, Image, TouchableOpacity, StyleSheet, TextInput, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CART_STORAGE_KEY = '@vsk_cart';

const Header = ({ onMenuPress, navigation, showSearch = true }) => {
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    loadCartCount();
    // Set up interval to check cart count periodically
    const interval = setInterval(loadCartCount, 1000);
    return () => clearInterval(interval);
  }, []);

  const loadCartCount = async () => {
    try {
      const cartData = await AsyncStorage.getItem(CART_STORAGE_KEY);
      if (cartData) {
        const items = JSON.parse(cartData);
        const count = items.reduce((total, item) => total + (item.quantity || 1), 0);
        setCartCount(count);
      } else {
        setCartCount(0);
      }
    } catch (error) {
      console.log('Error loading cart count:', error);
    }
  };

  const handleCartPress = () => {
    if (navigation) {
      navigation.navigate('Cart');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.topRow}>
          {/* Hamburger Menu */}
          <TouchableOpacity
            style={styles.menuButton}
            onPress={onMenuPress}
          >
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
          </TouchableOpacity>

          {/* Logo */}
          <Image
            source={require('../../assets/Logos/logo.jpg')}
            style={styles.logo}
            resizeMode="contain"
          />

          {/* Right Icons */}
          <View style={styles.rightIcons}>
            <TouchableOpacity style={styles.cartButton} onPress={handleCartPress}>
              <Text style={styles.cartIconText}>🛒</Text>
              {cartCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartCount > 99 ? '99+' : cartCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <View style={styles.profileIcon}>
                <View style={styles.profileHead} />
                <View style={styles.profileBody} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        {showSearch && (
          <View style={styles.searchContainer}>
            <View style={styles.searchIconContainer}>
              <View style={styles.searchCircle} />
              <View style={styles.searchHandle} />
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder="Search for Items"
              placeholderTextColor="#999"
            />
            <TouchableOpacity style={styles.goButton}>
              <Text style={styles.goText}>Go</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#F0F4F8',
  },
  container: {
    backgroundColor: '#F0F4F8',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  menuButton: {
    width: 28,
    height: 24,
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  menuLine: {
    height: 3,
    backgroundColor: '#2C3E50',
    borderRadius: 2,
  },
  logo: {
    width: 160,
    height: 50,
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cartButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cartIconText: {
    fontSize: 24,
  },
  cartBadge: {
    position: 'absolute',
    top: 0,
    right: -2,
    backgroundColor: '#E74C3C',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  profileIcon: {
    width: 24,
    height: 26,
    alignItems: 'center',
  },
  profileHead: {
    width: 12,
    height: 12,
    backgroundColor: '#2C3E50',
    borderRadius: 6,
  },
  profileBody: {
    width: 20,
    height: 12,
    backgroundColor: '#2C3E50',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    height: 44,
    paddingLeft: 12,
  },
  searchIconContainer: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  searchCircle: {
    width: 14,
    height: 14,
    borderWidth: 2,
    borderColor: '#999',
    borderRadius: 7,
  },
  searchHandle: {
    position: 'absolute',
    bottom: 1,
    right: 3,
    width: 6,
    height: 2,
    backgroundColor: '#999',
    transform: [{ rotate: '45deg' }],
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#2C3E50',
  },
  goButton: {
    backgroundColor: '#2C3E50',
    paddingHorizontal: 20,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 7,
    borderBottomRightRadius: 7,
  },
  goText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default Header;
