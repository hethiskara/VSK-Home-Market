import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const BASE_URL = 'https://www.vskhomemarket.com';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Check if running on web (CORS will block requests)
export const isWebPlatform = Platform.OS === 'web';

// Auth APIs
export const authAPI = {
  register: async (data) => {
    const response = await api.post('/register-json', {
      name: data.name,
      email: data.email,
      mobile: data.mobile,
      password: data.password,
    });
    return response.data;
  },

  verifyOTP: async (data) => {
    const response = await api.post('/register-otp-json', {
      id: data.id,
      otp: data.otp,
    });
    return response.data;
  },

  login: async (data) => {
    const response = await api.post('/login-json', {
      mobile: data.mobile,
      password: data.password,
    });
    return response.data;
  },
};

// Token management
export const tokenManager = {
  setToken: async (token) => {
    await AsyncStorage.setItem('authToken', token);
  },

  getToken: async () => {
    return await AsyncStorage.getItem('authToken');
  },

  removeToken: async () => {
    await AsyncStorage.removeItem('authToken');
  },

  setUserData: async (userData) => {
    await AsyncStorage.setItem('userData', JSON.stringify(userData));
  },

  getUserData: async () => {
    const data = await AsyncStorage.getItem('userData');
    return data ? JSON.parse(data) : null;
  },

  clearAll: async () => {
    await AsyncStorage.multiRemove(['authToken', 'userData']);
  },
};

export default api;

