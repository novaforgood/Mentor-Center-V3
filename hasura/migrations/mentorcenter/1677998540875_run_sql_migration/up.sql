CREATE OR REPLACE VIEW "public"."past_hour_unread_messages_count" AS 
 SELECT sender_ptcr.profile_id AS sender_profile_id,
    ptcr.profile_id AS receiver_profile_id,
    count(*) AS unread_messages_count
   FROM ((((chat_message
     JOIN chat_room ON ((chat_message.chat_room_id = chat_room.id)))
     JOIN profile_to_chat_room ptcr ON ((ptcr.chat_room_id = chat_room.id)))
     JOIN profile_to_chat_room sender_ptcr ON ((sender_ptcr.profile_id = chat_message.sender_ptcr_id))
     JOIN profile sender_profile ON ((sender_profile.id = sender_ptcr.profile_id)))
     JOIN "user" sender_user ON ((sender_user.id = sender_profile.user_id)))
  WHERE ((chat_message.created_at > (now() - '01:00:00'::interval)) AND (sender_ptcr.profile_id <> ptcr.profile_id) AND (chat_message.id > COALESCE(ptcr.latest_read_chat_message_id, (0)::bigint)) AND (sender_user.type = 'User'::text))
  GROUP BY ptcr.profile_id, sender_ptcr.profile_id;
