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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { productAPI } from '../services/api';

const { width } = Dimensions.get('window');

const ProductDetailScreen = ({ navigation, route }) => {
  const { productCode } = route.params || {};
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchProductDetails();
  }, [productCode]);

  const fetchProductDetails = async () => {
    setLoading(true);
    try {
      const response = await productAPI.getProductDetails(productCode);
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

  const images = getProductImages();

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
          <Text style={styles.productName}>{product.productname}</Text>
          
          <Text style={styles.productCode}>Product Code: {product.productcode}</Text>

          {/* Price Section */}
          <View style={styles.priceSection}>
            <Text style={styles.price}>Rs. {product.productprice}</Text>
            {product.mrp && product.mrp !== product.productprice && (
              <Text style={styles.mrp}>Rs. {product.mrp}</Text>
            )}
            {product.percentage && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>{product.percentage}</Text>
              </View>
            )}
          </View>

          {/* Stock Status */}
          <View style={styles.stockRow}>
            <Text style={styles.stockLabel}>Availability:</Text>
            <Text style={[
              styles.stockValue,
              parseInt(product.stockinhand) > 0 ? styles.inStock : styles.outOfStock
            ]}>
              {parseInt(product.stockinhand) > 0 ? 'In Stock' : 'Out of Stock'}
            </Text>
          </View>

          {/* Tax Details */}
          {product.taxdetails && (
            <View style={styles.taxRow}>
              <Text style={styles.taxLabel}>{product.taxdetails}:</Text>
              <Text style={styles.taxValue}>CGST {product.cgst} + SGST {product.sgst}</Text>
            </View>
          )}

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
            <TouchableOpacity style={styles.addToCartButton}>
              <Text style={styles.addToCartText}>Add to Cart</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.buyNowButton}>
              <Text style={styles.buyNowText}>Buy Now</Text>
            </TouchableOpacity>
          </View>

          {/* Overview */}
          {product.overview && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Overview</Text>
              <Text style={styles.sectionContent}>{product.overview}</Text>
            </View>
          )}

          {/* Specifications */}
          {product.specifications && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Specifications</Text>
              <Text style={styles.sectionContent}>{product.specifications}</Text>
            </View>
          )}

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
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
    gap: 10,
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
    fontSize: 20,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
    lineHeight: 26,
  },
  productCode: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#C0392B',
  },
  mrp: {
    fontSize: 16,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    backgroundColor: '#27AE60',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  discountText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stockLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  stockValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  inStock: {
    color: '#27AE60',
  },
  outOfStock: {
    color: '#E74C3C',
  },
  taxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  taxLabel: {
    fontSize: 13,
    color: '#666',
    marginRight: 8,
  },
  taxValue: {
    fontSize: 13,
    color: '#666',
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
});

export default ProductDetailScreen;

