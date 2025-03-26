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
import { Goal } from '@/utils/macroCalculator';

const REGISTRATION_STEPS = [
  'Welcome',
  'Personal Info',
  'Activity',
  'Goals',
  'Results'
];

const GOALS: { 
  value: Goal; 
  title: string; 
  description: string;
  icon: "chart.bar.fill" | "heart.fill" | "fork.knife";
}[] = [
  {
    value: 'lose',
    title: 'Lose Weight',
    description: 'Reduce body fat while maintaining muscle',
    icon: 'chart.bar.fill',
  },
  {
    value: 'maintain',
    title: 'Maintain',
    description: 'Maintain current weight and body composition',
    icon: 'heart.fill',
  },
  {
    value: 'gain',
    title: 'Gain Muscle',
    description: 'Build muscle with minimal fat gain',
    icon: 'fork.knife',
  },
];

export default function GoalsScreen() {
  const { userData, updateUserData, nextStep, prevStep, isStepValid, calculateMacros } = useRegistration();
  
  const handleSelectGoal = (goal: Goal) => {
    updateUserData({ goal });
  };
  
  const handleContinue = () => {
    // Calculate macros before moving to results screen
    calculateMacros();
    nextStep();
    router.push('/registration/results');
  };
  
  const handleBack = () => {
    prevStep();
    router.push('/registration/activity');
  };

  return (
    <ThemedView style={styles.container}>
      <StatusBar style="auto" />
      
      <Stack.Screen
        options={{
          title: 'Your Goals',
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
          What's your primary goal?
        </ThemedText>
        
        <ThemedText style={styles.description}>
          This will help us tailor your macronutrient ratios to support your goals.
        </ThemedText>
        
        <View style={styles.goalOptions}>
          {GOALS.map((goal) => (
            <SelectionCard
              key={goal.value}
              title={goal.title}
              description={goal.description}
              icon={goal.icon}
              isSelected={userData.goal === goal.value}
              onSelect={() => handleSelectGoal(goal.value)}
            />
          ))}
        </View>
        
        <ThemedText style={styles.note}>
          Note: Your macros will be adjusted based on your goal. Weight loss plans include a calorie deficit, while muscle gain plans include a calorie surplus.
        </ThemedText>
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
            title="Calculate"
            onPress={handleContinue}
            disabled={!isStepValid(3)}
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
  goalOptions: {
    width: '100%',
    marginBottom: 24,
  },
  note: {
    fontSize: 14,
    fontStyle: 'italic',
    opacity: 0.7,
    marginBottom: 16,
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
