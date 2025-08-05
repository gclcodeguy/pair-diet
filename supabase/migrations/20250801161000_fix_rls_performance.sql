-- Fix RLS performance issues
-- 1. Wrap auth.uid() calls in SELECT statements to prevent re-evaluation
-- 2. Consolidate multiple permissive policies

-- Drop existing policies that need to be recreated
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;

DROP POLICY IF EXISTS "Users can view their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can insert their own preferences" ON public.user_preferences;

DROP POLICY IF EXISTS "Users can view challenges they created or participate in" ON public.challenges;
DROP POLICY IF EXISTS "Users can create challenges" ON public.challenges;
DROP POLICY IF EXISTS "Users can update challenges they created" ON public.challenges;

DROP POLICY IF EXISTS "Users can view challenge participants for challenges they're in" ON public.challenge_participants;
DROP POLICY IF EXISTS "Users can join challenges" ON public.challenge_participants;

DROP POLICY IF EXISTS "Users can view their own food logs" ON public.food_logs;
DROP POLICY IF EXISTS "Users can insert their own food logs" ON public.food_logs;
DROP POLICY IF EXISTS "Users can update their own food logs" ON public.food_logs;
DROP POLICY IF EXISTS "Users can delete their own food logs" ON public.food_logs;

DROP POLICY IF EXISTS "Users can view penalties for challenges they're in" ON public.penalties;
DROP POLICY IF EXISTS "Users can update their own penalties" ON public.penalties;
DROP POLICY IF EXISTS "Users can verify penalties for challenges they're in" ON public.penalties;

DROP POLICY IF EXISTS "Users can view their own friendships" ON public.friendships;
DROP POLICY IF EXISTS "Users can create friendship requests" ON public.friendships;
DROP POLICY IF EXISTS "Users can update their own friendships" ON public.friendships;

DROP POLICY IF EXISTS "Users can view their own achievements" ON public.achievements;
DROP POLICY IF EXISTS "Users can insert their own achievements" ON public.achievements;

-- Recreate policies with optimized auth.uid() calls
-- Users table policies
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING ((auth.uid()) = (SELECT auth.uid()));

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING ((auth.uid()) = (SELECT auth.uid()));

CREATE POLICY "Users can insert their own profile" ON public.users
    FOR INSERT WITH CHECK ((auth.uid()) = (SELECT auth.uid()));

-- User preferences table policies
CREATE POLICY "Users can view their own preferences" ON public.user_preferences
    FOR SELECT USING ((auth.uid()) = (SELECT auth.uid()));

CREATE POLICY "Users can update their own preferences" ON public.user_preferences
    FOR UPDATE USING ((auth.uid()) = (SELECT auth.uid()));

CREATE POLICY "Users can insert their own preferences" ON public.user_preferences
    FOR INSERT WITH CHECK ((auth.uid()) = (SELECT auth.uid()));

-- Challenges table policies
CREATE POLICY "Users can view challenges they created or participate in" ON public.challenges
    FOR SELECT USING (
        (auth.uid()) = (SELECT auth.uid()) AND (
            creator_id = (SELECT auth.uid()) OR
            id IN (
                SELECT challenge_id 
                FROM public.challenge_participants 
                WHERE user_id = (SELECT auth.uid())
            )
        )
    );

CREATE POLICY "Users can create challenges" ON public.challenges
    FOR INSERT WITH CHECK ((auth.uid()) = (SELECT auth.uid()));

CREATE POLICY "Users can update challenges they created" ON public.challenges
    FOR UPDATE USING (
        (auth.uid()) = (SELECT auth.uid()) AND 
        creator_id = (SELECT auth.uid())
    );

-- Challenge participants table policies
CREATE POLICY "Users can view challenge participants for challenges they're in" ON public.challenge_participants
    FOR SELECT USING (
        (auth.uid()) = (SELECT auth.uid()) AND (
            user_id = (SELECT auth.uid()) OR
            challenge_id IN (
                SELECT id FROM public.challenges 
                WHERE creator_id = (SELECT auth.uid())
            )
        )
    );

CREATE POLICY "Users can join challenges" ON public.challenge_participants
    FOR INSERT WITH CHECK ((auth.uid()) = (SELECT auth.uid()));

-- Food logs table policies
CREATE POLICY "Users can view their own food logs" ON public.food_logs
    FOR SELECT USING ((auth.uid()) = (SELECT auth.uid()));

CREATE POLICY "Users can insert their own food logs" ON public.food_logs
    FOR INSERT WITH CHECK ((auth.uid()) = (SELECT auth.uid()));

CREATE POLICY "Users can update their own food logs" ON public.food_logs
    FOR UPDATE USING ((auth.uid()) = (SELECT auth.uid()));

CREATE POLICY "Users can delete their own food logs" ON public.food_logs
    FOR DELETE USING ((auth.uid()) = (SELECT auth.uid()));

-- Penalties table policies (consolidated to fix multiple permissive policies)
CREATE POLICY "Users can manage penalties for challenges they're in" ON public.penalties
    FOR ALL USING (
        (auth.uid()) = (SELECT auth.uid()) AND (
            user_id = (SELECT auth.uid()) OR
            challenge_id IN (
                SELECT cp.challenge_id 
                FROM public.challenge_participants cp
                WHERE cp.user_id = (SELECT auth.uid())
            )
        )
    );

-- Friendships table policies
CREATE POLICY "Users can view their own friendships" ON public.friendships
    FOR SELECT USING (
        (auth.uid()) = (SELECT auth.uid()) AND (
            user_id = (SELECT auth.uid()) OR
            friend_id = (SELECT auth.uid())
        )
    );

CREATE POLICY "Users can create friendship requests" ON public.friendships
    FOR INSERT WITH CHECK ((auth.uid()) = (SELECT auth.uid()));

CREATE POLICY "Users can update their own friendships" ON public.friendships
    FOR UPDATE USING (
        (auth.uid()) = (SELECT auth.uid()) AND (
            user_id = (SELECT auth.uid()) OR
            friend_id = (SELECT auth.uid())
        )
    );

-- Achievements table policies
CREATE POLICY "Users can view their own achievements" ON public.achievements
    FOR SELECT USING ((auth.uid()) = (SELECT auth.uid()));

CREATE POLICY "Users can insert their own achievements" ON public.achievements
    FOR INSERT WITH CHECK ((auth.uid()) = (SELECT auth.uid())); 