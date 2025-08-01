import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../utils/supabase';

const LogFoodScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualFood, setManualFood] = useState('');
  const [manualCalories, setManualCalories] = useState('');
  const [selectedMeal, setSelectedMeal] = useState('breakfast');
  const [todayLog, setTodayLog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

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
          calories: food.calories,
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
      Alert.alert('Error', 'Please fill in all fields');
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
          calories: parseInt(manualCalories),
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
    try {
      setLoading(true);
      const { error } = await supabase
        .from('food_logs')
        .delete()
        .eq('id', foodLogId)
        .eq('user_id', user.id); // Ensure user can only delete their own logs

      if (error) {
        console.error('Error deleting food log:', error);
        Alert.alert('Error', 'Failed to delete food log');
      } else {
        fetchFoodLog();
      }
    } catch (error) {
      console.error('Error deleting food log:', error);
      Alert.alert('Error', 'Failed to delete food log');
    } finally {
      setLoading(false);
    }
  };

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

  const renderLogItem = ({ item }) => {
    // Format the created_at time to show when it was logged
    const loggedTime = new Date(item.created_at).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <View style={styles.logItem}>
        <View style={styles.logInfo}>
          <Text style={styles.logFoodName}>{item.food_name}</Text>
          <Text style={styles.logTime}>{loggedTime}</Text>
        </View>
        <View style={styles.logActions}>
          <Text style={styles.logCalories}>{item.calories} cal</Text>
          <TouchableOpacity
            onPress={() => deleteFoodLog(item.id)}
            disabled={loading}
          >
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

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
      <ScrollView showsVerticalScrollIndicator={false}>
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
            <Ionicons name="chevron-left" size={24} color="#8E8E93" />
          </TouchableOpacity>
          <View style={styles.dateSelectorCenter}>
            <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
            <TouchableOpacity onPress={goToToday} disabled={loading}>
              <Text style={styles.todayButton}>Today</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={goToNextDay} disabled={loading}>
            <Ionicons name="chevron-right" size={24} color="#8E8E93" />
          </TouchableOpacity>
        </View>

        {/* Meal selection */}
        <View style={styles.mealSection}>
          <Text style={styles.sectionTitle}>Select Meal</Text>
          <View style={styles.mealButtons}>{meals.map(renderMealButton)}</View>
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
                
                {foods.map((food) => (
                  <View key={food.id} style={styles.logItem}>
                    <View style={styles.logInfo}>
                      <Text style={styles.logFoodName}>{food.food_name}</Text>
                      <Text style={styles.logTime}>
                        {new Date(food.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                    <View style={styles.logActions}>
                      <Text style={styles.logCalories}>{food.calories} cal</Text>
                      <TouchableOpacity
                        onPress={() => deleteFoodLog(food.id)}
                        disabled={loading}
                      >
                        <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
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

        {/* Search Food */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Search Food</Text>
            <TouchableOpacity
              style={styles.manualButton}
              onPress={() => setShowManualEntry(true)}
            >
              <Ionicons name="add" size={20} color="#FF6B35" />
              <Text style={styles.manualButtonText}>Manual Entry</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons
              name="search"
              size={20}
              color="#8E8E93"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for food..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <FlatList
            data={filteredFood}
            renderItem={renderFoodItem}
            keyExtractor={item => item.id.toString()}
            scrollEnabled={false}
            style={styles.foodList}
          />
        </View>
      </ScrollView>

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
    marginBottom: 2,
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
});

export default LogFoodScreen;
