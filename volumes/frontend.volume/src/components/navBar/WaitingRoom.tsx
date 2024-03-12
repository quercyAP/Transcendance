"use client";
import React, { useEffect, useState } from "react";
import css from "../../styles/WaitingRoom.module.css";
import { useNavRef } from "../../context/navContext";
import { Socket } from "socket.io-client";
import { stat } from "fs";
import { is } from '@react-three/fiber/dist/declarations/src/core/utils';


interface Props {
  matchStarted: boolean | null;
  setMatchStarted: React.Dispatch<React.SetStateAction<boolean | null>>;
  status?: any;
  socket?: Socket;
}

const WaitingRoom: React.FC<Props> = ({
  matchStarted,
  setMatchStarted,
  status,
  socket,
}) => {
  const { setShowWaitingRoom, setShowGame, currentUser, setShowStartButton, isInviting, setIsInviting, invitationInfo, showWaitingRoom } = useNavRef();
  const [bonus, setBonus] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [speedChosen, setSpeedChosen] = useState(7);
  const [submit, setSubmit] = useState(false);
  const [speed1, setSpeed1] = useState(false);
  const [speed2, setSpeed2] = useState(true);
  const [speed3, setSpeed3] = useState(false);



  const handleBonusChange = () => {
    setBonus(!bonus);
  };

  const handleSpeedChange = (speed: string) => {
    switch (speed) {
      case "slow":
        setSpeedChosen(4);
        setSpeed1(true);
        setSpeed2(false);
        setSpeed3(false);
        break;
      case "normal":
        setSpeedChosen(7);
        setSpeed1(false);
        setSpeed2(true);
        setSpeed3(false);
        break;
      case "fast":
        setSpeedChosen(10);
        setSpeed1(false);
        setSpeed2(false);
        setSpeed3(true);
        break;
      default:
        setSpeedChosen(7);
        setSpeed1(false);
        setSpeed2(true);
        setSpeed3(false);
        break;
    }
  };


  const handleSettingsSubmit = () => {
    const gameSettings = {
      bonus: bonus,
      speed: speedChosen,
    };
    const key: string = bonus ? 'bonus' + gameSettings.speed : 'noBonus' + gameSettings.speed;
    if (!isInviting) {
      const payload = {
        key: key,
        user: currentUser?.id,
      }
      socket?.emit('submit', payload);
      setSubmit(true);
    } else {
      setIsInviting(false);
      const payload = {
        host: invitationInfo?.host,
        guest: invitationInfo?.guest,
        gameId: invitationInfo?.gameId,
        bonus: key,
      }
      socket?.emit('invite', payload);
      setSubmit(true);
    }
  }

  useEffect(() => {
    let countdownTimer: NodeJS.Timeout;
    if (matchStarted) {
      countdownTimer = setInterval(() => {
        setCountdown((prevCountdown) => prevCountdown - 1);
      }, 1000);

      setTimeout(() => {
        setShowGame(true);
        setShowWaitingRoom(false);
        clearInterval(countdownTimer);
        setSubmit(false);
        socket?.emit(`letsgo`, status.gameId);
        setMatchStarted(false);
      }, 3000);
    }

    return () => {
      clearInterval(countdownTimer);
    };
  }, [matchStarted]);

  return (
    <div className={`${css.Box}`}>
      <div className={`${css.Before}`}></div>
      <div className={`${css.Container}`}>
        {!submit ? (
          <>
            <div className={`${css.Text}`}>GAME SETTINGS</div>
            <button
              className={bonus ? css["on"] : css["off"]}
              onClick={handleBonusChange}
            >
              {bonus ? "Bonus: ON" : "Bonus: OFF"}
            </button>
            <div className={`${css.speedWrapper}`}>
              <button
                className={speed1 ? css["on"] : css["off"]}
                onClick={() => handleSpeedChange("slow")}
              >
                Slow
              </button>
              <button
                className={speed2 ? css["on"] : css["off"]}
                onClick={() => handleSpeedChange("normal")}
              >
                Normal
              </button>
              <button
                className={speed3 ? css["on"] : css["off"]}
                onClick={() => handleSpeedChange("fast")}
              >
                Fast
              </button>
            </div>
            <button className="text-white" onClick={handleSettingsSubmit}>
              submit
            </button>
            <button
              className="text-white"
              onClick={() => {
                setShowWaitingRoom(false);
                setShowStartButton(true);
                setIsInviting(false);
              }}
            >
              exit
            </button>
          </>
        ) : (
          <>
            {!matchStarted && (
              <div className={`${css.Text}`}>Waiting for player...</div>
            )}
            {matchStarted && (
              <div className={`${css.Text}`}>
                Game starting in {countdown}...
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default WaitingRoom;
