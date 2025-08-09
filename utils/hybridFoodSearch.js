// Hybrid Food Search Service
// Combines local cache with Open Food Facts API for optimal performance

import { supabase } from './supabase';
import openFoodFactsAPI from './openFoodFactsApi';

class HybridFoodSearch {
  constructor() {
    this.searchCache = new Map(); // In-memory cache for recent searches
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Main search function - checks cache first, then API
  async searchFoods(query, options = {}) {
    try {
      const limit = options.limit || 10;
      const cacheFirst = options.cacheFirst !== false; // Default to cache-first

      // Step 1: Search local cache
      let cacheResults = [];
      if (cacheFirst) {
        cacheResults = await this.searchCachedFoods(query, limit);
        
        // If we have enough good results from cache, return them
        if (cacheResults.length >= Math.min(limit, 5)) {
          return {
            results: cacheResults,
            source: 'cache',
            total: cacheResults.length
          };
        }
      }

      // Step 2: Search Open Food Facts API for additional results
      const remainingLimit = Math.max(limit - cacheResults.length, 5);
      const apiResults = await this.searchOpenFoodFacts(query, {
        limit: remainingLimit,
        ...options
      });

      // Step 3: Cache new results for future searches
      await this.cacheSearchResults(apiResults);

      // Step 4: Combine and deduplicate results
      const combinedResults = this.combineAndDeduplicateResults(
        cacheResults, 
        apiResults, 
        limit
      );

      return {
        results: combinedResults,
        source: cacheResults.length > 0 ? 'hybrid' : 'api',
        cacheHits: cacheResults.length,
        apiHits: apiResults.length,
        total: combinedResults.length
      };

    } catch (error) {
      console.error('Hybrid food search error:', error);
      
      // Fallback to cache-only search if API fails
      try {
        const fallbackResults = await this.searchCachedFoods(query, options.limit || 10);
        return {
          results: fallbackResults,
          source: 'cache_fallback',
          total: fallbackResults.length,
          error: error.message
        };
      } catch (fallbackError) {
        console.error('Cache fallback also failed:', fallbackError);
        throw new Error(`Search failed: ${error.message}`);
      }
    }
  }

  // Search local cached foods
  async searchCachedFoods(query, limit = 10) {
    try {
      const { data, error } = await supabase
        .rpc('search_cached_foods', {
          p_query: query,
          p_limit: limit
        });

      if (error) {
        console.error('Cache search error:', error);
        return [];
      }

      // Update popularity scores for found items
      if (data && data.length > 0) {
        // Don't await this - let it run in background
        this.updatePopularityScores(data.map(item => item.food_id));
      }

      return data || [];
    } catch (error) {
      console.error('Cache search error:', error);
      return [];
    }
  }

  // Search Open Food Facts API
  async searchOpenFoodFacts(query, options = {}) {
    try {
      // Check in-memory cache first
      const cacheKey = `off_${query}_${options.limit || 10}`;
      const cached = this.searchCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.results;
      }

      // Make API call
      const results = await openFoodFactsAPI.searchFoods(query, {
        pageSize: options.limit || 10
      });

      // Cache in memory
      this.searchCache.set(cacheKey, {
        results,
        timestamp: Date.now()
      });

      // Clean up old cache entries
      this.cleanupSearchCache();

      return results;
    } catch (error) {
      console.error('Open Food Facts API search error:', error);
      return [];
    }
  }

  // Search by barcode (cache first, then API)
  async searchByBarcode(barcode) {
    try {
      // Step 1: Check cache first
      const { data: cachedFood, error: cacheError } = await supabase
        .from('cached_foods')
        .select('*')
        .eq('barcode', barcode)
        .single();

      if (!cacheError && cachedFood) {
        // Update popularity
        this.updatePopularityScores([cachedFood.food_id]);
        return {
          result: cachedFood,
          source: 'cache'
        };
      }

      // Step 2: Search Open Food Facts API
      const apiResult = await openFoodFactsAPI.getFoodByBarcode(barcode);
      
      if (!apiResult) {
        return {
          result: null,
          source: 'not_found'
        };
      }

      // Step 3: Cache the result
      await this.cacheFood(apiResult);

      return {
        result: apiResult,
        source: 'api'
      };

    } catch (error) {
      console.error('Barcode search error:', error);
      throw error;
    }
  }

  // Cache search results in database
  async cacheSearchResults(foods) {
    if (!foods || foods.length === 0) return;

    try {
      const foodsToInsert = foods.map(food => ({
        ...food,
        popularity_score: 1, // Start with score of 1
        last_updated: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('cached_foods')
        .upsert(foodsToInsert, {
          onConflict: 'food_id',
          ignoreDuplicates: false
        });

      if (error) {
        console.error('Error caching foods:', error);
      }
    } catch (error) {
      console.error('Cache insertion error:', error);
    }
  }

  // Cache a single food item
  async cacheFood(food) {
    try {
      const { error } = await supabase
        .from('cached_foods')
        .upsert({
          ...food,
          popularity_score: 1,
          last_updated: new Date().toISOString()
        }, {
          onConflict: 'food_id'
        });

      if (error) {
        console.error('Error caching single food:', error);
      }
    } catch (error) {
      console.error('Single food cache error:', error);
    }
  }

  // Update popularity scores for searched foods
  async updatePopularityScores(foodIds) {
    try {
      // Use Promise.all but don't wait for it to complete
      Promise.all(
        foodIds.map(foodId => 
          supabase.rpc('increment_food_popularity', { p_food_id: foodId })
        )
      ).catch(error => {
        console.error('Error updating popularity scores:', error);
      });
    } catch (error) {
      console.error('Popularity update error:', error);
    }
  }

  // Combine and deduplicate results from cache and API
  combineAndDeduplicateResults(cacheResults, apiResults, limit) {
    const seen = new Set();
    const combined = [];

    // Add cache results first (they're likely more relevant)
    for (const food of cacheResults) {
      if (!seen.has(food.food_id) && combined.length < limit) {
        seen.add(food.food_id);
        combined.push({
          ...food,
          source: 'cache'
        });
      }
    }

    // Add API results that aren't already in cache
    for (const food of apiResults) {
      if (!seen.has(food.food_id) && combined.length < limit) {
        seen.add(food.food_id);
        combined.push({
          ...food,
          source: 'api'
        });
      }
    }

    return combined;
  }

  // Clean up old in-memory cache entries
  cleanupSearchCache() {
    const now = Date.now();
    for (const [key, value] of this.searchCache.entries()) {
      if (now - value.timestamp > this.cacheTimeout) {
        this.searchCache.delete(key);
      }
    }
  }

  // Get popular foods from cache (for quick access)
  async getPopularFoods(limit = 20) {
    try {
      const { data, error } = await supabase
        .from('cached_foods')
        .select('*')
        .order('popularity_score', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error getting popular foods:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Popular foods error:', error);
      return [];
    }
  }

  // Get foods by category from cache
  async getFoodsByCategory(category, limit = 20) {
    try {
      const { data, error } = await supabase
        .from('cached_foods')
        .select('*')
        .ilike('category', `%${category}%`)
        .order('popularity_score', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error getting foods by category:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Category foods error:', error);
      return [];
    }
  }

  // Clear all caches
  clearCache() {
    this.searchCache.clear();
  }

  // Get cache statistics
  async getCacheStats() {
    try {
      const { data: stats, error } = await supabase
        .from('cached_foods')
        .select('count(*), avg(popularity_score), max(last_updated)')
        .single();

      if (error) {
        console.error('Error getting cache stats:', error);
        return null;
      }

      return {
        totalFoods: stats.count,
        averagePopularity: stats.avg,
        lastUpdate: stats.max,
        memoryCache: this.searchCache.size
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return null;
    }
  }
}

export default new HybridFoodSearch();
