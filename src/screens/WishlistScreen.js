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
  Alert,
} from 'react-native';
import { wishlistAPI, tokenManager } from '../services/api';

const { width } = Dimensions.get('window');
const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;
const THEME_COLOR = '#2C4A6B';

const WishlistScreen = ({ navigation }) => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const userData = await tokenManager.getUserData();
      if (!userData || !userData.userid) {
        Alert.alert('Login Required', 'Please login to view your wishlist', [
          { text: 'Login', onPress: () => navigation.replace('Login') },
          { text: 'Cancel', onPress: () => navigation.goBack() },
        ]);
        return;
      }

      const response = await wishlistAPI.getWishlist(userData.userid);
      if (Array.isArray(response)) {
        setWishlistItems(response);
      } else {
        setWishlistItems([]);
      }
    } catch (error) {
      console.log('Error fetching wishlist:', error);
      setWishlistItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchWishlist();
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
      <Text style={styles.headerTitle}>My Wishlist</Text>
      <View style={styles.headerRight} />
    </View>
  );

  const renderWishlistItem = ({ item, index }) => (
    <View style={styles.itemCard}>
      <Image
        source={{ uri: item.productimage }}
        style={styles.productImage}
        resizeMode="cover"
      />
      <View style={styles.itemDetails}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.product_name}
        </Text>
        
        <View style={styles.sizeRow}>
          <Text style={styles.sizeLabel}>Size:</Text>
          <Text style={styles.sizeValue}>{item.size || 'N/A'}</Text>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.price}>₹{item.productprice}</Text>
          <Text style={styles.total}>Total: ₹{item.total}</Text>
        </View>

        <View style={styles.stockRow}>
          <View style={[
            styles.stockBadge,
            { backgroundColor: item.qty === 'In Stock' ? '#E8F5E9' : '#FFEBEE' }
          ]}>
            <Text style={[
              styles.stockText,
              { color: item.qty === 'In Stock' ? '#27AE60' : '#E74C3C' }
            ]}>
              {item.qty}
            </Text>
          </View>
        </View>

        <View style={styles.taxDiscountRow}>
          <Text style={styles.taxText}>Tax: {item.tax}</Text>
          <Text style={styles.discountText}>Discount: {item.discount}</Text>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Text style={styles.emptyIconText}>❤️</Text>
      </View>
      <Text style={styles.emptyTitle}>Your Wishlist is Empty</Text>
      <Text style={styles.emptyText}>
        Save your favorite products here.{'\n'}Start browsing and add items you love!
      </Text>
      <TouchableOpacity
        style={styles.shopButton}
        onPress={() => navigation.navigate('Home')}
        activeOpacity={0.8}
      >
        <Text style={styles.shopButtonText}>Browse Products</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={THEME_COLOR} />
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME_COLOR} />
          <Text style={styles.loadingText}>Loading your wishlist...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME_COLOR} />
      {renderHeader()}

      {wishlistItems.length > 0 && (
        <View style={styles.countBar}>
          <Text style={styles.countText}>
            {wishlistItems.length} {wishlistItems.length === 1 ? 'Item' : 'Items'} in Wishlist
          </Text>
        </View>
      )}

      <FlatList
        data={wishlistItems}
        renderItem={renderWishlistItem}
        keyExtractor={(item, index) => `wishlist-${index}`}
        contentContainerStyle={wishlistItems.length === 0 ? styles.emptyList : styles.listContainer}
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
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    minWidth: 70,
  },
  countBar: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  countText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 16,
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
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: 'row',
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
    width: 120,
    height: 140,
    backgroundColor: '#F8F8F8',
  },
  itemDetails: {
    flex: 1,
    padding: 12,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
    lineHeight: 20,
  },
  sizeRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  sizeLabel: {
    fontSize: 13,
    color: '#666666',
    marginRight: 4,
  },
  sizeValue: {
    fontSize: 13,
    color: '#333333',
    fontWeight: '500',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME_COLOR,
  },
  total: {
    fontSize: 13,
    color: '#666666',
  },
  stockRow: {
    marginBottom: 8,
  },
  stockBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stockText: {
    fontSize: 12,
    fontWeight: '600',
  },
  taxDiscountRow: {
    flexDirection: 'row',
    gap: 12,
  },
  taxText: {
    fontSize: 12,
    color: '#666666',
  },
  discountText: {
    fontSize: 12,
    color: '#27AE60',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    paddingBottom: 100,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyIconText: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  shopButton: {
    backgroundColor: THEME_COLOR,
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 8,
    ...Platform.select({
      ios: {
        shadowColor: THEME_COLOR,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  shopButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default WishlistScreen;

