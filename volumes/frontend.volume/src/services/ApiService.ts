import {
  PublicUser,
  CurrentUser,
  createChannel,
  ChannelType,
  GetPublicChannel,
  GetPrivateChannel,
  ChannelUsers,
  MatchHistory,
} from "./ApiServiceDto";

export default class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  public async fetchUsers(): Promise<PublicUser[]> {
    try {
      const url = new URL("/api/users/everyone_else", this.baseUrl).href;
      const response = await fetch(url, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(
          `Network response was not ok. Status: ${response.status}`
        );
      }

      return (await response.json()) as PublicUser[];
    } catch (error: any) {
      console.error("Error fetching users:", error.message || error);
      throw error;
    }
  }

  public async fetchCurrentUser(): Promise<CurrentUser> {
    try {
      const url = new URL("/api/users/me", this.baseUrl).href;
      const response = await fetch(url, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(
          `Network response was not ok. Status: ${response.status}`
        );
      }
      const ret = (await response.json()) as CurrentUser;
      return ret;
    } catch (error: any) {
      console.error("Error fetching current user", error.message || error);
      throw error;
    }
  }

  public async fetchUnfriend(userId: number): Promise<void> {
    try {
      const url = new URL(`/api/users/me/unfriend/${userId}`, this.baseUrl)
        .href;
      await fetch(url, {
        method: "PATCH",
        credentials: "include",
      });
    } catch (error: any) {
      console.error("Error unfriending user:", error.message || error);
      throw error;
    }
  }

  public async fetchInviteFriend(userId: number): Promise<void> {
    try {
      const url = new URL(`/api/users/me/invite_friend/${userId}`, this.baseUrl)
        .href;
      await fetch(url, {
        method: "PATCH",
        credentials: "include",
      });
    } catch (error: any) {
      console.error("Error inviting user:", error.message || error);
      throw error;
    }
  }

  public async fetchAcceptFriend(userId: number): Promise<void> {
    try {
      const url = new URL(`/api/users/me/accept_friend/${userId}`, this.baseUrl)
        .href;
      await fetch(url, {
        method: "PATCH",
        credentials: "include",
      });
    } catch (error: any) {
      console.error("Error accepting user:", error.message || error);
      throw error;
    }
  }

  public async fetchDeclineFriend(userId: number): Promise<void> {
    try {
      const url = new URL(
        `/api/users/me/reject_invitation_friend/${userId}`,
        this.baseUrl
      ).href;
      await fetch(url, {
        method: "PATCH",
        credentials: "include",
      });
    } catch (error: any) {
      console.error("Error rejecting user:", error.message || error);
      throw error;
    }
  }

  public async fetchInvitationRecived(): Promise<PublicUser[]> {
    try {
      const url = new URL(
        "/api/users/me/friend_invitations_received",
        this.baseUrl
      ).href;
      const response = await fetch(url, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(
          `Network response was not ok. Status: ${response.status}`
        );
      }

      return (await response.json()) as PublicUser[];
    } catch (error: any) {
      console.error(
        "Error fetching invitation received:",
        error.message || error
      );
      throw error;
    }
  }

  public async createChannel(channel: createChannel): Promise<any> {
    try {
      const channelData = {
        ...channel,
        type: ChannelType[channel.type],
      };

      const url = new URL("/api/channels", this.baseUrl).href;
      const response = await fetch(url, {
        method: "POST",
        credentials: "include",
        body: JSON.stringify(channelData),
        headers: {
          "Content-Type": "application/json",
        },
      });

      return await response.json();
    } catch (error: any) {
      console.error("Error creating chanel:", error.message || error);
      throw error;
    }
  }

  public async getPublicChannels(): Promise<GetPublicChannel[]> {
    try {
      const url = new URL("/api/channels/public", this.baseUrl).href;
      const response = await fetch(url, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(
          `Network response was not ok. Status: ${response.status}`
        );
      }

      return (await response.json()) as GetPublicChannel[];
    } catch (error: any) {
      console.error("Error fetching channels:", error.message || error);
      throw error;
    }
  }

  public async getMyChannels(): Promise<GetPrivateChannel[]> {
    try {
      const url = new URL("/api/channels/me", this.baseUrl).href;
      const response = await fetch(url, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(
          `Network response was not ok. Status: ${response.status}`
        );
      }

      return (await response.json()) as GetPrivateChannel[];
    } catch (error: any) {
      console.error("Error fetching channels:", error.message || error);
      throw error;
    }
  }


  public async joinChannel(
    roomId: string,
    password: string | null
  ): Promise<any> {
    try {
      const url = new URL(
        `/api/channels/public/join/${roomId}?password=${password}`,
        this.baseUrl
      ).href;
      await fetch(url, {
        method: "POST",
        credentials: "include",
      });
    } catch (error: any) {
      console.error("Error joining room:", error.message || error);
      throw error;
    }
  }

  public async fetchHistory(id: number): Promise<MatchHistory | null> {
    try {
      const historyUrl = new URL(`/api/users/games/${id}`, this.baseUrl).href;
      const response = await fetch(historyUrl, {
        credentials: "include",
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching history:", error);
      return null;
    }
  }


  public async setOnGame(id: number, isOnGame: boolean): Promise<void> {
    try {
      const url = new URL(`/api/users/is_on_game/${id}`, this.baseUrl).href;
      await fetch(url, {
        method: 'PATCH',
        credentials: 'include',
        body: JSON.stringify({ is_on_game: isOnGame }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (error: any) {
      console.error("Error setting is_on_game:", error.message || error);
      throw error;
    }
}

  public async getOnGame(id: number): Promise<boolean> {
    try {
      const url = new URL(`/api/users/is_on_game/${id}`, this.baseUrl).href;
      const response = await fetch(url, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(
          `Network response was not ok. Status: ${response.status}`
        );
      }

      return (await response.json()) as boolean;
    } catch (error: any) {
      console.error("Error getting is_on_game:", error.message || error);
      throw error;
    }
  }

  public async setChannelPassword(
    roomId: string,
    password: string,
    oldPassword: string,
    type: string
  ): Promise<any> {
    const res = {
      type: type,
      oldPassword: oldPassword,
      newPassword: password,
    };
    try {
      const url = new URL(
        `/api/channels/owner/change_type_password/${roomId}`,
        this.baseUrl
      ).href;
      const response = await fetch(url, {
        method: "PATCH",
        credentials: "include",
        body: JSON.stringify(res),
        headers: {
          "Content-Type": "application/json",
        },
      });
      return await response.json();
    } catch (error: any) {
      console.error("Error setting password:", error.message || error);
      throw error;
    }
  }

  public async deleteChannel(roomId: string): Promise<any> {
    try {
      const url = new URL(`/api/channels/owner/${roomId}`, this.baseUrl).href;
      const res = await fetch(url, {
        method: "DELETE",
        credentials: "include",
      });
      return await res.json();
    } catch (error: any) {
      console.error("Error deleting room:", error.message || error);
      throw error;
    }
  }

  public async leaveChannel(roomId: string): Promise<any> {
    try {
      const url = new URL(`/api/channels/me/leave/${roomId}`, this.baseUrl)
        .href;
      const res = await fetch(url, {
        method: "POST",
        credentials: "include",
      });
      return await res.json();
    } catch (error: any) {
      console.error("Error leaving room:", error.message || error);
      throw error;
    }
  }

  public async setAdminByOwner(roomId: string, userId: number): Promise<any> {
    try {
      const ret = {
        userId: userId,
        channelId: roomId,
      };
      const url = new URL(`/api/channels/owner/set_admin`, this.baseUrl).href;
      const res = await fetch(url, {
        method: "PATCH",
        credentials: "include",
        body: JSON.stringify(ret),
        headers: {
          "Content-Type": "application/json",
        },
      });
      return await res.json();
    } catch (error: any) {
      console.error("Error setting admin:", error.message || error);
      throw error;
    }
  }

  public async kickUserByAdmin(roomId: string, userId: number): Promise<any> {
    try {
      const ret = {
        userId: userId,
        channelId: roomId,
      };
      const url = new URL(`/api/channels/admin/kick_user`, this.baseUrl).href;
      const res = await fetch(url, {
        method: "PATCH",
        credentials: "include",
        body: JSON.stringify(ret),
        headers: {
          "Content-Type": "application/json",
        },
      });
      return await res.json();
    } catch (error: any) {
      console.error("Error kicking user:", error.message || error);
      throw error;
    }
  }

  public async muteUserByAdmin(roomId: string, userId: number): Promise<any> {
    try {
      const ret = {
        userId: userId,
        channelId: roomId,
      };
      const url = new URL(`/api/channels/admin/mute_user`, this.baseUrl).href;
      const res = await fetch(url, {
        method: "PATCH",
        credentials: "include",
        body: JSON.stringify(ret),
        headers: {
          "Content-Type": "application/json",
        },
      });
      return await res.json();
    } catch (error: any) {
      console.error("Error muting user:", error.message || error);
      throw error;
    }
  }

  public async banUserByAdmin(roomId: string, userId: number): Promise<any> {
    try {
      const ret = {
        userId: userId,
        channelId: roomId,
      };
      const url = new URL(`/api/channels/admin/ban_user`, this.baseUrl).href;
      const res = await fetch(url, {
        method: "PATCH",
        credentials: "include",
        body: JSON.stringify(ret),
        headers: {
          "Content-Type": "application/json",
        },
      });
      return await res.json();
    } catch (error: any) {
      console.error("Error banning user:", error.message || error);
      throw error;
    }
  }

  public async inviteUserByAdmin(roomId: string, userId: number): Promise<any> {
    try {
      const ret = {
        userId: userId,
        channelId: roomId,
      };
      const url = new URL(`/api/channels/admin/invite_user`, this.baseUrl).href;
      const res = await fetch(url, {
        method: "PATCH",
        credentials: "include",
        body: JSON.stringify(ret),
        headers: {
          "Content-Type": "application/json",
        },
      });
      return await res.json();
    } catch (error: any) {
      console.error("Error inviting user:", error.message || error);
      throw error;
    }
  }

  public async getMyBlockedUsers(): Promise<PublicUser[]> {
    try {
      const url = new URL("/api/users/me/blocked_user", this.baseUrl).href;
      const response = await fetch(url, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(
          `Network response was not ok. Status: ${response.status}`
        );
      }

      return (await response.json()) as PublicUser[];
    } catch (error: any) {
      console.error("Error fetching blocked users:", error.message || error);
      throw error;
    }
  }

  public async blockUser(userId: number): Promise<any> {
    try {
      const url = new URL(`/api/users/me/blockuser/${userId}`, this.baseUrl).href;
      const res = await fetch(url, {
        method: "PATCH",
        credentials: "include",
      });
      return await res.json();
    } catch (error: any) {
      console.error("Error blocking user:", error.message || error);
      throw error;
    }
  }

  public async unBlockUser(userId: number): Promise<any> {
    try {
      const url = new URL(`/api/users/me/unblockuser/${userId}`, this.baseUrl).href;
      const res = await fetch(url, {
        method: "PATCH",
        credentials: "include",
      });
      return await res.json();
    } catch (error: any) {
      console.error("Error unblocking user:", error.message || error);
      throw error;
    }
  }

  public async getUserById(id: number): Promise<string | null> {
    const userUrl = new URL(`/api/users/name/${id}`, this.baseUrl).href;
    const response = await fetch(userUrl,{
      method: "GET",
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const userName = await response.text();
    return userName;
  }
}
