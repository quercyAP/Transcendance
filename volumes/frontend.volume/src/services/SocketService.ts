import { io, Socket } from "socket.io-client";
import { GetPrivateChannel, PublicUser } from "./ApiServiceDto";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import ApiService from "./ApiService";
import { Message } from "./ApiServiceDto";
import { createChannelUser, createPrivateChannel } from "../lib/whisper";

export default class SocketService {
  private baseUrl: string;
  private socket: Socket;
  private localChannels: GetPrivateChannel[] = [];
  private blockedUser: PublicUser[] = [];

  constructor(
    baseUrl: string,
    path: string,
    transports?: string[],
    withCredentials?: boolean,
    localChannels?: GetPrivateChannel[],
    blockedUser?: PublicUser[],
    id?: string,
  ) {
    this.baseUrl = baseUrl;
    this.socket = io(this.baseUrl, {
      path: path,
      transports: transports,
      withCredentials: withCredentials,
      query: { id: id  },
    });
    this.localChannels = localChannels ?? [];
    this.blockedUser = blockedUser ?? [];
  }

  public updateLocalChannels(localChannels: GetPrivateChannel[]) {
    this.localChannels = localChannels;
  }

  public updateBlockedUser(blockedUser: PublicUser[]) {
    this.blockedUser = blockedUser;
  }

  public onDisconnect(router: AppRouterInstance) {
    this.socket.on("disconnect", () => {
      this.socket.disconnect();
      router.push("/login");
    });
  }

  public onMatchStarted(
    setMatchStarted: React.Dispatch<React.SetStateAction<boolean | null>>,
    setStatus: React.Dispatch<React.SetStateAction<any>>,
    setInvitationInfo: React.Dispatch<React.SetStateAction<any>>,
    setShowInviteRoom: React.Dispatch<React.SetStateAction<boolean>>,
    setShowWaitingRoom: React.Dispatch<React.SetStateAction<boolean>>,
    setisInviting: React.Dispatch<React.SetStateAction<boolean>>,
    setShowStartButton: React.Dispatch<React.SetStateAction<boolean>>,
    showWaitingRoom: boolean
  ) {
    this.socket.on("matchStarted", (match: any) => {
      setStatus(match);
      setMatchStarted(true);
    });
    this.socket.on('invite', (payload:any) => {
      if (payload.inviteStatus === false){
        alert(payload.reason);
        setShowWaitingRoom(false);
        setisInviting(false);
        setShowStartButton(true);
        setShowInviteRoom(false);
      }
      else {
        setInvitationInfo({
          host: payload.host,
          guest: payload.guest,
          gameId: payload.gameId,
        });
        setShowInviteRoom(true);
        setShowWaitingRoom(false);
        setisInviting(false);
        setShowStartButton(false);
      }
    });
  }

  public onNewMessage(
    setChannelMessages: React.Dispatch<React.SetStateAction<any>>
  ) {
    this.socket.on("newMessage", (message: any) => {
      const senderIsBlocked = this.blockedUser.some(
        (user) => user.id === message.senderId
      );
      if (!senderIsBlocked) {
        setChannelMessages((prevMessages: any) => [
          ...(prevMessages ?? []),
          message,
        ]);
      }
    });
  }

  public sendMessage(message: Message) {
    this.socket.emit("sendMessage", message);
  }

  public onNewWhisper(
    setChannelMessages: React.Dispatch<React.SetStateAction<any>>,
    setChannels: React.Dispatch<React.SetStateAction<GetPrivateChannel[]>>,
    setLocalChannels: React.Dispatch<React.SetStateAction<GetPrivateChannel[]>>
  ) {
    this.socket.on("newWhisper", (payload: any) => {
      const senderIsBlocked = this.blockedUser.some(
        (user) => user.id === payload.whisper.senderId
      );
      if (!senderIsBlocked) {
        createPrivateChannel(
          payload.userFrom,
          payload.userTo,
          this.localChannels,
          setChannels,
          setLocalChannels
        );
        setChannelMessages((prevMessages: any) => [
          ...(prevMessages ?? []),
          payload.whisper,
        ]);
      }
    });
  }

  public sendWhisper(whisper: Message, userFrom: any, userTo: any) {
    const payload = {
      whisper: whisper,
      userFrom: createChannelUser(userFrom),
      userTo: createChannelUser(userTo),
    };
    this.socket.emit("sendWhisper", payload);
  }

  public getSocket(): Socket {
    return this.socket;
  }

  public onUserChanged(
    setOnUserChanged: React.Dispatch<React.SetStateAction<number>>
  ) {
    this.socket.on("users/user_changed", () => {
      setOnUserChanged((prevUser) => prevUser + 1);
    });
  }

  public onChannelChanged(
    setAddChannel: React.Dispatch<React.SetStateAction<number>>
  ) {
    this.socket.on("users/channel_changed", () => {
      setAddChannel((prevAddChannel) => prevAddChannel + 1);
    });
  }
}
