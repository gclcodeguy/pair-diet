-- Fix cached_foods table schema issues
-- This migration addresses data type mismatches and missing columns

-- First, let's add the missing columns that the API is trying to insert
ALTER TABLE public.cached_foods 
ADD COLUMN IF NOT EXISTS nutrition_grades TEXT,
ADD COLUMN IF NOT EXISTS ecoscore_grade TEXT,
ADD COLUMN IF NOT EXISTS nova_group INTEGER,
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Fix the search function to return proper data types
DROP FUNCTION IF EXISTS public.search_cached_foods(TEXT, INTEGER);

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
    protein NUMERIC,  -- Changed from DECIMAL to NUMERIC for compatibility
    carbs NUMERIC,
    fat NUMERIC,
    fiber NUMERIC,
    sugar NUMERIC,
    sodium NUMERIC,
    serving_size NUMERIC,
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
        )::REAL AS search_rank
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
