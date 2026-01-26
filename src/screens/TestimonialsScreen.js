import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { TouchableOpacity } from 'react-native';
import { homeAPI } from '../services/api';

const THEME_COLOR = '#2C4A6B';
const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 24;

const TestimonialsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      const response = await homeAPI.getViewAllTestimonials();
      if (Array.isArray(response)) {
        setTestimonials(response);
      }
    } catch (error) {
      console.log('Error fetching testimonials:', error);
    } finally {
      setLoading(false);
    }
  };

  // Parse HTML entities
  const parseHtmlContent = (html) => {
    if (!html) return '';
    let text = html.replace(/&mdash;/g, '—');
    text = text.replace(/&ndash;/g, '–');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&quot;/g, '"');
    text = text.replace(/&#39;/g, "'");
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/<[^>]*>/g, '');
    return text;
  };

  const renderTestimonialItem = ({ item, index }) => {
    const colors = ['#FF6B35', '#2C4A6B', '#4CAF50', '#9C27B0', '#E91E63'];
    const bgColor = colors[index % colors.length];
    const initial = item.name ? item.name.charAt(0).toUpperCase() : 'U';

    return (
      <View style={styles.testimonialCard}>
        <View style={styles.cardHeader}>
          <View style={[styles.avatar, { backgroundColor: bgColor }]}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.customerName}>{item.name}</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Text key={star} style={styles.star}>★</Text>
              ))}
            </View>
          </View>
        </View>
        <View style={styles.quoteContainer}>
          <Text style={styles.quoteIcon}>"</Text>
          <Text style={styles.testimonialContent}>
            {parseHtmlContent(item.content)}
          </Text>
          <Text style={styles.quoteIconEnd}>"</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME_COLOR} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>‹</Text>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Testimonials</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Subtitle */}
      <View style={styles.subtitleContainer}>
        <Text style={styles.subtitle}>What Our Customers Say</Text>
        <Text style={styles.testimonialCount}>
          {testimonials.length} {testimonials.length === 1 ? 'Review' : 'Reviews'}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME_COLOR} />
          <Text style={styles.loadingText}>Loading testimonials...</Text>
        </View>
      ) : testimonials.length > 0 ? (
        <FlatList
          data={testimonials}
          renderItem={renderTestimonialItem}
          keyExtractor={(item) => `testimonial-${item.id}`}
          contentContainerStyle={[styles.listContainer, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No testimonials available</Text>
        </View>
      )}
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
  },
  placeholder: {
    minWidth: 70,
  },
  subtitleContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  testimonialCount: {
    fontSize: 14,
    color: '#666666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666666',
  },
  listContainer: {
    padding: 16,
  },
  testimonialCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  nameContainer: {
    marginLeft: 14,
    flex: 1,
  },
  customerName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  starsRow: {
    flexDirection: 'row',
  },
  star: {
    color: '#FFD700',
    fontSize: 16,
    marginRight: 2,
  },
  quoteContainer: {
    position: 'relative',
    paddingHorizontal: 8,
  },
  quoteIcon: {
    position: 'absolute',
    top: -10,
    left: -5,
    fontSize: 40,
    color: '#E0E0E0',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  testimonialContent: {
    fontSize: 15,
    lineHeight: 24,
    color: '#555555',
    paddingLeft: 20,
    paddingRight: 20,
  },
  quoteIconEnd: {
    position: 'absolute',
    bottom: -25,
    right: -5,
    fontSize: 40,
    color: '#E0E0E0',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
  },
});

export default TestimonialsScreen;
