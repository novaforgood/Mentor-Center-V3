CREATE TABLE "public"."profile_to_chat_room" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "profile_id" uuid NOT NULL, "chat_room_id" uuid NOT NULL, PRIMARY KEY ("id") , FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON UPDATE restrict ON DELETE restrict, FOREIGN KEY ("chat_room_id") REFERENCES "public"."chat_room"("id") ON UPDATE restrict ON DELETE restrict, UNIQUE ("profile_id", "chat_room_id"));
CREATE EXTENSION IF NOT EXISTS pgcrypto;