import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { productAPI } from '../services/api';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

const ProductsScreen = ({ navigation, route }) => {
  const { sectionId, sectionTitle, categoryId, categoryTitle, subcategoryId, subcategoryTitle } = route.params || {};
  
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [screenType, setScreenType] = useState('sections'); // sections, categories, subcategories, products

  useEffect(() => {
    fetchData();
  }, [sectionId, categoryId, subcategoryId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (subcategoryId) {
        // Fetch products
        setScreenType('products');
        const response = await productAPI.getProducts(sectionId, categoryId, subcategoryId);
        setData(Array.isArray(response) ? response : response.data || []);
      } else if (categoryId) {
        // Fetch subcategories
        setScreenType('subcategories');
        const response = await productAPI.getSubcategories(sectionId, categoryId);
        setData(Array.isArray(response) ? response : []);
      } else if (sectionId) {
        // Fetch categories
        setScreenType('categories');
        const response = await productAPI.getCategories(sectionId);
        setData(Array.isArray(response) ? response.filter(item => item.id !== '0') : []);
      } else {
        // Fetch sections
        setScreenType('sections');
        const response = await productAPI.getSections();
        setData(Array.isArray(response) ? response : []);
      }
    } catch (error) {
      console.log('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    if (subcategoryTitle) return subcategoryTitle;
    if (categoryTitle) return categoryTitle;
    if (sectionTitle) return sectionTitle;
    return 'Products';
  };

  const handleItemPress = (item) => {
    if (screenType === 'sections') {
      navigation.push('Products', {
        sectionId: item.id,
        sectionTitle: item.title,
      });
    } else if (screenType === 'categories') {
      navigation.push('Products', {
        sectionId,
        sectionTitle,
        categoryId: item.id,
        categoryTitle: item.title,
      });
    } else if (screenType === 'subcategories') {
      navigation.push('Products', {
        sectionId,
        sectionTitle,
        categoryId,
        categoryTitle,
        subcategoryId: item.id,
        subcategoryTitle: item.subcategorytitle || item.title,
      });
    } else if (screenType === 'products') {
      // Navigate to product detail (when API available)
      console.log('Product selected:', item);
    }
  };

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={() => handleItemPress(item)}
      activeOpacity={0.7}
    >
      {item.image && (
        <Image source={{ uri: item.image }} style={styles.categoryImage} resizeMode="cover" />
      )}
      <View style={styles.categoryContent}>
        <Text style={styles.categoryTitle} numberOfLines={2}>
          {item.subcategorytitle || item.title}
        </Text>
        {screenType !== 'products' && (
          <Text style={styles.viewMore}>View →</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderProductItem = ({ item }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => handleItemPress(item)}
      activeOpacity={0.7}
    >
      {item.image && (
        <Image source={{ uri: item.image }} style={styles.productImage} resizeMode="cover" />
      )}
      <View style={styles.productContent}>
        <Text style={styles.productTitle} numberOfLines={2}>
          {item.title || item.name || item.product_name}
        </Text>
        {item.code && (
          <Text style={styles.productCode}>Code: {item.code}</Text>
        )}
        {(item.price || item.selling_price) && (
          <View style={styles.priceContainer}>
            {item.mrp && item.mrp !== item.selling_price && (
              <Text style={styles.oldPrice}>Rs. {item.mrp}</Text>
            )}
            <Text style={styles.price}>Rs. {item.selling_price || item.price}</Text>
          </View>
        )}
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
        <Text style={styles.headerTitle} numberOfLines={1}>{getTitle()}</Text>
        <View style={styles.placeholder} />
      </View>

      {data.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No items found</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          renderItem={screenType === 'products' ? renderProductItem : renderCategoryItem}
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
          numColumns={2}
          columnWrapperStyle={styles.row}
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
  listContent: {
    padding: 16,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  categoryCard: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  categoryImage: {
    width: '100%',
    height: 100,
    backgroundColor: '#F0F0F0',
  },
  categoryContent: {
    padding: 12,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  viewMore: {
    fontSize: 12,
    color: '#3498DB',
  },
  productCard: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#F0F0F0',
  },
  productContent: {
    padding: 12,
  },
  productTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  productCode: {
    fontSize: 11,
    color: '#7F8C8D',
    marginBottom: 6,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  oldPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  price: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FF6B35',
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

