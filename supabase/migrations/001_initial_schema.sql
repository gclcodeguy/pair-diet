-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    daily_calorie_goal INTEGER DEFAULT 2000,
    preferred_units TEXT DEFAULT 'metric', -- 'metric' or 'imperial'
    notifications_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Challenges table
CREATE TABLE IF NOT EXISTS public.challenges (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    creator_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    challenge_type TEXT NOT NULL CHECK (challenge_type IN ('daily', 'weekly', 'fortnightly', 'monthly')),
    penalty_type TEXT NOT NULL CHECK (penalty_type IN ('burpees', 'calories', 'steps', 'miles')),
    penalty_amount INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    invite_code TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Challenge participants table
CREATE TABLE IF NOT EXISTS public.challenge_participants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(challenge_id, user_id)
);

-- Food logs table
CREATE TABLE IF NOT EXISTS public.food_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    food_name TEXT NOT NULL,
    calories INTEGER NOT NULL,
    protein DECIMAL(5,2),
    carbs DECIMAL(5,2),
    fat DECIMAL(5,2),
    fiber DECIMAL(5,2),
    meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    logged_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Penalties table
CREATE TABLE IF NOT EXISTS public.penalties (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    penalty_type TEXT NOT NULL CHECK (penalty_type IN ('burpees', 'calories', 'steps', 'miles')),
    penalty_amount INTEGER NOT NULL,
    completed_amount INTEGER DEFAULT 0,
    due_date DATE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'overdue')),
    verified_by UUID REFERENCES public.users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Friendships table
CREATE TABLE IF NOT EXISTS public.friendships (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    friend_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, friend_id)
);

-- Achievements table
CREATE TABLE IF NOT EXISTS public.achievements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    achievement_type TEXT NOT NULL,
    achievement_name TEXT NOT NULL,
    description TEXT,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_food_logs_user_date ON public.food_logs(user_id, logged_date);
CREATE INDEX IF NOT EXISTS idx_challenges_creator ON public.challenges(creator_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge ON public.challenge_participants(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_user ON public.challenge_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_penalties_user ON public.penalties(user_id);
CREATE INDEX IF NOT EXISTS idx_penalties_challenge ON public.penalties(challenge_id);
CREATE INDEX IF NOT EXISTS idx_friendships_user ON public.friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend ON public.friendships(friend_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.penalties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for user_preferences table
CREATE POLICY "Users can view their own preferences" ON public.user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON public.user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON public.user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for challenges table
CREATE POLICY "Users can view challenges they created or participate in" ON public.challenges
    FOR SELECT USING (
        auth.uid() = creator_id OR 
        EXISTS (
            SELECT 1 FROM public.challenge_participants 
            WHERE challenge_id = challenges.id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create challenges" ON public.challenges
    FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update challenges they created" ON public.challenges
    FOR UPDATE USING (auth.uid() = creator_id);

-- RLS Policies for challenge_participants table
CREATE POLICY "Users can view challenge participants for challenges they're in" ON public.challenge_participants
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.challenge_participants cp2
            WHERE cp2.challenge_id = challenge_participants.challenge_id 
            AND cp2.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can join challenges" ON public.challenge_participants
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for food_logs table
CREATE POLICY "Users can view their own food logs" ON public.food_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own food logs" ON public.food_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own food logs" ON public.food_logs
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own food logs" ON public.food_logs
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for penalties table
CREATE POLICY "Users can view penalties for challenges they're in" ON public.penalties
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.challenge_participants cp
            WHERE cp.challenge_id = penalties.challenge_id 
            AND cp.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own penalties" ON public.penalties
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can verify penalties for challenges they're in" ON public.penalties
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.challenge_participants cp
            WHERE cp.challenge_id = penalties.challenge_id 
            AND cp.user_id = auth.uid()
        )
    );

-- RLS Policies for friendships table
CREATE POLICY "Users can view their own friendships" ON public.friendships
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friendship requests" ON public.friendships
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own friendships" ON public.friendships
    FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- RLS Policies for achievements table
CREATE POLICY "Users can view their own achievements" ON public.achievements
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements" ON public.achievements
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, username, display_name)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'username', NEW.raw_user_meta_data->>'display_name');
    
    INSERT INTO public.user_preferences (user_id)
    VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to generate invite codes
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS TEXT AS $$
BEGIN
    RETURN 'BURPEE' || substr(md5(random()::text), 1, 8);
END;
$$ LANGUAGE plpgsql;

-- Create function to create challenge with invite code
CREATE OR REPLACE FUNCTION public.create_challenge_with_invite(
    p_name TEXT,
    p_description TEXT,
    p_challenge_type TEXT,
    p_penalty_type TEXT,
    p_penalty_amount INTEGER,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS UUID AS $$
DECLARE
    v_challenge_id UUID;
    v_invite_code TEXT;
BEGIN
    -- Generate unique invite code
    LOOP
        v_invite_code := public.generate_invite_code();
        BEGIN
            INSERT INTO public.challenges (
                name, description, creator_id, challenge_type, 
                penalty_type, penalty_amount, start_date, end_date, invite_code
            ) VALUES (
                p_name, p_description, auth.uid(), p_challenge_type,
                p_penalty_type, p_penalty_amount, p_start_date, p_end_date, v_invite_code
            ) RETURNING id INTO v_challenge_id;
            EXIT;
        EXCEPTION WHEN unique_violation THEN
            -- Try again with different code
            CONTINUE;
        END;
    END LOOP;
    
    -- Add creator as participant
    INSERT INTO public.challenge_participants (challenge_id, user_id)
    VALUES (v_challenge_id, auth.uid());
    
    RETURN v_challenge_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 