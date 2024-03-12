"use client";
import css from "../../styles/FriendsList.module.css";
import { useEffect, useState } from "react";
import { useNavRef } from "../../context/navContext";
import { gsap } from "gsap";
import ApiService from "../../services/ApiService";
import { PublicUser } from "../../services/ApiServiceDto";
import { createPrivateChannel, createChannelUser } from "../../lib/whisper";
import { Socket } from "socket.io-client";
import { CurrentUser } from "../../services/ApiServiceDto";
import { is } from "@react-three/fiber/dist/declarations/src/core/utils";

const FriendsList = ({
  socket,
  id,
}: {
  socket: Socket | undefined;
  id: CurrentUser | null;
}) => {
  const {
    friendButtonRef,
    friendsListRef,
    toggleMenu,
    setShowProfile,
    showProfile,
    profileRef,
    clientBaseUrl,
    currentUser,
    publicUsers,
    invitationReceived,
    setShowUserCardsPublicUsers,
    localChannels,
    setChannels,
    blockedUser,
    setLocalChannels,
  } = useNavRef();
  const apiService = new ApiService(clientBaseUrl);
  const [mergedFriends, setMergedFriends] = useState<PublicUser[]>([]);
  const [filterMode, setFilterMode] = useState("all");
  const [filteredFriends, setFilteredFriends] = useState<PublicUser[]>([]);
  let tl = gsap.timeline();

  const updatePosition = () => {
    if (friendButtonRef.current && friendsListRef.current) {
      const buttonRect = friendButtonRef.current.getBoundingClientRect();
      const friendsListRect = friendsListRef.current.getBoundingClientRect();

      gsap.set(friendsListRef.current, {
        x: buttonRect.x - friendsListRect.width / 2 + buttonRect.width / 2,
        y: "-60",
      });
    }
  };

  const mergeFriends = async () => {
    const friendsWithAvatars = await Promise.all(
      publicUsers.map(async (friend) => {
        const request = invitationReceived.some((inv) => inv.id === friend.id);
        let avatar;
        if (!friend?.avatarUrl || friend?.avatarUrl.includes("null")) {
          avatar = friend.avatar42Url;
        } else {
          avatar = friend?.avatarUrl;
        }

        const isBlocked = blockedUser.some(
          (blockedUser) => blockedUser.id === friend.id
        );

        if (request) {
          return {
            ...friend,
            avatarUrl: avatar,
            pendingFriendRecev: true,
            isBlocked,
          };
        } else {
          return { ...friend, avatarUrl: avatar, isBlocked };
        }
      })
    );
    setMergedFriends(friendsWithAvatars);
  };

  useEffect(() => {
    if (friendButtonRef.current && friendsListRef.current) {
      if (showProfile) {
        toggleMenu({
          ref: profileRef,
          dispatch: setShowProfile,
          show: showProfile,
        });
      }
      const buttonRect = friendButtonRef.current.getBoundingClientRect();
      const friendsListRect = friendsListRef.current.getBoundingClientRect();
      if (!tl.isActive()) {
        tl = gsap.timeline();
        if (friendsListRef.current) {
          tl.fromTo(
            friendsListRef.current,
            {
              x:
                buttonRect.x - friendsListRect.width / 2 + buttonRect.width / 2,
              y: friendsListRect.height,
            },
            {
              y: "-60",
              duration: 0.2,
              ease: "power1.out",
            }
          );
        }
      }
      window.addEventListener("resize", updatePosition);
      return () => {
        window.removeEventListener("resize", updatePosition);
      };
    }
  }, []);

  useEffect(() => {
    mergeFriends();
  }, [blockedUser]);

  useEffect(() => {
    let filtered = [];
    if (filterMode === "friends") {
      filtered = mergedFriends.filter((friend: PublicUser) => friend.isFriend);
    } else if (filterMode === "requests") {
      filtered = mergedFriends.filter(
        (friend) => friend.pendingFriendRecev || friend.invitationSent
      );
    } else {
      filtered = [...mergedFriends];
    }
    setFilteredFriends(filtered);
  }, [filterMode, mergedFriends]);

  const handleAddFriend = async (id: number) => {
    try {
      apiService.fetchInviteFriend(id);
    } catch (err) {
      console.log("handleAddFriend Error: ", err);
    }
  };

  const handleUnFriend = (id: number) => {
    try {
      apiService.fetchUnfriend(id);
    } catch (err) {
      console.log("handleUnFriend Error: ", err);
    }
  };

  const handleAcceptFriend = async (id: number) => {
    try {
      apiService.fetchAcceptFriend(id);
    } catch (err) {
      console.log("handleAcceptFriend Error: ", err);
    }
  };

  const handleDeclineFriend = async (id: number) => {
    try {
      apiService.fetchDeclineFriend(id);
    } catch (err) {
      console.log("handleDeclineFriend Error: ", err);
    }
  };

  const handleWhisper = (userTo: PublicUser) => {
    createPrivateChannel(
      createChannelUser(userTo),
      createChannelUser(currentUser),
      localChannels,
      setChannels,
      setLocalChannels
    );
  };

  const handleBlockUser = (user: PublicUser) => {
    if (!user.isBlocked) {
      apiService.blockUser(user.id);
    } else {
      apiService.unBlockUser(user.id);
    }
  };

  const showAllUsers = () => setFilterMode("all");
  const showOnlyFriends = () => setFilterMode("friends");
  const showOnlyRequests = () => setFilterMode("requests");
  const isActive = (mode: string) => filterMode === mode;

  return (
    <div className={`${css.Box}`} ref={friendsListRef}>
      <div className={`${css.Before}`}></div>
      <div className={`${css.Container}`}>
        <div className={`${css.Text}`}>Community</div>
        <div className={css.Filter}>
          <button
            onClick={showOnlyFriends}
            className={`${isActive("friends") ? css.activeButton : ""}`}
          >
            friends
          </button>
          <button
            onClick={showOnlyRequests}
            className={`${isActive("requests") ? css.activeButton : ""}`}
          >
            requests
          </button>
          <button
            onClick={showAllUsers}
            className={`${isActive("all") ? css.activeButton : ""}`}
          >
            all
          </button>
        </div>
        <div className={css.ListContainer}>
          {filteredFriends.map((friend: PublicUser) => (
            <div key={friend.id} className={css.FriendItem}>
              <img
                className={css.Avatar}
                src={friend.avatarUrl}
                alt={`${friend.name}'s avatar`}
                width="40"
              />
              <div className={css.FriendDetail}>
                <span className={css.FriendName}>{friend.name}</span>
                <div className={css.ButtonGroup}>
                  {friend.isFriend ? (
                    <button onClick={() => handleUnFriend(friend.id)}>
                      UnFriend
                    </button>
                  ) : friend.pendingFriendRecev ? (
                    <div className="absolute -top-7 left-12">
                      <button onClick={() => handleAcceptFriend(friend.id)}>
                        Accept
                      </button>
                      <button onClick={() => handleDeclineFriend(friend.id)}>
                        Decline
                      </button>
                    </div>
                  ) : !friend.invitationSent ? (
                    <button onClick={() => handleAddFriend(friend.id)}>
                      Add
                    </button>
                  ) : (
                    isActive("requests") && (
                      <span className="text-zinc-800 text-xs absolute left-full">
                        invitation sent
                      </span>
                    )
                  )}
                  {!isActive("requests") && (
                    <>
                      <button onClick={() => handleWhisper(friend)}>
                        Chat
                      </button>
                      <button
                        className={
                          friend.isOnline ? "bg-green-500" : "bg-red-500"
                        }
                      >
                        {friend.isOnline ? "Online" : "Offline"}
                      </button>
                      {!friend.isBlocked ? (
                        <button onClick={() => handleBlockUser(friend)}>
                          block
                        </button>
                      ) : (
                        <button onClick={() => handleBlockUser(friend)}>
                          unblock
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setShowUserCardsPublicUsers(
                            (showCardsPublicUsers) => {
                              const isUserAlreadyInArray =
                                showCardsPublicUsers.some((userItem) => {
                                  if (userItem.id)
                                    return userItem.id === friend.id;
                                  return userItem.userId === friend.id;
                                });
                              if (!isUserAlreadyInArray) {
                                return [...showCardsPublicUsers, friend];
                              }
                              return showCardsPublicUsers;
                            }
                          );
                        }}
                      >
                        Card
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FriendsList;
