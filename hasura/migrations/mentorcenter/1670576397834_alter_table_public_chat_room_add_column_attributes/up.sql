alter table "public"."chat_room" add column "attributes" jsonb
 not null default jsonb_build_object();
