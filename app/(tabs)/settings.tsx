import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert, StatusBar, ScrollView, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/providers/AuthProvider';
import {  Stack } from 'expo-router';
import { ethers } from 'ethers';
import {DAO_ADDRESS,DAO_ABI} from '@env'
import AsyncStorage from '@react-native-async-storage/async-storage';


const USER_DATA_STORAGE_KEY = '@macro_calculator_user_data';
const USER_BIO_STORAGE_KEY = '@macro_calculator_user_bio';
// Assume we have a theme context
const ThemeContext = React.createContext({ isDark: false });


import RNFetchBlob from 'react-native-blob-util';

async function uploadToDAO(bucketName,filename, jsonData, message, signature) {
  try {
    // Convert JSON data to string
    const jsonString = JSON.stringify(jsonData);
    
    // The URL includes the bucketName as a path parameter
    const url = `http://192.168.0.12:3001/api/buckets/${bucketName}/upload`;
    
    // Set query parameters for message and signature
    const urlWithParams = `${url}?message=${encodeURIComponent(message)}&signature=${encodeURIComponent(signature)}`;
    console.log(urlWithParams)
    // Use RNFetchBlob to handle the upload
    const response = await RNFetchBlob.fetch(
      'POST',
      urlWithParams,
      {
        'Content-Type': 'multipart/form-data',
      },
      [
        {
          name: "file",
          filename: filename,
          type: 'application/json',
          data: RNFetchBlob.base64.encode(jsonString)
        }
      ]
    );
    
    // Parse the response
    const responseData = response.json();
    
    return responseData;
  } catch (error) {
    console.error('Error uploading JSON object:', error);
    throw error;
  }
}

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

// Checkbox component with description
const CheckboxWithDescription = ({ label, description, checked, onToggle }) => {
  return (
    <View style={styles.featureItemContainer}>
      <TouchableOpacity style={styles.featureItem} onPress={onToggle}>
        <View style={styles.featureIconContainer}>
          {checked ? (
            <View style={styles.featureChecked} />
          ) : (
            <View style={styles.featureUnchecked} />
          )}
        </View>
        <View style={styles.featureTextContainer}>
          <ThemedText style={styles.featureText}>{label}</ThemedText>
          <Text style={styles.featureDescription}>{description}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const MainScreen = () => {
  const { isDark } = useContext(ThemeContext);
  const { ethAddress,provider,signer} = useAuth();
  const [isUploading,setIsUploading] = useState(false)
  console.log(ethAddress)
  // State for tabs
  const [activeTab, setActiveTab] = useState('share');
  
  // State for checkboxes with descriptions
  const [checkboxes, setCheckboxes] = useState({
    'Personalized Macros': {
      checked: false,
      description: 'Share your customized macro nutrition plan based on your body metrics and fitness goals.'
    },
    'Workouts': {
      checked: false,
      description: 'Share your workout routines, exercise history, and fitness achievements with your network.'
    },
    'Meal Plans': {
      checked: false,
      description: 'Share your daily or weekly meal plans including recipes and nutritional information.'
    },
    'Food History': {
      checked: false,
      description: 'Share your food consumption history with detailed calorie and macro breakdowns.'
    }
  });

  const isDAOMember = async()=>{
    try {
      console.log(provider)
      const parsedABI = JSON.parse(DAO_ABI) as Array<any>; // or use a more specific type

      const contract = new ethers.Contract(DAO_ADDRESS,parsedABI,provider)
    
    
      
     // return
      return await contract.isMember(ethAddress);
     
    }catch(error)
    {
      console.error("Error ",error)
    }
  }
  
  const toggleCheckbox = (label) => {
    setCheckboxes(prev => ({
      ...prev,
      [label]: {
        ...prev[label],
        checked: !prev[label].checked
      }
    }));
  };


  const signMessage = async()=>{
    const message = {message:"Body Blue Print DAO",date:new Date().toString()}
    const signature = await signer?.signMessage(message.toString());
   const recoveredAddress = ethers.utils.verifyMessage(message.toString(),signature)
   console.log("Recovered Address: ",recoveredAddress)
     return{message,signature}
  } 

  // To check which checkboxes are selected
const getSelectedCheckboxes = () => {
  const selected = [];
  
  Object.entries(checkboxes).forEach(([label, { checked }]) => {
    if (checked) {
      selected.push(label);
    }
  });
  
  return selected;
};
  
  const uploadPersonalizedMacros = async()=>{
    const userdata = await AsyncStorage.getItem(USER_DATA_STORAGE_KEY);
    console.log(userdata)
    if(userdata)
    {
      
      const {message,signature} =  await signMessage()
      console.log("Uploading Personalized Macros")
      
      return await uploadToDAO('bodyblueprintdao',ethAddress+`_${new Date().getTime()}`+"_ud.json",userdata,message,signature)
      
       
    }  

    return ({error:"No macro data found"})
      
  }

  const uploadWorkouts = async()=>{
    const savedWorkoutsJson = await AsyncStorage.getItem('savedWorkouts');
    console.log(savedWorkoutsJson)
    if(savedWorkoutsJson)
      {
        
        const {message,signature} =  await signMessage()
        return await uploadToDAO('bodyblueprintdao',ethAddress+`_${new Date().getTime()}`+"_workouts.json",savedWorkoutsJson,message,signature)
     
      }  
      return ({error:"No workout data found"})
   
  }


  const uploadSavedMealPlans = async()=>{
    const savedPlansJson = await AsyncStorage.getItem('savedMealPlans');
    console.log(savedPlansJson)
    if(savedPlansJson)
      {
        
        const {message,signature} =  await signMessage()
        return await uploadToDAO('bodyblueprintdao',ethAddress+`_${new Date().getTime()}`+"_mealplans.json",savedPlansJson,message,signature)
     
      }  

      return ({error:"No meal plan data found"})
   

  }

  const uploadFoodHistory = async()=>{
    const foodHistoryJson = await AsyncStorage.getItem('food_calorie_history');
    console.log(foodHistoryJson)
    if(foodHistoryJson)
      {
        
        const {message,signature} =  await signMessage()
        return await uploadToDAO('bodyblueprintdao',ethAddress+`_${new Date().getTime()}`+"_foodhistory.json",foodHistoryJson,message,signature)
     
      }  

      return ({error:"No food history data found"})
   
  }


  const handleShare = async() => {
    setIsUploading(true)
    const dataToUpload = getSelectedCheckboxes()
    console.log(dataToUpload)
    if(dataToUpload.length ==0)
    {
       Alert.alert("Please selected data to upload.")
       setIsUploading(false)
       return
    }
    console.log(dataToUpload)
    try {

     if(!await isDAOMember())
        throw Error("You are not a DOA member")
    if(dataToUpload.includes("Personalized Macros"))   
    {  const response= await uploadPersonalizedMacros()
       if(response.error)
        throw new Error(response.error)
    }
    if(dataToUpload.includes("Workouts"))       
     { 
       const response = await uploadWorkouts()
       if(response.error)
        throw new Error(response.error)
    }

    if(dataToUpload.includes("Meal Plans"))   
      { 
        const response = await uploadSavedMealPlans()
        if(response.error)
          throw new Error(response.error)
      }
      
    if(dataToUpload.includes("Food History"))   
      { 
        const response = await uploadFoodHistory()
        if(response.error)
          throw new Error(response.error)
      }
    Alert.alert("Data uploaded successfully.")
   
    
    }catch(error)
    {
      console.log(JSON.stringify(error))
      Alert.alert(error.message)
    }finally{
      setIsUploading(false)
    }
  };
  
  return (
    <ThemedView style={styles.container}>
      <StatusBar style="auto" />
      
      <Stack.Screen
        options={{
          title: 'Share',
          headerShown: true,
        }}
      />
      
      {/* Main content with tabs */}
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
            {/* Logo watermark */}
            <Image 
              source={require('../../assets/images/logo.png')} 
              style={styles.watermarkLogo}
              resizeMode="contain"
            />
            
            {/* Tab buttons */}
            <View style={styles.tabsRow}>
              <TouchableOpacity 
                style={[styles.tabButton, activeTab === 'dao' ? styles.activeTabButton : null]}
                onPress={() => setActiveTab('dao')}
              >
                <Text style={[styles.tabButtonText, activeTab === 'dao' ? styles.activeTabButtonText : null]}>
                  DAO
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.tabButton, activeTab === 'share' ? styles.activeTabButton : null]}
                onPress={() => setActiveTab('share')}
              >
                <Text style={[styles.tabButtonText, activeTab === 'share' ? styles.activeTabButtonText : null]}>
                  Share
                </Text>
              </TouchableOpacity>
            </View>
            
            <ThemedText type="title" style={styles.registrationTitle}>
              Body Blue Print
            </ThemedText>
            
            {/* Tab contents */}
            {activeTab === 'dao' ? (
              <View style={styles.contentContainer}>
                <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollContent}>
                  <ThemedText style={styles.infoText}>
                    Join our decentralized autonomous organization (DAO) to participate in the fitness community governance. Earn tokens and rewards by contributing your workouts and data.
                  </ThemedText>
                  
                  <View style={styles.infoList}>
                    <View style={styles.infoItem}>
                      <View style={styles.infoDot} />
                      <ThemedText style={styles.infoItemText}>Vote on future platform features and development roadmap</ThemedText>
                    </View>
                    <View style={styles.infoItem}>
                      <View style={styles.infoDot} />
                      <ThemedText style={styles.infoItemText}>Earn tokens for your workout data and fitness achievements</ThemedText>
                    </View>
                    <View style={styles.infoItem}>
                      <View style={styles.infoDot} />
                      <ThemedText style={styles.infoItemText}>Access exclusive content, premium workout plans, and nutrition guides</ThemedText>
                    </View>
                    <View style={styles.infoItem}>
                      <View style={styles.infoDot} />
                      <ThemedText style={styles.infoItemText}>Participate in community challenges and earn additional rewards</ThemedText>
                    </View>
                    <View style={styles.infoItem}>
                      <View style={styles.infoDot} />
                      <ThemedText style={styles.infoItemText}>Connect with like-minded fitness enthusiasts from around the world</ThemedText>
                    </View>
                  </View>
                  
                  <View style={styles.daoStatsContainer}>
                    <View style={styles.daoStat}>
                      <Text style={styles.daoStatNumber}>10K+</Text>
                      <Text style={styles.daoStatLabel}>Members</Text>
                    </View>
                    <View style={styles.daoStat}>
                      <Text style={styles.daoStatNumber}>$2.5M</Text>
                      <Text style={styles.daoStatLabel}>Treasury</Text>
                    </View>
                    <View style={styles.daoStat}>
                      <Text style={styles.daoStatNumber}>85</Text>
                      <Text style={styles.daoStatLabel}>Proposals</Text>
                    </View>
                  </View>
                </ScrollView>
              </View>
            ) : (
              <View style={styles.contentContainer}>
                <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollContent}>
                  <Text style={styles.shareDescription}>
                    Select what content you'd like to share from your Body Blue Print. Your data will be securely shared with your selected audience.
                  </Text>
                  
                  <View style={styles.registrationFeatures}>
                    {Object.entries(checkboxes).map(([label, { checked, description }], index) => (
                      <CheckboxWithDescription
                        key={index}
                        label={label}
                        description={description}
                        checked={checked}
                        onToggle={() => toggleCheckbox(label)}
                      />
                    ))}
                  </View>
                </ScrollView>
                
                {/* Upload button - made more visible and fixed positioning */}

<TouchableOpacity 
  style={styles.uploadButton}
  onPress={handleShare}
  disabled={isUploading}
>
  <View style={styles.buttonContainer}>
    {isUploading ? (
      <>
        <ActivityIndicator color="white" size="small" />
        <Text style={styles.buttonText}>Uploading</Text>
      </>
    ) : (
      <Text style={styles.buttonText}>Upload</Text>
    )}
  </View>
</TouchableOpacity>
              </View>
            )}
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
  registrationSection: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
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
    position: 'relative',
  },
  watermarkLogo: {
    position: 'absolute',
    width: '80%',
    height: '60%',
    opacity: 0.08,
    alignSelf: 'center',
    top: '20%',
  },
  contentContainer: {
    flex: 1,
    zIndex: 1,
    justifyContent: 'space-between', // This ensures content at top, button at bottom
  },
  scrollContent: {
    flex: 1,
    marginBottom: 16, // Space for button
  },
  registrationTitle: {
    marginBottom: 20,
    textAlign: 'center',
    zIndex: 1,
  },
  // Tabs
  tabsRow: {
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#4ECDC4',
    zIndex: 2,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  activeTabButton: {
    backgroundColor: '#4ECDC4',
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  activeTabButtonText: {
    color: '#FFFFFF',
  },
  // DAO content
  infoText: {
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
    zIndex: 1,
  },
  infoList: {
    marginBottom: 8,
    zIndex: 1,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ECDC4',
    marginRight: 12,
    marginTop: 6,
  },
  infoItemText: {
    fontSize: 15,
    flex: 1,
    lineHeight: 20,
  },
  daoStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingVertical: 15,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    zIndex: 1,
  },
  daoStat: {
    alignItems: 'center',
    flex: 1,
  },
  daoStatNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4ECDC4',
    marginBottom: 4,
  },
  daoStatLabel: {
    fontSize: 12,
    color: '#555',
  },
  // Share content
  shareDescription: {
    textAlign: 'center',
    color: '#333',
    marginBottom: 20,
    lineHeight: 20,
  },
  registrationFeatures: {
    marginBottom: 20,
    zIndex: 1,
  },
  featureItemContainer: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    paddingBottom: 15,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  featureIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: 'rgba(78, 205, 196, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureChecked: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: '#4ECDC4',
    borderWidth: 2,
    borderColor: '#4ECDC4',
  },
  featureUnchecked: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#4ECDC4',
  },
  featureText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
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
  uploadButton: {
    alignSelf: 'center',
  width: '100%',
  height: 54,
  borderRadius: 14,
  backgroundColor: '#4ECDC4',
  marginTop: 10,
  justifyContent: 'center',
  alignItems: 'center',

  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color:'white',
  },
  buttonContainer: {
    flexDirection: 'row', // Changed to row
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8, // Space between indicator and text
  },
});

export default MainScreen;