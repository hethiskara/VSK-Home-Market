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
  Modal,
} from 'react-native';
import { garmentAPI, sortAPI } from '../services/api';
import RangeSlider from "react-native-sticky-range-slider";

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
    productTypeTitle,
    sectionId
  } = route.params || {};
  
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSortModal, setShowSortModal] = useState(false);
  const [sortOptions, setSortOptions] = useState([]);
  const [selectedSort, setSelectedSort] = useState(null);
  const [showPriceSlider, setShowPriceSlider] = useState(false);
  const [selectedMinPrice, setSelectedMinPrice] = useState(0);
  const [selectedMaxPrice, setSelectedMaxPrice] = useState(10000);

  useEffect(() => {
    fetchProducts();
    fetchSortOptions();
  }, [subcategoryId, categoryId, productTypeId]);

  const fetchSortOptions = async () => {
    try {
      const response = await sortAPI.getSortOptions();
      if (Array.isArray(response)) {
        setSortOptions(response);
      }
    } catch (error) {
      console.log('Error fetching sort options:', error);
    }
  };

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
      setAllProducts(validProducts);
      
      // Set price range based on products
      if (validProducts.length > 0) {
        const prices = validProducts.map(p => parseFloat(p.productprice) || 0);
        const min = Math.floor(Math.min(...prices));
        const max = Math.ceil(Math.max(...prices));
        setSelectedMinPrice(min);
        setSelectedMaxPrice(max);
      }
    } catch (error) {
      console.log('Error fetching garment products:', error);
      setProducts([]);
      setAllProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate min/max prices from all products
  const { minPrice, maxPrice } = useMemo(() => {
    if (allProducts.length === 0) return { minPrice: 0, maxPrice: 10000 };
    const prices = allProducts.map(p => parseFloat(p.productprice) || 0);
    return {
      minPrice: Math.floor(Math.min(...prices)),
      maxPrice: Math.ceil(Math.max(...prices))
    };
  }, [allProducts]);

  // Filter products by price range
  const filteredProducts = useMemo(() => {
    if (!showPriceSlider) return products;
    return products.filter(p => {
      const price = parseFloat(p.productprice) || 0;
      return price >= selectedMinPrice && price <= selectedMaxPrice;
    });
  }, [products, selectedMinPrice, selectedMaxPrice, showPriceSlider]);

  const handlePriceChange = useCallback((low, high) => {
    setSelectedMinPrice(low);
    setSelectedMaxPrice(high);
  }, []);

  const handleSortSelect = async (option) => {
    setShowSortModal(false);
    
    if (option.id === 'custom_price') {
      setShowPriceSlider(true);
      setSelectedSort(option);
      setProducts(allProducts);
      return;
    }
    
    setShowPriceSlider(false);
    setSelectedSort(option);
    
    const sortType = option.title?.toLowerCase().replace(/\s+/g, '_');
    
    if (sortType === 'price:_low_to_high' || sortType === 'price_low_to_high') {
      await fetchProducts();
      const sorted = [...allProducts].sort((a, b) => 
        (parseFloat(a.productprice) || 0) - (parseFloat(b.productprice) || 0)
      );
      setProducts(sorted);
    } else if (sortType === 'price:_high_to_low' || sortType === 'price_high_to_low') {
      await fetchProducts();
      const sorted = [...allProducts].sort((a, b) => 
        (parseFloat(b.productprice) || 0) - (parseFloat(a.productprice) || 0)
      );
      setProducts(sorted);
    } else if (sortType === 'featured' || sortType === 'new_arrivals') {
      setLoading(true);
      setProducts([]);
      try {
        const actualSectionId = sectionId || subcategoryId || 1;
        const actualCategoryId = categoryId || 1;
        const actualSubcategoryId = productTypeId || 1;
        
        const response = await sortAPI.getSortedProducts(
          actualSectionId,
          actualCategoryId,
          actualSubcategoryId,
          sortType,
          true // isGarment = true
        );
        
        const productData = Array.isArray(response) 
          ? response.filter(item => item && item.productcode && item.productname && item.productprice)
          : [];
        setProducts(productData);
      } catch (error) {
        console.log('Error fetching sorted products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    } else {
      await fetchProducts();
    }
  };

  // Slider components
  const Thumb = (type) => (
    <View style={styles.thumb} />
  );
  const Rail = () => <View style={styles.rail} />;
  const RailSelected = () => <View style={styles.railSelected} />;
  const Label = (value) => (
    <View style={styles.sliderLabel}>
      <Text style={styles.sliderLabelText}>₹{value}</Text>
    </View>
  );

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
          style={styles.filterButton}
          onPress={() => setShowSortModal(true)}
        >
          <Text style={styles.filterText}>↕ Sort By</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterButton, styles.filterButtonLast]}>
          <Text style={styles.filterText}>🔻 Filter</Text>
        </TouchableOpacity>
      </View>

      {/* Price Range Slider */}
      {showPriceSlider && allProducts.length > 0 && minPrice < maxPrice && (
        <View style={styles.priceFilterContainer}>
          <View style={styles.priceFilterHeader}>
            <Text style={styles.priceFilterLabel}>Price : </Text>
            <Text style={styles.priceRangeDisplay}>₹{selectedMinPrice} - ₹{selectedMaxPrice}</Text>
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
            renderLabel={Label}
          />
        </View>
      )}

      {/* Breadcrumb */}
      {renderBreadcrumb()}

      {/* Products Count - only show if products exist */}
      {filteredProducts.length > 0 && (
        <View style={styles.countBar}>
          <Text style={styles.countText}>{filteredProducts.length} Products Found</Text>
        </View>
      )}

      {/* Products List */}
      {filteredProducts.length === 0 && !loading ? (
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
          data={filteredProducts}
          renderItem={renderProductItem}
          keyExtractor={(item) => item.id?.toString() || item.productcode}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Sort Modal */}
      <Modal
        visible={showSortModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSortModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSortModal(false)}
        >
          <View style={styles.sortModalContent}>
            <Text style={styles.sortModalTitle}>Sort By</Text>
            {sortOptions.map((option, index) => (
              <TouchableOpacity
                key={option.id || index}
                style={[
                  styles.sortOption,
                  selectedSort?.id === option.id && styles.sortOptionSelected
                ]}
                onPress={() => handleSortSelect(option)}
              >
                <Text style={[
                  styles.sortOptionText,
                  selectedSort?.id === option.id && styles.sortOptionTextSelected
                ]}>
                  {option.title}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[
                styles.sortOption,
                selectedSort?.id === 'custom_price' && styles.sortOptionSelected
              ]}
              onPress={() => handleSortSelect({ id: 'custom_price', title: 'Custom Price Range' })}
            >
              <Text style={[
                styles.sortOptionText,
                selectedSort?.id === 'custom_price' && styles.sortOptionTextSelected
              ]}>
                Custom Price Range
              </Text>
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
  // Sort Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 300,
  },
  sortModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: THEME_COLOR,
    marginBottom: 16,
    textAlign: 'center',
  },
  sortOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F5F5F5',
  },
  sortOptionSelected: {
    backgroundColor: THEME_COLOR,
  },
  sortOptionText: {
    fontSize: 14,
    color: '#333333',
    textAlign: 'center',
  },
  sortOptionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  // Price Slider Styles
  priceFilterContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  priceFilterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  priceFilterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  priceRangeDisplay: {
    fontSize: 14,
    color: THEME_COLOR,
    fontWeight: '600',
  },
  slider: {
    marginVertical: 10,
  },
  thumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: THEME_COLOR,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  rail: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E0E0E0',
  },
  railSelected: {
    height: 6,
    backgroundColor: THEME_COLOR,
    borderRadius: 3,
  },
  sliderLabel: {
    position: 'absolute',
    top: -30,
    backgroundColor: THEME_COLOR,
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  sliderLabelText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default GarmentProductsScreen;

