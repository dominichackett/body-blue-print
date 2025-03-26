import React, { useMemo } from 'react';
import { View, StyleSheet, Animated, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRegistration } from '../contexts/RegistrationContext';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';
import { Check } from 'react-native-feather';

interface ProgressIndicatorProps {
  steps: string[];
  onStepPress?: (index: number) => void;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ 
  steps,
  onStepPress 
}) => {
  const { currentStep, isStepValid } = useRegistration();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const {
    tintColor,
    backgroundColor,
    progressBackgroundColor,
    textColor,
    disabledTextColor,
    gradientColors
  } = useMemo(() => ({
    tintColor: '#4ECDC4',
    backgroundColor: Colors[colorScheme ?? 'light'].background,
    progressBackgroundColor: isDark ? '#3A3A3C' : '#E0E0E0',
    textColor: isDark ? '#FFFFFF' : '#000000',
    disabledTextColor: isDark ? '#6E6E6E' : '#A9A9A9',
    gradientColors: isDark ? 
      ['#4ECDC4', '#0891b2'] : 
      ['#4ECDC4', '#0891b2']
  }), [colorScheme, isDark]);

  const progressPercentage = (currentStep / (steps.length - 1)) * 100;

  const handleStepPress = (index: number) => {
    if (onStepPress && (index <= currentStep || isStepValid(index - 1))) {
      onStepPress(index);
    }
  };

  return (
    <ThemedView style={styles.outerContainer}>
      <View style={[
        styles.floatingContainer,
        { backgroundColor: isDark ? 'rgba(30, 30, 30, 0.85)' : 'rgba(255, 255, 255, 0.85)' }
      ]}>
        <View style={styles.progressBarContainer}>
          {/* Background track */}
          <View 
            style={[
              styles.progressBarBackground, 
              { backgroundColor: progressBackgroundColor }
            ]} 
          />
          
          {/* Filled progress */}
          <Animated.View style={[styles.progressBarWrapper, { width: `${progressPercentage}%` }]}>
            <LinearGradient
              colors={gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.progressBarGradient}
            />
          </Animated.View>
          
          {/* Step indicators */}
          {steps.map((step, index) => {
            const isActive = index <= currentStep;
            const isCompleted = index < currentStep;
            const isValid = isStepValid(index);
            
            // Calculate position with better containment
            const stepPosition = (index / (steps.length - 1)) * 100;
            // Adjust positions to ensure everything stays within container
            let adjustedPosition;
            if (index === 0) {
              adjustedPosition = 10; // First step more inset
            } else if (index === steps.length - 1) {
              adjustedPosition = 90; // Last step more inset
            } else {
              // Scale the middle positions to fit within the range
              adjustedPosition = 10 + ((stepPosition / 100) * 80);
            }
            
            return (
              <Pressable
                key={index}
                onPress={() => handleStepPress(index)}
                style={({ pressed }) => [
                  styles.stepIndicatorContainer,
                  { 
                    left: `${adjustedPosition}%`,
                    opacity: pressed && isActive ? 0.8 : 1
                  }
                ]}
              >
                <View 
                  style={[
                    styles.stepIndicator,
                    { 
                      backgroundColor: isActive ? tintColor : backgroundColor,
                      borderColor: (isActive || isValid) ? tintColor : progressBackgroundColor,
                    }
                  ]}
                >
                  {isCompleted && (
                    <Check width={16} height={16} color="#FFFFFF" />
                  )}
                </View>
                
                <ThemedText 
                  style={[
                    styles.stepLabel,
                    { 
                      color: isActive ? textColor : disabledTextColor,
                      fontWeight: isActive ? '600' : '400',
                    }
                  ]}
                >
                  {step}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    paddingVertical: 45,
    marginBottom: 20,
    zIndex: 10,
  },
  floatingContainer: {
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    padding: 24,
    marginHorizontal: 16,
  },
  progressBarContainer: {
    height: 6,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 40,
    marginTop: 8,
  },
  progressBarBackground: {
    height: 6,
    position: 'absolute',
    left: 0,
    right: 0,
    borderRadius: 6,
  },
  progressBarWrapper: {
    height: 6,
    position: 'absolute',
    left: 0,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarGradient: {
    height: '100%',
    width: '100%',
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  stepIndicatorContainer: {
    position: 'absolute',
    alignItems: 'center',
    width: 60,
    paddingTop: 10,
    transform: [{ translateX: -30 }],
  },
  stepIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stepLabel: {
    fontSize: 12,
    textAlign: 'center',
    width: 70,
    marginLeft: 0,
    paddingHorizontal: 2,
  },
});