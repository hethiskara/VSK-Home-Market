import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { contentAPI } from '../services/api';

// Simple HTML tag stripper and parser
const parseHtmlContent = (html) => {
  if (!html) return [];
  
  // Replace <br>, <br/>, <br /> with newlines
  let text = html.replace(/<br\s*\/?>/gi, '\n');
  // Replace </p> with double newlines
  text = text.replace(/<\/p>/gi, '\n\n');
  // Remove all other HTML tags
  text = text.replace(/<[^>]*>/g, '');
  // Decode HTML entities
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&quot;/g, '"');
  // Trim whitespace
  text = text.trim();
  
  return text;
};

// Extract phone and email from text
const extractContactInfo = (text) => {
  const phoneMatch = text.match(/(?:Phone\s*:\s*|Tel\s*:\s*)?(\d{10,11})/i);
  const emailMatch = text.match(/(?:Email\s*:\s*)?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
  
  return {
    phone: phoneMatch ? phoneMatch[1] : null,
    email: emailMatch ? emailMatch[1] : null,
  };
};

const ContactUsScreen = ({ navigation }) => {
  const [content, setContent] = useState(null);
  const [parsedContent, setParsedContent] = useState('');
  const [contactInfo, setContactInfo] = useState({ phone: null, email: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const response = await contentAPI.getContactUs();
      console.log('Contact response:', response);
      setContent(response);
      
      // Parse the HTML content
      if (Array.isArray(response) && response[0]?.content) {
        const parsed = parseHtmlContent(response[0].content);
        setParsedContent(parsed);
        setContactInfo(extractContactInfo(parsed));
      } else if (response?.content) {
        const parsed = parseHtmlContent(response.content);
        setParsedContent(parsed);
        setContactInfo(extractContactInfo(parsed));
      }
    } catch (error) {
      console.log('Error fetching contact us:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhone = () => {
    if (contactInfo.phone) {
      Linking.openURL(`tel:${contactInfo.phone}`);
    }
  };

  const handleEmail = () => {
    if (contactInfo.email) {
      Linking.openURL(`mailto:${contactInfo.email}`);
    }
  };

  const handleWhatsApp = () => {
    Linking.openURL('https://api.whatsapp.com/send?phone=+919710412346');
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
          <Text style={styles.title}>Get In Touch</Text>
          
          {/* Address Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Our Address</Text>
            <Text style={styles.addressText}>{parsedContent}</Text>
          </View>

          {/* Quick Contact Buttons */}
          {contactInfo.phone && (
            <TouchableOpacity style={styles.contactButton} onPress={handlePhone}>
              <Text style={styles.contactIcon}>📞</Text>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Call Us</Text>
                <Text style={styles.contactValue}>{contactInfo.phone}</Text>
              </View>
              <Text style={styles.contactArrow}>→</Text>
            </TouchableOpacity>
          )}

          {contactInfo.email && (
            <TouchableOpacity style={styles.contactButton} onPress={handleEmail}>
              <Text style={styles.contactIcon}>✉️</Text>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Email Us</Text>
                <Text style={styles.contactValue}>{contactInfo.email}</Text>
              </View>
              <Text style={styles.contactArrow}>→</Text>
            </TouchableOpacity>
          )}

          {/* WhatsApp Button */}
          <TouchableOpacity style={styles.whatsappButton} onPress={handleWhatsApp}>
            <View style={styles.whatsappIconContainer}>
              <Image 
                source={require('../../assets/icons/whatsapp.png')} 
                style={styles.whatsappIcon}
              />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.whatsappLabel}>Chat on WhatsApp</Text>
              <Text style={styles.whatsappValue}>+91 9710412346</Text>
            </View>
            <Text style={styles.whatsappArrow}>→</Text>
          </TouchableOpacity>
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
  card: {
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B35',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 12,
  },
  addressText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#555',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  contactIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 16,
    color: '#3498DB',
    fontWeight: '600',
  },
  contactArrow: {
    fontSize: 20,
    color: '#3498DB',
  },
  whatsappButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#25D366',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  whatsappIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  whatsappIcon: {
    width: 28,
    height: 28,
  },
  whatsappLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 2,
  },
  whatsappValue: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  whatsappArrow: {
    fontSize: 20,
    color: '#FFFFFF',
  },
});

export default ContactUsScreen;
