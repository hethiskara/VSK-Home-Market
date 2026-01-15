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
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { searchAPI } from '../services/api';

const { width } = Dimensions.get('window');

const SearchResultsScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { type, label, searchQuery } = route.params;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSearchResults();
  }, [type, label]);

  const fetchSearchResults = async () => {
    try {
      setLoading(true);
      const response = await searchAPI.searchProducts(type, label);
      console.log('SEARCH RESULTS:', response);
      
      if (Array.isArray(response)) {
        // Filter out invalid products
        const validProducts = response.filter(
          p => p && p.productcode && p.productname && p.productprice
        );
        setProducts(validProducts);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.log('Error fetching search results:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProductPress = (product) => {
    // Determine if it's a garment product based on productcode pattern
    const isGarment = product.productcode?.includes('SAG') || type.includes('garment');
    
    if (isGarment) {
      navigation.navigate('GarmentProductDetail', { productCode: product.productcode });
    } else {
      navigation.navigate('ProductDetail', { 
        productCode: product.productcode,
        productType: 'regular'
      });
    }
  };

  const renderProduct = ({ item }) => {
    const discount = item.percentage || '';
    
    return (
      <TouchableOpacity 
        style={styles.productCard}
        onPress={() => handleProductPress(item)}
      >
        <Image 
          source={{ uri: item.productimage }} 
          style={styles.productImage}
          resizeMode="cover"
        />
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>{item.productname}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>Rs. {item.productprice}</Text>
            {item.mrp && parseFloat(item.mrp) > parseFloat(item.productprice) && (
              <Text style={styles.mrp}>Rs. {item.mrp}</Text>
            )}
          </View>
          {discount && (
            <Text style={styles.discount}>{discount}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const getTitle = () => {
    if (searchQuery) return `Results for "${searchQuery}"`;
    return `Search Results: ${label}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{getTitle()}</Text>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a4a7c" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyText}>No products found</Text>
          <Text style={styles.emptySubtext}>Try a different search term</Text>
        </View>
      ) : (
        <>
          <View style={styles.countContainer}>
            <Text style={styles.countText}>{products.length} product(s) found</Text>
          </View>
          <FlatList
            data={products}
            renderItem={renderProduct}
            keyExtractor={(item, index) => item.productcode?.toString() || `product-${index}`}
            numColumns={2}
            contentContainerStyle={styles.productList}
            columnWrapperStyle={styles.row}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1a4a7c',
  },
  backButton: {
    padding: 4,
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginHorizontal: 10,
  },
  placeholder: {
    width: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
  },
  countContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  countText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  productList: {
    padding: 8,
  },
  row: {
    justifyContent: 'space-between',
  },
  productCard: {
    width: (width - 32) / 2 - 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  productImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#F0F0F0',
  },
  productInfo: {
    padding: 10,
  },
  productName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
    lineHeight: 18,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a4a7c',
  },
  mrp: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  discount: {
    fontSize: 12,
    color: '#27AE60',
    fontWeight: '600',
    marginTop: 4,
  },
});

export default SearchResultsScreen;

