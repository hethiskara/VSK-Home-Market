import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Button from '../components/Button';
import { authAPI } from '../services/api';

const OTPVerificationScreen = ({ route, navigation }) => {
  const { userId, mobile, otp: debugOtp } = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const inputRefs = useRef([]);

  useEffect(() => {
    console.log('=================================');
    console.log('OTP VERIFICATION SCREEN');
    console.log('User ID:', userId);
    console.log('Mobile:', mobile);
    console.log('OTP passed from signup:', debugOtp);
    console.log('=================================');
  }, []);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleOtpChange = (value, index) => {
    if (value.length > 1) {
      value = value.slice(-1);
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      Alert.alert('Error', 'Please enter complete 6-digit OTP');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.verifyOTP({
        id: userId,
        otp: otpString,
      });

      const result = Array.isArray(response) ? response[0] : response;

      if (result.status === 'SUCCESS') {
        Alert.alert('Success', result.message, [
          {
            text: 'OK',
            onPress: () => navigation.replace('Login'),
          },
        ]);
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const maskedMobile = mobile
    ? mobile.slice(0, 2) + '****' + mobile.slice(-4)
    : '';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar style="dark" />
      
      <View style={styles.content}>
        <Image
          source={require('../../assets/Logos/app-icon.jpg')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code sent to{'\n'}
          <Text style={styles.mobile}>{maskedMobile}</Text>
        </Text>

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              style={[styles.otpInput, digit && styles.otpInputFilled]}
              value={digit}
              onChangeText={(value) => handleOtpChange(value, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        <Button
          title="Verify & Continue"
          onPress={handleVerify}
          loading={loading}
          style={styles.button}
        />

        <View style={styles.resendContainer}>
          {timer > 0 ? (
            <Text style={styles.timerText}>
              Resend OTP in <Text style={styles.timerCount}>{timer}s</Text>
            </Text>
          ) : (
            <TouchableOpacity onPress={() => setTimer(60)}>
              <Text style={styles.resendText}>Resend OTP</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>Back to Signup</Text>
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
    paddingTop: 60,
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 100,
    marginBottom: 30,
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
  mobile: {
    color: '#2C3E50',
    fontWeight: '600',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 40,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '600',
    color: '#2C3E50',
    backgroundColor: '#F8F9FA',
  },
  otpInputFilled: {
    borderColor: '#FF6B35',
    backgroundColor: '#FFF5F2',
  },
  button: {
    width: '100%',
  },
  resendContainer: {
    marginTop: 30,
  },
  timerText: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  timerCount: {
    color: '#FF6B35',
    fontWeight: '600',
  },
  resendText: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '600',
  },
  backButton: {
    marginTop: 20,
  },
  backText: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '600',
  },
});

export default OTPVerificationScreen;
