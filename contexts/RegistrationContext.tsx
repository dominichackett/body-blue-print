import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  UserBioData, 
  Gender, 
  ActivityLevel, 
  Goal, 
  UnitSystem,
  MacroResults, 
  calculateAllMacros 
} from '../utils/macroCalculator';

// Storage keys
const USER_DATA_STORAGE_KEY = '@macro_calculator_user_data';
const USER_BIO_STORAGE_KEY = '@macro_calculator_user_bio';
const LAST_RESULTS_STORAGE_KEY = '@macro_calculator_last_results';

// Default values for the user data
const defaultUserData: UserBioData = {
  height: 170,
  weight: 70,
  age: 30,
  gender: 'male',
  activityLevel: 'moderate',
  goal: 'maintain',
  unitSystem: 'metric'
};

// Interface for the context
interface RegistrationContextType {
  // User data
  userData: UserBioData;
  // Current step in the registration process
  currentStep: number;
  // Macro calculation results
  macroResults: MacroResults | null;
  // Functions to update the context
  updateUserData: (data: Partial<UserBioData>) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  calculateMacros: () => void;
  resetRegistration: () => void;
  // Validation
  isStepValid: (step: number) => boolean;
  // Local storage functions
  saveUserData: () => Promise<void>;
  saveUserBio: () => Promise<void>;
  loadUserData: () => Promise<void>;
  clearUserData: () => Promise<void>;
  loadLastResults: () => Promise<MacroResults | null>;
  saveResults: (results: MacroResults) => Promise<void>;
}

// Create the context
const RegistrationContext = createContext<RegistrationContextType | undefined>(undefined);

// Provider component
export const RegistrationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userData, setUserData] = useState<UserBioData>(defaultUserData);
  const [currentStep, setCurrentStep] = useState(0);
  const [macroResults, setMacroResults] = useState<MacroResults | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load user data from storage on initial mount
  useEffect(() => {
    const initializeData = async () => {
      await loadUserData();
      const lastResults = await loadLastResults();
      if (lastResults) {
        setMacroResults(lastResults);
      }
      setIsInitialized(true);
    };

    initializeData();
  }, []);

  // Update user data
  const updateUserData = (data: Partial<UserBioData>) => {
    setUserData(prevData => {
      const newData = { ...prevData, ...data };
      // Auto-save to AsyncStorage when data changes
      if (isInitialized) {
        // Only save full user data if critical information has changed
        if (
          'height' in data || 
          'weight' in data || 
          'age' in data || 
          'gender' in data || 
          'unitSystem' in data
        ) {
          saveUserBio(newData);
        }
        
        // Always save complete user data
        saveUserData(newData);
      }
      return newData;
    });
  };

  // Save user data to AsyncStorage
  const saveUserData = async (dataToSave = userData): Promise<void> => {
    try {
      const jsonValue = JSON.stringify(dataToSave);
      await AsyncStorage.setItem(USER_DATA_STORAGE_KEY, jsonValue);
      console.log('User data saved successfully');
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  };

  // Save only user bio information (profile-specific data)
  const saveUserBio = async (dataToSave = userData): Promise<void> => {
    try {
      // Extract only the bio-related fields
      const bioData = {
        height: dataToSave.height,
        weight: dataToSave.weight,
        age: dataToSave.age,
        gender: dataToSave.gender,
        unitSystem: dataToSave.unitSystem
      };
      
      const jsonValue = JSON.stringify(bioData);
      await AsyncStorage.setItem(USER_BIO_STORAGE_KEY, jsonValue);
      console.log('User bio saved successfully');
    } catch (error) {
      console.error('Error saving user bio:', error);
    }
  };

  // Save calculation results
  const saveResults = async (results: MacroResults): Promise<void> => {
    try {
      const jsonValue = JSON.stringify(results);
      await AsyncStorage.setItem(LAST_RESULTS_STORAGE_KEY, jsonValue);
      console.log('Results saved successfully');
    } catch (error) {
      console.error('Error saving results:', error);
    }
  };

  // Load last calculation results
  const loadLastResults = async (): Promise<MacroResults | null> => {
    try {
      const jsonValue = await AsyncStorage.getItem(LAST_RESULTS_STORAGE_KEY);
      if (jsonValue !== null) {
        return JSON.parse(jsonValue) as MacroResults;
      }
      return null;
    } catch (error) {
      console.error('Error loading last results:', error);
      return null;
    }
  };

  // Load user data from AsyncStorage
  const loadUserData = async (): Promise<void> => {
    try {
      // First, try to load the full user data
      const jsonValue = await AsyncStorage.getItem(USER_DATA_STORAGE_KEY);
      if (jsonValue !== null) {
        const loadedData = JSON.parse(jsonValue) as UserBioData;
        // Ensure all required fields are present
        const validatedData = {
          ...defaultUserData,
          ...loadedData
        };
        setUserData(validatedData);
        console.log('User data loaded successfully');
      } else {
        // If full data isn't available, try to load just the bio data
        const bioJsonValue = await AsyncStorage.getItem(USER_BIO_STORAGE_KEY);
        if (bioJsonValue !== null) {
          const bioData = JSON.parse(bioJsonValue);
          setUserData(prevData => ({
            ...prevData,
            ...bioData
          }));
          console.log('User bio loaded successfully');
        } else {
          console.log('No user data found, using defaults');
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  // Clear user data from AsyncStorage
  const clearUserData = async (): Promise<void> => {
    try {
      // Clear all stored data
      const keys = [
        USER_DATA_STORAGE_KEY, 
        USER_BIO_STORAGE_KEY, 
        LAST_RESULTS_STORAGE_KEY
      ];
      
      await AsyncStorage.multiRemove(keys);
      console.log('User data cleared successfully');
    } catch (error) {
      console.error('Error clearing user data:', error);
    }
  };

  // Navigation functions
  const nextStep = () => {
    if (currentStep < 4) { // Assuming 5 steps (0-4)
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (step: number) => {
    if (step >= 0 && step <= 4) {
      setCurrentStep(step);
    }
  };

  // Calculate macros based on current user data
  const calculateMacros = useCallback(() => {
    const results = calculateAllMacros(userData);
    setMacroResults(results);
    
    // Save the results when calculated
    if (isInitialized) {
      saveResults(results);
    }
    
    return results;
  }, [userData, isInitialized]);

  // Reset registration data
  const resetRegistration = () => {
    setUserData(defaultUserData);
    setCurrentStep(0);
    setMacroResults(null);
    clearUserData();
  };

  // Validate each step
  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 0: // Welcome screen - always valid
        return true;
      case 1: // Personal info
        if (userData.unitSystem === 'metric') {
          return (
            userData.height >= 100 &&
            userData.height <= 250 &&
            userData.weight >= 30 &&
            userData.weight <= 300 &&
            userData.age >= 16 &&
            userData.age <= 100 &&
            !!userData.gender
          );
        } else { // imperial
          return (
            userData.height >= 36 &&
            userData.height <= 96 &&
            userData.weight >= 66 &&
            userData.weight <= 660 &&
            userData.age >= 16 &&
            userData.age <= 100 &&
            !!userData.gender
          );
        }
      case 2: // Activity level
        return !!userData.activityLevel;
      case 3: // Goals
        return !!userData.goal;
      case 4: // Results - always valid
        return true;
      default:
        return false;
    }
  };

  return (
    <RegistrationContext.Provider
      value={{
        userData,
        currentStep,
        macroResults,
        updateUserData,
        nextStep,
        prevStep,
        goToStep,
        calculateMacros,
        resetRegistration,
        isStepValid,
        saveUserData: () => saveUserData(),
        saveUserBio: () => saveUserBio(),
        loadUserData,
        clearUserData,
        loadLastResults,
        saveResults,
      }}
    >
      {children}
    </RegistrationContext.Provider>
  );
};

// Custom hook to use the registration context
export const useRegistration = (): RegistrationContextType => {
  const context = useContext(RegistrationContext);
  if (context === undefined) {
    throw new Error('useRegistration must be used within a RegistrationProvider');
  }
  return context;
};

// Custom hook to get user bio data from AsyncStorage directly
export const useStoredUserBio = () => {
  const [bioData, setBioData] = useState<Partial<UserBioData> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const jsonValue = await AsyncStorage.getItem(USER_BIO_STORAGE_KEY);
      if (jsonValue !== null) {
        const loadedData = JSON.parse(jsonValue) as Partial<UserBioData>;
        setBioData(loadedData);
      } else {
        setBioData(null);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      setBioData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    bioData: bioData || {
      height: defaultUserData.height,
      weight: defaultUserData.weight,
      age: defaultUserData.age,
      gender: defaultUserData.gender,
      unitSystem: defaultUserData.unitSystem
    },
    isLoading,
    error,
    refreshData: fetchData
  };
};

// Custom hook to get full user data from AsyncStorage directly
export const useStoredUserData = () => {
  const [storedData, setStoredData] = useState<UserBioData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const jsonValue = await AsyncStorage.getItem(USER_DATA_STORAGE_KEY);
      if (jsonValue !== null) {
        const loadedData = JSON.parse(jsonValue) as UserBioData;
        // Ensure all required fields are present
        const validatedData = {
          ...defaultUserData,
          ...loadedData
        };
        setStoredData(validatedData);
      } else {
        setStoredData(null);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      setStoredData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    userData: storedData || defaultUserData,
    isLoading,
    error,
    refreshData: fetchData
  };
};