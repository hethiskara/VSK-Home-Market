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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { productAPI, garmentAPI, cartAPI, tokenManager } from '../services/api';

const CART_STORAGE_KEY = '@vsk_cart';

const { width } = Dimensions.get('window');

const ProductDetailScreen = ({ navigation, route }) => {
  const { productCode, productType = 'regular' } = route.params || {};
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchProductDetails();
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
          <View style={styles.ratingsRow}>
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>nan</Text>
              <Text style={styles.ratingStar}>★</Text>
            </View>
            <Text style={styles.ratingsLabel}>Ratings & 0 Reviews</Text>
          </View>

          {/* Feedback Row */}
          <View style={styles.feedbackRow}>
            <Text style={styles.feedbackItem}>👍 0</Text>
            <Text style={styles.feedbackItem}>👎 0</Text>
            <Text style={styles.feedbackItem}>💬 0</Text>
          </View>

          {/* Compare & Wishlist */}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionItem}>
              <Text style={styles.actionIcon}>◉</Text>
              <Text style={styles.actionLabel}>Add to Compare</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionItem}>
              <Text style={styles.actionIconHeart}>❤</Text>
              <Text style={styles.actionLabel}>Add to Wishlist</Text>
            </TouchableOpacity>
          </View>

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

          <View style={{ height: 80 }} />
        </View>
      </ScrollView>

      {/* WhatsApp Floating Button */}
      <TouchableOpacity style={styles.whatsappButton} onPress={handleWhatsApp}>
        <Text style={styles.whatsappIcon}>📱</Text>
      </TouchableOpacity>
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
  feedbackRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 12,
  },
  feedbackItem: {
    fontSize: 14,
    color: '#666',
  },
  actionsRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 20,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 14,
    color: '#3498DB',
    marginRight: 6,
  },
  actionIconHeart: {
    fontSize: 14,
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
});

export default ProductDetailScreen;
