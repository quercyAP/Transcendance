"use client";
import css from "../styles/Home.module.css";
import UserCard from "../components/UserCard";
import ChatRoomList from "../components/channel/ChatRoomList";
import NavBar from "../components/navBar/NavBar";
import { useNavRef } from "../context/navContext";
import Profile from "../components/Profile";
import FriendsList from "../components/navBar/FriendsList";
import { useEffect, useRef, useState } from "react";
import SocketService from "../services/SocketService";
import ApiService from "../services/ApiService";
import { useRouter } from "next/navigation";
import ChatComponent from "../components/channel/ChatComponent";
import Game from "../components/Game";
import WaitingRoom from "../components/navBar/WaitingRoom";
import InviteRoom from "../components/navBar/InviteRoom";
import MatchHistory from "../components/navBar/MatchHistory";
import { GameProvider } from "../context/gameContext";
import { CurrentUser, Message } from "../services/ApiServiceDto";
import Auth2fa from "../components/Auth2fa";
import Cookies from 'js-cookie';

const Home = () => {
  const {
    showChat,
    showProfile,
    showFriendsList,
    setCurrentUser,
    setPublicUsers,
    showCardsPublicUsers,
    clientBaseUrl,
    showChatComponent,
    showWaitingRoom,
    setShowWaitingRoom,
    showGame,
    showMatchHistory,
    activeChannel,
    currentUser,
    setBlinkingChannelId,
    setChannels,
    localChannels,
    setLocalChannels,
    setAddChannel,
    setShowUserCardsPublicUsers,
    is2faEnabled,
    is2faLoggedIn,
    setOnUserChanged,
    onUserChanged,
    setBlockedUser,
    setInvitationReceived,
    blockedUser,
    isCodeScanned,
    setIsCodeScanned,
    showStartButton,
    setShowStartButton,
    setInvitationInfo,
    setIsInviting,
    setShowInviteRoom,
    showInviteRoom,
    setIsLoggedIn,
  } = useNavRef();

  const apiService = new ApiService(clientBaseUrl + "/users");
  const [channelMessages, setChannelMessages] = useState<any[]>([]);
  const [activeMessages, setActiveMessages] = useState<Message[]>([]);
  const [matchStarted, setMatchStarted] = useState<boolean | null>(false);
  const chatSocketService = useRef<SocketService | null>(null);
  const gameSocketService = useRef<SocketService | null>(null);
  const [status, setStatus] = useState<any>();
  const [cookieValue, setCookieValue] = useState(Cookies.get('trans42_access'));
  const router = useRouter();

  useEffect(() => {
    setShowInviteRoom(showInviteRoom);
    setShowWaitingRoom(showWaitingRoom);
  }, [showInviteRoom, showWaitingRoom]);


  useEffect(() => {
    if (channelMessages) {
      chatSocketService.current?.updateBlockedUser(blockedUser);
      setBlinkingChannelId(
        channelMessages[channelMessages.length - 1]?.channelId
      );
      setActiveMessages(
        channelMessages.filter((message) => message.channelId === activeChannel?.id)
      );
    }
  }, [channelMessages, activeChannel, blockedUser]);

  useEffect(() => {
    const socketService = new SocketService(
      clientBaseUrl + "/users",
      "/api/socket.io/",
      ["websocket"],
      true,
      localChannels,
      blockedUser,
    );
    chatSocketService.current = socketService;

    socketService.onNewMessage(setChannelMessages);
    socketService.onUserChanged(setOnUserChanged);
    socketService.onNewWhisper(
      setChannelMessages,
      setChannels,
      setLocalChannels
    );
    socketService.onChannelChanged(setAddChannel);
    socketService.onDisconnect(router);

    apiService.fetchCurrentUser().then((me): void => {
      setCurrentUser(me);
      setShowUserCardsPublicUsers([me]);
      const gameSocket = new SocketService(
        clientBaseUrl,
        "/game/api/socket.io/",
        ["websocket"],
        true,
        undefined,
        undefined,
        me.id.toString()
      )
      gameSocketService.current = gameSocket;

      // A mettre en prod
      gameSocketService.current?.onDisconnect(router);


      gameSocketService.current?.onMatchStarted(
        setMatchStarted,
        setStatus,
        setInvitationInfo,
        setShowInviteRoom,
        setShowWaitingRoom,
        setIsInviting,
        setShowStartButton,
        showWaitingRoom);
        apiService.setOnGame(me.id, false);
    });


 
    apiService.fetchUsers().then((users) => setPublicUsers(users));
    apiService.getMyBlockedUsers().then((blocked) => setBlockedUser(blocked));
    apiService
      .fetchInvitationRecived()
      .then((invit) => setInvitationReceived(invit));
    return () => {
      // chatSocketService.current?.getSocket().off("newMessage");
      // chatSocketService.current?.getSocket().off("newWhisper");
      // chatSocketService.current?.getSocket().off("users/channel_changed");
      // chatSocketService.current?.getSocket().off("users/user_changed");
      gameSocketService.current?.getSocket().disconnect();
      chatSocketService.current?.getSocket().disconnect();
    };
  }, []);

  useEffect(() => {
    const getAll = async () => {
      const users = await apiService.fetchUsers();
      setPublicUsers(users);
      const invit = await apiService.fetchInvitationRecived();
      setInvitationReceived(invit);
      const me = await apiService.fetchCurrentUser();
      setCurrentUser(me);
      const blockedUser = await apiService.getMyBlockedUsers();
      setBlockedUser(blockedUser);

      setIsCodeScanned(me.is2FAEnabled);
      setShowUserCardsPublicUsers((prev) => {
        const updatedUsers = prev.map((userCard) => {
          const foundUser = users.find((u) => u.id === userCard.id);
          return foundUser ? foundUser : userCard;
        });

        const meIndex = updatedUsers.findIndex(
          (userCard) => userCard.id === me.id
        );
        if (meIndex !== -1) {
          updatedUsers[meIndex] = me;
        }

        return updatedUsers;
      });
    };
    getAll();
  }, [onUserChanged]);

  useEffect(() => {
    function checkCookieChange() {
      const currentCookieValue = Cookies.get('trans42_access');
      if (currentCookieValue !== cookieValue) {
        setCookieValue(currentCookieValue);
        router.push('/login');
      }
    }

    const intervalId = setInterval(checkCookieChange, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [cookieValue, router]);

  const socket = gameSocketService.current?.getSocket();

  const handleStartClick = () => {
    // socketGame?.onMatchStarted(setMatchStarted, setStatus);
    setShowWaitingRoom(true);
    setShowStartButton(false);
  };

  return (
    <>
      <div className={`${css.usercard}`}>
        {showCardsPublicUsers.map((user: CurrentUser, index: any) => (
          <UserCard user={user} />
        ))}
      </div>

      <div className={`${css.profile}`}>{showProfile && <Profile />}</div>

      <div className={`${css.code2fa}`}>
        {is2faEnabled && !is2faLoggedIn && !isCodeScanned && <Auth2fa />}
      </div>

      <div className={`${css.chatroom}`}>{!showChat && <ChatRoomList />}</div>

      <div className={`${css.friendlist}`}>
        {showFriendsList && <FriendsList socket={socket} id={currentUser} />}
      </div>

      <div className={`${css.ChatComponent}`}>
        {showChatComponent && socket && (
          <ChatComponent
            socket={chatSocketService.current}
            messages={activeMessages}
          />
        )}
      </div>
      <div className={`${css.navbar}`}>
        <NavBar socket={chatSocketService.current?.getSocket()} />
      </div>
      {showStartButton && (
        <div className={`${css.Box}`}>
          <div className={`${css.Before}`}>
            <div className={`${css.Container}`}>
              <button

                style={{ fontSize: "30px", padding: "10px" }}
                className="text-white"
                onClick={handleStartClick}
              >
                Start
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`${css.matchHistory}`}>
        {showMatchHistory && <MatchHistory />}
      </div>

      {showWaitingRoom && (
        <div className={`${css.waitingRoom}`}>
          <WaitingRoom
            matchStarted={matchStarted}
            setMatchStarted={setMatchStarted}
            status={status}
            socket={socket}
          />
        </div>
      )}
      {showInviteRoom && (
        <div className={`${css.waitingRoom}`}>
          <InviteRoom
            matchStarted={matchStarted}
            setMatchStarted={setMatchStarted}
            socket={socket}
          />
        </div>
      )}

      <GameProvider>
        <div className={`${css.game}`}>
          {showGame && (
            <Game socket={socket} status={status} id={currentUser} />
          )}
        </div>
      </GameProvider>
    </>
  );
};

export default Home;
