import AsyncStorage from '@react-native-async-storage/async-storage';

// Key for storing food history in AsyncStorage
const FOOD_HISTORY_KEY = 'food_calorie_history';

/**
 * Save a food entry to history
 * @param {Object} foodData - Food data including calories, macros, etc.
 * @param {string} imageUri - URI of the food image
 * @returns {Promise<string>} - Returns ID of saved entry
 */
export const saveFoodToHistory = async (foodData, imageUri) => {
  try {
    // Generate a unique ID
    const entryId = Date.now().toString();
    
    // Create entry with metadata
    const entry = {
      id: entryId,
      timestamp: new Date().toISOString(),
      imageUri: imageUri,
      foodData: foodData
    };

    // Get existing history
    const historyJson = await AsyncStorage.getItem(FOOD_HISTORY_KEY);
    let history = historyJson ? JSON.parse(historyJson) : [];
    
    // Add new entry
    history.unshift(entry); // Add to beginning of array
    
    // Save updated history
    await AsyncStorage.setItem(FOOD_HISTORY_KEY, JSON.stringify(history));
    
    return entryId;
  } catch (error) {
    console.error('Error saving food to history:', error);
    throw error;
  }
};

/**
 * Get all saved food history entries
 * @returns {Promise<Array>} - Returns array of food entries
 */
export const getFoodHistory = async () => {
  try {
    const historyJson = await AsyncStorage.getItem(FOOD_HISTORY_KEY);
    return historyJson ? JSON.parse(historyJson) : [];
  } catch (error) {
    console.error('Error getting food history:', error);
    return [];
  }
};

/**
 * Delete a food entry from history
 * @param {string} entryId - ID of entry to delete
 * @returns {Promise<boolean>} - Returns success status
 */
export const deleteFoodFromHistory = async (entryId) => {
  try {
    // Get existing history
    const historyJson = await AsyncStorage.getItem(FOOD_HISTORY_KEY);
    if (!historyJson) return false;
    
    let history = JSON.parse(historyJson);
    
    // Filter out the entry to delete
    const newHistory = history.filter(entry => entry.id !== entryId);
    
    // Save updated history
    await AsyncStorage.setItem(FOOD_HISTORY_KEY, JSON.stringify(newHistory));
    
    return true;
  } catch (error) {
    console.error('Error deleting food from history:', error);
    return false;
  }
};

/**
 * Clear all food history
 * @returns {Promise<boolean>} - Returns success status
 */
export const clearFoodHistory = async () => {
  try {
    await AsyncStorage.removeItem(FOOD_HISTORY_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing food history:', error);
    return false;
  }
};