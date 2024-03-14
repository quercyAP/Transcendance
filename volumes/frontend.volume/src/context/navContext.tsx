"use client";
import { createContext, useRef, useState, useContext } from "react";
import { gsap } from "gsap";
import { CurrentUser, GetPrivateChannel, PublicUser } from "../services/ApiServiceDto";
import { Socket } from "socket.io-client";
import { Match, inviteInfo  } from "../services/ApiServiceDto";

interface ToggleMenuProps {
  ref: React.RefObject<HTMLElement>;
  dispatch: React.Dispatch<React.SetStateAction<boolean>>;
  show: boolean;
}

interface NavContextType {
  // ChatRoomListProps
  chatRoomRef: React.RefObject<HTMLDivElement>;
  chatRoomRect: DOMRect | null;
  setChatRoomRect: React.Dispatch<React.SetStateAction<DOMRect | null>>;
  chatButtonRect: DOMRect | null;
  setChatButtonRect: React.Dispatch<React.SetStateAction<DOMRect | null>>;
  addChannel: number;
  setAddChannel: React.Dispatch<React.SetStateAction<number>>;
  showChat: boolean;
  setShowChat: React.Dispatch<React.SetStateAction<boolean>>;

  // UserProfileProps
  userButtonRef: React.RefObject<HTMLButtonElement>;
  profileRef: React.RefObject<HTMLDivElement>;

  showProfile: boolean;
  setShowProfile: React.Dispatch<React.SetStateAction<boolean>>;

  // FriendButtonProps
  friendButtonRef: React.RefObject<HTMLButtonElement>;
  friendsListRef: React.RefObject<HTMLDivElement>;
  showFriendsList: boolean;
  setShowFriendsList: React.Dispatch<React.SetStateAction<boolean>>;
  showCardsPublicUsers: any[];
  setShowUserCardsPublicUsers: React.Dispatch<React.SetStateAction<any[]>>;

  // ChatComponentProps
  chatComponentRef: React.RefObject<HTMLDivElement>;
  showChatComponent: boolean;
  setShowChatComponent: React.Dispatch<React.SetStateAction<boolean>>;
  activeChannel: any;
  setActiveChannel: React.Dispatch<React.SetStateAction<any>>;

  //ChanelList
  channels: GetPrivateChannel[];
  setChannels: React.Dispatch<React.SetStateAction<GetPrivateChannel[]>>;
  localChannels: GetPrivateChannel[];
  setLocalChannels: React.Dispatch<React.SetStateAction<GetPrivateChannel[]>>;
  blinkingChannelId: number;
  setBlinkingChannelId: React.Dispatch<React.SetStateAction<number>>;
  listRef: React.RefObject<HTMLDivElement>;

  //WaitingRoom
  showWaitingRoom: boolean;
  setShowWaitingRoom: React.Dispatch<React.SetStateAction<boolean>>;

  //InviteRoom
  showInviteRoom: boolean;
  setShowInviteRoom: React.Dispatch<React.SetStateAction<boolean>>;
  invitationInfo: inviteInfo | null;
  setInvitationInfo: React.Dispatch<React.SetStateAction<inviteInfo | null>>;
  isInviting: boolean;
  setIsInviting: React.Dispatch<React.SetStateAction<boolean>>;

  //ShowGame
  showGame: boolean;
  setShowGame: React.Dispatch<React.SetStateAction<boolean>>;

  //ShowMatchHistory
  showMatchHistory: boolean;
  setShowMatchHistory: React.Dispatch<React.SetStateAction<boolean>>;
  matchHistory: Match[] | null;
  setMatchHistory: React.Dispatch<React.SetStateAction<Match[] | null>>;

  //ShowStats
  showStats: boolean;
  setShowStats: React.Dispatch<React.SetStateAction<boolean>>;
  stats: {
    victories: number;
    defeats: number;
    winRate: number;
    totalMatches: number;
  };
  setStats: React.Dispatch<
    React.SetStateAction<{
      victories: number;
      defeats: number;
      winRate: number;
      totalMatches: number;
    }>
  >;

  // utils
  toggleMenu: ({ ref, dispatch, show }: ToggleMenuProps) => void;

  // User Stats
  avatar: File | null;
  setAvatar: React.Dispatch<React.SetStateAction<File | null>>;

  // Url
  clientBaseUrl: string;
  apiBaseUrl: string;

  // Socket
  currentUser: CurrentUser | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<CurrentUser | null>>;
  onUserChanged: number;
  setOnUserChanged: React.Dispatch<React.SetStateAction<number>>;
  blockedUser: PublicUser[];
  setBlockedUser: React.Dispatch<React.SetStateAction<PublicUser[]>>;
  publicUsers: PublicUser[];
  setPublicUsers: React.Dispatch<React.SetStateAction<PublicUser[]>>;
  invitationSent: PublicUser[];
  setInvitationSent: React.Dispatch<React.SetStateAction<PublicUser[]>>;
  invitationReceived: PublicUser[];
  setInvitationReceived: React.Dispatch<React.SetStateAction<PublicUser[]>>;

  // Game
  showMatch: boolean | undefined;
  setShowMatch: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  showStartButton: boolean;
  setShowStartButton: React.Dispatch<React.SetStateAction<boolean>>;

  // Auth2fa
  is2faEnabled: Boolean | undefined;
  setIs2faEnabled: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  qrCodeUrl: string | null;
  setQrCodeUrl: React.Dispatch<React.SetStateAction<string | null>>;
  isLoggedIn: boolean;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  is2faLoggedIn: boolean;
  setIs2faLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  isCodeScanned: boolean;
  setIsCodeScanned: React.Dispatch<React.SetStateAction<boolean>>;
  // ApiCalls
}

const navContext = createContext<NavContextType>({
  chatRoomRef: { current: null },
  chatRoomRect: null,
  setChatRoomRect: () => {},
  chatButtonRect: null,
  setChatButtonRect: () => {},
  showChat: false,
  setShowChat: () => {},
  addChannel: 0,
  setAddChannel: () => {},

  userButtonRef: { current: null },
  profileRef: { current: null },
  showProfile: false,
  setShowProfile: () => {},

  friendButtonRef: { current: null },
  friendsListRef: { current: null },
  showFriendsList: false,
  setShowFriendsList: () => {},
  showCardsPublicUsers: [],
  setShowUserCardsPublicUsers: () => {},

  chatComponentRef: { current: null },
  showChatComponent: false,
  setShowChatComponent: () => {},
  activeChannel: null,
  setActiveChannel: () => {},
  listRef: { current: null },

  blinkingChannelId: 0,
  setBlinkingChannelId: () => {},
  channels: [],
  setChannels: () => {},
  localChannels: [],
  setLocalChannels: () => {},

  showWaitingRoom: false,
  setShowWaitingRoom: () => {},

  showInviteRoom: false,
  setShowInviteRoom: () => {},
  invitationInfo: null,
  setInvitationInfo: () => {},
  isInviting: false,
  setIsInviting: () => {},

  showGame: false,
  setShowGame: () => {},

  showMatchHistory: false,
  setShowMatchHistory: () => {},
  matchHistory: null,
  setMatchHistory: () => {},

  showStats: false,
  setShowStats: () => {},
  stats: { victories: 0, defeats: 0, winRate: 0, totalMatches: 0 },
  setStats: () => {},

  toggleMenu: () => {},

  avatar: null,
  setAvatar: () => {},

  clientBaseUrl: "",
  apiBaseUrl: "",

  currentUser: null,
  setCurrentUser: () => {},
  onUserChanged: 0,
  setOnUserChanged: () => {},
  publicUsers: [],
  setPublicUsers: () => {},
  blockedUser: [],
  setBlockedUser: () => {},
  invitationSent: [],
  setInvitationSent: () => {},
  invitationReceived: [],
  setInvitationReceived: () => {},

  showMatch: false,
  setShowMatch: () => {},
  showStartButton: false,
  setShowStartButton: () => {},
  is2faEnabled: false,
  setIs2faEnabled: () => {},
  qrCodeUrl: null,
  setQrCodeUrl: () => {},
  isLoggedIn: false,
  setIsLoggedIn: () => {},
  is2faLoggedIn: false,
  setIs2faLoggedIn: () => {},
  isCodeScanned: false,
  setIsCodeScanned: () => {},
});

export const useNavRef = () => useContext(navContext);

export const NavProvider = ({ children }: { children: React.ReactNode }) => {
  const chatRoomRef = useRef<HTMLDivElement>(null);
  const [showChat, setShowChat] = useState(false);
  const [chatRoomRect, setChatRoomRect] = useState<DOMRect | null>(null);
  const [chatButtonRect, setChatButtonRect] = useState<DOMRect | null>(null);
  const [addChannel, setAddChannel] = useState(0);

  const userButtonRef = useRef<HTMLButtonElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const [showProfile, setShowProfile] = useState(false);

  const friendButtonRef = useRef<HTMLButtonElement>(null);
  const friendsListRef = useRef<HTMLDivElement>(null);
  const [showFriendsList, setShowFriendsList] = useState(false);

  const chatComponentRef = useRef<HTMLDivElement>(null);
  const [showChatComponent, setShowChatComponent] = useState(false);
  const [activeChannel, setActiveChannel] = useState(null);

  const listRef = useRef<HTMLDivElement>(null);

  const [showWaitingRoom, setShowWaitingRoom] = useState(false);
  const [showInviteRoom, setShowInviteRoom] = useState(false);
  const [invitationInfo, setInvitationInfo] = useState<inviteInfo | null>(null);
  const [isInviting, setIsInviting] = useState(false);
  const [showMatchHistory, setShowMatchHistory] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState({
    victories: 0,
    defeats: 0,
    winRate: 0,
    totalMatches: 0,
  });
  const [matchHistory, setMatchHistory] = useState<Match[] | null>(null);

  const toggleMenu = ({ ref, dispatch, show }: ToggleMenuProps) => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      gsap.to(ref.current, {
        y: rect.height,
        duration: 0.2,
        ease: "power1.in",
        onComplete: () => {
          dispatch(!show);
        },
      });
    }
  };

  const [avatar, setAvatar] = useState<File | null>(null);

  const clientBaseUrl = process.env.REVERSE_PROXY_URL ?? "";
  const apiBaseUrl = process.env.API_BASE_URL ?? "";

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [onUserChanged, setOnUserChanged] = useState(0);
  const [blockedUser, setBlockedUser] = useState<PublicUser[]>([]);
  const [publicUsers, setPublicUsers] = useState<PublicUser[]>([]);
  const [invitationSent, setInvitationSent] = useState<PublicUser[]>([]);
  const [invitationReceived, setInvitationReceived] = useState<PublicUser[]>(
    [],
  );

  const [showGame, setShowGame] = useState<boolean>(false);

  const [showMatch, setShowMatch] = useState<boolean | undefined>(false);
  const [showStartButton, setShowStartButton] = useState(true);
  const [showCardsPublicUsers, setShowUserCardsPublicUsers] = useState<any[]>(
    [],
  );

  const [blinkingChannelId, setBlinkingChannelId] = useState(0);
  const [channels, setChannels] = useState<GetPrivateChannel[]>([]);
  const [localChannels, setLocalChannels] = useState<GetPrivateChannel[]>([]);
  const [is2faEnabled, setIs2faEnabled] = useState<boolean | undefined>(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [is2faLoggedIn, setIs2faLoggedIn] = useState(false);
  const [isCodeScanned, setIsCodeScanned] = useState(false);

  const contextValue = {
    chatRoomRef,
    chatRoomRect,
    setChatRoomRect,
    chatButtonRect,
    setChatButtonRect,
    showChat,
    setShowChat,
    addChannel,
    listRef,
    setAddChannel,
    userButtonRef,
    profileRef,
    showProfile,
    setShowProfile,
    friendButtonRef,
    friendsListRef,
    showFriendsList,
    setShowFriendsList,
    showWaitingRoom,
    setShowWaitingRoom,
    showInviteRoom,
    setShowInviteRoom,
    invitationInfo,
    setInvitationInfo,
    isInviting,
    setIsInviting,
    showMatchHistory,
    setShowMatchHistory,
    matchHistory,
    setMatchHistory,
    stats,
    setStats,
    showStats,
    setShowStats,
    toggleMenu,
    avatar,
    setAvatar,
    clientBaseUrl,
    apiBaseUrl,
    currentUser,
    setCurrentUser,
    publicUsers,
    setPublicUsers,
    invitationSent,
    setInvitationSent,
    invitationReceived,
    setInvitationReceived,
    chatComponentRef,
    showChatComponent,
    setShowChatComponent,
    activeChannel,
    setActiveChannel,
    blockedUser,
    setBlockedUser,
    showGame,
    setShowGame,
    showCardsPublicUsers,
    setShowUserCardsPublicUsers,
    showMatch,
    setShowMatch,
    showStartButton,
    setShowStartButton,
    blinkingChannelId,
    setBlinkingChannelId,
    channels,
    setChannels,
    localChannels,
    setLocalChannels,
    is2faEnabled,
    setIs2faEnabled,
    qrCodeUrl,
    setQrCodeUrl,
    isLoggedIn,
    setIsLoggedIn,  
    is2faLoggedIn,
    setIs2faLoggedIn,
    isCodeScanned,
    setIsCodeScanned,
    onUserChanged,
    setOnUserChanged,
  };

  return (
    <navContext.Provider value={contextValue}>{children}</navContext.Provider>
  );
};
