import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  FlatList,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SwipeListView } from 'react-native-swipe-list-view';
import { supabase } from '../utils/supabase';
import usdaApi from '../utils/usdaApi';

const LogFoodScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualFood, setManualFood] = useState('');
  const [manualCalories, setManualCalories] = useState('');
  const [manualProtein, setManualProtein] = useState('');
  const [manualCarbs, setManualCarbs] = useState('');
  const [manualFat, setManualFat] = useState('');
  const [selectedMeal, setSelectedMeal] = useState('breakfast');
  const [todayLog, setTodayLog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const swipeListRef = useRef(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Get current user on component mount
  useEffect(() => {
    getCurrentUser();
  }, []);

  // Fetch food log when user or date changes
  useEffect(() => {
    if (user) {
      fetchFoodLog();
    }
  }, [user, selectedDate]);

  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    } catch (error) {
      console.error('Error getting user:', error);
    }
  };

  // Fetch food log for selected date from Supabase
  const fetchFoodLog = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const dateString = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      const { data, error } = await supabase
        .from('food_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('logged_date', dateString)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching food logs:', error);
        Alert.alert('Error', 'Failed to load food log');
      } else {
        setTodayLog(data || []);
      }
    } catch (error) {
      console.error('Error fetching food logs:', error);
      Alert.alert('Error', 'Failed to load food log');
    } finally {
      setLoading(false);
    }
  };

  // Group foods by meal type
  const groupFoodsByMeal = () => {
    const grouped = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: [],
    };

    todayLog.forEach(food => {
      if (grouped[food.meal_type]) {
        grouped[food.meal_type].push(food);
      }
    });

    return grouped;
  };

  // Calculate calories for each meal
  const calculateMealCalories = (mealFoods) => {
    return mealFoods.reduce((sum, food) => sum + food.calories, 0);
  };

  // Navigate to previous day
  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  // Navigate to next day
  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  // Go to today
  const goToToday = () => {
    setSelectedDate(new Date());
  };

  // Format date for display
  const formatDate = (date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  // Add food to log in Supabase
  const addFoodToLog = async (food) => {
    if (!user) {
      Alert.alert('Error', 'Please sign in to log food');
      return;
    }

    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      
      const { error } = await supabase
        .from('food_logs')
        .insert({
          user_id: user.id,
          food_name: food.name,
          calories: Math.round(food.calories),
          protein: Math.round(food.protein),
          carbs: Math.round(food.carbs),
          fat: Math.round(food.fat),
          fiber: Math.round(food.fiber),
          meal_type: selectedMeal,
          logged_date: today,
        });

      if (error) {
        console.error('Error adding food log:', error);
        Alert.alert('Error', 'Failed to log food');
      } else {
        // Refresh the food log
        fetchFoodLog();
        Alert.alert('Success', 'Food logged successfully!');
      }
    } catch (error) {
      console.error('Error adding food log:', error);
      Alert.alert('Error', 'Failed to log food');
    } finally {
      setLoading(false);
    }
  };

  // Add manual food entry
  const addManualFood = async () => {
    if (!user) {
      Alert.alert('Error', 'Please sign in to log food');
      return;
    }

    if (!manualFood.trim() || !manualCalories.trim()) {
      Alert.alert('Error', 'Please fill in food name and calories');
      return;
    }

    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      
      const { error } = await supabase
        .from('food_logs')
        .insert({
          user_id: user.id,
          food_name: manualFood.trim(),
          calories: parseInt(manualCalories) || 0,
          protein: parseInt(manualProtein) || 0,
          carbs: parseInt(manualCarbs) || 0,
          fat: parseInt(manualFat) || 0,
          fiber: 0, // Manual entries don't typically include fiber
          meal_type: selectedMeal,
          logged_date: today,
        });

      if (error) {
        console.error('Error adding manual food log:', error);
        Alert.alert('Error', 'Failed to log food');
      } else {
        // Clear form and refresh
        setManualFood('');
        setManualCalories('');
        setManualProtein('');
        setManualCarbs('');
        setManualFat('');
        setShowManualEntry(false);
        fetchFoodLog();
        Alert.alert('Success', 'Food logged successfully!');
      }
    } catch (error) {
      console.error('Error adding manual food log:', error);
      Alert.alert('Error', 'Failed to log food');
    } finally {
      setLoading(false);
    }
  };

  // Delete food log entry
  const deleteFoodLog = async (foodLogId) => {
    console.log('Attempting to delete food log:', foodLogId);
    try {
      setLoading(true);
      const { error } = await supabase
        .from('food_logs')
        .delete()
        .eq('id', foodLogId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting food log:', error);
        Alert.alert('Error', 'Failed to delete food log');
      } else {
        console.log('Successfully deleted food log:', foodLogId);
        // Immediately remove from local state for better UX
        setTodayLog(prevLog => prevLog.filter(item => item.id !== foodLogId));
        // Then refresh from server to ensure consistency
        fetchFoodLog();
      }
    } catch (error) {
      console.error('Error deleting food log:', error);
      Alert.alert('Error', 'Failed to delete food log');
    } finally {
      setLoading(false);
    }
  };

  // Search USDA foods
  const searchUSDAFoods = async (query) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      const results = await usdaApi.searchFoods(query, { pageSize: 10 });
      setSearchResults(results);
    } catch (error) {
      console.error('USDA search error:', error);
      Alert.alert('Search Error', 'Failed to search foods. Please try again.');
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Debounced search to avoid too many API calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        searchUSDAFoods(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 500); // 500ms delay

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Mock food database
  const foodDatabase = [
    { id: 1, name: 'Chicken Breast', calories: 165, category: 'protein' },
    { id: 2, name: 'Salmon', calories: 208, category: 'protein' },
    { id: 3, name: 'Oatmeal', calories: 150, category: 'grains' },
    { id: 4, name: 'Banana', calories: 105, category: 'fruit' },
    { id: 5, name: 'Greek Yogurt', calories: 130, category: 'dairy' },
    { id: 6, name: 'Brown Rice', calories: 110, category: 'grains' },
    { id: 7, name: 'Broccoli', calories: 55, category: 'vegetables' },
    { id: 8, name: 'Avocado', calories: 160, category: 'fats' },
  ];

  const filteredFood = foodDatabase.filter(food =>
    food.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const meals = [
    { id: 'breakfast', name: 'Breakfast', icon: 'sunny', color: '#FF9800' },
    { id: 'lunch', name: 'Lunch', icon: 'restaurant', color: '#4CAF50' },
    { id: 'dinner', name: 'Dinner', icon: 'moon', color: '#2196F3' },
    { id: 'snack', name: 'Snack', icon: 'cafe', color: '#9C27B0' },
  ];

  const totalCalories = todayLog.reduce((sum, item) => sum + item.calories, 0);
  const dailyGoal = 2000;
  const remainingCalories = dailyGoal - totalCalories;

  const renderFoodItem = ({ item }) => (
    <TouchableOpacity
      style={styles.foodItem}
      onPress={() => addFoodToLog(item)}
    >
      <View style={styles.foodInfo}>
        <Text style={styles.foodName}>{item.name}</Text>
        <Text style={styles.foodCategory}>{item.category}</Text>
      </View>
      <View style={styles.foodCalories}>
        <Text style={styles.caloriesText}>{item.calories} cal</Text>
        <Ionicons name="add-circle" size={20} color="#FF6B35" />
      </View>
    </TouchableOpacity>
  );

  const renderMealButton = meal => (
    <TouchableOpacity
      key={meal.id}
      style={[
        styles.mealButton,
        selectedMeal === meal.id && styles.mealButtonSelected,
      ]}
      onPress={() => setSelectedMeal(meal.id)}
    >
      <Ionicons
        name={meal.icon}
        size={20}
        color={selectedMeal === meal.id ? '#FFF' : meal.color}
      />
      <Text
        style={[
          styles.mealButtonText,
          selectedMeal === meal.id && styles.mealButtonTextSelected,
        ]}
      >
        {meal.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={[{ key: 'content' }]}
        renderItem={() => (
          <>
            {/* Header with calorie summary */}
            <View style={styles.header}>
              <View style={styles.calorieSummary}>
                <Text style={styles.calorieTitle}>Today's Calories</Text>
                <Text style={styles.calorieNumber}>{totalCalories}</Text>
                <Text style={styles.calorieGoal}>/ {dailyGoal} goal</Text>
              </View>
              <View style={styles.progressRing}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min((totalCalories / dailyGoal) * 100, 100)}%`,
                    },
                  ]}
                />
              </View>
            </View>

            {/* Date Selector */}
            <View style={styles.dateSelector}>
              <TouchableOpacity onPress={goToPreviousDay} disabled={loading}>
                <Ionicons name="chevron-back" size={24} color="#8E8E93" />
              </TouchableOpacity>
              <View style={styles.dateSelectorCenter}>
                <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
                <TouchableOpacity onPress={goToToday} disabled={loading}>
                  <Text style={styles.todayButton}>Today</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={goToNextDay} disabled={loading}>
                <Ionicons name="chevron-forward" size={24} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            {/* Meal selection - Moved above search */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Meal</Text>
              <View style={styles.mealButtons}>{meals.map(renderMealButton)}</View>
            </View>

            {/* Search Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Search Food</Text>
                <TouchableOpacity
                  style={styles.manualEntryButton}
                  onPress={() => setShowManualEntry(true)}
                >
                  <Text style={styles.manualEntryText}>+ Manual Entry</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search for food..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              {searchQuery.length > 0 && (
                <View style={styles.searchResults}>
                  {searchLoading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color="#FF6B35" />
                      <Text style={styles.loadingText}>Searching USDA database...</Text>
                    </View>
                  ) : searchResults.length > 0 ? (
                    <View style={styles.searchResultsList}>
                      {searchResults.map((food, index) => (
                        <TouchableOpacity
                          key={food.id || index}
                          style={styles.searchResultItem}
                          onPress={() => {
                            addFoodToLog({
                              name: food.name,
                              calories: food.calories,
                              protein: food.protein,
                              carbs: food.carbs,
                              fat: food.fat,
                              fiber: food.fiber,
                              brand: food.brand,
                              category: food.category
                            });
                            setSearchQuery('');
                            setSearchResults([]);
                          }}
                        >
                          <View style={styles.searchResultInfo}>
                            <Text style={styles.searchResultName}>{food.name}</Text>
                            <View style={styles.nutritionRow}>
                              <Text style={styles.nutritionText}>
                                {food.servingSize || 100}g
                              </Text>
                              <View style={styles.macroContainer}>
                                <Text style={[styles.macroText, { color: food.nutritionScores?.protein?.color || '#8E8E93' }]}>
                                  P: {Math.round(food.protein)}g
                                </Text>
                                <Text style={[styles.macroText, { color: food.nutritionScores?.carbs?.color || '#8E8E93' }]}>
                                  C: {Math.round(food.carbs)}g
                                </Text>
                                <Text style={[styles.macroText, { color: food.nutritionScores?.fat?.color || '#8E8E93' }]}>
                                  F: {Math.round(food.fat)}g
                                </Text>
                                <Text style={[styles.macroText, { color: food.nutritionScores?.calories?.color || '#8E8E93' }]}>
                                  {Math.round(food.calories)} cal
                                </Text>
                              </View>
                            </View>
                            {food.brand && (
                              <Text style={styles.searchResultBrand}>{food.brand}</Text>
                            )}
                            <Text style={styles.searchResultCategory}>{food.category}</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : searchQuery.trim().length >= 2 ? (
                    <View style={styles.emptySearchState}>
                      <Ionicons name="search-outline" size={24} color="#8E8E93" />
                      <Text style={styles.emptySearchText}>No foods found</Text>
                      <Text style={styles.emptySearchSubtext}>Try a different search term</Text>
                    </View>
                  ) : null}
                </View>
              )}
            </View>

            {/* Food Log by Meal */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Food Log</Text>
                <Text style={styles.remainingCalories}>
                  {remainingCalories > 0
                    ? `${remainingCalories} remaining`
                    : `${Math.abs(remainingCalories)} over`}
                </Text>
              </View>
              
              {Object.entries(groupFoodsByMeal()).map(([mealType, foods]) => {
                if (foods.length === 0) return null;
                
                const mealCalories = calculateMealCalories(foods);
                const mealInfo = meals.find(m => m.id === mealType);
                
                return (
                  <View key={mealType} style={styles.mealGroup}>
                    <View style={styles.mealGroupHeader}>
                      <View style={styles.mealGroupTitle}>
                        <Ionicons 
                          name={mealInfo?.icon || 'restaurant'} 
                          size={20} 
                          color={mealInfo?.color || '#8E8E93'} 
                        />
                        <Text style={styles.mealGroupName}>
                          {mealInfo?.name || mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                        </Text>
                      </View>
                      <Text style={styles.mealGroupCalories}>{mealCalories} cal</Text>
                    </View>
                    
                    <SwipeListView
                      ref={swipeListRef}
                      data={foods}
                      renderItem={(data, index) => (
                        <View style={styles.logItemCard}>
                          <View style={styles.logItemInfo}>
                            <Text style={styles.logFoodName}>{data.item.food_name}</Text>
                            <View style={styles.logNutritionRow}>
                              <Text style={styles.logNutritionText}>
                                {data.item.serving_size || 100}g
                              </Text>
                              <View style={styles.logMacroContainer}>
                                <Text style={[styles.logMacroText, { color: data.item.protein > 10 ? '#34C759' : data.item.protein > 5 ? '#FF9500' : '#FF3B30' }]}>
                                  P: {data.item.protein || 0}g
                                </Text>
                                <Text style={[styles.logMacroText, { color: data.item.carbs > 30 ? '#FF3B30' : data.item.carbs > 15 ? '#FF9500' : '#34C759' }]}>
                                  C: {data.item.carbs || 0}g
                                </Text>
                                <Text style={[styles.logMacroText, { color: data.item.fat > 20 ? '#FF3B30' : data.item.fat > 10 ? '#FF9500' : '#34C759' }]}>
                                  F: {data.item.fat || 0}g
                                </Text>
                                <Text style={[styles.logMacroText, { color: (data.item.calories / (data.item.serving_size || 100)) <= 2.0 ? '#34C759' : (data.item.calories / (data.item.serving_size || 100)) <= 4.0 ? '#FF9500' : '#FF3B30' }]}>
                                  {data.item.calories} cal
                                </Text>
                              </View>
                            </View>
                            <Text style={styles.logTime}>
                              {new Date(data.item.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </Text>
                          </View>
                        </View>
                      )}
                      renderHiddenItem={(data, index) => (
                        <View style={styles.swipeDeleteButton}>
                          {/* Empty view - no visual delete button */}
                        </View>
                      )}
                      rightOpenValue={-100}
                      disableRightSwipe
                      keyExtractor={(item) => item.id.toString()}
                      showsVerticalScrollIndicator={false}
                      friction={2}
                      tension={40}
                      swipeToOpenPercent={30}
                      closeOnRowPress={true}
                      closeOnScroll={true}
                      onRowDidOpen={(rowKey, rowMap) => {
                        console.log('Row opened, deleting item:', rowKey);
                        deleteFoodLog(rowKey);
                        // Close the row after deletion using the rowMap
                        if (rowMap[rowKey]) {
                          rowMap[rowKey].closeRow();
                        }
                      }}
                    />
                  </View>
                );
              })}
              
              {todayLog.length === 0 && (
                <View style={styles.emptyState}>
                  <Ionicons name="restaurant-outline" size={48} color="#8E8E93" />
                  <Text style={styles.emptyStateText}>No food logged yet</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Start by adding some food to your log
                  </Text>
                </View>
              )}
            </View>
          </>
        )}
        keyExtractor={(item) => item.key}
        showsVerticalScrollIndicator={false}
      />

      {/* Manual Entry Modal */}
      <Modal
        visible={showManualEntry}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Manual Food Entry</Text>
            <TouchableOpacity onPress={() => setShowManualEntry(false)}>
              <Ionicons name="close" size={24} color="#8E8E93" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Food Name</Text>
              <TextInput
                style={styles.input}
                value={manualFood}
                onChangeText={setManualFood}
                placeholder="e.g., Homemade pasta"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Calories</Text>
              <TextInput
                style={styles.input}
                value={manualCalories}
                onChangeText={setManualCalories}
                placeholder="e.g., 350"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Protein (g)</Text>
              <TextInput
                style={styles.input}
                value={manualProtein}
                onChangeText={setManualProtein}
                placeholder="e.g., 25"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Carbs (g)</Text>
              <TextInput
                style={styles.input}
                value={manualCarbs}
                onChangeText={setManualCarbs}
                placeholder="e.g., 30"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Fat (g)</Text>
              <TextInput
                style={styles.input}
                value={manualFat}
                onChangeText={setManualFat}
                placeholder="e.g., 10"
                keyboardType="numeric"
              />
            </View>

            <TouchableOpacity
              style={styles.addFoodButton}
              onPress={addManualFood}
              disabled={loading}
            >
              <Text style={styles.addFoodButtonText}>
                {loading ? 'Logging...' : 'Add to Log'}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  addFoodButton: {
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    elevation: 8,
    marginTop: 20,
    paddingVertical: 16,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  addFoodButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  calorieGoal: {
    color: '#8E8E93',
    fontSize: 14,
  },
  calorieNumber: {
    color: '#1A1A1A',
    fontSize: 32,
    fontWeight: 'bold',
  },
  calorieSummary: {
    flex: 1,
  },
  calorieTitle: {
    color: '#8E8E93',
    fontSize: 14,
    marginBottom: 4,
  },
  caloriesText: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  container: {
    backgroundColor: '#F8F9FA',
    flex: 1,
  },
  dateSelector: {
    alignItems: 'center',
    backgroundColor: '#FFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  dateSelectorCenter: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  todayButton: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 10,
  },
  dateText: {
    color: '#1A1A1A',
    fontSize: 18,
    fontWeight: 'bold',
  },
  foodCalories: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  foodCategory: {
    color: '#8E8E93',
    fontSize: 12,
  },
  foodInfo: {
    flex: 1,
  },
  foodItem: {
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  foodList: {
    maxHeight: 300,
  },
  foodName: {
    color: '#1A1A1A',
    fontSize: 16,
    marginBottom: 2,
  },
  header: {
    alignItems: 'center',
    backgroundColor: '#FFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  input: {
    backgroundColor: '#FFF',
    borderColor: '#E5E5EA',
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    color: '#1A1A1A',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  logCalories: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logFoodName: {
    color: '#1A1A1A',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    lineHeight: 20,
  },
  logInfo: {
    flex: 1,
  },
  logItem: {
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  logActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  logTime: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 8,
  },
  manualButton: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  manualButtonText: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  mealButton: {
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderColor: '#E5E5EA',
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 12,
  },
  mealButtonSelected: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  mealButtonText: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  mealButtonTextSelected: {
    color: '#FFF',
  },
  mealButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  mealSection: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: '#F8F9FA',
    flex: 1,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  modalHeader: {
    alignItems: 'center',
    borderBottomColor: '#E5E5EA',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  modalTitle: {
    color: '#1A1A1A',
    fontSize: 20,
    fontWeight: 'bold',
  },
  progressFill: {
    backgroundColor: '#FF6B35',
    height: '100%',
  },
  progressRing: {
    backgroundColor: '#E5E5EA',
    borderRadius: 30,
    height: 60,
    overflow: 'hidden',
    width: 60,
  },
  remainingCalories: {
    color: '#8E8E93',
    fontSize: 14,
  },
  searchContainer: {
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderColor: '#E5E5EA',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    color: '#1A1A1A',
    flex: 1,
    fontSize: 16,
    height: 50,
  },
  section: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#1A1A1A',
    fontSize: 20,
    fontWeight: 'bold',
  },
  mealGroup: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
  },
  mealGroupHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  mealGroupTitle: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  mealGroupName: {
    color: '#1A1A1A',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  mealGroupCalories: {
    color: '#FF6B35',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    color: '#8E8E93',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 10,
  },
  emptyStateSubtext: {
    color: '#8E8E93',
    fontSize: 14,
    marginTop: 5,
  },
  swipeDeleteButton: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 8,
    justifyContent: 'center',
    width: 100,
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
  },
  searchResults: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginTop: 10,
    padding: 10,
    maxHeight: 300,
    overflow: 'hidden',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    color: '#8E8E93',
    fontSize: 14,
    marginTop: 10,
  },
  searchResultsList: {
    maxHeight: 280,
  },
  searchResultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    color: '#1A1A1A',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    lineHeight: 20,
  },
  searchResultBrand: {
    color: '#8E8E93',
    fontSize: 14,
  },
  searchResultCategory: {
    color: '#8E8E93',
    fontSize: 12,
  },
  searchResultCalories: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptySearchState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptySearchText: {
    color: '#8E8E93',
    fontSize: 16,
    marginTop: 10,
  },
  emptySearchSubtext: {
    color: '#8E8E93',
    fontSize: 14,
    marginTop: 5,
  },
  manualEntryButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  manualEntryText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  nutritionRow: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  nutritionText: {
    color: '#6C757D',
    fontSize: 13,
    fontWeight: '600',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DEE2E6',
    minWidth: 50,
  },
  macroContainer: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    flex: 1,
    justifyContent: 'flex-end',
  },
  macroText: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
    minWidth: 45,
    textAlign: 'center',
  },
  logItemCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logItemInfo: {
    flex: 1,
  },
  logNutritionRow: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  logNutritionText: {
    color: '#6C757D',
    fontSize: 13,
    fontWeight: '600',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DEE2E6',
    minWidth: 50,
  },
  logMacroContainer: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    flex: 1,
    justifyContent: 'flex-end',
  },
  logMacroText: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
    minWidth: 45,
    textAlign: 'center',
  },
});

export default LogFoodScreen;
