CREATE OR REPLACE FUNCTION public.run_before_insert_event_profile_view()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
    BEGIN
        IF EXISTS (
            SELECT FROM event_profile_view 
            WHERE viewed_profile_id = NEW.viewed_profile_id
                AND viewer_profile_id = NEW.viewer_profile_id
                AND (now() - interval '15 minutes') < created_at
        ) THEN
            RAISE EXCEPTION 'Cannot insert duplicate event within 15 minutes';
        END IF;
        
        RETURN NEW;
    END;
$function$;
