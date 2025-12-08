import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet, TextInput, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const Header = ({ onMenuPress, showSearch = true }) => {
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
            <TouchableOpacity style={styles.iconButton}>
              <View style={styles.cartIcon}>
                <View style={styles.cartBody} />
                <View style={styles.cartHandle} />
                <View style={styles.cartWheel1} />
                <View style={styles.cartWheel2} />
              </View>
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
  },
  cartIcon: {
    width: 26,
    height: 22,
    position: 'relative',
  },
  cartBody: {
    position: 'absolute',
    bottom: 4,
    left: 2,
    width: 20,
    height: 14,
    backgroundColor: '#2C3E50',
    borderRadius: 2,
  },
  cartHandle: {
    position: 'absolute',
    top: 0,
    right: 2,
    width: 10,
    height: 8,
    borderWidth: 2,
    borderColor: '#2C3E50',
    borderRadius: 4,
    borderBottomWidth: 0,
  },
  cartWheel1: {
    position: 'absolute',
    bottom: 0,
    left: 5,
    width: 5,
    height: 5,
    backgroundColor: '#2C3E50',
    borderRadius: 3,
  },
  cartWheel2: {
    position: 'absolute',
    bottom: 0,
    right: 5,
    width: 5,
    height: 5,
    backgroundColor: '#2C3E50',
    borderRadius: 3,
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
