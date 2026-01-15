import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const SplashScreen = () => {
  const insets = useSafeAreaInsets();
  
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={[styles.innerContainer, { paddingBottom: insets.bottom + 20 }]}>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 40,
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
