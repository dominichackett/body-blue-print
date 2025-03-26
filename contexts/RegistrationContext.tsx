import React, { createContext, useContext, useState, ReactNode } from 'react';
import { 
  UserBioData, 
  Gender, 
  ActivityLevel, 
  Goal, 
  MacroResults, 
  calculateAllMacros 
} from '../utils/macroCalculator';

// Default values for the user data
const defaultUserData: UserBioData = {
  height: 170,
  weight: 70,
  age: 30,
  gender: 'male',
  activityLevel: 'moderate',
  goal: 'maintain'
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
}

// Create the context
const RegistrationContext = createContext<RegistrationContextType | undefined>(undefined);

// Provider component
export const RegistrationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userData, setUserData] = useState<UserBioData>(defaultUserData);
  const [currentStep, setCurrentStep] = useState(0);
  const [macroResults, setMacroResults] = useState<MacroResults | null>(null);

  // Update user data
  const updateUserData = (data: Partial<UserBioData>) => {
    setUserData(prevData => ({ ...prevData, ...data }));
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
  const calculateMacros = () => {
    const results = calculateAllMacros(userData);
    setMacroResults(results);
  };

  // Reset registration data
  const resetRegistration = () => {
    setUserData(defaultUserData);
    setCurrentStep(0);
    setMacroResults(null);
  };

  // Validate each step
  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 0: // Welcome screen - always valid
        return true;
      case 1: // Personal info
        return (
          userData.height > 0 &&
          userData.weight > 0 &&
          userData.age > 0 &&
          !!userData.gender
        );
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
