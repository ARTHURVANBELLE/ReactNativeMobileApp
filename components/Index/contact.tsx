import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Linking 
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

const ContactSection = () => {
  const handleLinkPress = (url: string) => {
    Linking.openURL(url).catch(err => console.error('An error occurred', err));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Contact Us</Text>
      
      <View style={styles.contactInfo}>
        <View style={styles.contactItem}>
          <FontAwesome name="map-marker" size={20} color="#4A90E2" style={styles.icon} />
          <Text style={styles.contactText}>123 App Street, Mobile City</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.contactItem} 
          onPress={() => handleLinkPress('tel:+1234567890')}
        >
          <FontAwesome name="phone" size={20} color="#4A90E2" style={styles.icon} />
          <Text style={styles.contactText}>(123) 456-7890</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.contactItem}
          onPress={() => handleLinkPress('mailto:contact@reactnativeapp.com')}
        >
          <FontAwesome name="envelope" size={20} color="#4A90E2" style={styles.icon} />
          <Text style={styles.contactText}>contact@reactnativeapp.com</Text>
        </TouchableOpacity>

        <View style={styles.scheduleContainer}>
          <Text style={styles.scheduleHeading}>Opening Hours</Text>
          <View style={styles.scheduleItem}>
            <Text style={styles.scheduleDay}>Monday - Friday:</Text>
            <Text style={styles.scheduleTime}>9:00 AM - 6:00 PM</Text>
          </View>
          <View style={styles.scheduleItem}>
            <Text style={styles.scheduleDay}>Saturday:</Text>
            <Text style={styles.scheduleTime}>10:00 AM - 4:00 PM</Text>
          </View>
          <View style={styles.scheduleItem}>
            <Text style={styles.scheduleDay}>Sunday:</Text>
            <Text style={styles.scheduleTime}>Closed</Text>
          </View>
        </View>
        
        <View style={styles.socialLinks}>
          <TouchableOpacity 
            onPress={() => handleLinkPress('https://facebook.com')}
            style={styles.socialButton}
          >
            <FontAwesome name="facebook" size={24} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => handleLinkPress('https://twitter.com')}
            style={styles.socialButton}
          >
            <FontAwesome name="twitter" size={24} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => handleLinkPress('https://instagram.com')}
            style={styles.socialButton}
          >
            <FontAwesome name="instagram" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2025 React Native Mobile App</Text>
        <Text style={styles.footerText}>All rights reserved</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  contactInfo: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    marginRight: 10,
    width: 24,
    textAlign: 'center',
  },
  contactText: {
    fontSize: 16,
    color: '#444',
    flex: 1,
  },
  scheduleContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  scheduleHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  scheduleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  scheduleDay: {
    fontSize: 15,
    color: '#555',
  },
  scheduleTime: {
    fontSize: 15,
    color: '#555',
  },
  socialLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  socialButton: {
    backgroundColor: '#4A90E2',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  footer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    alignItems: 'center',
  },
  footerText: {
    color: '#777',
    fontSize: 14,
    marginBottom: 5,
  },
});

export default ContactSection;