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

  getLatestProductsGarments: async () => {
    const response = await api.get('/latest-products-garments');
    console.log('LATEST PRODUCTS GARMENTS RESPONSE:', response.data);
    return response.data;
  },

  getTestimonials: async () => {
    const response = await api.get('/testimonial-json');
    console.log('TESTIMONIALS RESPONSE:', response.data);
    return response.data;
  },

  getAdvertisement: async () => {
    const response = await api.get('/advertisement-json');
    console.log('ADVERTISEMENT RESPONSE:', response.data);
    return response.data;
  },
};

// App Review API
export const appReviewAPI = {
  submitReview: async (data) => {
    const params = `user_id=${data.user_id}&name=${encodeURIComponent(data.name)}&email=${encodeURIComponent(data.email || '')}&mobile_no=${data.mobile_no}&ratings=${data.ratings}&review=${encodeURIComponent(data.review)}`;
    const response = await api.get(`/app-rating-json?${params}`);
    console.log('APP REVIEW RESPONSE:', response.data);
    return response.data;
  },
};

// Feedback API
export const feedbackAPI = {
  submitFeedback: async (data) => {
    const params = `feedback_name=${encodeURIComponent(data.name)}&feedback_email=${encodeURIComponent(data.email)}&feedback_phone=${data.phone}&feedback_country=${encodeURIComponent(data.country)}&feedback_state=${encodeURIComponent(data.state)}&feedback_city=${encodeURIComponent(data.city)}&feedback_address=${encodeURIComponent(data.address)}&customer_feedback=${encodeURIComponent(data.feedback)}`;
    const response = await api.get(`/feedback-json?${params}`);
    console.log('FEEDBACK RESPONSE:', response.data);
    return response.data;
  },
};

// Subscribe API
export const subscribeAPI = {
  // Step 1: Send name and mobile to get OTP (POST method)
  subscribe: async (name, mobileNo) => {
    const response = await api.post(`/subscribe-json?name=${encodeURIComponent(name)}&mobile_no=${mobileNo}`);
    console.log('SUBSCRIBE RESPONSE:', response.data);
    return response.data;
  },

  // Step 2: Verify OTP (GET method)
  verifyOTP: async (id, otp) => {
    const response = await api.get(`/subscribe-otp-json?id=${id}&otp=${otp}`);
    console.log('SUBSCRIBE OTP RESPONSE:', response.data);
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

// Offers API
export const offersAPI = {
  // Get all offer categories
  getAllOffers: async () => {
    const response = await api.get('/viewalloffers-json');
    console.log('ALL OFFERS RESPONSE:', response.data);
    return response.data;
  },

  // Get regular products for an offer
  getRegularOfferDetails: async (discountId) => {
    const response = await api.get(`/viewallofferdetails-json?discount_id=${discountId}`);
    console.log('REGULAR OFFER DETAILS RESPONSE:', response.data);
    return response.data;
  },

  // Get garment products for an offer
  getGarmentOfferDetails: async (discountId) => {
    const response = await api.get(`/garmentviewallofferdetails-json?discount_id=${discountId}`);
    console.log('GARMENT OFFER DETAILS RESPONSE:', response.data);
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

// Garment APIs
export const garmentAPI = {
  // Get garment sections (e.g., "Garment Products")
  getSections: async () => {
    const response = await api.get('/garmentproductsection');
    console.log('GARMENT SECTIONS RESPONSE:', response.data);
    return response.data;
  },

  // Get garment categories (Women, Mens)
  getCategories: async () => {
    const response = await api.get('/garment-category-detail');
    console.log('GARMENT CATEGORIES RESPONSE:', response.data);
    return response.data;
  },

  // Get subcategories within a category (Sarees, Chudidhar, T-shirt)
  getSubcategories: async (categoryId) => {
    const response = await api.get(`/garment-subcategory-detail?category_id=${categoryId}`);
    console.log('GARMENT SUBCATEGORIES RESPONSE:', response.data);
    return response.data;
  },

  // Get product types within a subcategory (Silk Saree, Cotton Saree, etc.)
  getProductTypes: async (sectionId, categoryId) => {
    const response = await api.get(`/garmentsection-subcategory-detail?section_id=${sectionId}&category_id=${categoryId}`);
    console.log('GARMENT PRODUCT TYPES RESPONSE:', response.data);
    return response.data;
  },

  // Get garment products by subcategory
  getProducts: async (sectionId, categoryId, subcategoryId) => {
    const response = await api.get(`/garmentmoreproduct-details?section_id=${sectionId}&category_id=${categoryId}&subcategory_id=${subcategoryId}`);
    console.log('GARMENT PRODUCTS RESPONSE:', response.data);
    return response.data;
  },

  // Get garment product details
  getProductDetails: async (productCode) => {
    const response = await api.get(`/garment-product-details?product_code=${encodeURIComponent(productCode)}`);
    console.log('GARMENT PRODUCT DETAILS RESPONSE:', response.data);
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

  // Delete item from cart
  deleteFromCart: async (cartId) => {
    // Backend expects id as query parameter
    const response = await api.post(`/cart-delete-json?id=${cartId}`);
    console.log('DELETE CART RESPONSE:', response.data);
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
    const url = `/my-cart-step-one?${params}`;
    console.log('STEP ONE URL:', url);
    const response = await api.get(url);
    console.log('STEP ONE RESPONSE:', response.data);
    return response.data;
  },

  // Step 2: Get cart summary with calculated totals
  getCartSummary: async (guestId) => {
    const response = await api.get(`/my-cart-step-two?guest_id=${guestId}`);
    console.log('STEP TWO RESPONSE:', response.data);
    return response.data;
  },

  // Step 3: Razorpay payment initiation (POST request)
  initiatePayment: async (data) => {
    const formData = `billing_name=${encodeURIComponent(data.billing_name)}&billing_mobile=${encodeURIComponent(data.billing_mobile)}&billing_sc=${data.billing_sc || '1'}&billing_ss=${data.billing_ss || '0'}&orginalorderid=${encodeURIComponent(data.order_id)}&payAmount=${data.amount}`;
    
    console.log('RAZORPAY REQUEST:', formData);
    const response = await api.post('/submitpayment_android', formData);
    console.log('RAZORPAY INIT RESPONSE:', response.data);
    return response.data;
  },

  // Step 4: Razorpay payment verification (POST request)
  verifyPayment: async (data) => {
    const formData = `razorpay_payment_id=${encodeURIComponent(data.razorpay_payment_id)}&razorpay_order_id=${encodeURIComponent(data.razorpay_order_id)}&razorpay_signature=${encodeURIComponent(data.razorpay_signature)}&orginalorderid=${encodeURIComponent(data.orginalorderid)}`;
    
    console.log('VERIFY REQUEST:', formData);
    const response = await api.post('/payment_success_android', formData);
    console.log('PAYMENT VERIFY RESPONSE:', response.data);
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

  // Cancel regular product order
  cancelRegularOrder: async (data) => {
    const params = `order_number=${encodeURIComponent(data.orderNumber)}&user_id=${data.userId}&product_code=${encodeURIComponent(data.productCode)}&product_id=${data.productId}&product_name=${encodeURIComponent(data.productName)}&ordered_quantity=${data.orderedQuantity}&cancel_quantity=${data.cancelQuantity}&cancellation_reason=${encodeURIComponent(data.reason)}`;
    const response = await api.get(`/regularordercancel-json?${params}`);
    console.log('CANCEL REGULAR ORDER RESPONSE:', response.data);
    return response.data;
  },

  // Cancel garment product order
  cancelGarmentOrder: async (data) => {
    const params = `order_number=${encodeURIComponent(data.orderNumber)}&user_id=${data.userId}&product_code=${encodeURIComponent(data.productCode)}&product_id=${data.productId}&product_name=${encodeURIComponent(data.productName)}&ordered_quantity=${data.orderedQuantity}&cancel_quantity=${data.cancelQuantity}&cancellation_reason=${encodeURIComponent(data.reason)}`;
    const response = await api.get(`/garmentordercancel-json?${params}`);
    console.log('CANCEL GARMENT ORDER RESPONSE:', response.data);
    return response.data;
  },
};

// Wishlist APIs
export const wishlistAPI = {
  // Get user's wishlist
  getWishlist: async (userId) => {
    const response = await api.get(`/my-wishlist-json?userid=${userId}`);
    console.log('WISHLIST RESPONSE:', response.data);
    return response.data;
  },

  // Add product to wishlist (for regular products)
  addToWishlist: async (data) => {
    // Build query string manually to match expected format
    const params = `user_id=${data.user_id}&product_id=${data.product_id}&category_id=${data.category_id}&subcategory_id=${data.subcategory_id}&product_name=${encodeURIComponent(data.product_name)}&color=${data.color || '53'}&size=${encodeURIComponent(data.size || '')}&barcode=${data.barcode}&quantity=${data.quantity || '1'}&original_price=${data.original_price}&product_price=${data.product_price}`;
    console.log('WISHLIST REQUEST:', `/wishlistsavejson?${params}`);
    const response = await api.get(`/wishlistsavejson?${params}`);
    console.log('ADD TO WISHLIST RESPONSE:', response.data);
    return response.data;
  },

  // Add garment product to wishlist
  addGarmentToWishlist: async (data) => {
    const params = `user_id=${data.user_id}&product_id=${data.product_id}&category_id=${data.category_id}&subcategory_id=${data.subcategory_id}&product_name=${encodeURIComponent(data.product_name)}&color=${data.color || '53'}&size=${encodeURIComponent(data.size || 'Regular')}&barcode=${data.barcode}&quantity=${data.quantity || '1'}&original_price=${data.original_price}&product_price=${data.product_price}`;
    console.log('GARMENT WISHLIST REQUEST:', `/garmentwishlistsavejson?${params}`);
    const response = await api.get(`/garmentwishlistsavejson?${params}`);
    console.log('ADD GARMENT TO WISHLIST RESPONSE:', response.data);
    return response.data;
  },

  // Delete item from wishlist
  deleteFromWishlist: async (wishlistId) => {
    const response = await api.post(`/wish-delete-json?id=${wishlistId}`);
    console.log('DELETE WISHLIST RESPONSE:', response.data);
    return response.data;
  },
};

// Review APIs
export const reviewAPI = {
  // Get product reviews
  getReviews: async (productCode) => {
    const response = await api.get(`/product-rate-reviews?product_code=${encodeURIComponent(productCode)}`);
    console.log('REVIEWS RESPONSE:', response.data);
    return response.data;
  },

  // Submit product review
  submitReview: async (data) => {
    const params = new URLSearchParams({
      user_id: data.user_id,
      product_name: data.product_name,
      product_code: data.product_code,
      product_id: data.product_id,
      name: data.name,
      mobile_no: data.mobile_no,
      ratings: data.ratings,
      review: data.review,
    }).toString();
    const response = await api.get(`/product-rate-review-details?${params}`);
    console.log('SUBMIT REVIEW RESPONSE:', response.data);
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
