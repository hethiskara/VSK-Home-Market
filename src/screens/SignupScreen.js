import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import Input from '../components/Input';
import Button from '../components/Button';
import { authAPI } from '../services/api';

const SignupScreen = ({ navigation }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobileNo, setMobileNo] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  const validateMobile = (mobile) => {
    const regex = /^[6-9]\d{9}$/;
    return regex.test(mobile);
  };

  const handleSignup = async () => {
    if (!firstName.trim()) {
      Alert.alert('Error', 'Please enter your first name');
      return;
    }

    if (!lastName.trim()) {
      Alert.alert('Error', 'Please enter your last name');
      return;
    }

    if (!validateMobile(mobileNo)) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (!state.trim()) {
      Alert.alert('Error', 'Please enter your state');
      return;
    }

    if (!city.trim()) {
      Alert.alert('Error', 'Please enter your city');
      return;
    }

    if (!postalCode.trim()) {
      Alert.alert('Error', 'Please enter your postal code');
      return;
    }

    if (!address.trim()) {
      Alert.alert('Error', 'Please enter your address');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.register({
        mobile_no: mobileNo.trim(),
        firstname: firstName.trim(),
        lastname: lastName.trim(),
        password: password,
        state: state.trim(),
        city: city.trim(),
        postalcode: postalCode.trim(),
        address: address.trim(),
      });

      const result = Array.isArray(response) ? response[0] : response;

      if (result.status === 'SUCCESS') {
        console.log('Navigating to OTP screen with:', { id: result.id, otp: result.otp });
        Alert.alert('OTP Sent', result.message, [
          {
            text: 'OK',
            onPress: () => {
              navigation.navigate('OTPVerification', {
                userId: result.id,
                mobile: mobileNo,
                otp: result.otp,
              });
            },
          },
        ]);
      } else {
        Alert.alert('Error', result.message || 'Registration failed');
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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Image
            source={require('../../assets/Logos/app-icon.jpg')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up to get started</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Input
                placeholder="First Name"
                value={firstName}
                onChangeText={setFirstName}
              />
            </View>
            <View style={styles.halfInput}>
              <Input
                placeholder="Last Name"
                value={lastName}
                onChangeText={setLastName}
              />
            </View>
          </View>

          <Input
            placeholder="Mobile Number"
            value={mobileNo}
            onChangeText={setMobileNo}
            keyboardType="phone-pad"
            maxLength={10}
          />

          <Input
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Input
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Input
                placeholder="State"
                value={state}
                onChangeText={setState}
              />
            </View>
            <View style={styles.halfInput}>
              <Input
                placeholder="City"
                value={city}
                onChangeText={setCity}
              />
            </View>
          </View>

          <Input
            placeholder="Postal Code"
            value={postalCode}
            onChangeText={setPostalCode}
            keyboardType="number-pad"
            maxLength={6}
          />

          <Input
            placeholder="Address"
            value={address}
            onChangeText={setAddress}
          />

          <Button
            title="Sign Up"
            onPress={handleSignup}
            loading={loading}
          />

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 30,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 120,
    height: 100,
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: '#7F8C8D',
  },
  form: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#7F8C8D',
    fontSize: 14,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    color: '#7F8C8D',
    fontSize: 14,
  },
  loginLink: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default SignupScreen;
