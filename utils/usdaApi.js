// USDA FoodData Central API Service
// Documentation: https://fdc.nal.usda.gov/api-guide

const USDA_API_BASE_URL = 'https://api.nal.usda.gov/fdc/v1';
const USDA_API_KEY = process.env.EXPO_PUBLIC_USDA_API_KEY || 'DEMO_KEY'; // Replace with your API key

class USDAFoodAPI {
  constructor() {
    this.baseURL = USDA_API_BASE_URL;
    this.apiKey = USDA_API_KEY;
  }

  // Search for foods by query
  async searchFoods(query, options = {}) {
    try {
      const params = new URLSearchParams({
        api_key: this.apiKey,
        query: query,
        pageSize: options.pageSize || 10, // Reduced to avoid rate limits
        dataType: options.dataType || ['Foundation', 'SR Legacy'], // Focus on whole foods
        sortBy: options.sortBy || 'dataType.keyword',
        sortOrder: options.sortOrder || 'asc'
      });

      const response = await fetch(`${this.baseURL}/foods/search?${params}`);
      
      if (!response.ok) {
        throw new Error(`USDA API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Fetch detailed information for each food to get nutrition data
      const detailedFoods = await Promise.all(
        data.foods.slice(0, 5).map(async (food) => { // Limit to 5 to avoid rate limits
          try {
            return await this.getFoodDetails(food.fdcId);
          } catch (error) {
            console.error(`Error fetching details for ${food.fdcId}:`, error);
            // Return basic food info if detailed fetch fails
            return this.formatSearchResults({ foods: [food] })[0];
          }
        })
      );

      return detailedFoods;
    } catch (error) {
      console.error('USDA API search error:', error);
      throw error;
    }
  }

  // Get detailed food information by FDC ID
  async getFoodDetails(fdcId) {
    try {
      const params = new URLSearchParams({
        api_key: this.apiKey
      });

      const response = await fetch(`${this.baseURL}/food/${fdcId}?${params}`);
      
      if (!response.ok) {
        throw new Error(`USDA API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return this.formatFoodDetails(data);
    } catch (error) {
      console.error('USDA API details error:', error);
      throw error;
    }
  }

  // Format search results for the app
  formatSearchResults(data) {
    if (!data.foods || !Array.isArray(data.foods)) {
      return [];
    }

    return data.foods.map(food => ({
      id: food.fdcId,
      name: food.description,
      brand: food.brandOwner || null,
      category: food.dataType,
      calories: this.extractNutrient(food, 'Energy'),
      protein: this.extractNutrient(food, 'Protein'),
      carbs: this.extractNutrient(food, 'Carbohydrate, by difference'),
      fat: this.extractNutrient(food, 'Total lipid (fat)'),
      fiber: this.extractNutrient(food, 'Fiber, total dietary'),
      servingSize: food.servingSize || null,
      servingUnit: food.servingUnit || null,
      dataType: food.dataType
    }));
  }

  // Format detailed food information
  formatFoodDetails(food) {
    // Debug: Log the first few nutrients to see what's available
    if (food.foodNutrients && food.foodNutrients.length > 0) {
      console.log(`Food: ${food.description}`);
      console.log('Available nutrients:', food.foodNutrients.slice(0, 3).map(n => 
        `${n.nutrient?.name}: ${n.amount} ${n.nutrient?.unitName}`
      ));
    }

    // Extract serving size - USDA often provides this in different formats
    let servingSize = 100; // Default to 100g
    if (food.servingSize) {
      servingSize = food.servingSize;
    } else if (food.householdServingFullText) {
      // Try to extract grams from household serving text
      const gramMatch = food.householdServingFullText.match(/(\d+)\s*g/);
      if (gramMatch) {
        servingSize = parseInt(gramMatch[1]);
      }
    }

    return {
      id: food.fdcId,
      name: food.description,
      brand: food.brandOwner || null,
      category: food.dataType,
      calories: this.extractNutrient(food, 'Energy'),
      protein: this.extractNutrient(food, 'Protein'),
      carbs: this.extractNutrient(food, 'Carbohydrate, by difference'),
      fat: this.extractNutrient(food, 'Total lipid (fat)'),
      fiber: this.extractNutrient(food, 'Fiber, total dietary'),
      servingSize: servingSize,
      servingUnit: food.servingUnit || 'g',
      dataType: food.dataType,
      nutrients: food.foodNutrients || [],
      nutritionScores: this.calculateNutritionScores({
        protein: this.extractNutrient(food, 'Protein'),
        carbs: this.extractNutrient(food, 'Carbohydrate, by difference'),
        fat: this.extractNutrient(food, 'Total lipid (fat)'),
        servingSize: servingSize
      })
    };
  }

  // Calculate nutrition scores and colors based on macro percentages
  calculateNutritionScores(food) {
    const totalWeight = food.servingSize || 100;
    const proteinPercent = (food.protein / totalWeight) * 100;
    const carbsPercent = (food.carbs / totalWeight) * 100;
    const fatPercent = (food.fat / totalWeight) * 100;
    const caloriesPerGram = food.calories / totalWeight;

    // Define thresholds for color coding
    const getProteinColor = (percent) => {
      if (percent >= 20) return '#34C759'; // Green - high protein is good
      if (percent >= 10) return '#FF9500'; // Amber - moderate protein
      return '#FF3B30'; // Red - low protein is bad
    };

    const getCarbsColor = (percent) => {
      if (percent >= 60) return '#FF3B30'; // Red - high carbs are bad
      if (percent >= 30) return '#FF9500'; // Amber - moderate carbs
      return '#34C759'; // Green - low carbs are good
    };

    const getFatColor = (percent) => {
      if (percent >= 40) return '#FF3B30'; // Red - high fat is bad
      if (percent >= 20) return '#FF9500'; // Amber - moderate fat
      return '#34C759'; // Green - low fat is good
    };

    const getCaloriesColor = (caloriesPerGram) => {
      if (caloriesPerGram <= 2.0) return '#34C759'; // Green - low calorie density is good (lettuce, vegetables)
      if (caloriesPerGram <= 4.0) return '#FF9500'; // Amber - moderate calorie density (chicken, most foods)
      return '#FF3B30'; // Red - high calorie density is bad (oils, nuts, processed foods)
    };

    return {
      protein: {
        percent: proteinPercent,
        color: getProteinColor(proteinPercent)
      },
      carbs: {
        percent: carbsPercent,
        color: getCarbsColor(carbsPercent)
      },
      fat: {
        percent: fatPercent,
        color: getFatColor(fatPercent)
      },
      calories: {
        perGram: caloriesPerGram,
        color: getCaloriesColor(caloriesPerGram)
      }
    };
  }

  // Extract nutrient value from food data
  extractNutrient(food, nutrientName) {
    if (!food.foodNutrients || !Array.isArray(food.foodNutrients)) {
      return 0;
    }

    // Handle different energy unit names
    if (nutrientName.toLowerCase().includes('energy')) {
      const energyNutrient = food.foodNutrients.find(n => 
        n.nutrient && n.nutrient.name && 
        (n.nutrient.name.toLowerCase().includes('energy') || 
         n.nutrient.name.toLowerCase().includes('calories'))
      );
      
      if (energyNutrient) {
        const amount = parseFloat(energyNutrient.amount) || 0;
        // Convert to calories if needed (USDA often provides kcal)
        return amount;
      }
    }

    // Handle other nutrients
    const nutrient = food.foodNutrients.find(n => 
      n.nutrient && n.nutrient.name && 
      n.nutrient.name.toLowerCase().includes(nutrientName.toLowerCase())
    );

    return nutrient ? parseFloat(nutrient.amount) || 0 : 0;
  }

  // Get popular/common foods for quick access
  async getPopularFoods() {
    const commonFoods = [
      'apple', 'banana', 'chicken breast', 'rice', 'broccoli',
      'salmon', 'eggs', 'milk', 'bread', 'yogurt'
    ];

    const results = [];
    for (const food of commonFoods.slice(0, 5)) { // Limit to 5 to avoid rate limits
      try {
        const searchResults = await this.searchFoods(food, { pageSize: 1 });
        if (searchResults.length > 0) {
          results.push(searchResults[0]);
        }
      } catch (error) {
        console.error(`Error fetching ${food}:`, error);
      }
    }

    return results;
  }
}

export default new USDAFoodAPI(); 