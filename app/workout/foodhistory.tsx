import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { getFoodHistory, deleteFoodFromHistory, clearFoodHistory } from '@/utils/FoodHistoryManager';
import Constants from 'expo-constants';
import { router } from 'expo-router';

const FoodHistoryScreen = () => {
  const [historyItems, setHistoryItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDateFilter, setSelectedDateFilter] = useState('all'); // 'all', 'today', 'week', 'month'
  const [summary, setSummary] = useState({
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0,
  });

  const loadHistory = async () => {
    setIsLoading(true);
    const history = await getFoodHistory();
    setHistoryItems(history);
    applyDateFilter(selectedDateFilter, history);
    setIsLoading(false);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const calculateSummary = (items) => {
    const summaryData = items.reduce((acc, item) => {
      return {
        totalCalories: acc.totalCalories + (item.foodData.calories || 0),
        totalProtein: acc.totalProtein + (item.foodData.macros.protein || 0),
        totalCarbs: acc.totalCarbs + (item.foodData.macros.carbs || 0),
        totalFat: acc.totalFat + (item.foodData.macros.fat || 0),
      };
    }, { 
      totalCalories: 0, 
      totalProtein: 0, 
      totalCarbs: 0,
      totalFat: 0 
    });
    
    setSummary(summaryData);
  };

  const applyDateFilter = (filter, items = historyItems) => {
    setSelectedDateFilter(filter);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let filtered;
    switch (filter) {
      case 'today':
        filtered = items.filter(item => {
          const itemDate = new Date(item.timestamp);
          return itemDate >= startOfToday;
        });
        break;
      case 'week':
        const oneWeekAgo = new Date(now);
        oneWeekAgo.setDate(now.getDate() - 7);
        filtered = items.filter(item => {
          const itemDate = new Date(item.timestamp);
          return itemDate >= oneWeekAgo;
        });
        break;
      case 'month':
        const oneMonthAgo = new Date(now);
        oneMonthAgo.setMonth(now.getMonth() - 1);
        filtered = items.filter(item => {
          const itemDate = new Date(item.timestamp);
          return itemDate >= oneMonthAgo;
        });
        break;
      default: // 'all'
        filtered = [...items];
    }
    
    setFilteredItems(filtered);
    calculateSummary(filtered);
  };

  const handleDelete = (id) => {
    Alert.alert(
      "Delete Item",
      "Are you sure you want to delete this food entry?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            const success = await deleteFoodFromHistory(id);
            if (success) {
              loadHistory();
            } else {
              Alert.alert("Error", "Failed to delete item");
            }
          }
        }
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      "Clear History",
      "Are you sure you want to delete ALL food entries? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Clear All", 
          style: "destructive",
          onPress: async () => {
            const success = await clearFoodHistory();
            if (success) {
              loadHistory();
            } else {
              Alert.alert("Error", "Failed to clear history");
            }
          }
        }
      ]
    );
  };

  const renderHistoryItem = ({ item }) => (
    <View style={styles.historyCard}>
      <Image 
        source={{ uri: item.imageUri }} 
        style={styles.foodImage}
        defaultSource={require('../../assets/images/placeholder-food.png')} // Add a placeholder image to your assets
      />
      <View style={styles.foodInfo}>
        <Text style={styles.foodName}>{item.foodData.foodName}</Text>
        <Text style={styles.calorieText}>{item.foodData.calories} calories</Text>
        <Text style={styles.macrosText}>
          P: {item.foodData.macros.protein}g | C: {item.foodData.macros.carbs}g | F: {item.foodData.macros.fat}g
        </Text>
        <Text style={styles.portionText}>Portion: {item.foodData.portionSize}</Text>
        <Text style={styles.dateText}>{formatDate(item.timestamp)}</Text>
      </View>
      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={() => handleDelete(item.id)}
      >
        <Text style={styles.deleteButtonText}>×</Text>
      </TouchableOpacity>
    </View>
  );

  const DateFilterButton = ({ title, filter }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        selectedDateFilter === filter && styles.filterButtonActive
      ]}
      onPress={() => applyDateFilter(filter)}
    >
      <Text 
        style={[
          styles.filterButtonText,
          selectedDateFilter === filter && styles.filterButtonTextActive
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Food History</Text>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.newScanButton}
          onPress={() => router.push('/(tabs)/calories')}
        >
          <Text style={styles.buttonText}>New Scan</Text>
        </TouchableOpacity>
        
        {historyItems.length > 0 && (
          <TouchableOpacity 
            style={styles.clearButton}
            onPress={handleClearAll}
          >
            <Text style={styles.buttonText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {historyItems.length > 0 && (
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <DateFilterButton title="All Time" filter="all" />
            <DateFilterButton title="Today" filter="today" />
            <DateFilterButton title="Last 7 Days" filter="week" />
            <DateFilterButton title="Last 30 Days" filter="month" />
          </ScrollView>
        </View>
      )}

      {filteredItems.length > 0 && (
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Summary</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{summary.totalCalories.toFixed(0)}</Text>
              <Text style={styles.summaryLabel}>Calories</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{summary.totalProtein.toFixed(1)}g</Text>
              <Text style={styles.summaryLabel}>Protein</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{summary.totalCarbs.toFixed(1)}g</Text>
              <Text style={styles.summaryLabel}>Carbs</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{summary.totalFat.toFixed(1)}g</Text>
              <Text style={styles.summaryLabel}>Fat</Text>
            </View>
          </View>
        </View>
      )}

      {isLoading ? (
        <View style={styles.emptyContainer}>
          <Text>Loading history...</Text>
        </View>
      ) : filteredItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {historyItems.length === 0 
              ? "No food history yet" 
              : `No entries found for the selected time period`}
          </Text>
          <Text style={styles.emptySubtext}>
            {historyItems.length === 0 
              ? "Take a photo of your food to analyze and save it to your history"
              : "Try selecting a different time filter"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          renderItem={renderHistoryItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginTop: Constants.statusBarHeight,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  newScanButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
  },
  clearButton: {
    backgroundColor: '#F44336',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  filterContainer: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  filterButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: 'white',
  },
  summaryContainer: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
  },
  historyCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  foodImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  calorieText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 4,
  },
  macrosText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  portionText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  dateText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  deleteButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F44336',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default FoodHistoryScreen;