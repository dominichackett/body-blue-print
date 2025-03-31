import React, { useState, useEffect } from 'react';
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

const MealPlanGeneratorScreen = () => {
  
  // User preferences
  const [calories, setCalories] = useState(2000);
  const [dietaryPreference, setDietaryPreference] = useState('omnivore');
  const [excludedIngredients, setExcludedIngredients] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generationComplete, setGenerationComplete] = useState(false);
  const [includeSnacks, setIncludeSnacks] = useState(true);
  const [includeEveningSnack, setIncludeEveningSnack] = useState(true);
  const [mealPlan, setMealPlan] = useState(null);
  const [weeklyMealPlan, setWeeklyMealPlan] = useState(null);
  const [selectedDay, setSelectedDay] = useState(0);
  const [daysPerWeek, setDaysPerWeek] = useState(5);
  const [showTips, setShowTips] = useState(false);
  const [currentTip, setCurrentTip] = useState('');
  const [savedPlans, setSavedPlans] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  useEffect(() => {
    loadSavedMealPlans();
  }, []);
  
  // Load saved meal plans from AsyncStorage
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
  
  // Save current meal plan to AsyncStorage
  const saveMealPlan = async () => {
    try {
      setIsSaving(true);
      
      // Create plan to save (either weekly or single day)
      const planToSave = {
        id: Date.now().toString(),
        dateCreated: new Date().toISOString(),
        planName: `${dietaryPreference.charAt(0).toUpperCase() + dietaryPreference.slice(1)} Plan - ${new Date().toLocaleDateString()}`,
        plan: weeklyMealPlan || mealPlan,
        type: weeklyMealPlan ? 'weekly' : 'daily'
      };
      
      // Add to saved plans array
      const updatedSavedPlans = [...savedPlans, planToSave];
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('savedMealPlans', JSON.stringify(updatedSavedPlans));
      
      // Update state
      setSavedPlans(updatedSavedPlans);
      setIsSaving(false);
      
      // Show success message
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000); // Hide success message after 2 seconds
      
    } catch (error) {
      console.error('Error saving meal plan:', error);
      setIsSaving(false);
      // Show error message if implemented
    }
  };
  
  // 4. Add a Save button to your action buttons in renderDailySummary function
  // Update the renderDailySummary function to include the save button
  
  const renderDailySummary = (day) => {
    // Existing calculation code...
    // Calculate total calories for the day
  const totalCalories = day.meals.reduce((sum, meal) => sum + meal.calories, 0);
  
  // Calculate total macros
  const totalProtein = day.meals.reduce((sum, meal) => sum + meal.protein, 0);
  const totalCarbs = day.meals.reduce((sum, meal) => sum + meal.carbs, 0);
  const totalFat = day.meals.reduce((sum, meal) => sum + meal.fat, 0);
    return (
      <View>
        <View style={styles.totalCaloriesSection}>
          <FontAwesome name="fire" size={18} color="#0066cc" style={styles.calorieIcon} />
          <Text style={styles.totalCaloriesText}>
            Total: {totalCalories} calories
          </Text>
        </View>
        
        <View style={styles.dailySummary}>
          {/* Existing nutrient items... */}
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
        
        {/* Success message */}
        {saveSuccess && (
          <View style={styles.saveSuccessMessage}>
            <FontAwesome name="check-circle" size={16} color="white" />
            <Text style={styles.saveSuccessText}>Meal plan saved!</Text>
          </View>
        )}
      </View>
    );
  };
  
  
  
  // Handle diet type selection
  const handleDietSelect = (diet) => {
    setDietaryPreference(diet);
  };
  
  // Generate meal plan
  const generateMealPlan = async () => {
    setIsLoading(true);
    
    // Simulate AI processing time
    setTimeout(() => {
      if (daysPerWeek > 1) {
        // Generate a weekly meal plan
        const weeklyPlan = generateWeeklyMealPlan();
        setWeeklyMealPlan(weeklyPlan);
      } else {
        // Generate a single day meal plan
        const singleDayPlan = generateDetailedMealPlan();
        setMealPlan(singleDayPlan);
      }
      setGenerationComplete(true);
      setIsLoading(false);
    }, 3000);
  };
  
  // Reset and start over
  const resetForm = () => {
    setGenerationComplete(false);
    setMealPlan(null);
    setWeeklyMealPlan(null);
  };
  
  // Nutrition tips functionality
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

  const showNutritionTips = () => {
    // Select a random tip
    const tipIndex = Math.floor(Math.random() * nutritionTips.length);
    setCurrentTip(nutritionTips[tipIndex]);
    setShowTips(true);
  };

  const shareMenu = () => {
    // This would use the Share API in a real app
    Alert.alert(
      "Share Meal Plan",
      "This would share your meal plan via your preferred method (in a real app).",
      [{ text: "OK" }]
    );
  };
  
  // Helper function to create a pool of different meal options
  const generateMealPool = (options, count) => {
    // Shuffle array to get random items
    const shuffled = [...options].sort(() => 0.5 - Math.random());
    // Take the first 'count' items
    return shuffled.slice(0, count);
  };
  // Generate a detailed single day meal plan
  const generateDetailedMealPlan = () => {
    const mealPlanData = {
      dailyCalories: calories,
      meals: [],
      dietType: dietaryPreference,
      nutritionSummary: {
        protein: Math.floor(calories * 0.3 / 4), 
        carbs: Math.floor(calories * 0.4 / 4),   
        fat: Math.floor(calories * 0.3 / 9),     
        fiber: Math.floor(calories / 100)        
      }
    };
    
    // Breakfast options with detailed items and calorie counts
    const breakfastOptions = {
      'omnivore': [
        {
          name: "High-Protein Eggs & Oatmeal",
          calories: 700,
          protein: 45,
          carbs: 65,
          fat: 25,
          items: [
            {
              name: "3 whole eggs + 3 egg whites (scrambled)",
              calories: 300,
              preparation: "Scramble with a pinch of salt and pepper"
            },
            {
              name: "1 cup oatmeal with toppings",
              calories: 300, 
              preparation: "Cook oatmeal with water, add 1 tbsp honey and 1 tbsp peanut butter"
            },
            {
              name: "1 banana",
              calories: 100,
              preparation: "Fresh, medium-sized"
            },
            {
              name: "Beverage",
              calories: 0,
              preparation: "Water or black coffee"
            }
          ]
        },
        {
          name: "Protein Pancakes & Fruit",
          calories: 700,
          protein: 40,
          carbs: 70,
          fat: 25,
          items: [
            {
              name: "Protein pancakes (3 medium)",
              calories: 350,
              preparation: "Made with 1 scoop protein powder, 1 banana, 2 eggs, and 1/4 cup oats"
            },
            {
              name: "Greek yogurt topping",
              calories: 150,
              preparation: "1/2 cup Greek yogurt with 1 tsp honey"
            },
            {
              name: "Mixed berries",
              calories: 100,
              preparation: "1 cup fresh or frozen berries"
            },
            {
              name: "Beverage",
              calories: 0,
              preparation: "Water or black coffee"
            }
          ]
        }
      ],
      'vegetarian': [
        {
          name: "Egg & Avocado Toast",
          calories: 700,
          protein: 35,
          carbs: 60,
          fat: 35,
          items: [
            {
              name: "2 whole eggs + 2 egg whites (fried)",
              calories: 250,
              preparation: "Fried in 1 tsp olive oil"
            },
            {
              name: "2 slices whole grain toast with avocado",
              calories: 350,
              preparation: "Toast bread, top with 1/2 mashed avocado, salt and pepper"
            },
            {
              name: "1 cup Greek yogurt",
              calories: 100,
              preparation: "Plain, low-fat"
            },
            {
              name: "Beverage",
              calories: 0,
              preparation: "Water, black coffee, or green tea"
            }
          ]
        }
      ],
      'vegan': [
        {
          name: "Protein-Packed Oatmeal Bowl",
          calories: 700,
          protein: 30,
          carbs: 90,
          fat: 25,
          items: [
            {
              name: "Oatmeal with protein",
              calories: 350,
              preparation: "1.5 cups cooked oats with 1 scoop plant protein powder"
            },
            {
              name: "Nut butter and seeds",
              calories: 200,
              preparation: "2 tbsp almond butter, 1 tbsp chia seeds, 1 tbsp flax seeds"
            },
            {
              name: "Fresh fruit",
              calories: 150,
              preparation: "1 banana and 1/2 cup berries"
            },
            {
              name: "Beverage",
              calories: 0,
              preparation: "Black coffee or herbal tea"
            }
          ]
        }
      ],
      'keto': [
        {
          name: "Avocado & Egg Breakfast",
          calories: 700,
          protein: 35,
          carbs: 10,
          fat: 60,
          items: [
            {
              name: "4 whole eggs",
              calories: 280,
              preparation: "Scrambled with 1 tbsp butter"
            },
            {
              name: "1 whole avocado",
              calories: 250,
              preparation: "Sliced, with salt and pepper"
            },
            {
              name: "3 strips bacon",
              calories: 150,
              preparation: "Cooked until crispy"
            },
            {
              name: "Handful of spinach",
              calories: 20,
              preparation: "Sautéed with eggs"
            },
            {
              name: "Beverage",
              calories: 0,
              preparation: "Black coffee with 1 tbsp heavy cream"
            }
          ]
        }
      ]
    };
    // Mid-morning snack options
    const midMorningSnackOptions = {
      'omnivore': [
        {
          name: "Toast & Greek Yogurt",
          calories: 600,
          protein: 30,
          carbs: 60,
          fat: 25,
          items: [
            {
              name: "2 slices whole-grain toast with topping",
              calories: 400,
              preparation: "Topped with 2 tbsp almond butter"
            },
            {
              name: "Greek yogurt with berries",
              calories: 200,
              preparation: "1 cup full-fat Greek yogurt with 1/2 cup mixed berries"
            }
          ]
        },
        {
          name: "Protein Shake & Fruit",
          calories: 600,
          protein: 40,
          carbs: 50,
          fat: 20,
          items: [
            {
              name: "Protein shake",
              calories: 400,
              preparation: "2 scoops whey protein, 1 cup milk, 1 tbsp peanut butter, 1 banana"
            },
            {
              name: "Apple and nut butter",
              calories: 200,
              preparation: "1 medium apple with 1 tbsp almond butter"
            }
          ]
        }
      ],
      'vegetarian': [
        {
          name: "Cottage Cheese & Nuts",
          calories: 600,
          protein: 35,
          carbs: 40,
          fat: 30,
          items: [
            {
              name: "Cottage cheese with honey",
              calories: 350,
              preparation: "1.5 cups low-fat cottage cheese with 1 tbsp honey"
            },
            {
              name: "Trail mix",
              calories: 250,
              preparation: "1/4 cup mixed nuts and 2 tbsp dried cranberries"
            }
          ]
        }
      ],
      'vegan': [
        {
          name: "Smoothie & Toast",
          calories: 600,
          protein: 25,
          carbs: 70,
          fat: 20,
          items: [
            {
              name: "Protein smoothie",
              calories: 350,
              preparation: "Plant protein, 1 banana, 1 cup almond milk, 1 tbsp almond butter, 1 cup spinach"
            },
            {
              name: "Avocado toast",
              calories: 250,
              preparation: "1 slice whole grain bread with 1/4 avocado and hemp seeds"
            }
          ]
        }
      ],
      'keto': [
        {
          name: "Cheese & Nuts",
          calories: 600,
          protein: 30,
          carbs: 8,
          fat: 50,
          items: [
            {
              name: "Cheese selection",
              calories: 350,
              preparation: "3 oz mixed cheeses (cheddar, gouda, brie)"
            },
            {
              name: "Mixed nuts",
              calories: 250,
              preparation: "1/3 cup macadamia nuts and almonds"
            }
          ]
        }
      ]
    };
    
    // Lunch options
    const lunchOptions = {
      'omnivore': [
        {
          name: "Grilled Chicken & Rice Bowl",
          calories: 800,
          protein: 50,
          carbs: 80,
          fat: 25,
          items: [
            {
              name: "Grilled chicken breast",
              calories: 300,
              preparation: "6 oz, seasoned with herbs and spices"
            },
            {
              name: "Brown rice",
              calories: 220,
              preparation: "1 cup cooked"
            },
            {
              name: "Steamed broccoli with olive oil",
              calories: 150,
              preparation: "1 cup broccoli with 1 tbsp olive oil"
            },
            {
              name: "Sweet potato",
              calories: 130,
              preparation: "1 medium, mashed"
            }
          ]
        },
        {
          name: "Tuna & Quinoa Salad",
          calories: 800,
          protein: 55,
          carbs: 70,
          fat: 30,
          items: [
            {
              name: "Tuna steak",
              calories: 300,
              preparation: "6 oz, seared"
            },
            {
              name: "Quinoa",
              calories: 220,
              preparation: "1 cup cooked"
            },
            {
              name: "Mixed greens with dressing",
              calories: 150,
              preparation: "2 cups greens with 2 tbsp olive oil vinaigrette"
            },
            {
              name: "Roasted vegetables",
              calories: 130,
              preparation: "1 cup roasted bell peppers and zucchini"
            }
          ]
        }
      ],
      'vegetarian': [
        {
          name: "Bean & Cheese Burrito Bowl",
          calories: 800,
          protein: 40,
          carbs: 90,
          fat: 30,
          items: [
            {
              name: "Black beans",
              calories: 220,
              preparation: "1 cup cooked, seasoned"
            },
            {
              name: "Brown rice",
              calories: 220,
              preparation: "1 cup cooked"
            },
            {
              name: "Avocado",
              calories: 160,
              preparation: "1/2 avocado, sliced"
            },
            {
              name: "Shredded cheese",
              calories: 100,
              preparation: "1/4 cup"
            },
            {
              name: "Salsa and Greek yogurt",
              calories: 100,
              preparation: "2 tbsp salsa and 2 tbsp plain Greek yogurt"
            }
          ]
        }
      ],
      'vegan': [
        {
          name: "Tofu & Vegetable Stir-Fry",
          calories: 800,
          protein: 35,
          carbs: 90,
          fat: 30,
          items: [
            {
              name: "Extra-firm tofu",
              calories: 300,
              preparation: "8 oz, cubed and stir-fried"
            },
            {
              name: "Brown rice",
              calories: 220,
              preparation: "1 cup cooked"
            },
            {
              name: "Mixed vegetables",
              calories: 150,
              preparation: "2 cups broccoli, bell peppers, carrots, snap peas"
            },
            {
              name: "Stir-fry sauce",
              calories: 130,
              preparation: "2 tbsp soy sauce, 1 tbsp maple syrup, 1 tsp sesame oil"
            }
          ]
        }
      ],
      'keto': [
        {
          name: "Steak & Vegetable Plate",
          calories: 800,
          protein: 50,
          carbs: 15,
          fat: 60,
          items: [
            {
              name: "Ribeye steak",
              calories: 450,
              preparation: "6 oz, grilled to medium"
            },
            {
              name: "Cauliflower mash",
              calories: 150,
              preparation: "1 cup cauliflower with 2 tbsp butter and 2 tbsp cream cheese"
            },
            {
              name: "Sautéed spinach",
              calories: 100,
              preparation: "2 cups spinach with 1 tbsp olive oil and garlic"
            },
            {
              name: "Avocado",
              calories: 100,
              preparation: "1/2 medium, sliced"
            }
          ]
        }
      ]
    };
    // Post-workout snack options
    const postWorkoutOptions = {
      'omnivore': [
        {
          name: "Protein & Carb Refuel",
          calories: 600,
          protein: 35,
          carbs: 70,
          fat: 15,
          items: [
            {
              name: "Whey protein shake",
              calories: 120,
              preparation: "1 scoop whey protein mixed with water"
            },
            {
              name: "Bagel with cream cheese",
              calories: 350,
              preparation: "1 large bagel with 2 tbsp cream cheese"
            },
            {
              name: "Apple",
              calories: 100,
              preparation: "1 medium"
            },
            {
              name: "Mixed nuts",
              calories: 150,
              preparation: "Small handful of almonds and walnuts (1/4 cup)"
            }
          ]
        },
        {
          name: "Recovery Wrap",
          calories: 600,
          protein: 40,
          carbs: 65,
          fat: 15,
          items: [
            {
              name: "Chicken wrap",
              calories: 400,
              preparation: "1 large whole wheat wrap with 4 oz shredded chicken, lettuce, tomato"
            },
            {
              name: "Banana",
              calories: 100,
              preparation: "1 medium"
            },
            {
              name: "Chocolate milk",
              calories: 150,
              preparation: "1 cup low-fat chocolate milk"
            }
          ]
        }
      ],
      'vegetarian': [
        {
          name: "Protein-Rich Recovery",
          calories: 600,
          protein: 30,
          carbs: 75,
          fat: 15,
          items: [
            {
              name: "Protein smoothie",
              calories: 300,
              preparation: "1 scoop whey protein, 1 cup milk, 1 banana, 1 tbsp honey"
            },
            {
              name: "Whole grain toast with topping",
              calories: 200,
              preparation: "2 slices bread with 1 tbsp almond butter"
            },
            {
              name: "Mixed fruit",
              calories: 100,
              preparation: "1 cup berries and melon"
            }
          ]
        }
      ],
      'vegan': [
        {
          name: "Plant Protein Recovery",
          calories: 600,
          protein: 25,
          carbs: 80,
          fat: 15,
          items: [
            {
              name: "Plant protein shake",
              calories: 150,
              preparation: "1 scoop plant protein with 1 cup almond milk"
            },
            {
              name: "Energy bars",
              calories: 250,
              preparation: "2 homemade energy bars with dates, nuts, and protein powder"
            },
            {
              name: "Banana",
              calories: 100,
              preparation: "1 medium"
            },
            {
              name: "Trail mix",
              calories: 100,
              preparation: "Small handful of mixed seeds and dried fruit"
            }
          ]
        }
      ],
      'keto': [
        {
          name: "Keto Recovery Snack",
          calories: 600,
          protein: 35,
          carbs: 10,
          fat: 45,
          items: [
            {
              name: "Protein shake",
              calories: 250,
              preparation: "1 scoop whey protein, 1 cup almond milk, 1 tbsp MCT oil"
            },
            {
              name: "Hard-boiled eggs",
              calories: 150,
              preparation: "2 whole eggs"
            },
            {
              name: "Cheese",
              calories: 100,
              preparation: "1 oz cheddar or mozzarella"
            },
            {
              name: "Macadamia nuts",
              calories: 100,
              preparation: "Small handful (1/4 cup)"
            }
          ]
        }
      ]
    };
    
    // Dinner options
    const dinnerOptions = {
      'omnivore': [
        {
          name: "Salmon & Quinoa Dinner",
          calories: 700,
          protein: 45,
          carbs: 60,
          fat: 25,
          items: [
            {
              name: "Grilled salmon",
              calories: 350,
              preparation: "6 oz fillet, seasoned and grilled"
            },
            {
              name: "Quinoa",
              calories: 220,
              preparation: "1 cup cooked"
            },
            {
              name: "Roasted mixed vegetables",
              calories: 130,
              preparation: "1 cup zucchini and bell peppers with 1 tbsp olive oil"
            }
          ]
        },
        {
          name: "Lean Beef & Sweet Potato",
          calories: 700,
          protein: 45,
          carbs: 60,
          fat: 25,
          items: [
            {
              name: "Lean beef steak",
              calories: 350,
              preparation: "6 oz sirloin, grilled"
            },
            {
              name: "Baked sweet potato",
              calories: 200,
              preparation: "1 large, baked"
            },
            {
              name: "Steamed asparagus",
              calories: 150,
              preparation: "10 spears with 1 tbsp olive oil and lemon"
            }
          ]
        }
      ],
      'vegetarian': [
        {
          name: "Hearty Veggie Dinner",
          calories: 700,
          protein: 30,
          carbs: 80,
          fat: 25,
          items: [
            {
              name: "Stuffed bell peppers",
              calories: 350,
              preparation: "2 peppers stuffed with quinoa, black beans, corn, and cheese"
            },
            {
              name: "Greek salad",
              calories: 200,
              preparation: "2 cups mixed greens, cucumber, tomato, feta with olive oil dressing"
            },
            {
              name: "Whole grain roll",
              calories: 150,
              preparation: "1 medium roll with 1 tsp butter"
            }
          ]
        }
      ],
      'vegan': [
        {
          name: "Protein-Packed Vegan Dinner",
          calories: 700,
          protein: 30,
          carbs: 85,
          fat: 20,
          items: [
            {
              name: "Lentil and vegetable curry",
              calories: 400,
              preparation: "1.5 cups curry with tomatoes, spinach, and coconut milk"
            },
            {
              name: "Brown rice",
              calories: 220,
              preparation: "1 cup cooked"
            },
            {
              name: "Side salad",
              calories: 80,
              preparation: "2 cups mixed greens with lemon and 1 tsp olive oil"
            }
          ]
        }
      ],
      'keto': [
        {
          name: "Keto-Friendly Dinner",
          calories: 700,
          protein: 40,
          carbs: 10,
          fat: 55,
          items: [
            {
              name: "Baked chicken thighs",
              calories: 350,
              preparation: "8 oz bone-in, skin-on thighs, seasoned"
            },
            {
              name: "Cauliflower rice",
              calories: 100,
              preparation: "1.5 cups with 1 tbsp butter and herbs"
            },
            {
              name: "Caesar salad",
              calories: 250,
              preparation: "2 cups romaine with creamy dressing, Parmesan, and bacon bits"
            }
          ]
        }
      ]
    };
    // Evening snack options
    const eveningSnackOptions = {
      'omnivore': [
        {
          name: "Protein-Rich Evening Snack",
          calories: 250,
          protein: 15,
          carbs: 15,
          fat: 15,
          items: [
            {
              name: "Cottage cheese with chia seeds",
              calories: 200,
              preparation: "1/2 cup cottage cheese with 1 tbsp chia seeds and cinnamon"
            },
            {
              name: "Herbal tea",
              calories: 0,
              preparation: "1 cup chamomile or mint tea"
            }
          ]
        },
        {
          name: "Dark Chocolate & Nuts",
          calories: 300,
          protein: 8,
          carbs: 15,
          fat: 20,
          items: [
            {
              name: "Dark chocolate",
              calories: 150,
              preparation: "1 oz (70% or higher cocoa)"
            },
            {
              name: "Mixed nuts",
              calories: 150,
              preparation: "Small handful (about 1/4 cup)"
            }
          ]
        }
      ],
      'vegetarian': [
        {
          name: "Greek Yogurt Parfait",
          calories: 250,
          protein: 15,
          carbs: 20,
          fat: 10,
          items: [
            {
              name: "Greek yogurt",
              calories: 150,
              preparation: "3/4 cup plain"
            },
            {
              name: "Granola and berries",
              calories: 100,
              preparation: "2 tbsp granola and 1/4 cup berries"
            }
          ]
        }
      ],
      'vegan': [
        {
          name: "Apple & Almond Butter",
          calories: 250,
          protein: 6,
          carbs: 30,
          fat: 12,
          items: [
            {
              name: "Apple slices",
              calories: 100,
              preparation: "1 medium apple, sliced"
            },
            {
              name: "Almond butter",
              calories: 150,
              preparation: "1.5 tbsp"
            }
          ]
        }
      ],
      'keto': [
        {
          name: "Keto Fat Bombs",
          calories: 250,
          protein: 5,
          carbs: 3,
          fat: 25,
          items: [
            {
              name: "Homemade fat bombs",
              calories: 200,
              preparation: "2 pieces made with coconut oil, cream cheese, and cocoa"
            },
            {
              name: "Chamomile tea",
              calories: 0,
              preparation: "1 cup"
            }
          ]
        }
      ]
    };
    
    // Select random options for each meal type
    const breakfastOption = breakfastOptions[dietaryPreference][Math.floor(Math.random() * breakfastOptions[dietaryPreference].length)];
    const midMorningOption = midMorningSnackOptions[dietaryPreference][Math.floor(Math.random() * midMorningSnackOptions[dietaryPreference].length)];
    const lunchOption = lunchOptions[dietaryPreference][Math.floor(Math.random() * lunchOptions[dietaryPreference].length)];
    const postWorkoutOption = postWorkoutOptions[dietaryPreference][Math.floor(Math.random() * postWorkoutOptions[dietaryPreference].length)];
    const dinnerOption = dinnerOptions[dietaryPreference][Math.floor(Math.random() * dinnerOptions[dietaryPreference].length)];
    
    // Add breakfast
    mealPlanData.meals.push({
      name: "Meal 1: Breakfast (700 kcal)",
      type: "breakfast",
      ...breakfastOption
    });
    
    // Add mid-morning snack
    mealPlanData.meals.push({
      name: "Meal 2: Mid-Morning Snack (600 kcal)",
      type: "mid-morning",
      ...midMorningOption
    });
    
    // Add lunch
    mealPlanData.meals.push({
      name: "Meal 3: Lunch (800 kcal)",
      type: "lunch",
      ...lunchOption
    });
    
    // Add post-workout snack
    mealPlanData.meals.push({
      name: "Meal 4: Post-Workout (600 kcal)",
      type: "post-workout",
      ...postWorkoutOption
    });
    
    // Add dinner
    mealPlanData.meals.push({
      name: "Meal 5: Dinner (700 kcal)",
      type: "dinner",
      ...dinnerOption
    });
    
    // Add evening snack if selected
    if (includeEveningSnack) {
      const eveningSnackOption = eveningSnackOptions[dietaryPreference][Math.floor(Math.random() * eveningSnackOptions[dietaryPreference].length)];
      mealPlanData.meals.push({
        name: "Optional Evening Snack (250 kcal)",
        type: "evening-snack",
        ...eveningSnackOption
      });
    }
    
    return mealPlanData;
  };
  // Generate a weekly meal plan
  const generateWeeklyMealPlan = () => {
    const weeklyPlan = {
      totalCalories: calories * daysPerWeek,
      daysOfWeek: [],
      dietType: dietaryPreference,
      overallNutrition: {
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0
      }
    };
    
    // Generate meal plans for selected number of days
    const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    // Create meal plans for each day
    for (let i = 0; i < daysPerWeek; i++) {
      const dayMealPlan = generateDetailedMealPlan();
      dayMealPlan.dayOfWeek = weekdays[i];
      
      // Update overall nutrition for the week
      dayMealPlan.meals.forEach(meal => {
        weeklyPlan.overallNutrition.protein += meal.protein;
        weeklyPlan.overallNutrition.carbs += meal.carbs;
        weeklyPlan.overallNutrition.fat += meal.fat;
      });
      
      weeklyPlan.daysOfWeek.push(dayMealPlan);
    }
    
    // Calculate averages for weekly summary
    weeklyPlan.overallNutrition.protein = Math.round(weeklyPlan.overallNutrition.protein / daysPerWeek);
    weeklyPlan.overallNutrition.carbs = Math.round(weeklyPlan.overallNutrition.carbs / daysPerWeek);
    weeklyPlan.overallNutrition.fat = Math.round(weeklyPlan.overallNutrition.fat / daysPerWeek);
    weeklyPlan.overallNutrition.fiber = Math.round(calories / 100);
    
    return weeklyPlan;
  };


// Render single day meal plan
const renderSingleDayMealPlan = () => {
  if (!mealPlan) return null;
  
  return (
    <View style={styles.mealPlanContainer}>
      <Text style={styles.mealPlanTitle}>Your Personalized Meal Plan</Text>
      <Text style={styles.mealPlanSubtitle}>
        {mealPlan.dietType.charAt(0).toUpperCase() + mealPlan.dietType.slice(1)} Diet • {mealPlan.dailyCalories} calories
      </Text>
      
      {/* Render daily summary */}
      {renderDailySummary(mealPlan)}
      
      {/* Render each meal */}
      {mealPlan.meals.map((meal, index) => (
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
       
   
      <TouchableOpacity 
        style={styles.resetButton}
        onPress={resetForm}
      >
        <Text style={styles.resetButtonText}>Generate New Plan</Text>
      </TouchableOpacity>
    </View>
  );
};

// Render weekly meal plan
const renderWeeklyMealPlan = () => {
  if (!weeklyMealPlan) return null;
  
  return (
    <View style={styles.mealPlanContainer}>
      <Text style={styles.mealPlanTitle}>Your Weekly Meal Plan</Text>
      <Text style={styles.mealPlanSubtitle}>
        {weeklyMealPlan.dietType.charAt(0).toUpperCase() + weeklyMealPlan.dietType.slice(1)} Diet • {calories} calories/day
      </Text>
      
      <View style={styles.nutritionSummary}>
        <View style={styles.nutrientItem}>
          <Text style={styles.nutrientValue}>{weeklyMealPlan.overallNutrition.protein}g</Text>
          <Text style={styles.nutrientLabel}>Avg Protein</Text>
        </View>
        <View style={styles.nutrientItem}>
          <Text style={styles.nutrientValue}>{weeklyMealPlan.overallNutrition.carbs}g</Text>
          <Text style={styles.nutrientLabel}>Avg Carbs</Text>
        </View>
        <View style={styles.nutrientItem}>
          <Text style={styles.nutrientValue}>{weeklyMealPlan.overallNutrition.fat}g</Text>
          <Text style={styles.nutrientLabel}>Avg Fat</Text>
        </View>
        <View style={styles.nutrientItem}>
          <Text style={styles.nutrientValue}>{weeklyMealPlan.overallNutrition.fiber}g</Text>
          <Text style={styles.nutrientLabel}>Avg Fiber</Text>
        </View>
      </View>
      
      {/* Day selection tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.dayTabs}
      >
        {weeklyMealPlan.daysOfWeek.map((day, index) => (
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
              {day.dayOfWeek}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {/* Render selected day's summary */}
      {renderDailySummary(weeklyMealPlan.daysOfWeek[selectedDay])}
      
      {/* Selected day's meals */}
      {weeklyMealPlan.daysOfWeek[selectedDay]?.meals.map((meal, index) => (
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
      
      <TouchableOpacity 
        style={styles.resetButton}
        onPress={resetForm}
      >
        <Text style={styles.resetButtonText}>Generate New Plan</Text>
      </TouchableOpacity>
    </View>
  );
};

// Main render meal plan function
const renderMealPlan = () => {
  if (weeklyMealPlan) {
    return renderWeeklyMealPlan();
  } else if (mealPlan) {
    return renderSingleDayMealPlan();
  }
  return null;
};

return (
  <SafeAreaView style={styles.container}>
    <StatusBar barStyle="dark-content" backgroundColor="#fff" />
    
   
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
      {!generationComplete ? (
        // Preferences Form
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Your Meal Preferences</Text>
          
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Daily Calories</Text>
            <Text style={styles.calorieValue}>{calories} calories</Text>
            <Slider
              style={styles.slider}
              minimumValue={1200}
              maximumValue={3000}
              step={50}
              value={calories}
              onValueChange={setCalories}
              minimumTrackTintColor="#4285F4"
              maximumTrackTintColor="#e0e0e0"
              thumbTintColor="#4285F4"
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabel}>1200</Text>
              <Text style={styles.sliderLabel}>3000</Text>
            </View>
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
                onPress={() => handleDietSelect('omnivore')}
              >
                <Text style={[styles.dietOptionText, dietaryPreference === 'omnivore' && styles.activeDietOptionText]}>Omnivore</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.dietOption, dietaryPreference === 'vegetarian' && styles.activeDietOption]}
                onPress={() => handleDietSelect('vegetarian')}
              >
                <Text style={[styles.dietOptionText, dietaryPreference === 'vegetarian' && styles.activeDietOptionText]}>Vegetarian</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.dietOption, dietaryPreference === 'vegan' && styles.activeDietOption]}
                onPress={() => handleDietSelect('vegan')}
              >
                <Text style={[styles.dietOptionText, dietaryPreference === 'vegan' && styles.activeDietOptionText]}>Vegan</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.dietOption, dietaryPreference === 'keto' && styles.activeDietOption]}
                onPress={() => handleDietSelect('keto')}
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
      ) : (
        // Meal Plan Results
        renderMealPlan()
      )}
    </ScrollView>
    
    {/* Nutrition Tips Modal */}
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
  }
});

export default MealPlanGeneratorScreen;

