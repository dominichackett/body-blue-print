import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  ActivityIndicator
} from 'react-native';
import { useNavigation, useLocalSearchParams } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ViewMealPlanScreen = () => {
  const navigation = useNavigation();
  const { planId } = useLocalSearchParams();
  
  const [mealPlan, setMealPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(0);
  
  // Load the specific meal plan
  useEffect(() => {
    loadMealPlan();
  }, [planId]);
  
  const loadMealPlan = async () => {
    try {
      setIsLoading(true);
      const savedPlansJson = await AsyncStorage.getItem('savedMealPlans');
      
      if (savedPlansJson !== null) {
        const savedPlans = JSON.parse(savedPlansJson);
        const foundPlan = savedPlans.find(plan => plan.id === planId);
        
        if (foundPlan) {
          console.log("Found plan:", foundPlan);
          setMealPlan(foundPlan);
        } else {
          // Plan not found (may have been deleted)
          navigation.goBack();
        }
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading meal plan:', error);
      setIsLoading(false);
    }
  };
  
  // Render daily summary component
  const renderDailySummary = (day) => {
    if (!day || !day.meals) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Unable to display meal information</Text>
        </View>
      );
    }
    
    // Calculate total calories for the day
    const totalCalories = day.meals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
    
    // Calculate total macros
    const totalProtein = day.meals.reduce((sum, meal) => sum + (meal.protein || 0), 0);
    const totalCarbs = day.meals.reduce((sum, meal) => sum + (meal.carbs || 0), 0);
    const totalFat = day.meals.reduce((sum, meal) => sum + (meal.fat || 0), 0);
    
    return (
      <View>
        <View style={styles.totalCaloriesSection}>
          <FontAwesome name="fire" size={18} color="#0066cc" style={styles.calorieIcon} />
          <Text style={styles.totalCaloriesText}>
            Total: {totalCalories} calories
          </Text>
        </View>
        
        <View style={styles.dailySummary}>
          <View style={styles.nutrientItem}>
            <Text style={styles.nutrientValue}>{Math.round(totalProtein)}g</Text>
            <Text style={styles.nutrientLabel}>Protein</Text>
          </View>
          <View style={styles.nutrientItem}>
            <Text style={styles.nutrientValue}>{Math.round(totalCarbs)}g</Text>
            <Text style={styles.nutrientLabel}>Carbs</Text>
          </View>
          <View style={styles.nutrientItem}>
            <Text style={styles.nutrientValue}>{Math.round(totalFat)}g</Text>
            <Text style={styles.nutrientLabel}>Fat</Text>
          </View>
          <View style={styles.nutrientItem}>
            <Text style={styles.nutrientValue}>{Math.round(totalProtein * 4 + totalCarbs * 4 + totalFat * 9)}</Text>
            <Text style={styles.nutrientLabel}>Total Cal</Text>
          </View>
        </View>
      </View>
    );
  };
  
  // Format date to readable string
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4285F4" />
          <Text style={styles.loadingText}>Loading meal plan...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  if (!mealPlan) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.errorContainer}>
          <FontAwesome name="exclamation-circle" size={60} color="#EA4335" />
          <Text style={styles.errorText}>Meal plan not found</Text>
          <TouchableOpacity 
            style={styles.goBackButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.goBackButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  // Extract the actual meal plan data from the stored object
  const planData = mealPlan.plan;
  const isWeekly = mealPlan.type === 'weekly';
  
  // Determine the current day/plan to display
  let currentDayData;
  
  if (isWeekly && planData && planData.current && planData.current.days && planData.current.days.length > 0) {
    // For weekly plans, select the current day
    currentDayData = planData.current.days[selectedDay];
  } else if (!isWeekly && planData) {
    // For daily plans, use the entire plan
    currentDayData = planData;
  } else {
    // Handle malformed data
    currentDayData = null;
  }
  
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
          <Text style={styles.headerTitle}>View Meal Plan</Text>
          <View style={styles.iconPlaceholder} />
        </View>
      </View>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.mealPlanContainer}>
          <Text style={styles.mealPlanTitle}>{mealPlan.planName}</Text>
          <Text style={styles.mealPlanSubtitle}>
            {(planData.current?.dietType || mealPlan.dietType).charAt(0).toUpperCase() + (planData.current?.dietType || mealPlan.dietType).slice(1)} Diet • Created on {formatDate(mealPlan.dateCreated)}
          </Text>
          
          {isWeekly && planData && planData.current && planData.current.days && (
            <View>
              <Text style={styles.sectionTitle}>Weekly Overview</Text>
              <View style={styles.nutritionSummary}>
                <View style={styles.nutrientItem}>
                  <Text style={styles.nutrientValue}>{planData.current.dailyProteinTarget || mealPlan.averageNutrition?.protein || 0}g</Text>
                  <Text style={styles.nutrientLabel}>Protein Target</Text>
                </View>
                <View style={styles.nutrientItem}>
                  <Text style={styles.nutrientValue}>{planData.current.dailyCarbsTarget || mealPlan.averageNutrition?.carbs || 0}g</Text>
                  <Text style={styles.nutrientLabel}>Carbs Target</Text>
                </View>
                <View style={styles.nutrientItem}>
                  <Text style={styles.nutrientValue}>{planData.current.dailyFatTarget || mealPlan.averageNutrition?.fat || 0}g</Text>
                  <Text style={styles.nutrientLabel}>Fat Target</Text>
                </View>
                <View style={styles.nutrientItem}>
                  <Text style={styles.nutrientValue}>{planData.current.dailyCaloriesTarget || Math.round(mealPlan.averageNutrition?.calories || 0)}</Text>
                  <Text style={styles.nutrientLabel}>Daily Cal Target</Text>
                </View>
              </View>
              
              {/* Day selection tabs */}
              <Text style={styles.sectionTitle}>Select Day</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.dayTabs}
              >
                {planData.current.days.map((day, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dayTab,
                      selectedDay === index ? styles.selectedDayTab : null
                    ]}
                    onPress={() => setSelectedDay(index)}
                  >
                    <Text 
                      style={[
                        styles.dayTabText,
                        selectedDay === index ? styles.selectedDayTabText : null
                      ]}
                    >
                      {day.day || `Day ${index + 1}`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
          
          {/* Render daily summary */}
          {currentDayData && renderDailySummary(currentDayData)}
          
          {/* Render meals */}
          {currentDayData && currentDayData.meals && (
            <>
              <Text style={styles.sectionTitle}>Daily Meals</Text>
              {currentDayData.meals.map((meal, index) => (
                <View key={index} style={styles.mealCard}>
                  <View style={styles.mealHeader}>
                    <Text style={styles.mealName}>{meal.name}</Text>
                    <View style={styles.caloriesBadge}>
                      <Text style={styles.caloriesText}>{meal.calories} cal</Text>
                    </View>
                  </View>
                  
                  <View style={styles.macroRow}>
                    <Text style={styles.macroText}>Protein: {meal.protein}g</Text>
                    <Text style={styles.macroText}>Carbs: {meal.carbs}g</Text>
                    <Text style={styles.macroText}>Fat: {meal.fat}g</Text>
                  </View>
                  
                  {/* Render individual meal items with their calorie counts */}
                  {meal.items && (
                    <View style={styles.mealItemsContainer}>
                      {meal.items.map((item, itemIndex) => (
                        <View key={itemIndex} style={styles.mealItem}>
                          <View style={styles.mealItemHeader}>
                            <Text style={styles.mealItemName}>{item.name}</Text>
                            <Text style={styles.mealItemCalories}>{item.calories} cal</Text>
                          </View>
                          <Text style={styles.mealItemPreparation}>{item.preparation}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </>
          )}
          
          {(!currentDayData || !currentDayData.meals) && (
            <View style={styles.errorContainer}>
              <FontAwesome name="exclamation-triangle" size={40} color="#EA4335" />
              <Text style={styles.errorText}>
                Unable to display meal data. The plan structure may be invalid.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  loadingContainer: {
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
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(234, 67, 53, 0.1)',
    borderRadius: 10,
    marginVertical: 15,
  },
  errorText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
    marginBottom: 10,
    textAlign: 'center',
  },
  goBackButton: {
    backgroundColor: '#4285F4',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  goBackButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },
  mealPlanContainer: {
    margin: 15,
  },
  mealPlanTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
    textAlign: 'center',
  },
  mealPlanSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 10,
  },
  nutritionSummary: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  dayTabs: {
    marginBottom: 15,
  },
  dayTab: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedDayTab: {
    backgroundColor: '#4285F4',
    borderColor: '#4285F4',
  },
  dayTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  selectedDayTabText: {
    color: 'white',
  },
  totalCaloriesSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
    marginBottom: 15,
    backgroundColor: '#f0f8ff',
    padding: 8,
    borderRadius: 20,
    alignSelf: 'center',
  },
  calorieIcon: {
    marginRight: 8,
  },
  totalCaloriesText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0066cc',
  },
  dailySummary: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  nutrientItem: {
    alignItems: 'center',
  },
  nutrientValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4285F4',
  },
  nutrientLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  mealCard: {
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
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  mealName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  caloriesBadge: {
    backgroundColor: '#e0f2fe',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  caloriesText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0369a1',
  },
  macroRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  macroText: {
    fontSize: 14,
    color: '#666',
    marginRight: 15,
    marginBottom: 5,
  },
  mealItemsContainer: {
    marginTop: 10,
  },
  mealItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#4285F4',
  },
  mealItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  mealItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  mealItemCalories: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4285F4',
    marginLeft: 8,
  },
  mealItemPreparation: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
  },
});

export default ViewMealPlanScreen;