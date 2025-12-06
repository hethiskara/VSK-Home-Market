import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { tokenManager } from '../services/api';

const HomeScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const data = await tokenManager.getUserData();
    setUserData(data);
    console.log('HOME SCREEN - User Data:', data);
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await tokenManager.clearAll();
          navigation.replace('Login');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Image
          source={require('../../assets/Logos/logo.jpg')}
          style={styles.logo}
          resizeMode="contain"
        />
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.welcomeText}>Welcome!</Text>
        {userData && (
          <Text style={styles.userInfo}>
            Mobile: {userData.mobile_no}
          </Text>
        )}
        
        <View style={styles.placeholder}>
          <View style={styles.iconContainer}>
            <Text style={styles.iconText}>VSK</Text>
          </View>
          <Text style={styles.placeholderTitle}>Home Screen</Text>
          <Text style={styles.placeholderSubtitle}>
            Products and categories will be displayed here
          </Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  logo: {
    width: 150,
    height: 50,
  },
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFF5F2',
    borderRadius: 8,
  },
  logoutText: {
    color: '#FF6B35',
    fontWeight: '600',
    fontSize: 14,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 30,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
  },
  userInfo: {
    fontSize: 16,
    color: '#7F8C8D',
    marginBottom: 40,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  placeholderTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 10,
  },
  placeholderSubtitle: {
    fontSize: 15,
    color: '#7F8C8D',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

export default HomeScreen;
