CREATE FUNCTION run_before_insert_event_profile_view() 
   RETURNS TRIGGER 
   LANGUAGE PLPGSQL
AS $$
    BEGIN
        IF EXISTS (
            SELECT FROM events 
            WHERE viewed_profile_id = NEW.viewed_profile_id
                AND viewer_profile_id = NEW.viewer_profile_id
                AND (now() - interval '15 minutes') < created_at
        ) THEN
            RAISE EXCEPTION 'Cannot insert duplicate event within 15 minutes';
        END IF;
        
        RETURN NEW;
    END;
$$;
