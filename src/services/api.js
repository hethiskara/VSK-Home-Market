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

  getBestSellingRegular: async () => {
    const response = await api.get('/best-selling-products-regular');
    console.log('BEST SELLING REGULAR RESPONSE:', response.data);
    return response.data;
  },

  getBestSellingGarments: async () => {
    const response = await api.get('/best-selling-products-garments');
    console.log('BEST SELLING GARMENTS RESPONSE:', response.data);
    return response.data;
  },

  getLatestProductsRegular: async () => {
    const response = await api.get('/latest-products-regular');
    console.log('LATEST PRODUCTS REGULAR RESPONSE:', response.data);
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
  addToCart: async (bcode, userId, prodId, quantity, carttype = 'pathanjali') => {
    const params = `?bcode=${encodeURIComponent(bcode)}&user_id=${userId}&prod_id=${prodId}&quantity=${quantity}&carttype=${encodeURIComponent(carttype)}`;
    const response = await api.get('/my-save-cart-json' + params);
    console.log('ADD TO CART RESPONSE:', response.data);
    return response.data;
  },
};

// Checkout APIs
export const checkoutAPI = {
  // Get user billing address
  getUserData: async (userId) => {
    const response = await api.get(`/user-json?user_id=${userId}`);
    console.log('USER DATA RESPONSE:', response.data);
    return response.data;
  },

  // Step 1: Save delivery address
  saveDeliveryAddress: async (data) => {
    const params = new URLSearchParams({
      user_id: data.user_id,
      guest_id: data.guest_id,
      firstname: data.firstname,
      lastname: data.lastname,
      address: data.address,
      postalcode: data.postalcode,
      city: data.city,
      state: data.state,
      country: data.country,
      mobile_no: data.mobile_no,
    }).toString();
    const response = await api.get(`/my-cart-step-one?${params}`);
    console.log('STEP ONE RESPONSE:', response.data);
    return response.data;
  },

  // Step 2: Get cart summary with calculated totals
  getCartSummary: async (guestId) => {
    const response = await api.get(`/my-cart-step-two?guest_id=${guestId}`);
    console.log('STEP TWO RESPONSE:', response.data);
    return response.data;
  },

  // Step 3: Razorpay payment initiation
  initiatePayment: async (data) => {
    const params = new URLSearchParams({
      billing_name: data.billing_name,
      billing_mobile: data.billing_mobile,
      billing_sc: data.billing_sc || '1',
      billing_ss: data.billing_ss || '0',
      orginalorderid: data.order_id,
      payAmount: data.amount,
    }).toString();
    const response = await api.get(`/my-cart-step-three?${params}`);
    console.log('STEP THREE RESPONSE:', response.data);
    return response.data;
  },
};

// Order APIs
export const orderAPI = {
  // Get all orders for a user
  getOrders: async (userId) => {
    const response = await api.get(`/my-orders?userid=${userId}`);
    console.log('ORDERS RESPONSE:', response.data);
    return response.data;
  },

  // Get order details by order number
  getOrderDetails: async (orderNumber) => {
    const response = await api.get(`/my-order-separate?ordnum=${encodeURIComponent(orderNumber)}`);
    console.log('ORDER DETAILS RESPONSE:', response.data);
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
