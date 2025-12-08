import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  Dimensions,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tokenManager, productAPI } from '../services/api';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.85;

const Drawer = ({ visible, onClose, navigation }) => {
  const [sections, setSections] = useState([]);
  const [expandedSection, setExpandedSection] = useState(null);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [categories, setCategories] = useState({});
  const [subcategories, setSubcategories] = useState({});
  const [loading, setLoading] = useState({});
  const slideAnim = useState(new Animated.Value(-DRAWER_WIDTH))[0];

  useEffect(() => {
    if (visible) {
      fetchSections();
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -DRAWER_WIDTH,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const fetchSections = async () => {
    try {
      const response = await productAPI.getSections();
      setSections(Array.isArray(response) ? response : []);
    } catch (error) {
      console.log('Error fetching sections:', error);
    }
  };

  const fetchCategories = async (sectionId) => {
    if (categories[sectionId]) return;
    
    setLoading(prev => ({ ...prev, [`cat_${sectionId}`]: true }));
    try {
      const response = await productAPI.getCategories(sectionId);
      const validCategories = Array.isArray(response) ? response.filter(item => item.id !== '0') : [];
      setCategories(prev => ({ ...prev, [sectionId]: validCategories }));
    } catch (error) {
      console.log('Error fetching categories:', error);
    } finally {
      setLoading(prev => ({ ...prev, [`cat_${sectionId}`]: false }));
    }
  };

  const fetchSubcategories = async (sectionId, categoryId) => {
    const key = `${sectionId}_${categoryId}`;
    if (subcategories[key]) return;
    
    setLoading(prev => ({ ...prev, [`sub_${key}`]: true }));
    try {
      const response = await productAPI.getSubcategories(sectionId, categoryId);
      setSubcategories(prev => ({ ...prev, [key]: Array.isArray(response) ? response : [] }));
    } catch (error) {
      console.log('Error fetching subcategories:', error);
    } finally {
      setLoading(prev => ({ ...prev, [`sub_${key}`]: false }));
    }
  };

  const handleSectionPress = (section) => {
    if (expandedSection === section.id) {
      setExpandedSection(null);
      setExpandedCategory(null);
    } else {
      setExpandedSection(section.id);
      setExpandedCategory(null);
      fetchCategories(section.id);
    }
  };

  const handleCategoryPress = (sectionId, category) => {
    const key = `${sectionId}_${category.id}`;
    if (expandedCategory === key) {
      setExpandedCategory(null);
    } else {
      setExpandedCategory(key);
      fetchSubcategories(sectionId, category.id);
    }
  };

  const handleSubcategoryPress = (sectionId, sectionTitle, categoryId, categoryTitle, subcategory) => {
    onClose();
    navigation.navigate('Products', {
      sectionId,
      sectionTitle,
      categoryId,
      categoryTitle,
      subcategoryId: subcategory.id,
      subcategoryTitle: subcategory.subcategorytitle || subcategory.title,
    });
  };

  const handleMenuPress = async (action, screen) => {
    onClose();
    
    if (action === 'logout') {
      await tokenManager.clearAll();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } else if (screen) {
      navigation.navigate(screen);
    }
  };

  const renderSubcategories = (sectionId, sectionTitle, categoryId, categoryTitle) => {
    const key = `${sectionId}_${categoryId}`;
    const subs = subcategories[key] || [];
    const isLoading = loading[`sub_${key}`];

    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#FFFFFF" />
        </View>
      );
    }

    return subs.map((sub) => (
      <TouchableOpacity
        key={sub.id}
        style={styles.subcategoryItem}
        onPress={() => handleSubcategoryPress(sectionId, sectionTitle, categoryId, categoryTitle, sub)}
      >
        <Text style={styles.subcategoryLabel}>{sub.subcategorytitle || sub.title}</Text>
      </TouchableOpacity>
    ));
  };

  const renderCategories = (section) => {
    const cats = categories[section.id] || [];
    const isLoading = loading[`cat_${section.id}`];

    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#FFFFFF" />
        </View>
      );
    }

    return cats.map((cat) => {
      const key = `${section.id}_${cat.id}`;
      const isExpanded = expandedCategory === key;

      return (
        <View key={cat.id}>
          <TouchableOpacity
            style={styles.categoryItem}
            onPress={() => handleCategoryPress(section.id, cat)}
          >
            <Text style={styles.categoryLabel}>{cat.title}</Text>
            <Text style={styles.arrow}>{isExpanded ? '∨' : '›'}</Text>
          </TouchableOpacity>
          
          {isExpanded && renderSubcategories(section.id, section.title, cat.id, cat.title)}
        </View>
      );
    });
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={onClose}
        />
        <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
          <SafeAreaView style={styles.container} edges={['top']}>
            {/* Close Button */}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeIcon}>×</Text>
            </TouchableOpacity>

            {/* Logo */}
            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/Logos/app-icon.jpg')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            {/* Menu Items */}
            <ScrollView style={styles.menuContainer} showsVerticalScrollIndicator={false}>
              {/* Home */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleMenuPress(null, 'Home')}
              >
                <Text style={styles.menuLabel}>Home</Text>
              </TouchableOpacity>

              {/* Dynamic Sections (Pickles, Garments, etc.) */}
              {sections.map((section) => {
                const isExpanded = expandedSection === section.id;

                return (
                  <View key={section.id}>
                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={() => handleSectionPress(section)}
                    >
                      <Text style={styles.menuLabel}>{section.title}</Text>
                      <Text style={styles.arrow}>{isExpanded ? '∨' : '›'}</Text>
                    </TouchableOpacity>
                    
                    {isExpanded && renderCategories(section)}
                  </View>
                );
              })}

              {/* Divider */}
              <View style={styles.divider} />

              {/* My Account */}
              <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress(null, 'Account')}>
                <Text style={styles.menuLabel}>My Account</Text>
              </TouchableOpacity>

              {/* Order Status */}
              <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress(null, 'Orders')}>
                <Text style={styles.menuLabel}>Order Status</Text>
              </TouchableOpacity>

              {/* Logout */}
              <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress('logout')}>
                <Text style={styles.menuLabel}>Logout</Text>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.divider} />

              {/* About Us */}
              <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress(null, 'AboutUs')}>
                <Text style={styles.menuLabel}>About Us</Text>
              </TouchableOpacity>

              {/* Contact Us */}
              <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress(null, 'ContactUs')}>
                <Text style={styles.menuLabel}>Contact Us</Text>
              </TouchableOpacity>

              {/* Resources */}
              <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress(null, 'Resources')}>
                <Text style={styles.menuLabel}>Resources</Text>
              </TouchableOpacity>

              {/* View all Offers */}
              <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress(null, 'Offers')}>
                <Text style={styles.menuLabel}>View all Offers</Text>
              </TouchableOpacity>

              {/* Feedback */}
              <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress(null, 'Feedback')}>
                <Text style={styles.menuLabel}>Feedback</Text>
              </TouchableOpacity>

              <View style={{ height: 40 }} />
            </ScrollView>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  drawer: {
    width: DRAWER_WIDTH,
    backgroundColor: '#2C4A6B',
    height: '100%',
  },
  container: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 16,
    zIndex: 10,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: '300',
  },
  logoContainer: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  logo: {
    width: 120,
    height: 100,
  },
  menuContainer: {
    flex: 1,
    paddingTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  menuLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  arrow: {
    fontSize: 18,
    color: '#FFFFFF',
    opacity: 0.6,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingLeft: 36,
    paddingRight: 20,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  categoryLabel: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '400',
  },
  subcategoryItem: {
    paddingVertical: 11,
    paddingLeft: 52,
    paddingRight: 20,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  subcategoryLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '400',
  },
  divider: {
    height: 12,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
  },
});

export default Drawer;
