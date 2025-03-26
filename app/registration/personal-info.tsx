import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ActionButton } from '@/components/ActionButton';
import { FormInput } from '@/components/FormInput';
import { SelectionCard } from '@/components/SelectionCard';
import { ProgressIndicator } from '@/components/ProgressIndicator';
import { useRegistration } from '@/contexts/RegistrationContext';
import { Gender } from '@/utils/macroCalculator';
import { useColorScheme } from '@/hooks/useColorScheme';

const REGISTRATION_STEPS = [
  'Welcome',
  'Personal Info',
  'Activity',
  'Goals',
  'Results'
];

export default function PersonalInfoScreen() {
  const { userData, updateUserData, nextStep, prevStep, isStepValid } = useRegistration();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Local state for form validation
  const [errors, setErrors] = useState({
    height: '',
    weight: '',
    age: '',
    gender: '',
  });
  
  // Validate form fields
  const validateForm = () => {
    const newErrors = {
      height: '',
      weight: '',
      age: '',
      gender: '',
    };
    
    if (!userData.height) {
      newErrors.height = 'Height is required';
    } else if (userData.height < 100 || userData.height > 250) {
      newErrors.height = 'Height should be between 100-250 cm';
    }
    
    if (!userData.weight) {
      newErrors.weight = 'Weight is required';
    } else if (userData.weight < 30 || userData.weight > 300) {
      newErrors.weight = 'Weight should be between 30-300 kg';
    }
    
    if (!userData.age) {
      newErrors.age = 'Age is required';
    } else if (userData.age < 16 || userData.age > 100) {
      newErrors.age = 'Age should be between 16-100 years';
    }
    
    if (!userData.gender) {
      newErrors.gender = 'Please select your gender';
    }
    
    setErrors(newErrors);
    
    // Return true if no errors
    return !Object.values(newErrors).some(error => error);
  };
  
  const handleContinue = () => {
    if (validateForm()) {
      nextStep();
      router.push('/registration/activity');
    }
  };
  
  const handleBack = () => {
    prevStep();
    router.push('/registration/welcome');
  };
  
  const handleSelectGender = (gender: Gender) => {
    updateUserData({ gender });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ThemedView style={styles.container}>
        <StatusBar style="auto" />
        
        <Stack.Screen
          options={{
            title: 'Personal Information',
            headerShown: true,
          }}
        />
        
        <ThemedView style={styles.headerSection}>
          <LinearGradient
            colors={isDark ? 
              ['rgba(8, 145, 178, 0.2)', 'rgba(8, 145, 178, 0.05)'] : 
              ['rgba(8, 145, 178, 0.1)', 'rgba(8, 145, 178, 0.02)']}
            style={styles.headerGradient}
          >
            <ProgressIndicator steps={REGISTRATION_STEPS} />
          </LinearGradient>
        </ThemedView>
        
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <BlurView 
            intensity={30} 
            tint={isDark ? 'dark' : 'light'}
            style={styles.formContainer}
          >
            <LinearGradient
              colors={isDark ? 
                ['rgba(30, 41, 59, 0.4)', 'rgba(30, 41, 59, 0.2)'] : 
                ['rgba(255, 255, 255, 0.8)', 'rgba(255, 255, 255, 0.6)']}
              style={styles.formGradient}
            >
              <ThemedText type="title" style={styles.title}>
                Tell us about yourself
              </ThemedText>
              
              <ThemedText style={styles.description}>
                We need some basic information to calculate your personalized macros.
              </ThemedText>
              
              <View style={styles.form}>
                <FormInput
                  label="Height"
                  value={userData.height.toString()}
                  onChangeText={(text) => updateUserData({ height: text ? Number(text) : 0 })}
                  placeholder="Enter your height"
                  keyboardType="numeric"
                  suffix="cm"
                  isRequired
                  error={errors.height}
                  min={100}
                  max={250}
                  style={styles.input}
                />
                
                <FormInput
                  label="Weight"
                  value={userData.weight.toString()}
                  onChangeText={(text) => updateUserData({ weight: text ? Number(text) : 0 })}
                  placeholder="Enter your weight"
                  keyboardType="numeric"
                  suffix="kg"
                  isRequired
                  error={errors.weight}
                  min={30}
                  max={300}
                  style={styles.input}
                />
                
                <FormInput
                  label="Age"
                  value={userData.age.toString()}
                  onChangeText={(text) => updateUserData({ age: text ? Number(text) : 0 })}
                  placeholder="Enter your age"
                  keyboardType="numeric"
                  suffix="years"
                  isRequired
                  error={errors.age}
                  min={16}
                  max={100}
                  style={styles.input}
                />
                
                <ThemedText style={styles.sectionTitle}>Gender</ThemedText>
                {errors.gender ? (
                  <ThemedText style={styles.errorText}>{errors.gender}</ThemedText>
                ) : null}
                
                <View style={styles.genderOptions}>
                  <SelectionCard
                    title="Male"
                    icon="person.fill"
                    isSelected={userData.gender === 'male'}
                    onSelect={() => handleSelectGender('male')}
                    style={styles.genderCard}
                    selectedColor="#3b82f6" // Blue from our color scheme
                  />
                  
                  <SelectionCard
                    title="Female"
                    icon="person.2.fill"
                    isSelected={userData.gender === 'female'}
                    onSelect={() => handleSelectGender('female')}
                    style={styles.genderCard}
                    selectedColor="#f97316" // Orange from our color scheme
                  />
                  
                  <SelectionCard
                    title="Other"
                    icon="person.circle.fill"
                    isSelected={userData.gender === 'other'}
                    onSelect={() => handleSelectGender('other')}
                    style={styles.genderCard}
                    selectedColor="#22c55e" // Green from our color scheme
                  />
                </View>
              </View>
            </LinearGradient>
          </BlurView>
        </ScrollView>
        
        <View style={styles.footer}>
          <BlurView 
            intensity={70} 
            tint={isDark ? 'dark' : 'light'}
            style={styles.footerBlur}
          >
            <View style={styles.buttonRow}>
                <ActionButton
                          title="Back"
                          onPress={handleBack}
                          variant="outline"
                          icon="arrow.left"
                          iconPosition="left"
                          style={styles.backButton}
                        />
              
              <ActionButton
                title="Continue"
                onPress={handleContinue}
                disabled={!isStepValid(1)}
                icon="arrow.right"
                style={styles.continueButton}
              />
            </View>
          </BlurView>
        </View>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerSection: {
    paddingTop: 0,
  },
  headerGradient: {
    paddingTop: 12,
    paddingBottom: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  formContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  formGradient: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    marginBottom: 28,
    opacity: 0.8,
    lineHeight: 22,
  },
  form: {
    width: '100%',
  },
  input: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    marginTop: 8,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginBottom: 12,
  },
  genderOptions: {
    flexDirection: 'column',  // Changed to column for vertical layout
    width: '100%',
    marginBottom: 16,
  },
  genderCard: {
    width: '100%',  // Full width
    marginBottom: 12,  // Space between cards
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    minHeight: 60,  // Slightly reduced height for vertical layout
  },
  footer: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  footerBlur: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
   padding: 16,
  },
  backButton: {
    flex: 1,
    marginRight: 8,
  },
  continueButton: {
    flex: 1,
    marginLeft: 12,
    height: 52,
    borderRadius: 14,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});