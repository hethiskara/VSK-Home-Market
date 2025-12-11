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
    console.log('REGISTER RESPONSE:', response.data);
    console.log('OTP:', response.data?.otp || response.data?.[0]?.otp);
    return response.data;
  },

  verifyOTP: async (data) => {
    const formData = toFormData({
      id: data.id,
      otp: data.otp,
    });
    const response = await api.post('/register-otp-json', formData);
    console.log('VERIFY OTP RESPONSE:', response.data);
    return response.data;
  },

  login: async (data) => {
    const params = `?mobile_no=${encodeURIComponent(data.mobile_no)}&password=${encodeURIComponent(data.password)}`;
    const response = await api.get('/login-json' + params);
    console.log('LOGIN RESPONSE:', response.data);
    return response.data;
  },

  forgotPassword: async (data) => {
    const params = `?mobile_no=${encodeURIComponent(data.mobile_no)}`;
    const response = await api.get('/forgot-password-json' + params);
    console.log('FORGOT PASSWORD RESPONSE:', response.data);
    return response.data;
  },
};

// Home APIs
export const homeAPI = {
  getBanners: async () => {
    const response = await api.get('/banner-json');
    console.log('BANNERS RESPONSE:', response.data);
    return response.data;
  },

  getTopSellersRegular: async () => {
    const response = await api.get('/top-sellers-of-the-day-regular');
    console.log('TOP SELLERS REGULAR RESPONSE:', response.data);
    return response.data;
  },

  getTopSellersGarments: async () => {
    const response = await api.get('/top-sellers-of-the-day-garments');
    console.log('TOP SELLERS GARMENTS RESPONSE:', response.data);
    return response.data;
  },

  getFeaturedRegular: async () => {
    const response = await api.get('/feature-products-of-the-day-regular');
    console.log('FEATURED REGULAR RESPONSE:', response.data);
    return response.data;
  },

  getFeaturedGarments: async () => {
    const response = await api.get('/feature-products-of-the-day-garments');
    console.log('FEATURED GARMENTS RESPONSE:', response.data);
    return response.data;
  },
};

// Content APIs
export const contentAPI = {
  getAboutUs: async () => {
    const response = await api.get('/aboutus-json');
    console.log('ABOUT US RESPONSE:', response.data);
    return response.data;
  },

  getContactUs: async () => {
    const response = await api.get('/contactus-json');
    console.log('CONTACT US RESPONSE:', response.data);
    return response.data;
  },
};

// Product APIs
export const productAPI = {
  // Get all product sections (e.g., Pickles, Garments)
  getSections: async () => {
    const response = await api.get('/regularproducts');
    console.log('PRODUCT SECTIONS RESPONSE:', response.data);
    return response.data;
  },

  // Get categories within a section
  getCategories: async (sectionId) => {
    const response = await api.get(`/category-detail?section_id=${sectionId}`);
    console.log('CATEGORIES RESPONSE:', response.data);
    return response.data;
  },

  // Get subcategories within a category
  getSubcategories: async (sectionId, categoryId) => {
    const response = await api.get(`/subcategory-detail?section_id=${sectionId}&category_id=${categoryId}`);
    console.log('SUBCATEGORIES RESPONSE:', response.data);
    return response.data;
  },

  // Get products within a subcategory
  getProducts: async (sectionId, categoryId, subcategoryId) => {
    const response = await api.get(`/moreproduct-detail?section_id=${sectionId}&category_id=${categoryId}&subcategory_id=${subcategoryId}`);
    console.log('PRODUCTS RESPONSE:', response.data);
    return response.data;
  },

  // Get all products in a section (e.g., all pickles)
  getAllProductsBySection: async (sectionId) => {
    const response = await api.get(`/regular-category-allproducts?section_id=${sectionId}`);
    console.log('ALL PRODUCTS BY SECTION RESPONSE:', response.data);
    return response.data;
  },

  // Get product details by product code
  getProductDetails: async (productCode) => {
    const response = await api.get(`/regular-product-details?product_code=${productCode}`);
    console.log('PRODUCT DETAILS RESPONSE:', response.data);
    return response.data;
  },
};

// Cart APIs
export const cartAPI = {
  // Add item to cart
  // bcode = barcode (e.g., W2SA31-53-26)
  // user_id = logged in user's ID
  // prod_id = product ID
  // quantity = quantity to add
  // carttype = product type (e.g., pathanjali, regular)
  addToCart: async (bcode, userId, prodId, quantity, carttype = 'pathanjali') => {
    const params = `?bcode=${encodeURIComponent(bcode)}&user_id=${userId}&prod_id=${prodId}&quantity=${quantity}&carttype=${encodeURIComponent(carttype)}`;
    const response = await api.get('/my-save-cart-json' + params);
    console.log('ADD TO CART RESPONSE:', response.data);
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
