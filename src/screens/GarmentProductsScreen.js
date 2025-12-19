import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { garmentAPI } from '../services/api';

const { width } = Dimensions.get('window');
const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;
const THEME_COLOR = '#2C4A6B';

const GarmentProductsScreen = ({ navigation, route }) => {
  const { 
    categoryId, 
    categoryTitle, 
    subcategoryId, 
    subcategoryTitle, 
    productTypeId, 
    productTypeTitle 
  } = route.params || {};
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, [subcategoryId, categoryId, productTypeId]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      // API: /garmentmoreproduct-details?section_id=1&category_id=1&subcategory_id=15
      // section_id = subcategoryId (Sarees=1)
      // category_id = categoryId (Women=1)
      // subcategory_id = productTypeId (Tissue Fancy=15)
      const response = await garmentAPI.getProducts(subcategoryId, categoryId, productTypeId);
      console.log('Garment Products fetched:', response);
      
      // Filter out invalid/empty products - only keep products with valid data
      const validProducts = Array.isArray(response) 
        ? response.filter(item => 
            item && 
            item.productcode && 
            item.productname && 
            item.productprice
          )
        : [];
      
      setProducts(validProducts);
    } catch (error) {
      console.log('Error fetching garment products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

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
      <Text style={styles.headerTitle} numberOfLines={1}>{productTypeTitle}</Text>
      <View style={styles.headerRight} />
    </View>
  );

  const renderBreadcrumb = () => (
    <View style={styles.breadcrumb}>
      <Text style={styles.breadcrumbText}>
        Garments › {categoryTitle} › {subcategoryTitle} › {productTypeTitle}
      </Text>
    </View>
  );

  const handleProductPress = (product) => {
    navigation.navigate('GarmentProductDetail', { 
      productCode: product.productcode,
    });
  };

  const renderProductItem = ({ item }) => {
    const isOutOfStock = item.qty === '0' || parseInt(item.qty) <= 0;
    
    return (
      <TouchableOpacity 
        style={[styles.productCard, isOutOfStock && styles.outOfStockCard]}
        onPress={() => handleProductPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: item.productimage }} 
            style={styles.productImage} 
            resizeMode="cover"
          />
          {isOutOfStock && (
            <View style={styles.outOfStockOverlay}>
              <Text style={styles.outOfStockText}>Out of Stock</Text>
            </View>
          )}
        </View>
        
        <View style={styles.productContent}>
          <Text style={styles.productTitle} numberOfLines={2}>
            {item.productname}
          </Text>
          
          <View style={styles.actionsRow}>
            <Text style={styles.actionText}>Compare</Text>
            <Text style={styles.actionText}>Wishlist</Text>
          </View>

          <Text style={styles.productCode}>Product Code: {item.productcode}</Text>
          
          <View style={styles.priceRow}>
            <Text style={styles.price}>Rs. {item.productprice}</Text>
            {item.mrp && item.mrp !== item.productprice && (
              <Text style={styles.oldPrice}>Rs. {item.mrp}</Text>
            )}
          </View>
          
          {item.percentage && (
            <Text style={styles.discount}>{item.percentage}</Text>
          )}

          {!isOutOfStock && (
            <Text style={styles.stockInfo}>In Stock: {item.qty}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={THEME_COLOR} />
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME_COLOR} />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME_COLOR} />
      {renderHeader()}

      {/* Filter Bar */}
      <View style={styles.filterBar}>
        <TouchableOpacity style={styles.filterButton}>
          <Text style={styles.filterText}>↕ Sort By</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterButton, styles.filterButtonLast]}>
          <Text style={styles.filterText}>🔻 Filter</Text>
        </TouchableOpacity>
      </View>

      {/* Breadcrumb */}
      {renderBreadcrumb()}

      {/* Products Count - only show if products exist */}
      {products.length > 0 && (
        <View style={styles.countBar}>
          <Text style={styles.countText}>{products.length} Products Found</Text>
        </View>
      )}

      {/* Products List */}
      {products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🛍️</Text>
          <Text style={styles.emptyTitle}>No Products Available</Text>
          <Text style={styles.emptyText}>
            There are no products in this category yet.{'\n'}Please check back later or browse other categories.
          </Text>
          <TouchableOpacity 
            style={styles.goBackButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.goBackText}>Browse Other Categories</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProductItem}
          keyExtractor={(item) => item.id?.toString() || item.productcode}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
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
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    minWidth: 70,
  },
  filterBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
  },
  filterButtonLast: {
    borderRightWidth: 0,
  },
  filterText: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
  },
  breadcrumb: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  breadcrumbText: {
    fontSize: 12,
    color: '#666666',
  },
  countBar: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  countText: {
    fontSize: 13,
    color: THEME_COLOR,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#666666',
    fontSize: 14,
  },
  listContent: {
    padding: 12,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  outOfStockCard: {
    opacity: 0.7,
  },
  imageContainer: {
    position: 'relative',
  },
  productImage: {
    width: 130,
    height: 160,
    backgroundColor: '#F0F0F0',
  },
  outOfStockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    backgroundColor: '#E74C3C',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  productContent: {
    flex: 1,
    padding: 12,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME_COLOR,
    marginBottom: 8,
    lineHeight: 20,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 6,
  },
  actionText: {
    fontSize: 11,
    color: '#3498DB',
  },
  productCode: {
    fontSize: 11,
    color: '#888888',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E74C3C',
    marginRight: 8,
  },
  oldPrice: {
    fontSize: 13,
    color: '#999999',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  discount: {
    fontSize: 11,
    color: '#27AE60',
    fontWeight: '600',
    marginBottom: 4,
  },
  stockInfo: {
    fontSize: 11,
    color: '#27AE60',
    marginTop: 4,
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
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
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
});

export default GarmentProductsScreen;

