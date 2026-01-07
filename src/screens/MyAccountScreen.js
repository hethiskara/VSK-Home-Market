import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { checkoutAPI, tokenManager } from '../services/api';

const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;
const THEME_COLOR = '#2C4A6B';

const MyAccountScreen = ({ navigation }) => {
  // Edit Profile Modal
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editProfileLoading, setEditProfileLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    mobile_no: '',
    firstname: '',
    lastname: '',
    country: 'India',
    state: '',
    city: '',
    postalcode: '',
    address: '',
  });

  // Change Password Modal
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [userId, setUserId] = useState(null);

  // Fetch user profile data
  const fetchUserProfile = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsed = JSON.parse(userData);
        setUserId(parsed.userid);
        
        // Fetch full user data from API
        const response = await checkoutAPI.getUserData(parsed.userid);
        console.log('USER PROFILE RESPONSE:', response);
        
        if (Array.isArray(response) && response[0]?.userdata?.[0]) {
          const user = response[0].userdata[0];
          setProfileData({
            mobile_no: user.mobile_no || '',
            firstname: user.firstname || '',
            lastname: user.lastname || '',
            country: user.country || 'India',
            state: user.state || '',
            city: user.city || '',
            postalcode: user.postalcode || '',
            address: user.address || '',
          });
        }
      }
    } catch (error) {
      console.log('Error fetching profile:', error);
    }
  };

  // Handle Edit Profile
  const handleEditProfilePress = async () => {
    await fetchUserProfile();
    setShowEditProfile(true);
  };

  const handleSaveProfile = async () => {
    if (!profileData.firstname.trim() || !profileData.mobile_no.trim()) {
      Alert.alert('Required', 'First name and mobile number are required');
      return;
    }

    try {
      setEditProfileLoading(true);
      const params = `mobile_no=${encodeURIComponent(profileData.mobile_no)}&firstname=${encodeURIComponent(profileData.firstname)}&lastname=${encodeURIComponent(profileData.lastname)}&country=${encodeURIComponent(profileData.country)}&state=${encodeURIComponent(profileData.state)}&city=${encodeURIComponent(profileData.city)}&postalcode=${encodeURIComponent(profileData.postalcode)}&address=${encodeURIComponent(profileData.address)}`;
      
      console.log('EDIT PROFILE URL:', `/editprofile-json?${params}`);
      const response = await api.get(`/editprofile-json?${params}`);
      console.log('EDIT PROFILE RESPONSE:', response.data);

      if (response.data?.status === true || response.data?.status === 'true' || response.data?.message?.toLowerCase().includes('success')) {
        Alert.alert('Success', response.data?.message || 'Profile updated successfully');
        setShowEditProfile(false);
        
        // Update local storage
        const userData = await AsyncStorage.getItem('userData');
        if (userData) {
          const parsed = JSON.parse(userData);
          parsed.firstname = profileData.firstname;
          parsed.lastname = profileData.lastname;
          await AsyncStorage.setItem('userData', JSON.stringify(parsed));
        }
      } else {
        Alert.alert('Error', response.data?.message || 'Failed to update profile');
      }
    } catch (error) {
      console.log('Edit profile error:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setEditProfileLoading(false);
    }
  };

  // Handle Change Password
  const handleChangePasswordPress = async () => {
    const userData = await AsyncStorage.getItem('userData');
    if (userData) {
      const parsed = JSON.parse(userData);
      setUserId(parsed.userid);
    }
    setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    setShowChangePassword(true);
  };

  const handleSavePassword = async () => {
    if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      Alert.alert('Required', 'All fields are required');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert('Error', 'New password and confirm password do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters');
      return;
    }

    try {
      setChangePasswordLoading(true);
      const params = `user_id=${userId}&oldpassword=${encodeURIComponent(passwordData.oldPassword)}&newpassword=${encodeURIComponent(passwordData.newPassword)}&renewpassword=${encodeURIComponent(passwordData.confirmPassword)}`;
      
      console.log('CHANGE PASSWORD URL:', `/changepassword-json?${params}`);
      const response = await api.get(`/changepassword-json?${params}`);
      console.log('CHANGE PASSWORD RESPONSE:', response.data);

      if (response.data?.message?.toLowerCase().includes('success')) {
        Alert.alert('Success', 'Password changed successfully');
        setShowChangePassword(false);
      } else {
        Alert.alert('Error', response.data?.message || 'Failed to change password');
      }
    } catch (error) {
      console.log('Change password error:', error);
      Alert.alert('Error', 'Failed to change password. Please try again.');
    } finally {
      setChangePasswordLoading(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await tokenManager.clearAll();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          },
        },
      ]
    );
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
      <Text style={styles.headerTitle}>My Account</Text>
      <View style={styles.headerRight} />
    </View>
  );

  const menuItems = [
    {
      id: 'edit-profile',
      title: 'Edit Profile',
      icon: '👤',
      iconComponent: (
        <View style={styles.iconContainer}>
          <View style={styles.profileIconLarge}>
            <View style={styles.profileHeadLarge} />
            <View style={styles.profileBodyLarge} />
          </View>
          <View style={styles.editPencil}>
            <Text style={styles.pencilText}>✎</Text>
          </View>
        </View>
      ),
      onPress: handleEditProfilePress,
    },
    {
      id: 'change-password',
      title: 'Change Password',
      iconComponent: (
        <View style={styles.iconContainer}>
          <View style={styles.lockIcon}>
            <View style={styles.lockTop} />
            <View style={styles.lockBody}>
              <View style={styles.lockHole} />
            </View>
          </View>
        </View>
      ),
      onPress: handleChangePasswordPress,
    },
    {
      id: 'my-orders',
      title: 'My Orders',
      iconComponent: (
        <View style={styles.iconContainer}>
          <View style={styles.orderIcon}>
            <View style={styles.orderLine} />
            <View style={styles.orderLine} />
            <View style={styles.orderLineShort} />
          </View>
        </View>
      ),
      onPress: () => navigation.navigate('Orders'),
    },
    {
      id: 'logout',
      title: 'Logout',
      iconComponent: (
        <View style={styles.iconContainer}>
          <View style={styles.logoutIcon}>
            <View style={styles.logoutDoor} />
            <View style={styles.logoutArrow}>
              <Text style={styles.arrowText}>→</Text>
            </View>
          </View>
        </View>
      ),
      onPress: handleLogout,
      isLogout: true,
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME_COLOR} />
      {renderHeader()}

      <View style={styles.content}>
        <View style={styles.grid}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.gridItem, item.isLogout && styles.gridItemLogout]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              {item.iconComponent}
              <Text style={[styles.gridItemText, item.isLogout && styles.gridItemTextLogout]}>
                {item.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditProfile}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditProfile(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Profile</Text>
                <TouchableOpacity onPress={() => setShowEditProfile(false)}>
                  <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>First Name *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={profileData.firstname}
                    onChangeText={(text) => setProfileData({ ...profileData, firstname: text })}
                    placeholder="Enter first name"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Last Name</Text>
                  <TextInput
                    style={styles.formInput}
                    value={profileData.lastname}
                    onChangeText={(text) => setProfileData({ ...profileData, lastname: text })}
                    placeholder="Enter last name"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Mobile Number *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={profileData.mobile_no}
                    onChangeText={(text) => setProfileData({ ...profileData, mobile_no: text })}
                    placeholder="Enter mobile number"
                    keyboardType="phone-pad"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Address</Text>
                  <TextInput
                    style={[styles.formInput, styles.formInputMultiline]}
                    value={profileData.address}
                    onChangeText={(text) => setProfileData({ ...profileData, address: text })}
                    placeholder="Enter address"
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>City</Text>
                  <TextInput
                    style={styles.formInput}
                    value={profileData.city}
                    onChangeText={(text) => setProfileData({ ...profileData, city: text })}
                    placeholder="Enter city"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>State</Text>
                  <TextInput
                    style={styles.formInput}
                    value={profileData.state}
                    onChangeText={(text) => setProfileData({ ...profileData, state: text })}
                    placeholder="Enter state"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Postal Code</Text>
                  <TextInput
                    style={styles.formInput}
                    value={profileData.postalcode}
                    onChangeText={(text) => setProfileData({ ...profileData, postalcode: text })}
                    placeholder="Enter postal code"
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Country</Text>
                  <TextInput
                    style={styles.formInput}
                    value={profileData.country}
                    onChangeText={(text) => setProfileData({ ...profileData, country: text })}
                    placeholder="Enter country"
                  />
                </View>

                <TouchableOpacity
                  style={[styles.saveButton, editProfileLoading && styles.buttonDisabled]}
                  onPress={handleSaveProfile}
                  disabled={editProfileLoading}
                >
                  {editProfileLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        visible={showChangePassword}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowChangePassword(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
          >
            <View style={styles.modalContentSmall}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Change Password</Text>
                <TouchableOpacity onPress={() => setShowChangePassword(false)}>
                  <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Current Password</Text>
                <TextInput
                  style={styles.formInput}
                  value={passwordData.oldPassword}
                  onChangeText={(text) => setPasswordData({ ...passwordData, oldPassword: text })}
                  placeholder="Enter current password"
                  secureTextEntry
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>New Password</Text>
                <TextInput
                  style={styles.formInput}
                  value={passwordData.newPassword}
                  onChangeText={(text) => setPasswordData({ ...passwordData, newPassword: text })}
                  placeholder="Enter new password"
                  secureTextEntry
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Confirm New Password</Text>
                <TextInput
                  style={styles.formInput}
                  value={passwordData.confirmPassword}
                  onChangeText={(text) => setPasswordData({ ...passwordData, confirmPassword: text })}
                  placeholder="Confirm new password"
                  secureTextEntry
                />
              </View>

              <TouchableOpacity
                style={[styles.saveButton, changePasswordLoading && styles.buttonDisabled]}
                onPress={handleSavePassword}
                disabled={changePasswordLoading}
              >
                {changePasswordLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>Change Password</Text>
                )}
              </TouchableOpacity>
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
  content: {
    flex: 1,
    padding: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  gridItemLogout: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FFE0E0',
  },
  gridItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME_COLOR,
    marginTop: 12,
    textAlign: 'center',
  },
  gridItemTextLogout: {
    color: '#E74C3C',
  },
  iconContainer: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Profile Icon
  profileIconLarge: {
    width: 36,
    height: 40,
    alignItems: 'center',
  },
  profileHeadLarge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: THEME_COLOR,
  },
  profileBodyLarge: {
    width: 28,
    height: 16,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    backgroundColor: THEME_COLOR,
    marginTop: 4,
  },
  editPencil: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#27AE60',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pencilText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  // Lock Icon
  lockIcon: {
    alignItems: 'center',
  },
  lockTop: {
    width: 20,
    height: 12,
    borderWidth: 3,
    borderColor: THEME_COLOR,
    borderBottomWidth: 0,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  lockBody: {
    width: 28,
    height: 20,
    backgroundColor: THEME_COLOR,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockHole: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  // Order Icon
  orderIcon: {
    width: 32,
    height: 40,
    backgroundColor: THEME_COLOR,
    borderRadius: 4,
    padding: 6,
    justifyContent: 'space-around',
  },
  orderLine: {
    width: '100%',
    height: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  orderLineShort: {
    width: '60%',
    height: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  // Logout Icon
  logoutIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutDoor: {
    width: 24,
    height: 32,
    borderWidth: 3,
    borderColor: '#E74C3C',
    borderRadius: 4,
    borderRightWidth: 0,
  },
  logoutArrow: {
    marginLeft: -4,
  },
  arrowText: {
    fontSize: 24,
    color: '#E74C3C',
    fontWeight: '700',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    padding: 20,
  },
  modalContentSmall: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '90%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME_COLOR,
  },
  closeButton: {
    fontSize: 24,
    color: '#999999',
  },
  formScroll: {
    maxHeight: 400,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333333',
    backgroundColor: '#FAFAFA',
  },
  formInputMultiline: {
    height: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: THEME_COLOR,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MyAccountScreen;

