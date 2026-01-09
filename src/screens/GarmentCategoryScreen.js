import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Platform,
  StatusBar,
  Dimensions,
} from 'react-native';
import { garmentAPI } from '../services/api';

const { width } = Dimensions.get('window');
const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;
const THEME_COLOR = '#2C4A6B';

const GarmentCategoryScreen = ({ navigation, route }) => {
  const { categoryId, categoryTitle } = route.params;
  const [subcategories, setSubcategories] = useState([]);
  const [productTypes, setProductTypes] = useState({});
  const [expandedSubcategory, setExpandedSubcategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingTypes, setLoadingTypes] = useState({});

  useEffect(() => {
    fetchSubcategories();
  }, []);

  const fetchSubcategories = async () => {
    try {
      const response = await garmentAPI.getSubcategories(categoryId);
      setSubcategories(Array.isArray(response) ? response : []);
    } catch (error) {
      console.log('Error fetching garment subcategories:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductTypes = async (subcategoryId) => {
    if (productTypes[subcategoryId]) return;

    setLoadingTypes(prev => ({ ...prev, [subcategoryId]: true }));
    try {
      // section_id is subcategory id for garments, category_id is from route
      const response = await garmentAPI.getProductTypes(subcategoryId, categoryId);
      setProductTypes(prev => ({ ...prev, [subcategoryId]: Array.isArray(response) ? response : [] }));
    } catch (error) {
      console.log('Error fetching garment product types:', error);
    } finally {
      setLoadingTypes(prev => ({ ...prev, [subcategoryId]: false }));
    }
  };

  const handleSubcategoryPress = (subcategory) => {
    if (expandedSubcategory === subcategory.id) {
      setExpandedSubcategory(null);
    } else {
      setExpandedSubcategory(subcategory.id);
      fetchProductTypes(subcategory.id);
    }
  };

  const handleProductTypePress = (subcategory, productType) => {
    navigation.navigate('GarmentProducts', {
      categoryId,
      categoryTitle,
      subcategoryId: subcategory.id,
      subcategoryTitle: subcategory.subcategorytitle,
      productTypeId: productType.id,
      productTypeTitle: productType.title,
    });
  };

  const handleViewAllPress = (subcategory) => {
    navigation.navigate('GarmentProducts', {
      categoryId,
      categoryTitle,
      subcategoryId: subcategory.id,
      subcategoryTitle: subcategory.subcategorytitle,
      viewAll: true,
    });
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
      <Text style={styles.headerTitle}>{categoryTitle}</Text>
      <View style={styles.headerRight} />
    </View>
  );

  const renderProductTypes = (subcategory) => {
    const types = productTypes[subcategory.id] || [];
    const isLoading = loadingTypes[subcategory.id];

    if (isLoading) {
      return (
        <View style={styles.typesLoadingContainer}>
          <ActivityIndicator size="small" color={THEME_COLOR} />
        </View>
      );
    }

    return (
      <View style={styles.productTypesContainer}>
        {/* View All Option */}
        <TouchableOpacity
          style={styles.viewAllItem}
          onPress={() => handleViewAllPress(subcategory)}
          activeOpacity={0.7}
        >
          <View style={styles.viewAllLeft}>
            <View style={styles.viewAllIconContainer}>
              <Text style={styles.viewAllIcon}>✦</Text>
            </View>
            <Text style={styles.viewAllText}>View All {subcategory.subcategorytitle}</Text>
          </View>
          <Text style={styles.viewAllArrow}>›</Text>
        </TouchableOpacity>

        {/* Product Types */}
        {types.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={styles.productTypeItem}
            onPress={() => handleProductTypePress(subcategory, type)}
            activeOpacity={0.7}
          >
            <Text style={styles.productTypeText}>{type.title}</Text>
            <Text style={styles.productTypeArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderSubcategoryItem = ({ item }) => {
    const isExpanded = expandedSubcategory === item.id;

    return (
      <View style={styles.subcategoryCard}>
        <TouchableOpacity
          style={styles.subcategoryHeader}
          onPress={() => handleSubcategoryPress(item)}
          activeOpacity={0.7}
        >
          <Text style={styles.subcategoryTitle}>{item.subcategorytitle}</Text>
          <View style={styles.expandIconContainer}>
            <Text style={styles.expandIcon}>{isExpanded ? '−' : '+'}</Text>
          </View>
        </TouchableOpacity>
        
        {isExpanded && renderProductTypes(item)}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={THEME_COLOR} />
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME_COLOR} />
          <Text style={styles.loadingText}>Loading categories...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME_COLOR} />
      {renderHeader()}

      <View style={styles.breadcrumb}>
        <Text style={styles.breadcrumbText}>
          Garments › {categoryTitle}
        </Text>
      </View>

      <FlatList
        data={subcategories}
        renderItem={renderSubcategoryItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No subcategories available</Text>
          </View>
        }
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
  breadcrumb: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  breadcrumbText: {
    fontSize: 13,
    color: '#666666',
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
  listContainer: {
    padding: 16,
  },
  subcategoryCard: {
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
  subcategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  subcategoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    flex: 1,
  },
  expandIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandIcon: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  typesLoadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  productTypesContainer: {
    backgroundColor: '#F8F9FA',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  productTypeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  productTypeText: {
    fontSize: 14,
    color: '#444444',
    flex: 1,
  },
  productTypeArrow: {
    fontSize: 18,
    color: THEME_COLOR,
    fontWeight: '600',
  },
  viewAllItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#E8F4FD',
    borderBottomWidth: 1,
    borderBottomColor: '#D0E8F9',
  },
  viewAllLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  viewAllIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: THEME_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  viewAllIcon: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME_COLOR,
    flex: 1,
  },
  viewAllArrow: {
    fontSize: 18,
    color: THEME_COLOR,
    fontWeight: '700',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666666',
  },
});

export default GarmentCategoryScreen;

