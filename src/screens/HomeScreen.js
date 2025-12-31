import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Linking,
} from 'react-native';
import Header from '../components/Header';
import Drawer from '../components/Drawer';
import BannerCarousel from '../components/BannerCarousel';
import { homeAPI, appReviewAPI, tokenManager } from '../services/api';

const ProductCard = ({ product, onPress }) => {
  const discountPercent = product.percentage?.replace(/[()]/g, '') || '';
  
  return (
    <TouchableOpacity style={styles.productCard} onPress={onPress} activeOpacity={0.7}>
      <Image
        source={{ uri: product.productimage }}
        style={styles.productImage}
        resizeMode="cover"
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {product.productname}
        </Text>
        <Text style={styles.productCode}>Code : {product.productcode}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.mrp}>Rs. {product.mrp}</Text>
          <Text style={styles.price}>Rs. {product.productprice}</Text>
        </View>
        {discountPercent ? (
          <Text style={styles.discount}>{discountPercent}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

const LatestProductCard = ({ product, onPress }) => {
  return (
    <TouchableOpacity style={styles.latestProductCard} onPress={onPress} activeOpacity={0.7}>
      <Image
        source={{ uri: product.productimage }}
        style={styles.latestProductImage}
        resizeMode="cover"
      />
      <Text style={styles.latestProductName} numberOfLines={1}>
        {product.productname}
      </Text>
      <Text style={styles.latestProductCode}>Code : {product.productcode}</Text>
      <View style={styles.moreButton}>
        <Text style={styles.moreButtonText}>More</Text>
      </View>
    </TouchableOpacity>
  );
};

const TestimonialCard = ({ testimonial }) => {
  // Decode HTML entities
  const cleanContent = testimonial.content
    ?.replace(/&mdash;/g, '—')
    ?.replace(/&amp;/g, '&')
    ?.replace(/&quot;/g, '"')
    ?.replace(/&#39;/g, "'") || '';

  return (
    <View style={styles.testimonialCard}>
      <View style={styles.testimonialHeader}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {testimonial.name?.charAt(0)?.toUpperCase() || 'U'}
          </Text>
        </View>
        <Text style={styles.testimonialName}>{testimonial.name}</Text>
      </View>
      <View style={styles.quoteBar} />
      <Text style={styles.testimonialContent}>
        {cleanContent}
      </Text>
    </View>
  );
};

const HomeScreen = ({ navigation }) => {
  const [banners, setBanners] = useState([]);
  const [topSellers, setTopSellers] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [bestSelling, setBestSelling] = useState([]);
  const [latestProducts, setLatestProducts] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [advertisement, setAdvertisement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  
  // App Review Modal states
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);
  const [reviewName, setReviewName] = useState('');
  const [reviewEmail, setReviewEmail] = useState('');
  const [reviewMobile, setReviewMobile] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch banners
      const bannerResponse = await homeAPI.getBanners();
      if (bannerResponse.status && bannerResponse.data?.products) {
        setBanners(bannerResponse.data.products);
      }

      // Fetch top sellers (regular + garments)
      const [topRegular, topGarments] = await Promise.all([
        homeAPI.getTopSellersRegular(),
        homeAPI.getTopSellersGarments(),
      ]);
      
      const regularProducts = (Array.isArray(topRegular) ? topRegular : []).map(p => ({ ...p, productType: 'regular' }));
      const garmentsProducts = (Array.isArray(topGarments) ? topGarments : []).map(p => ({ ...p, productType: 'garment' }));
      setTopSellers([...regularProducts, ...garmentsProducts]);

      // Fetch featured products (regular + garments)
      const [featuredRegular, featuredGarments] = await Promise.all([
        homeAPI.getFeaturedRegular(),
        homeAPI.getFeaturedGarments(),
      ]);
      
      const featuredRegularProducts = (Array.isArray(featuredRegular) ? featuredRegular : []).map(p => ({ ...p, productType: 'regular' }));
      const featuredGarmentsProducts = (Array.isArray(featuredGarments) ? featuredGarments : []).map(p => ({ ...p, productType: 'garment' }));
      setFeaturedProducts([...featuredRegularProducts, ...featuredGarmentsProducts]);

      // Fetch best selling products (regular + garments)
      const [bestRegular, bestGarments] = await Promise.all([
        homeAPI.getBestSellingRegular(),
        homeAPI.getBestSellingGarments(),
      ]);
      
      const bestRegularProducts = (Array.isArray(bestRegular) ? bestRegular : []).map(p => ({ ...p, productType: 'regular' }));
      const bestGarmentsProducts = (Array.isArray(bestGarments) ? bestGarments : []).map(p => ({ ...p, productType: 'garment' }));
      setBestSelling([...bestRegularProducts, ...bestGarmentsProducts]);

      // Fetch latest products (regular + garments)
      const [latestRegular, latestGarments] = await Promise.all([
        homeAPI.getLatestProductsRegular(),
        homeAPI.getLatestProductsGarments(),
      ]);
      
      const latestRegularProducts = (Array.isArray(latestRegular) ? latestRegular : []).map(p => ({ ...p, productType: 'regular' }));
      const latestGarmentsProducts = (Array.isArray(latestGarments) ? latestGarments : []).map(p => ({ ...p, productType: 'garment' }));
      setLatestProducts([...latestRegularProducts, ...latestGarmentsProducts]);

      // Fetch testimonials
      const testimonialsResponse = await homeAPI.getTestimonials();
      const testimonialsData = Array.isArray(testimonialsResponse) ? testimonialsResponse : [];
      setTestimonials(testimonialsData);

      // Fetch advertisement
      const adResponse = await homeAPI.getAdvertisement();
      if (adResponse?.status && adResponse?.data?.products?.[0]) {
        setAdvertisement(adResponse.data.products[0]);
      }

      // Pre-fill user data for review modal if logged in
      const userData = await tokenManager.getUserData();
      if (userData) {
        setReviewName(`${userData.firstname || ''} ${userData.lastname || ''}`.trim());
        setReviewMobile(userData.mobile_no || '');
      }

    } catch (error) {
      console.log('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleSubmitAppReview = async () => {
    if (!reviewName.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }
    if (!reviewMobile.trim() || reviewMobile.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
      return;
    }
    if (!reviewText.trim()) {
      Alert.alert('Error', 'Please enter your review');
      return;
    }

    try {
      setSubmittingReview(true);
      Keyboard.dismiss();

      const userData = await tokenManager.getUserData();
      
      const response = await appReviewAPI.submitReview({
        user_id: userData?.userid || '0',
        name: reviewName.trim(),
        email: reviewEmail.trim(),
        mobile_no: reviewMobile.trim(),
        ratings: reviewRating.toString(),
        review: reviewText.trim(),
      });

      if (response?.[0]?.status === 'SUCCESS') {
        Alert.alert('Thank You!', 'Your review has been submitted successfully!');
        setShowReviewModal(false);
        setReviewText('');
        setReviewRating(5);
      } else {
        Alert.alert('Error', response?.[0]?.message || 'Failed to submit review');
      }
    } catch (error) {
      console.log('Submit app review error:', error);
      Alert.alert('Error', 'Failed to submit review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const renderStars = (rating, interactive = false, size = 24) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          disabled={!interactive}
          onPress={() => interactive && setReviewRating(i)}
          style={{ marginHorizontal: 2 }}
        >
          <Text style={{ fontSize: size, color: i <= rating ? '#FFD700' : '#CCCCCC' }}>
            ★
          </Text>
        </TouchableOpacity>
      );
    }
    return <View style={{ flexDirection: 'row' }}>{stars}</View>;
  };

  const renderProductItem = ({ item }) => (
    <ProductCard 
      product={item} 
      onPress={() => navigation.navigate('ProductDetail', { 
        productCode: item.productcode,
        productType: item.productType || 'regular'
      })}
    />
  );

  const renderLatestItem = ({ item }) => (
    <LatestProductCard 
      product={item} 
      onPress={() => navigation.navigate('ProductDetail', { 
        productCode: item.productcode,
        productType: item.productType || 'regular'
      })}
    />
  );

  const renderTestimonialItem = ({ item }) => (
    <TestimonialCard testimonial={item} />
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header onMenuPress={() => setDrawerVisible(true)} navigation={navigation} />
      
      <Drawer 
        visible={drawerVisible} 
        onClose={() => setDrawerVisible(false)}
        navigation={navigation}
      />
      
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF6B35']}
            tintColor="#FF6B35"
          />
        }
      >
        <BannerCarousel banners={banners} />

        {/* Top Sellers Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top sellers of the day</Text>
            <TouchableOpacity>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          {topSellers.length > 0 ? (
            <FlatList
              data={topSellers}
              renderItem={renderProductItem}
              keyExtractor={(item, index) => `top-${item.id}-${index}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.productList}
            />
          ) : (
            <View style={styles.productPlaceholder}>
              <Text style={styles.placeholderText}>No products available</Text>
            </View>
          )}
        </View>

        {/* Featured Products Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Feature Products of the Day</Text>
            <TouchableOpacity>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          {featuredProducts.length > 0 ? (
            <FlatList
              data={featuredProducts}
              renderItem={renderProductItem}
              keyExtractor={(item, index) => `featured-${item.id}-${index}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.productList}
            />
          ) : (
            <View style={styles.productPlaceholder}>
              <Text style={styles.placeholderText}>No products available</Text>
            </View>
          )}
        </View>

        {/* Best Selling Products Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Best Selling Products</Text>
            <TouchableOpacity>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          {bestSelling.length > 0 ? (
            <FlatList
              data={bestSelling}
              renderItem={renderProductItem}
              keyExtractor={(item, index) => `best-${item.id}-${index}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.productList}
            />
          ) : (
            <View style={styles.productPlaceholder}>
              <Text style={styles.placeholderText}>No products available</Text>
            </View>
          )}
        </View>

        {/* Latest Products Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>Latest Products</Text>
            </View>
          </View>
          {latestProducts.length > 0 ? (
            <FlatList
              data={latestProducts}
              renderItem={renderLatestItem}
              keyExtractor={(item, index) => `latest-${item.id}-${index}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.productList}
            />
          ) : (
            <View style={styles.productPlaceholder}>
              <Text style={styles.placeholderText}>No products available</Text>
            </View>
          )}
        </View>

        {/* Promotion Section */}
        <View style={styles.promotionSection}>
          <View style={styles.promotionContent}>
            {advertisement && (
              <TouchableOpacity onPress={() => setShowAdModal(true)}>
                <Image
                  source={{ uri: advertisement.image }}
                  style={styles.promotionBanner}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            )}
            <View style={styles.subscribeContainer}>
              <Text style={styles.subscribeTitle}>🔔 Stay Updated!</Text>
              <Text style={styles.subscribeText}>
                Subscribe to get notified about our exclusive offers and new arrivals
              </Text>
              <TouchableOpacity 
                style={styles.subscribeButton}
                onPress={() => Alert.alert('Coming Soon', 'Subscription feature will be available soon!')}
              >
                <Text style={styles.subscribeButtonText}>Subscribe Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Testimonials Section */}
        <View style={styles.testimonialSection}>
          <View style={styles.testimonialSectionHeader}>
            <Text style={styles.testimonialSectionTitle}>What Our Customers Say</Text>
            <Text style={styles.testimonialSubtitle}>Testimonials</Text>
          </View>
          {testimonials.length > 0 ? (
            <FlatList
              data={testimonials}
              renderItem={renderTestimonialItem}
              keyExtractor={(item) => `testimonial-${item.id}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.testimonialList}
            />
          ) : (
            <View style={styles.productPlaceholder}>
              <Text style={styles.placeholderText}>No testimonials available</Text>
            </View>
          )}
        </View>

        {/* Write App Review Section */}
        <View style={styles.appReviewSection}>
          <View style={styles.appReviewHeader}>
            <Text style={styles.appReviewTitle}>❤️ Love Our App?</Text>
            <Text style={styles.appReviewSubtitle}>Share your experience with us</Text>
          </View>
          <TouchableOpacity 
            style={styles.writeReviewButton}
            onPress={() => setShowReviewModal(true)}
          >
            <Text style={styles.writeReviewButtonText}>✍️ Write a Review</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerTop}>
            <Text style={styles.footerBrand}>VSK Home Market</Text>
          </View>
          
          <View style={styles.footerSocial}>
            <TouchableOpacity 
              style={[styles.socialIcon, { backgroundColor: '#1877F2' }]}
              onPress={() => Linking.openURL('https://www.facebook.com/profile.php?id=61577362905796')}
            >
              <Text style={styles.socialIconText}>f</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.socialIcon, { backgroundColor: '#E4405F' }]}
              onPress={() => Linking.openURL('https://www.instagram.com/vsk_homemarket/')}
            >
              <Image 
                source={{ uri: 'https://img.icons8.com/ios-filled/50/FFFFFF/instagram-new.png' }}
                style={styles.socialIconImage}
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.socialIcon, { backgroundColor: '#FF0000' }]}
              onPress={() => Linking.openURL('https://youtube.com/@vskhomemarket?si=v31sQAFHu9O8nZit')}
            >
              <Text style={styles.youtubeIcon}>▶</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footerCopyright}>
            <Text style={styles.copyrightText}>
              Copyright © vskhomemarket.com - All rights reserved
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* App Review Modal */}
      <Modal
        visible={showReviewModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowReviewModal(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Rate VSK Home Market</Text>
                <TouchableOpacity onPress={() => {
                  Keyboard.dismiss();
                  setShowReviewModal(false);
                }}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.inputLabel}>Name *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your name"
                  value={reviewName}
                  onChangeText={setReviewName}
                />

                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your email"
                  value={reviewEmail}
                  onChangeText={setReviewEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <Text style={styles.inputLabel}>Mobile No *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your mobile number"
                  value={reviewMobile}
                  onChangeText={setReviewMobile}
                  keyboardType="phone-pad"
                  maxLength={10}
                />

                <Text style={styles.inputLabel}>Rating *</Text>
                <View style={styles.ratingContainer}>
                  {renderStars(reviewRating, true, 32)}
                </View>

                <Text style={styles.inputLabel}>Your Review *</Text>
                <TextInput
                  style={styles.reviewTextInput}
                  placeholder="Write your review here..."
                  value={reviewText}
                  onChangeText={setReviewText}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />

                <TouchableOpacity 
                  style={[styles.submitButton, submittingReview && styles.submitButtonDisabled]}
                  onPress={handleSubmitAppReview}
                  disabled={submittingReview}
                >
                  {submittingReview ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.submitButtonText}>Submit Review</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Ad Image Modal */}
      <Modal
        visible={showAdModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowAdModal(false)}
      >
        <TouchableOpacity 
          style={styles.adModalOverlay}
          activeOpacity={1}
          onPress={() => setShowAdModal(false)}
        >
          <View style={styles.adModalContent}>
            {advertisement && (
              <Image
                source={{ uri: advertisement.image }}
                style={styles.adModalImage}
                resizeMode="contain"
              />
            )}
            <TouchableOpacity 
              style={styles.adModalClose}
              onPress={() => setShowAdModal(false)}
            >
              <Text style={styles.adModalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E8E8E8',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  latestIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  viewAll: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
  },
  productList: {
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  productCard: {
    width: 150,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 6,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  productImage: {
    width: '100%',
    height: 130,
    backgroundColor: '#F8F8F8',
  },
  productInfo: {
    padding: 8,
  },
  productName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333333',
    height: 36,
    lineHeight: 18,
  },
  productCode: {
    fontSize: 11,
    color: '#666666',
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    flexWrap: 'wrap',
  },
  mrp: {
    fontSize: 12,
    color: '#999999',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2196F3',
  },
  discount: {
    fontSize: 11,
    color: '#4CAF50',
    marginTop: 2,
  },
  productPlaceholder: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 14,
    color: '#999',
  },
  footerSpace: {
    height: 40,
  },
  latestProductCard: {
    width: 150,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 6,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    paddingBottom: 10,
  },
  latestProductImage: {
    width: '100%',
    height: 130,
    backgroundColor: '#F8F8F8',
  },
  latestProductName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333333',
    marginTop: 8,
    paddingHorizontal: 8,
    textAlign: 'center',
  },
  latestProductCode: {
    fontSize: 11,
    color: '#666666',
    marginTop: 2,
  },
  moreButton: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 6,
  },
  moreButtonText: {
    fontSize: 12,
    color: '#333333',
    fontWeight: '500',
  },
  // Testimonial Styles
  testimonialSection: {
    marginTop: 16,
    backgroundColor: '#2C4A6B',
    paddingBottom: 20,
  },
  testimonialSectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  testimonialSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  testimonialSubtitle: {
    fontSize: 14,
    color: '#FFD700',
    marginTop: 4,
    fontWeight: '500',
  },
  testimonialList: {
    paddingHorizontal: 8,
  },
  testimonialCard: {
    width: 300,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 8,
    borderRadius: 12,
    padding: 16,
  },
  testimonialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2C4A6B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  testimonialName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  quoteBar: {
    width: 4,
    height: 30,
    backgroundColor: '#2C4A6B',
    borderRadius: 2,
    position: 'absolute',
    left: 16,
    top: 70,
  },
  testimonialContent: {
    fontSize: 14,
    color: '#555555',
    lineHeight: 22,
    paddingLeft: 12,
  },
  
  // Promotion Section Styles
  promotionSection: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  promotionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  promotionBanner: {
    width: 140,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  subscribeContainer: {
    flex: 1,
    marginLeft: 16,
  },
  subscribeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2C4A6B',
    marginBottom: 6,
  },
  subscribeText: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
    marginBottom: 10,
  },
  subscribeButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  subscribeButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },

  // App Review Section Styles
  appReviewSection: {
    marginTop: 16,
    backgroundColor: '#FFF8F5',
    padding: 20,
    alignItems: 'center',
  },
  appReviewHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  appReviewTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C4A6B',
    marginBottom: 4,
  },
  appReviewSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
  writeReviewButton: {
    backgroundColor: '#2C4A6B',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  writeReviewButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },

  // Footer Styles
  footer: {
    backgroundColor: '#1A3A5C',
    paddingVertical: 24,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  footerTop: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  footerBrand: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  footerSocial: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  socialIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  socialIconText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  socialIconImage: {
    width: 22,
    height: 22,
    tintColor: '#FFFFFF',
  },
  youtubeIcon: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  footerCopyright: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: 16,
    alignItems: 'center',
  },
  copyrightText: {
    color: '#FFFFFF',
    fontSize: 12,
    opacity: 0.8,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C4A6B',
  },
  modalClose: {
    fontSize: 22,
    color: '#999999',
    padding: 5,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 6,
    marginTop: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: '#FAFAFA',
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  reviewTextInput: {
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: '#FAFAFA',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#2C4A6B',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#AAAAAA',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Ad Modal Styles
  adModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adModalContent: {
    width: '90%',
    height: '70%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adModalImage: {
    width: '100%',
    height: '100%',
  },
  adModalClose: {
    position: 'absolute',
    top: -40,
    right: 0,
    width: 36,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adModalCloseText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default HomeScreen;
