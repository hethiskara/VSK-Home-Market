import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import Input from '../components/Input';
import Button from '../components/Button';
import { authAPI } from '../services/api';

const ForgotPasswordScreen = ({ navigation }) => {
  const [mobileNo, setMobileNo] = useState('');
  const [loading, setLoading] = useState(false);

  const validateMobile = (mobile) => {
    const regex = /^[6-9]\d{9}$/;
    return regex.test(mobile);
  };

  const handleForgotPassword = async () => {
    if (!validateMobile(mobileNo)) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.forgotPassword({
        mobile_no: mobileNo.trim(),
      });

      const result = Array.isArray(response) ? response[0] : response;

      if (result.status === 'SUCCESS') {
        Alert.alert(
          'Password Sent!', 
          'A new password has been sent to your WhatsApp. Please use that password to login.',
          [
            {
              text: 'Go to Login',
              onPress: () => navigation.navigate('Login'),
            },
          ]
        );
      } else {
        Alert.alert('Error', result.message || 'Failed to send password');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Network error. Please try again.';
      Alert.alert('Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <Image
          source={require('../../assets/Logos/logo.jpg')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.title}>Forgot Password?</Text>
        <Text style={styles.subtitle}>
          Enter your registered mobile number.{'\n'}
          We'll send a new password to your WhatsApp.
        </Text>

        <View style={styles.form}>
          <Input
            placeholder="Mobile Number"
            value={mobileNo}
            onChangeText={setMobileNo}
            keyboardType="phone-pad"
            maxLength={10}
          />

          <Button
            title="Send New Password"
            onPress={handleForgotPassword}
            loading={loading}
          />
        </View>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    alignItems: 'center',
  },
  logo: {
    width: 180,
    height: 65,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
  },
  form: {
    width: '100%',
  },
  backButton: {
    marginTop: 30,
  },
  backText: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '600',
  },
});

export default ForgotPasswordScreen;
