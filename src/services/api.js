import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://www.vskhomemarket.com';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Accept': 'application/json',
  },
});

// Convert object to form data string
const toFormData = (obj) => {
  return Object.keys(obj)
    .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]))
    .join('&');
};

// Auth APIs
export const authAPI = {
  register: async (data) => {
    const formData = toFormData({
      mobile_no: data.mobile_no,
      firstname: data.firstname,
      lastname: data.lastname,
      password: data.password,
      state: data.state,
      city: data.city,
      postalcode: data.postalcode,
      address: data.address,
    });
    const response = await api.post('/register-json', formData);
    return response.data;
  },

  verifyOTP: async (data) => {
    const formData = toFormData({
      id: data.id,
      otp: data.otp,
    });
    const response = await api.post('/register-otp-json', formData);
    return response.data;
  },

  login: async (data) => {
    const formData = toFormData({
      mobile_no: data.mobile_no,
      password: data.password,
    });
    const response = await api.post('/login-json', formData);
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
