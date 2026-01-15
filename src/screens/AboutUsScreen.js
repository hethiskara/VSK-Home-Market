import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { contentAPI } from '../services/api';

// Simple HTML tag stripper
const parseHtmlContent = (html) => {
  if (!html) return '';
  
  // Replace <br>, <br/>, <br /> with newlines
  let text = html.replace(/<br\s*\/?>/gi, '\n');
  // Replace </p> with double newlines
  text = text.replace(/<\/p>/gi, '\n\n');
  // Replace <p> tags
  text = text.replace(/<p[^>]*>/gi, '');
  // Remove all other HTML tags
  text = text.replace(/<[^>]*>/g, '');
  // Decode HTML entities
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  // Trim whitespace and remove extra newlines
  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.trim();
  
  return text;
};

const AboutUsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [content, setContent] = useState(null);
  const [parsedContent, setParsedContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const response = await contentAPI.getAboutUs();
      console.log('About Us response:', response);
      setContent(response);
      
      // Parse the HTML content
      if (Array.isArray(response) && response[0]?.content) {
        setParsedContent(parseHtmlContent(response[0].content));
      } else if (response?.content) {
        setParsedContent(parseHtmlContent(response.content));
      } else if (typeof response === 'string') {
        setParsedContent(parseHtmlContent(response));
      }
    } catch (error) {
      console.log('Error fetching about us:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={[styles.loadingContainer, { paddingBottom: insets.bottom }]}>
          <ActivityIndicator size="large" color="#FF6B35" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About Us</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        <View style={styles.content}>
          <Text style={styles.title}>About VSK Home Market</Text>
          
          {parsedContent ? (
            <View style={styles.card}>
              <Text style={styles.description}>{parsedContent}</Text>
            </View>
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
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B35',
  },
  description: {
    fontSize: 15,
    lineHeight: 26,
    color: '#555',
  },
  noContent: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 40,
  },
});

export default AboutUsScreen;
