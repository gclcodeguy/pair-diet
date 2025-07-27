import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const LogFoodScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualFood, setManualFood] = useState('');
  const [manualCalories, setManualCalories] = useState('');
  const [selectedMeal, setSelectedMeal] = useState('breakfast');
  const [todayLog, setTodayLog] = useState([
    {
      id: 1,
      name: 'Oatmeal with berries',
      calories: 320,
      meal: 'breakfast',
      time: '8:30 AM',
    },
    {
      id: 2,
      name: 'Chicken salad',
      calories: 450,
      meal: 'lunch',
      time: '12:15 PM',
    },
  ]);

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

  const addFoodToLog = food => {
    const newFood = {
      id: Date.now(),
      name: food.name,
      calories: food.calories,
      meal: selectedMeal,
      time: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    setTodayLog([...todayLog, newFood]);
  };

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

  const renderLogItem = ({ item }) => (
    <View style={styles.logItem}>
      <View style={styles.logInfo}>
        <Text style={styles.logFoodName}>{item.name}</Text>
        <Text style={styles.logTime}>{item.time}</Text>
      </View>
      <Text style={styles.logCalories}>{item.calories} cal</Text>
    </View>
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

        {/* Meal selection */}
        <View style={styles.mealSection}>
          <Text style={styles.sectionTitle}>Select Meal</Text>
          <View style={styles.mealButtons}>{meals.map(renderMealButton)}</View>
        </View>

        {/* Today's Log */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Log</Text>
            <Text style={styles.remainingCalories}>
              {remainingCalories > 0
                ? `${remainingCalories} remaining`
                : `${Math.abs(remainingCalories)} over`}
            </Text>
          </View>
          <FlatList
            data={todayLog}
            renderItem={renderLogItem}
            keyExtractor={item => item.id.toString()}
            scrollEnabled={false}
          />
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
              onPress={() => {
                if (manualFood && manualCalories) {
                  addFoodToLog({
                    name: manualFood,
                    calories: parseInt(manualCalories),
                  });
                  setManualFood('');
                  setManualCalories('');
                  setShowManualEntry(false);
                }
              }}
            >
              <Text style={styles.addFoodButtonText}>Add to Log</Text>
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
});

export default LogFoodScreen;
