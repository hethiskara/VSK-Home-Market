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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { productAPI } from '../services/api';
import api from '../services/api';

const { width } = Dimensions.get('window');

// Price Range Slider Component with Pentagon Pointers
const PriceRangeSlider = ({ minPrice, maxPrice, selectedMin, selectedMax, onMinChange, onMaxChange }) => {
  const trackLayoutRef = useRef({ x: 0, width: width - 64 });

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
      onPanResponderMove: (evt) => {
        const value = calculateValue(evt.nativeEvent.pageX);
        const newValue = Math.max(minPrice, Math.min(value, selectedMax - 1));
        onMinChange(newValue);
      },
    })
  ).current;

  const maxPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (evt) => {
        const value = calculateValue(evt.nativeEvent.pageX);
        const newValue = Math.max(selectedMin + 1, Math.min(value, maxPrice));
        onMaxChange(newValue);
      },
    })
  ).current;

  const handleTrackLayout = (evt) => {
    evt.target.measure((x, y, width, height, pageX, pageY) => {
      trackLayoutRef.current = { x: pageX, width };
    });
  };

  return (
    <View style={styles.sliderContainer}>
      {/* Track */}
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
      
      {/* Min Thumb - Pentagon shape */}
      <View
        {...minPanResponder.panHandlers}
        style={[styles.thumbWrapper, { left: `${minPercent}%` }]}
      >
        <View style={styles.thumbPentagon}>
          <View style={styles.thumbPentagonTop} />
          <View style={styles.thumbPentagonBottom} />
        </View>
      </View>
      
      {/* Max Thumb - Pentagon shape */}
      <View
        {...maxPanResponder.panHandlers}
        style={[styles.thumbWrapper, { left: `${maxPercent}%` }]}
      >
        <View style={styles.thumbPentagon}>
          <View style={styles.thumbPentagonTop} />
          <View style={styles.thumbPentagonBottom} />
        </View>
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
  
  // Sort/Filter states
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [sortOptions, setSortOptions] = useState([]);
  const [selectedSort, setSelectedSort] = useState(null);
  const [showPriceSlider, setShowPriceSlider] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchSortOptions();
  }, [sectionId, categoryId, subcategoryId, showAll]);

  const fetchSortOptions = async () => {
    try {
      const response = await api.get('/sortmasterjson');
      if (Array.isArray(response.data)) {
        setSortOptions(response.data);
      }
    } catch (error) {
      console.log('Error fetching sort options:', error);
    }
  };

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

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = [...products];
    
    // Apply price filter if custom range is selected
    if (showPriceSlider && (selectedMinPrice !== minPrice || selectedMaxPrice !== maxPrice)) {
      result = result.filter(product => {
        const price = parseFloat(product.productprice) || 0;
        return price >= selectedMinPrice && price <= selectedMaxPrice;
      });
    }
    
    // Apply sorting
    if (selectedSort) {
      if (selectedSort.title === 'Price: Low to High') {
        result.sort((a, b) => parseFloat(a.productprice) - parseFloat(b.productprice));
      } else if (selectedSort.title === 'Price: High to Low') {
        result.sort((a, b) => parseFloat(b.productprice) - parseFloat(a.productprice));
      }
    }
    
    return result;
  }, [products, selectedMinPrice, selectedMaxPrice, minPrice, maxPrice, selectedSort, showPriceSlider]);

  const handleSortSelect = (option) => {
    if (option === 'custom_price') {
      setShowPriceSlider(true);
      setSelectedSort(null);
    } else {
      setSelectedSort(option);
      setShowPriceSlider(false);
      // Reset price range when selecting other sort options
      setSelectedMinPrice(minPrice);
      setSelectedMaxPrice(maxPrice);
    }
    setShowSortDropdown(false);
  };

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
        <TouchableOpacity 
          style={[styles.filterButton, showSortDropdown && styles.filterButtonActive]}
          onPress={() => setShowSortDropdown(!showSortDropdown)}
        >
          <Text style={styles.filterIcon}>↕️</Text>
          <Text style={styles.filterText}>Products By</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterButton, styles.filterButtonLast]}>
          <Text style={styles.filterIcon}>🔻</Text>
          <Text style={styles.filterText}>Filter</Text>
        </TouchableOpacity>
      </View>

      {/* Sort Dropdown */}
      {showSortDropdown && (
        <View style={styles.sortDropdown}>
          {sortOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.sortOption,
                selectedSort?.title === option.title && styles.sortOptionActive
              ]}
              onPress={() => handleSortSelect(option)}
            >
              <Text style={[
                styles.sortOptionText,
                selectedSort?.title === option.title && styles.sortOptionTextActive
              ]}>
                {option.title}
              </Text>
            </TouchableOpacity>
          ))}
          {/* Custom Price Range Option */}
          <TouchableOpacity
            style={[
              styles.sortOption,
              showPriceSlider && styles.sortOptionActive
            ]}
            onPress={() => handleSortSelect('custom_price')}
          >
            <Text style={[
              styles.sortOptionText,
              showPriceSlider && styles.sortOptionTextActive
            ]}>
              Custom Price Range
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Price Range Slider - Only show when Custom Price Range is selected */}
      {showPriceSlider && products.length > 0 && minPrice < maxPrice && (
        <View style={styles.priceFilterContainer}>
          <View style={styles.priceFilterHeader}>
            <Text style={styles.priceFilterLabel}>Price : </Text>
            <Text style={styles.priceRangeDisplay}>₹{selectedMinPrice} - ₹{selectedMaxPrice}</Text>
          </View>
          <PriceRangeSlider
            minPrice={minPrice}
            maxPrice={maxPrice}
            selectedMin={selectedMinPrice}
            selectedMax={selectedMaxPrice}
            onMinChange={setSelectedMinPrice}
            onMaxChange={setSelectedMaxPrice}
          />
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
  filterIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  filterButtonActive: {
    backgroundColor: '#F0F4F8',
  },
  sortDropdown: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
    paddingVertical: 8,
  },
  sortOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sortOptionActive: {
    backgroundColor: '#E8F4FD',
  },
  sortOptionText: {
    fontSize: 14,
    color: '#2C3E50',
  },
  sortOptionTextActive: {
    color: '#3498DB',
    fontWeight: '600',
  },
  priceFilterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  priceFilterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  priceFilterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
  },
  priceRangeDisplay: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C0392B',
  },
  sliderContainer: {
    height: 50,
    justifyContent: 'center',
    position: 'relative',
    marginHorizontal: 10,
  },
  sliderTrack: {
    width: '100%',
    height: 8,
    backgroundColor: '#4A90D9',
    borderRadius: 4,
  },
  sliderActiveTrack: {
    position: 'absolute',
    height: 8,
    backgroundColor: '#4A90D9',
    borderRadius: 4,
    top: 0,
  },
  thumbWrapper: {
    position: 'absolute',
    width: 30,
    height: 30,
    marginLeft: -15,
    top: -11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbPentagon: {
    width: 24,
    height: 24,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  thumbPentagonTop: {
    width: 20,
    height: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#4A90D9',
    borderBottomWidth: 0,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  thumbPentagonBottom: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FFFFFF',
    marginTop: -2,
  },
});

export default ProductsScreen;
