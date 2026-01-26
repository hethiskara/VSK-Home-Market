import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { homeAPI } from '../services/api';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;
const THEME_COLOR = '#2C4A6B';
const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 24;

const LatestProductsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('regular');
  const [regularProducts, setRegularProducts] = useState([]);
  const [garmentProducts, setGarmentProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const [regularResponse, garmentResponse] = await Promise.all([
        homeAPI.getViewAllLatestRegular(),
        homeAPI.getViewAllLatestGarments(),
      ]);

      if (Array.isArray(regularResponse)) {
        setRegularProducts(regularResponse);
      }
      if (Array.isArray(garmentResponse)) {
        setGarmentProducts(garmentResponse);
      }
    } catch (error) {
      console.log('Error fetching latest products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductPress = (product) => {
    const isGarment = activeTab === 'garments';
    if (isGarment) {
      navigation.navigate('GarmentProductDetail', { productCode: product.productcode });
    } else {
      navigation.navigate('ProductDetail', { productCode: product.productcode });
    }
  };

  const renderProductItem = ({ item }) => {
    const mrp = parseFloat(item.mrp) || 0;
    const price = parseFloat(item.productprice) || 0;
    const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => handleProductPress(item)}
        activeOpacity={0.8}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: item.productimage }}
            style={styles.productImage}
            resizeMode="cover"
          />
          {discount > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{discount}% OFF</Text>
            </View>
          )}
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.productname}
          </Text>
          <Text style={styles.productCode}>Code: {item.productcode}</Text>
          <View style={styles.priceRow}>
            {mrp > price && (
              <Text style={styles.mrpPrice}>Rs. {mrp}</Text>
            )}
            <Text style={styles.productPrice}>Rs. {price}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const currentProducts = activeTab === 'regular' ? regularProducts : garmentProducts;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME_COLOR} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>‹</Text>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Latest Products</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'regular' && styles.activeTab]}
          onPress={() => setActiveTab('regular')}
        >
          <Text style={[styles.tabText, activeTab === 'regular' && styles.activeTabText]}>
            Regular ({regularProducts.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'garments' && styles.activeTab]}
          onPress={() => setActiveTab('garments')}
        >
          <Text style={[styles.tabText, activeTab === 'garments' && styles.activeTabText]}>
            Garments ({garmentProducts.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME_COLOR} />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      ) : currentProducts.length > 0 ? (
        <FlatList
          data={currentProducts}
          renderItem={renderProductItem}
          keyExtractor={(item, index) => `${item.productcode}-${index}`}
          numColumns={2}
          contentContainerStyle={[styles.productList, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No products available</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
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
  },
  placeholder: {
    minWidth: 70,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: THEME_COLOR,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  activeTabText: {
    color: THEME_COLOR,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666666',
  },
  productList: {
    padding: 12,
  },
  productCard: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: CARD_WIDTH,
    backgroundColor: '#F0F0F0',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FF6B35',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  productInfo: {
    padding: 10,
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
    minHeight: 36,
    lineHeight: 18,
  },
  productCode: {
    fontSize: 11,
    color: '#888888',
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mrpPrice: {
    fontSize: 12,
    color: '#999999',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FF6B35',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
  },
});

export default LatestProductsScreen;
