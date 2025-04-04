import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  FlatList,
  Image
} from 'react-native';
import { useNavigation } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import Constants from 'expo-constants';

const ExerciseHistoryScreen = () => {
  const navigation = useNavigation();
  const [selectedFilter, setSelectedFilter] = useState('week');
  const [historyData, setHistoryData] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 7))); // 1 week ago
  const [endDate, setEndDate] = useState(new Date());
  const [datePickerMode, setDatePickerMode] = useState('start'); // 'start' or 'end'
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  
  // Generate dummy exercise history data
  useEffect(() => {
    const generatedData = generateHistoryData();
    filterHistoryData(generatedData);
  }, [selectedFilter, startDate, endDate]);
  
  // Generate dummy exercise history data
  const generateHistoryData = () => {
    // Create an array of the past 30 days
    const today = new Date();
    const data = [];
    
    // Exercise types for variety
    const exerciseTypes = ['Free Weight', 'Machine'];
    const bodyParts = ['Shoulders', 'Chest', 'Arms', 'core', 'Hips', 'Upper Legs', 'Lower Legs'];
    const exerciseNames = {
      'Shoulders': ['Shoulder Press', 'Lateral Raises', 'Front Raises'],
      'Chest': ['Bench Press', 'Incline Press', 'Chest Flyes'],
      'Arms': ['Bicep Curls', 'Tricep Extensions', 'Hammer Curls'],
      'core': ['Crunches', 'Russian Twists', 'Leg Raises'],
      'Hips': ['Hip Thrusts', 'Sumo Squats', 'Hip Abduction'],
      'Upper Legs': ['Squats', 'Lunges', 'Leg Press'],
      'Lower Legs': ['Calf Raises', 'Seated Calf Raises', 'Leg Press Calf Raises']
    };
    
    // Generate 30 days of dummy data
    for (let i = 0; i < 30; i++) {
      // Create date for this entry
      const entryDate = new Date(today);
      entryDate.setDate(today.getDate() - i);
      
      // Skip some days randomly to make data more realistic
      if (i % 4 === 3) continue; // Skip every 4th day for rest days
      
      // Create between 1-4 exercises for this day
      const numExercises = Math.floor(Math.random() * 4) + 1;
      const dailyExercises = [];
      
      for (let j = 0; j < numExercises; j++) {
        const exerciseType = exerciseTypes[Math.floor(Math.random() * exerciseTypes.length)];
        const bodyPart = bodyParts[Math.floor(Math.random() * bodyParts.length)];
        const exerciseName = exerciseNames[bodyPart][Math.floor(Math.random() * exerciseNames[bodyPart].length)];
        
        // Create a weighted type string (e.g., "Barbell", "Dumbbell", "Machine")
        const weightType = exerciseType === 'Free Weight' 
          ? (Math.random() > 0.5 ? 'Barbell' : 'Dumbbell')
          : 'Machine';
        
        // Exercise details
        dailyExercises.push({
          id: `${entryDate.toISOString()}-${j}`,
          name: `${weightType} ${exerciseName}`,
          bodyPart: bodyPart,
          type: exerciseType,
          sets: Math.floor(Math.random() * 3) + 2, // 2-4 sets
          reps: `${Math.floor(Math.random() * 6) + 8}-${Math.floor(Math.random() * 6) + 10}`, // 8-15 reps
          weight: Math.floor(Math.random() * 75) + 10, // 10-85 lbs
          completed: true
        });
      }
      
      // Add this day's entry
      data.push({
        date: entryDate,
        exercises: dailyExercises,
        totalExercises: dailyExercises.length,
        duration: Math.floor(Math.random() * 60) + 30, // 30-90 minutes
      });
    }
    
    return data;
  };
  
  // Filter history data based on selected filter
  const filterHistoryData = (data) => {
    const today = new Date();
    let filteredData;
    
    switch (selectedFilter) {
      case 'week':
        // Last 7 days
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        filteredData = data.filter(item => item.date >= weekAgo);
        break;
      
      case 'month':
        // Last 30 days
        const monthAgo = new Date(today);
        monthAgo.setDate(today.getDate() - 30);
        filteredData = data.filter(item => item.date >= monthAgo);
        break;
        
      case 'custom':
        // Custom date range
        filteredData = data.filter(item => 
          item.date >= new Date(startDate.setHours(0, 0, 0, 0)) && 
          item.date <= new Date(endDate.setHours(23, 59, 59, 999))
        );
        break;
        
      default:
        filteredData = data;
    }
    
    setHistoryData(filteredData);
  };
  
  // Handle date picker
  const onDateChange = (event, selectedDate) => {
    if (event.type === 'dismissed') {
      setIsDatePickerVisible(false);
      return;
    }
    
    if (datePickerMode === 'start') {
      setStartDate(selectedDate);
    } else {
      setEndDate(selectedDate);
    }
    
    setIsDatePickerVisible(false);
  };
  
  // Show date picker
  const showDatePickerModal = (mode) => {
    setDatePickerMode(mode);
    setIsDatePickerVisible(true);
  };
  
  // Format date to readable string
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  // Render exercise history item
  const renderHistoryItem = ({ item }) => {
    return (
      <View style={styles.historyCard}>
        <View style={styles.dateHeader}>
          <Text style={styles.dateText}>{formatDate(item.date)}</Text>
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{item.duration} min</Text>
          </View>
        </View>
        
        {item.exercises.map((exercise, index) => (
          <View key={exercise.id} style={styles.exerciseItem}>
            <View style={styles.exerciseDetails}>
              <Text style={styles.exerciseName}>{exercise.name}</Text>
              <Text style={styles.exerciseBodyPart}>{exercise.bodyPart}</Text>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Sets</Text>
                  <Text style={styles.statValue}>{exercise.sets}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Reps</Text>
                  <Text style={styles.statValue}>{exercise.reps}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Weight</Text>
                  <Text style={styles.statValue}>{exercise.weight} lbs</Text>
                </View>
              </View>
            </View>
            {exercise.type === 'Free Weight' ? (
              <View style={[styles.typeBadge, styles.freeWeightBadge]}>
                <Text style={styles.typeBadgeText}>Free Weight</Text>
              </View>
            ) : (
              <View style={[styles.typeBadge, styles.machineBadge]}>
                <Text style={styles.typeBadgeText}>Machine</Text>
              </View>
            )}
          </View>
        ))}
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
          <Text style={styles.headerTitle}>Workout History</Text>
          <View style={styles.iconPlaceholder} />
        </View>
      </View>
      
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScrollView}>
          <TouchableOpacity 
            style={[styles.filterButton, selectedFilter === 'week' && styles.activeFilterButton]}
            onPress={() => setSelectedFilter('week')}
          >
            <Text style={[styles.filterButtonText, selectedFilter === 'week' && styles.activeFilterText]}>Last Week</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.filterButton, selectedFilter === 'month' && styles.activeFilterButton]}
            onPress={() => setSelectedFilter('month')}
          >
            <Text style={[styles.filterButtonText, selectedFilter === 'month' && styles.activeFilterText]}>Last Month</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.filterButton, selectedFilter === 'custom' && styles.activeFilterButton]}
            onPress={() => setSelectedFilter('custom')}
          >
            <Text style={[styles.filterButtonText, selectedFilter === 'custom' && styles.activeFilterText]}>Custom Range</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
      
      {selectedFilter === 'custom' && (
        <View style={styles.dateRangeContainer}>
          <TouchableOpacity 
            style={styles.dateButton} 
            onPress={() => showDatePickerModal('start')}
          >
            <Text style={styles.dateButtonLabel}>Start Date:</Text>
            <Text style={styles.dateButtonText}>{formatDate(startDate)}</Text>
          </TouchableOpacity>
          
          <Text style={styles.dateRangeSeparator}>to</Text>
          
          <TouchableOpacity 
            style={styles.dateButton} 
            onPress={() => showDatePickerModal('end')}
          >
            <Text style={styles.dateButtonLabel}>End Date:</Text>
            <Text style={styles.dateButtonText}>{formatDate(endDate)}</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Date Picker Modal */}
      {isDatePickerVisible && (
        <DateTimePicker
          value={datePickerMode === 'start' ? startDate : endDate}
          mode="date"
          display="default"
          onChange={onDateChange}
          maximumDate={new Date()}
        />
      )}
      
      {historyData.length > 0 ? (
        <FlatList
          data={historyData}
          renderItem={renderHistoryItem}
          keyExtractor={(item) => item.date.toISOString()}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Image
            source={require('../../assets/images/placeholder.png')}
            style={styles.emptyImage}
          />
          <Text style={styles.emptyTitle}>No Workout History</Text>
          <Text style={styles.emptyMessage}>
            You haven't completed any workouts in this time period. Start working out to build your history!
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
    paddingTop: Platform.OS === 'android' ? 20 : 0,
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
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginTop: Constants.statusBarHeight,

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
    borderBottomColor: '#ebebeb',
  },
  filterScrollView: {
    paddingHorizontal: 10,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  activeFilterButton: {
    backgroundColor: '#4285F4',
    borderColor: '#4285F4',
  },
  filterButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  activeFilterText: {
    color: 'white',
  },
  dateRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#ebebeb',
  },
  dateButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  dateButtonLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  dateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  dateRangeSeparator: {
    marginHorizontal: 10,
    color: '#666',
  },
  listContent: {
    padding: 15,
    paddingBottom: 30,
  },
  historyCard: {
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
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 10,
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  durationBadge: {
    backgroundColor: '#e0f2fe',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  durationText: {
    fontSize: 12,
    color: '#0369a1',
    fontWeight: '600',
  },
  exerciseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  exerciseDetails: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  exerciseBodyPart: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    marginRight: 20,
  },
  statLabel: {
    fontSize: 11,
    color: '#888',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginLeft: 10,
  },
  freeWeightBadge: {
    backgroundColor: 'rgba(66, 133, 244, 0.15)',
  },
  machineBadge: {
    backgroundColor: 'rgba(52, 168, 83, 0.15)',
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyImage: {
    width: 120,
    height: 120,
    marginBottom: 20,
    opacity: 0.6,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ExerciseHistoryScreen;