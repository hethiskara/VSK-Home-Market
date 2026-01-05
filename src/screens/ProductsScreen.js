import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
  PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { productAPI } from '../services/api';

const { width } = Dimensions.get('window');
const SLIDER_WIDTH = width - 64;
const THUMB_SIZE = 24;

// Price Range Slider Component
const PriceRangeSlider = ({ minPrice, maxPrice, selectedMin, selectedMax, onMinChange, onMaxChange }) => {
  const trackLayoutRef = useRef({ x: 0, width: SLIDER_WIDTH });
  const activeThumbRef = useRef(null);

  const minPercent = ((selectedMin - minPrice) / (maxPrice - minPrice)) * 100;
  const maxPercent = ((selectedMax - minPrice) / (maxPrice - minPrice)) * 100;

  const calculateValue = (pageX) => {
    const { x, width } = trackLayoutRef.current;
    const touchX = pageX - x;
    const percent = Math.max(0, Math.min(100, (touchX / width) * 100));
    return Math.round(minPrice + (percent / 100) * (maxPrice - minPrice));
  };

  const minPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => { activeThumbRef.current = 'min'; },
      onPanResponderMove: (evt) => {
        const value = calculateValue(evt.nativeEvent.pageX);
        const newValue = Math.max(minPrice, Math.min(value, selectedMax - 1));
        onMinChange(newValue);
      },
      onPanResponderRelease: () => { activeThumbRef.current = null; },
    })
  ).current;

  const maxPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => { activeThumbRef.current = 'max'; },
      onPanResponderMove: (evt) => {
        const value = calculateValue(evt.nativeEvent.pageX);
        const newValue = Math.max(selectedMin + 1, Math.min(value, maxPrice));
        onMaxChange(newValue);
      },
      onPanResponderRelease: () => { activeThumbRef.current = null; },
    })
  ).current;

  const handleTrackLayout = (evt) => {
    evt.target.measure((x, y, width, height, pageX, pageY) => {
      trackLayoutRef.current = { x: pageX, width };
    });
  };

  return (
    <View style={styles.sliderContainer}>
      <View 
        style={styles.sliderTrack}
        onLayout={handleTrackLayout}
      >
        <View 
          style={[
            styles.sliderActiveTrack,
            { left: `${minPercent}%`, width: `${maxPercent - minPercent}%` }
          ]} 
        />
      </View>
      <View
        {...minPanResponder.panHandlers}
        style={[styles.sliderThumb, { left: `${minPercent}%` }]}
      >
        <View style={styles.thumbInner} />
      </View>
      <View
        {...maxPanResponder.panHandlers}
        style={[styles.sliderThumb, { left: `${maxPercent}%` }]}
      >
        <View style={styles.thumbInner} />
      </View>
    </View>
  );
};

const ProductsScreen = ({ navigation, route }) => {
  const { sectionId, sectionTitle, categoryId, categoryTitle, subcategoryId, subcategoryTitle, showAll, pageTitle } = route.params || {};
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(0);
  const [selectedMinPrice, setSelectedMinPrice] = useState(0);
  const [selectedMaxPrice, setSelectedMaxPrice] = useState(0);

  useEffect(() => {
    fetchProducts();
  }, [sectionId, categoryId, subcategoryId, showAll]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let response;
      if (showAll) {
        // Fetch all products for the section
        response = await productAPI.getAllProductsBySection(sectionId);
      } else {
        // Fetch products for specific subcategory
        response = await productAPI.getProducts(sectionId, categoryId, subcategoryId);
      }
      console.log('Products fetched:', response);
      const productsList = Array.isArray(response) ? response : [];
      setProducts(productsList);
      
      // Calculate min and max prices
      if (productsList.length > 0) {
        const prices = productsList.map(p => parseFloat(p.productprice) || 0).filter(p => p > 0);
        if (prices.length > 0) {
          const min = Math.floor(Math.min(...prices));
          const max = Math.ceil(Math.max(...prices));
          setMinPrice(min);
          setMaxPrice(max);
          setSelectedMinPrice(min);
          setSelectedMaxPrice(max);
        }
      }
    } catch (error) {
      console.log('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter products based on selected price range
  const filteredProducts = useMemo(() => {
    if (selectedMinPrice === minPrice && selectedMaxPrice === maxPrice) {
      return products;
    }
    return products.filter(product => {
      const price = parseFloat(product.productprice) || 0;
      return price >= selectedMinPrice && price <= selectedMaxPrice;
    });
  }, [products, selectedMinPrice, selectedMaxPrice, minPrice, maxPrice]);

  const renderBreadcrumb = () => {
    return (
      <View style={styles.breadcrumb}>
        <Text style={styles.breadcrumbText}>
          <Text style={styles.breadcrumbLink}>Home</Text>
          {sectionTitle && <Text> » <Text style={styles.breadcrumbLink}>{sectionTitle}</Text></Text>}
          {showAll && pageTitle && <Text> » {pageTitle}</Text>}
          {!showAll && categoryTitle && <Text> » <Text style={styles.breadcrumbLink}>{categoryTitle}</Text></Text>}
          {!showAll && subcategoryTitle && <Text> » {subcategoryTitle}</Text>}
        </Text>
      </View>
    );
  };

  const renderProductItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.productCard}
      onPress={() => navigation.navigate('ProductDetail', { productCode: item.productcode })}
      activeOpacity={0.7}
    >
      <Image 
        source={{ uri: item.productimage }} 
        style={styles.productImage} 
        resizeMode="cover"
      />
      <View style={styles.productContent}>
        <Text style={styles.productTitle} numberOfLines={2}>
          {item.productname}
        </Text>
        
        <View style={styles.actionsRow}>
          <Text style={styles.actionText}>Compare</Text>
          <Text style={styles.actionText}>Wishlist</Text>
        </View>

        <Text style={styles.productCode}>Product Code : {item.productcode}</Text>
        
        <View style={styles.priceRow}>
          <Text style={styles.price}>Rs. {item.productprice}</Text>
          {item.mrp && item.mrp !== item.productprice && (
            <Text style={styles.oldPrice}>Rs. {item.mrp}</Text>
          )}
          {item.percentage && (
            <Text style={styles.discount}>{item.percentage}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{pageTitle || subcategoryTitle || categoryTitle || sectionTitle}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Filter Bar */}
      <View style={styles.filterBar}>
        <TouchableOpacity style={styles.filterButton}>
          <Text style={styles.filterText}>↕ Products By</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterButton, styles.filterButtonLast]}>
          <Text style={styles.filterText}>🔻 Filter</Text>
        </TouchableOpacity>
      </View>

      {/* Price Filter */}
      {products.length > 0 && minPrice < maxPrice && (
        <View style={styles.priceFilterContainer}>
          <Text style={styles.priceFilterLabel}>Price Range</Text>
          <PriceRangeSlider
            minPrice={minPrice}
            maxPrice={maxPrice}
            selectedMin={selectedMinPrice}
            selectedMax={selectedMaxPrice}
            onMinChange={setSelectedMinPrice}
            onMaxChange={setSelectedMaxPrice}
          />
          <View style={styles.priceRangeText}>
            <Text style={styles.priceRangeValue}>Rs. {selectedMinPrice}</Text>
            <Text style={styles.priceRangeSeparator}> - </Text>
            <Text style={styles.priceRangeValue}>Rs. {selectedMaxPrice}</Text>
          </View>
        </View>
      )}

      {/* Breadcrumb */}
      {renderBreadcrumb()}

      {/* Products List */}
      {filteredProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {products.length === 0 ? 'No products found' : 'No products in this price range'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderProductItem}
          keyExtractor={(item) => item.id?.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  filterBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E8E8E8',
  },
  filterButtonLast: {
    borderRightWidth: 0,
  },
  filterText: {
    fontSize: 14,
    color: '#2C3E50',
    fontWeight: '500',
  },
  breadcrumb: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FAFAFA',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  breadcrumbText: {
    fontSize: 13,
    color: '#666',
  },
  breadcrumbLink: {
    color: '#3498DB',
  },
  listContent: {
    padding: 16,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  productImage: {
    width: 130,
    height: 150,
    backgroundColor: '#F0F0F0',
  },
  productContent: {
    flex: 1,
    padding: 12,
  },
  productTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#C0392B',
    marginBottom: 10,
    lineHeight: 20,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#3498DB',
  },
  productCode: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#C0392B',
    marginRight: 8,
  },
  oldPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
    paddingRight: 4,
    marginRight: 8,
  },
  discount: {
    fontSize: 12,
    color: '#666',
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
  priceFilterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  priceFilterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 16,
  },
  sliderContainer: {
    height: 40,
    marginHorizontal: 12,
    justifyContent: 'center',
    position: 'relative',
  },
  sliderTrack: {
    width: '100%',
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
  },
  sliderActiveTrack: {
    position: 'absolute',
    height: 6,
    backgroundColor: '#FF6B35',
    borderRadius: 3,
    top: 0,
  },
  sliderThumb: {
    position: 'absolute',
    width: 28,
    height: 28,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    top: -11,
    marginLeft: -14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  thumbInner: {
    width: 12,
    height: 12,
    backgroundColor: '#FF6B35',
    borderRadius: 6,
  },
  priceRangeText: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingHorizontal: 4,
  },
  priceRangeValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2C3E50',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  priceRangeSeparator: {
    fontSize: 14,
    color: '#999',
  },
});

export default ProductsScreen;
