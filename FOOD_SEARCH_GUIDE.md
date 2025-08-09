# 🍎 Hybrid Food Search System

BurpeeBet now uses a **hybrid food search system** that combines local caching with Open Food Facts API for optimal performance and comprehensive food coverage.

## 🔄 How It Works

### 1. **Cache-First Strategy**
- Search local database first (instant results)
- Fall back to Open Food Facts API if needed
- Automatically cache new results for future searches

### 2. **Open Food Facts Integration**
- 3.7+ million products from around the world
- Real-time barcode scanning support
- Comprehensive nutritional data
- Community-driven and constantly updated

### 3. **Smart Performance**
- **Sub-100ms** search results from cache
- **300ms** debounced search (reduced from 500ms)
- Automatic popularity scoring for better rankings
- In-memory caching for recent API results

## 🎯 Features

### ✅ **Implemented**
- **Text Search**: Type any food name for instant results
- **Barcode Scanning**: Scan product barcodes with camera
- **Smart Caching**: Frequently searched foods cached locally
- **Hybrid Results**: Combines cache + API for best coverage
- **Color-coded Nutrition**: Visual macro indicators (green/yellow/red)
- **Performance Monitoring**: Logs search sources and timing

### 🔍 **Search Types**
1. **Cached Foods**: Lightning-fast local search
2. **Open Food Facts API**: Comprehensive global database
3. **Barcode Lookup**: Direct UPC/EAN product identification

## 🛠 Setup Instructions

### 1. **Database Migration**
```bash
# Already applied ✅
npx supabase db push --include-all
```

### 2. **Seed Food Cache** (Optional)
```bash
# Set environment variables first:
export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"

# Seed with ~5K common foods (takes ~30 minutes due to rate limits)
npm run seed-foods
```

### 3. **Environment Variables**
```bash
# .env.local
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # For seeding only
```

## 📊 Cache Management

### **Cache Statistics**
```javascript
import hybridFoodSearch from './utils/hybridFoodSearch';

// Get cache statistics
const stats = await hybridFoodSearch.getCacheStats();
console.log(stats);
// {
//   totalFoods: 5247,
//   averagePopularity: 3.2,
//   lastUpdate: "2024-01-28T10:30:00Z",
//   memoryCache: 15
// }
```

### **Popular Foods**
```javascript
// Get most searched foods
const popularFoods = await hybridFoodSearch.getPopularFoods(20);
```

### **Category Search**
```javascript
// Search by food category
const fruits = await hybridFoodSearch.getFoodsByCategory('fruit', 10);
```

## 🔍 Usage Examples

### **Basic Search**
```javascript
import hybridFoodSearch from './utils/hybridFoodSearch';

const results = await hybridFoodSearch.searchFoods('chicken breast', {
  limit: 10
});

console.log(results);
// {
//   results: [...foods],
//   source: 'hybrid',  // 'cache', 'api', or 'hybrid'
//   cacheHits: 3,
//   apiHits: 7,
//   total: 10
// }
```

### **Barcode Search**
```javascript
const result = await hybridFoodSearch.searchByBarcode('3274080005003');

console.log(result);
// {
//   result: { food_name: "Nutella", ... },
//   source: 'cache'  // or 'api'
// }
```

## 🎨 UI Integration

### **LogFoodScreen Features**
- **Scan Button**: Green barcode scanner button
- **Manual Entry**: Orange manual food entry
- **Search as You Type**: 300ms debounced search
- **Color-coded Results**: Nutrition quality indicators
- **Source Indicators**: Shows if results from cache or API

### **Search Result Display**
- **Food Name**: Primary display name
- **Brand**: Secondary brand information
- **Macros**: Color-coded P/C/F/Cal badges
- **Serving Size**: Standard 100g portions
- **Category**: Food category classification

## 📈 Performance Metrics

### **Response Times**
- **Cache Hit**: < 100ms
- **API Call**: 1-3 seconds (depends on network)
- **Hybrid**: Fastest available source

### **Rate Limits**
- **Open Food Facts**: 10 searches/minute
- **Cache Search**: Unlimited
- **Barcode Lookup**: No rate limit

### **Data Coverage**
- **Cached Foods**: ~5K most common foods
- **API Access**: 3.7M+ global products
- **Barcode Database**: 615K+ UPC codes

## 🔧 Development

### **File Structure**
```
utils/
├── hybridFoodSearch.js    # Main hybrid search service
├── openFoodFactsApi.js    # Open Food Facts API wrapper
└── supabase.ts           # Supabase client

scripts/
└── seedFoodCache.js      # Cache seeding script

supabase/migrations/
└── 20250128000000_add_cached_foods_table.sql
```

### **Database Schema**
```sql
-- cached_foods table
- id: UUID PRIMARY KEY
- food_id: TEXT UNIQUE (OFF product ID)
- barcode: TEXT (UPC/EAN code)
- food_name: TEXT NOT NULL
- brand: TEXT
- category: TEXT
- calories: INTEGER
- protein, carbs, fat, fiber, sugar, sodium: DECIMAL
- serving_size, serving_unit: Portion info
- data_source: 'openfoodfacts'
- data_quality: DECIMAL (0-1 score)
- popularity_score: INTEGER (search frequency)
- search_terms: TEXT (optimized search)
- timestamps: created_at, last_updated
```

## 🚀 Future Enhancements

### **Planned Features**
- [ ] Offline mode support
- [ ] Custom food additions
- [ ] Recipe ingredient parsing
- [ ] Meal planning integration
- [ ] Nutritional goal recommendations
- [ ] User contribution system

### **Performance Optimizations**
- [ ] Predictive caching
- [ ] Background cache updates
- [ ] Search result personalization
- [ ] Geographic food preferences

## 🐛 Troubleshooting

### **Common Issues**

**"No search results"**
- Check internet connection for API fallback
- Verify cache has been seeded
- Try different search terms

**"Barcode not found"**
- Product may not be in Open Food Facts database
- Use manual entry for unknown products
- Consider contributing product to OFF

**"Search too slow"**
- Check if cache is populated
- Monitor API rate limits
- Verify network connectivity

### **Debug Commands**
```javascript
// Check cache status
await hybridFoodSearch.getCacheStats();

// Clear in-memory cache
hybridFoodSearch.clearCache();

// Search with debug logging
const results = await hybridFoodSearch.searchFoods('apple', { 
  limit: 5,
  cacheFirst: true 
});
```

## 📝 Contributing

When adding new foods or improving search:

1. **Test thoroughly** with various search terms
2. **Monitor performance** impact
3. **Update documentation** for new features
4. **Follow rate limits** for Open Food Facts API
5. **Maintain data quality** standards

---

**Next Steps**: Ready to replace USDA API completely! 🎉

The hybrid system provides better performance, more comprehensive data, and barcode scanning capabilities that modern nutrition apps require.
