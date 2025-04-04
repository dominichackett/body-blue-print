import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Modal,
  Linking
} from 'react-native';
import { useNavigation } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import YoutubePlayer from 'react-native-youtube-iframe';
import { YOUTUBE_API_KEY } from '@env'; // Make sure to add this to your .env file

const SavedWorkoutsScreen = () => {
  const navigation = useNavigation();
  const [savedWorkouts, setSavedWorkouts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', 'week', 'month'
  const [showDateFilterModal, setShowDateFilterModal] = useState(false);
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [currentVideoId, setCurrentVideoId] = useState('');
  const [currentVideoTitle, setCurrentVideoTitle] = useState('');
  const [playing, setPlaying] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [unavailableVideoIds, setUnavailableVideoIds] = useState(new Set());
  const [checkedVideoIds, setCheckedVideoIds] = useState(new Set());

  // Video player state handler
  const onStateChange = useCallback((state) => {
    if (state === "ended") {
      setPlaying(false);
    }
  }, []);

  // Load saved workouts when component mounts
  useEffect(() => {
    loadSavedWorkouts();
    loadUnavailableVideoIds();
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

  // Load unavailable video IDs from AsyncStorage
  const loadUnavailableVideoIds = async () => {
    try {
      const unavailableIds = await AsyncStorage.getItem('unavailableVideoIds');
      if (unavailableIds) {
        setUnavailableVideoIds(new Set(JSON.parse(unavailableIds)));
      }
      
      const checkedIds = await AsyncStorage.getItem('checkedVideoIds');
      if (checkedIds) {
        setCheckedVideoIds(new Set(JSON.parse(checkedIds)));
      }
    } catch (error) {
      console.error('Error loading unavailable video IDs:', error);
    }
  };

  // Save unavailable video IDs to AsyncStorage
  const saveUnavailableVideoIds = async (idSet) => {
    try {
      await AsyncStorage.setItem('unavailableVideoIds', JSON.stringify([...idSet]));
    } catch (error) {
      console.error('Error saving unavailable video IDs:', error);
    }
  };

  // Save checked video IDs to AsyncStorage
  const saveCheckedVideoIds = async (idSet) => {
    try {
      await AsyncStorage.setItem('checkedVideoIds', JSON.stringify([...idSet]));
    } catch (error) {
      console.error('Error saving checked video IDs:', error);
    }
  };
  // Check if a YouTube video is available
  const checkYouTubeVideoAvailability = async (videoId) => {
    // If we've already verified this ID is unavailable, don't check again
    if (unavailableVideoIds.has(videoId)) {
      return false;
    }
    
    // If we've already checked this ID and it was available, don't check again
    if (checkedVideoIds.has(videoId)) {
      return true;
    }
    
    try {
      if (!YOUTUBE_API_KEY) {
        console.warn('YouTube API key is not set. Skipping video availability check.');
        return true; // Assume video is available if no API key
      }
      
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=status&id=${videoId}&key=${YOUTUBE_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status}`);
      }
      
      const data = await response.json();
      const isAvailable = data.items && data.items.length > 0;
      
      // Update our cached lists
      if (!isAvailable) {
        const newUnavailableIds = new Set(unavailableVideoIds);
        newUnavailableIds.add(videoId);
        setUnavailableVideoIds(newUnavailableIds);
        saveUnavailableVideoIds(newUnavailableIds);
      } else {
        const newCheckedIds = new Set(checkedVideoIds);
        newCheckedIds.add(videoId);
        setCheckedVideoIds(newCheckedIds);
        saveCheckedVideoIds(newCheckedIds);
      }
      
      return isAvailable;
    } catch (error) {
      console.error(`Error checking YouTube video ${videoId}:`, error);
      return true; // If we can't check, assume it's available
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

  // Open video in modal with availability check
  const openVideoModal = async (videoId, videoTitle) => {
    if (!videoId) {
      Alert.alert("No Video Available", "This exercise doesn't have a video tutorial.");
      return;
    }
    
    // Show loading indicator
    setVideoError(false);
    setCurrentVideoId('');
    setCurrentVideoTitle('Loading video...');
    setVideoModalVisible(true);
    
    // Check if video is available first (for a better user experience)
    const isAvailable = await checkYouTubeVideoAvailability(videoId);
    
    if (isAvailable) {
      setCurrentVideoId(videoId);
      setCurrentVideoTitle(videoTitle || 'Exercise Tutorial');
      setPlaying(true);
    } else {
      setVideoError(true);
      setCurrentVideoTitle('Video Unavailable');
      Alert.alert(
        "Video Unavailable", 
        "This video is no longer available on YouTube.",
        [{ text: "OK", onPress: () => setVideoModalVisible(false) }]
      );
    }
  };

  // Handle video player errors
  const handleVideoError = (e) => {
    console.log('Video error:', e);
    setVideoError(true);
    
    // Add to unavailable videos list
    if (currentVideoId) {
      const newUnavailableIds = new Set(unavailableVideoIds);
      newUnavailableIds.add(currentVideoId);
      setUnavailableVideoIds(newUnavailableIds);
      saveUnavailableVideoIds(newUnavailableIds);
    }
    
    Alert.alert(
      "Video Playback Error", 
      "This video cannot be played. It may be unavailable or restricted.",
      [{ text: "OK", onPress: () => setVideoModalVisible(false) }]
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
  
  // Render YouTube video modal
  const renderVideoModal = () => {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={videoModalVisible}
        onRequestClose={() => {
          setVideoModalVisible(false);
          setPlaying(false);
        }}
      >
        <View style={styles.videoModalOverlay}>
          <View style={styles.videoModalContent}>
            <View style={styles.videoModalHeader}>
              <Text style={styles.videoModalTitle}>{currentVideoTitle}</Text>
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
              {videoError ? (
                <View style={styles.videoErrorContainer}>
                  <FontAwesome name="exclamation-circle" size={40} color="#EA4335" />
                  <Text style={styles.videoErrorText}>Video is unavailable</Text>
                </View>
              ) : currentVideoId ? (
                <YoutubePlayer
                  height={220}
                  play={playing}
                  videoId={currentVideoId}
                  onChangeState={onStateChange}
                  onError={handleVideoError}
                />
              ) : (
                <View style={styles.videoLoadingContainer}>
                  <ActivityIndicator size="large" color="#FF0000" />
                  <Text style={styles.videoLoadingText}>Loading video...</Text>
                </View>
              )}
            </View>
            
            {currentVideoId && !videoError && (
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
            )}
          </View>
        </View>
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

  // Render a workout item with video availability check
  const renderWorkoutItem = ({ item }) => {
    // Check if video ID exists and is not in the unavailable list
    const hasVideoId = item.youtubeVideoId && item.youtubeVideoId.trim().length > 0;
    const videoIsUnavailable = unavailableVideoIds.has(item.youtubeVideoId);
    const hasValidVideo = hasVideoId && !videoIsUnavailable;
    
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
        
        <TouchableOpacity 
          style={styles.exerciseImageContainer}
          onPress={() => hasValidVideo ? openVideoModal(item.youtubeVideoId, item.name) : null}
          activeOpacity={hasValidVideo ? 0.7 : 1}
        >
          <Image 
            source={item.image} 
            style={styles.exerciseImage}
            resizeMode="contain"
          />
          {/* Only show play button if there's a valid video */}
          {hasValidVideo && (
            <View style={styles.playButtonOverlay}>
              <FontAwesome name="play-circle" size={50} color="rgba(255, 255, 255, 0.9)" />
            </View>
          )}
        </TouchableOpacity>
        
        <Text style={styles.exerciseDescription}>{item.description}</Text>
        
        {item.benefits && (
          <Text style={styles.exerciseBenefits}>
            <Text style={{fontWeight: 'bold'}}>Benefits: </Text>
            {item.benefits}
          </Text>
        )}
        
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
        
        <View style={styles.actionButtons}>
          {/* Only show watch button if there's a valid video */}
          {hasValidVideo ? (
            <>
              <TouchableOpacity 
                style={styles.watchButton}
                onPress={() => openVideoModal(item.youtubeVideoId, item.name)}
              >
                <FontAwesome name="youtube-play" size={16} color="white" />
                <Text style={styles.watchButtonText}>Watch Tutorial</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.removeButton, styles.removeButtonWithVideo]}
                onPress={() => deleteWorkout(item.id)}
              >
                <FontAwesome name="trash" size={16} color="white" />
                <Text style={styles.removeButtonText}>Remove</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity 
              style={[styles.removeButton, styles.removeButtonFull]}
              onPress={() => deleteWorkout(item.id)}
            >
              <FontAwesome name="trash" size={16} color="white" />
              <Text style={styles.removeButtonText}>Remove from Workout</Text>
            </TouchableOpacity>
          )}
        </View>
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
           <View style={styles.buttonWithBadge}>
                      <FontAwesome name="list-alt" size={20} color="#333" />
                      {savedWorkouts.length > 0 && (
                        <View style={styles.badgeContainer}>
                          <Text style={styles.badgeText}>{getFilteredWorkouts().length}</Text>
                        </View>
                      )}
                    </View>
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
      {renderVideoModal()}
      
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
    position: 'relative',
  },
  exerciseImage: {
    width: '100%',
    height: '100%',
  },
  playButtonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
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
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  watchButton: {
    backgroundColor: '#FF0000',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginRight: 8,
  },
  watchButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 8,
  },
  removeButton: {
    backgroundColor: '#EA4335',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonWithVideo: {
    flex: 1,
  },
  removeButtonFull: {
    flex: 1,
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
  // YouTube Modal Styles
  videoModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  videoModalContent: {
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
  videoModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  videoModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
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
    backgroundColor: '#f0f0f0',
  },
  videoErrorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 20,
  },
  videoErrorText: {
    fontSize: 16,
    color: '#EA4335',
    marginTop: 10,
    textAlign: 'center',
  },
  videoLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  videoLoadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
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
  }
});

export default SavedWorkoutsScreen;