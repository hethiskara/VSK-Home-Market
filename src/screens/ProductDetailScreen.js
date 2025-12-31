import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  Share,
  Linking,
  Alert,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { productAPI, garmentAPI, cartAPI, tokenManager, wishlistAPI, reviewAPI } from '../services/api';

const CART_STORAGE_KEY = '@vsk_cart';

const { width } = Dimensions.get('window');

const ProductDetailScreen = ({ navigation, route }) => {
  const { productCode, productType = 'regular' } = route.params || {};
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [addingToWishlist, setAddingToWishlist] = useState(false);

  useEffect(() => {
    fetchProductDetails();
    if (productCode) {
      fetchReviews();
    }
  }, [productCode, productType]);

  const fetchProductDetails = async () => {
    setLoading(true);
    try {
      // Use the appropriate API based on product type
      let response;
      if (productType === 'garment') {
        response = await garmentAPI.getProductDetails(productCode);
        console.log('GARMENT DETAILS RESPONSE:', response);
      } else {
        response = await productAPI.getProductDetails(productCode);
        console.log('REGULAR DETAILS RESPONSE:', response);
      }
      
      if (Array.isArray(response) && response.length > 0) {
        setProduct(response[0]);
      }
    } catch (error) {
      console.log('Error fetching product details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProductImages = () => {
    if (!product) return [];
    const images = [];
    for (let i = 1; i <= 5; i++) {
      const img = product[`productimage${i}`];
      if (img) images.push(img);
    }
    return images;
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${product?.productname || 'this product'} at VSK Home Market!\nPrice: Rs. ${product?.productprice || 'NA'}\nhttps://www.vskhomemarket.com`,
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  const handleWhatsApp = () => {
    const message = `Hi, I'm interested in ${product?.productname || 'this product'} (Code: ${product?.productcode || 'NA'}) priced at Rs. ${product?.productprice || 'NA'}`;
    const url = `whatsapp://send?phone=919840336999&text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => {
      console.log('WhatsApp not installed');
    });
  };

  const handleAddToCart = async () => {
    try {
      // Get user data
      const userData = await tokenManager.getUserData();
      if (!userData?.userid) {
        Alert.alert('Login Required', 'Please login to add items to cart');
        navigation.navigate('Login');
        return;
      }

      // Determine cart type based on product type
      const cartType = productType === 'garment' ? 'garments' : 'pathanjali';

      // Call add to cart API
      const response = await cartAPI.addToCart(
        product.bcode,
        userData.userid,
        product.id,
        quantity,
        cartType
      );

      if (response.status === true) {
        // Save to local storage for cart display
        const cartItem = {
          cart_id: response.cart_id,
          productcode: product.productcode,
          productname: product.productname,
          productimage: product.productimage1,
          productprice: product.productprice,
          mrp: product.mrp,
          quantity: quantity,
          cgst: product.cgst,
          sgst: product.sgst,
          bcode: product.bcode,
          prod_id: product.id,
          carttype: cartType,
        };

        // Get existing cart
        const existingCart = await AsyncStorage.getItem(CART_STORAGE_KEY);
        let cartItems = existingCart ? JSON.parse(existingCart) : [];
        
        // Check if item already exists
        const existingIndex = cartItems.findIndex(item => item.bcode === product.bcode);
        if (existingIndex >= 0) {
          cartItems[existingIndex].quantity += quantity;
          cartItems[existingIndex].cart_id = response.cart_id;
        } else {
          cartItems.push(cartItem);
        }

        await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
        
        Alert.alert('Success', response.message || 'Product added to cart', [
          { text: 'Continue Shopping', style: 'cancel' },
          { text: 'View Cart', onPress: () => navigation.navigate('Cart') }
        ]);
      } else {
        Alert.alert('Error', response.message || 'Failed to add to cart');
      }
    } catch (error) {
      console.log('Add to cart error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await reviewAPI.getReviews(productCode);
      if (Array.isArray(response)) {
        // Filter out "NO REVIEWS FOUND" placeholder from API
        const validReviews = response.filter(r => r.id !== '0' && !r.title?.includes('NO REVIEWS'));
        setReviews(validReviews);
      }
    } catch (error) {
      console.log('Error fetching reviews:', error);
    }
  };

  const handleAddToWishlist = async () => {
    try {
      const userData = await tokenManager.getUserData();
      if (!userData?.userid) {
        Alert.alert('Login Required', 'Please login to add items to wishlist');
        navigation.navigate('Login');
        return;
      }

      setAddingToWishlist(true);

      // First check if product is already in wishlist
      try {
        const existingWishlist = await wishlistAPI.getWishlist(userData.userid);
        if (Array.isArray(existingWishlist)) {
          const alreadyExists = existingWishlist.some(item => 
            item.product_id === product.id?.toString() || 
            item.product_name === product.productname
          );
          if (alreadyExists) {
            Alert.alert('Already in Wishlist', 'This product is already in your wishlist!', [
              { text: 'Continue Shopping', style: 'cancel' },
              { text: 'View Wishlist', onPress: () => navigation.navigate('Wishlist') }
            ]);
            setAddingToWishlist(false);
            return;
          }
        }
      } catch (checkError) {
        console.log('Error checking wishlist:', checkError);
        // Continue with add even if check fails
      }

      // Extract size from product name (e.g., "100 Grams" from "Chicken Pickle Andhra 100 Grams")
      // For garments, use "Regular" as default
      const sizeMatch = product.productname?.match(/(\d+\s*(grams?|kg|ml|l|pieces?|pack))/i);
      let productSize = product.size || (sizeMatch ? sizeMatch[0] : '');
      
      // For garment products, use "Regular" if size is still empty
      if (!productSize && productType === 'garment') {
        productSize = 'Regular';
      }

      // Build barcode - ensure no double dashes
      const colorId = product.colorid || '53';
      const barcode = product.bcode || `${product.productcode}-${colorId}-${product.id}`;

      const wishlistData = {
        user_id: userData.userid,
        product_id: product.id,
        category_id: product.catid || '226',
        subcategory_id: product.subcatid || '385',
        product_name: product.productname,
        color: colorId,
        size: productSize,
        barcode: barcode,
        quantity: '1',
        original_price: product.mrp,
        product_price: product.productprice,
      };

      // Use different API endpoint for garment products
      const response = productType === 'garment' 
        ? await wishlistAPI.addGarmentToWishlist(wishlistData)
        : await wishlistAPI.addToWishlist(wishlistData);

      if (response?.[0]?.status === 'SUCCESS') {
        Alert.alert('Success', 'Product added to wishlist!', [
          { text: 'Continue Shopping', style: 'cancel' },
          { text: 'View Wishlist', onPress: () => navigation.navigate('Wishlist') }
        ]);
      } else {
        Alert.alert('Info', response?.[0]?.message || 'Product may already be in wishlist');
      }
    } catch (error) {
      console.log('Add to wishlist error:', error);
      Alert.alert('Error', 'Failed to add to wishlist. Please try again.');
    } finally {
      setAddingToWishlist(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewText.trim()) {
      Alert.alert('Error', 'Please enter a review');
      return;
    }

    try {
      const userData = await tokenManager.getUserData();
      if (!userData?.userid) {
        Alert.alert('Login Required', 'Please login to submit a review');
        navigation.navigate('Login');
        return;
      }

      setSubmittingReview(true);

      // Build user's full name
      const userName = userData.firstname 
        ? `${userData.firstname}${userData.lastname ? ' ' + userData.lastname : ''}`
        : 'User';

      const response = await reviewAPI.submitReview({
        user_id: userData.userid,
        product_name: product.productname,
        product_code: product.productcode,
        product_id: product.id,
        name: userName,
        mobile_no: userData.mobile_no || '',
        ratings: reviewRating.toString(),
        review: reviewText,
      });

      if (response?.[0]?.status === 'SUCCESS') {
        Alert.alert('Success', 'Review submitted successfully!');
        setShowReviewModal(false);
        setReviewText('');
        setReviewRating(5);
        fetchReviews(); // Refresh reviews
      } else {
        Alert.alert('Error', response?.[0]?.message || 'Failed to submit review');
      }
    } catch (error) {
      console.log('Submit review error:', error);
      Alert.alert('Error', 'Failed to submit review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const renderStars = (rating, interactive = false, size = 16) => {
    const stars = [];
    const ratingNum = parseFloat(rating) || 0;
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          disabled={!interactive}
          onPress={() => interactive && setReviewRating(i)}
        >
          <Text style={{ fontSize: size, color: i <= ratingNum ? '#FFD700' : '#CCCCCC' }}>
            ★
          </Text>
        </TouchableOpacity>
      );
    }
    return <View style={{ flexDirection: 'row' }}>{stars}</View>;
  };

  const images = getProductImages();

  // Helper function to get value or NA
  const getValue = (value) => value || 'NA';

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Product not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Product Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Main Image */}
        <View style={styles.imageContainer}>
          {images.length > 0 && (
            <Image
              source={{ uri: images[selectedImage] }}
              style={styles.mainImage}
              resizeMode="contain"
            />
          )}
        </View>

        {/* Thumbnail Images */}
        {images.length > 1 && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbnailContainer}
          >
            {images.map((img, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => setSelectedImage(index)}
                style={[
                  styles.thumbnail,
                  selectedImage === index && styles.thumbnailSelected
                ]}
              >
                <Image source={{ uri: img }} style={styles.thumbnailImage} resizeMode="cover" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Product Info */}
        <View style={styles.infoContainer}>
          {/* Product Name */}
          <Text style={styles.productName}>{getValue(product.productname)}</Text>
          
          {/* Product Code */}
          <Text style={styles.productCode}>Product Code : {getValue(product.productcode)}</Text>

          {/* Ratings Section */}
          <TouchableOpacity 
            style={styles.ratingsRow}
            onPress={() => setShowReviewModal(true)}
          >
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>
                {reviews.length > 0 ? (reviews.reduce((acc, r) => acc + parseFloat(r.ratings || 0), 0) / reviews.length).toFixed(1) : 'New'}
              </Text>
              <Text style={styles.ratingStar}>★</Text>
            </View>
            <Text style={styles.ratingsLabel}>
              {reviews.length} {reviews.length === 1 ? 'Review' : 'Reviews'} • Tap to rate
            </Text>
          </TouchableOpacity>

          {/* Wishlist */}
          <TouchableOpacity 
            style={styles.wishlistButton}
            onPress={handleAddToWishlist}
            disabled={addingToWishlist}
          >
            <Text style={styles.actionIconHeart}>{addingToWishlist ? '⏳' : '❤'}</Text>
            <Text style={styles.actionLabel}>{addingToWishlist ? 'Adding...' : 'Add to Wishlist'}</Text>
          </TouchableOpacity>

          {/* Price Section */}
          <View style={styles.priceSection}>
            <Text style={styles.price}>₹ {getValue(product.productprice)}</Text>
          </View>

          <View style={styles.mrpRow}>
            <Text style={styles.mrp}>₹{getValue(product.mrp)}</Text>
            <Text style={styles.discount}>{getValue(product.percentage)}</Text>
          </View>

          {/* Details List */}
          <View style={styles.detailsList}>
            {/* Discount Details */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Discount Details :</Text>
              <Text style={styles.detailValue}>{getValue(product.discountdetails) || 'Top sellers of the day - 7%'}</Text>
            </View>

            {/* Tax Details */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Tax Details :</Text>
              <Text style={styles.detailValue}>{getValue(product.taxdetails)}</Text>
            </View>

            {/* CGST */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>CGST :</Text>
              <Text style={styles.detailValue}>{getValue(product.cgst)}</Text>
            </View>

            {/* SGST */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>SGST :</Text>
              <Text style={styles.detailValue}>{getValue(product.sgst)}</Text>
            </View>
          </View>

          {/* Stock Status */}
          <Text style={styles.stockStatus}>
            {product.stockinhand ? `${product.stockinhand} in Stock` : 'NA'}
          </Text>

          {/* Tags Section */}
          <View style={styles.tagsSection}>
            <Text style={styles.tagsLabel}>Tags :</Text>
            <View style={styles.tagsContainer}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>Andhra Homemade pickle</Text>
              </View>
              <View style={styles.tag}>
                <Text style={styles.tagText}>VSK Home Market</Text>
              </View>
              <View style={styles.tag}>
                <Text style={styles.tagText}>{product.productname?.split(' ')[0] || 'Pickle'}</Text>
              </View>
            </View>
          </View>

          {/* Share Button */}
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Text style={styles.shareIcon}>↗</Text>
            <Text style={styles.shareText}>Share</Text>
          </TouchableOpacity>

          {/* Quantity Selector */}
          <View style={styles.quantitySection}>
            <Text style={styles.quantityLabel}>Quantity:</Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity 
                style={styles.quantityButton}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Text style={styles.quantityButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.quantityValue}>{quantity}</Text>
              <TouchableOpacity 
                style={styles.quantityButton}
                onPress={() => setQuantity(quantity + 1)}
              >
                <Text style={styles.quantityButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.addToCartButton} onPress={handleAddToCart}>
              <Text style={styles.addToCartText}>Add to Cart</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.buyNowButton} onPress={handleAddToCart}>
              <Text style={styles.buyNowText}>Buy Now</Text>
            </TouchableOpacity>
          </View>

          {/* Overview */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Overview</Text>
            <Text style={styles.sectionContent}>{getValue(product.overview)}</Text>
          </View>

          {/* Specifications */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Specifications</Text>
            <Text style={styles.sectionContent}>{getValue(product.specifications)}</Text>
          </View>

          {/* Reviews Section */}
          <View style={styles.section}>
            <View style={styles.reviewsHeader}>
              <Text style={styles.sectionTitle}>Customer Reviews ({reviews.length})</Text>
              <TouchableOpacity 
                style={styles.writeReviewButton}
                onPress={() => setShowReviewModal(true)}
              >
                <Text style={styles.writeReviewText}>Write Review</Text>
              </TouchableOpacity>
            </View>
            
            {reviews.length > 0 ? (
              reviews.map((review, index) => (
                <View key={review.id || index} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewerAvatar}>
                      <Text style={styles.reviewerInitial}>
                        {review.name?.charAt(0)?.toUpperCase() || 'U'}
                      </Text>
                    </View>
                    <View style={styles.reviewerInfo}>
                      <Text style={styles.reviewerName}>{review.name}</Text>
                      {renderStars(review.ratings)}
                    </View>
                  </View>
                  <Text style={styles.reviewText}>{review.review}</Text>
                </View>
              ))
            ) : (
              <View style={styles.noReviews}>
                <Text style={styles.noReviewsText}>No reviews yet. Be the first to review!</Text>
              </View>
            )}
          </View>

          <View style={{ height: 80 }} />
        </View>
      </ScrollView>

      {/* WhatsApp Floating Button */}
      <TouchableOpacity style={styles.whatsappButton} onPress={handleWhatsApp}>
        <Text style={styles.whatsappIcon}>📱</Text>
      </TouchableOpacity>

      {/* Review Modal */}
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
                <Text style={styles.modalTitle}>Write a Review</Text>
                <TouchableOpacity onPress={() => {
                  Keyboard.dismiss();
                  setShowReviewModal(false);
                }}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.modalProductName}>{product?.productname}</Text>

              <Text style={styles.ratingLabel}>Your Rating</Text>
              <View style={styles.ratingStars}>
                {renderStars(reviewRating, true, 32)}
              </View>

              <Text style={styles.ratingLabel}>Your Review</Text>
              <TextInput
                style={styles.reviewInput}
                placeholder="Write your review here..."
                value={reviewText}
                onChangeText={setReviewText}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                returnKeyType="done"
                blurOnSubmit={true}
                onSubmitEditing={Keyboard.dismiss}
              />

              <TouchableOpacity 
                style={[styles.submitReviewButton, submittingReview && styles.submitReviewButtonDisabled]}
                onPress={() => {
                  Keyboard.dismiss();
                  handleSubmitReview();
                }}
                disabled={submittingReview}
              >
                {submittingReview ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.submitReviewText}>Submit Review</Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
    backgroundColor: '#F0F4F8',
  },
  backButton: {
    paddingVertical: 4,
    paddingRight: 8,
  },
  backText: {
    fontSize: 16,
    color: '#3498DB',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 60,
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    width: width,
    height: width * 0.8,
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainImage: {
    width: width - 40,
    height: width * 0.75,
  },
  thumbnailContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
    marginRight: 10,
  },
  thumbnailSelected: {
    borderColor: '#FF6B35',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  infoContainer: {
    padding: 16,
  },
  productName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 4,
    lineHeight: 28,
  },
  productCode: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  ratingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0AD4E',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 10,
  },
  ratingText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  ratingStar: {
    fontSize: 12,
    color: '#FFFFFF',
    marginLeft: 2,
  },
  ratingsLabel: {
    fontSize: 14,
    color: '#3498DB',
    fontWeight: '500',
  },
  wishlistButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  actionIconHeart: {
    fontSize: 16,
    color: '#E74C3C',
    marginRight: 6,
  },
  actionLabel: {
    fontSize: 14,
    color: '#333',
  },
  priceSection: {
    marginBottom: 4,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  mrpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  mrp: {
    fontSize: 16,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  discount: {
    fontSize: 14,
    color: '#666',
  },
  detailsList: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    width: 130,
  },
  detailValue: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  stockStatus: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF6B35',
    marginBottom: 16,
  },
  tagsSection: {
    marginBottom: 16,
  },
  tagsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    borderWidth: 1,
    borderColor: '#DDD',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    backgroundColor: '#FAFAFA',
  },
  tagText: {
    fontSize: 13,
    color: '#333',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  shareIcon: {
    fontSize: 16,
    color: '#3498DB',
    marginRight: 6,
  },
  shareText: {
    fontSize: 14,
    color: '#3498DB',
    textDecorationLine: 'underline',
  },
  quantitySection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  quantityLabel: {
    fontSize: 14,
    color: '#2C3E50',
    marginRight: 16,
    fontWeight: '500',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 6,
  },
  quantityButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  quantityButtonText: {
    fontSize: 20,
    color: '#2C3E50',
    fontWeight: '600',
  },
  quantityValue: {
    width: 50,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  addToCartButton: {
    flex: 1,
    backgroundColor: '#FF6B35',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  addToCartText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buyNowButton: {
    flex: 1,
    backgroundColor: '#27AE60',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buyNowText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  whatsappButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  whatsappIcon: {
    fontSize: 28,
  },
  // Reviews Styles
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  writeReviewButton: {
    backgroundColor: '#3498DB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  writeReviewText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  reviewCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2C4A6B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  reviewerInitial: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  reviewerInfo: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  reviewText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  noReviews: {
    padding: 20,
    alignItems: 'center',
  },
  noReviewsText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
  },
  modalClose: {
    fontSize: 24,
    color: '#999',
    padding: 4,
  },
  modalProductName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  ratingStars: {
    marginBottom: 20,
    alignItems: 'center',
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    marginBottom: 20,
    backgroundColor: '#F8F9FA',
  },
  submitReviewButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitReviewButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  submitReviewText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProductDetailScreen;
