import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform,
  StatusBar,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from 'react-native';
import { orderAPI, tokenManager } from '../services/api';

const { width } = Dimensions.get('window');
const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;
const THEME_COLOR = '#2C4A6B';

const OrderDetailScreen = ({ navigation, route }) => {
  const { orderNumber } = route.params;
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderInfo, setOrderInfo] = useState(null);
  const [cancellingItem, setCancellingItem] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelQuantity, setCancelQuantity] = useState('1');
  const [submittingCancel, setSubmittingCancel] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showQuantityPicker, setShowQuantityPicker] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
  }, []);

  const fetchOrderDetails = async () => {
    try {
      const response = await orderAPI.getOrderDetails(orderNumber);
      console.log('ORDER DETAILS RESPONSE:', JSON.stringify(response));
      if (Array.isArray(response) && response.length > 0) {
        // Log each item's cancel status
        response.forEach((item, index) => {
          console.log(`Item ${index}: cancel_status=${item.cancel_status}, cancel_qty=${item.cancel_qty}, qty=${item.qty}`);
        });
        setOrderItems(response);
        setOrderInfo({
          orderedon: response[0].orderedon,
          ordertotal: response[0].ordertotal,
        });
      } else {
        setOrderItems([]);
      }
    } catch (error) {
      console.log('Error fetching order details:', error);
      setOrderItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelPress = (item) => {
    setSelectedItem(item);
    setCancelReason('');
    setCancelQuantity('1');
    setShowQuantityPicker(false);
    setShowCancelModal(true);
  };

  // Generate quantity options based on ordered quantity
  const getQuantityOptions = () => {
    const qty = parseInt(selectedItem?.qty || '1');
    return Array.from({ length: qty }, (_, i) => (i + 1).toString());
  };

  const handleSubmitCancel = async () => {
    if (!cancelReason.trim()) {
      Alert.alert('Required', 'Please enter a cancellation reason');
      return;
    }

    try {
      setSubmittingCancel(true);
      Keyboard.dismiss();

      const userData = await tokenManager.getUserData();
      if (!userData?.userid) {
        Alert.alert('Error', 'User not found. Please login again.');
        return;
      }

      // Determine if garment or regular product (garment products have code starting with W2SAG)
      const isGarment = selectedItem.productcode?.startsWith('W2SAG');

      const cancelData = {
        orderNumber: orderNumber,
        userId: userData.userid,
        productCode: selectedItem.productcode,
        productId: selectedItem.id || selectedItem.productcode,
        productName: selectedItem.productname,
        orderedQuantity: selectedItem.qty || '1',
        cancelQuantity: cancelQuantity,
        reason: cancelReason.trim(),
      };

      console.log('CANCEL REQUEST DATA:', cancelData);
      console.log('IS GARMENT:', isGarment);
      
      const response = isGarment 
        ? await orderAPI.cancelGarmentOrder(cancelData)
        : await orderAPI.cancelRegularOrder(cancelData);

      console.log('CANCEL RESPONSE:', response);

      const isSuccess = response?.status === true || 
        response?.status === 'true' || 
        response?.status === 'SUCCESS' ||
        response?.[0]?.status === 'SUCCESS' ||
        (Array.isArray(response) && response[0]?.message?.toLowerCase().includes('success'));

      if (isSuccess) {
        const successMessage = response?.message || response?.[0]?.message || 'Order item cancelled successfully';
        Alert.alert('Success', successMessage);
        setShowCancelModal(false);
        // Refresh order details
        fetchOrderDetails();
      } else {
        const errorMessage = response?.message || response?.[0]?.message || 'Failed to cancel order item';
        Alert.alert('Error', errorMessage);
      }
    } catch (error) {
      console.log('Cancel order error:', error);
      Alert.alert('Error', 'Failed to cancel order. Please try again.');
    } finally {
      setSubmittingCancel(false);
    }
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
      <Text style={styles.headerTitle}>Order Details</Text>
      <View style={styles.headerRight} />
    </View>
  );

  const renderOrderSummary = () => (
    <View style={styles.summaryCard}>
      <View style={styles.summaryHeader}>
        <Text style={styles.summaryTitle}>Order Summary</Text>
      </View>
      
      <View style={styles.summaryContent}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Order Number</Text>
          <Text style={styles.summaryValue}>{orderNumber}</Text>
        </View>
        
        {orderInfo && (
          <>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Ordered On</Text>
              <Text style={styles.summaryValue}>{orderInfo.orderedon}</Text>
            </View>
            
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Amount</Text>
              <Text style={styles.totalAmount}>Rs. {orderInfo.ordertotal}</Text>
            </View>
          </>
        )}
      </View>
    </View>
  );

  const renderItemsHeader = () => (
    <View style={styles.itemsHeader}>
      <Text style={styles.itemsTitle}>
        Order Items ({orderItems.length})
      </Text>
    </View>
  );

  const renderOrderItem = ({ item, index }) => {
    const isCancelled = item.cancel_status === '1' || item.cancel_status === 1;
    const orderedQty = parseInt(item.qty || '1');
    // If cancel_qty is empty but cancel_status is 1, assume full cancellation
    const cancelledQty = item.cancel_qty && item.cancel_qty !== '' 
      ? parseInt(item.cancel_qty) 
      : (isCancelled ? orderedQty : 0);
    const remainingQty = orderedQty - cancelledQty;
    const isFullyCancelled = isCancelled && cancelledQty >= orderedQty;
    
    return (
      <View style={[styles.itemCard, isFullyCancelled && styles.itemCardCancelled]}>
        <View style={styles.itemRow}>
          <Image
            source={{ uri: item.productimage }}
            style={[styles.productImage, isFullyCancelled && styles.productImageCancelled]}
            resizeMode="cover"
          />
          <View style={styles.itemInfo}>
            <Text style={[styles.productName, isFullyCancelled && styles.textCancelled]} numberOfLines={2}>
              {item.productname}
            </Text>
            <Text style={styles.productCode}>Code: {item.productcode}</Text>
            
            <View style={styles.itemFooter}>
              <View style={styles.qtyContainer}>
                <Text style={styles.qtyLabel}>Qty:</Text>
                <Text style={styles.qtyValue}>{item.qty}</Text>
              </View>
              <Text style={styles.itemPrice}>Rs. {item.productprice}</Text>
            </View>

            {/* Cancellation Status */}
            {isCancelled && (
              <View style={styles.cancelStatusContainer}>
                {isFullyCancelled ? (
                  <View style={styles.cancelledBadgeFull}>
                    <Text style={styles.cancelledBadgeFullText}>CANCELLED</Text>
                  </View>
                ) : (
                  <>
                    <View style={styles.cancelledBadgePartial}>
                      <Text style={styles.cancelledBadgePartialText}>
                        {cancelledQty} of {orderedQty} Cancelled
                      </Text>
                    </View>
                    {remainingQty > 0 && (
                      <Text style={styles.remainingQtyText}>
                        Active: {remainingQty} item(s)
                      </Text>
                    )}
                  </>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Cancel Button - Only show if not fully cancelled */}
        {!isFullyCancelled && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => handleCancelPress(item)}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>✕ Cancel Item</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No items found for this order.</Text>
    </View>
  );

  const renderListHeader = () => (
    <>
      {renderOrderSummary()}
      {orderItems.length > 0 && renderItemsHeader()}
    </>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={THEME_COLOR} />
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME_COLOR} />
          <Text style={styles.loadingText}>Loading order details...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME_COLOR} />
      {renderHeader()}

      <FlatList
        data={orderItems}
        renderItem={renderOrderItem}
        keyExtractor={(item, index) => `${item.productcode}-${index}`}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* Bottom Help Section */}
      <View style={styles.helpSection}>
        <View style={styles.helpContent}>
          <Text style={styles.helpText}>Need help with this order?</Text>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => navigation.navigate('ContactUs')}
            activeOpacity={0.8}
          >
            <Text style={styles.contactButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Cancel Confirmation Modal */}
      <Modal
        visible={showCancelModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCancelModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => {
          Keyboard.dismiss();
          setShowQuantityPicker(false);
        }}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
          >
            <View style={styles.modalContent}>
              {/* Header */}
              <View style={styles.formHeader}>
                <Text style={styles.formTitle}>Reason for Your Order Cancellation</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setShowCancelModal(false)}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.formSubHeader}>
                <View style={styles.formSubHeaderLine} />
                <Text style={styles.formSubTitle}>Order Cancellation Form</Text>
                <View style={styles.formSubHeaderLine} />
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {selectedItem && (
                  <>
                    {/* Order Number */}
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Order Number</Text>
                      <View style={styles.formInputReadOnly}>
                        <Text style={styles.formInputText}>{orderNumber}</Text>
                      </View>
                    </View>

                    {/* Product Code */}
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Product Code</Text>
                      <View style={styles.formInputReadOnly}>
                        <Text style={styles.formInputText}>{selectedItem.productcode}</Text>
                      </View>
                    </View>

                    {/* Product Name */}
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Product Name</Text>
                      <View style={styles.formInputReadOnly}>
                        <Text style={styles.formInputText} numberOfLines={2}>
                          {selectedItem.productname}
                        </Text>
                      </View>
                    </View>

                    {/* Ordered Quantity */}
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Ordered Quantity</Text>
                      <View style={styles.formInputReadOnly}>
                        <Text style={styles.formInputText}>{selectedItem.qty}</Text>
                      </View>
                    </View>

                    {/* Cancel Quantity - Dropdown */}
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Cancel Quantity</Text>
                      <TouchableOpacity 
                        style={styles.dropdownButton}
                        onPress={() => setShowQuantityPicker(!showQuantityPicker)}
                      >
                        <Text style={styles.dropdownText}>{cancelQuantity}</Text>
                        <Text style={styles.dropdownArrow}>▼</Text>
                      </TouchableOpacity>
                      
                      {showQuantityPicker && (
                        <View style={styles.dropdownList}>
                          {getQuantityOptions().map((qty) => (
                            <TouchableOpacity
                              key={qty}
                              style={[
                                styles.dropdownItem,
                                cancelQuantity === qty && styles.dropdownItemSelected
                              ]}
                              onPress={() => {
                                setCancelQuantity(qty);
                                setShowQuantityPicker(false);
                              }}
                            >
                              <Text style={[
                                styles.dropdownItemText,
                                cancelQuantity === qty && styles.dropdownItemTextSelected
                              ]}>
                                {qty}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>

                    {/* Cancellation Reason */}
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Cancellation Reason</Text>
                      <TextInput
                        style={styles.reasonInput}
                        placeholder="Enter your reason for cancellation..."
                        value={cancelReason}
                        onChangeText={setCancelReason}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                      />
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                      style={[styles.submitButton, submittingCancel && styles.buttonDisabled]}
                      onPress={handleSubmitCancel}
                      disabled={submittingCancel}
                    >
                      {submittingCancel ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <Text style={styles.submitButtonText}>Submit</Text>
                      )}
                    </TouchableOpacity>
                  </>
                )}
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>
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
    paddingBottom: 100,
  },
  summaryCard: {
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
  summaryHeader: {
    backgroundColor: THEME_COLOR,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  summaryTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  summaryContent: {
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '400',
  },
  summaryValue: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },
  totalAmount: {
    fontSize: 18,
    color: THEME_COLOR,
    fontWeight: '700',
  },
  itemsHeader: {
    marginBottom: 12,
  },
  itemsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333333',
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  itemRow: {
    flexDirection: 'row',
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    lineHeight: 20,
  },
  productCode: {
    fontSize: 12,
    color: '#999999',
    marginTop: 4,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  qtyLabel: {
    fontSize: 12,
    color: '#666666',
    marginRight: 4,
  },
  qtyValue: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '600',
  },
  itemPrice: {
    fontSize: 16,
    color: THEME_COLOR,
    fontWeight: '700',
  },
  cancelButton: {
    marginTop: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#E74C3C',
    fontSize: 14,
    fontWeight: '600',
  },
  // Cancellation status styles
  itemCardCancelled: {
    backgroundColor: '#F8F8F8',
    borderLeftWidth: 4,
    borderLeftColor: '#E74C3C',
  },
  productImageCancelled: {
    opacity: 0.5,
  },
  textCancelled: {
    textDecorationLine: 'line-through',
    color: '#999999',
  },
  cancelStatusContainer: {
    marginTop: 10,
  },
  cancelledBadgeFull: {
    backgroundColor: '#E74C3C',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  cancelledBadgeFullText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cancelledBadgePartial: {
    backgroundColor: '#FFF3CD',
    borderWidth: 1,
    borderColor: '#FFCC00',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  cancelledBadgePartialText: {
    color: '#856404',
    fontSize: 12,
    fontWeight: '600',
  },
  remainingQtyText: {
    color: '#27AE60',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666666',
  },
  helpSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  helpContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  helpText: {
    fontSize: 14,
    color: '#666666',
    flex: 1,
  },
  contactButton: {
    backgroundColor: THEME_COLOR,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME_COLOR,
    flex: 1,
    marginRight: 10,
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 22,
    color: '#999999',
    fontWeight: '300',
  },
  formSubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  formSubHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  formSubTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 8,
  },
  formInputReadOnly: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#F8F8F8',
  },
  formInputText: {
    fontSize: 14,
    color: '#333333',
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  dropdownText: {
    fontSize: 14,
    color: '#333333',
  },
  dropdownArrow: {
    fontSize: 10,
    color: '#666666',
  },
  dropdownList: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 6,
    zIndex: 1000,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownItemSelected: {
    backgroundColor: '#E8F4FD',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#333333',
  },
  dropdownItemTextSelected: {
    color: THEME_COLOR,
    fontWeight: '600',
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    color: '#333333',
    minHeight: 100,
    backgroundColor: '#FFFFFF',
  },
  submitButton: {
    backgroundColor: THEME_COLOR,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 10,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});

export default OrderDetailScreen;
