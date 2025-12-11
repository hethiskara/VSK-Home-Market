import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CART_STORAGE_KEY = '@vsk_cart';

const CartScreen = ({ navigation }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCart();
  }, []);

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
          <Text style={styles.deleteIcon}>🗑</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderSteps = () => (
    <View style={styles.stepsContainer}>
      <View style={[styles.step, styles.stepActive]}>
        <Text style={[styles.stepText, styles.stepTextActive]}>1. SUMMARY</Text>
      </View>
      <View style={styles.step}>
        <Text style={styles.stepText}>2. SIGN IN</Text>
      </View>
      <View style={styles.step}>
        <Text style={styles.stepText}>3. ADDRESS</Text>
      </View>
      <View style={styles.step}>
        <Text style={styles.stepText}>4. SHIPPING</Text>
      </View>
      <View style={styles.step}>
        <Text style={styles.stepText}>5. PAYMENT</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shopping Cart</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Breadcrumb */}
      <View style={styles.breadcrumb}>
        <Text style={styles.breadcrumbText}>
          <Text style={styles.breadcrumbLink}>Home</Text>
          <Text> » Your Shopping Cart</Text>
        </Text>
      </View>

      {cartItems.length === 0 ? (
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
            <Text style={styles.cartTitle}>SHOPPING CART SUMMARY</Text>
          </View>

          {/* Steps */}
          {renderSteps()}

          {/* Items Count */}
          <View style={styles.itemsCountContainer}>
            <Text style={styles.itemsCount}>
              Your shopping cart contains: <Text style={styles.itemsCountBold}>{getTotalItems()} Products</Text>
            </Text>
          </View>

          {/* Order Details Header */}
          <View style={styles.tableHeader}>
            <Text style={styles.orderDetailsTitle}>Order Details</Text>
          </View>

          {/* Cart Items */}
          <FlatList
            data={cartItems}
            renderItem={renderCartItem}
            keyExtractor={(item) => item.cart_id?.toString()}
            style={styles.cartList}
          />

          {/* Total Section */}
          <View style={styles.totalSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Price</Text>
              <Text style={styles.totalValue}>Rs {calculateTotal()}</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.continueButton}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={styles.continueButtonText}>Continue Shopping</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deliveryButton}>
              <Text style={styles.deliveryButtonText}>Select Delivery</Text>
            </TouchableOpacity>
          </View>
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
  breadcrumb: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F5F5F5',
  },
  breadcrumbText: {
    fontSize: 13,
    color: '#666',
  },
  breadcrumbLink: {
    color: '#3498DB',
  },
  cartTitleContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  cartTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3498DB',
  },
  stepsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  step: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 4,
  },
  stepActive: {
    backgroundColor: '#2C4A6B',
    borderColor: '#2C4A6B',
  },
  stepText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
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
    fontSize: 20,
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
    color: '#FF6B35',
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
});

export default CartScreen;

