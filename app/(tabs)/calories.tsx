import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import Constants from 'expo-constants';
import { GEMINI_API_KEY } from '@env';
import { saveFoodToHistory } from '@/utils/FoodHistoryManager';
import {router} from 'expo-router'
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro-exp-03-25:streamGenerateContent';

const FoodCalorieDetector = ( ) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraType, setCameraType] = useState("back");
  const [capturedImage, setCapturedImage] = useState(null);
  const [calorieInfo, setCalorieInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const cameraRef = useRef(null);

  React.useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        
        // Resize and compress the image for API upload
        console.log("Picture taken");
        const processedImage = await ImageManipulator.manipulateAsync(
          photo.uri,
          [{ resize: { width: 800 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );
        console.log("process Image");
        setCapturedImage(processedImage.uri);
        setCalorieInfo(null);
        setSaved(false);
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to take picture. Please try again.');
      }
    }
  };

  const resetCamera = () => {
    setCapturedImage(null);
    setCalorieInfo(null);
    setSaved(false);
  };

  const handleSaveToHistory = async () => {
    if (!calorieInfo || !capturedImage) return;
    
    setSaving(true);
    try {
      await saveFoodToHistory(calorieInfo, capturedImage);
      setSaved(true);
      Alert.alert(
        "Saved to History",
        "This food has been saved to your history.",
        [
          { 
            text: "View History", 
            onPress: () => router.push('/workout/foodhistory') 
          },
          { 
            text: "OK", 
            style: "cancel" 
          }
        ]
      );
    } catch (error) {
      console.error('Error saving to history:', error);
      Alert.alert('Error', 'Failed to save to history. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const analyzeImage = async () => {
    if (!capturedImage) return;
    
    setLoading(true);
    try {
      // Convert image to base64
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      const base64Image = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      // Prepare the request body for Gemini API
      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: "Analyze this food image and provide the following information in JSON format: 1) Food name as 'foodName', 2) Approximate calorie content as 'calories', 3) Macro breakdown (protein, carbs, fat in grams) as 'macros' object, 4) Portion size estimation as 'portionSize'. Only respond with valid JSON."
              },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: base64Image
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.4,
          topK: 32,
          topP: 1,
          maxOutputTokens: 1024,
        }
      };

      // Call the Gemini API
      const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!geminiResponse.ok) {
        throw new Error(`API error: ${geminiResponse.status}`);
      }

      const geminiData = await geminiResponse.json();
      console.log("Response:", JSON.stringify(geminiData));
      
      // Handle streaming response format
      let fullText = '';
      
      // Check if we have an array response (streaming chunks)
      if (Array.isArray(geminiData)) {
        // Concatenate all text parts from all candidates
        for (const chunk of geminiData) {
          if (chunk.candidates && chunk.candidates.length > 0) {
            const candidate = chunk.candidates[0];
            if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
              for (const part of candidate.content.parts) {
                if (part.text) {
                  fullText += part.text;
                }
              }
            }
          }
        }
      } 
      // Handle non-streaming response format
      else if (geminiData.candidates && geminiData.candidates.length > 0) {
        const candidate = geminiData.candidates[0];
        if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
          for (const part of candidate.content.parts) {
            if (part.text) {
              fullText += part.text;
            }
          }
        }
      }
      
      console.log("Concatenated text:", fullText);
      
      // Extract JSON from the response
      // First, try to find JSON within code blocks
      let jsonMatch = fullText.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        fullText = jsonMatch[1];
      }
      
      // Then try to find a JSON object pattern
      jsonMatch = fullText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const foodData = JSON.parse(jsonMatch[0]);
          
          // Make sure we have a consistent structure
          const formattedData = {
            foodName: foodData.foodName || foodData.food_name || "Unknown Food",
            calories: foodData.calories || 0,
            macros: {
              protein: foodData.macros?.protein_grams || foodData.macros?.protein || 0,
              carbs: foodData.macros?.carbs_grams || foodData.macros?.carbs || 0,
              fat: foodData.macros?.fat_grams || foodData.macros?.fat || 0
            },
            portionSize: foodData.portionSize || foodData.portion_size || "Unknown"
          };
          
          setCalorieInfo(formattedData);
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          throw new Error('Failed to parse JSON response from Gemini');
        }
      } else {
        throw new Error('No valid JSON found in the Gemini response');
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      Alert.alert('Analysis Error', 'Failed to analyze the food image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (hasPermission === null) {
    return <View style={styles.container}><Text>Requesting camera permission...</Text></View>;
  }
  
  if (hasPermission === false) {
    return <View style={styles.container}><Text>No access to camera. Please enable camera permissions.</Text></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Food Calorie Detector</Text>
        {!capturedImage && (
          <TouchableOpacity 
            style={styles.historyButton}
            onPress={() => router.push('/workout/foodhistory')}
          >
            <Text style={styles.historyButtonText}>History</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {!capturedImage ? (
        <View style={styles.cameraContainer}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            type={cameraType}
            ratio="16:9"
          />
          <View style={styles.controlsContainer}>
            <TouchableOpacity
              style={styles.captureButton}
              onPress={takePicture}
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <ScrollView style={styles.resultContainer}>
          <Image source={{ uri: capturedImage }} style={styles.previewImage} />
          
          {!calorieInfo && !loading && (
            <TouchableOpacity style={styles.analyzeButton} onPress={analyzeImage}>
              <Text style={styles.buttonText}>Analyze Food</Text>
            </TouchableOpacity>
          )}
          
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4CAF50" />
              <Text style={styles.loadingText}>Analyzing your food...</Text>
            </View>
          )}
          
          {calorieInfo && (
            <View style={styles.calorieInfoContainer}>
              <Text style={styles.foodName}>{calorieInfo.foodName}</Text>
              <Text style={styles.calorieText}>{calorieInfo.calories} calories</Text>
              
              <View style={styles.macrosContainer}>
                <View style={styles.macroItem}>
                  <Text style={styles.macroValue}>{calorieInfo.macros.protein}g</Text>
                  <Text style={styles.macroLabel}>Protein</Text>
                </View>
                <View style={styles.macroItem}>
                  <Text style={styles.macroValue}>{calorieInfo.macros.carbs}g</Text>
                  <Text style={styles.macroLabel}>Carbs</Text>
                </View>
                <View style={styles.macroItem}>
                  <Text style={styles.macroValue}>{calorieInfo.macros.fat}g</Text>
                  <Text style={styles.macroLabel}>Fat</Text>
                </View>
              </View>
              
              <Text style={styles.portionText}>Portion: {calorieInfo.portionSize}</Text>

              {!saved && (
                <TouchableOpacity 
                  style={styles.saveButton} 
                  onPress={handleSaveToHistory}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.buttonText}>Save to History</Text>
                  )}
                </TouchableOpacity>
              )}

              {saved && (
                <View style={styles.savedBadge}>
                  <Text style={styles.savedText}>✓ Saved to History</Text>
                </View>
              )}
            </View>
          )}
          
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={styles.resetButton} 
              onPress={resetCamera}
            >
              <Text style={styles.buttonText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.historyButtonLarge} 
              onPress={() => router.push('/workout/foodhistory')}
            >
              <Text style={styles.buttonText}>View History</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginTop: Constants.statusBarHeight,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    flex: 1,
  },
  historyButton: {
    position: 'absolute',
    right: 16,
    backgroundColor: 'rgba(255, 0, 0, 0.9)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  historyButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  cameraContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
  resultContainer: {
    flex: 1,
  },
  previewImage: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  analyzeButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    margin: 20,
    alignItems: 'center',
  },
  resetButton: {
    backgroundColor: '#607D8B',
    padding: 16,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  historyButtonLarge: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  calorieInfoContainer: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  foodName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  calorieText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 20,
  },
  macrosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  macroItem: {
    alignItems: 'center',
    flex: 1,
  },
  macroValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#555',
  },
  macroLabel: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  portionText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: '#FF9800',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  savedBadge: {
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  savedText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  }
});

export default FoodCalorieDetector;