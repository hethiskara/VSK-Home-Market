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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TouchableOpacity } from 'react-native';
import { appReviewAPI } from '../services/api';

const THEME_COLOR = '#a10000';
const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 24;

const AppReviewsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starRatingData, setStarRatingData] = useState(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const [reviewsResponse, starRatingResponse] = await Promise.all([
        appReviewAPI.getViewAllReviews(),
        appReviewAPI.getStarRatingCount(),
      ]);
      
      if (Array.isArray(reviewsResponse)) {
        setReviews(reviewsResponse);
      }
      if (Array.isArray(starRatingResponse) && starRatingResponse.length > 0) {
        setStarRatingData(starRatingResponse[0]);
      }
    } catch (error) {
      console.log('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewPress = (id) => {
    navigation.navigate('AppReviewDetail', { reviewId: id });
  };

  const renderReviewItem = ({ item, index }) => {
    const colors = ['#FF6B35', '#a10000', '#4CAF50', '#9C27B0', '#E91E63'];
    const bgColor = colors[index % colors.length];
    const initial = item.name ? item.name.charAt(0).toUpperCase() : 'U';

    return (
      <TouchableOpacity 
        style={styles.reviewCard}
        onPress={() => handleReviewPress(item.id)}
        activeOpacity={0.8}
      >
        {item.pagetitle ? (
          <Text style={styles.pageTitle}>{item.pagetitle}</Text>
        ) : null}
        <View style={styles.cardHeader}>
          <View style={[styles.avatar, { backgroundColor: bgColor }]}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.customerName}>{item.name}</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Text 
                  key={star} 
                  style={[styles.star, { color: star <= parseFloat(item.ratings) ? '#FFD700' : '#DDD' }]}
                >
                  ★
                </Text>
              ))}
            </View>
          </View>
        </View>
        <Text style={styles.reviewContent} numberOfLines={4}>{item.review}</Text>
      </TouchableOpacity>
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
        <Text style={styles.headerTitle}>App Reviews</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Rating Summary */}
      {starRatingData && (
        <View style={styles.ratingSummary}>
          <View style={styles.ratingBig}>
            <Text style={styles.ratingNumber}>{starRatingData.overallrating}</Text>
            <Text style={styles.ratingStar}>★</Text>
          </View>
          <Text style={styles.ratingMembers}>{starRatingData.members}</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME_COLOR} />
          <Text style={styles.loadingText}>Loading reviews...</Text>
        </View>
      ) : reviews.length > 0 ? (
        <FlatList
          data={reviews}
          renderItem={renderReviewItem}
          keyExtractor={(item) => `review-${item.id}`}
          contentContainerStyle={[styles.listContainer, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No reviews available</Text>
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
  ratingSummary: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  ratingBig: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingNumber: {
    fontSize: 48,
    fontWeight: '700',
    color: '#a10000',
  },
  ratingStar: {
    fontSize: 40,
    color: '#FFD700',
    marginLeft: 8,
  },
  ratingMembers: {
    fontSize: 16,
    color: '#666666',
    marginTop: 4,
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
  reviewCard: {
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
  pageTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#a10000',
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
    fontSize: 16,
    marginRight: 2,
  },
  reviewContent: {
    fontSize: 15,
    lineHeight: 24,
    color: '#555555',
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

export default AppReviewsScreen;
