import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Platform,
  Alert,
  Image,
  ScrollView,
  ActivityIndicator,
  Modal
} from 'react-native';
import { useNavigation } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SavedWorkoutsScreen = () => {
  const navigation = useNavigation();
  const [savedWorkouts, setSavedWorkouts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', 'week', 'month'
  const [showDateFilterModal, setShowDateFilterModal] = useState(false);

  // Load saved workouts when component mounts
  useEffect(() => {
    loadSavedWorkouts();
  }, []);

  // Load saved workouts from AsyncStorage
  const loadSavedWorkouts = async () => {
    try {
      setIsLoading(true);
      const savedWorkoutsJson = await AsyncStorage.getItem('savedWorkouts');
      if (savedWorkoutsJson !== null) {
        const workouts = JSON.parse(savedWorkoutsJson);
        // Sort by date added (newest first)
        workouts.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
        setSavedWorkouts(workouts);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading saved workouts:', error);
      setIsLoading(false);
    }
  };

  // Delete a workout exercise
  const deleteWorkout = async (workoutId) => {
    Alert.alert(
      "Remove Exercise",
      "Are you sure you want to remove this exercise from your workout?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Remove", 
          style: "destructive",
          onPress: async () => {
            try {
              const updatedWorkouts = savedWorkouts.filter(workout => workout.id !== workoutId);
              await AsyncStorage.setItem('savedWorkouts', JSON.stringify(updatedWorkouts));
              setSavedWorkouts(updatedWorkouts);
            } catch (error) {
              console.error('Error deleting workout:', error);
            }
          }
        }
      ]
    );
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Function to check if date is within specified time range
  const isDateInRange = (dateString, range) => {
    const today = new Date();
    const date = new Date(dateString);
    
    // Reset hours to compare just the dates
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    
    const diffTime = Math.abs(today - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    switch(range) {
      case 'today':
        return diffDays === 0;
      case 'week':
        return diffDays <= 7;
      case 'month':
        return diffDays <= 30;
      default:
        return true; // 'all' case
    }
  };

  // Get filtered workouts based on active filter
  const getFilteredWorkouts = () => {
    let filteredByType = savedWorkouts;
    
    // Filter by body group or exercise type
    if (activeFilter !== 'all') {
      const upperBodyParts = ['Shoulders', 'Chest', 'Arms', 'core', 'Upper Body'];
      const lowerBodyParts = ['Hips', 'Upper Legs', 'Lower Legs', 'Lower Body'];
      
      if (activeFilter === 'upper') {
        filteredByType = savedWorkouts.filter(workout => 
          upperBodyParts.includes(workout.bodyPart) || 
          (workout.bodyPartGroup && upperBodyParts.includes(workout.bodyPartGroup))
        );
      } else if (activeFilter === 'lower') {
        filteredByType = savedWorkouts.filter(workout => 
          lowerBodyParts.includes(workout.bodyPart) || 
          (workout.bodyPartGroup && lowerBodyParts.includes(workout.bodyPartGroup))
        );
      } else if (activeFilter === 'freeweight') {
        filteredByType = savedWorkouts.filter(workout => workout.exerciseType === 'Free Weight');
      } else if (activeFilter === 'machine') {
        filteredByType = savedWorkouts.filter(workout => workout.exerciseType === 'Machine');
      }
    }
    
    // Apply date filter if not 'all'
    if (dateFilter !== 'all') {
      return filteredByType.filter(workout => isDateInRange(workout.dateAdded, dateFilter));
    }
    
    return filteredByType;
  };

  // Toggle date filter modal
  const toggleDateFilterModal = () => {
    setShowDateFilterModal(!showDateFilterModal);
  };

  // Render date filter modal
  const renderDateFilterModal = () => {
    return (
      <Modal
        visible={showDateFilterModal}
        transparent={true}
        animationType="fade"
        onRequestClose={toggleDateFilterModal}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={toggleDateFilterModal}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filter by Date</Text>
            
            <TouchableOpacity
              style={[styles.dateFilterOption, dateFilter === 'all' && styles.selectedDateFilter]}
              onPress={() => {
                setDateFilter('all');
                toggleDateFilterModal();
              }}
            >
              <Text style={[styles.dateFilterText, dateFilter === 'all' && styles.selectedDateFilterText]}>
                All Time
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.dateFilterOption, dateFilter === 'today' && styles.selectedDateFilter]}
              onPress={() => {
                setDateFilter('today');
                toggleDateFilterModal();
              }}
            >
              <Text style={[styles.dateFilterText, dateFilter === 'today' && styles.selectedDateFilterText]}>
                Today
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.dateFilterOption, dateFilter === 'week' && styles.selectedDateFilter]}
              onPress={() => {
                setDateFilter('week');
                toggleDateFilterModal();
              }}
            >
              <Text style={[styles.dateFilterText, dateFilter === 'week' && styles.selectedDateFilterText]}>
                Last 7 Days
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.dateFilterOption, dateFilter === 'month' && styles.selectedDateFilter]}
              onPress={() => {
                setDateFilter('month');
                toggleDateFilterModal();
              }}
            >
              <Text style={[styles.dateFilterText, dateFilter === 'month' && styles.selectedDateFilterText]}>
                Last 30 Days
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };
  
  // Function to get date filter display text
  const getDateFilterText = () => {
    switch(dateFilter) {
      case 'today':
        return 'Today';
      case 'week':
        return 'Last 7 Days';
      case 'month':
        return 'Last 30 Days';
      default:
        return 'All Time';
    }
  };

  // Render a workout item
  const renderWorkoutItem = ({ item }) => {
    return (
      <View style={styles.workoutCard}>
        <View style={styles.workoutHeader}>
          <Text style={styles.workoutName}>{item.name}</Text>
          <View style={styles.difficultyBadge}>
            <Text style={styles.difficultyText}>{item.difficulty}</Text>
          </View>
        </View>
        
        <View style={styles.targetInfo}>
          <Text style={styles.targetText}>
            {item.bodyPartGroup ? `${item.bodyPartGroup} (${item.bodyPart})` : item.bodyPart}
          </Text>
          <Text style={styles.typeText}>{item.exerciseType}</Text>
        </View>
        
        <View style={styles.exerciseImageContainer}>
          <Image 
            source={item.image} 
            style={styles.exerciseImage}
            resizeMode="cover"
          />
        </View>
        
        <Text style={styles.exerciseDescription}>{item.description}</Text>
        
        <View style={styles.exerciseDetails}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Sets</Text>
            <Text style={styles.detailValue}>{item.sets}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Reps</Text>
            <Text style={styles.detailValue}>{item.reps}</Text>
          </View>
          <View style={styles.dateAddedContainer}>
            <Text style={styles.dateAddedText}>Added: {formatDate(item.dateAdded)}</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.removeButton}
          onPress={() => deleteWorkout(item.id)}
        >
          <FontAwesome name="trash" size={16} color="white" />
          <Text style={styles.removeButtonText}>Remove from Workout</Text>
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
          <Text style={styles.headerTitle}>My Workout</Text>
          <View style={styles.iconPlaceholder} />
        </View>
      </View>
      
      {/* Filter tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity 
            style={[styles.filterTab, activeFilter === 'all' && styles.activeFilterTab]}
            onPress={() => setActiveFilter('all')}
          >
            <Text style={[styles.filterText, activeFilter === 'all' && styles.activeFilterText]}>All</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.filterTab, activeFilter === 'upper' && styles.activeFilterTab]}
            onPress={() => setActiveFilter('upper')}
          >
            <Text style={[styles.filterText, activeFilter === 'upper' && styles.activeFilterText]}>Upper Body</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.filterTab, activeFilter === 'lower' && styles.activeFilterTab]}
            onPress={() => setActiveFilter('lower')}
          >
            <Text style={[styles.filterText, activeFilter === 'lower' && styles.activeFilterText]}>Lower Body</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.filterTab, activeFilter === 'freeweight' && styles.activeFilterTab]}
            onPress={() => setActiveFilter('freeweight')}
          >
            <Text style={[styles.filterText, activeFilter === 'freeweight' && styles.activeFilterText]}>Free Weight</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.filterTab, activeFilter === 'machine' && styles.activeFilterTab]}
            onPress={() => setActiveFilter('machine')}
          >
            <Text style={[styles.filterText, activeFilter === 'machine' && styles.activeFilterText]}>Machine</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
      
      {/* Date filter */}
      <TouchableOpacity 
        style={styles.dateFilterButton}
        onPress={toggleDateFilterModal}
      >
        <FontAwesome name="calendar" size={16} color="#4285F4" style={styles.dateFilterIcon} />
        <Text style={styles.dateFilterButtonText}>{getDateFilterText()}</Text>
        <FontAwesome name="chevron-down" size={12} color="#4285F4" />
      </TouchableOpacity>
      
      {renderDateFilterModal()}
      
      {isLoading ? (
        <View style={styles.centeredContent}>
          <ActivityIndicator size="large" color="#4285F4" />
          <Text style={styles.loadingText}>Loading your workout...</Text>
        </View>
      ) : getFilteredWorkouts().length === 0 ? (
        <View style={styles.centeredContent}>
          <FontAwesome name="dumbbell" size={60} color="#ccc" />
          <Text style={styles.emptyText}>
            {activeFilter === 'all' && dateFilter === 'all'
              ? 'No exercises in your workout yet'
              : 'No exercises match the selected filters'}
          </Text>
          <Text style={styles.emptySubtext}>
            {activeFilter === 'all' && dateFilter === 'all'
              ? 'Add exercises from the exercise generator to build your workout'
              : 'Try different filters or add more exercises to your workout'}
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.browseButtonText}>Browse Exercises</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={getFilteredWorkouts()}
          renderItem={renderWorkoutItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
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
    paddingTop: Platform.OS === 'android' ? 8 : 0,
    elevation: 4,
    shadowColor: '#000',
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
    width: 36,
  },
  filterContainer: {
    backgroundColor: 'white',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginHorizontal: 5,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  activeFilterTab: {
    backgroundColor: '#4285F4',
    borderColor: '#4285F4',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  activeFilterText: {
    color: 'white',
  },
  dateFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  dateFilterIcon: {
    marginRight: 8,
  },
  dateFilterButtonText: {
    fontSize: 14,
    color: '#4285F4',
    fontWeight: '600',
    marginRight: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    maxWidth: 350,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  dateFilterOption: {
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
    paddingHorizontal: 15,
  },
  selectedDateFilter: {
    backgroundColor: '#E8F0FE',
  },
  dateFilterText: {
    fontSize: 16,
    color: '#333',
  },
  selectedDateFilterText: {
    color: '#4285F4',
    fontWeight: '600',
  },
  listContent: {
    padding: 15,
    paddingBottom: 30,
  },
  workoutCard: {
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
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  workoutName: {
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
  targetInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  targetText: {
    fontSize: 14,
    color: '#4285F4',
    fontStyle: 'italic',
  },
  typeText: {
    fontSize: 14,
    color: '#666',
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  detailItem: {
    marginRight: 20,
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
  dateAddedContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  dateAddedText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  removeButton: {
    backgroundColor: '#EA4335',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 8,
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    marginBottom: 20,
    textAlign: 'center',
  },
  browseButton: {
    backgroundColor: '#4285F4',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  browseButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },
});

export default SavedWorkoutsScreen;