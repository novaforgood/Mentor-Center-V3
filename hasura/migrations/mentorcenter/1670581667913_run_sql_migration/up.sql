CREATE VIEW chat_intro_data AS (
    WITH chat_intro_rooms AS (
        SELECT chat_room.id as chat_room_id, attributes ->> 'chatIntroId' as chat_intro_id, COUNT(*) as num_messages FROM chat_room
        JOIN chat_message ON chat_message.chat_room_id = chat_room.id
        WHERE attributes ->> 'chatIntroId' IS NOT NULL
        GROUP BY chat_room.id
    ), rooms_with_replies AS (
        SELECT * FROM chat_intro_rooms
        WHERE num_messages > 1
    )
    SELECT chat_intro_id, COUNT(*) as num_rooms_with_replies FROM rooms_with_replies
    GROUP BY chat_intro_id
);
