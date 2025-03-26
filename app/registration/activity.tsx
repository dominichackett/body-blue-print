import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ActionButton } from '@/components/ActionButton';
import { SelectionCard } from '@/components/SelectionCard';
import { ProgressIndicator } from '@/components/ProgressIndicator';
import { useRegistration } from '@/contexts/RegistrationContext';
import { ActivityLevel } from '@/utils/macroCalculator';

const REGISTRATION_STEPS = [
  'Welcome',
  'Personal Info',
  'Activity',
  'Goals',
  'Results'
];

const ACTIVITY_LEVELS: { 
  value: ActivityLevel; 
  title: string; 
  description: string;
  icon: "figure.walk" | "flame.fill";
}[] = [
  {
    value: 'sedentary',
    title: 'Sedentary',
    description: 'Little to no exercise, desk job',
    icon: 'figure.walk',
  },
  {
    value: 'light',
    title: 'Light Activity',
    description: 'Light exercise 1-3 days/week',
    icon: 'figure.walk',
  },
  {
    value: 'moderate',
    title: 'Moderate Activity',
    description: 'Moderate exercise 3-5 days/week',
    icon: 'figure.walk',
  },
  {
    value: 'active',
    title: 'Active',
    description: 'Active exercise 6-7 days/week',
    icon: 'flame.fill',
  },
  {
    value: 'very_active',
    title: 'Very Active',
    description: 'Very intense exercise daily or physical job',
    icon: 'flame.fill',
  },
];

export default function ActivityScreen() {
  const { userData, updateUserData, nextStep, prevStep, isStepValid } = useRegistration();
  
  const handleSelectActivity = (activityLevel: ActivityLevel) => {
    updateUserData({ activityLevel });
  };
  
  const handleContinue = () => {
    nextStep();
    router.push('/registration/goals');
  };
  
  const handleBack = () => {
    prevStep();
    router.push('/registration/personal-info');
  };

  return (
    <ThemedView style={styles.container}>
      <StatusBar style="auto" />
      
      <Stack.Screen
        options={{
          title: 'Activity Level',
          headerShown: true,
        }}
      />
      
      <ProgressIndicator steps={REGISTRATION_STEPS} />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText type="title" style={styles.title}>
          What's your activity level?
        </ThemedText>
        
        <ThemedText style={styles.description}>
          Select the option that best describes your typical weekly activity.
        </ThemedText>
        
        <View style={styles.activityOptions}>
          {ACTIVITY_LEVELS.map((activity) => (
            <SelectionCard
              key={activity.value}
              title={activity.title}
              description={activity.description}
              icon={activity.icon}
              isSelected={userData.activityLevel === activity.value}
              onSelect={() => handleSelectActivity(activity.value)}
            />
          ))}
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
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
            disabled={!isStepValid(2)}
            icon="arrow.right"
            style={styles.continueButton}
          />
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    marginBottom: 24,
    opacity: 0.8,
  },
  activityOptions: {
    width: '100%',
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  backButton: {
    flex: 1,
    marginRight: 8,
  },
  continueButton: {
    flex: 1,
    marginLeft: 8,
  },
});
