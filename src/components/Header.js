import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Image, 
  TouchableOpacity, 
  StyleSheet, 
  TextInput, 
  Text, 
  ImageBackground,
  Modal,
  ScrollView,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { searchAPI } from '../services/api';

const CART_STORAGE_KEY = '@vsk_cart';

const Header = ({ onMenuPress, navigation, showSearch = true }) => {
  const [cartCount, setCartCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  
  // Notification form states
  const [showNotifyForm, setShowNotifyForm] = useState(false);
  const [notifyName, setNotifyName] = useState('');
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifyPhone, setNotifyPhone] = useState('');
  const [notifySearchWord, setNotifySearchWord] = useState('');
  const [submittingNotify, setSubmittingNotify] = useState(false);

  useEffect(() => {
    loadCartCount();
    loadUserData();
    const interval = setInterval(loadCartCount, 1000);
    return () => clearInterval(interval);
  }, []);

  const loadCartCount = async () => {
    try {
      const cartData = await AsyncStorage.getItem(CART_STORAGE_KEY);
      if (cartData) {
        const items = JSON.parse(cartData);
        const count = items.reduce((total, item) => total + (item.quantity || 1), 0);
        setCartCount(count);
      } else {
        setCartCount(0);
      }
    } catch (error) {
      console.log('Error loading cart count:', error);
    }
  };

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsed = JSON.parse(userData);
        setNotifyName(`${parsed.firstname || ''} ${parsed.lastname || ''}`.trim());
        setNotifyEmail(parsed.email || '');
        setNotifyPhone(parsed.mobile_no || '');
      }
    } catch (error) {
      console.log('Error loading user data:', error);
    }
  };

  // Debounced search
  useEffect(() => {
    if (searchQuery.length >= 2) {
      const timeoutId = setTimeout(() => {
        fetchSuggestions(searchQuery);
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery]);

  const fetchSuggestions = async (query) => {
    try {
      setLoadingSuggestions(true);
      const response = await searchAPI.getAutoSuggestions(query);
      console.log('SEARCH SUGGESTIONS:', response);
      
      if (response?.status === 'success' && Array.isArray(response.results)) {
        setSuggestions(response.results);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.log('Error fetching suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleSuggestionPress = (suggestion) => {
    setShowSuggestions(false);
    Keyboard.dismiss();
    
    // If count is 0, show notification form immediately
    if (suggestion.count === 0 || suggestion.count === '0') {
      setNotifySearchWord(suggestion.label);
      setShowNotifyForm(true);
      setSearchQuery(''); // Clear search text
      return;
    }
    
    // Count > 0, navigate directly to search results
    navigation.navigate('SearchResults', {
      type: suggestion.type,
      label: suggestion.label,
      searchQuery: suggestion.label,
    });
    setSearchQuery(''); // Clear search text
    setSelectedSuggestion(null);
  };

  const handleGoPress = async () => {
    Keyboard.dismiss();
    setShowSuggestions(false);

    if (!searchQuery.trim()) {
      Alert.alert('Search', 'Please enter a search term');
      return;
    }

    // If a suggestion was selected, use its type
    if (selectedSuggestion) {
      // Check if count is 0 - show notification form
      if (selectedSuggestion.count === 0 || selectedSuggestion.count === '0') {
        setNotifySearchWord(selectedSuggestion.label);
        setShowNotifyForm(true);
        setSearchQuery('');
        setSelectedSuggestion(null);
        return;
      }
      
      const type = selectedSuggestion.type;
      const label = selectedSuggestion.label;

      // Navigate to search results
      navigation.navigate('SearchResults', {
        type: type,
        label: label,
        searchQuery: searchQuery,
      });
      
      // Reset states
      setSearchQuery('');
      setSelectedSuggestion(null);
      return;
    }

    // If no suggestion selected, search with the query string
    // First check if there are any matching suggestions
    try {
      setLoadingSuggestions(true);
      const response = await searchAPI.getAutoSuggestions(searchQuery);
      
      if (response?.status === 'success' && response.results?.length > 0) {
        // Use the first result with count > 0
        const firstValidResult = response.results.find(r => r.count > 0);
        if (!firstValidResult) {
          // All results have 0 count - show notification form
          setNotifySearchWord(searchQuery);
          setShowNotifyForm(true);
          setSearchQuery('');
          setLoadingSuggestions(false);
          return;
        }
        navigation.navigate('SearchResults', {
          type: firstValidResult.type,
          label: firstResult.label,
          searchQuery: searchQuery,
        });
        setSearchQuery('');
      } else {
        // No results found - show notification form
        setNotifySearchWord(searchQuery);
        setShowNotifyForm(true);
        setSearchQuery(''); // Clear search text
      }
    } catch (error) {
      console.log('Error searching:', error);
      // Show notification form on error
      setNotifySearchWord(searchQuery);
      setShowNotifyForm(true);
      setSearchQuery(''); // Clear search text
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleSubmitNotification = async () => {
    if (!notifyName.trim()) {
      Alert.alert('Required', 'Please enter your name');
      return;
    }
    if (!notifyEmail.trim()) {
      Alert.alert('Required', 'Please enter your email');
      return;
    }
    if (!notifyPhone.trim()) {
      Alert.alert('Required', 'Please enter your phone number');
      return;
    }

    try {
      setSubmittingNotify(true);
      const response = await searchAPI.submitNotification(
        notifySearchWord,
        notifyName.trim(),
        notifyEmail.trim(),
        notifyPhone.trim()
      );
      console.log('NOTIFY RESPONSE:', response);

      Alert.alert(
        'Request Submitted',
        'We will notify you when products matching your search become available.',
        [{ text: 'OK', onPress: () => setShowNotifyForm(false) }]
      );
      setSearchQuery('');
    } catch (error) {
      console.log('Error submitting notification:', error);
      Alert.alert('Error', 'Failed to submit request. Please try again.');
    } finally {
      setSubmittingNotify(false);
    }
  };

  const handleCartPress = () => {
    if (navigation) {
      navigation.navigate('Cart');
    }
  };

  const handleProfilePress = () => {
    if (navigation) {
      navigation.navigate('Account');
    }
  };

  const getSuggestionTypeLabel = (type) => {
    switch (type) {
      case 'product':
        return 'Product';
      case 'garment_product':
        return 'Garment';
      case 'category':
        return 'Category';
      case 'garment_category':
        return 'Garment Category';
      default:
        return '';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ImageBackground 
        source={require('../../assets/Logos/headerbg.jpg')}
        style={styles.container}
        resizeMode="cover"
      >
        <View style={styles.topRow}>
          {/* Hamburger Menu */}
          <TouchableOpacity
            style={styles.menuButton}
            onPress={onMenuPress}
          >
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
          </TouchableOpacity>

          {/* Logo */}
          <Image
            source={require('../../assets/Logos/appiconpng.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          {/* Right Icons */}
          <View style={styles.rightIcons}>
            <TouchableOpacity style={styles.cartButton} onPress={handleCartPress}>
              <Text style={styles.cartIconText}>🛒</Text>
              {cartCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartCount > 99 ? '99+' : cartCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={handleProfilePress}>
              <View style={styles.profileIcon}>
                <View style={styles.profileHead} />
                <View style={styles.profileBody} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        {showSearch && (
          <View style={styles.searchWrapper}>
            <View style={styles.searchContainer}>
              <View style={styles.searchIconContainer}>
                <View style={styles.searchCircle} />
                <View style={styles.searchHandle} />
              </View>
              <TextInput
                style={styles.searchInput}
                placeholder="Search for Items"
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  setSelectedSuggestion(null);
                }}
                onFocus={() => {
                  if (suggestions.length > 0) {
                    setShowSuggestions(true);
                  }
                }}
                returnKeyType="search"
                onSubmitEditing={handleGoPress}
              />
              {loadingSuggestions && (
                <ActivityIndicator size="small" color="#1a4a7c" style={styles.searchLoader} />
              )}
              <TouchableOpacity style={styles.goButton} onPress={handleGoPress}>
                <Text style={styles.goText}>Go</Text>
              </TouchableOpacity>
            </View>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                {suggestions.map((suggestion, index) => (
                  <TouchableOpacity
                    key={`${suggestion.type}-${suggestion.label}-${index}`}
                    style={[
                      styles.suggestionItem,
                      index === suggestions.length - 1 && styles.suggestionItemLast,
                    ]}
                    onPress={() => handleSuggestionPress(suggestion)}
                  >
                    <View style={styles.suggestionTextContainer}>
                      <Text style={styles.suggestionLabel}>{suggestion.label}</Text>
                      <Text style={styles.suggestionType}>{getSuggestionTypeLabel(suggestion.type)}</Text>
                    </View>
                    {suggestion.count > 0 ? (
                      <View style={styles.suggestionCountBadge}>
                        <Text style={styles.suggestionCount}>{suggestion.count}</Text>
                      </View>
                    ) : (
                      <Text style={styles.notAvailableLabel}>Not Available</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
      </ImageBackground>

      {/* Notification Form Modal */}
      <Modal
        visible={showNotifyForm}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowNotifyForm(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.modalKeyboardView}
            >
              <ScrollView 
                style={styles.modalScrollView}
                contentContainerStyle={styles.modalScrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Product Not Available</Text>
                    <TouchableOpacity
                      style={styles.modalCloseButton}
                      onPress={() => setShowNotifyForm(false)}
                    >
                      <Text style={styles.modalCloseText}>✕</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.notAvailableText}>
                    Sorry, "<Text style={styles.searchWordBold}>{notifySearchWord}</Text>" is currently not available.
                  </Text>

                  <Text style={styles.formSubtitle}>Fill out to get notified:</Text>

                  <View style={styles.formRow}>
                    <View style={styles.formGroupHalf}>
                      <Text style={styles.formLabel}>Search Word</Text>
                      <TextInput
                        style={[styles.formInputCompact, styles.formInputDisabled]}
                        value={notifySearchWord}
                        editable={false}
                      />
                    </View>
                    <View style={styles.formGroupHalf}>
                      <Text style={styles.formLabel}>Name *</Text>
                      <TextInput
                        style={styles.formInputCompact}
                        value={notifyName}
                        onChangeText={setNotifyName}
                        placeholder="Your name"
                        placeholderTextColor="#999"
                      />
                    </View>
                  </View>

                  <View style={styles.formRow}>
                    <View style={styles.formGroupHalf}>
                      <Text style={styles.formLabel}>Email *</Text>
                      <TextInput
                        style={styles.formInputCompact}
                        value={notifyEmail}
                        onChangeText={setNotifyEmail}
                        placeholder="Your email"
                        placeholderTextColor="#999"
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                    </View>
                    <View style={styles.formGroupHalf}>
                      <Text style={styles.formLabel}>Phone *</Text>
                      <TextInput
                        style={styles.formInputCompact}
                        value={notifyPhone}
                        onChangeText={setNotifyPhone}
                        placeholder="Your phone"
                        placeholderTextColor="#999"
                        keyboardType="phone-pad"
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.submitButton, submittingNotify && styles.submitButtonDisabled]}
                    onPress={handleSubmitNotification}
                    disabled={submittingNotify}
                  >
                    {submittingNotify ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.submitButtonText}>Submit</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: 'transparent',
    zIndex: 100,
  },
  container: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  menuButton: {
    width: 28,
    height: 24,
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  menuLine: {
    height: 3,
    backgroundColor: '#2C3E50',
    borderRadius: 2,
  },
  logo: {
    width: 160,
    height: 50,
    backgroundColor: 'transparent',
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cartButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cartIconText: {
    fontSize: 24,
  },
  cartBadge: {
    position: 'absolute',
    top: 0,
    right: -2,
    backgroundColor: '#E74C3C',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  profileIcon: {
    width: 24,
    height: 26,
    alignItems: 'center',
  },
  profileHead: {
    width: 12,
    height: 12,
    backgroundColor: '#2C3E50',
    borderRadius: 6,
  },
  profileBody: {
    width: 20,
    height: 12,
    backgroundColor: '#2C3E50',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    marginTop: 2,
  },
  searchWrapper: {
    position: 'relative',
    zIndex: 1000,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    height: 44,
    paddingLeft: 12,
  },
  searchIconContainer: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  searchCircle: {
    width: 14,
    height: 14,
    borderWidth: 2,
    borderColor: '#999',
    borderRadius: 7,
  },
  searchHandle: {
    position: 'absolute',
    bottom: 1,
    right: 3,
    width: 6,
    height: 2,
    backgroundColor: '#999',
    transform: [{ rotate: '45deg' }],
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#2C3E50',
  },
  searchLoader: {
    marginRight: 8,
  },
  goButton: {
    backgroundColor: '#2C3E50',
    paddingHorizontal: 20,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 7,
    borderBottomRightRadius: 7,
  },
  goText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    maxHeight: 250,
    zIndex: 1001,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  suggestionItemLast: {
    borderBottomWidth: 0,
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  suggestionType: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  suggestionCountBadge: {
    backgroundColor: '#1a4a7c',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  suggestionCount: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  notAvailableLabel: {
    fontSize: 11,
    color: '#E74C3C',
    fontWeight: '500',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalKeyboardView: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
  },
  modalScrollView: {
    flexGrow: 0,
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a4a7c',
  },
  modalCloseButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 18,
    color: '#666',
  },
  notAvailableText: {
    fontSize: 13,
    color: '#E74C3C',
    marginBottom: 8,
  },
  searchWordBold: {
    fontWeight: '700',
  },
  formSubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  formGroupHalf: {
    flex: 1,
  },
  formGroup: {
    marginBottom: 10,
  },
  formLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  formInputCompact: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#333',
    backgroundColor: '#FFFFFF',
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#FFFFFF',
  },
  formInputDisabled: {
    backgroundColor: '#F5F5F5',
    color: '#666',
  },
  submitButton: {
    backgroundColor: '#1a4a7c',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 10,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Header;

