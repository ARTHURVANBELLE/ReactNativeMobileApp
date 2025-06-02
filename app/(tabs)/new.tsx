import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { getCurrentUser } from '@/utils/session';
import UserSelect from '@/components/New/user-selection';
import ActivitySelect from '@/components/New/activity-selection';
import Title from '@/components/New/title';

export default function NewActivityScreen() {
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: new Date(),
    users: [],
    stravaActivity: null,
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

  const handleSubmit = () => {
    // Log form data as formatted JSON
    console.log('Form submitted with data:');
    console.log(JSON.stringify(formData, null, 2));
    
    // Display success alert and navigate to home screen
    Alert.alert('Success', 'Activity created successfully!');
    router.push('/home');
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