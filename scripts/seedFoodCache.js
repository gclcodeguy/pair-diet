#!/usr/bin/env node

// Food Cache Seeding Script
// This script populates the cached_foods table with common foods from Open Food Facts
// Run with: node scripts/seedFoodCache.js

import { createClient } from '@supabase/supabase-js';
import openFoodFactsAPI from '../utils/openFoodFactsApi.js';

// Supabase config - using service role key for admin operations
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // You'll need to add this

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables. Please set:');
  console.error('- EXPO_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Common food categories to seed
const FOOD_CATEGORIES = [
  'fruits',
  'vegetables',
  'meat',
  'fish',
  'dairy',
  'eggs',
  'grains',
  'nuts',
  'legumes',
  'oils',
  'beverages',
  'snacks',
  'bread',
  'cereals',
  'pasta',
  'rice',
  'cheese',
  'yogurt',
  'milk',
  'chicken'
];

// Common whole foods to search for specifically
const COMMON_FOODS = [
  'apple', 'banana', 'orange', 'strawberry', 'blueberry', 'grape',
  'broccoli', 'spinach', 'carrot', 'tomato', 'potato', 'onion',
  'chicken breast', 'salmon', 'tuna', 'ground beef', 'pork',
  'eggs', 'milk', 'cheese', 'yogurt', 'butter',
  'bread', 'rice', 'pasta', 'oats', 'quinoa',
  'almonds', 'walnuts', 'peanuts', 'olive oil', 'avocado',
  'black beans', 'chickpeas', 'lentils', 'tofu',
  'water', 'coffee', 'tea', 'orange juice'
];

class FoodCacheSeeder {
  constructor() {
    this.totalAdded = 0;
    this.totalSkipped = 0;
    this.errors = [];
    this.rateLimitDelay = 6000; // 6 seconds between requests (10 req/min limit)
  }

  async seedCache() {
    console.log('🌱 Starting food cache seeding...');
    console.log(`📊 Planning to seed from ${FOOD_CATEGORIES.length} categories and ${COMMON_FOODS.length} specific foods`);

    try {
      // Step 1: Seed common whole foods
      console.log('\n🍎 Seeding common whole foods...');
      await this.seedCommonFoods();

      // Step 2: Seed most popular foods globally
      console.log('\n🔥 Seeding most popular foods...');
      await this.seedPopularFoods();

      // Step 3: Seed foods by category
      console.log('\n📂 Seeding foods by category...');
      await this.seedFoodsByCategory();

      // Step 4: Summary
      this.printSummary();

    } catch (error) {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    }
  }

  async seedCommonFoods() {
    for (let i = 0; i < COMMON_FOODS.length; i++) {
      const food = COMMON_FOODS[i];
      console.log(`🔍 Searching for "${food}" (${i + 1}/${COMMON_FOODS.length})`);

      try {
        await this.delay(this.rateLimitDelay);
        
        const results = await openFoodFactsAPI.searchFoods(food, { pageSize: 3 });
        
        if (results.length > 0) {
          await this.cacheFoods(results);
          console.log(`  ✅ Added ${results.length} items for "${food}"`);
        } else {
          console.log(`  ⚠️  No results for "${food}"`);
          this.totalSkipped++;
        }

      } catch (error) {
        console.error(`  ❌ Error searching for "${food}":`, error.message);
        this.errors.push({ food, error: error.message });
      }
    }
  }

  async seedPopularFoods() {
    console.log('🔍 Fetching globally popular foods by scan count...');
    
    try {
      await this.delay(this.rateLimitDelay);
      
      // Get top 100 most scanned products globally
      const results = await openFoodFactsAPI.getPopularFoods(100);
      
      if (results.length > 0) {
        await this.cacheFoods(results);
        console.log(`  ✅ Added ${results.length} popular foods`);
      } else {
        console.log(`  ⚠️  No popular foods found`);
        this.totalSkipped++;
      }

    } catch (error) {
      console.error(`  ❌ Error fetching popular foods:`, error.message);
      this.errors.push({ type: 'popular', error: error.message });
    }
  }

  async seedFoodsByCategory() {
    for (let i = 0; i < FOOD_CATEGORIES.length; i++) {
      const category = FOOD_CATEGORIES[i];
      console.log(`📂 Searching category "${category}" (${i + 1}/${FOOD_CATEGORIES.length})`);

      try {
        await this.delay(this.rateLimitDelay);
        
        const results = await openFoodFactsAPI.getFoodsByCategory(category, 10);
        
        if (results.length > 0) {
          await this.cacheFoods(results);
          console.log(`  ✅ Added ${results.length} items from "${category}"`);
        } else {
          console.log(`  ⚠️  No results for category "${category}"`);
          this.totalSkipped++;
        }

      } catch (error) {
        console.error(`  ❌ Error searching category "${category}":`, error.message);
        this.errors.push({ category, error: error.message });
      }
    }
  }

  async cacheFoods(foods) {
    if (!foods || foods.length === 0) return;

    try {
      // Prepare foods for insertion
      const foodsToInsert = foods.map(food => ({
        food_id: food.food_id,
        barcode: food.barcode || null,
        food_name: food.food_name,
        brand: food.brand || null,
        category: food.category || null,
        calories: food.calories || 0,
        protein: food.protein || 0,
        carbs: food.carbs || 0,
        fat: food.fat || 0,
        fiber: food.fiber || 0,
        sugar: food.sugar || 0,
        sodium: food.sodium || 0,
        serving_size: food.serving_size || 100,
        serving_unit: food.serving_unit || 'g',
        data_source: 'openfoodfacts',
        data_quality: food.data_quality || 1.0,
        popularity_score: 10, // Give seeded foods a boost
        search_terms: food.search_terms || food.food_name,
        last_updated: new Date().toISOString(),
        created_at: new Date().toISOString()
      }));

      // Insert with conflict resolution
      const { data, error } = await supabase
        .from('cached_foods')
        .upsert(foodsToInsert, {
          onConflict: 'food_id',
          ignoreDuplicates: false
        });

      if (error) {
        console.error('Database insertion error:', error);
        this.errors.push({ type: 'database', error: error.message });
        return;
      }

      this.totalAdded += foods.length;

    } catch (error) {
      console.error('Cache insertion error:', error);
      this.errors.push({ type: 'cache', error: error.message });
    }
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  printSummary() {
    console.log('\n📊 SEEDING SUMMARY');
    console.log('==================');
    console.log(`✅ Total foods added: ${this.totalAdded}`);
    console.log(`⚠️  Total skipped: ${this.totalSkipped}`);
    console.log(`❌ Total errors: ${this.errors.length}`);

    if (this.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.food || error.category || error.type}: ${error.error}`);
      });
    }

    console.log('\n🎉 Food cache seeding completed!');
  }

  // Get current cache statistics
  async getCacheStats() {
    try {
      const { data, error } = await supabase
        .from('cached_foods')
        .select('count(*)')
        .single();

      if (error) {
        console.error('Error getting cache stats:', error);
        return null;
      }

      return data.count;
    } catch (error) {
      console.error('Cache stats error:', error);
      return null;
    }
  }
}

// Main execution
async function main() {
  const seeder = new FoodCacheSeeder();
  
  // Check current cache size
  const currentCount = await seeder.getCacheStats();
  if (currentCount !== null) {
    console.log(`📊 Current cache contains ${currentCount} foods`);
    
    if (currentCount > 100) {
      console.log('⚠️  Cache already contains many foods. Continue? (Ctrl+C to cancel)');
      await seeder.delay(3000);
    }
  }

  await seeder.seedCache();
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}

export default FoodCacheSeeder;
