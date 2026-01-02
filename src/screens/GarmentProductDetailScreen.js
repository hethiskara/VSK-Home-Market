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
  Platform,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { garmentAPI, cartAPI, tokenManager, wishlistAPI } from '../services/api';

const CART_STORAGE_KEY = '@vsk_cart';

const { width } = Dimensions.get('window');
const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;
const THEME_COLOR = '#2C4A6B';

const GarmentProductDetailScreen = ({ navigation, route }) => {
  const { productCode } = route.params || {};
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addingToWishlist, setAddingToWishlist] = useState(false);

  useEffect(() => {
    fetchProductDetails();
  }, [productCode]);

  const fetchProductDetails = async () => {
    setLoading(true);
    try {
      const response = await garmentAPI.getProductDetails(productCode);
      console.log('Garment Product Details:', response);
      if (Array.isArray(response) && response.length > 0) {
        setProduct(response[0]);
      }
    } catch (error) {
      console.log('Error fetching garment product details:', error);
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
      Alert.alert('Error', 'WhatsApp is not installed on this device');
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

      // Call add to cart API
      const response = await cartAPI.addToCart(
        product.bcode,
        userData.userid,
        product.id,
        quantity,
        'garments'
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
          carttype: 'garments',
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
        
        // Save guest_id from cart response for checkout
        if (response.guest_id) {
          await AsyncStorage.setItem('cartGuestId', response.guest_id);
          console.log('Saved cart guest_id:', response.guest_id);
        }
        
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

      const colorId = product.colorid || '53';
      const barcode = product.bcode || `${product.productcode}-${colorId}-${product.id}`;

      const response = await wishlistAPI.addGarmentToWishlist({
        user_id: userData.userid,
        product_id: product.id,
        category_id: product.catid || '1',
        subcategory_id: product.subcatid || '15',
        product_name: product.productname,
        color: colorId,
        size: 'Regular',
        barcode: barcode,
        quantity: '1',
        original_price: product.mrp,
        product_price: product.productprice,
      });

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

  const images = getProductImages();

  // Helper function to get value or NA
  const getValue = (value) => value || 'NA';

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity 
        onPress={() => navigation.goBack()} 
        style={styles.backButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={styles.backIcon}>‹</Text>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle} numberOfLines={1}>Product Details</Text>
      <View style={styles.headerRight} />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={THEME_COLOR} />
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME_COLOR} />
          <Text style={styles.loadingText}>Loading product details...</Text>
        </View>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={THEME_COLOR} />
        {renderHeader()}
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyText}>Product not found</Text>
          <TouchableOpacity 
            style={styles.goBackButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.goBackText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME_COLOR} />
      {renderHeader()}

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
          <Text style={styles.productCode}>Product Code: {getValue(product.productcode)}</Text>

          {/* Ratings Section */}
          <View style={styles.ratingsRow}>
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>New</Text>
              <Text style={styles.ratingStar}>★</Text>
            </View>
            <Text style={styles.ratingsLabel}>Ratings & 0 Reviews</Text>
          </View>

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

            {/* Color */}
            {product.availablecolors && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Available Color :</Text>
                <Image 
                  source={{ uri: product.availablecolors }} 
                  style={styles.colorSwatch}
                  resizeMode="cover"
                />
              </View>
            )}
          </View>

          {/* Stock Status */}
          <Text style={[
            styles.stockStatus,
            { color: parseInt(product.stockinhand) > 0 ? '#27AE60' : '#E74C3C' }
          ]}>
            {product.stockinhand && parseInt(product.stockinhand) > 0 
              ? `${product.stockinhand} in Stock` 
              : 'Out of Stock'}
          </Text>

          {/* Tags Section */}
          <View style={styles.tagsSection}>
            <Text style={styles.tagsLabel}>Tags :</Text>
            <View style={styles.tagsContainer}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>Garments</Text>
              </View>
              <View style={styles.tag}>
                <Text style={styles.tagText}>VSK Home Market</Text>
              </View>
              <View style={styles.tag}>
                <Text style={styles.tagText}>{product.productname?.split(' ').slice(-1)[0] || 'Saree'}</Text>
              </View>
            </View>
          </View>

          {/* Share Button */}
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Text style={styles.shareIcon}>↗</Text>
            <Text style={styles.shareText}>Share</Text>
          </TouchableOpacity>

          {/* Quantity Selector */}
          {parseInt(product.stockinhand) > 0 && (
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
                  onPress={() => setQuantity(Math.min(parseInt(product.stockinhand), quantity + 1))}
                >
                  <Text style={styles.quantityButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          {parseInt(product.stockinhand) > 0 ? (
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.addToCartButton} onPress={handleAddToCart}>
                <Text style={styles.addToCartText}>Add to Cart</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.buyNowButton} onPress={handleAddToCart}>
                <Text style={styles.buyNowText}>Buy Now</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.outOfStockSection}>
              <Text style={styles.outOfStockMessage}>This product is currently out of stock</Text>
              <TouchableOpacity style={styles.notifyButton}>
                <Text style={styles.notifyButtonText}>Notify When Available</Text>
              </TouchableOpacity>
            </View>
          )}

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

          <View style={{ height: 80 }} />
        </View>
      </ScrollView>

      {/* WhatsApp Floating Button */}
      <TouchableOpacity style={styles.whatsappButton} onPress={handleWhatsApp}>
        <Text style={styles.whatsappIcon}>📱</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME_COLOR,
    paddingHorizontal: 16,
    paddingTop: STATUSBAR_HEIGHT + 10,
    paddingBottom: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 70,
  },
  backIcon: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '300',
    marginRight: 2,
    marginTop: -2,
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    minWidth: 70,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    color: '#666666',
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    width: width,
    height: width * 0.9,
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainImage: {
    width: width - 40,
    height: width * 0.85,
  },
  thumbnailContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  thumbnail: {
    width: 65,
    height: 65,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
    marginRight: 10,
  },
  thumbnailSelected: {
    borderColor: THEME_COLOR,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  infoContainer: {
    padding: 16,
  },
  productName: {
    fontSize: 20,
    fontWeight: '700',
    color: THEME_COLOR,
    marginBottom: 6,
    lineHeight: 26,
  },
  productCode: {
    fontSize: 13,
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
    backgroundColor: '#27AE60',
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
    marginLeft: 4,
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
    color: '#E74C3C',
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
    color: '#27AE60',
    fontWeight: '600',
  },
  detailsList: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  colorSwatch: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  stockStatus: {
    fontSize: 16,
    fontWeight: '600',
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
    borderColor: THEME_COLOR,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F4F8',
  },
  tagText: {
    fontSize: 12,
    color: THEME_COLOR,
    fontWeight: '500',
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
    backgroundColor: THEME_COLOR,
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
  outOfStockSection: {
    marginBottom: 24,
  },
  outOfStockMessage: {
    fontSize: 14,
    color: '#E74C3C',
    marginBottom: 12,
    textAlign: 'center',
  },
  notifyButton: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME_COLOR,
  },
  notifyButtonText: {
    color: THEME_COLOR,
    fontSize: 14,
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
    color: THEME_COLOR,
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
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 20,
  },
  goBackButton: {
    backgroundColor: THEME_COLOR,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  goBackText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
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
});

export default GarmentProductDetailScreen;

