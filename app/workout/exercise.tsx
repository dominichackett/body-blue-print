import React, { useState, useEffect } from 'react';
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
  Platform
} from 'react-native';
import { useNavigation,router, useLocalSearchParams } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  useEffect(() => {
    loadSavedWorkouts();
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

  // Simulate AI loading
  useEffect(() => {
    // Show loading for a realistic time
    const loadingTimer = setTimeout(() => {
      setAiThinking(false);
      
      // Generate exercise recommendations based on body part and type
      const generatedExercises = generateExercises(bodyPart, exerciseType);
      setExercises(generatedExercises);
      setLoading(false);
    }, 2500);
    
    return () => clearTimeout(loadingTimer);
  }, [bodyPart, exerciseType]);
  
  // Simulate AI exercise generation
  const generateExercises = (part, type) => {
    // Convert the numeric exercise type to string for readability
    const typeLabel = type === '1' ? 'Free Weight' : 'Machine';
    console.log(`Generating ${typeLabel} exercises for ${part}`);
    
    // Define exercise templates based on body part and exercise type
    const exerciseTemplates = {
      // Upper body exercises
      Shoulders: {
        '1': [ // Free weight
          {
            name: 'Dumbbell Shoulder Press',
            description: 'Press dumbbells overhead while seated or standing',
            difficulty: 'Moderate',
            sets: '3-4',
            reps: '8-12',
            image: require('../../assets/images/placeholder.png')
          },
          {
            name: 'Lateral Raises',
            description: 'Raise dumbbells to sides until arms are parallel to floor',
            difficulty: 'Beginner',
            sets: '3',
            reps: '12-15',
            image: require('../../assets/images/placeholder.png')
          },
          {
            name: 'Front Raises',
            description: 'Raise dumbbells in front of you to shoulder height',
            difficulty: 'Beginner',
            sets: '3',
            reps: '12-15',
            image: require('../../assets/images/placeholder.png')
          }
        ],
        '2': [ // Machine
          {
            name: 'Shoulder Press Machine',
            description: 'Push handles upward while seated in machine',
            difficulty: 'Beginner',
            sets: '3-4',
            reps: '10-12',
            image: require('../../assets/images/placeholder.png')
          },
          {
            name: 'Cable Lateral Raises',
            description: 'Use cable machine to perform lateral raises with greater tension',
            difficulty: 'Moderate',
            sets: '3',
            reps: '10-15',
            image: require('../../assets/images/placeholder.png')
          }
        ]
      },
      Chest: {
        '1': [ // Free weight
          {
            name: 'Barbell Bench Press',
            description: 'Classic chest exercise with barbell on flat bench',
            difficulty: 'Moderate',
            sets: '4',
            reps: '6-10',
            image: require('../../assets/images/placeholder.png')
          },
          {
            name: 'Incline Dumbbell Press',
            description: 'Press dumbbells on an inclined bench to target upper chest',
            difficulty: 'Moderate',
            sets: '3',
            reps: '8-12',
            image: require('../../assets/images/placeholder.png')
          },
          {
            name: 'Dumbbell Flyes',
            description: 'Open arms wide and bring dumbbells together in arcing motion',
            difficulty: 'Moderate',
            sets: '3',
            reps: '10-15',
            image: require('../../assets/images/placeholder.png')
          }
        ],
        '2': [ // Machine
          {
            name: 'Chest Press Machine',
            description: 'Push handles forward while seated in machine',
            difficulty: 'Beginner',
            sets: '3-4',
            reps: '10-12',
            image: require('../../assets/images/placeholder.png')
          },
          {
            name: 'Cable Crossover',
            description: 'Pull cable handles across your body to target chest',
            difficulty: 'Moderate',
            sets: '3',
            reps: '12-15',
            image: require('../../assets/images/placeholder.png')
          },
          {
            name: 'Pec Deck Machine',
            description: 'Bring padded arms together in front of chest',
            difficulty: 'Beginner',
            sets: '3',
            reps: '12-15',
            image: require('../../assets/images/placeholder.png')
          }
        ]
      },
      Arms: {
        '1': [ // Free weight
          {
            name: 'Barbell Bicep Curls',
            description: 'Curl barbell toward shoulders to target biceps',
            difficulty: 'Beginner',
            sets: '3-4',
            reps: '10-12',
            image: require('../../assets/images/placeholder.png')
          },
          {
            name: 'Skull Crushers',
            description: 'Lower weight to forehead while lying on bench to target triceps',
            difficulty: 'Moderate',
            sets: '3',
            reps: '10-12',
            image: require('../../assets/images/placeholder.png')
          },
          {
            name: 'Hammer Curls',
            description: 'Curl dumbbells with palms facing each other',
            difficulty: 'Beginner',
            sets: '3',
            reps: '10-12',
            image: require('../../assets/images/placeholder.png')
          }
        ],
        '2': [ // Machine
          {
            name: 'Cable Bicep Curls',
            description: 'Curl cable handle upward to target biceps',
            difficulty: 'Beginner',
            sets: '3',
            reps: '12-15',
            image: require('../../assets/images/placeholder.png')
          },
          {
            name: 'Tricep Pushdown',
            description: 'Push cable handle down to extend arms and target triceps',
            difficulty: 'Beginner',
            sets: '3-4',
            reps: '12-15',
            image: require('../../assets/images/placeholder.png')
          },
          {
            name: 'Assisted Dip Machine',
            description: 'Perform dips with machine assistance to target triceps',
            difficulty: 'Moderate',
            sets: '3',
            reps: '10-12',
            image: require('../../assets/images/placeholder.png')
          }
        ]
      },
      core: {
        '1': [ // Free weight
          {
            name: 'Weighted Russian Twists',
            description: 'Sit on floor and twist torso holding weight to target obliques',
            difficulty: 'Moderate',
            sets: '3',
            reps: '20 (10 each side)',
            image: require('../../assets/images/placeholder.png')
          },
          {
            name: 'Weighted Crunches',
            description: 'Hold weight on chest while performing crunches',
            difficulty: 'Beginner',
            sets: '3',
            reps: '15-20',
            image: require('../../assets/images/placeholder.png')
          },
          {
            name: 'Hanging Leg Raises',
            description: 'Hang from bar and raise legs to target lower abs',
            difficulty: 'Advanced',
            sets: '3',
            reps: '10-15',
            image: require('../../assets/images/placeholder.png')
          }
        ],
        '2': [ // Machine
          {
            name: 'Ab Crunch Machine',
            description: 'Sit in machine and crunch forward against resistance',
            difficulty: 'Beginner',
            sets: '3',
            reps: '15-20',
            image: require('../../assets/images/placeholder.png')
          },
          {
            name: 'Cable Woodchoppers',
            description: 'Pull cable handle across body in chopping motion',
            difficulty: 'Moderate',
            sets: '3',
            reps: '12-15 each side',
            image: require('../../assets/images/placeholder.png')
          },
          {
            name: 'Seated Rotation Machine',
            description: 'Sit in machine and rotate torso against resistance',
            difficulty: 'Beginner',
            sets: '3',
            reps: '15 each side',
            image: require('../../assets/images/placeholder.png')
          }
        ]
      },
      // Lower body exercises
      Hips: {
        '1': [ // Free weight
          {
            name: 'Barbell Hip Thrust',
            description: 'Rest upper back on bench and thrust hips upward with barbell',
            difficulty: 'Moderate',
            sets: '3-4',
            reps: '10-12',
            image: require('../../assets/images/placeholder.png')
          },
          {
            name: 'Dumbbell Sumo Squat',
            description: 'Wide stance squat holding dumbbell to target hips and glutes',
            difficulty: 'Moderate',
            sets: '3',
            reps: '12-15',
            image: require('../../assets/images/placeholder.png')
          }
        ],
        '2': [ // Machine
          {
            name: 'Hip Abduction Machine',
            description: 'Push legs outward against resistance',
            difficulty: 'Beginner',
            sets: '3',
            reps: '15-20',
            image: require('../../assets/images/placeholder.png')
          },
          {
            name: 'Hip Adduction Machine',
            description: 'Bring legs together against resistance',
            difficulty: 'Beginner',
            sets: '3',
            reps: '15-20',
            image: require('../../assets/images/placeholder.png')
          },
          {
            name: 'Cable Pull Through',
            description: 'Bend at hips and pull cable through legs',
            difficulty: 'Moderate',
            sets: '3',
            reps: '12-15',
            image: require('../../assets/images/placeholder.png')
          }
        ]
      },
      'Upper Legs': {
        '1': [ // Free weight
          {
            name: 'Barbell Squats',
            description: 'Classic compound exercise for quadriceps, hamstrings and glutes',
            difficulty: 'Moderate',
            sets: '4',
            reps: '8-12',
            image: require('../../assets/images/placeholder.png')
          },
          {
            name: 'Romanian Deadlift',
            description: 'Hinge at hips with slight knee bend to target hamstrings',
            difficulty: 'Moderate',
            sets: '3',
            reps: '8-12',
            image: require('../../assets/images/placeholder.png')
          },
          {
            name: 'Lunges with Dumbbells',
            description: 'Step forward into lunge position with dumbbells',
            difficulty: 'Moderate',
            sets: '3',
            reps: '10-12 each leg',
            image: require('../../assets/images/placeholder.png')
          }
        ],
        '2': [ // Machine
          {
            name: 'Leg Press',
            description: 'Push weight platform away with legs while seated',
            difficulty: 'Beginner',
            sets: '3-4',
            reps: '10-15',
            image: require('../../assets/images/placeholder.png')
          },
          {
            name: 'Leg Extension',
            description: 'Extend legs against resistance to target quadriceps',
            difficulty: 'Beginner',
            sets: '3',
            reps: '12-15',
            image: require('../../assets/images/placeholder.png')
          },
          {
            name: 'Seated Leg Curl',
            description: 'Curl legs against resistance to target hamstrings',
            difficulty: 'Beginner',
            sets: '3',
            reps: '12-15',
            image: require('../../assets/images/placeholder.png')
          }
        ]
      },
      'Lower Legs': {
        '1': [ // Free weight
          {
            name: 'Standing Calf Raises',
            description: 'Rise onto toes while holding dumbbells',
            difficulty: 'Beginner',
            sets: '4',
            reps: '15-20',
            image: require('../../assets/images/placeholder.png')
          },
          {
            name: 'Seated Calf Raises',
            description: 'Place weight on knees and raise heels while seated',
            difficulty: 'Beginner',
            sets: '3',
            reps: '15-20',
            image: require('../../assets/images/placeholder.png')
          }
        ],
        '2': [ // Machine
          {
            name: 'Calf Raise Machine',
            description: 'Push platform by raising heels in machine',
            difficulty: 'Beginner',
            sets: '4',
            reps: '15-20',
            image: require('../../assets/images/placeholder.png')
          },
          {
            name: 'Seated Calf Machine',
            description: 'Raise weight by extending ankles while seated',
            difficulty: 'Beginner',
            sets: '4',
            reps: '15-20',
            image: require('../../assets/images/placeholder.png')
          },
          {
            name: 'Leg Press Calf Raises',
            description: 'Perform calf raises on leg press machine',
            difficulty: 'Moderate',
            sets: '3',
            reps: '15-20',
            image: require('../../assets/images/placeholder.png')
          }
        ]
      }
    };
    
    // Handle body groups (Upper Body, Lower Body)
    if (part === 'Upper Body') {
      // Combine exercises from all upper body parts
      let combinedExercises = [];
      ['Shoulders', 'Chest', 'Arms', 'core'].forEach(bodyPart => {
        if (exerciseTemplates[bodyPart] && exerciseTemplates[bodyPart][type]) {
          // Add the source body part to each exercise
          const exercises = exerciseTemplates[bodyPart][type].map(ex => ({
            ...ex,
            bodyPartGroup: bodyPart
          }));
          combinedExercises = [...combinedExercises, ...exercises];
        }
      });
      // Return a subset to avoid overwhelming the user
      return combinedExercises.slice(0, 5);
    } 
    else if (part === 'Lower Body') {
      // Combine exercises from all lower body parts
      let combinedExercises = [];
      ['Hips', 'Upper Legs', 'Lower Legs'].forEach(bodyPart => {
        if (exerciseTemplates[bodyPart] && exerciseTemplates[bodyPart][type]) {
          // Add the source body part to each exercise
          const exercises = exerciseTemplates[bodyPart][type].map(ex => ({
            ...ex,
            bodyPartGroup: bodyPart
          }));
          combinedExercises = [...combinedExercises, ...exercises];
        }
      });
      // Return a subset to avoid overwhelming the user
      return combinedExercises.slice(0, 5);
    }
    else {
      // Return exercises for the specific body part
      return exerciseTemplates[part] && exerciseTemplates[part][type] 
        ? exerciseTemplates[part][type] 
        : [
            {
              name: 'Custom Exercise for ' + part,
              description: 'AI-generated exercise targeting ' + part,
              difficulty: 'Moderate',
              sets: '3',
              reps: '10-12',
              image: require('../../assets/images/placeholder.png')
            }
          ];
    }
  };
  
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
            resizeMode="cover"
          />
        </View>
        
        <Text style={styles.exerciseDescription}>{exercise.description}</Text>
        
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
  onPress={() => router.push('/workout/savedworkouts.')}
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
      
      <View style={styles.subHeader}>
        <Text style={styles.regionTitle}>For: {bodyPart}</Text>
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
          {exercises.length > 0 ? (
            exercises.map((exercise, index) => renderExerciseCard(exercise, index))
          ) : (
            <View style={styles.noResults}>
              <Text style={styles.noResultsText}>
                No specific exercises found for this combination.
              </Text>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0
  },
  headerContainer: {
    backgroundColor: 'white',
    paddingTop: Platform.OS === 'android' ? 8 : 0, // Additional padding for Android
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
  addButton: {
    backgroundColor: '#34A853',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
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
});

export default ExerciseAIScreen;