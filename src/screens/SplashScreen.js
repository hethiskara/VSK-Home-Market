import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';

const SplashScreen = () => {
  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={require('../../assets/Logos/app-icon.jpg')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.subtitle}>Authentic Andhra Homemade Pickles</Text>
      </View>
      
      <View style={styles.footer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 80,
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logo: {
    width: 200,
    height: 180,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  footer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#7F8C8D',
  },
});

export default SplashScreen;
