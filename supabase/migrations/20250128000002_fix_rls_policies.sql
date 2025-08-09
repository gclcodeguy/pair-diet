-- Fix RLS policies for cached_foods table
-- Allow authenticated users to insert foods they search for

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Service role can manage cached foods" ON public.cached_foods;

-- Create new policies that allow authenticated users to manage cached foods
CREATE POLICY "Authenticated users can read cached foods" ON public.cached_foods
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert cached foods" ON public.cached_foods
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update cached foods" ON public.cached_foods
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Keep the service role policy for administrative operations
CREATE POLICY "Service role can manage cached foods" ON public.cached_foods
    FOR ALL USING (auth.role() = 'service_role');
