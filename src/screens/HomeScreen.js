import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import Header from '../components/Header';
import BannerCarousel from '../components/BannerCarousel';
import { homeAPI } from '../services/api';

const HomeScreen = ({ navigation }) => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const bannerResponse = await homeAPI.getBanners();
      if (bannerResponse.status && bannerResponse.data?.products) {
        setBanners(bannerResponse.data.products);
      }
    } catch (error) {
      console.log('Error fetching banners:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header navigation={navigation} />
      
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
            <Text style={styles.viewAll}>View All »</Text>
          </View>
          <View style={styles.productPlaceholder}>
            <Text style={styles.placeholderText}>Products loading...</Text>
          </View>
        </View>

        {/* Featured Products Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Feature Products of the Day</Text>
            <Text style={styles.viewAll}>View All »</Text>
          </View>
          <View style={styles.productPlaceholder}>
            <Text style={styles.placeholderText}>Products loading...</Text>
          </View>
        </View>

        {/* Latest Products Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Latest Products</Text>
            <Text style={styles.viewAll}>View All »</Text>
          </View>
          <View style={styles.productPlaceholder}>
            <Text style={styles.placeholderText}>Products loading...</Text>
          </View>
        </View>

        {/* Best Selling Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Best Selling Products</Text>
            <Text style={styles.viewAll}>View All »</Text>
          </View>
          <View style={styles.productPlaceholder}>
            <Text style={styles.placeholderText}>Products loading...</Text>
          </View>
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
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  viewAll: {
    fontSize: 14,
    color: '#3498DB',
    fontWeight: '500',
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
