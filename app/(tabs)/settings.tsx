import React, { useContext } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity,Alert, StatusBar } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/providers/AuthProvider';
import { router, Stack } from 'expo-router';
// Assume we have a theme context
const ThemeContext = React.createContext({ isDark: false });

// Themed components (simplified versions)
const ThemedView = ({ style, children }) => {
  const { isDark } = useContext(ThemeContext);
  return (
    <View style={[{ backgroundColor: isDark ? '#121212' : '#FFFFFF' }, style]}>
      {children}
    </View>
  );
};

const ThemedText = ({ type, style, children }) => {
  const { isDark } = useContext(ThemeContext);
  const baseStyle = { 
    color: isDark ? '#FFFFFF' : '#000000',
    fontSize: type === 'title' ? 22 : 16,
    fontWeight: type === 'title' ? 'bold' : 'normal',
  };
  
  return <Text style={[baseStyle, style]}>{children}</Text>;
};

// Action button component
const ActionButton = ({ title, onPress, icon, style, textStyle }) => (
  <TouchableOpacity style={[styles.actionButton, style]} onPress={onPress}>
    <Text style={[styles.actionButtonText, textStyle]}>{title}</Text>
    {/* Icon would go here */}
  </TouchableOpacity>
);

const MainScreen = () => {
  const { isDark } = useContext(ThemeContext);
  const {logout} = useAuth()
  const handleLogout= async() => {
    // Handle registration logic
    try
    { await logout()
       router.replace("/home/welcome")
    }
    catch(error)
    {
       Alert.alert("Error logging out.")
    }   
  };
  
  return (
    <ThemedView style={styles.container}>
      {/* Header Section */}
       <StatusBar style="auto" />
           
           <Stack.Screen
             options={{
               title: 'Share',
               headerShown: true,
             }}
           />
      
      {/* Logo Box with Calculate Statement */}
      <View style={styles.contentBox}>
        <Image 
          source={require('../../assets/images/logo.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        <ThemedText style={styles.calculateText}>
          Calculate your personalized macro nutrition plan based on your body and fitness goals.
        </ThemedText>
      </View>
      
      {/* Registration Section with Blueprint */}
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
            
            {/* Registration description removed from here and moved to top box */}
            
            <View style={styles.registrationFeatures}>
              {[
                'Personalized macros',
                'Scientific calculations',
                'Goal-oriented plans',
                'Ai Generated workouts',
                'Ai Generated meal plans',
                'Ai calorie calculator'
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
              title="Logout"
              onPress={handleLogout}
              icon="logout"
              style={styles.registrationButton}
              textStyle={styles.buttonText}
            />
          </LinearGradient>
        </BlurView>
      </ThemedView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  headerContainer: {
    marginBottom: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  contentBox: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#4ECDC4',
    borderRadius: 10,
    backgroundColor: '#F7FFFE',
  },
  logo: {
    width: '80%',
    height: 80,
    marginBottom: 2,
  },
  calculateText: {
    textAlign: 'center',
    lineHeight: 22,
    fontSize: 16,
  },
  registrationSection: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  registrationBlur: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 16,
  },
  registrationGradient: {
    flex: 1,
    padding: 24,
    borderRadius: 16,
  },
  registrationTitle: {
    marginBottom: 12,
    textAlign: 'center',
  },
  registrationDescription: {
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  registrationFeatures: {
    marginBottom: 30,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: 'rgba(78, 205, 196, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ECDC4',
  },
  featureText: {
    fontSize: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#4ECDC4',
    height: 54,
    paddingHorizontal: 24,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
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

export default MainScreen;