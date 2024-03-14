"use client";
import React, { useEffect, useState, useRef } from "react";
import css from "../styles/UserCard.module.css";
import { gsap } from "gsap";
import { Draggable } from "gsap/Draggable";
import { useNavRef } from "../context/navContext";
import ApiService from "../services/ApiService";
import { MatchHistory } from "../services/ApiServiceDto";

interface UserCardProps {
  user: any;
}

interface Stats {
  victories: number;
  defeats: number;
  winRate: number;
  totalMatches: number;
}


const UserCard: React.FC<UserCardProps> = ({ user }) => {
  const [avatarUrl, setAvatarUrl] = useState("");
  const [achievement, setAchievement] = useState("noob");
  const draggableRef = useRef(null);
  const dragHandleRef = useRef(null);
  const imageWidth = 80;
  const imageHeight = 80;
  const [stat, setStat] = useState<Stats>({
    victories: 0,
    defeats: 0,
    winRate: 0,
    totalMatches: 0,
  });

  const { setShowUserCardsPublicUsers, clientBaseUrl } =
    useNavRef();
  const apiService = new ApiService(clientBaseUrl);

  const fetchUserData = async () => {
    let avatar;
    if (!user.avatarUrl || user?.avatarUrl.includes("null")) {
      avatar = user?.avatar42Url;
    } else {
      avatar = user?.avatarUrl;
    }
    setAvatarUrl(avatar);
  };

  const getMatchStats = (history: MatchHistory | null): { victories: number; defeats: number; winRate: number, totalMatches: number } => {
    if (!history) {
      return { victories: 0, defeats: 0, winRate: 0, totalMatches: 0 };
    }
    const victories = history.winnerMatches.length;
    const defeats = history.loserMatches.length;
    const totalMatches = victories + defeats;
    if (totalMatches === 0) {
      return { victories: 0, defeats: 0, winRate: 0, totalMatches: 0 };
    }
    const winRate = (victories / totalMatches) * 100;

    return { victories, defeats, winRate, totalMatches };
  };

  const getStat = async () => {
    const userStats = await apiService.fetchHistory(user.id || user.userId);
    const stat = getMatchStats(userStats);
    setStat(stat);
  }

  const getAchievement = (userstat: Stats) => {
    let newAchievement: string;
    if (userstat.winRate >= 80) {
      newAchievement = "pro";
    } else if (userstat.winRate >= 50 && userstat.winRate < 80) {
      newAchievement = "intermediate";
    } else if (userstat.winRate >= 10 && userstat.winRate < 50) {
      newAchievement = "rookie";
    } else {
      newAchievement = "noob";
    }
    setAchievement(newAchievement);
  };

  useEffect(() => {
    if (user) {
      fetchUserData();
      getStat();
    }
  }, [user]);

  useEffect(() => {
    getAchievement(stat);
  }, [stat]);

  useEffect(() => {
    gsap.registerPlugin(Draggable);
    const draggableInstance = Draggable.create(draggableRef.current, {
      type: "x,y",
      bounds: window,
      edgeResistance: 0.5,
      trigger: dragHandleRef.current,
    })[0];
    const handleResize = () => {
      draggableInstance.applyBounds(window);
    };
    getAchievement(stat);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);



  return (
    <>
      {
        <div className={`${css.CardWrapper}`} ref={draggableRef}>
          <div ref={dragHandleRef} className="absolute top-0 lg:h-[60px] h-[40px] w-full left-0"></div>
          <img
            className={css.Avatar}
            src={avatarUrl}
            alt={`${user?.name}'s avatar`}
            width={imageWidth}
            height={imageHeight}
          />
          <h3 className={`${css.UserName}`}>{user?.name}</h3>
          <h3 className={`${css.Title}`}>{achievement}</h3>
          <div className={`${css.StatList}`}>

            <p className={`${css.UserStats}`}>Victories: {stat.victories}</p>
            <p className={`${css.UserStats}`}>Defeats: {stat.defeats}</p>
            <p className={`${css.UserStats}`}>Winrate: {Math.ceil(stat.winRate).toString() + "%"}</p>
          </div>
          <button
            onClick={() => {
              setShowUserCardsPublicUsers((currentUsers) =>
                currentUsers.filter((userItem) => userItem.id !== user.id)
              );
            }}
          >
            Close
          </button>
        </div>
      }
    </>
  );
};

export default UserCard;
