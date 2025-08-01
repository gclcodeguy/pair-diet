-- Fix the handle_new_user function to handle missing metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_username TEXT;
BEGIN
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
