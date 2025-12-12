import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  Alert,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { checkoutAPI } from '../services/api';

const CART_STORAGE_KEY = '@vsk_cart';

const CartScreen = ({ navigation }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [billingAddress, setBillingAddress] = useState(null);
  const [useBillingAsDelivery, setUseBillingAsDelivery] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [userId, setUserId] = useState(null);
  const [guestId, setGuestId] = useState(null);
  const [orderNumber, setOrderNumber] = useState(null);
  const [orderSummary, setOrderSummary] = useState([]);
  const [processingPayment, setProcessingPayment] = useState(false);
  
  // Delivery address fields
  const [deliveryAddress, setDeliveryAddress] = useState({
    firstname: '',
    lastname: '',
    address: '',
    postalcode: '',
    city: '',
    state: '',
    country: 'India',
    mobile_no: '',
  });

  useEffect(() => {
    loadCart();
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsed = JSON.parse(userData);
        setUserId(parsed.userid);
        // Generate guest_id for checkout session
        const newGuestId = generateGuestId();
        setGuestId(newGuestId);
      }
    } catch (error) {
      console.log('Error loading user data:', error);
    }
  };

  const generateGuestId = () => {
    return 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'.replace(/[x]/g, () => {
      return Math.floor(Math.random() * 16).toString(16);
    });
  };

  const loadCart = async () => {
    try {
      const cartData = await AsyncStorage.getItem(CART_STORAGE_KEY);
      if (cartData) {
        setCartItems(JSON.parse(cartData));
      }
    } catch (error) {
      console.log('Error loading cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveCart = async (items) => {
    try {
      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.log('Error saving cart:', error);
    }
  };

  const updateQuantity = (cartId, delta) => {
    const updatedItems = cartItems.map(item => {
      if (item.cart_id === cartId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    });
    setCartItems(updatedItems);
    saveCart(updatedItems);
  };

  const removeItem = (cartId) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item from cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const updatedItems = cartItems.filter(item => item.cart_id !== cartId);
            setCartItems(updatedItems);
            saveCart(updatedItems);
          }
        }
      ]
    );
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const price = parseFloat(item.productprice) || 0;
      const tax = parseFloat(item.cgst?.replace('%', '') || 0) + parseFloat(item.sgst?.replace('%', '') || 0);
      const priceWithTax = price + (price * tax / 100);
      return total + (priceWithTax * item.quantity);
    }, 0).toFixed(2);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const fetchBillingAddress = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const response = await checkoutAPI.getUserData(userId);
      if (response?.[0]?.userdata?.[0]) {
        const userData = response[0].userdata[0];
        setBillingAddress(userData);
        // Pre-fill delivery address with billing
        setDeliveryAddress({
          firstname: userData.firstname || '',
          lastname: userData.lastname || '',
          address: userData.address || '',
          postalcode: userData.postalcode || '',
          city: userData.city || '',
          state: userData.state || '',
          country: userData.country || 'India',
          mobile_no: userData.mobile_no || '',
        });
      }
    } catch (error) {
      console.log('Error fetching billing address:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDelivery = async () => {
    await fetchBillingAddress();
    setCurrentStep(2);
  };

  const handleProceedToPayment = async () => {
    if (!termsAccepted) {
      Alert.alert('Terms Required', 'Please accept the terms and conditions to proceed.');
      return;
    }

    const addressToUse = useBillingAsDelivery ? billingAddress : deliveryAddress;
    
    if (!addressToUse?.firstname || !addressToUse?.address || !addressToUse?.mobile_no) {
      Alert.alert('Address Required', 'Please fill in all required address fields.');
      return;
    }

    try {
      setProcessingPayment(true);
      
      // Step 1: Save delivery address
      const stepOneResponse = await checkoutAPI.saveDeliveryAddress({
        user_id: userId,
        guest_id: guestId,
        firstname: addressToUse.firstname,
        lastname: addressToUse.lastname || '',
        address: addressToUse.address,
        postalcode: addressToUse.postalcode || '',
        city: addressToUse.city || '',
        state: addressToUse.state || '',
        country: addressToUse.country || 'India',
        mobile_no: addressToUse.mobile_no,
      });

      if (stepOneResponse?.status) {
        setOrderNumber(stepOneResponse.order_number);
        
        // Step 2: Get cart summary
        const stepTwoResponse = await checkoutAPI.getCartSummary(guestId);
        if (Array.isArray(stepTwoResponse)) {
          setOrderSummary(stepTwoResponse);
        }
        
        setCurrentStep(3);
      } else {
        Alert.alert('Error', stepOneResponse?.message || 'Failed to save delivery address');
      }
    } catch (error) {
      console.log('Error processing checkout:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleRazorpayPayment = async () => {
    const addressToUse = useBillingAsDelivery ? billingAddress : deliveryAddress;
    const totalAmount = calculateTotal();
    const shippingCost = 1.00;
    const grandTotal = (parseFloat(totalAmount) + shippingCost).toFixed(2);
    
    try {
      setProcessingPayment(true);
      
      const response = await checkoutAPI.initiatePayment({
        billing_name: `${addressToUse.firstname} ${addressToUse.lastname || ''}`.trim(),
        billing_mobile: addressToUse.mobile_no,
        billing_sc: '1',
        billing_ss: '0',
        order_id: orderNumber,
        amount: grandTotal,
      });

      console.log('RAZORPAY RESPONSE:', response);
      
      // The response might contain a payment URL or gateway redirect
      if (response?.payment_url) {
        Linking.openURL(response.payment_url);
      } else if (response?.status) {
        Alert.alert(
          'Order Placed Successfully!',
          `Your order has been placed.\n\nOrder Number: ${orderNumber}\nTotal Amount: Rs ${grandTotal}`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Clear cart and go home
                setCartItems([]);
                saveCart([]);
                navigation.navigate('Home');
              }
            }
          ]
        );
      } else {
        // Show order confirmation even if payment API has issues
        Alert.alert(
          'Order Placed!',
          `Your order has been placed successfully.\n\nOrder Number: ${orderNumber}\nTotal Amount: Rs ${grandTotal}\n\nYou will receive payment details on WhatsApp.`,
          [
            {
              text: 'OK',
              onPress: () => {
                setCartItems([]);
                saveCart([]);
                navigation.navigate('Home');
              }
            }
          ]
        );
      }
    } catch (error) {
      console.log('Payment error:', error);
      // Show order confirmation with manual payment note
      Alert.alert(
        'Order Placed!',
        `Your order has been placed.\n\nOrder Number: ${orderNumber}\nTotal Amount: Rs ${grandTotal}\n\nPayment link will be sent to your WhatsApp.`,
        [
          {
            text: 'OK',
            onPress: () => {
              setCartItems([]);
              saveCart([]);
              navigation.navigate('Home');
            }
          }
        ]
      );
    } finally {
      setProcessingPayment(false);
    }
  };

  const renderSteps = () => (
    <View style={styles.stepsContainer}>
      <View style={[styles.step, currentStep === 1 && styles.stepActive]}>
        <Text style={[styles.stepText, currentStep === 1 && styles.stepTextActive]}>1. SUMMARY</Text>
      </View>
      <View style={[styles.step, currentStep === 2 && styles.stepActive]}>
        <Text style={[styles.stepText, currentStep === 2 && styles.stepTextActive]}>2. ADDRESS & SHIPPING</Text>
      </View>
      <View style={[styles.step, currentStep === 3 && styles.stepActive]}>
        <Text style={[styles.stepText, currentStep === 3 && styles.stepTextActive]}>3. PAYMENT</Text>
      </View>
    </View>
  );

  const renderCartItem = ({ item }) => {
    const unitPrice = parseFloat(item.productprice) || 0;
    const tax = parseFloat(item.cgst?.replace('%', '') || 0) + parseFloat(item.sgst?.replace('%', '') || 0);
    const itemTotal = (unitPrice + (unitPrice * tax / 100)) * item.quantity;

    return (
      <View style={styles.cartItem}>
        <Image 
          source={{ uri: item.productimage }} 
          style={styles.productImage}
          resizeMode="cover"
        />
        <View style={styles.itemDetails}>
          <Text style={styles.productName} numberOfLines={2}>{item.productname}</Text>
          <Text style={styles.productCode}>Code: {item.productcode}</Text>
          
          <View style={styles.priceRow}>
            <Text style={styles.unitPrice}>Rs. {item.productprice}</Text>
            <Text style={styles.taxInfo}>Tax: {tax}%</Text>
          </View>

          <View style={styles.quantityRow}>
            <View style={styles.quantityControls}>
              <TouchableOpacity 
                style={styles.qtyButton}
                onPress={() => updateQuantity(item.cart_id, -1)}
              >
                <Text style={styles.qtyButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.qtyValue}>{item.quantity}</Text>
              <TouchableOpacity 
                style={styles.qtyButton}
                onPress={() => updateQuantity(item.cart_id, 1)}
              >
                <Text style={styles.qtyButtonText}>+</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.itemTotal}>Rs. {itemTotal.toFixed(2)}</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => removeItem(item.cart_id)}
        >
          <Text style={styles.deleteIcon}>×</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Step 1: Cart Summary
  const renderSummaryStep = () => (
    <>
      <View style={styles.itemsCountContainer}>
        <Text style={styles.itemsCount}>
          Your shopping cart contains: <Text style={styles.itemsCountBold}>{getTotalItems()} Products</Text>
        </Text>
      </View>

      <View style={styles.tableHeader}>
        <Text style={styles.orderDetailsTitle}>Order Details</Text>
      </View>

      <FlatList
        data={cartItems}
        renderItem={renderCartItem}
        keyExtractor={(item) => item.cart_id?.toString()}
        style={styles.cartList}
      />

      <View style={styles.totalSection}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Price</Text>
          <Text style={styles.totalValue}>Rs {calculateTotal()}</Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.continueButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.continueButtonText}>Continue Shopping</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.deliveryButton}
          onPress={handleSelectDelivery}
        >
          <Text style={styles.deliveryButtonText}>Select Delivery</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  // Step 2: Address & Shipping
  const renderAddressStep = () => (
    <ScrollView style={styles.addressScrollView} showsVerticalScrollIndicator={false}>
      {/* Billing Address */}
      <View style={styles.addressSection}>
        <Text style={styles.addressSectionTitle}>YOUR BILLING ADDRESS</Text>
        {billingAddress ? (
          <View style={styles.addressContent}>
            <Text style={styles.addressText}>{billingAddress.firstname} {billingAddress.lastname}</Text>
            <Text style={styles.addressText}>{billingAddress.address}</Text>
            <Text style={styles.addressText}>{billingAddress.city} {billingAddress.postalcode}</Text>
            <Text style={styles.addressText}>{billingAddress.state}, {billingAddress.country}</Text>
            <Text style={styles.addressText}>{billingAddress.mobile_no}</Text>
          </View>
        ) : (
          <Text style={styles.noAddressText}>No billing address found</Text>
        )}
      </View>

      {/* Delivery Address */}
      <View style={styles.addressSection}>
        <Text style={styles.addressSectionTitle}>YOUR DELIVERY ADDRESS</Text>
        
        <TouchableOpacity 
          style={styles.checkboxRow}
          onPress={() => setUseBillingAsDelivery(!useBillingAsDelivery)}
        >
          <View style={[styles.checkbox, useBillingAsDelivery && styles.checkboxChecked]}>
            {useBillingAsDelivery && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>Use the billing address as the delivery address</Text>
        </TouchableOpacity>

        {!useBillingAsDelivery && (
          <View style={styles.deliveryForm}>
            <Text style={styles.formNote}>Please Update Your Delivery Address</Text>
            
            <View style={styles.inputRow}>
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>First Name<Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  value={deliveryAddress.firstname}
                  onChangeText={(text) => setDeliveryAddress({...deliveryAddress, firstname: text})}
                  placeholder="First Name"
                />
              </View>
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>Last Name<Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  value={deliveryAddress.lastname}
                  onChangeText={(text) => setDeliveryAddress({...deliveryAddress, lastname: text})}
                  placeholder="Last Name"
                />
              </View>
            </View>

            <Text style={styles.inputLabel}>Address<Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              value={deliveryAddress.address}
              onChangeText={(text) => setDeliveryAddress({...deliveryAddress, address: text})}
              placeholder="Address"
              multiline
            />

            <View style={styles.inputRow}>
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>Postal Code<Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  value={deliveryAddress.postalcode}
                  onChangeText={(text) => setDeliveryAddress({...deliveryAddress, postalcode: text})}
                  placeholder="Postal Code"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>City</Text>
                <TextInput
                  style={styles.input}
                  value={deliveryAddress.city}
                  onChangeText={(text) => setDeliveryAddress({...deliveryAddress, city: text})}
                  placeholder="City"
                />
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>State</Text>
                <TextInput
                  style={styles.input}
                  value={deliveryAddress.state}
                  onChangeText={(text) => setDeliveryAddress({...deliveryAddress, state: text})}
                  placeholder="State"
                />
              </View>
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>Country</Text>
                <TextInput
                  style={styles.input}
                  value={deliveryAddress.country}
                  onChangeText={(text) => setDeliveryAddress({...deliveryAddress, country: text})}
                  placeholder="Country"
                />
              </View>
            </View>

            <Text style={styles.inputLabel}>Mobile Number<Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              value={deliveryAddress.mobile_no}
              onChangeText={(text) => setDeliveryAddress({...deliveryAddress, mobile_no: text})}
              placeholder="Mobile Number"
              keyboardType="phone-pad"
            />
          </View>
        )}
      </View>

      {/* Shipping Option */}
      <View style={styles.shippingSection}>
        <Text style={styles.shippingSectionTitle}>Shipping</Text>
        <View style={styles.shippingOption}>
          <View style={[styles.radioButton, styles.radioButtonSelected]}>
            <View style={styles.radioButtonInner} />
          </View>
          <View style={styles.shippingInfo}>
            <Text style={styles.shippingTitle}>Courier</Text>
            <Text style={styles.shippingDesc}>Local Chennai same day Delivery. Other than Chennai 3 working Days for Delivery!</Text>
          </View>
          <Text style={styles.shippingApplicable}>Applicable</Text>
        </View>
      </View>

      {/* Terms of Service */}
      <View style={styles.termsSection}>
        <Text style={styles.termsTitle}>Terms of service</Text>
        <TouchableOpacity 
          style={styles.checkboxRow}
          onPress={() => setTermsAccepted(!termsAccepted)}
        >
          <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
            {termsAccepted && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.termsText}>
            I agree to the terms of service and will adhere to them unconditionally.{' '}
            <Text style={styles.termsLink}>(Read the Terms & Condition)</Text>
          </Text>
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <View style={styles.addressActionButtons}>
        <TouchableOpacity 
          style={styles.backStepButton}
          onPress={() => setCurrentStep(1)}
        >
          <Text style={styles.backStepButtonText}>Back to Cart</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.proceedButton, !termsAccepted && styles.proceedButtonDisabled]}
          onPress={handleProceedToPayment}
          disabled={processingPayment}
        >
          {processingPayment ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.proceedButtonText}>Proceed To Payment</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );

  // Step 3: Payment
  const renderPaymentStep = () => {
    const addressToUse = useBillingAsDelivery ? billingAddress : deliveryAddress;
    const totalAmount = parseFloat(calculateTotal());
    const shippingCost = 1.00;
    const grandTotal = (totalAmount + shippingCost).toFixed(2);

    return (
      <ScrollView style={styles.paymentScrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.paymentHeader}>
          <Text style={styles.paymentHeaderText}>
            Please choose your payment method. Your shopping cart contains: {getTotalItems()} Products
          </Text>
        </View>

        {/* Order Summary */}
        <View style={styles.orderSummarySection}>
          <Text style={styles.orderSummaryTitle}>Order Summary</Text>
          
          {cartItems.map((item, index) => {
            const unitPrice = parseFloat(item.productprice) || 0;
            const tax = parseFloat(item.cgst?.replace('%', '') || 0) + parseFloat(item.sgst?.replace('%', '') || 0);
            const itemTotal = (unitPrice + (unitPrice * tax / 100)) * item.quantity;
            
            return (
              <View key={index} style={styles.orderItem}>
                <Image source={{ uri: item.productimage }} style={styles.orderItemImage} />
                <View style={styles.orderItemDetails}>
                  <Text style={styles.orderItemName}>{item.productname}</Text>
                  <Text style={styles.orderItemInfo}>Unit Price: Rs. {item.productprice}</Text>
                  <Text style={styles.orderItemInfo}>Qty: {item.quantity} | Tax: {tax}%</Text>
                </View>
                <Text style={styles.orderItemTotal}>Rs. {itemTotal.toFixed(2)}</Text>
              </View>
            );
          })}
        </View>

        {/* Delivery & Price Summary */}
        <View style={styles.summaryRow}>
          <View style={styles.deliveryAddressBox}>
            <Text style={styles.deliveryAddressTitle}>YOUR DELIVERY ADDRESS</Text>
            <Text style={styles.deliveryAddressText}>{addressToUse?.firstname} {addressToUse?.lastname}</Text>
            <Text style={styles.deliveryAddressText}>{addressToUse?.address}</Text>
            <Text style={styles.deliveryAddressText}>{addressToUse?.city} {addressToUse?.postalcode}</Text>
            <Text style={styles.deliveryAddressText}>{addressToUse?.state}, {addressToUse?.country}</Text>
            <Text style={styles.deliveryAddressText}>{addressToUse?.mobile_no}</Text>
          </View>

          <View style={styles.priceSummaryBox}>
            <View style={styles.priceLineRow}>
              <Text style={styles.priceLineLabel}>Total Price</Text>
              <Text style={styles.priceLineValue}>Rs {totalAmount.toFixed(2)}</Text>
            </View>
            <View style={styles.priceLineRow}>
              <Text style={styles.priceLineLabel}>Shipping Cost</Text>
              <Text style={styles.priceLineValue}>Rs {shippingCost.toFixed(2)}</Text>
            </View>
            <View style={[styles.priceLineRow, styles.grandTotalRow]}>
              <Text style={styles.grandTotalLabel}>Total</Text>
              <Text style={styles.grandTotalValue}>Rs {grandTotal}</Text>
            </View>
          </View>
        </View>

        {/* Delivery Option */}
        <View style={styles.deliveryOptionBox}>
          <Text style={styles.deliveryOptionTitle}>YOUR DELIVERY OPTION</Text>
          <Text style={styles.deliveryOptionText}>Courier Delivery</Text>
        </View>

        {/* Razorpay Button */}
        <View style={styles.razorpaySection}>
          <View style={styles.razorpayBox}>
            <Image 
              source={require('../../assets/icons/razorpay-logo.jpg')} 
              style={styles.razorpayLogoImage}
              resizeMode="contain"
            />
            <Text style={styles.razorpayMethods}>CREDIT CARD | DEBIT CARD | NETBANKING</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.payButton}
            onPress={handleRazorpayPayment}
            disabled={processingPayment}
          >
            {processingPayment ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.payButtonText}>Pay Rs {grandTotal}</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Back Button */}
        <TouchableOpacity 
          style={styles.backToAddressButton}
          onPress={() => setCurrentStep(2)}
        >
          <Text style={styles.backToAddressButtonText}>Back to Address</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    );
  };

  const getHeaderTitle = () => {
    switch (currentStep) {
      case 1: return 'Shopping Cart';
      case 2: return 'Address & Shipping';
      case 3: return 'Payment';
      default: return 'Shopping Cart';
    }
  };

  if (loading && currentStep === 1) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2C4A6B" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{getHeaderTitle()}</Text>
        <View style={styles.placeholder} />
      </View>

      {cartItems.length === 0 && currentStep === 1 ? (
        <View style={styles.emptyCart}>
          <Text style={styles.emptyCartIcon}>🛒</Text>
          <Text style={styles.emptyCartText}>Your cart is empty</Text>
          <TouchableOpacity 
            style={styles.shopNowButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.shopNowText}>Shop Now</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Cart Title */}
          <View style={styles.cartTitleContainer}>
            <Text style={styles.cartTitle}>
              {currentStep === 1 ? 'SHOPPING CART SUMMARY' : 
               currentStep === 2 ? 'DELIVERY ADDRESS' : 
               'PAYMENT'}
            </Text>
          </View>

          {/* Steps */}
          {renderSteps()}

          {/* Step Content */}
          {currentStep === 1 && renderSummaryStep()}
          {currentStep === 2 && renderAddressStep()}
          {currentStep === 3 && renderPaymentStep()}
        </>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#2C4A6B',
  },
  backButton: {
    paddingVertical: 4,
    paddingRight: 8,
  },
  backText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 60,
  },
  cartTitleContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  cartTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3498DB',
  },
  stepsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  step: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 4,
    alignItems: 'center',
  },
  stepActive: {
    backgroundColor: '#2C4A6B',
    borderColor: '#2C4A6B',
  },
  stepText: {
    fontSize: 10,
    color: '#666',
    fontWeight: '600',
    textAlign: 'center',
  },
  stepTextActive: {
    color: '#FFFFFF',
  },
  itemsCountContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  itemsCount: {
    fontSize: 14,
    color: '#666',
  },
  itemsCountBold: {
    fontWeight: '600',
    color: '#3498DB',
  },
  tableHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8F8F8',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E0E0E0',
  },
  orderDetailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  cartList: {
    flex: 1,
  },
  cartItem: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  productImage: {
    width: 70,
    height: 70,
    borderRadius: 6,
    backgroundColor: '#F0F0F0',
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  productCode: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  unitPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  taxInfo: {
    fontSize: 12,
    color: '#666',
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 4,
  },
  qtyButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  qtyButtonText: {
    fontSize: 16,
    color: '#3498DB',
    fontWeight: '600',
  },
  qtyValue: {
    width: 32,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  deleteButton: {
    padding: 8,
    justifyContent: 'center',
  },
  deleteIcon: {
    fontSize: 24,
    color: '#E74C3C',
  },
  totalSection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#F8F8F8',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3498DB',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#FFFFFF',
  },
  continueButton: {
    flex: 1,
    backgroundColor: '#2C4A6B',
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  deliveryButton: {
    flex: 1,
    backgroundColor: '#2C4A6B',
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
  },
  deliveryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyCart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyCartIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyCartText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 24,
  },
  shopNowButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
  },
  shopNowText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Step 2 Styles
  addressScrollView: {
    flex: 1,
  },
  addressSection: {
    margin: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  addressSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E3A5F',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  addressContent: {
    padding: 12,
  },
  addressText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  noAddressText: {
    fontSize: 14,
    color: '#999',
    padding: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 3,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#3498DB',
    borderColor: '#3498DB',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  deliveryForm: {
    padding: 12,
    paddingTop: 0,
  },
  formNote: {
    fontSize: 14,
    color: '#E74C3C',
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputHalf: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 13,
    color: '#333',
    marginBottom: 6,
    fontWeight: '500',
  },
  required: {
    color: '#E74C3C',
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  shippingSection: {
    margin: 16,
    marginTop: 0,
  },
  shippingSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E74C3C',
    marginBottom: 12,
  },
  shippingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 4,
    backgroundColor: '#F8FFF8',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#3498DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioButtonSelected: {
    borderColor: '#3498DB',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3498DB',
  },
  shippingInfo: {
    flex: 1,
  },
  shippingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  shippingDesc: {
    fontSize: 12,
    color: '#666',
  },
  shippingApplicable: {
    fontSize: 13,
    color: '#666',
  },
  termsSection: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 4,
  },
  termsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    color: '#333',
    lineHeight: 20,
  },
  termsLink: {
    color: '#3498DB',
    fontWeight: '600',
  },
  addressActionButtons: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  backStepButton: {
    flex: 1,
    backgroundColor: '#6C757D',
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
  },
  backStepButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  proceedButton: {
    flex: 1,
    backgroundColor: '#1E3A5F',
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
  },
  proceedButtonDisabled: {
    backgroundColor: '#B0C4DE',
  },
  proceedButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // Step 3 Styles
  paymentScrollView: {
    flex: 1,
  },
  paymentHeader: {
    backgroundColor: '#E8F4FD',
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 4,
    marginBottom: 16,
  },
  paymentHeaderText: {
    fontSize: 14,
    color: '#3498DB',
    fontWeight: '500',
  },
  orderSummarySection: {
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 16,
  },
  orderSummaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    padding: 12,
    backgroundColor: '#F8F8F8',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  orderItem: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    alignItems: 'center',
  },
  orderItemImage: {
    width: 50,
    height: 50,
    borderRadius: 4,
    backgroundColor: '#F0F0F0',
  },
  orderItemDetails: {
    flex: 1,
    marginLeft: 12,
  },
  orderItemName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  orderItemInfo: {
    fontSize: 12,
    color: '#666',
  },
  orderItemTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  summaryRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  deliveryAddressBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 4,
    padding: 12,
  },
  deliveryAddressTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E3A5F',
    marginBottom: 8,
  },
  deliveryAddressText: {
    fontSize: 12,
    color: '#333',
    marginBottom: 2,
  },
  priceSummaryBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 4,
  },
  priceLineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  priceLineLabel: {
    fontSize: 13,
    color: '#333',
  },
  priceLineValue: {
    fontSize: 13,
    color: '#3498DB',
    fontWeight: '600',
  },
  grandTotalRow: {
    borderBottomWidth: 0,
    backgroundColor: '#F8F8F8',
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  grandTotalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3498DB',
  },
  deliveryOptionBox: {
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
  },
  deliveryOptionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E3A5F',
    marginBottom: 8,
  },
  deliveryOptionText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  razorpaySection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  razorpayBox: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 4,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  razorpayLogoImage: {
    width: 150,
    height: 40,
    marginBottom: 8,
  },
  razorpayMethods: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  payButton: {
    backgroundColor: '#1E3A5F',
    paddingVertical: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  backToAddressButton: {
    marginHorizontal: 16,
    backgroundColor: '#6C757D',
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
  },
  backToAddressButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default CartScreen;
