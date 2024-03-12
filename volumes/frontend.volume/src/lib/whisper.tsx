import {
    GetPrivateChannel,
    ChannelType,
    ChannelUsers,
    ChannelSubscriptionRole
} from "../services/ApiServiceDto"

export const generateChannelId = (userTo: any, userFrom: any) => {
    const ids = [userTo.userId, userFrom.userId].sort((a, b) => a - b);

    const channelId = ids[0] * ids[1] + ids[0] + ids[1];

    return channelId;
}

export const createChannelUser = (users: any): ChannelUsers => {
    return {
        userId: users.id ?? users.userId,
        name: users.name,
        roles: ChannelSubscriptionRole.OWNER,
        avatarUrl: users.avatarUrl,
        isOnline: users.isOnline,
        avatar42Url: users.avatar42Url,
        isMuted: false,
        unMuteAt: new Date(),
    }
}

export const createPrivateChannel = (
    userTo: ChannelUsers, 
    userFrom: ChannelUsers, 
    localChannels: GetPrivateChannel[],
    setChannels: React.Dispatch<React.SetStateAction<GetPrivateChannel[]>>,
    setLocalChannels: React.Dispatch<React.SetStateAction<GetPrivateChannel[]>>,
) => {
    const channelId = generateChannelId(userTo, userFrom); 
    const channel = localChannels.find((c) => c.id === channelId);

    if (channel) {
        return;
    } else {
        const newChannel = {
            id: channelId,
            name: `${userTo.name}`,
            type: ChannelType.WHISPER,
            users: [userTo, userFrom],
        };
        setChannels((prevChannels) => [
            ...prevChannels,
            newChannel
        ]);
        setLocalChannels((prevChannels) => [
            ...(prevChannels ?? []),
            newChannel
        ]);
    }
}
