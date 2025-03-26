import React from 'react';
import { StyleSheet, Image, View, Dimensions, ScrollView } from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ActionButton } from '@/components/ActionButton';
import { ProgressIndicator } from '@/components/ProgressIndicator';
import { useRegistration } from '@/contexts/RegistrationContext';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

const { width } = Dimensions.get('window');

const REGISTRATION_STEPS = [
  'Welcome',
  'Personal Info',
  'Activity',
  'Goals',
  'Results'
];

export default function WelcomeScreen() {
  const { nextStep } = useRegistration();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const handleGetStarted = () => {
    nextStep();
    router.push('/registration/personal-info');
  };

  return (
    <ThemedView style={styles.container}>
      <StatusBar style="auto" />
      
      <Stack.Screen
        options={{
          title: 'Body Blue Print',
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
        <View style={styles.logoContainer}>
          <LinearGradient
            colors={isDark ? 
              ['rgba(8, 145, 178, 0.1)', 'rgba(10, 126, 164, 0.2)'] : 
              ['rgba(8, 145, 178, 0.05)', 'rgba(10, 126, 164, 0.1)']}
            style={styles.logoBackground}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <Image
            source={require('@/assets/images/body.webp')}
            style={styles.logo}
          />
        </View>
        
        <View style={styles.headerContainer}>
          <ThemedText type="title" style={styles.title}>
            Welcome to Body Blue Print
          </ThemedText>
          
          <ThemedText style={styles.description}>
            Your personalized fitness journey starts here. We'll collect some basic information to create your custom macro nutrition plan.
          </ThemedText>
        </View>
        
        <View style={styles.features}>
          <Feature 
            title="Personalized Macros" 
            description="Get custom macronutrient targets based on your body and goals"
            color="#f97316"  // Orange from HomeScreen
            icon="✓"
          />
          <Feature 
            title="Scientific Approach" 
            description="Calculations based on proven nutritional science"
            color="#22c55e"  // Green from HomeScreen
            icon="✓"
          />
          <Feature 
            title="Goal Oriented" 
            description="Whether you want to lose, maintain, or gain weight"
            color="#3b82f6"  // Blue from HomeScreen
            icon="✓"
          />
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <BlurView 
          intensity={70} 
          tint={isDark ? 'dark' : 'light'}
          style={styles.footerBlur}
        >
          <ActionButton
            title="Get Started"
            onPress={handleGetStarted}
            icon="arrow.right"
            style={styles.getStartedButton}
            textStyle={styles.buttonText}
          />
        </BlurView>
      </View>
    </ThemedView>
  );
}

interface FeatureProps {
  title: string;
  description: string;
  color: string;
  icon: string;
}

const Feature: React.FC<FeatureProps> = ({ title, description, color, icon }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  return (
    <BlurView 
      intensity={40} 
      tint={isDark ? 'dark' : 'light'}
      style={styles.featureContainer}
    >
      <LinearGradient
        colors={isDark ? 
          ['rgba(30, 41, 59, 0.4)', 'rgba(30, 41, 59, 0.1)'] :
          ['rgba(255, 255, 255, 0.7)', 'rgba(255, 255, 255, 0.5)']}
        style={styles.featureGradient}
      >
        <View style={[styles.featureIcon, { backgroundColor: color }]}>
          <ThemedText style={styles.featureIconText}>{icon}</ThemedText>
        </View>
        <View style={styles.featureTextContainer}>
          <ThemedText style={styles.featureTitle}>{title}</ThemedText>
          <ThemedText style={styles.featureDescription}>{description}</ThemedText>
        </View>
      </LinearGradient>
    </BlurView>
  );
};

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
    alignItems: 'center',
    paddingBottom: 20,
  },
  logoContainer: {
    position: 'relative',
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBackground: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    opacity: 0.7,
  },
  logo: {
    width: 140,
    height: 140,
    borderRadius: 60,  // Half of width/height to make it circular
    overflow: 'hidden' // This ensures the image is clipped to the circular shape
  },
  headerContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 24,
    paddingHorizontal: 12,
  },
  features: {
    width: '100%',
    marginTop: 8,
    gap: 16,
  },
  featureContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  featureGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  featureIconText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 15,
    opacity: 0.8,
    lineHeight: 22,
  },
  footer: {
    padding: 24,
    paddingBottom: 40,
  },
  footerBlur: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  getStartedButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: '#4ECDC4',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  }
});