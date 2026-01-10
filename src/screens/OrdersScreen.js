import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Platform,
  StatusBar,
  Modal,
  ScrollView,
  Image,
  Linking,
} from 'react-native';
import { orderAPI, tokenManager } from '../services/api';

const { width } = Dimensions.get('window');
const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

const THEME_COLOR = '#2C4A6B';

const OrdersScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Track Order Modal States
  const [showTrackModal, setShowTrackModal] = useState(false);
  const [trackingData, setTrackingData] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const userData = await tokenManager.getUserData();
      if (!userData || !userData.userid) {
        navigation.replace('Login');
        return;
      }

      const response = await orderAPI.getOrders(userData.userid);
      if (Array.isArray(response)) {
        setOrders(response);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.log('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const handleTrackOrder = async (orderNumber) => {
    try {
      setTrackingLoading(true);
      setShowTrackModal(true);
      setTrackingData(null);
      
      const response = await orderAPI.trackOrder(orderNumber);
      console.log('TRACKING DATA:', response);
      
      if (response && response.status === true) {
        setTrackingData(response);
      } else {
        setTrackingData({ error: true, message: 'Unable to fetch tracking information' });
      }
    } catch (error) {
      console.log('Error tracking order:', error);
      setTrackingData({ error: true, message: 'Failed to load tracking information' });
    } finally {
      setTrackingLoading(false);
    }
  };

  const getTrackingStepStatus = (tracking, step) => {
    if (!tracking) return 'pending';
    
    switch (step) {
      case 'ordered':
        return tracking.ordered ? 'completed' : 'pending';
      case 'packaged':
        return tracking.packaged ? 'completed' : 'pending';
      case 'shipped':
        return tracking.shipped ? 'completed' : 'pending';
      case 'delivered':
        return tracking.delivered ? 'completed' : 'pending';
      default:
        return 'pending';
    }
  };

  const renderTrackingModal = () => (
    <Modal
      visible={showTrackModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowTrackModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.trackModalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Track Order</Text>
            <TouchableOpacity onPress={() => setShowTrackModal(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          {trackingLoading ? (
            <View style={styles.trackingLoadingContainer}>
              <ActivityIndicator size="large" color={THEME_COLOR} />
              <Text style={styles.trackingLoadingText}>Loading tracking info...</Text>
            </View>
          ) : trackingData?.error ? (
            <View style={styles.trackingErrorContainer}>
              <Text style={styles.trackingErrorIcon}>!</Text>
              <Text style={styles.trackingErrorText}>{trackingData.message}</Text>
            </View>
          ) : trackingData ? (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.trackingScrollContent}>
              {/* Order Info */}
              <View style={styles.trackingOrderInfo}>
                <Text style={styles.trackingOrderNumber}>{trackingData.order_number}</Text>
                <Text style={styles.trackingOrderDate}>Ordered: {trackingData.order_date}</Text>
                <View style={styles.trackingAmountRow}>
                  <Text style={styles.trackingAmountLabel}>Amount Paid:</Text>
                  <Text style={styles.trackingAmountValue}>Rs. {trackingData.amount_paid}</Text>
                </View>
                <Text style={styles.trackingPaymentMethod}>via {trackingData.payment_method}</Text>
              </View>

              {/* Delivery Address */}
              {trackingData.delivery_address && (
                <View style={styles.trackingSection}>
                  <Text style={styles.trackingSectionTitle}>Delivery Address</Text>
                  <Text style={styles.trackingAddressName}>{trackingData.delivery_address.name}</Text>
                  <Text style={styles.trackingAddressText}>{trackingData.delivery_address.address}</Text>
                  <Text style={styles.trackingAddressPhone}>{trackingData.delivery_address.phone}</Text>
                </View>
              )}

              {/* Courier Tracking Info */}
              {trackingData.tracking?.tracklink && trackingData.tracking?.challanno ? (
                <View style={styles.trackingSection}>
                  <Text style={styles.trackingSectionTitle}>Track Your Shipment</Text>
                  
                  {/* Courier Image */}
                  {trackingData.tracking?.deliveryimage && (
                    <View style={styles.courierImageContainer}>
                      <Image 
                        source={{ uri: trackingData.tracking.deliveryimage }} 
                        style={styles.courierImage}
                        resizeMode="contain"
                      />
                    </View>
                  )}
                  
                  {/* Track ID / Challan No */}
                  <View style={styles.trackIdContainer}>
                    <Text style={styles.trackIdLabel}>Your Tracking ID / AWB Number:</Text>
                    <View style={styles.trackIdBox}>
                      <Text style={styles.trackIdValue}>{trackingData.tracking.challanno}</Text>
                    </View>
                  </View>
                  
                  {/* Shipped Date */}
                  {trackingData.tracking?.shipped && (
                    <Text style={styles.shippedDate}>Shipped on: {trackingData.tracking.shipped}</Text>
                  )}
                  
                  {/* Instructions */}
                  <Text style={styles.trackInstructions}>
                    Use the tracking ID above to track your shipment on the courier's website.
                  </Text>
                  
                  {/* Track Button */}
                  <TouchableOpacity 
                    style={styles.trackUrlButton}
                    onPress={() => Linking.openURL(trackingData.tracking.tracklink)}
                  >
                    <Text style={styles.trackUrlButtonText}>Track on Courier Website</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.noTrackingContainer}>
                  <Text style={styles.noTrackingIcon}>📦</Text>
                  <Text style={styles.noTrackingText}>
                    Tracking information is not yet available for this order. Please check back later.
                  </Text>
                </View>
              )}
            </ScrollView>
          ) : null}
        </View>
      </View>
    </Modal>
  );

  const renderOrderItem = ({ item, index }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => navigation.navigate('OrderDetail', { orderNumber: item.ordernumber })}
      activeOpacity={0.7}
    >
      {/* Order Number Header */}
      <View style={styles.orderHeader}>
        <View style={styles.orderNumberContainer}>
          <Text style={styles.orderLabel}>Order</Text>
          <Text style={styles.orderNumber}>{item.ordernumber}</Text>
        </View>
        <View style={styles.orderIndexBadge}>
          <Text style={styles.orderIndexText}>#{orders.length - index}</Text>
        </View>
      </View>
      
      {/* Order Details */}
      <View style={styles.orderDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Ordered On</Text>
          <Text style={styles.detailValue}>{item.orderedon}</Text>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Order Total</Text>
          <Text style={styles.totalValue}>Rs. {item.ordertotal}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtonsRow}>
        <TouchableOpacity 
          style={styles.trackOrderButton}
          onPress={() => handleTrackOrder(item.ordernumber)}
        >
          <Text style={styles.trackOrderText}>Track Order</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.viewDetailsButton}
          onPress={() => navigation.navigate('OrderDetail', { orderNumber: item.ordernumber })}
        >
          <Text style={styles.viewDetailsText}>View Details</Text>
          <Text style={styles.arrowIcon}>›</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Text style={styles.emptyIconText}>0</Text>
      </View>
      <Text style={styles.emptyTitle}>No Orders Yet</Text>
      <Text style={styles.emptyText}>
        You haven't placed any orders yet.{'\n'}Start shopping to see your orders here.
      </Text>
      <TouchableOpacity
        style={styles.shopButton}
        onPress={() => navigation.navigate('Home')}
        activeOpacity={0.8}
      >
        <Text style={styles.shopButtonText}>Browse Products</Text>
      </TouchableOpacity>
    </View>
  );

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
      <Text style={styles.headerTitle}>My Orders</Text>
      <View style={styles.headerRight} />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={THEME_COLOR} />
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME_COLOR} />
          <Text style={styles.loadingText}>Loading your orders...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME_COLOR} />
      {renderHeader()}

      {orders.length > 0 && (
        <View style={styles.orderCountBar}>
          <Text style={styles.orderCountText}>
            {orders.length} {orders.length === 1 ? 'Order' : 'Orders'} Found
          </Text>
        </View>
      )}

      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item, index) => `${item.ordernumber}-${index}`}
        contentContainerStyle={orders.length === 0 ? styles.emptyList : styles.listContainer}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={[THEME_COLOR]} 
            tintColor={THEME_COLOR}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {renderTrackingModal()}
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
  orderCountBar: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  orderCountText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 16,
    color: '#666666',
    fontSize: 14,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyList: {
    flexGrow: 1,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
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
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FAFAFA',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  orderNumberContainer: {
    flex: 1,
  },
  orderLabel: {
    fontSize: 12,
    color: '#999999',
    fontWeight: '500',
    marginBottom: 2,
  },
  orderNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333333',
  },
  orderIndexBadge: {
    backgroundColor: THEME_COLOR,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  orderIndexText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  orderDetails: {
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '400',
  },
  detailValue: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 4,
  },
  totalValue: {
    fontSize: 18,
    color: THEME_COLOR,
    fontWeight: '700',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  trackOrderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#F0F0F0',
  },
  trackOrderText: {
    fontSize: 14,
    color: '#27AE60',
    fontWeight: '600',
  },
  viewDetailsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: '#FAFAFA',
  },
  viewDetailsText: {
    fontSize: 14,
    color: THEME_COLOR,
    fontWeight: '600',
  },
  arrowIcon: {
    fontSize: 20,
    color: THEME_COLOR,
    marginLeft: 4,
    fontWeight: '300',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    paddingBottom: 100,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyIconText: {
    fontSize: 32,
    color: '#CCCCCC',
    fontWeight: '700',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  shopButton: {
    backgroundColor: THEME_COLOR,
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 8,
    ...Platform.select({
      ios: {
        shadowColor: THEME_COLOR,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  shopButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  trackModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
    padding: 0,
    overflow: 'hidden',
    marginBottom: 40,
  },
  trackingScrollContent: {
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: THEME_COLOR,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeButton: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '300',
  },
  trackingLoadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  trackingLoadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#666',
  },
  trackingErrorContainer: {
    padding: 40,
    alignItems: 'center',
  },
  trackingErrorIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFE0E0',
    textAlign: 'center',
    lineHeight: 50,
    fontSize: 24,
    color: '#E74C3C',
    fontWeight: '700',
    marginBottom: 16,
  },
  trackingErrorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  trackingOrderInfo: {
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  trackingOrderNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME_COLOR,
    marginBottom: 4,
  },
  trackingOrderDate: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  trackingAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trackingAmountLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  trackingAmountValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#27AE60',
  },
  trackingPaymentMethod: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  trackingSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  trackingSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  trackingAddressName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  trackingAddressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 20,
  },
  trackingAddressPhone: {
    fontSize: 14,
    color: THEME_COLOR,
    fontWeight: '500',
  },
  trackingTimeline: {
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  timelineDotCompleted: {
    backgroundColor: '#27AE60',
  },
  timelineCheck: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  timelineLine: {
    width: 2,
    height: 20,
    backgroundColor: '#E0E0E0',
    marginLeft: 11,
    marginVertical: 4,
  },
  timelineLineCompleted: {
    backgroundColor: '#27AE60',
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 4,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  timelineDetail: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  noTrackingContainer: {
    padding: 30,
    alignItems: 'center',
  },
  noTrackingIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  noTrackingText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  courierImageContainer: {
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
  },
  courierImage: {
    width: 150,
    height: 60,
  },
  trackIdContainer: {
    marginBottom: 16,
  },
  trackIdLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  trackIdBox: {
    backgroundColor: '#F0F4F8',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  trackIdValue: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME_COLOR,
    textAlign: 'center',
    letterSpacing: 1,
  },
  shippedDate: {
    fontSize: 13,
    color: '#27AE60',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '500',
  },
  trackInstructions: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  trackUrlButton: {
    backgroundColor: THEME_COLOR,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  trackUrlButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default OrdersScreen;
