import React from 'react';
import { StyleSheet, Image, View, Dimensions, ScrollView } from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Web3Auth, { ChainNamespace, LOGIN_PROVIDER, WEB3AUTH_NETWORK } from "@web3auth/react-native-sdk";

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ActionButton } from '@/components/ActionButton';
import { ProgressIndicator } from '@/components/ProgressIndicator';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/providers/AuthProvider';
const { width } = Dimensions.get('window');



export default function WelcomeScreen() {
  const {login} = useAuth()
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const handleGetStarted = async() => {
    await login({ mfaLevel: "default", // Pass on the MFA level of your choice: default, optional, mandatory, none
      loginProvider: LOGIN_PROVIDER.GOOGLE})
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
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentContainer}>
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
            
            <View style={styles.buttonWrapper}>
              <ActionButton
                title="Get Started"
                onPress={handleGetStarted}
                icon="arrow.right"
                style={styles.getStartedButton}
                textStyle={styles.buttonText}
              />
            </View>
          </View>
          
          {/* You can add the Feature components here if needed */}
        </View>
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 0,
    justifyContent: 'center',
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
    paddingBottom: 20,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  logoContainer: {
    position: 'relative',
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
    width: 160,
    height: 160,
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
    borderRadius: 70,
    overflow: 'hidden'
  },
  headerContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 16,
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
    maxWidth: 400,
  },
  features: {
    width: '100%',
    marginTop: 24,
    gap: 16,
    maxWidth: 500,
  },
  featureContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 16,
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
    paddingHorizontal: 24,
    paddingTop: 0,
    paddingBottom: 40,
    width: '100%',
  },
  footerBlur: {
    borderRadius: 20,
    overflow: 'hidden',
    width: '100%',
  },
  buttonWrapper: {
    width: '100%',
    marginTop: 24,
    paddingHorizontal: 0,
  },
  getStartedButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: '#4ECDC4',
    width: '100%',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  }
});