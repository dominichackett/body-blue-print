import React, { useState, useEffect, useCallback ,useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  StatusBar,
  Switch,
  Image,
  Modal,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useRegistration } from '@/contexts/RegistrationContext';
import { lilypadInference } from '@/utils/lilypad';

const MealPlanGeneratorScreen = () => {
  // User preferences
  const [calories, setCalories] = useState(2000);
  const [dietaryPreference, setDietaryPreference] = useState('omnivore');
  const [excludedIngredients, setExcludedIngredients] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generationComplete, setGenerationComplete] = useState(false);
  const [includeSnacks, setIncludeSnacks] = useState(true);
  const [includeEveningSnack, setIncludeEveningSnack] = useState(true);
  const mealPlan = useRef(null);
  const weeklyMealPlan = useRef(null);
  const [selectedDay, setSelectedDay] = useState(0);
  const [daysPerWeek, setDaysPerWeek] = useState(5);
  const [showTips, setShowTips] = useState(false);
  const [currentTip, setCurrentTip] = useState('');
  const [savedPlans, setSavedPlans] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);
  const { userData, macroResults } = useRegistration();
  const [aiThinking, setAiThinking] = useState(false);
   // Nutrition tips
    const nutritionTips = [
      "Try to eat your protein first at meals to help control hunger and blood sugar levels.",
      "Drink water before and during meals to help with portion control.",
      "Include a variety of colorful vegetables to ensure a wide range of nutrients.",
      "Prepare meals in advance to make it easier to stick to your nutrition plan.",
      "Eat slowly and mindfully to better recognize when you're full.",
      "Try to include protein, healthy fat, and fiber in each meal for better satiety.",
      "Limit added sugars and processed foods for better overall health.",
      "Consider timing your carbohydrate intake around your workouts for optimal performance."
    ];
  
    useEffect(() => {
      loadSavedMealPlans();
    }, []);
  
    const loadSavedMealPlans = async () => {
      try {
        const savedPlansJson = await AsyncStorage.getItem('savedMealPlans');
        if (savedPlansJson !== null) {
          setSavedPlans(JSON.parse(savedPlansJson));
        }
      } catch (error) {
        console.error('Error loading saved meal plans:', error);
      }
    };
  
    const showNutritionTips = () => {
      const tipIndex = Math.floor(Math.random() * nutritionTips.length);
      setCurrentTip(nutritionTips[tipIndex]);
      setShowTips(true);
    };
  
    const shareMenu = () => {
      Alert.alert(
        "Share Meal Plan",
        "This would share your meal plan via your preferred method (in a real app).",
        [{ text: "OK" }]
      );
    };
    const saveMealPlan = async () => {
      try {
        setIsSaving(true);
         // Determine which plan is active and its type
       const currentPlan = weeklyMealPlan.current || mealPlan.current;
      const planType = weeklyMealPlan.current ? 'weekly' : 'daily';
    
      // Calculate nutrition information
      const { nutritionTotals, nutritionAverages }  = calculateNutrition(currentPlan, planType);
        const planToSave = {
          id: Date.now().toString(),
          dateCreated: new Date().toISOString(),
          planName: `${dietaryPreference.charAt(0).toUpperCase() + dietaryPreference.slice(1)} Plan - ${new Date().toLocaleDateString()}`,
          overallNutrition: nutritionTotals,
          averageNutrition:nutritionAverages,
          dietType:dietaryPreference,
          plan: currentPlan,
          type: planType,
          count: planType === 'weekly' 
          ? (currentPlan.days ? currentPlan.days.length : 0)
          : (currentPlan.meals ? currentPlan.meals.length : 0)
        };
        
        const updatedSavedPlans = [...savedPlans, planToSave];
        await AsyncStorage.setItem('savedMealPlans', JSON.stringify(updatedSavedPlans));
        setSavedPlans(updatedSavedPlans);
        setIsSaving(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      } catch (error) {
        console.error('Error saving meal plan:', error);
        setIsSaving(false);
      }
    };
  
   

    
    const generateMealPlan = async () => {
      setIsLoading(true);
      setAiThinking(true);
      setError(null);
      setGenerationComplete(false);
      
      try {
        const duration = daysPerWeek > 1 ? 'weekly' : 'daily';
        
        // Prepare user context from registration context
        let userContext = "";
        if (userData) {
          const heightUnit = userData.unitSystem === 'metric' ? 'cm' : 'inches';
          const weightUnit = userData.unitSystem === 'metric' ? 'kg' : 'lbs';
          const gender = userData.gender === 'other' ? '' : `${userData.gender} `;
          
          userContext = `The user is a ${userData.age} year old ${gender}individual, 
                        ${userData.height} ${heightUnit} tall, weighing ${userData.weight} ${weightUnit}.`;
        }
    
        // Prepare macro context from registration context
        let macroContext = "";
        if (macroResults) {
          macroContext = `Their nutritional goals are:
                        - Calories: ${macroResults.calories}
                        - Protein: ${macroResults.protein}g
                        - Carbs: ${macroResults.carbs}g
                        - Fat: ${macroResults.fat}g`;
        }
    
        const prompt = `
        Generate a personalized ${duration} meal plan in detailed JSON format based on:
        
        User Profile:
        ${userContext || 'No specific user profile available'}
        
        Nutritional Goals:
        ${macroContext || `Default target of ${macroResults?.calories || calories} calories per day`}
        
        Preferences:
        - Diet type: ${dietaryPreference}
        - Plan duration: ${daysPerWeek} day${daysPerWeek > 1 ? 's' : ''} (${duration} plan)
        - Evening snack: ${includeEveningSnack ? 'yes' : 'no'}
        - Excluded ingredients: ${excludedIngredients || 'none'}
        
        Requirements:
        1. Use the provided nutritional goals as the exact daily targets.
        2. Include ${duration === 'daily' ? '3-5 meals' : `${daysPerWeek} days with 3-5 meals each`}${includeEveningSnack ? ', ensuring one meal per day is an "Evening Snack"' : ''}.
        3. Each meal must include:
           - name (e.g., "Breakfast", "Lunch", "Dinner", "Evening Snack")
           - description (brief text about the meal)
           - calories (numeric value)
           - protein (numeric value in grams)
           - carbs (numeric value in grams)
           - fat (numeric value in grams)
           - items (array of food items, each with:
             - name (string)
             - calories (numeric value)
             - preparation (detailed instructions))
        4. Ensure meals align with the ${dietaryPreference} diet preference.
        5. Avoid any excluded ingredients (${excludedIngredients || 'none'}).
        6. For weekly plans, include variety across days.
        7. Calculate and include daily totals for calories, protein, carbs, and fat${duration === 'weekly' ? ' for each day under "dailyTotals"' : ' within the "meals" array'}.
        8. Return only JSON, with no additional text or markers (e.g., no \`\`\`json).
        9. Ensure number of days are exactly ${daysPerWeek} even if weekly duration specified.
        Response format (return ONLY this JSON structure):
        {
          "${duration}Plan": {
            "dailyCaloriesTarget": ${macroResults?.calories || calories},
            "dailyProteinTarget": ${macroResults?.protein || 0},
            "dailyCarbsTarget": ${macroResults?.carbs || 0},
            "dailyFatTarget": ${macroResults?.fat || 0},
            "dietType": "${dietaryPreference}",
            ${duration === 'weekly' ? `"days": [
              {
                "day": "Monday",
                "meals": [
                  {
                    "name": "Breakfast",
                    "description": "Brief description",
                    "calories": number,
                    "protein": number,
                    "carbs": number,
                    "fat": number,
                    "items": [
                      {
                        "name": "Ingredient/Item name",
                        "calories": number,
                        "preparation": "Detailed instructions"
                      }
                    ]
                  }
                ],
                "dailyTotals": {
                  "calories": number,
                  "protein": number,
                  "carbs": number,
                  "fat": number
                }
              }
            ]` : `"meals": [
              {
                "name": "Breakfast",
                "description": "Brief description",
                "calories": number,
                "protein": number,
                "carbs": number,
                "fat": number,
                "items": [
                  {
                    "name": "Ingredient/Item name",
                    "calories": number,
                    "preparation": "Detailed instructions"
                  }
                ]
              }
            ]`}
          }
        }
        `.trim(); // Remove leading/trailing whitespace
    
        console.log("Processed ")
        const processedPlan = await lilypadInference(prompt)
        console.log(processedPlan)
        // Set the generated plan
        if (daysPerWeek > 1) {
          weeklyMealPlan.current = processedPlan.weeklyPlan;
        } else {
         mealPlan.current = processedPlan.dailyPlan;
        }
    
        setGenerationComplete(true);
        setError(null);
      } catch (error) {
        console.error('Meal plan generation failed:', error);
        setError(error.message || 'Failed to generate meal plan');
        mealPlan.current = null;
        weeklyMealPlan.current =null;
      } finally {
        setIsLoading(false);
        setAiThinking(false);
      }
    };

    const renderDailySummary = (day) => {
      // Use the pre-calculated dailyTotals if available, otherwise calculate
      let totalCalories, totalProtein, totalCarbs, totalFat;
      
      if (day.dailyTotals) {
        // Use pre-calculated totals from the JSON
        totalCalories = day.dailyTotals.calories;
        totalProtein = day.dailyTotals.protein;
        totalCarbs = day.dailyTotals.carbs;
        totalFat = day.dailyTotals.fat;
      } else {
        // Fall back to calculating totals if dailyTotals isn't available
        totalCalories = day.meals.reduce((sum, meal) => sum + meal.calories, 0);
        totalProtein = day.meals.reduce((sum, meal) => sum + meal.protein, 0);
        totalCarbs = day.meals.reduce((sum, meal) => sum + meal.carbs, 0);
        totalFat = day.meals.reduce((sum, meal) => sum + meal.fat, 0);
      }
    
      return (
        <View>
          <View style={styles.totalCaloriesSection}>
            <FontAwesome name="fire" size={18} color="#0066cc" style={styles.calorieIcon} />
            <Text style={styles.totalCaloriesText}>
              Total: {Math.round(totalCalories)} calories
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
          </View>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={showNutritionTips}
            >
              <FontAwesome name="lightbulb-o" size={16} color="#4285F4" />
              <Text style={styles.actionButtonText}>Nutrition Tips</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={saveMealPlan}
              disabled={isSaving}
            >
              <FontAwesome name="save" size={16} color="#4285F4" />
              <Text style={styles.actionButtonText}>
                {isSaving ? 'Saving...' : 'Save Plan'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={shareMenu}
            >
              <FontAwesome name="share-alt" size={16} color="#4285F4" />
              <Text style={styles.actionButtonText}>Share</Text>
            </TouchableOpacity>
          </View>
          
          {saveSuccess && (
            <View style={styles.saveSuccessMessage}>
              <FontAwesome name="check-circle" size={16} color="white" />
              <Text style={styles.saveSuccessText}>Meal plan saved!</Text>
            </View>
          )}
        </View>
      );
    };
    
    const renderSingleDayMealPlan = () => {
      if (!mealPlan.current) return null;
      
      return (
        <View style={styles.mealPlanContainer}>
          <Text style={styles.mealPlanTitle}>Your Personalized Meal Plan</Text>
          <Text style={styles.mealPlanSubtitle}>
            {mealPlan.current.dietType.charAt(0).toUpperCase() + mealPlan.current.dietType.slice(1)} Diet • {mealPlan.currrent?.dailyCaloriesTarget} calories
          </Text>
          
          {renderDailySummary(mealPlan.current)}
          
          {mealPlan.current.meals.map((meal, index) => (
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
           
          <TouchableOpacity 
            style={styles.resetButton}
            onPress={() => {
              setGenerationComplete(false);
              mealPlan.current = null
              weeklyMealPlan.current =null;
            }}
          >
            <Text style={styles.resetButtonText}>Generate New Plan</Text>
          </TouchableOpacity>
        </View>
      );
    };
    
    const renderWeeklyMealPlan = () => {
      if (!weeklyMealPlan.current) return null;
      
      return (
        <View style={styles.mealPlanContainer}>
          <Text style={styles.mealPlanTitle}>Your Weekly Meal Plan</Text>
          <Text style={styles.mealPlanSubtitle}>
            {weeklyMealPlan.current.dietType.charAt(0).toUpperCase() + weeklyMealPlan.current.dietType.slice(1)} Diet • {weeklyMealPlan.current.dailyCaloriesTarget} calories/day
          </Text>
          
          <View style={styles.nutritionSummary}>
            <View style={styles.nutrientItem}>
              <Text style={styles.nutrientValue}>{weeklyMealPlan.current.dailyProteinTarget || '--'}g</Text>
              <Text style={styles.nutrientLabel}>Target Protein</Text>
            </View>
            <View style={styles.nutrientItem}>
              <Text style={styles.nutrientValue}>{weeklyMealPlan.current.dailyCarbsTarget || '--'}g</Text>
              <Text style={styles.nutrientLabel}>Target Carbs</Text>
            </View>
            <View style={styles.nutrientItem}>
              <Text style={styles.nutrientValue}>{weeklyMealPlan.current.dailyFatTarget || '--'}g</Text>
              <Text style={styles.nutrientLabel}>Target Fat</Text>
            </View>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.dayTabs}
          >
            {weeklyMealPlan.current.days.map((day, index) => (
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
          
          {weeklyMealPlan.current.days[selectedDay] && renderDailySummary(weeklyMealPlan.current.days[selectedDay])}
          
          {weeklyMealPlan.current.days[selectedDay]?.meals.map((meal, index) => (
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
          
          <TouchableOpacity 
            style={styles.resetButton}
            onPress={() => {
              setGenerationComplete(false);
              mealPlan.current = null
              weeklyMealPlan.current =null;
            }}
          >
            <Text style={styles.resetButtonText}>Generate New Plan</Text>
          </TouchableOpacity>
        </View>
      );
    };
    
    const renderMealPlan = () => {
      if (weeklyMealPlan.current) {
        console.log("Generatate Weekly Meal Plan") 
        return renderWeeklyMealPlan();

      } else if (mealPlan.current) {
        console.log("Generate Single Meal Plan")
        return renderSingleDayMealPlan();
      }
      else{
        setError("Failed to Generate Meal Plan.")
        console.log("No meal plan")
      }
      
     
    };





/**
 * Calculates both total and average nutrition values for meal plans
 * @param {Object} mealPlan - The meal plan object (either daily or weekly)
 * @param {string} planType - Either 'daily' or 'weekly'
 * @returns {Object} Object containing both total and average nutrition values
 */
const calculateNutrition = (mealPlan, planType) => {
  // Initialize nutrition objects
  const nutritionTotals = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  };
  
  const nutritionAverages = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  };

  if (!mealPlan) {
    return { nutritionTotals, nutritionAverages };
  }

  if (planType === 'daily') {
    // For daily plans
    if (mealPlan.meals && Array.isArray(mealPlan.meals) && mealPlan.meals.length > 0) {
      const mealCount = mealPlan.meals.length;
      
      // Calculate totals
      mealPlan.meals.forEach(meal => {
        nutritionTotals.calories += meal.calories || 0;
        nutritionTotals.protein += meal.protein || 0;
        nutritionTotals.carbs += meal.carbs || 0;
        nutritionTotals.fat += meal.fat || 0;
      });
      
      // Calculate averages per meal
      nutritionAverages.calories = Math.round(nutritionTotals.calories / mealCount);
      nutritionAverages.protein = Math.round(nutritionTotals.protein / mealCount);
      nutritionAverages.carbs = Math.round(nutritionTotals.carbs / mealCount);
      nutritionAverages.fat = Math.round(nutritionTotals.fat / mealCount);
    }
  } else if (planType === 'weekly') {
    // For weekly plans
    if (mealPlan.days && Array.isArray(mealPlan.days) && mealPlan.days.length > 0) {
      const totalDays = mealPlan.days.length;
      
      // Calculate totals from all days
      mealPlan.days.forEach(day => {
        if (day.dailyTotals) {
          // If dailyTotals is available, use it
          nutritionTotals.calories += day.dailyTotals.calories || 0;
          nutritionTotals.protein += day.dailyTotals.protein || 0;
          nutritionTotals.carbs += day.dailyTotals.carbs || 0;
          nutritionTotals.fat += day.dailyTotals.fat || 0;
        } else {
          // If dailyTotals is not available, calculate from meals
          (day.meals || []).forEach(meal => {
            nutritionTotals.calories += meal.calories || 0;
            nutritionTotals.protein += meal.protein || 0;
            nutritionTotals.carbs += meal.carbs || 0;
            nutritionTotals.fat += meal.fat || 0;
          });
        }
      });
      
      // Calculate daily averages
      nutritionAverages.calories = Math.round(nutritionTotals.calories / totalDays);
      nutritionAverages.protein = Math.round(nutritionTotals.protein / totalDays);
      nutritionAverages.carbs = Math.round(nutritionTotals.carbs / totalDays);
      nutritionAverages.fat = Math.round(nutritionTotals.fat / totalDays);
    }
  }

  // Round all total values
  nutritionTotals.calories = Math.round(nutritionTotals.calories);
  nutritionTotals.protein = Math.round(nutritionTotals.protein);
  nutritionTotals.carbs = Math.round(nutritionTotals.carbs);
  nutritionTotals.fat = Math.round(nutritionTotals.fat);

  return {
    nutritionTotals,
    nutritionAverages
  };
};
    
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {(!generationComplete  || (!mealPlan.current && !weeklyMealPlan.current)) &&
            <View style={styles.formContainer}>
              <Text style={styles.formTitle}>Your Meal Preferences</Text>
              
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Daily Calories</Text>
                <Text style={styles.calorieValue}>{macroResults?.calories} calories</Text>
               
              </View>
              
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Days in Meal Plan</Text>
                <Text style={styles.calorieValue}>{daysPerWeek} days</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={1}
                  maximumValue={7}
                  step={1}
                  value={daysPerWeek}
                  onValueChange={setDaysPerWeek}
                  minimumTrackTintColor="#4285F4"
                  maximumTrackTintColor="#e0e0e0"
                  thumbTintColor="#4285F4"
                />
                <View style={styles.sliderLabels}>
                  <Text style={styles.sliderLabel}>1 day</Text>
                  <Text style={styles.sliderLabel}>7 days</Text>
                </View>
              </View>
              
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Dietary Preference</Text>
                <View style={styles.dietOptions}>
                  <TouchableOpacity
                    style={[styles.dietOption, dietaryPreference === 'omnivore' && styles.activeDietOption]}
                    onPress={() => setDietaryPreference('omnivore')}
                  >
                    <Text style={[styles.dietOptionText, dietaryPreference === 'omnivore' && styles.activeDietOptionText]}>Omnivore</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.dietOption, dietaryPreference === 'vegetarian' && styles.activeDietOption]}
                    onPress={() => setDietaryPreference('vegetarian')}
                  >
                    <Text style={[styles.dietOptionText, dietaryPreference === 'vegetarian' && styles.activeDietOptionText]}>Vegetarian</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.dietOption, dietaryPreference === 'vegan' && styles.activeDietOption]}
                    onPress={() => setDietaryPreference('vegan')}
                  >
                    <Text style={[styles.dietOptionText, dietaryPreference === 'vegan' && styles.activeDietOptionText]}>Vegan</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.dietOption, dietaryPreference === 'keto' && styles.activeDietOption]}
                    onPress={() => setDietaryPreference('keto')}
                  >
                    <Text style={[styles.dietOptionText, dietaryPreference === 'keto' && styles.activeDietOptionText]}>Keto</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Excluded Ingredients</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter allergies or disliked foods (comma separated)"
                  value={excludedIngredients}
                  onChangeText={setExcludedIngredients}
                  multiline
                />
              </View>
              
              <View style={styles.formSection}>
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Include Evening Snack</Text>
                  <Switch
                    value={includeEveningSnack}
                    onValueChange={setIncludeEveningSnack}
                    trackColor={{ false: "#e0e0e0", true: "#bbd0ff" }}
                    thumbColor={includeEveningSnack ? "#4285F4" : "#f4f3f4"}
                  />
                </View>
              </View>
              
              <View style={styles.formSection}>
                <TouchableOpacity 
                  style={styles.viewSavedPlansButton}
                  onPress={() => router.push('/workout/mealplans')}
                >
                  <FontAwesome name="list" size={16} color="white" style={styles.buttonIcon} />
                  <Text style={styles.viewSavedPlansButtonText}>
                    View Saved Meal Plans ({savedPlans.length})
                  </Text>
                </TouchableOpacity>
              </View>
              
              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                  <Text style={styles.errorSubText}>Please adjust your preferences and try again</Text>
                </View>
              )}
              
              <TouchableOpacity 
                style={styles.generateButton}
                onPress={generateMealPlan}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.generateButtonText}>Generate Meal Plan</Text>
                )}
              </TouchableOpacity>
            </View>
}
           {((mealPlan.current || weeklyMealPlan.current) && generationComplete ) && renderMealPlan()
           }
        </ScrollView>
        
        <Modal
          transparent={true}
          visible={showTips}
          animationType="fade"
          onRequestClose={() => setShowTips(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.tipCard}>
              <Text style={styles.tipTitle}>Nutrition Tip</Text>
              <Text style={styles.tipText}>{currentTip}</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowTips(false)}
              >
                <Text style={styles.closeButtonText}>Got it</Text>
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
      paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 30,
    },
    formContainer: {
      backgroundColor: 'white',
      margin: 15,
      borderRadius: 10,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    formTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 20,
      textAlign: 'center',
    },
    formSection: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#333',
      marginBottom: 10,
    },
    slider: {
      width: '100%',
      height: 40,
    },
    calorieValue: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#4285F4',
      textAlign: 'center',
      marginBottom: 10,
    },
    sliderLabels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 5,
    },
    sliderLabel: {
      fontSize: 12,
      color: '#666',
    },
    dietOptions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginTop: 5,
    },
    dietOption: {
      backgroundColor: '#f0f0f0',
      paddingVertical: 12,
      paddingHorizontal: 15,
      borderRadius: 20,
      marginBottom: 10,
      minWidth: '45%',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#e0e0e0',
    },
    activeDietOption: {
      backgroundColor: '#4285F4',
      borderColor: '#4285F4',
    },
    dietOptionText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#666',
    },
    activeDietOptionText: {
      color: 'white',
    },
    textInput: {
      borderWidth: 1,
      borderColor: '#e0e0e0',
      borderRadius: 8,
      padding: 12,
      fontSize: 14,
      minHeight: 60,
    },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    switchLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: '#333',
    },
    generateButton: {
      backgroundColor: '#4285F4',
      paddingVertical: 15,
      borderRadius: 30,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 3,
      elevation: 2,
    },
    generateButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: 'bold',
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
      justifyContent: 'space-around',
      backgroundColor: 'white',
      borderRadius: 10,
      padding: 15,
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    actionButtons: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: 10,
      marginBottom: 20,
    },
    actionButton: {
      paddingVertical: 8,
      paddingHorizontal: 15,
      backgroundColor: '#f0f8ff',
      borderRadius: 15,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#4285F4',
    },
    actionButtonText: {
      color: '#4285F4',
      fontWeight: '600',
      marginLeft: 6,
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
    resetButton: {
      backgroundColor: '#34A853',
      paddingVertical: 15,
      borderRadius: 30,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 3,
      elevation: 2,
    },
    resetButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: 'bold',
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    tipCard: {
      backgroundColor: 'white',
      borderRadius: 10,
      padding: 20,
      width: '85%',
      maxHeight: '70%',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    tipTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#4285F4',
      marginBottom: 10,
      textAlign: 'center',
    },
    tipText: {
      fontSize: 14,
      color: '#333',
      marginBottom: 15,
      lineHeight: 20,
    },
    closeButton: {
      alignSelf: 'center',
      paddingVertical: 10,
      paddingHorizontal: 20,
      backgroundColor: '#4285F4',
      borderRadius: 20,
    },
    closeButtonText: {
      color: 'white',
      fontWeight: 'bold',
    },
    saveSuccessMessage: {
      backgroundColor: '#34A853',
      padding: 10,
      borderRadius: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 10,
      alignSelf: 'center',
    },
    saveSuccessText: {
      color: 'white',
      marginLeft: 8,
      fontWeight: 'bold',
    },
    viewSavedPlansButton: {
      backgroundColor: '#4285F4',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: 8,
      marginTop: 10,
    },
    viewSavedPlansButtonText: {
      color: 'white',
      fontWeight: '600',
      fontSize: 15,
    },
    buttonIcon: {
      marginRight: 8,
    },
    errorContainer: {
      backgroundColor: 'rgba(234, 67, 53, 0.1)',
      padding: 15,
      borderRadius: 8,
      marginBottom: 15,
      borderLeftWidth: 4,
      borderLeftColor: '#EA4335',
    },
    errorText: {
      color: '#EA4335',
      fontWeight: 'bold',
      marginBottom: 5,
    },
    errorSubText: {
      color: '#666',
      fontSize: 12,
    }
  });
  
  export default MealPlanGeneratorScreen;