import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { offersAPI } from '../services/api';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;
const THEME_COLOR = '#2C4A6B';
const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 24;

const OfferDetailScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { discountId, title } = route.params;
  const [activeTab, setActiveTab] = useState('regular');
  const [regularProducts, setRegularProducts] = useState([]);
  const [garmentProducts, setGarmentProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      // Fetch both regular and garment products in parallel
      const [regularRes, garmentRes] = await Promise.all([
        offersAPI.getRegularOfferDetails(discountId),
        offersAPI.getGarmentOfferDetails(discountId),
      ]);

      if (Array.isArray(regularRes)) {
        setRegularProducts(regularRes);
      }
      if (Array.isArray(garmentRes)) {
        setGarmentProducts(garmentRes);
      }
    } catch (error) {
      console.log('Error fetching offer products:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const handleProductPress = (product) => {
    if (activeTab === 'regular') {
      navigation.navigate('ProductDetail', {
        productCode: product.productcode,
        productName: product.productname,
        productType: 'regular',
      });
    } else {
      navigation.navigate('GarmentProductDetail', {
        productCode: product.productcode,
        productName: product.productname,
      });
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
      <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
      <View style={styles.headerRight} />
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'regular' && styles.activeTab]}
        onPress={() => setActiveTab('regular')}
        activeOpacity={0.7}
      >
        <Text style={[styles.tabText, activeTab === 'regular' && styles.activeTabText]}>
          Regular Products
        </Text>
        {regularProducts.length > 0 && (
          <View style={[styles.tabBadge, activeTab === 'regular' && styles.activeTabBadge]}>
            <Text style={[styles.tabBadgeText, activeTab === 'regular' && styles.activeTabBadgeText]}>
              {regularProducts.length}
            </Text>
          </View>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.tab, activeTab === 'garment' && styles.activeTab]}
        onPress={() => setActiveTab('garment')}
        activeOpacity={0.7}
      >
        <Text style={[styles.tabText, activeTab === 'garment' && styles.activeTabText]}>
          Garment Products
        </Text>
        {garmentProducts.length > 0 && (
          <View style={[styles.tabBadge, activeTab === 'garment' && styles.activeTabBadge]}>
            <Text style={[styles.tabBadgeText, activeTab === 'garment' && styles.activeTabBadgeText]}>
              {garmentProducts.length}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderProductCard = ({ item }) => {
    const discountPercent = item.percentage?.replace(/[()]/g, '') || '';
    
    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => handleProductPress(item)}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: item.productimage }}
          style={styles.productImage}
          resizeMode="cover"
        />
        {discountPercent && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discountPercent}</Text>
          </View>
        )}
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.productname}
          </Text>
          <Text style={styles.productCode}>Code: {item.productcode}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{item.productprice}</Text>
            <Text style={styles.mrp}>₹{item.mrp}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📦</Text>
      <Text style={styles.emptyTitle}>No Products Found</Text>
      <Text style={styles.emptyText}>
        {activeTab === 'regular' 
          ? 'No regular products available for this offer'
          : 'No garment products available for this offer'}
      </Text>
    </View>
  );

  const currentProducts = activeTab === 'regular' ? regularProducts : garmentProducts;

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={THEME_COLOR} />
        {renderHeader()}
        {renderTabs()}
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
      {renderTabs()}

      <FlatList
        data={currentProducts}
        renderItem={renderProductCard}
        keyExtractor={(item, index) => `${item.productcode}-${index}`}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={currentProducts.length === 0 ? styles.emptyList : styles.listContainer}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[THEME_COLOR]}
            tintColor={THEME_COLOR}
          />
        }
        showsVerticalScrollIndicator={false}
      />
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
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  headerRight: {
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
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: THEME_COLOR,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#888888',
  },
  activeTabText: {
    color: THEME_COLOR,
    fontWeight: '600',
  },
  tabBadge: {
    backgroundColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 6,
  },
  activeTabBadge: {
    backgroundColor: THEME_COLOR,
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666666',
  },
  activeTabBadgeText: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#666666',
    fontSize: 14,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyList: {
    flexGrow: 1,
  },
  row: {
    justifyContent: 'space-between',
  },
  productCard: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
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
  productImage: {
    width: '100%',
    height: CARD_WIDTH,
    backgroundColor: '#F0F0F0',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#E74C3C',
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
    padding: 12,
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333333',
    lineHeight: 18,
    marginBottom: 4,
    height: 36,
  },
  productCode: {
    fontSize: 11,
    color: '#888888',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME_COLOR,
    marginRight: 8,
  },
  mrp: {
    fontSize: 12,
    color: '#999999',
    textDecorationLine: 'line-through',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
});

export default OfferDetailScreen;

