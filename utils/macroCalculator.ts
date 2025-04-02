/**
 * Macro Calculator Utility
 * 
 * This utility provides functions to calculate macronutrient needs based on
 * user biometric data and activity level, as well as BMI calculation.
 * Supports both metric and imperial measurement systems.
 */

export type Gender = 'male' | 'female' | 'other';

export type ActivityLevel = 
  | 'sedentary'        // Little to no exercise
  | 'light'            // Light exercise 1-3 days/week
  | 'moderate'         // Moderate exercise 3-5 days/week
  | 'active'           // Active exercise 6-7 days/week
  | 'very_active';     // Very intense exercise daily or physical job

export type Goal = 'lose' | 'maintain' | 'gain';

export type UnitSystem = 'metric' | 'imperial';

export interface UserBioData {
  height: number;      // in cm (metric) or inches (imperial)
  weight: number;      // in kg (metric) or pounds (imperial)
  age: number;         // in years
  gender: Gender;
  activityLevel: ActivityLevel;
  goal: Goal;
  unitSystem: UnitSystem;
}

export interface MacroResults {
  calories: number;
  protein: number;     // in grams
  carbs: number;       // in grams
  fat: number;         // in grams
}

/**
 * Convert height from imperial to metric if needed
 */
export function normalizeHeight(height: number, unitSystem: UnitSystem): number {
  // If imperial, convert inches to cm
  return unitSystem === 'imperial' ? height * 2.54 : height;
}

/**
 * Convert weight from imperial to metric if needed
 */
export function normalizeWeight(weight: number, unitSystem: UnitSystem): number {
  // If imperial, convert pounds to kg
  return unitSystem === 'imperial' ? weight * 0.453592 : weight;
}

/**
 * Calculate Body Mass Index (BMI)
 */
export function calculateBMI(height: number, weight: number, unitSystem: UnitSystem): number {
  if (unitSystem === 'imperial') {
    // Imperial BMI formula: (weight in pounds × 703) ÷ (height in inches)²
    return Number(((weight * 703) / (height * height)).toFixed(1));
  } else {
    // Metric BMI formula: weight(kg) / height(m)²
    const heightInMeters = height / 100;
    return Number((weight / (heightInMeters * heightInMeters)).toFixed(1));
  }
}

/**
 * Get BMI category based on calculated BMI value
 */
export function getBMICategory(bmi: number): string {
  if (bmi < 18.5) {
    return 'Underweight';
  } else if (bmi >= 18.5 && bmi < 25) {
    return 'Normal weight';
  } else if (bmi >= 25 && bmi < 30) {
    return 'Overweight';
  } else {
    return 'Obese';
  }
}

/**
 * Calculate Basal Metabolic Rate (BMR) using the Mifflin-St Jeor Equation
 */
export function calculateBMR(height: number, weight: number, age: number, gender: Gender, unitSystem: UnitSystem): number {
  // Convert to metric if needed for the calculation
  const heightInCm = normalizeHeight(height, unitSystem);
  const weightInKg = normalizeWeight(weight, unitSystem);
  
  // Mifflin-St Jeor Equation
  const bmr = 10 * weightInKg + 6.25 * heightInCm - 5 * age;
  return gender === 'male' ? bmr + 5 : bmr - 161;
}

/**
 * Calculate Total Daily Energy Expenditure (TDEE) based on BMR and activity level
 */
export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9
  };
  
  return Math.round(bmr * activityMultipliers[activityLevel]);
}

/**
 * Adjust calories based on user's goal
 */
export function adjustCaloriesForGoal(tdee: number, goal: Goal): number {
  switch (goal) {
    case 'lose':
      return Math.round(tdee * 0.8); // 20% deficit
    case 'gain':
      return Math.round(tdee * 1.15); // 15% surplus
    case 'maintain':
    default:
      return tdee;
  }
}

/**
 * Calculate macronutrients based on adjusted calories
 */
export function calculateMacros(calories: number, weight: number, goal: Goal, unitSystem: UnitSystem): MacroResults {
  // Convert to kg if using imperial
  const weightInKg = normalizeWeight(weight, unitSystem);
  
  let protein = 0;
  let fat = 0;
  let carbs = 0;
  
  // Protein calculation based on goal and weight
  switch (goal) {
    case 'lose':
      protein = weightInKg * 2.2; // Higher protein for weight loss (2.2g per kg)
      break;
    case 'gain':
      protein = weightInKg * 1.8; // Moderate protein for muscle gain (1.8g per kg)
      break;
    case 'maintain':
    default:
      protein = weightInKg * 1.6; // Moderate protein for maintenance (1.6g per kg)
      break;
  }
  
  // Fat calculation (25-35% of calories)
  const fatPercentage = goal === 'lose' ? 0.25 : 0.3;
  fat = Math.round((calories * fatPercentage) / 9); // 9 calories per gram of fat
  
  // Remaining calories from carbs
  const remainingCalories = calories - (protein * 4) - (fat * 9);
  carbs = Math.round(remainingCalories / 4); // 4 calories per gram of carbs
  
  return {
    calories: Math.round(calories),
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fat: Math.round(fat)
  };
}

/**
 * Main function to calculate all macros based on user data
 */
export function calculateAllMacros(userData: UserBioData): MacroResults {
  const bmr = calculateBMR(
    userData.height, 
    userData.weight, 
    userData.age, 
    userData.gender, 
    userData.unitSystem
  );
  const tdee = calculateTDEE(bmr, userData.activityLevel);
  const adjustedCalories = adjustCaloriesForGoal(tdee, userData.goal);
  return calculateMacros(adjustedCalories, userData.weight, userData.goal, userData.unitSystem);
}

/**
 * Helper function to format weight display based on unit system
 */
export function formatWeight(weight: number, unitSystem: UnitSystem): string {
  return unitSystem === 'metric' 
    ? `${weight} kg` 
    : `${weight} lbs`;
}

/**
 * Helper function to format height display based on unit system
 */
export function formatHeight(height: number, unitSystem: UnitSystem): string {
  if (unitSystem === 'metric') {
    return `${height} cm`;
  } else {
    // Convert inches to feet and inches for display
    const feet = Math.floor(height / 12);
    const inches = Math.round(height % 12);
    return `${feet}'${inches}"`;
  }
}