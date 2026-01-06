import React, { useEffect, useState, useMemo, useCallback } from 'react';
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
import RangeSlider from 'react-native-sticky-range-slider';
import { garmentAPI } from '../services/api';
import api from '../services/api';

const { width } = Dimensions.get('window');
const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;
const THEME_COLOR = '#2C4A6B';

// Custom Thumb Component
const Thumb = () => (
  <View style={styles.thumb}>
    <View style={styles.thumbLine} />
  </View>
);

// Custom Rail Component
const Rail = () => <View style={styles.rail} />;

// Custom Selected Rail Component
const RailSelected = () => <View style={styles.railSelected} />;

const GarmentProductsScreen = ({ navigation, route }) => {
  const { 
    categoryId, 
    categoryTitle, 
    subcategoryId, 
    subcategoryTitle, 
    productTypeId, 
    productTypeTitle,
    sectionId
  } = route.params || {};
  
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
  
  // Discount filter states
  const [showDiscountDropdown, setShowDiscountDropdown] = useState(false);
  const [discountOptions, setDiscountOptions] = useState([]);
  const [selectedDiscount, setSelectedDiscount] = useState(null);

  useEffect(() => {
    fetchProducts();
    fetchSortOptions();
    fetchDiscountOptions();
  }, [subcategoryId, categoryId, productTypeId]);

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

  const fetchDiscountOptions = async () => {
    try {
      const response = await api.get('/discountmasterjson');
      console.log('Discount options:', response.data);
      if (Array.isArray(response.data)) {
        setDiscountOptions(response.data);
      }
    } catch (error) {
      console.log('Error fetching discount options:', error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await garmentAPI.getProducts(subcategoryId, categoryId, productTypeId);
      console.log('Garment Products fetched:', response);
      
      const validProducts = Array.isArray(response) 
        ? response.filter(item => 
            item && 
            item.productcode && 
            item.productname && 
            item.productprice
          )
        : [];
      
      setProducts(validProducts);
      
      // Calculate min and max prices
      if (validProducts.length > 0) {
        const prices = validProducts.map(p => parseFloat(p.productprice) || 0).filter(p => p > 0);
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
      console.log('Error fetching garment products:', error);
      setProducts([]);
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

  const handlePriceChange = useCallback((low, high) => {
    setSelectedMinPrice(low);
    setSelectedMaxPrice(high);
  }, []);

  const handleSortSelect = async (option) => {
    // Close discount dropdown when sorting
    setShowDiscountDropdown(false);
    setSelectedDiscount(null);
    
    if (option === 'custom_price') {
      setShowPriceSlider(true);
      setSelectedSort(null);
      setShowSortDropdown(false);
      fetchProducts();
      return;
    }
    
    setSelectedSort(option);
    setShowPriceSlider(false);
    setShowSortDropdown(false);
    
    // For Featured and New Arrivals, fetch from API
    if (option.sort === 'featured' || option.sort === 'new_arrivals') {
      setLoading(true);
      setProducts([]);
      try {
        const actualSectionId = sectionId || subcategoryId || 1;
        const actualCategoryId = categoryId || 1;
        const actualSubcategoryId = productTypeId || 1;
        
        const response = await api.get(`/garmentsortdetailjson?section_id=${actualSectionId}&category_id=${actualCategoryId}&subcategory_id=${actualSubcategoryId}&sort=${option.sort}`);
        
        const productData = Array.isArray(response.data) ? response.data : [];
        setProducts(productData);
        
        if (productData.length > 0) {
          const prices = productData.map(p => parseFloat(p.productprice) || 0).filter(p => p > 0);
          if (prices.length > 0) {
            const min = Math.floor(Math.min(...prices));
            const max = Math.ceil(Math.max(...prices));
            setMinPrice(min);
            setMaxPrice(max);
            setSelectedMinPrice(min);
            setSelectedMaxPrice(max);
          }
        } else {
          setMinPrice(0);
          setMaxPrice(0);
          setSelectedMinPrice(0);
          setSelectedMaxPrice(0);
        }
      } catch (error) {
        console.log('Error fetching sorted products:', error);
        setProducts([]);
        setMinPrice(0);
        setMaxPrice(0);
      } finally {
        setLoading(false);
      }
    } else {
      await fetchProducts();
    }
  };

  const handleDiscountSelect = async (option) => {
    // Close sort dropdown when filtering by discount
    setShowSortDropdown(false);
    setShowPriceSlider(false);
    setSelectedSort(null);
    
    setSelectedDiscount(option);
    setShowDiscountDropdown(false);
    setLoading(true);
    setProducts([]);
    
    try {
      const actualSectionId = sectionId || subcategoryId || 1;
      const actualCategoryId = categoryId || 1;
      const actualSubcategoryId = productTypeId || 1;
      
      // Use garmentdiscountmasterdetailjson for garment products
      const apiUrl = `/garmentdiscountmasterdetailjson?section_id=${actualSectionId}&category_id=${actualCategoryId}&subcategory_id=${actualSubcategoryId}&discount_percentage_id=${option.discount_percentage_id}`;
      console.log('GARMENT DISCOUNT API URL:', apiUrl);
      const response = await api.get(apiUrl);
      console.log('GARMENT DISCOUNT API RESPONSE:', response.data);
      
      const productData = Array.isArray(response.data) 
        ? response.data.filter(item => 
            item && 
            item.productcode && 
            item.productname && 
            item.productprice
          )
        : [];
      console.log('GARMENT DISCOUNT PRODUCTS COUNT:', productData.length);
      setProducts(productData);
      
      if (productData.length > 0) {
        const prices = productData.map(p => parseFloat(p.productprice) || 0).filter(p => p > 0);
        if (prices.length > 0) {
          const min = Math.floor(Math.min(...prices));
          const max = Math.ceil(Math.max(...prices));
          setMinPrice(min);
          setMaxPrice(max);
          setSelectedMinPrice(min);
          setSelectedMaxPrice(max);
        }
      } else {
        setMinPrice(0);
        setMaxPrice(0);
        setSelectedMinPrice(0);
        setSelectedMaxPrice(0);
      }
    } catch (error) {
      console.log('Error fetching discount products:', error);
      setProducts([]);
      setMinPrice(0);
      setMaxPrice(0);
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

  // Get empty state message based on selected sort or discount
  const getEmptyMessage = () => {
    if (selectedSort?.sort === 'featured') {
      return 'No featured products found';
    } else if (selectedSort?.sort === 'new_arrivals') {
      return 'No new arrivals found';
    } else if (selectedDiscount) {
      return `No products with ${selectedDiscount.title} discount`;
    }
    return 'No products available in this category';
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
        <TouchableOpacity 
          style={[styles.filterButton, showSortDropdown && styles.filterButtonActive]}
          onPress={() => {
            setShowSortDropdown(!showSortDropdown);
            setShowDiscountDropdown(false);
          }}
        >
          <Text style={styles.filterIcon}>↕️</Text>
          <Text style={styles.filterText}>Sort By</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, styles.filterButtonLast, showDiscountDropdown && styles.filterButtonActive]}
          onPress={() => {
            setShowDiscountDropdown(!showDiscountDropdown);
            setShowSortDropdown(false);
          }}
        >
          <Text style={styles.filterIcon}>🔻</Text>
          <Text style={styles.filterText}>Discount By</Text>
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

      {/* Discount Dropdown */}
      {showDiscountDropdown && (
        <View style={styles.sortDropdown}>
          {discountOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.sortOption,
                selectedDiscount?.discount_percentage_id === option.discount_percentage_id && styles.sortOptionActive
              ]}
              onPress={() => handleDiscountSelect(option)}
            >
              <Text style={[
                styles.sortOptionText,
                selectedDiscount?.discount_percentage_id === option.discount_percentage_id && styles.sortOptionTextActive
              ]}>
                {option.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Price Range Slider */}
      {showPriceSlider && minPrice < maxPrice && (
        <View style={styles.priceSliderContainer}>
          <View style={styles.priceHeader}>
            <Text style={styles.priceLabel}>Price Range:</Text>
            <Text style={styles.priceValue}>₹{selectedMinPrice} - ₹{selectedMaxPrice}</Text>
          </View>
          <RangeSlider
            style={styles.slider}
            min={minPrice}
            max={maxPrice}
            step={1}
            low={selectedMinPrice}
            high={selectedMaxPrice}
            onValueChanged={handlePriceChange}
            renderThumb={Thumb}
            renderRail={Rail}
            renderRailSelected={RailSelected}
          />
        </View>
      )}

      {/* Breadcrumb */}
      {renderBreadcrumb()}

      {/* Products Count */}
      {filteredProducts.length > 0 && (
        <View style={styles.countBar}>
          <Text style={styles.countText}>{filteredProducts.length} Products Found</Text>
        </View>
      )}

      {/* Products List */}
      {filteredProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🛍️</Text>
          <Text style={styles.emptyTitle}>{getEmptyMessage()}</Text>
          <Text style={styles.emptyText}>
            Please check back later or browse other categories.
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
          data={filteredProducts}
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
    flexDirection: 'row',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: '#F0F4F8',
  },
  filterButtonLast: {
    borderRightWidth: 0,
  },
  filterIcon: {
    fontSize: 14,
  },
  filterText: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
  },
  sortDropdown: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
    paddingVertical: 8,
  },
  sortOption: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  sortOptionActive: {
    backgroundColor: '#F0F4F8',
  },
  sortOptionText: {
    fontSize: 14,
    color: '#333333',
  },
  sortOptionTextActive: {
    color: THEME_COLOR,
    fontWeight: '600',
  },
  priceSliderContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  priceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  priceValue: {
    fontSize: 14,
    color: THEME_COLOR,
    fontWeight: '600',
  },
  slider: {
    height: 40,
  },
  thumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: THEME_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  thumbLine: {
    width: 10,
    height: 2,
    backgroundColor: THEME_COLOR,
  },
  rail: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
  },
  railSelected: {
    height: 4,
    backgroundColor: THEME_COLOR,
    borderRadius: 2,
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
