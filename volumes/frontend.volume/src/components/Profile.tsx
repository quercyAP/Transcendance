"use client";
import css from "../styles/Profile.module.css";
import { useEffect, useState } from "react";
import { useNavRef } from "../context/navContext";
import { gsap } from "gsap";
import { Match, MatchHistory } from "../services/ApiServiceDto";
import ApiService from "../services/ApiService";

const Profile = () => {
  const {
    userButtonRef,
    profileRef,
    toggleMenu,
    friendsListRef,
    setShowFriendsList,
    showFriendsList,
    avatar,
    setAvatar,
    showCardsPublicUsers,
    setShowUserCardsPublicUsers,
    setMatchHistory,
    showMatchHistory,
    setShowMatchHistory,
    currentUser,
    clientBaseUrl,
    is2faEnabled,
    setIs2faEnabled,
    setQrCodeUrl,
    is2faLoggedIn,
    setIs2faLoggedIn,
    setIsCodeScanned,
    showStartButton,
    setShowStartButton,
  } = useNavRef();
  const [tmpUserName, setTmpUserName] = useState("");
  const apiService = new ApiService(clientBaseUrl);

  let tl = gsap.timeline();

  const updatePosition = () => {
    if (userButtonRef.current && profileRef.current) {
      const buttonRect = userButtonRef.current.getBoundingClientRect();
      const profileRect = profileRef.current.getBoundingClientRect();

      gsap.set(profileRef.current, {
        x: buttonRect.x - profileRect.width / 2 + buttonRect.width / 2,
        y: "-60",
      });
    }
  };

  useEffect(() => {
    if (userButtonRef.current && profileRef.current) {
      if (friendsListRef.current) {
        toggleMenu({
          ref: friendsListRef,
          dispatch: setShowFriendsList,
          show: showFriendsList,
        });
      }
      const buttonRect = userButtonRef.current.getBoundingClientRect();
      const profileRect = profileRef.current.getBoundingClientRect();
      if (!tl.isActive()) {
        tl = gsap.timeline();
        if (profileRef.current) {
          tl.fromTo(
            profileRef.current,
            {
              x: buttonRect.x - profileRect.width / 2 + buttonRect.width / 2,
              y: profileRect.height,
            },
            {
              y: "-60",
              duration: 0.2,
              ease: "power1.out",
            },
          );
        }
      }
      setIs2faEnabled(currentUser?.is2FAEnabled);
      window.addEventListener("resize", updatePosition);
      return () => {
        window.removeEventListener("resize", updatePosition);
      };
    }
  }, []);

  const handleSubmitUserName = async () => {
    const patchUrl = new URL("/api/users/me", clientBaseUrl).href;
    const response = await fetch(patchUrl, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: tmpUserName,
      }),
    }).catch((err) => {
      console.log(err);
    });
  };

  const handleSubmitAvatar = async () => {
    const formData = new FormData();
    formData.append("file", avatar as Blob);
    const patchUrl = new URL("/api/users/me/set_my_avatar", clientBaseUrl).href;
    const response = await fetch(patchUrl, {
      method: "POST",
      body: formData,
    })
      .then((res) => {
        if (res.ok) {
          return res.json();
        }
      })
      .then((data) => {
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const combineAndSortMatches = (
    history: MatchHistory | null,
  ): Match[] | null => {
    if (!history) {
      return null;
    }
    const combinedMatches = history.winnerMatches.concat(history.loserMatches);
    const sortedMatches = combinedMatches.sort((a, b) => b.id - a.id);
    return sortedMatches;
  };

  const handleHistoryClick = async () => {
    if (!currentUser) {
      return;
    }
    const data = await apiService.fetchHistory(currentUser.id);
    const matches = combineAndSortMatches(data);
    setMatchHistory(matches as Match[] | null);
    setShowMatchHistory(!showMatchHistory);
    // setShowStartButton(!showStartButton);
  };

  const enable2fa = async () => {
    const baseUrl = process.env.REVERSE_PROXY_URL;
    const url = new URL("/api/auth/turnOnTwoFactorAuth", baseUrl).href;
    try {
      const response = await fetch(url, { method: "POST" });
      if (response.ok) {
        setIs2faEnabled(true);
      } else {
        console.error("Failed to enable 2FA:", response);
      }
    } catch (error) {
      console.log("2FA error:", error);
    }
  };

  const disable2fa = async () => {
    const url = new URL("/api/auth/turnOffTwoFactorAuth", clientBaseUrl).href;
    try {
      const response = await fetch(url, { method: "POST" });
      if (response.ok) {
        setIs2faEnabled(false);
        setIs2faLoggedIn(false);
        setIsCodeScanned(false);
      } else {
        console.error("Failed to disable 2FA:", response);
      }
    } catch (error) {
      console.error("2FA error:", error);
    }
  };

  const handle2fa = async () => {
    if (!is2faEnabled) {
      setShowStartButton(false);
      enable2fa();
      const url = new URL("/api/auth/generate", clientBaseUrl).href;
      const response = await fetch(url, { method: "POST" });
      const qrCodeUrl = await response.text();
      setQrCodeUrl(qrCodeUrl);

    } else {
      disable2fa();
      setShowStartButton(true);
      setQrCodeUrl(null);
    }
  };

  return (
    <div className={`${css.Box}`} ref={profileRef}>
      <div className={`${css.Before}`}></div>
      <div className={`${css.Container}`}>
        <div className={`${css.Text}`}>Profile</div>
        <div>
          <p>Change Username:</p>
          <input
            type="text"
            placeholder="Username..."
            value={tmpUserName}
            onChange={(e) => setTmpUserName(e.target.value)}
          />
          <button onClick={handleSubmitUserName}>Confirm</button>
        </div>

        <div>
          <p>Upload Avatar:</p>
          <input
            type="file"
            onChange={(e) => {
              if (e.target.files && e.target.files[0])
                setAvatar(e.target.files[0]);
            }}
          />
          <button onClick={handleSubmitAvatar}>Confirm</button>
        </div>

        <div>
          <button onClick={handle2fa}>
            {is2faEnabled ? "Disable 2FA" : "Enable 2FA"}
          </button>
            <button onClick={handleHistoryClick}> Match History</button>
            <button
            onClick={() => {
              setShowUserCardsPublicUsers((showCardsPublicUsers) => {
                const isUserAlreadyInArray = showCardsPublicUsers.some(
                  (userItem) => userItem === currentUser,
                );
                if (!isUserAlreadyInArray) {
                  return [...showCardsPublicUsers, currentUser];
                }
                return showCardsPublicUsers;
              });
            }}
          >
            Card
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
