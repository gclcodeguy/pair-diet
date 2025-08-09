#!/usr/bin/env node

// Extract 5K Most Popular & Whole Foods from Open Food Facts Database
// This script processes the full OFF database and extracts the best 5,000 foods

import fs from 'fs';
import csv from 'csv-parser';
import { createClient } from '@supabase/supabase-js';

// Supabase config
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables. Please set:');
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

// Foods we definitely want (whole foods)
const PRIORITY_WHOLE_FOODS = [
  'apple', 'banana', 'orange', 'strawberry', 'blueberry', 'grape', 'avocado',
  'broccoli', 'spinach', 'carrot', 'tomato', 'potato', 'onion', 'garlic',
  'chicken breast', 'salmon', 'tuna', 'ground beef', 'eggs', 'tofu',
  'milk', 'cheese', 'yogurt', 'butter', 'olive oil',
  'rice', 'oats', 'quinoa', 'bread', 'pasta',
  'almonds', 'walnuts', 'peanuts', 'black beans', 'lentils'
];

// Categories we want to prioritize
const GOOD_CATEGORIES = [
  'fruits', 'vegetables', 'meat', 'fish', 'seafood', 'poultry',
  'dairy', 'eggs', 'grains', 'cereals', 'nuts', 'legumes', 'oils'
];

// Categories we want to avoid (processed foods)
const AVOID_CATEGORIES = [
  'sodas', 'candy', 'cookies', 'chips', 'ice-cream', 'chocolate',
  'frozen-meals', 'ready-meals', 'fast-food'
];

class FoodExtractor {
  constructor() {
    this.allFoods = [];
    this.totalProcessed = 0;
    this.csvFilePath = './en.openfoodfacts.org.products.csv';
    this.targetCount = 5000;
  }

  async extract5KFoods() {
    console.log('🎯 Extracting 5,000 best foods from Open Food Facts database...');
    console.log(`📁 Reading from: ${this.csvFilePath}`);

    // Check if file exists
    if (!fs.existsSync(this.csvFilePath)) {
      console.error(`❌ CSV file not found: ${this.csvFilePath}`);
      console.log('\n📥 Please download it first:');
      console.log('1. Go to: https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz');
      console.log('2. Download the file to this folder');
      console.log('3. Extract it: gzip -d en.openfoodfacts.org.products.csv.gz');
      process.exit(1);
    }

    const startTime = Date.now();

    try {
      // Step 1: Read and analyze all foods
      console.log('\n📊 Step 1: Analyzing all foods...');
      await this.readAllFoods();

      // Step 2: Apply smart filtering and ranking
      console.log('\n🧠 Step 2: Applying smart filtering...');
      const selectedFoods = this.selectBest5K();

      // Step 3: Import to Supabase
      console.log('\n💾 Step 3: Importing to Supabase...');
      await this.importToSupabase(selectedFoods);

      this.printSummary(startTime, selectedFoods.length);

    } catch (error) {
      console.error('❌ Extraction failed:', error);
      process.exit(1);
    }
  }

  async readAllFoods() {
    return new Promise((resolve, reject) => {
      fs.createReadStream(this.csvFilePath, { encoding: 'utf8' })
        .pipe(csv({ separator: '\t' }))
        .on('data', (row) => {
          this.totalProcessed++;

          // Progress indicator
          if (this.totalProcessed % 50000 === 0) {
            console.log(`📊 Analyzed ${this.totalProcessed.toLocaleString()} products...`);
          }

          const food = this.analyzeFood(row);
          if (food) {
            this.allFoods.push(food);
          }
        })
        .on('end', () => {
          console.log(`✅ Finished analyzing ${this.totalProcessed.toLocaleString()} total products`);
          console.log(`📋 Found ${this.allFoods.length.toLocaleString()} foods with good nutrition data`);
          resolve();
        })
        .on('error', reject);
    });
  }

  analyzeFood(row) {
    // Skip if missing essential data
    if (!row.code || !row.product_name) return null;

    // Must have at least calories
    const calories = this.parseFloat(row['energy-kcal_100g']) || 
                    (this.parseFloat(row['energy_100g']) / 4.184) || 0;
    if (calories === 0) return null;

    // Extract data
    const foodName = this.cleanText(row.product_name);
    const brand = this.cleanText(row.brands?.split(',')[0]);
    const categories = row.categories || '';
    const ingredients = row.ingredients_text || '';
    const popularityScore = this.parseInt(row['unique_scans_n']) || 0;

    // Calculate scores
    const wholeFoodScore = this.calculateWholeFoodScore(foodName, categories, ingredients);
    const popularityRank = popularityScore;
    const dataQuality = this.calculateDataQuality(row);

    // Only keep foods with decent scores
    if (wholeFoodScore === 0 && popularityRank < 10) return null;
    if (dataQuality < 0.3) return null;

    return {
      food_id: row.code,
      barcode: row.code,
      food_name: foodName,
      brand: brand,
      category: this.extractMainCategory(categories),
      calories: Math.round(calories),
      protein: this.parseFloat(row['proteins_100g']) || 0,
      carbs: this.parseFloat(row['carbohydrates_100g']) || 0,
      fat: this.parseFloat(row['fat_100g']) || 0,
      fiber: this.parseFloat(row['fiber_100g']) || 0,
      sugar: this.parseFloat(row['sugars_100g']) || 0,
      sodium: (this.parseFloat(row['sodium_100g']) * 1000) || 0,
      serving_size: 100,
      serving_unit: 'g',
      data_source: 'openfoodfacts',
      data_quality: dataQuality,
      popularity_score: popularityRank,
      search_terms: this.generateSearchTerms(foodName, brand),
      // Scoring for ranking
      wholeFoodScore: wholeFoodScore,
      totalScore: (wholeFoodScore * 0.4) + (Math.log(popularityRank + 1) * 0.3) + (dataQuality * 0.3)
    };
  }

  calculateWholeFoodScore(name, categories, ingredients) {
    let score = 0;
    const nameLower = name.toLowerCase();
    const categoriesLower = categories.toLowerCase();

    // Priority whole foods get highest score
    const isPriorityFood = PRIORITY_WHOLE_FOODS.some(food => 
      nameLower.includes(food) || nameLower === food
    );
    if (isPriorityFood) score += 10;

    // Good categories get bonus points
    const hasGoodCategory = GOOD_CATEGORIES.some(cat => categoriesLower.includes(cat));
    if (hasGoodCategory) score += 5;

    // Avoid processed foods
    const hasBadCategory = AVOID_CATEGORIES.some(cat => categoriesLower.includes(cat));
    if (hasBadCategory) score -= 8;

    // Simple name = more likely whole food
    const wordCount = name.split(' ').length;
    if (wordCount <= 2) score += 3;
    else if (wordCount <= 4) score += 1;
    else score -= 2;

    // Fewer ingredients = more whole food
    if (ingredients) {
      const ingredientCount = ingredients.split(',').length;
      if (ingredientCount === 1) score += 5;
      else if (ingredientCount <= 3) score += 2;
      else if (ingredientCount <= 5) score += 0;
      else score -= 3;
    }

    // No brand = more likely whole food
    if (!name.match(/[®™©]/)) score += 2;

    return Math.max(0, score);
  }

  selectBest5K() {
    console.log(`🔍 Selecting best ${this.targetCount} foods from ${this.allFoods.length.toLocaleString()} candidates...`);

    // Sort by total score (descending)
    this.allFoods.sort((a, b) => b.totalScore - a.totalScore);

    // Take top 5K
    const selected = this.allFoods.slice(0, this.targetCount);

    // Log some stats
    const wholeFoodCount = selected.filter(f => f.wholeFoodScore >= 5).length;
    const popularCount = selected.filter(f => f.popularity_score >= 100).length;
    const avgQuality = selected.reduce((sum, f) => sum + f.data_quality, 0) / selected.length;

    console.log(`✅ Selected ${selected.length} foods:`);
    console.log(`   🥬 Whole foods: ${wholeFoodCount} (${Math.round(wholeFoodCount/selected.length*100)}%)`);
    console.log(`   🔥 Popular foods: ${popularCount} (${Math.round(popularCount/selected.length*100)}%)`);
    console.log(`   📊 Avg quality: ${avgQuality.toFixed(2)}`);

    // Remove scoring fields before database insert
    return selected.map(food => {
      const { wholeFoodScore, totalScore, ...cleanFood } = food;
      return {
        ...cleanFood,
        last_updated: new Date().toISOString(),
        created_at: new Date().toISOString()
      };
    });
  }

  async importToSupabase(foods) {
    const batchSize = 1000;
    let inserted = 0;

    for (let i = 0; i < foods.length; i += batchSize) {
      const batch = foods.slice(i, i + batchSize);
      
      try {
        const { error } = await supabase
          .from('cached_foods')
          .upsert(batch, { onConflict: 'food_id' });

        if (error) {
          console.error('Batch insertion error:', error);
        } else {
          inserted += batch.length;
          console.log(`✅ Inserted ${inserted}/${foods.length} foods`);
        }

      } catch (error) {
        console.error('Supabase error:', error);
      }
    }

    return inserted;
  }

  // Helper methods
  parseFloat(value) {
    if (!value || value === '') return 0;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }

  parseInt(value) {
    if (!value || value === '') return 0;
    const parsed = parseInt(value);
    return isNaN(parsed) ? 0 : parsed;
  }

  cleanText(text) {
    if (!text) return null;
    return text.trim().replace(/\s+/g, ' ').substring(0, 255);
  }

  extractMainCategory(categories) {
    if (!categories) return null;
    const mainCat = categories.split(',')[0]?.split(':').pop()?.trim();
    return mainCat ? mainCat.substring(0, 100) : null;
  }

  calculateDataQuality(row) {
    let score = 0;
    const maxScore = 10;

    if (row.product_name) score += 2;
    if (row.brands) score += 1;
    if (row.categories) score += 1;
    if (row['energy-kcal_100g'] || row['energy_100g']) score += 2;
    if (row['proteins_100g']) score += 1;
    if (row['carbohydrates_100g']) score += 1;
    if (row['fat_100g']) score += 1;
    if (row['fiber_100g']) score += 0.5;
    if (row['sugars_100g']) score += 0.5;

    return Math.min(score / maxScore, 1.0);
  }

  generateSearchTerms(name, brand) {
    const terms = [];
    if (name) {
      terms.push(name);
      terms.push(...name.toLowerCase().split(/\s+/).filter(word => word.length > 2));
    }
    if (brand) terms.push(brand);
    return [...new Set(terms)].join(' ');
  }

  printSummary(startTime, importedCount) {
    const duration = (Date.now() - startTime) / 1000 / 60;

    console.log('\n🎉 EXTRACTION COMPLETE!');
    console.log('========================');
    console.log(`⏱️  Duration: ${duration.toFixed(1)} minutes`);
    console.log(`📊 Total analyzed: ${this.totalProcessed.toLocaleString()}`);
    console.log(`✅ Foods imported: ${importedCount.toLocaleString()}`);
    console.log(`🎯 Target achieved: ${importedCount >= this.targetCount ? 'YES' : 'NO'}`);
    console.log('\n🚀 Your food cache is ready with the best 5K foods!');
  }
}

// Main execution
async function main() {
  const extractor = new FoodExtractor();
  await extractor.extract5KFoods();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}

export default FoodExtractor;
