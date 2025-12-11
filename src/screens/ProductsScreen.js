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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { productAPI } from '../services/api';

const { width } = Dimensions.get('window');

const ProductsScreen = ({ navigation, route }) => {
  const { sectionId, sectionTitle, categoryId, categoryTitle, subcategoryId, subcategoryTitle, showAll, pageTitle } = route.params || {};
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

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
      setProducts(Array.isArray(response) ? response : []);
    } catch (error) {
      console.log('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
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
    <View style={styles.productCard}>
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
          <Text style={styles.price}>₹ {item.productprice}</Text>
          {item.mrp && item.mrp !== item.productprice && (
            <Text style={styles.oldPrice}>₹ {item.mrp}</Text>
          )}
          {item.percentage && (
            <Text style={styles.discount}>{item.percentage}</Text>
          )}
        </View>
      </View>
    </View>
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

      {/* Breadcrumb */}
      {renderBreadcrumb()}

      {/* Products List */}
      {products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No products found</Text>
        </View>
      ) : (
        <FlatList
          data={products}
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
    gap: 8,
    flexWrap: 'wrap',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#C0392B',
  },
  oldPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
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
});

export default ProductsScreen;
