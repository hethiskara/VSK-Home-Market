import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import Header from '../components/Header';
import Drawer from '../components/Drawer';
import BannerCarousel from '../components/BannerCarousel';
import { homeAPI } from '../services/api';

const ProductCard = ({ product, onPress }) => {
  const discountPercent = product.percentage?.replace(/[()]/g, '') || '';
  
  return (
    <TouchableOpacity style={styles.productCard} onPress={onPress} activeOpacity={0.7}>
      <Image
        source={{ uri: product.productimage }}
        style={styles.productImage}
        resizeMode="cover"
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {product.productname}
        </Text>
        <Text style={styles.productCode}>Code : {product.productcode}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.mrp}>Rs. {product.mrp}</Text>
          <Text style={styles.price}>Rs. {product.productprice}</Text>
        </View>
        {discountPercent ? (
          <Text style={styles.discount}>{discountPercent}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

const HomeScreen = ({ navigation }) => {
  const [banners, setBanners] = useState([]);
  const [topSellers, setTopSellers] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch banners
      const bannerResponse = await homeAPI.getBanners();
      if (bannerResponse.status && bannerResponse.data?.products) {
        setBanners(bannerResponse.data.products);
      }

      // Fetch top sellers (regular + garments)
      const [topRegular, topGarments] = await Promise.all([
        homeAPI.getTopSellersRegular(),
        homeAPI.getTopSellersGarments(),
      ]);
      
      const regularProducts = Array.isArray(topRegular) ? topRegular : [];
      const garmentsProducts = Array.isArray(topGarments) ? topGarments : [];
      setTopSellers([...regularProducts, ...garmentsProducts]);

      // Fetch featured products (regular + garments)
      const [featuredRegular, featuredGarments] = await Promise.all([
        homeAPI.getFeaturedRegular(),
        homeAPI.getFeaturedGarments(),
      ]);
      
      const featuredRegularProducts = Array.isArray(featuredRegular) ? featuredRegular : [];
      const featuredGarmentsProducts = Array.isArray(featuredGarments) ? featuredGarments : [];
      setFeaturedProducts([...featuredRegularProducts, ...featuredGarmentsProducts]);

    } catch (error) {
      console.log('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const renderProductItem = ({ item }) => (
    <ProductCard 
      product={item} 
      onPress={() => navigation.navigate('ProductDetail', { productCode: item.productcode })}
    />
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header onMenuPress={() => setDrawerVisible(true)} />
      
      <Drawer 
        visible={drawerVisible} 
        onClose={() => setDrawerVisible(false)}
        navigation={navigation}
      />
      
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF6B35']}
            tintColor="#FF6B35"
          />
        }
      >
        <BannerCarousel banners={banners} />

        {/* Top Sellers Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top sellers of the day</Text>
            <TouchableOpacity>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          {topSellers.length > 0 ? (
            <FlatList
              data={topSellers}
              renderItem={renderProductItem}
              keyExtractor={(item, index) => `top-${item.id}-${index}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.productList}
            />
          ) : (
            <View style={styles.productPlaceholder}>
              <Text style={styles.placeholderText}>No products available</Text>
            </View>
          )}
        </View>

        {/* Featured Products Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Feature Products of the Day</Text>
            <TouchableOpacity>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          {featuredProducts.length > 0 ? (
            <FlatList
              data={featuredProducts}
              renderItem={renderProductItem}
              keyExtractor={(item, index) => `featured-${item.id}-${index}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.productList}
            />
          ) : (
            <View style={styles.productPlaceholder}>
              <Text style={styles.placeholderText}>No products available</Text>
            </View>
          )}
        </View>

        {/* Footer spacing */}
        <View style={styles.footerSpace} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E8E8E8',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  viewAll: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
  },
  productList: {
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  productCard: {
    width: 150,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 6,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  productImage: {
    width: '100%',
    height: 130,
    backgroundColor: '#F8F8F8',
  },
  productInfo: {
    padding: 8,
  },
  productName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333333',
    height: 36,
    lineHeight: 18,
  },
  productCode: {
    fontSize: 11,
    color: '#666666',
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  mrp: {
    fontSize: 12,
    color: '#999999',
    textDecorationLine: 'line-through',
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2196F3',
  },
  discount: {
    fontSize: 11,
    color: '#4CAF50',
    marginTop: 2,
  },
  productPlaceholder: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 14,
    color: '#999',
  },
  footerSpace: {
    height: 40,
  },
});

export default HomeScreen;
