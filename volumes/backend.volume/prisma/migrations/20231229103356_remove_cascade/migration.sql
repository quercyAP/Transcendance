-- DropForeignKey
ALTER TABLE "ChannelSubscription" DROP CONSTRAINT "ChannelSubscription_channelId_fkey";

-- DropForeignKey
ALTER TABLE "ChannelSubscription" DROP CONSTRAINT "ChannelSubscription_userId_fkey";

-- AddForeignKey
ALTER TABLE "ChannelSubscription" ADD CONSTRAINT "ChannelSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelSubscription" ADD CONSTRAINT "ChannelSubscription_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
