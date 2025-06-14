import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { getCurrentUser } from '@/utils/session';
import UserSelect from '@/components/New/user-selection';
import ActivitySelect from '@/components/New/activity-selection';
import Title from '@/components/New/title';
import {submitActivityFormWithErrorHandling} from '@/utils/submit';


export default function NewActivityScreen() {
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    date: new Date(),
    movingTime: 0,
    distance: 0,
    delegueId: '',
    description: '',
    gpxUrl: '',
    imageUrl: 'https://cyclotourisme-mag.com/wp-content/uploads/sites/2/2016/11/Cyclomontagnardes.jpg',
    users: [],
    comments: [],
  });
  const router = useRouter();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await getCurrentUser();
        setSessionUser(userData);
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateFormData = (data : any) => {
    setFormData({ ...formData, ...data });
  };

  // Add a resetForm function to clear form data
  const resetForm = () => {
    setCurrentStep(1); // Return to first step
    setFormData({
      id: '',
      title: '',
      date: new Date(),
      movingTime: 0,
      distance: 0,
      delegueId: '',
      description: '',
      gpxUrl: '',
      imageUrl: 'https://cyclotourisme-mag.com/wp-content/uploads/sites/2/2016/11/Cyclomontagnardes.jpg',
      users: [],
      comments: [],
    });
  };

  const handleSubmit = async () => {
    // Log the form data for debugging
    console.log('Form submitted with data:');
    console.log(JSON.stringify(formData, null, 2));
    
    // Prepare the data for submission
    const apiFormData = {
      ...formData,
      // Make sure ID is a number
      id: parseInt(formData.id) || 0,
      // Make sure delegueId is a number
      delegueId: parseInt(formData.delegueId) || 0,
      // Convert imageUrl to array if it's a string
      imageUrl: typeof formData.imageUrl === 'string' ? [formData.imageUrl] : formData.imageUrl,
      // Convert users to the expected format if needed
      users: Array.isArray(formData.users) ? formData.users.map(user => {
        if (typeof user === 'string') {
          return { userId: parseInt(user) || 0 };
        } else if (typeof user === 'number') {
          return { userId: user };
        }
        return user;
      }) : []
    };
    
    // Submit the form using the utility
    const success = await submitActivityFormWithErrorHandling(
      apiFormData, 
      (activityId) => {
        console.log(`Activity created successfully with ID: ${activityId}`);
        
        // Reset form after successful submission
        resetForm();
        
        // Show temporary success message
        Alert.alert(
          'Success',
          'Activity created successfully! Would you like to add another?',
          [
            {
              text: 'No, go to home',
              onPress: () => router.push('/home'),
              style: 'cancel',
            },
            {
              text: 'Yes, add another',
              onPress: () => {}, // Form is already reset, stay on page
            },
          ]
        );
      }
    );
    
    // If submission failed, stay on the current page
    if (!success) {
      console.log('Form submission failed');
    }
  };

  const renderStepIndicator = () => {
    return (
      <View style={styles.stepIndicator}>
        <View style={[styles.step, currentStep === 1 ? styles.activeStep : {}]}>
          <Text style={[styles.stepText, currentStep === 1 ? styles.activeStepText : {}]}>1</Text>
        </View>
        <View style={styles.stepLine}></View>
        <View style={[styles.step, currentStep === 2 ? styles.activeStep : {}]}>
          <Text style={[styles.stepText, currentStep === 2 ? styles.activeStepText : {}]}>2</Text>
        </View>
        <View style={styles.stepLine}></View>
        <View style={[styles.step, currentStep === 3 ? styles.activeStep : {}]}>
          <Text style={[styles.stepText, currentStep === 3 ? styles.activeStepText : {}]}>3</Text>
        </View>
      </View>
    );
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <Title formData={formData} updateFormData={updateFormData} />;
      case 2:
        return <UserSelect formData={formData} updateFormData={updateFormData} currentUser={sessionUser} />;
      case 3:
        return <ActivitySelect formData={formData} updateFormData={updateFormData} currentUser={sessionUser} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Create New Activity</Text>
      </View>
      
      {renderStepIndicator()}
      
      <View style={styles.formContainer}>
        {renderCurrentStep()}
      </View>
      
      <View style={styles.navigationButtons}>
        {currentStep > 1 && (
          <TouchableOpacity style={styles.navButton} onPress={prevStep}>
            <Text style={styles.navButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[styles.navButton, styles.primaryButton]} 
          onPress={nextStep}
        >
          <Text style={styles.primaryButtonText}>
            {currentStep === 3 ? 'Submit' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#FC4C02',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  formContainer: {
    flex: 1,
    padding: 20,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  step: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeStep: {
    backgroundColor: '#FC4C02',
  },
  stepText: {
    color: '#777',
    fontWeight: 'bold',
  },
  activeStepText: {
    color: 'white',
  },
  stepLine: {
    height: 2,
    width: 50,
    backgroundColor: '#e0e0e0',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  navButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  navButtonText: {
    color: '#555',
    fontWeight: 'bold',
  },
  primaryButton: {
    backgroundColor: '#FC4C02',
    borderColor: '#FC4C02',
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});