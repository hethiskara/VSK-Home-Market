import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { contentAPI } from '../services/api';

const { width } = Dimensions.get('window');
const THEME_COLOR = '#2C4A6B';
const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 24;

// HTML parser helper
const parseHtmlContent = (html) => {
  if (!html) return '';
  
  let text = html.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/p>/gi, '\n\n');
  text = text.replace(/<p[^>]*>/gi, '');
  text = text.replace(/<\/li>/gi, '\n');
  text = text.replace(/<li[^>]*>/gi, '• ');
  text = text.replace(/<\/ul>/gi, '\n');
  text = text.replace(/<ul[^>]*>/gi, '');
  text = text.replace(/<\/ol>/gi, '\n');
  text = text.replace(/<ol[^>]*>/gi, '');
  text = text.replace(/<h[1-6][^>]*>/gi, '\n');
  text = text.replace(/<\/h[1-6]>/gi, '\n\n');
  text = text.replace(/<[^>]*>/g, '');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  text = text.replace(/&rsquo;/g, "'");
  text = text.replace(/&lsquo;/g, "'");
  text = text.replace(/&rdquo;/g, '"');
  text = text.replace(/&ldquo;/g, '"');
  text = text.replace(/&ndash;/g, '–');
  text = text.replace(/&mdash;/g, '—');
  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.trim();
  
  return text;
};

const TABS = [
  { id: 'terms', label: 'Terms & Conditions', icon: '📋', color: '#3498DB' },
  { id: 'privacy', label: 'Privacy Policy', icon: '🔒', color: '#9B59B6' },
  { id: 'sales', label: 'Terms of Sales', icon: '🛒', color: '#27AE60' },
  { id: 'refund', label: 'Cancellation & Refund', icon: '↩️', color: '#E67E22' },
];

const LegalPoliciesScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { initialTab } = route.params || {};
  const [activeTab, setActiveTab] = useState(initialTab || 'terms');
  const [content, setContent] = useState({
    terms: { loading: true, data: null, error: null },
    privacy: { loading: true, data: null, error: null },
    sales: { loading: true, data: null, error: null },
    refund: { loading: true, data: null, error: null },
  });
  
  const scrollViewRef = useRef(null);
  const initialTabIndex = TABS.findIndex(t => t.id === (initialTab || 'terms'));
  const tabIndicatorAnim = useRef(new Animated.Value(initialTabIndex >= 0 ? initialTabIndex : 0)).current;

  useEffect(() => {
    fetchAllContent();
  }, []);

  useEffect(() => {
    const tabIndex = TABS.findIndex(t => t.id === activeTab);
    Animated.spring(tabIndicatorAnim, {
      toValue: tabIndex,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
  }, [activeTab]);

  const fetchAllContent = async () => {
    // Fetch all policies in parallel
    const fetchPolicy = async (key, apiMethod) => {
      try {
        const response = await apiMethod();
        let parsedContent = '';
        
        if (Array.isArray(response) && response[0]?.content) {
          parsedContent = parseHtmlContent(response[0].content);
        } else if (response?.content) {
          parsedContent = parseHtmlContent(response.content);
        } else if (typeof response === 'string') {
          parsedContent = parseHtmlContent(response);
        }
        
        setContent(prev => ({
          ...prev,
          [key]: { loading: false, data: parsedContent, error: null }
        }));
      } catch (error) {
        console.log(`Error fetching ${key}:`, error);
        setContent(prev => ({
          ...prev,
          [key]: { loading: false, data: null, error: 'Failed to load content' }
        }));
      }
    };

    fetchPolicy('terms', contentAPI.getTermsConditions);
    fetchPolicy('privacy', contentAPI.getPrivacyPolicy);
    fetchPolicy('sales', contentAPI.getTermsOfSales);
    fetchPolicy('refund', contentAPI.getRefundPolicy);
  };

  const handleTabPress = (tabId) => {
    setActiveTab(tabId);
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
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
      <Text style={styles.headerTitle}>Legal & Policies</Text>
      <View style={styles.headerRight} />
    </View>
  );

  const renderTabs = () => {
    const tabWidth = (width - 32) / 4;
    const indicatorTranslateX = tabIndicatorAnim.interpolate({
      inputRange: [0, 1, 2, 3],
      outputRange: [0, tabWidth, tabWidth * 2, tabWidth * 3],
    });

    return (
      <View style={styles.tabsWrapper}>
        <View style={styles.tabsContainer}>
          <Animated.View 
            style={[
              styles.tabIndicator,
              { 
                width: tabWidth,
                transform: [{ translateX: indicatorTranslateX }]
              }
            ]} 
          />
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, { width: tabWidth }]}
              onPress={() => handleTabPress(tab.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.tabIcon}>{tab.icon}</Text>
              <Text 
                style={[
                  styles.tabLabel,
                  activeTab === tab.id && styles.tabLabelActive
                ]}
                numberOfLines={2}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderContent = () => {
    const currentContent = content[activeTab];
    const currentTab = TABS.find(t => t.id === activeTab);

    if (currentContent.loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME_COLOR} />
          <Text style={styles.loadingText}>Loading {currentTab?.label}...</Text>
        </View>
      );
    }

    if (currentContent.error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{currentContent.error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchAllContent}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!currentContent.data) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📄</Text>
          <Text style={styles.emptyText}>Content not available</Text>
        </View>
      );
    }

    return (
      <View style={styles.contentCard}>
        <View style={[styles.contentHeader, { borderLeftColor: currentTab?.color }]}>
          <Text style={styles.contentIcon}>{currentTab?.icon}</Text>
          <Text style={styles.contentTitle}>{currentTab?.label}</Text>
        </View>
        <View style={styles.contentBody}>
          <Text style={styles.contentText}>{currentContent.data}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME_COLOR} />
      {renderHeader()}
      {renderTabs()}
      
      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderContent()}
        
        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Last updated: January 2026
          </Text>
          <Text style={styles.footerSubtext}>
            For any queries, please contact our support team
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
  tabsWrapper: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F0F4F8',
    borderRadius: 12,
    padding: 4,
    position: 'relative',
  },
  tabIndicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    bottom: 4,
    backgroundColor: THEME_COLOR,
    borderRadius: 10,
  },
  tab: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  tabIcon: {
    fontSize: 18,
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 2,
  },
  tabLabelActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#E74C3C',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: THEME_COLOR,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  contentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  contentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FAFBFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
    borderLeftWidth: 4,
  },
  contentIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  contentTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
  },
  contentBody: {
    padding: 20,
  },
  contentText: {
    fontSize: 15,
    lineHeight: 26,
    color: '#444',
    textAlign: 'justify',
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 11,
    color: '#AAA',
  },
});

export default LegalPoliciesScreen;
