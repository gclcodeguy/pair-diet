#!/usr/bin/env node

// Full Open Food Facts Database Import Script
// Imports the entire OFF database directly into Supabase for maximum performance

import fs from 'fs';
import csv from 'csv-parser';
import { createClient } from '@supabase/supabase-js';

// Supabase config - using service role key for admin operations
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

class DatabaseImporter {
  constructor() {
    this.totalProcessed = 0;
    this.totalInserted = 0;
    this.totalSkipped = 0;
    this.errors = [];
    this.batchSize = 1000; // Insert in batches for performance
    this.currentBatch = [];
    this.csvFilePath = './en.openfoodfacts.org.products.csv';
  }

  async importDatabase() {
    console.log('🚀 Starting full database import...');
    console.log(`📁 Reading from: ${this.csvFilePath}`);

    // Check if file exists
    if (!fs.existsSync(this.csvFilePath)) {
      console.error(`❌ CSV file not found: ${this.csvFilePath}`);
      console.log('Please download it first:');
      console.log('curl -O https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz');
      console.log('gzip -d en.openfoodfacts.org.products.csv.gz');
      process.exit(1);
    }

    // Start processing
    const startTime = Date.now();

    try {
      await this.processCSV();
      
      // Insert any remaining batch
      if (this.currentBatch.length > 0) {
        await this.insertBatch();
      }

      this.printSummary(startTime);

    } catch (error) {
      console.error('❌ Import failed:', error);
      process.exit(1);
    }
  }

  async processCSV() {
    return new Promise((resolve, reject) => {
      const stream = fs.createReadStream(this.csvFilePath, { encoding: 'utf8' })
        .pipe(csv({ separator: '\t' })) // OFF uses tab-separated values
        .on('data', async (row) => {
          try {
            // Pause stream while processing to control memory usage
            stream.pause();
            
            await this.processRow(row);
            
            // Resume stream
            stream.resume();
            
          } catch (error) {
            console.error('Row processing error:', error);
            this.errors.push({ row: this.totalProcessed, error: error.message });
          }
        })
        .on('end', () => {
          console.log('\n✅ Finished reading CSV file');
          resolve();
        })
        .on('error', (error) => {
          console.error('CSV reading error:', error);
          reject(error);
        });
    });
  }

  async processRow(row) {
    this.totalProcessed++;

    // Progress indicator
    if (this.totalProcessed % 10000 === 0) {
      console.log(`📊 Processed ${this.totalProcessed.toLocaleString()} products...`);
    }

    // Skip products without essential data
    if (!row.code || !row.product_name || !this.hasNutritionData(row)) {
      this.totalSkipped++;
      return;
    }

    // Format product for our cache table
    const product = this.formatProduct(row);
    
    if (product) {
      this.currentBatch.push(product);
      
      // Insert batch when it reaches the limit
      if (this.currentBatch.length >= this.batchSize) {
        await this.insertBatch();
      }
    } else {
      this.totalSkipped++;
    }
  }

  hasNutritionData(row) {
    // Only include products with at least calories
    return row['energy-kcal_100g'] || row['energy_100g'];
  }

  formatProduct(row) {
    try {
      // Extract nutritional data
      const calories = this.parseFloat(row['energy-kcal_100g']) || 
                      (this.parseFloat(row['energy_100g']) / 4.184) || 0; // Convert kJ to kcal if needed
      
      const protein = this.parseFloat(row['proteins_100g']) || 0;
      const carbs = this.parseFloat(row['carbohydrates_100g']) || 0;
      const fat = this.parseFloat(row['fat_100g']) || 0;
      const fiber = this.parseFloat(row['fiber_100g']) || 0;
      const sugar = this.parseFloat(row['sugars_100g']) || 0;
      const sodium = this.parseFloat(row['sodium_100g']) * 1000 || 0; // Convert to mg

      // Calculate data quality score
      const quality = this.calculateDataQuality(row);
      
      // Get popularity score (number of scans)
      const popularity = this.parseInt(row['unique_scans_n']) || 0;

      // Clean up names and categories
      const foodName = this.cleanText(row.product_name);
      const brand = this.cleanText(row.brands?.split(',')[0]);
      const category = this.cleanText(row.categories?.split(',')[0]);

      // Generate search terms
      const searchTerms = this.generateSearchTerms(foodName, brand, category);

      return {
        food_id: row.code,
        barcode: row.code,
        food_name: foodName,
        brand: brand,
        category: category,
        calories: Math.round(calories),
        protein: protein,
        carbs: carbs,
        fat: fat,
        fiber: fiber,
        sugar: sugar,
        sodium: sodium,
        serving_size: 100, // OFF data is per 100g
        serving_unit: 'g',
        data_source: 'openfoodfacts',
        data_quality: quality,
        popularity_score: popularity,
        search_terms: searchTerms,
        last_updated: new Date().toISOString(),
        created_at: new Date().toISOString()
      };

    } catch (error) {
      console.error('Product formatting error:', error);
      return null;
    }
  }

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
    return text.trim().replace(/\s+/g, ' ').substring(0, 255); // Limit length
  }

  calculateDataQuality(row) {
    let score = 0;
    const maxScore = 10;

    // Basic info
    if (row.product_name) score += 2;
    if (row.brands) score += 1;
    if (row.categories) score += 1;

    // Nutritional completeness
    if (row['energy-kcal_100g'] || row['energy_100g']) score += 2;
    if (row['proteins_100g']) score += 1;
    if (row['carbohydrates_100g']) score += 1;
    if (row['fat_100g']) score += 1;
    if (row['fiber_100g']) score += 0.5;
    if (row['sugars_100g']) score += 0.5;

    return Math.min(score / maxScore, 1.0);
  }

  generateSearchTerms(name, brand, category) {
    const terms = [];
    
    if (name) {
      terms.push(name);
      terms.push(...name.toLowerCase().split(/\s+/).filter(word => word.length > 2));
    }
    
    if (brand) terms.push(brand);
    if (category) terms.push(category);
    
    return [...new Set(terms)].join(' ');
  }

  async insertBatch() {
    try {
      const { data, error } = await supabase
        .from('cached_foods')
        .upsert(this.currentBatch, {
          onConflict: 'food_id',
          ignoreDuplicates: false
        });

      if (error) {
        console.error('Batch insertion error:', error);
        this.errors.push({ type: 'batch', size: this.currentBatch.length, error: error.message });
      } else {
        this.totalInserted += this.currentBatch.length;
        console.log(`✅ Inserted batch of ${this.currentBatch.length} products (Total: ${this.totalInserted.toLocaleString()})`);
      }

    } catch (error) {
      console.error('Batch insertion error:', error);
      this.errors.push({ type: 'batch', size: this.currentBatch.length, error: error.message });
    }

    // Clear the batch
    this.currentBatch = [];
  }

  printSummary(startTime) {
    const duration = (Date.now() - startTime) / 1000 / 60; // minutes

    console.log('\n🎉 DATABASE IMPORT COMPLETE!');
    console.log('================================');
    console.log(`⏱️  Duration: ${duration.toFixed(1)} minutes`);
    console.log(`📊 Total processed: ${this.totalProcessed.toLocaleString()}`);
    console.log(`✅ Total inserted: ${this.totalInserted.toLocaleString()}`);
    console.log(`⚠️  Total skipped: ${this.totalSkipped.toLocaleString()}`);
    console.log(`❌ Total errors: ${this.errors.length}`);
    console.log(`🚀 Insert rate: ${Math.round(this.totalInserted / duration).toLocaleString()} products/minute`);

    if (this.errors.length > 0 && this.errors.length <= 10) {
      console.log('\n❌ ERRORS:');
      this.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.type}: ${error.error}`);
      });
    } else if (this.errors.length > 10) {
      console.log(`\n❌ ${this.errors.length} errors occurred (too many to display)`);
    }

    console.log('\n🎯 Your food cache is now ready for lightning-fast searches!');
  }
}

// Main execution
async function main() {
  const importer = new DatabaseImporter();
  await importer.importDatabase();
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Import script failed:', error);
    process.exit(1);
  });
}

export default DatabaseImporter;
