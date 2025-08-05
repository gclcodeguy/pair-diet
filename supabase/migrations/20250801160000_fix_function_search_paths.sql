-- Fix function search path mutable warnings
-- Add SET search_path = '' to prevent search path manipulation

-- Fix create_challenge_with_invite function
CREATE OR REPLACE FUNCTION public.create_challenge_with_invite(
    p_challenge_name TEXT,
    p_duration_days INTEGER,
    p_penalty_type TEXT,
    p_invite_email TEXT
)
RETURNS TABLE(invite_code TEXT, challenge_id UUID) AS $$
DECLARE
    v_challenge_id UUID;
    v_invite_code TEXT;
    v_inviter_id UUID;
BEGIN
    SET search_path = '';
    
    -- Get current user ID
    v_inviter_id := auth.uid();
    
    -- Create the challenge
    INSERT INTO public.challenges (
        name, 
        duration_days, 
        penalty_type, 
        created_by, 
        status
    ) VALUES (
        p_challenge_name, 
        p_duration_days, 
        p_penalty_type, 
        v_inviter_id, 
        'active'
    ) RETURNING id INTO v_challenge_id;
    
    -- Generate invite code
    v_invite_code := public.generate_invite_code();
    
    -- Create invite
    INSERT INTO public.challenge_invites (
        challenge_id, 
        invite_code, 
        inviter_id, 
        invitee_email, 
        status
    ) VALUES (
        v_challenge_id, 
        v_invite_code, 
        v_inviter_id, 
        p_invite_email, 
        'pending'
    );
    
    RETURN QUERY SELECT v_invite_code, v_challenge_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_username TEXT;
BEGIN
    SET search_path = '';
    
    -- Generate username from email if not provided
    v_username := COALESCE(
        NEW.raw_user_meta_data->>'username',
        split_part(NEW.email, '@', 1) || '_' || substr(md5(random()::text), 1, 4)
    );
    
    INSERT INTO public.users (id, username, display_name)
    VALUES (NEW.id, v_username, COALESCE(NEW.raw_user_meta_data->>'display_name', v_username));
    
    INSERT INTO public.user_preferences (user_id)
    VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix generate_invite_code function
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS TEXT AS $$
DECLARE
    v_code TEXT;
    v_exists BOOLEAN;
BEGIN
    SET search_path = '';
    
    LOOP
        -- Generate a 6-character alphanumeric code
        v_code := upper(substr(md5(random()::text), 1, 6));
        
        -- Check if code already exists
        SELECT EXISTS(
            SELECT 1 FROM public.challenge_invites 
            WHERE invite_code = v_code
        ) INTO v_exists;
        
        -- If code doesn't exist, return it
        IF NOT v_exists THEN
            RETURN v_code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 