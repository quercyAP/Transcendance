import React, { useState, useEffect, useRef } from 'react';
import css from '../../styles/ChatComponent.module.css';
import { useNavRef } from '../../context/navContext';
import { gsap } from "gsap";
import ChatSvg, { PointRefObject } from '../../components/navBar/ChatSvg';
import ParamSvg from "../../components/navBar/ParamSvg";
import FriendSvg, { CircleRefObject } from "../../components/navBar/FriendSvg";
import { ChannelType, ChannelUsers, PublicUser } from '../../services/ApiServiceDto';
import { Message } from '../../services/ApiServiceDto';
import SocketService from '../../services/SocketService';
import ApiService from '../../services/ApiService';
import { v4 as uuidv4 } from 'uuid';
import { createPrivateChannel, createChannelUser } from "../../lib/whisper";


const ChatComponent = ({ socket, messages }: { socket: SocketService | undefined | null, messages: Message[] }) => {
    const [newMessage, setNewMessage] = useState('');
    const [filterMode, setFilterMode] = useState('chat');
    const endOfMessagesRef = useRef<HTMLDivElement>(null);
    const [tmpChannelPassword, setTmpChannelPassword] = useState('');
    const [tmpOldChannelPassword, setTmpOldChannelPassword] = useState('');
    const [timerId, setTimerId] = useState<NodeJS.Timeout | null>(null);
    const [isError, setIsError] = useState(false);
    const [serlectedUser, setSelectedUser] = useState<ChannelUsers | null>(null);
    const [selectPublicUser, setSelectPublicUser] = useState<PublicUser | undefined>(undefined);
    const [pwdMessage, setPwdMessage] = useState('');
    const [leaveMessage, setLeaveMessage] = useState('');
    const [inviteMessage, setInviteMessage] = useState('');
    const [banMessage, setBanMessage] = useState('');
    const [adminMessage, setAdminMessage] = useState('');
    const [muteMessage, setMuteMessage] = useState('');
    const [kickMessage, setKickMessage] = useState('');
    const littleRef = useRef<SVGPathElement>(null);
    const bigRef = useRef<SVGPathElement>(null);
    const pointRef: PointRefObject = {
        a: useRef<SVGPathElement>(null),
        b: useRef<SVGPathElement>(null),
        c: useRef<SVGPathElement>(null),
    };
    const extRef = useRef(null);
    const intRef = useRef(null);
    const circleRef: CircleRefObject = {
        a: useRef<SVGPathElement>(null),
        b: useRef<SVGPathElement>(null),
        c: useRef<SVGPathElement>(null),
    };
    const firstRef = useRef<SVGPathElement>(null);
    const secondRef = useRef<SVGPathElement>(null);
    const thirdRef = useRef<SVGPathElement>(null);
    const apiService = new ApiService(process.env.REVERSE_PROXY_URL ?? '');

    const {
        chatComponentRef,
        activeChannel,
        currentUser,
        publicUsers,
        setShowChatComponent,
        showChatComponent,
        toggleMenu,
        localChannels,
        setShowUserCardsPublicUsers,
        setChannels,
        setLocalChannels,
        setInvitationInfo,
        setShowWaitingRoom,
        setShowStartButton,
        setIsInviting,
        listRef,
    } = useNavRef();
    const [channelType, setChannelType] = useState(activeChannel.type);
    let tl = gsap.timeline();
    const [isWhisper, setIsWhisper] = useState(false);

    const updatePosition = () => {
        if (listRef.current && chatComponentRef.current) {
          const listRect = listRef.current.getBoundingClientRect();
          const chatRect = chatComponentRef.current.getBoundingClientRect();
          let x = listRect.left + listRect.width / 2 - chatRect.width / 2 + 60;

          gsap.set(chatComponentRef.current, {
            x: x,
            y: -460,
          });
        }
      };

    useEffect(() => {
        if (chatComponentRef.current && listRef.current) {
            const listRect = listRef.current.getBoundingClientRect();
            const chatRect = chatComponentRef.current.getBoundingClientRect();
            let x = listRect.left + listRect.width / 2 - chatRect.width / 2 + 60;
            if (!tl.isActive()) {
                tl = gsap.timeline();
                if (chatComponentRef.current) {
                    tl.fromTo(
                        chatComponentRef.current,
                        {
                            x: x,
                            y: chatRect.height,
                        },
                        {
                            y: "-460",
                            duration: 0.2,
                            ease: "power1.out",
                        }
                    );
                }
            }
        }
        if (activeChannel.users.length > 1) {
            setSelectedUser(activeChannel.users.find((user: ChannelUsers) => user.userId !== currentUser?.id));
        }
        setSelectPublicUser(publicUsers.find((user: PublicUser) => user.id !== currentUser?.id));
        window.addEventListener("resize", updatePosition);
        return () => {
            window.removeEventListener("resize", updatePosition);
        };
    }, []);

    useEffect(() => {
        setIsWhisper(activeChannel.type === ChannelType.WHISPER);
    }, [activeChannel]);

    useEffect(() => {
        if (endOfMessagesRef.current) {
            endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleSendMessage = () => {
        if (newMessage.trim() === '') {
            return;
        }
        const currentChanneluser = activeChannel.users.find((user: ChannelUsers) => user.userId === currentUser?.id);
        if (currentChanneluser?.isMuted) {
            const date = new Date(currentChanneluser.unMuteAt).toLocaleString('fr-FR', { hour12: false });
            printErrorMessage("You are muted until " + date, setMuteMessage, true);
            setNewMessage('');
            return;
        }
        if (isWhisper) {
            const userTo = activeChannel.users.find((user: ChannelUsers) => user.userId !== currentUser?.id);
            socket?.sendWhisper({ channelId: activeChannel.id, content: newMessage, name: currentUser?.name }, currentUser, userTo);
            socket?.updateLocalChannels(localChannels);
        } else {
            socket?.sendMessage({ channelId: activeChannel.id, content: newMessage, name: currentUser?.name });
        }
        setNewMessage('');
    };

    const checkAvatar = (user: ChannelUsers) => {
        let avatar;
        if (!user?.avatarUrl || user?.avatarUrl.includes("null")) {
            avatar = user.avatar42Url;
        } else {
            avatar = user?.avatarUrl;
        }
        return avatar;
    };

    const showChat = () => setFilterMode('chat');
    const showParams = () => setFilterMode('params');
    const showUsers = () => setFilterMode('users');
    const isActive = (mode: string) => filterMode === mode;

    const printErrorMessage = (message: string, setFunction: React.Dispatch<React.SetStateAction<string>>, isError: boolean) => {
        setFunction(message);
        setIsError(isError);
        if (timerId) {
            clearTimeout(timerId);
        }

        const timer = setTimeout(() => {
            setFunction('');
        }, 3000);
        setTimerId(timer);
    }

    const truncateString = (str: string) => {
        if (str.length > 11) {
            return str.substring(0, 11 - 3) + '...';
        } else {
            return str;
        }
    }

    const handleSetChannelPassword = async () => {
        if (tmpChannelPassword.trim() === '' || (tmpOldChannelPassword.trim() === '' && activeChannel.type === 'PROTECTED')) {
            return;
        }
        const res = await apiService.setChannelPassword(activeChannel.id, tmpChannelPassword, tmpOldChannelPassword, 'PROTECTED');
        if (res.error) {
            printErrorMessage(res.message, setPwdMessage, true);
        } else {
            printErrorMessage("Password successfully changed", setPwdMessage, false);
        }
        setTmpChannelPassword('');
        setTmpOldChannelPassword('');
    };

    const handleUpdateChannelType = async () => {
        const res = await apiService.setChannelPassword(activeChannel.id, '', '', channelType);
        if (res.error) {
            printErrorMessage(res.message, setPwdMessage, true);
        } else {
            printErrorMessage("Type successfully changed", setPwdMessage, false);
        }
    };

    const handleDeleteChannel = async () => {
        const ret = await apiService.deleteChannel(activeChannel.id);
        if (ret.error) {
            printErrorMessage(ret.message, setLeaveMessage, true);
        } else {
            toggleMenu({ ref: chatComponentRef, dispatch: setShowChatComponent, show: showChatComponent });
        }
    };

    const handleLeaveChannel = async () => {
        const res = await apiService.leaveChannel(activeChannel.id);
        if (!res.error) {
            toggleMenu({ ref: chatComponentRef, dispatch: setShowChatComponent, show: showChatComponent });
        } else {
            printErrorMessage(res.message, setLeaveMessage, true);
        }
    };

    const handleSetAdmin = async () => {
        if (serlectedUser) {
            const ret = await apiService.setAdminByOwner(activeChannel.id, serlectedUser.userId);
            if (ret.error) {
                printErrorMessage(ret.message, setAdminMessage, true);
            }
            else {
                printErrorMessage(serlectedUser.name + " successfully set as admin", setAdminMessage, false);
            }
        }
    };

    const handleKickUser = async () => {
        if (serlectedUser) {
            const res = await apiService.kickUserByAdmin(activeChannel.id, serlectedUser.userId);
            if (res.error) {
                printErrorMessage(res.message, setKickMessage, true);
            }
            else {
                printErrorMessage(serlectedUser.name + " successfully kicked", setKickMessage, false);
            }
        }
    }

    const handleMuteUser = async () => {
        if (serlectedUser) {
            const res = await apiService.muteUserByAdmin(activeChannel.id, serlectedUser.userId);
            if (res.error) {
                printErrorMessage(res.message, setMuteMessage, true);
            }
            else {
                printErrorMessage(serlectedUser.name + " muted for +10s", setMuteMessage, false);
            }
        }
    }

    const handleBanUser = async () => {
        if (serlectedUser) {
            const res = await apiService.banUserByAdmin(activeChannel.id, serlectedUser.userId);
            if (res.error) {
                printErrorMessage(res.message, setBanMessage, true);
            }
            else {
                printErrorMessage(serlectedUser.name + " banned", setBanMessage, false);
            }
        }
    }

    const handleInviteUser = async () => {
        if (selectPublicUser) {
            const res = await apiService.inviteUserByAdmin(activeChannel.id, selectPublicUser.id);
            if (res.error) {
                printErrorMessage(res.message, setInviteMessage, true);
            }
            else {
                printErrorMessage(selectPublicUser.name + " invited", setInviteMessage, false);
            }
        }
    }

    const handleWhisper = (userTo: ChannelUsers) => {
        createPrivateChannel(createChannelUser(userTo), createChannelUser(currentUser), localChannels, setChannels, setLocalChannels);
    };

    const handleInvite = (user: ChannelUsers) => {
        if (user.isOnline === false) {
            alert("You can't invite someone who is offline!");
            return;
        }

        if (currentUser?.isOnGame) {
            alert("You can't invite someone while you are in game!");
            return;
        }

        if (publicUsers.some((puser) => puser.id === user.userId && puser.isOnGame)) {
            alert("You can't invite someone who is in game!");
            return;
        }
        const host = currentUser?.id.toString() ?? '';
        const guest = user.userId.toString() ?? '';
        setInvitationInfo({ host: host, guest: guest, gameId: `${host}-${guest}` });
        setShowWaitingRoom(true);
        setShowStartButton(false);
        setIsInviting(true);
    };

    const handleName = (message: any) => {
        const name = publicUsers.find((user: PublicUser) => user.id === message.senderId)?.name;
        return name ? name : currentUser?.name;
    }

    return (
        <div className={`${css.Box}z-10`} ref={chatComponentRef}>
            <div className={`${css.Before}`}></div>
            <div className={`${css.Container}`}>
                {!isWhisper ? (
                    <h2 className='font-bold flex justify-center'>Channel: {activeChannel.name}</h2>
                ) : (
                    <h2 className='font-bold flex justify-center'>Whisper: {activeChannel.name}</h2>
                )
                }
                <div className='flex justify-center'>
                    <button
                        onClick={showUsers}
                        className={`${isActive('users') ? css.activeButton : 'w-[30px] h-[30px]'}`}>
                        <FriendSvg circleRef={circleRef} firstRef={firstRef} secondRef={secondRef} thirdRef={thirdRef} />
                    </button>
                    {!isWhisper &&
                        <button
                            onClick={showParams}
                            className={`${isActive('params') ? css.activeButton : 'w-[30px] h-[30px]'}`}>
                            <ParamSvg extRef={extRef} intRef={intRef} />
                        </button>
                    }
                    <button
                        onClick={showChat}
                        className={`${isActive('chat') ? css.activeButton : 'w-[30px] h-[30px]'}`}>
                        <ChatSvg pointRef={pointRef} littleRef={littleRef} bigRef={bigRef} />
                    </button>
                </div>
                {isActive('chat') && (
                    <>
                        <div className={`${css.ListContainer}`}>
                            {messages.map(message => (
                                <div key={message.messageId}>
                                    <b>{handleName(message)}:</b> {message.content}
                                </div>
                            ))}
                            <div ref={endOfMessagesRef} />
                        </div>
                        <div className={`flex h-7`}>
                            <textarea
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Écrire un message..."
                                className={`color-white bg-sky-950 rounded w-full text-xs ${css.TextArea}`}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                            />
                        </div>
                        <p className={`text-center font-bold text-red-500`}>{muteMessage}</p>
                    </>
                )}
                {!isWhisper && isActive('params') && (
                    <div className={`${css.ParamsContainer}`}>
                        <div className={`${css.Text}`}>Paramètres</div>
                        <div className='flex mb-1'>
                            <select
                                className='text-base text-gray-700 placeholder-gray-600 border rounded-lg'
                                value={channelType}
                                onChange={(e) => setChannelType((e.target.value))}
                            >
                                <option value="PUBLIC">Public</option>
                                <option value="PROTECTED">Protected</option>
                                <option value="PRIVATE">Private</option>
                            </select>
                            {channelType !== activeChannel.type && channelType !== 'PROTECTED' &&
                                <button onClick={handleUpdateChannelType}>Update Type</button>
                            }
                        </div>
                        {channelType === 'PROTECTED' &&
                            <div className='flex mb-1'>
                                <div className='flex-col'>
                                    <input
                                        type="text"
                                        placeholder="Old Password"
                                        value={tmpOldChannelPassword}
                                        onChange={(e) => setTmpOldChannelPassword(e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        placeholder="New Password"
                                        value={tmpChannelPassword}
                                        onChange={(e) => setTmpChannelPassword(e.target.value)}
                                    />
                                </div>
                                <button onClick={handleSetChannelPassword}>Set Channel Password</button>
                            </div>
                        }
                        <p className={`text-center font-bold ${isError ? 'text-red-500' : 'text-green-500'}`}>{pwdMessage}</p>
                        <div className="flex mb-1">
                            <select
                                className='text-base text-gray-700 placeholder-gray-600 border rounded-lg'
                                value={serlectedUser?.name}
                                onChange={(e) => setSelectedUser(activeChannel.users.find((user: ChannelUsers) => user.name === e.target.value))}
                            >
                                {activeChannel.users.map((user: ChannelUsers) => (
                                    user.userId !== currentUser?.id &&
                                    <option key={user.userId} value={user.name}>{truncateString(user.name)}</option>
                                ))}
                            </select>
                            <button onClick={handleSetAdmin}>Set as Admin</button>
                        </div>
                        <div className='flex mb-1'>
                            <select
                                className='text-base text-gray-700 placeholder-gray-600 border rounded-lg'
                                value={serlectedUser?.name}
                                onChange={(e) => setSelectedUser(activeChannel.users.find((user: ChannelUsers) => user.name === e.target.value))}
                            >
                                {activeChannel.users.map((user: ChannelUsers) => (
                                    user.userId !== currentUser?.id &&
                                    <option key={user.userId} value={user.name}>{truncateString(user.name)}</option>
                                ))}
                            </select>
                            <button onClick={handleMuteUser}>Mute</button>
                            <button onClick={handleKickUser}>Kick</button>
                            <button onClick={handleBanUser}>Ban</button>
                        </div>
                        <div className='flex mb-1'>
                            <select
                                className='text-base text-gray-700 placeholder-gray-600 border rounded-lg'
                                value={selectPublicUser?.name}
                                onChange={(e) => { setSelectPublicUser(publicUsers.find((user: PublicUser) => user.name === e.target.value)) }}
                            >
                                {publicUsers.map((user: PublicUser) => (
                                    user.id !== currentUser?.id &&
                                    <option key={user.id} value={user.name}>{truncateString(user.name)}</option>
                                ))}
                            </select>
                            <button onClick={handleInviteUser}>Invite</button>
                        </div>
                        <p className={`text-center font-bold ${isError ? 'text-red-500' : 'text-green-500'}`}>{adminMessage}</p>
                        <p className={`text-center font-bold ${isError ? 'text-red-500' : 'text-green-500'}`}>{kickMessage}</p>
                        <p className={`text-center font-bold ${isError ? 'text-red-500' : 'text-green-500'}`}>{muteMessage}</p>
                        <p className={`text-center font-bold ${isError ? 'text-red-500' : 'text-green-500'}`}>{banMessage}</p>
                        <p className={`text-center font-bold ${isError ? 'text-red-500' : 'text-green-500'}`}>{inviteMessage}</p>
                        <button onClick={handleLeaveChannel}>Leave Channel</button>
                        <button onClick={handleDeleteChannel}>Delete Channel</button>
                        <p className={`text-center font-bold ${isError ? 'text-red-500' : 'text-green-500'}`}>{leaveMessage}</p>
                    </div>
                )}
                {isActive('users') && (
                    <div className={`${css.ListContainer}`}>
                        {activeChannel.users.map((user: ChannelUsers) => (
                            <> {user.userId !== currentUser?.id &&
                                <div key={uuidv4()} className={css.FriendItem}>
                                    <img
                                        className={css.Avatar}
                                        src={checkAvatar(user)}
                                        alt={`${user.name}'s avatar`}
                                        width="40"
                                    />
                                    <div className={css.FriendDetail}>
                                        <span className={css.FriendName}>{user.name}</span>
                                        <div className={css.ButtonGroup}>
                                            <button onClick={() => handleWhisper(user)}>Chat</button>
                                            <button
                                                className={publicUsers.some((puser) => puser.id === user.userId && puser.isOnline && !puser.isOnGame) ? "bg-green-500" : "bg-red-500"}
                                                onClick={() => handleInvite(user)}
                                            >
                                                Game
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setShowUserCardsPublicUsers(
                                                        (showCardsPublicUsers) => {
                                                            const isUserAlreadyInArray =
                                                                showCardsPublicUsers.some(
                                                                    (userItem) => {
                                                                        if (userItem.id)
                                                                            return userItem.id === user.userId
                                                                        return userItem.userId === user.userId
                                                                    }
                                                                );
                                                            if (!isUserAlreadyInArray) {
                                                                return [...showCardsPublicUsers, user];
                                                            }
                                                            return showCardsPublicUsers;
                                                        }
                                                    );
                                                }}
                                            >
                                                Card
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            }
                            </>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatComponent;
