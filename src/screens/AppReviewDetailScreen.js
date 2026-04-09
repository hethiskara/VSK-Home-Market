import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
  StatusBar,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TouchableOpacity } from 'react-native';
import { appReviewAPI } from '../services/api';

const THEME_COLOR = '#2C4A6B';
const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 24;

const AppReviewDetailScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { reviewId } = route.params;
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviewDetail();
  }, [reviewId]);

  const fetchReviewDetail = async () => {
    try {
      setLoading(true);
      const response = await appReviewAPI.getReviewDetail(reviewId);
      if (Array.isArray(response) && response.length > 0) {
        setReview(response[0]);
      }
    } catch (error) {
      console.log('Error fetching review detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  const renderStars = (rating) => {
    const ratingNum = parseFloat(rating) || 0;
    return (
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Text 
            key={star} 
            style={[styles.star, { color: star <= ratingNum ? '#FFD700' : '#DDD' }]}
          >
            ★
          </Text>
        ))}
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
        <Text style={styles.headerTitle}>Review</Text>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME_COLOR} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : review ? (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Title Card */}
          {review.pagetitle ? (
            <View style={styles.titleCard}>
              <Text style={styles.pageTitle}>{review.pagetitle}</Text>
            </View>
          ) : null}

          {/* Customer Info Card */}
          <View style={styles.customerCard}>
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarTextLarge}>{getInitial(review.name)}</Text>
            </View>
            <Text style={styles.customerName}>{review.name}</Text>
            {renderStars(review.ratings)}
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingBadgeText}>{review.ratings} / 5</Text>
            </View>
          </View>

          {/* Review Content Card */}
          <View style={styles.contentCard}>
            <Text style={styles.reviewContent}>{review.review}</Text>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Review not found</Text>
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  titleCard: {
    backgroundColor: THEME_COLOR,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 28,
  },
  customerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarTextLarge: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
  },
  customerName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 8,
  },
  starsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  star: {
    fontSize: 28,
    marginHorizontal: 3,
  },
  ratingBadge: {
    backgroundColor: '#F0F4F8',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  ratingBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C4A6B',
  },
  contentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  reviewContent: {
    fontSize: 16,
    lineHeight: 28,
    color: '#444444',
    textAlign: 'justify',
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

export default AppReviewDetailScreen;
