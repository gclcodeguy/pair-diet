// Open Food Facts API Service
// Documentation: https://openfoodfacts.github.io/openfoodfacts-server/api/

const OFF_API_BASE_URL = 'https://world.openfoodfacts.org/api/v2';
const OFF_SEARCH_URL = 'https://world.openfoodfacts.org/cgi/search.pl';

class OpenFoodFactsAPI {
  constructor() {
    this.baseURL = OFF_API_BASE_URL;
    this.searchURL = OFF_SEARCH_URL;
    this.userAgent = 'BurpeeBet/1.0 (michael@golflists.com)'; // Required by OFF API
  }

  // Search for foods by query
  async searchFoods(query, options = {}) {
    try {
      // Respect rate limits: max 10 req/min for search
      const params = new URLSearchParams({
        search_terms: query,
        search_simple: '1',
        action: 'process',
        json: '1',
        page_size: options.pageSize || 10,
        page: options.page || 1,
        // Focus on foods with good nutritional data
        fields: 'code,product_name,brands,categories,nutriments,serving_size,serving_quantity,nutrition_grades,ecoscore_grade,nova_group,image_url'
      });

      const response = await fetch(`${this.searchURL}?${params}`, {
        headers: {
          'User-Agent': this.userAgent,
        },
      });
      
      if (!response.ok) {
        throw new Error(`OFF API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return this.formatSearchResults(data);
    } catch (error) {
      console.error('Open Food Facts search error:', error);
      throw error;
    }
  }

  // Get food by barcode
  async getFoodByBarcode(barcode) {
    try {
      const response = await fetch(`${this.baseURL}/product/${barcode}`, {
        headers: {
          'User-Agent': this.userAgent,
        },
      });
      
      if (!response.ok) {
        throw new Error(`OFF API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.status === 0) {
        return null; // Product not found
      }

      return this.formatFoodDetails(data.product);
    } catch (error) {
      console.error('Open Food Facts barcode lookup error:', error);
      throw error;
    }
  }

  // Format search results for the app
  formatSearchResults(data) {
    if (!data.products || !Array.isArray(data.products)) {
      return [];
    }

    return data.products
      .filter(product => product.nutriments && product.product_name)
      .map(product => this.formatFoodDetails(product));
  }

  // Format individual food details
  formatFoodDetails(product) {
    const nutriments = product.nutriments || {};
    
    // Extract nutritional data (OFF provides per 100g by default)
    const calories = Math.round(nutriments['energy-kcal_100g'] || nutriments['energy-kcal'] || 0);
    const protein = parseFloat(nutriments['proteins_100g'] || nutriments.proteins || 0);
    const carbs = parseFloat(nutriments['carbohydrates_100g'] || nutriments.carbohydrates || 0);
    const fat = parseFloat(nutriments['fat_100g'] || nutriments.fat || 0);
    const fiber = parseFloat(nutriments['fiber_100g'] || nutriments.fiber || 0);
    const sugar = parseFloat(nutriments['sugars_100g'] || nutriments.sugars || 0);
    const sodium = parseFloat(nutriments['sodium_100g'] || nutriments.sodium || 0) * 1000; // Convert to mg

    // Clean up the product name
    const name = this.cleanProductName(product.product_name);
    const brand = product.brands ? product.brands.split(',')[0].trim() : null;
    const category = product.categories ? product.categories.split(',')[0].trim() : null;

    // Generate search terms for better searchability
    const searchTerms = this.generateSearchTerms(name, brand, category);

    return {
      food_id: product.code || product.id,
      barcode: product.code,
      food_name: name,
      brand: brand,
      category: category,
      calories: calories,
      protein: protein,
      carbs: carbs,
      fat: fat,
      fiber: fiber,
      sugar: sugar,
      sodium: sodium,
      serving_size: parseFloat(product.serving_quantity) || 100,
      serving_unit: product.serving_size || 'g',
      data_source: 'openfoodfacts',
      data_quality: this.calculateDataQuality(product),
      search_terms: searchTerms
    };
  }

  // Clean product names (remove unnecessary text, brand duplicates, etc.)
  cleanProductName(name) {
    if (!name) return '';
    
    return name
      .replace(/\s+/g, ' ') // Multiple spaces to single space
      .replace(/[™®©]/g, '') // Remove trademark symbols
      .replace(/\s*-\s*$/, '') // Remove trailing dashes
      .trim();
  }

  // Generate search terms for better findability
  generateSearchTerms(name, brand, category) {
    const terms = [];
    
    if (name) {
      terms.push(name);
      // Add individual words from name
      terms.push(...name.toLowerCase().split(/\s+/).filter(word => word.length > 2));
    }
    
    if (brand) {
      terms.push(brand);
    }
    
    if (category) {
      terms.push(category);
      // Add category words
      terms.push(...category.toLowerCase().split(/[,\s]+/).filter(word => word.length > 2));
    }
    
    return [...new Set(terms)].join(' '); // Remove duplicates and join
  }

  // Calculate data quality score based on available information
  calculateDataQuality(product) {
    let score = 0;
    const maxScore = 10;

    // Basic info
    if (product.product_name) score += 2;
    if (product.brands) score += 1;
    if (product.categories) score += 1;

    // Nutritional completeness
    const nutriments = product.nutriments || {};
    if (nutriments['energy-kcal_100g'] || nutriments['energy-kcal']) score += 2;
    if (nutriments['proteins_100g'] || nutriments.proteins) score += 1;
    if (nutriments['carbohydrates_100g'] || nutriments.carbohydrates) score += 1;
    if (nutriments['fat_100g'] || nutriments.fat) score += 1;
    if (nutriments['fiber_100g'] || nutriments.fiber) score += 0.5;
    if (nutriments['sugars_100g'] || nutriments.sugars) score += 0.5;

    return Math.min(score / maxScore, 1.0);
  }

  // Get popular foods from OFF (could be used to seed the cache)
  async getPopularFoods(limit = 50) {
    try {
      const params = new URLSearchParams({
        action: 'process',
        json: '1',
        page_size: limit,
        sort_by: 'unique_scans_n', // Sort by popularity
        fields: 'code,product_name,brands,categories,nutriments,serving_size,serving_quantity'
      });

      const response = await fetch(`${this.searchURL}?${params}`, {
        headers: {
          'User-Agent': this.userAgent,
        },
      });
      
      if (!response.ok) {
        throw new Error(`OFF API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return this.formatSearchResults(data);
    } catch (error) {
      console.error('Open Food Facts popular foods error:', error);
      throw error;
    }
  }

  // Search for foods in specific categories (for seeding cache)
  async getFoodsByCategory(category, limit = 20) {
    try {
      const params = new URLSearchParams({
        action: 'process',
        json: '1',
        page_size: limit,
        tagtype_0: 'categories',
        tag_contains_0: 'contains',
        tag_0: category,
        fields: 'code,product_name,brands,categories,nutriments,serving_size,serving_quantity'
      });

      const response = await fetch(`${this.searchURL}?${params}`, {
        headers: {
          'User-Agent': this.userAgent,
        },
      });
      
      if (!response.ok) {
        throw new Error(`OFF API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return this.formatSearchResults(data);
    } catch (error) {
      console.error(`Open Food Facts category (${category}) search error:`, error);
      throw error;
    }
  }

  // Rate limiting helper - add delay between requests
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default new OpenFoodFactsAPI();
