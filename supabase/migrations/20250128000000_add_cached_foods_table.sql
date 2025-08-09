-- Migration: Add cached foods table for Open Food Facts integration
-- This table will store commonly searched foods for fast access

CREATE TABLE IF NOT EXISTS public.cached_foods (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- Food identification
    food_id TEXT NOT NULL, -- From Open Food Facts (barcode or OFF ID)
    barcode TEXT, -- UPC/EAN barcode if available
    food_name TEXT NOT NULL,
    brand TEXT,
    category TEXT,
    
    -- Nutritional data (per 100g to match OFF standard)
    calories INTEGER NOT NULL DEFAULT 0,
    protein DECIMAL(6,2) DEFAULT 0,
    carbs DECIMAL(6,2) DEFAULT 0,
    fat DECIMAL(6,2) DEFAULT 0,
    fiber DECIMAL(6,2) DEFAULT 0,
    sugar DECIMAL(6,2) DEFAULT 0,
    sodium DECIMAL(6,2) DEFAULT 0, -- in mg
    
    -- Serving information
    serving_size DECIMAL(6,2) DEFAULT 100, -- Default 100g
    serving_unit TEXT DEFAULT 'g',
    
    -- Metadata
    data_source TEXT NOT NULL DEFAULT 'openfoodfacts',
    data_quality DECIMAL(3,2) DEFAULT 1.0, -- Quality score 0-1
    popularity_score INTEGER DEFAULT 0, -- How often searched
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Search optimization
    search_terms TEXT, -- Preprocessed search terms for full-text search
    
    UNIQUE(food_id)
);

-- Create indexes for fast searching
CREATE INDEX IF NOT EXISTS idx_cached_foods_search_name ON public.cached_foods 
    USING gin(to_tsvector('english', food_name));

CREATE INDEX IF NOT EXISTS idx_cached_foods_search_terms ON public.cached_foods 
    USING gin(to_tsvector('english', search_terms));

CREATE INDEX IF NOT EXISTS idx_cached_foods_barcode ON public.cached_foods(barcode) WHERE barcode IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cached_foods_popularity ON public.cached_foods(popularity_score DESC);

CREATE INDEX IF NOT EXISTS idx_cached_foods_category ON public.cached_foods(category);

-- Enable Row Level Security
ALTER TABLE public.cached_foods ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow read access to all authenticated users (foods are public data)
CREATE POLICY "Anyone can read cached foods" ON public.cached_foods
    FOR SELECT USING (auth.role() = 'authenticated');

-- RLS Policy: Only allow app to insert/update (we'll use service role for data management)
CREATE POLICY "Service role can manage cached foods" ON public.cached_foods
    FOR ALL USING (auth.role() = 'service_role');

-- Function to update popularity score when food is searched
CREATE OR REPLACE FUNCTION public.increment_food_popularity(p_food_id TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE public.cached_foods 
    SET popularity_score = popularity_score + 1,
        last_updated = NOW()
    WHERE food_id = p_food_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search foods with fuzzy matching and ranking
CREATE OR REPLACE FUNCTION public.search_cached_foods(
    p_query TEXT,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    food_id TEXT,
    barcode TEXT,
    food_name TEXT,
    brand TEXT,
    category TEXT,
    calories INTEGER,
    protein DECIMAL(6,2),
    carbs DECIMAL(6,2),
    fat DECIMAL(6,2),
    fiber DECIMAL(6,2),
    sugar DECIMAL(6,2),
    sodium DECIMAL(6,2),
    serving_size DECIMAL(6,2),
    serving_unit TEXT,
    data_source TEXT,
    popularity_score INTEGER,
    search_rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cf.id,
        cf.food_id,
        cf.barcode,
        cf.food_name,
        cf.brand,
        cf.category,
        cf.calories,
        cf.protein,
        cf.carbs,
        cf.fat,
        cf.fiber,
        cf.sugar,
        cf.sodium,
        cf.serving_size,
        cf.serving_unit,
        cf.data_source,
        cf.popularity_score,
        (
            ts_rank(to_tsvector('english', cf.food_name), plainto_tsquery('english', p_query)) * 0.4 +
            ts_rank(to_tsvector('english', COALESCE(cf.search_terms, '')), plainto_tsquery('english', p_query)) * 0.3 +
            (cf.popularity_score::REAL / 1000.0) * 0.2 +
            CASE WHEN cf.food_name ILIKE '%' || p_query || '%' THEN 0.1 ELSE 0 END
        ) AS search_rank
    FROM public.cached_foods cf
    WHERE 
        to_tsvector('english', cf.food_name) @@ plainto_tsquery('english', p_query)
        OR to_tsvector('english', COALESCE(cf.search_terms, '')) @@ plainto_tsquery('english', p_query)
        OR cf.food_name ILIKE '%' || p_query || '%'
        OR cf.barcode = p_query
    ORDER BY search_rank DESC, cf.popularity_score DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
