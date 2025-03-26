import { Image, StyleSheet, Platform, View, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ActionButton } from '@/components/ActionButton';
import { useColorScheme } from '@/hooks/useColorScheme';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handleStartRegistration = () => {
    router.push('/registration/welcome');
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ 
        light: '#0891b2', // Cyan-600
        dark: '#164e63'   // Cyan-900
      }}
      headerHeight={300}
      headerImage={
        <View style={styles.headerImageContainer}>
          <Image
            source={require('@/assets/images/partial-react-logo.png')}
            style={styles.reactLogo}
          />
          <LinearGradient
            colors={isDark ? 
              ['rgba(15, 23, 42, 0)', 'rgba(15, 23, 42, 0.8)', 'rgba(15, 23, 42, 1)'] : 
              ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.8)', 'rgba(255, 255, 255, 1)']}
            style={styles.headerGradient}
          />
        </View>
      }>
      <ThemedView style={[styles.contentContainer, { paddingTop: insets.top + 20 }]}>
        <ThemedView style={styles.welcomeSection}>
          <ThemedView style={styles.titleContainer}>
            <ThemedText type="title" style={styles.welcomeTitle}>Welcome!</ThemedText>
            <HelloWave style={styles.waveIcon} />
          </ThemedView>
          
          
        </ThemedView>
        
        {/* Registration Section */}
        <ThemedView style={styles.registrationSection}>
          <BlurView 
            intensity={70} 
            tint={isDark ? 'dark' : 'light'}
            style={styles.registrationBlur}
          >
            <LinearGradient
              colors={isDark ? 
                ['rgba(10, 126, 164, 0.3)', 'rgba(8, 145, 178, 0.2)'] : 
                ['rgba(8, 145, 178, 0.15)', 'rgba(10, 126, 164, 0.05)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.registrationGradient}
            >
              <ThemedText type="title" style={styles.registrationTitle}>
                Body Blue Print
              </ThemedText>
              
              <ThemedText style={styles.registrationDescription}>
                Calculate your personalized macro nutrition plan based on your body and fitness goals.
              </ThemedText>
              
              <View style={styles.registrationFeatures}>
                {[
                  'Personalized macros',
                  'Scientific calculations',
                  'Goal-oriented plans'
                ].map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <View style={styles.featureIconContainer}>
                      <View style={styles.featureDot} />
                    </View>
                    <ThemedText style={styles.featureText}>{feature}</ThemedText>
                  </View>
                ))}
              </View>
              
              <ActionButton
                title="Get Started"
                onPress={handleStartRegistration}
                icon="arrow.right"
                style={styles.registrationButton}
                textStyle={styles.buttonText}
              />
            </LinearGradient>
          </BlurView>
        </ThemedView>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    gap: 40,
  },
  headerImageContainer: {
    height: '100%',
    width: '100%',
    position: 'relative',
  },
  headerGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 40,
    left: 0,
    position: 'absolute',
    zIndex: 1,
  },
  welcomeSection: {
    gap: 24,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  waveIcon: {
    marginLeft: 8,
    transform: [{ scale: 1.2 }],
  },
  cardContainer: {
    gap: 16,
  },
  stepCard: {
    backgroundColor: ({ 
      light: '#ffffff', 
      dark: 'rgba(30, 41, 59, 0.8)' 
    })[Platform.OS === 'web' ? 'light' : useColorScheme() || 'light'],
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    position: 'relative',
    paddingLeft: 56,
  },
  stepNumber: {
    position: 'absolute',
    top: 20,
    left: -12,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  stepNumberText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  stepText: {
    fontSize: 15,
    lineHeight: 22,
    opacity: 0.9,
  },
  registrationSection: {
    marginBottom: 40,
  },
  registrationBlur: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  registrationGradient: {
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  registrationTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  registrationDescription: {
    textAlign: 'center',
    marginBottom: 24,
    fontSize: 16,
    lineHeight: 24,
    opacity: 0.9,
    paddingHorizontal: 8,
  },
  registrationFeatures: {
    marginBottom: 32,
    paddingHorizontal: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(78, 205, 196, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  featureDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4ECDC4',
  },
  featureText: {
    fontSize: 16,
    fontWeight: '600',
  },
  registrationButton: {
    alignSelf: 'center',
    width: '100%',
    height: 54,
    borderRadius: 14,
    backgroundColor: '#4ECDC4',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  }
});