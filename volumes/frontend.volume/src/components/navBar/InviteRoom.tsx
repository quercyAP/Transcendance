"use client";
import React, { use, useEffect, useState } from 'react';
import css from '../../styles/InviteRoom.module.css';
import { useNavRef } from '../../context/navContext';
import { Socket } from "socket.io-client";
import { stat } from 'fs';
import ApiService from '../../services/ApiService';
import { getUnpackedSettings } from 'http2';


interface Props {
  matchStarted: boolean | null;
  setMatchStarted: React.Dispatch<React.SetStateAction<boolean | null>>;
  socket?: Socket;
}

const InviteRoom: React.FC<Props> = ({ matchStarted, setMatchStarted, socket }) => {
  const { 
    setShowInviteRoom,
    setShowGame,
    setInvitationInfo,
    invitationInfo,
    currentUser,
    clientBaseUrl,
    setShowStartButton,
  } = useNavRef();
  const [countdown, setCountdown] = useState(3);
  const [accept, setAccept] = useState(false);
  const [response, setResponse] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10);
  const [hostName, setHostName] = useState<string | null>(null);
  const apiService = new ApiService(clientBaseUrl);

  useEffect(() => {
    if (!timeLeft && !response) {
      const payload = {
      response : false,
      gameID : invitationInfo?.gameId,
      guest : currentUser?.id.toString(),
      host : invitationInfo?.host.toString(),
      reason : 'No response from invited player, cancelling invitation',
      };
      socket?.emit('inviteResponse', payload);
      setShowInviteRoom(false); 
      setShowStartButton(true);
    }

    if (!timeLeft || response) {
      setResponse(false);
      return;
    }

    const timerId = setInterval(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [timeLeft, accept]);

  useEffect(() => {
    setShowStartButton(false);
    if (invitationInfo) {
      getName(invitationInfo.host).then((name) => {
        setHostName(name.name);
      });
    }
  }, [invitationInfo]);

  const handleAccept = () => {
    const payload = {
      response : true,
      gameID : invitationInfo?.gameId,
      guest : currentUser?.id,
      host : invitationInfo?.host,
      bonus : "none",
    };
    socket?.emit('inviteResponse', payload);
    setAccept(true);
    setResponse(true);
  }

  const handleDecline = () => {
    const payload = {
      response : false,
      gameID : invitationInfo?.gameId,
      guest : currentUser?.id.toString(),
      host : invitationInfo?.host.toString(),
      reason : "Player declined invitation",
    };
    socket?.emit('inviteResponse', payload);
    setShowInviteRoom(false); 
    setShowStartButton(true);
    setResponse(true);
  }

  const getName = async (name: string) : Promise <{name:string | null}> => {
    const id: number = parseInt(name);
    const user = await apiService.getUserById(id);
    if (!user) {
      return {name: "unknown"};
    } else {  
      return {name: user};
    }
  }

  useEffect(() => {
    let countdownTimer: NodeJS.Timeout;
    if (matchStarted) {
      countdownTimer = setInterval(() => {
        setCountdown(prevCountdown => prevCountdown - 1);
      }, 1000);

      setTimeout(() => {
        setShowGame(true);
        setShowInviteRoom(false);
        clearInterval(countdownTimer);
        setAccept(false);
        setResponse(false);
        socket?.emit(`letsgo`, invitationInfo?.gameId);
        setMatchStarted(false);
      }, 3000);
    }

    return () => {
      clearInterval(countdownTimer);

    };
  }, [matchStarted]
  );



  return (
    <div className={`${css.Box}`} >
      <div className={`${css.Before}`}></div>
      <div className={`${css.Container}`}>
        {(!accept)? (
          <>
            <div className={`${css.Text}`}>You just received an invite to play with {hostName} </div>
            <button
              style={{ fontSize: "40px", padding: "10px" }}
              className="text-white"
                onClick={handleAccept}
              >
              ACCEPT
            </button>
              <button
                style={{ fontSize: "20px", padding: "10px" }}
                className="text-white"
                onClick={handleDecline}
              >
                DECLINE
              </button>
              <div className={`${css.Text}`}>You have {timeLeft} seconds to respond</div>
          </>
        ) : (
          <>
            {!matchStarted && <div className={`${css.Text}`}>Waiting for player...</div>}
            {matchStarted && <div className={`${css.Text}`}>Game starting in {countdown}...</div>}
          
        </>
        )}
      </div>
    </div> 
  );
};

export default InviteRoom;