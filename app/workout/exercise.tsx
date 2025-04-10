import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  Image,
  StatusBar,
  Platform,
  Alert,
  Linking,
  Modal
} from 'react-native';
import { useNavigation, router, useLocalSearchParams } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import YoutubePlayer from 'react-native-youtube-iframe';
import { GEMINI_API_KEY } from '@env';
import { lilypadInference, processLilyPadResponse } from '@/utils/lilypad';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro-exp-03-25:streamGenerateContent';

const ExerciseAIScreen = () => {
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const { bodyPart, exerciseType } = params;
  
  const [loading, setLoading] = useState(true);
  const [exercises, setExercises] = useState([]);
  const [aiThinking, setAiThinking] = useState(true);
  const [savedWorkouts, setSavedWorkouts] = useState([]);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [currentExerciseId, setCurrentExerciseId] = useState(null);
  const [userBioData, setUserBioData] = useState(null);
  const [macroResults, setMacroResults] = useState(null);
  const [error, setError] = useState(null);
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [currentVideoId, setCurrentVideoId] = useState('');
  const [playing, setPlaying] = useState(false);

  const onStateChange = useCallback((state) => {
    if (state === "ended") {
      setPlaying(false);
    }
  }, []);

  useEffect(() => {
    loadSavedWorkouts();
    loadUserBioData();
    loadMacroResults();
  }, []);

  const loadSavedWorkouts = async () => {
    try {
      const savedWorkoutsJson = await AsyncStorage.getItem('savedWorkouts');
      if (savedWorkoutsJson !== null) {
        setSavedWorkouts(JSON.parse(savedWorkoutsJson));
      }
    } catch (error) {
      console.error('Error loading saved workouts:', error);
    }
  };

  const loadUserBioData = async () => {
    try {
      const bioDataJson = await AsyncStorage.getItem('@macro_calculator_user_bio');
      if (bioDataJson !== null) {
        setUserBioData(JSON.parse(bioDataJson));
      }
    } catch (error) {
      console.error('Error loading user bio data:', error);
    }
  };

  const loadMacroResults = async () => {
    try {
      const macroResultsJson = await AsyncStorage.getItem('@macro_calculator_last_results');
      if (macroResultsJson !== null) {
        setMacroResults(JSON.parse(macroResultsJson));
      }
    } catch (error) {
      console.error('Error loading macro results:', error);
    }
  };

  // Save an exercise to the workout
  const saveExerciseToWorkout = async (exercise) => {
    try {
      // Set the current exercise ID for toast message
      setCurrentExerciseId(exercise.name);
      
      // Create object with metadata
      const workoutExercise = {
        ...exercise,
        id: Date.now().toString(),
        dateAdded: new Date().toISOString(),
        bodyPart: bodyPart,
        exerciseType: exerciseType === '1' ? 'Free Weight' : 'Machine',
      };
      
      // Add to saved workouts array
      const updatedWorkouts = [...savedWorkouts, workoutExercise];
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('savedWorkouts', JSON.stringify(updatedWorkouts));
      
      // Update state
      setSavedWorkouts(updatedWorkouts);
      
      // Show success message
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000); // Hide success message after 2 seconds
      
    } catch (error) {
      console.error('Error saving exercise to workout:', error);
    }
  };

  // Open video in modal
  const openVideoModal = (videoId) => {
    if (!videoId) return;
    
    setCurrentVideoId(videoId);
    setVideoModalVisible(true);
    setPlaying(true);
  };

  // Improved function to handle Gemini API streaming response
  const processGeminiResponse = async (geminiData) => {
    try {
      // Check if we have streaming response (an array of chunks)
      if (!Array.isArray(geminiData)) {
        throw new Error('Expected an array response from Gemini API');
      }

      // Concatenate all text parts from the streaming response
      let fullText = '';
      
      for (const chunk of geminiData) {
        if (chunk?.candidates && chunk.candidates.length > 0) {
          const candidate = chunk.candidates[0];
          if (candidate?.content?.parts && candidate.content.parts.length > 0) {
            for (const part of candidate.content.parts) {
              if (part.text) {
                fullText += part.text;
              }
            }
          }
        }
      }

      console.log("Concatenated text length:", fullText.length);
      
      // Clean up the response - first try to extract from code blocks
      let cleanedText = fullText;
      const codeBlockMatch = fullText.match(/```json\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch && codeBlockMatch[1]) {
        cleanedText = codeBlockMatch[1];
      }
      
      // Find a valid JSON object
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in the response');
      }
      
      // Parse the JSON
      try {
        const parsedData = JSON.parse(jsonMatch[0]);
        
        // Verify the structure - we expect exercises array
        if (!parsedData.exercises || !Array.isArray(parsedData.exercises)) {
          throw new Error('Invalid exercise data structure: missing exercises array');
        }
        
        // Process the exercises
        const processedExercises = parsedData.exercises.map(exercise => {
          // Validate expected fields and provide defaults if missing
          return {
            name: exercise.name || 'Unknown Exercise',
            description: exercise.description || 'No description available',
            difficulty: exercise.difficulty || 'Moderate',
            sets: exercise.sets || '3',
            reps: exercise.reps || '10-12',
            benefits: exercise.benefits || '',
            // Use placeholder image if URL is missing or invalid
            image: exercise.imageUrl 
              ? { uri: exercise.imageUrl } 
              : require('../../assets/images/placeholder.png'),
            youtubeVideoId: exercise.youtubeVideoId || ''
          };
        });
        
        return processedExercises;
      } catch (parseError) {
        console.error('Error parsing JSON:', parseError);
        console.error('JSON string that failed to parse:', jsonMatch[0]);
        throw new Error('Failed to parse JSON from Gemini response');
      }
    } catch (error) {
      console.error('Error processing Gemini response:', error);
      throw error;
    }
  };

  // Generate exercise recommendations with Gemini API
  const generateExercisesWithLilyPad = async () => {
    setLoading(true);
    setAiThinking(true);
    setError(null);
    
    try {
      // Prepare the exercise type and body part information
      const exerciseTypeLabel = exerciseType === '1' ? 'Free Weight' : 'Machine';
      
      // Prepare the user's bio data information if available
      let userContext = "The user hasn't provided their physical information.";
      if (userBioData) {
        const heightUnit = userBioData.unitSystem === 'metric' ? 'cm' : 'inches';
        const weightUnit = userBioData.unitSystem === 'metric' ? 'kg' : 'lbs';
        const genderInfo = userBioData.gender === 'other' ? 'non-binary' : userBioData.gender;
        
        userContext = `The user is a ${userBioData.age} year old ${genderInfo} individual, 
                      ${userBioData.height} ${heightUnit} tall, weighing ${userBioData.weight} ${weightUnit}.`;
      }
      
      // Add macro information if available
      let macroContext = "";
      if (macroResults) {
        macroContext = `Their daily nutritional goals are: 
                      ${macroResults.calories} calories, 
                      ${macroResults.protein}g protein, 
                      ${macroResults.carbs}g carbs, 
                      ${macroResults.fat}g fat.`;
      }

      const prompt = `
        Generate 3-5 exercise recommendations in detailed JSON format.
        
        User context: ${userContext}
        ${macroContext}
        
        Exercise type: ${exerciseTypeLabel}
        Body part focus: ${bodyPart}
        
        For each exercise, provide the following information in this exact JSON structure:
        {
          "exercises": [
            {
              "name": "Exercise Name",
              "description": "Detailed instructions on how to perform it correctly",
              "difficulty": "Beginner/Moderate/Advanced",
              "sets": "Recommended number of sets",
              "reps": "Recommended rep range",
              "benefits": "Health and fitness benefits of this exercise",
              "imageUrl": "URL to a royalty-free/stock image of this exercise",
              "youtubeVideoId": "YouTube video ID for a tutorial of this exercise"
            }
          ]
        }

        Select exercises that are appropriate for the user's physical characteristics and fitness level.
        For YouTube videos, provide only the video ID (the part after v= in the URL).
        For images, provide URLs to royalty-free stock images that show the proper form.
        Only include exercises that are appropriate for the requested body part and equipment type.
        Respond ONLY with the JSON. No text before or after.
      `;

      const exer = await lilypadInference(prompt)
      const processEx = await processLilyPadResponse(exer)
      setExercises(processEx)
      setAiThinking(false);
      setLoading(false);
      console.log(JSON.stringify(exer))
      return

      // Prepare the request body for Gemini API
      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.4,
          topK: 32,
          topP: 1,
          maxOutputTokens: 4096,
        }
      };

      console.log(prompt)
      // Call the Gemini API
      console.log("Calling Gemini API...");
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
      console.log("Response received from Gemini");
      console.log(JSON.stringify(geminiData))
      // Process the response using our improved function
      const processedExercises = await processGeminiResponse(geminiData);
      setExercises(processedExercises);
      
    } catch (error) {
      console.error('Error generating exercises:', error);
      setError(error.message);
      
      // Do not fall back to local data, show empty state instead
      setExercises([]);
    } finally {
      setAiThinking(false);
      setLoading(false);
    }
  };
  
  // Load exercises when the component mounts
  useEffect(() => {
    generateExercisesWithLilyPad();
  }, [bodyPart, exerciseType]);
  
  // Render an individual exercise card
  const renderExerciseCard = (exercise, index) => {
    return (
      <View key={index} style={styles.exerciseCard}>
        <View style={styles.exerciseHeader}>
          <Text style={styles.exerciseName}>{exercise.name}</Text>
          <View style={styles.difficultyBadge}>
            <Text style={styles.difficultyText}>{exercise.difficulty}</Text>
          </View>
        </View>
        
        {exercise.bodyPartGroup && (
          <Text style={styles.bodyPartGroup}>For: {exercise.bodyPartGroup}</Text>
        )}
        
        <View style={styles.exerciseImageContainer}>
          <Image 
            source={exercise.image} 
            style={styles.exerciseImage}
            resizeMode="contain"
          />
        </View>
        
        <Text style={styles.exerciseDescription}>{exercise.description}</Text>
        
        {exercise.benefits && (
          <Text style={styles.exerciseBenefits}>
            <Text style={{fontWeight: 'bold'}}>Benefits: </Text>
            {exercise.benefits}
          </Text>
        )}
        
        <View style={styles.exerciseDetails}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Sets</Text>
            <Text style={styles.detailValue}>{exercise.sets}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Reps</Text>
            <Text style={styles.detailValue}>{exercise.reps}</Text>
          </View>
        </View>
        
        {exercise.youtubeVideoId && (
          <TouchableOpacity 
            style={styles.youtubeButton}
            onPress={() => openVideoModal(exercise.youtubeVideoId)}
          >
            <FontAwesome name="youtube-play" size={20} color="white" />
            <Text style={styles.youtubeButtonText}>Watch Tutorial</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => saveExerciseToWorkout(exercise)}
        >
          <Text style={styles.addButtonText}>Add to Workout</Text>
        </TouchableOpacity>
      </View>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.headerContainer}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <FontAwesome name="arrow-left" size={20} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {exerciseType === '1' ? 'Free Weight' : 'Machine'} Exercises
        </Text>
        <TouchableOpacity 
          style={styles.viewWorkoutsButton}
          onPress={() => router.push('/workout/savedworkouts')}
        >
          <View style={styles.buttonWithBadge}>
            <FontAwesome name="list-alt" size={20} color="#333" />
            {savedWorkouts.length > 0 && (
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>{savedWorkouts.length}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
      </View>
      
      <View style={styles.subHeader}>
        <Text style={styles.regionTitle}>For: {bodyPart}</Text>
        {userBioData && (
          <Text style={styles.personalizedText}>Personalized for your profile</Text>
        )}
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4285F4" />
          <Text style={styles.loadingText}>
            {aiThinking ? 'AI is analyzing your selection...' : 'Loading exercises...'}
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>
                {error}
              </Text>
              <Text style={styles.errorSubText}>
                Please try again or adjust your selection.
              </Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={generateExercisesWithLilyPad}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {exercises.length > 0 ? (
            exercises.map((exercise, index) => renderExerciseCard(exercise, index))
          ) : (
            <View style={styles.noResults}>
              <Text style={styles.noResultsText}>
                No exercises were found for this combination.
              </Text>
              {!loading && !error && (
                <TouchableOpacity 
                  style={styles.retryButton}
                  onPress={generateExercisesWithLilyPad}
                >
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          
          <View style={styles.disclaimerContainer}>
            <Text style={styles.disclaimerText}>
              These exercises are AI-generated recommendations. Always consult with a fitness professional before starting a new exercise routine.
            </Text>
          </View>
        </ScrollView>
      )}
      
      {saveSuccess && (
        <View style={styles.saveSuccessToast}>
          <FontAwesome name="check-circle" size={16} color="white" />
          <Text style={styles.saveSuccessText}>
            {currentExerciseId ? `${currentExerciseId} added to workout!` : 'Exercise added!'}
          </Text>
        </View>
      )}

      {/* YouTube Video Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={videoModalVisible}
        onRequestClose={() => {
          setVideoModalVisible(false);
          setPlaying(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Exercise Tutorial</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setVideoModalVisible(false);
                  setPlaying(false);
                }}
              >
                <FontAwesome name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.youtubeContainer}>
              <YoutubePlayer
                height={220}
                play={playing}
                videoId={currentVideoId}
                onChangeState={onStateChange}
              />
            </View>
            
            <TouchableOpacity
              style={styles.fullscreenButton}
              onPress={() => {
                setVideoModalVisible(false);
                setPlaying(false);
                Linking.openURL(`https://www.youtube.com/watch?v=${currentVideoId}`);
              }}
            >
              <FontAwesome name="external-link" size={16} color="white" />
              <Text style={styles.fullscreenButtonText}>Open in YouTube</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    backgroundColor: 'white',
    paddingTop: Platform.OS === 'android' ? 20 : 0, // Additional padding for Android
    elevation: 4, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: 'white',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  iconPlaceholder: {
    width: 36, // Match width of back button for centering
  },
  subHeader: {
    backgroundColor: '#4285F4',
    padding: 15,
    alignItems: 'center',
  },
  regionTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  personalizedText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorContainer: {
    padding: 15,
    backgroundColor: 'rgba(234, 67, 53, 0.1)',
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#EA4335',
  },
  errorText: {
    fontSize: 14,
    color: '#EA4335',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  errorSubText: {
    fontSize: 12,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 15,
    paddingBottom: 30,
  },
  exerciseCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  difficultyBadge: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 12,
    color: '#666',
  },
  bodyPartGroup: {
    fontSize: 14,
    color: '#4285F4',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  exerciseImageContainer: {
    height: 150,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: '#f0f0f0',
  },
  exerciseImage: {
    width: '100%',
    height: '100%',
  },
  exerciseDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    lineHeight: 20,
  },
  exerciseBenefits: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  exerciseDetails: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 15,
  },
  detailItem: {
    marginRight: 30,
  },
  detailLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  youtubeButton: {
    backgroundColor: '#FF0000',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  youtubeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 6,
  },
  addButton: {
    backgroundColor: '#34A853',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 5,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  noResults: {
    padding: 30,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#4285F4',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 15,
    alignSelf: 'center',
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  disclaimerContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: 'rgba(66, 133, 244, 0.1)',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4285F4',
  },
  disclaimerText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  saveSuccessToast: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: '#34A853',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  saveSuccessText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 6,
  },
  viewWorkoutsButton: {
    padding: 8,
  },
  buttonWithBadge: {
    position: 'relative',
  },
  badgeContainer: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#EA4335',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  // YouTube Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  youtubeContainer: {
    width: '100%',
    height: 220,
    marginBottom: 15,
    borderRadius: 8,
    overflow: 'hidden',
  },
  fullscreenButton: {
    backgroundColor: '#FF0000',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  fullscreenButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 6,
  },
});

export default ExerciseAIScreen;