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
  ActivityIndicator
} from 'react-native';
import { router ,useNavigation} from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SavedMealPlansScreen = () => {
  
  const [savedPlans, setSavedPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigation = useNavigation()
  // Load saved meal plans when component mounts
  useEffect(() => {
    loadSavedMealPlans();
  }, []);

  // Load saved meal plans from AsyncStorage
  const loadSavedMealPlans = async () => {
    try {
      setIsLoading(true);
      const savedPlansJson = await AsyncStorage.getItem('savedMealPlans');
      if (savedPlansJson !== null) {
        const plans = JSON.parse(savedPlansJson);
        console.log(savedPlansJson)
        // Sort by date created (newest first)
        plans.sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));
        setSavedPlans(plans);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading saved meal plans:', error);
      setIsLoading(false);
    }
  };

  // Delete a meal plan
  const deleteMealPlan = async (planId) => {
    Alert.alert(
      "Delete Meal Plan",
      "Are you sure you want to delete this meal plan?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              const updatedPlans = savedPlans.filter(plan => plan.id !== planId);
              await AsyncStorage.setItem('savedMealPlans', JSON.stringify(updatedPlans));
              setSavedPlans(updatedPlans);
            } catch (error) {
              console.error('Error deleting meal plan:', error);
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

  // Render a saved meal plan item
  const renderPlanItem = ({ item }) => {
    return (
      <View style={styles.planCard}>
        <View style={styles.planHeader}>
          <View>
            <Text style={styles.planName}>{item.planName}</Text>
            <Text style={styles.planDate}>Created: {formatDate(item.dateCreated)}</Text>
          </View>
          <View style={styles.planTypeBadge}>
            <Text style={styles.planTypeText}>
              {item.type === 'weekly' ? 'Weekly Plan' : 'Daily Plan'}
            </Text>
          </View>
        </View>
        
        <View style={styles.planDetails}>
          <Text style={styles.detailText}>
            Diet: {item?.dietType?.charAt(0).toUpperCase() + item?.dietType?.slice(1)}
          </Text>
          <Text style={styles.detailText}>
            {item.type === 'weekly' 
              ? `${item?.count} days` 
              : `${item?.count} meals`}
          </Text>
          <Text style={styles.detailText}>
            {`Avg: ${item?.averageNutrition?.calories} calories ${item?.averageNutrition?.protein}g protein, ${item?.averageNutrition?.carbs}g carbs, ${item?.averageNutrition?.fat}g fat`}
          </Text>
        </View>
        
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => router.push({pathname:'/workout/viewmealplan', params:{ planId: item.id }})}
          >
            <FontAwesome name="eye" size={16} color="white" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>View</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => deleteMealPlan(item.id)}
          >
            <FontAwesome name="trash" size={16} color="white" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Delete</Text>
          </TouchableOpacity>
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
          <Text style={styles.headerTitle}>Saved Meal Plans</Text>
          <View style={styles.iconPlaceholder} />
        </View>
      </View>
      
      {isLoading ? (
        <View style={styles.centeredContent}>
          <ActivityIndicator size="large" color="#4285F4" />
          <Text style={styles.loadingText}>Loading saved plans...</Text>
        </View>
      ) : savedPlans.length === 0 ? (
        <View style={styles.centeredContent}>
          <FontAwesome name="folder-open" size={60} color="#ccc" />
          <Text style={styles.emptyText}>No saved meal plans</Text>
          <Text style={styles.emptySubtext}>Your saved meal plans will appear here</Text>
         
        </View>
      ) : (
        <FlatList
          data={savedPlans}
          renderItem={renderPlanItem}
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
    
    paddingTop: Platform.OS === 'android' ? 20: 0,
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
  listContent: {
    padding: 15,
    paddingBottom: 30,
  },
  planCard: {
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
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  planName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  planDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  planTypeBadge: {
    backgroundColor: '#e0f2fe',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  planTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0369a1',
  },
  planDetails: {
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  detailText: {
    fontSize: 13,
    color: '#555',
    marginBottom: 3,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  viewButton: {
    backgroundColor: '#4285F4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    flex: 1,
    marginRight: 5,
  },
  deleteButton: {
    backgroundColor: '#EA4335',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    flex: 1,
    marginLeft: 5,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  buttonIcon: {
    marginRight: 6,
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
  createButton: {
    backgroundColor: '#4285F4',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  createButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },
});

export default SavedMealPlansScreen;