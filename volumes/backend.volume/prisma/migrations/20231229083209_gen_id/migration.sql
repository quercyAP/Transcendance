-- AlterTable
CREATE SEQUENCE channel_id_seq;
ALTER TABLE "Channel" ALTER COLUMN "id" SET DEFAULT nextval('channel_id_seq');
ALTER SEQUENCE channel_id_seq OWNED BY "Channel"."id";

-- AlterTable
CREATE SEQUENCE friend_id_seq;
ALTER TABLE "Friend" ALTER COLUMN "id" SET DEFAULT nextval('friend_id_seq');
ALTER SEQUENCE friend_id_seq OWNED BY "Friend"."id";

-- AlterTable
CREATE SEQUENCE message_id_seq;
ALTER TABLE "Message" ALTER COLUMN "id" SET DEFAULT nextval('message_id_seq');
ALTER SEQUENCE message_id_seq OWNED BY "Message"."id";
