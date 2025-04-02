import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, Animated, ActivityIndicator, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ActionButton } from '@/components/ActionButton';
import { ProgressIndicator } from '@/components/ProgressIndicator';
import { useRegistration } from '@/contexts/RegistrationContext';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { calculateBMI, getBMICategory, formatWeight, formatHeight } from '@/utils/macroCalculator'; // Import utility functions

const REGISTRATION_STEPS = [
  'Personal Info',
  'Activity',
  'Goals',
  'Results'
];

export default function ResultsScreen() {
  const { 
    userData, 
    macroResults, 
    prevStep, 
    resetRegistration, 
    calculateMacros,
    saveUserBio,
    saveResults
  } = useRegistration();
  
  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  
  const [isSaving, setIsSaving] = useState(false);
  
  // Ensure we have calculated results
  useEffect(() => {
    if (!macroResults) {
      calculateMacros();
    }
  }, [calculateMacros, macroResults]);
  
  // Calculate BMI
  const bmi = calculateBMI(userData.height, userData.weight, userData.unitSystem);
  const bmiCategory = getBMICategory(bmi);
  
  // Format height and weight based on unit system
  const formattedHeight = formatHeight(userData.height, userData.unitSystem);
  const formattedWeight = formatWeight(userData.weight, userData.unitSystem);
  
  // Get color based on BMI category
  const getBmiColor = () => {
    switch (bmiCategory) {
      case 'Underweight':
        return '#FFD166'; // Yellow
      case 'Normal weight':
        return '#4ECDC4'; // Green
      case 'Overweight':
        return '#FF9F1C'; // Orange
      case 'Obese':
        return '#FF6B6B'; // Red
      default:
        return '#4ECDC4';
    }
  };
  
  // Calculate position on BMI scale (between 15 and 40)
  const getBmiPosition = () => {
    const minBmi = 15;
    const maxBmi = 40;
    const clampedBmi = Math.min(Math.max(bmi, minBmi), maxBmi);
    return ((clampedBmi - minBmi) / (maxBmi - minBmi)) * 100;
  };
  
  const handleBack = () => {
    prevStep();
    router.push('/registration/goals');
  };
  
  const handleStartOver = () => {
    resetRegistration();
    router.push('/registration/welcome');
  };
  
  const handleSaveMacros = async () => {
    if (!macroResults) {
      Alert.alert('Error', 'No macro results to save');
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Save both the user's bio data and the calculated results
      await Promise.all([
        saveUserBio(),
        saveResults(macroResults)
      ]);
      
      // Show success message
      Alert.alert(
        'Success',
        'Your macros have been saved successfully!',
        [{ text: 'OK', onPress: () => router.replace('/(tabs)/macros') }]
      );
    } catch (error) {
      console.error('Error saving data:', error);
      Alert.alert('Error', 'There was a problem saving your data. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  if (!macroResults) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={tintColor} />
        <ThemedText style={{ marginTop: 16 }}>Calculating your macros...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <StatusBar style="auto" />
      
      <Stack.Screen
        options={{
          title: 'Your Results',
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
          Your Personalized Macros
        </ThemedText>
        
        <ThemedText style={styles.description}>
          Based on your information ({formattedHeight}, {formattedWeight}), here are your recommended daily macronutrient targets.
        </ThemedText>
        
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <ThemedText style={styles.summaryTitle}>Daily Targets</ThemedText>
            <View style={[
              styles.goalBadge, 
              { 
                backgroundColor: userData.goal === 'lose' 
                  ? '#FF6B6B' 
                  : userData.goal === 'gain' 
                    ? '#4ECDC4' 
                    : '#FFD166'
              }
            ]}>
              <ThemedText style={styles.goalLabel}>
                {userData.goal === 'lose' ? 'Weight Loss' : userData.goal === 'gain' ? 'Muscle Gain' : 'Maintenance'}
              </ThemedText>
            </View>
          </View>
          
          <View style={styles.calorieContainer}>
            <ThemedText style={styles.calorieValue}>{macroResults.calories}</ThemedText>
            <ThemedText style={styles.calorieLabel}>calories per day</ThemedText>
          </View>
          
          <View style={styles.macrosContainer}>
            <MacroItem 
              name="Protein" 
              value={macroResults.protein} 
              color="#FF6B6B" 
              percentage={Math.round((macroResults.protein * 4 / macroResults.calories) * 100)}
            />
            <MacroItem 
              name="Carbs" 
              value={macroResults.carbs} 
              color="#4ECDC4" 
              percentage={Math.round((macroResults.carbs * 4 / macroResults.calories) * 100)}
            />
            <MacroItem 
              name="Fat" 
              value={macroResults.fat} 
              color="#FFD166" 
              percentage={Math.round((macroResults.fat * 9 / macroResults.calories) * 100)}
            />
          </View>
        </View>
        
        <View style={styles.infoCard}>
          <ThemedText style={styles.infoTitle}>What This Means</ThemedText>
          <ThemedText style={styles.infoText}>
            These macros are calculated based on your height, weight, age, gender, activity level, and goals.
          </ThemedText>
          <ThemedText style={styles.infoText}>
            • Protein helps build and repair muscle tissue
          </ThemedText>
          <ThemedText style={styles.infoText}>
            • Carbohydrates provide energy for your workouts and daily activities
          </ThemedText>
          <ThemedText style={styles.infoText}>
            • Fats support hormone production and overall health
          </ThemedText>
        </View>

        {/* BMI Card */}
        <View style={styles.bmiCard}>
          <ThemedText style={styles.bmiTitle}>Your Body Mass Index (BMI)</ThemedText>
          
          <View style={styles.bmiValueContainer}>
            <ThemedText style={styles.bmiValue}>{bmi.toFixed(1)}</ThemedText>
            <View style={[styles.bmiCategoryBadge, { backgroundColor: getBmiColor() }]}>
              <ThemedText style={styles.bmiCategoryText}>{bmiCategory}</ThemedText>
            </View>
          </View>
          
          <View style={styles.bmiScaleContainer}>
            <View style={styles.bmiScale}>
              <View style={styles.bmiScaleSegment1} />
              <View style={styles.bmiScaleSegment2} />
              <View style={styles.bmiScaleSegment3} />
              <View style={styles.bmiScaleSegment4} />
            </View>
            
            <View style={[styles.bmiIndicator, { left: `${getBmiPosition()}%`, backgroundColor: getBmiColor() }]} />
            
            <View style={styles.bmiLabelsContainer}>
              <ThemedText style={styles.bmiScaleLabel}>15</ThemedText>
              <ThemedText style={styles.bmiScaleLabel}>18.5</ThemedText>
              <ThemedText style={styles.bmiScaleLabel}>25</ThemedText>
              <ThemedText style={styles.bmiScaleLabel}>30</ThemedText>
              <ThemedText style={styles.bmiScaleLabel}>40</ThemedText>
            </View>
            
            <View style={styles.bmiCategoryLabelsContainer}>
              <ThemedText style={[styles.bmiCategoryLabel, { flex: 3.5 }]}>Underweight</ThemedText>
              <ThemedText style={[styles.bmiCategoryLabel, { flex: 6.5 }]}>Normal</ThemedText>
              <ThemedText style={[styles.bmiCategoryLabel, { flex: 5 }]}>Overweight</ThemedText>
              <ThemedText style={[styles.bmiCategoryLabel, { flex: 10 }]}>Obese</ThemedText>
            </View>
          </View>
          
          <ThemedText style={styles.bmiDescription}>
            BMI is a measure of body fat based on height and weight. It's one of several indicators to assess your overall health.
          </ThemedText>
        </View>
        
        <View style={styles.nextStepsCard}>
          <ThemedText style={styles.infoTitle}>Next Steps</ThemedText>
          <ThemedText style={styles.infoText}>
            1. Track your food intake to meet these macro targets
          </ThemedText>
          <ThemedText style={styles.infoText}>
            2. Adjust your macros if needed based on your progress
          </ThemedText>
          <ThemedText style={styles.infoText}>
            3. Combine with regular exercise for best results
          </ThemedText>
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <ActionButton
          title="Start Over"
          onPress={handleStartOver}
          variant="outline"
          style={styles.startOverButton}
        />
        
        <ActionButton
          title={isSaving ? "Saving..." : "Save Macros"}
          onPress={handleSaveMacros}
          icon={!isSaving ? "arrow.right" : undefined}
          disabled={isSaving}
          fullWidth
          style={styles.dashboardButton}
        />
      </View>
    </ThemedView>
  );
}

interface MacroItemProps {
  name: string;
  value: number;
  color: string;
  percentage: number;
}

const MacroItem: React.FC<MacroItemProps> = ({ name, value, color, percentage }) => {
  return (
    <View style={styles.macroItem}>
      <View style={styles.macroHeader}>
        <ThemedText style={styles.macroName}>{name}</ThemedText>
        <ThemedText style={styles.macroPercentage}>{percentage}%</ThemedText>
      </View>
      
      <View style={styles.macroBarContainer}>
        <View 
          style={[
            styles.macroBar, 
            { 
              backgroundColor: color,
              width: `${percentage}%`,
            }
          ]} 
        />
      </View>
      
      <ThemedText style={styles.macroValue}>{value}g</ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
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
  // BMI Card Styles
  bmiCard: {
    borderRadius: 2,
    padding: 24,
    marginBottom: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'visible',
  },
  bmiTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  bmiValueContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
    overflow: 'visible',
    paddingVertical: 8,
  },
  bmiValue: {
    fontSize: 36,
    fontWeight: 'bold',
    flexShrink: 0,
    minWidth: 70,
    lineHeight: 44,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  bmiCategoryBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  bmiCategoryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bmiScaleContainer: {
    marginBottom: 20,
    position: 'relative',
  },
  bmiScale: {
    height: 12,
    flexDirection: 'row',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 12,
  },
  bmiScaleSegment1: {
    flex: 3.5,
    backgroundColor: '#FFD166', // Yellow for underweight
  },
  bmiScaleSegment2: {
    flex: 6.5,
    backgroundColor: '#4ECDC4', // Green for normal
  },
  bmiScaleSegment3: {
    flex: 5,
    backgroundColor: '#FF9F1C', // Orange for overweight
  },
  bmiScaleSegment4: {
    flex: 10,
    backgroundColor: '#FF6B6B', // Red for obese
  },
  bmiIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    position: 'absolute',
    top: 0,
    transform: [{ translateX: -6 }], // Center the indicator
  },
  bmiLabelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  bmiScaleLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  bmiCategoryLabelsContainer: {
    flexDirection: 'row',
  },
  bmiCategoryLabel: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'center',
  },
  bmiDescription: {
    fontSize: 14,
    opacity: 0.8,
    marginTop: 8,
  },
  // Original Styles
  summaryCard: {
    borderRadius: 2,
    padding: 24,
    marginBottom: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop:2,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  goalBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  goalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  calorieContainer: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 4, // Added margin top for more spacing
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 20,
    paddingHorizontal: 16, // Added horizontal padding
    borderRadius: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'visible', // Ensure content isn't clipped
  },
  calorieValue: {
    fontSize: 40, // Slightly reduced from 48 for better fit
    fontWeight: 'bold',
    letterSpacing: 1,
    paddingTop: 16, // Add padding to push down from the top
    textAlign: 'center', // Ensure text is centered
  },
  calorieLabel: {
    fontSize: 17,
    fontWeight: '500',
    opacity: 0.7,
    marginTop: 8, // Increased from 4
    textAlign: 'center', // Ensure text is centered
  },
  macrosContainer: {
    gap: 16,
  },
  macroItem: {
    marginBottom: 20,
  },
  macroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  macroName: {
    fontSize: 17,
    fontWeight: '600',
  },
  macroPercentage: {
    fontSize: 15,
    fontWeight: '500',
    opacity: 0.8,
  },
  macroBarContainer: {
    height: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 2,
    marginBottom: 6,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  macroBar: {
    height: '100%',
    borderRadius: 2,
  },
  macroValue: {
    fontSize: 15,
    fontWeight: '500',
    opacity: 0.8,
  },
  infoCard: {
    borderRadius: 2,
    padding: 24,
    marginBottom: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  nextStepsCard: {
    borderRadius: 2,
    padding: 24,
    marginBottom: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 8,
    opacity: 0.8,
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
    gap: 12,
  },
  startOverButton: {
    marginBottom: 8,
  },
  dashboardButton: {
  },
});