import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { contentAPI } from '../services/api';

const ContactUsScreen = ({ navigation }) => {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const response = await contentAPI.getContactUs();
      setContent(response);
    } catch (error) {
      console.log('Error fetching contact us:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhone = (phone) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleEmail = (email) => {
    Linking.openURL(`mailto:${email}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Us</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {content ? (
            <>
              {content.title && <Text style={styles.title}>{content.title}</Text>}
              
              {content.phone && (
                <TouchableOpacity style={styles.contactItem} onPress={() => handlePhone(content.phone)}>
                  <Text style={styles.contactLabel}>Phone</Text>
                  <Text style={styles.contactValue}>{content.phone}</Text>
                </TouchableOpacity>
              )}

              {content.email && (
                <TouchableOpacity style={styles.contactItem} onPress={() => handleEmail(content.email)}>
                  <Text style={styles.contactLabel}>Email</Text>
                  <Text style={styles.contactValue}>{content.email}</Text>
                </TouchableOpacity>
              )}

              {content.address && (
                <View style={styles.contactItem}>
                  <Text style={styles.contactLabel}>Address</Text>
                  <Text style={styles.contactValue}>{content.address}</Text>
                </View>
              )}

              {content.description && <Text style={styles.description}>{content.description}</Text>}

              {Array.isArray(content) && content.map((item, index) => (
                <View key={index} style={styles.section}>
                  {item.title && <Text style={styles.sectionTitle}>{item.title}</Text>}
                  {item.phone && (
                    <TouchableOpacity onPress={() => handlePhone(item.phone)}>
                      <Text style={styles.contactValue}>{item.phone}</Text>
                    </TouchableOpacity>
                  )}
                  {item.email && (
                    <TouchableOpacity onPress={() => handleEmail(item.email)}>
                      <Text style={styles.contactValue}>{item.email}</Text>
                    </TouchableOpacity>
                  )}
                  {item.address && <Text style={styles.description}>{item.address}</Text>}
                </View>
              ))}
            </>
          ) : (
            <Text style={styles.noContent}>Content not available</Text>
          )}
        </View>
      </ScrollView>
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
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
    backgroundColor: '#F0F4F8',
  },
  backButton: {
    paddingVertical: 4,
    paddingRight: 8,
  },
  backText: {
    fontSize: 16,
    color: '#3498DB',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
  },
  placeholder: {
    width: 60,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 24,
  },
  contactItem: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  contactLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  contactValue: {
    fontSize: 16,
    color: '#3498DB',
    fontWeight: '500',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: '#555',
  },
  noContent: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 40,
  },
});

export default ContactUsScreen;

