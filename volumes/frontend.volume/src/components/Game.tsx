"use client";
import { useEffect, useState, useRef } from "react";
import { Socket } from "socket.io-client";
import { Pong } from "../components/game/Pong";
import Result from "../components/game/Result";
import css from "../styles/Pong.module.css";
import { CurrentUser } from "../services/ApiServiceDto";
import { useGameRef } from "../context/gameContext";
import { useNavRef } from "../context/navContext";
import ApiService from "../services/ApiService";

const Game = ({
  socket,
  status,
  id,
}: {
  socket: Socket | undefined;
  status: any;
  id: CurrentUser | null;
}) => {
  const { gameState, setGameState } = useGameRef();
  const [keysPressed, setKeysPressed] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [mouseY, setMouseY] = useState<number>(0);
  const [lastMouseY, setLastMouseY] = useState<number>(0);
  const [winHeight, setWinHeight] = useState<number>(0);
  const [Player1, setPlayer1] = useState<string>(""); // Player 1 ID
  const [Player2, setPlayer2] = useState<string>(""); // Player 2 ID
  const [move, setMove] = useState<number>(0);
  const [isMouseControl, setIsMouseControl] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showResult, setShowResult] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);
  const [hasQuit, setHasQuit] = useState<boolean>(false);
  const [Quitter, setQuitter] = useState<string>("");

  const frameIdRef = useRef<number>(0);
  const {
    showChat,
    setShowChat,
    setShowGame,
    showGame,
    clientBaseUrl,
    setShowStartButton,
    currentUser
  } = useNavRef();
  const [isWinner, setIsWinner] = useState<boolean>(false);
  const apiService = new ApiService(clientBaseUrl);

  useEffect(() => {
    const updateGame = () => {
      const commonData = {
        userId: id?.id,
        gameId: status.gameId,
      };
      if (isMouseControl) {
        if (keysPressed["ArrowUp"]) {
          socket!.emit("input", { ...commonData, key: "up" });
        } else if (keysPressed["ArrowDown"]) {
          socket!.emit("input", { ...commonData, key: "down" });
        }
        return;
      }
      if (move) {
        socket!.emit("mousemove", {
          ...commonData,
          winHeight: winHeight,
          move: move,
        });
      }
      frameIdRef.current = requestAnimationFrame(updateGame);
    };
    if (frameIdRef.current) {
      cancelAnimationFrame(frameIdRef.current);
    }
    frameIdRef.current = requestAnimationFrame(updateGame);

    return () => {
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }
    };
  }, [gameState]);

  useEffect(() => {
    socket!.on("gameState", (data) => {
      setGameState(data);
      setShowChat(true);
    });

    socket!.on("hasQuit", async (data) => {
      if (status) {
        const res = await getProperName(data.oppenentId);
        setQuitter(res.name);
      } else {
        setQuitter("Unknown");
      }
      setHasQuit(true);
      setShowResult(true);
    });

    socket!.on("matchEnded", (data) => {
      setResult(data);
      if (data.winner === id!.id) {
        setIsWinner(true);
      }
      setShowResult(true);
    });


    const handleKeyDown = (event: KeyboardEvent) => {
      setKeysPressed((prev) => ({ ...prev, [event.key]: true }));
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      setKeysPressed((prev) => ({ ...prev, [event.key]: false }));
    };

    let isMouseOnPage = true;
    window.addEventListener("focus", function (event: FocusEvent) {
      isMouseOnPage = true;
    });
    window.addEventListener("blur", function (event: FocusEvent) {
      isMouseOnPage = false;
    });

    const handleMouse = (event: MouseEvent) => {
      if (isMouseOnPage) {
        const current = event.clientY;
        const move = (current / window.innerHeight - 0.5) * 2;
        setMouseY(current);
        setMove(move);
        setLastMouseY(current);
      }
    };

    window.addEventListener("mousemove", handleMouse);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    apiService.setOnGame(id!.id, true);
    setWinHeight(window.innerHeight);
    return () => {
      window.removeEventListener("mousemove", handleMouse);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      socket!.off("gameState");
      socket!.off("matchEnded");
      apiService.setOnGame(id!.id, false);
    };
  }, []);

  useEffect(() => {
    if (status) {
      getProperName(status.idPlayer1).then((res) => setPlayer1(res.name));
      getProperName(status.idPlayer2).then((res) => setPlayer2(res.name));
    }
  }, [status]);

  const getProperName = async (id: number): Promise<{ name: string }> => {
    if (id == currentUser?.id) {
      return { name: currentUser.name };
    } else {
      try {
        const user = await apiService.getUserById(id);
        if (!user) {
          return { name: "Unknown" };
        }
        return { name: user };
      } catch (error) {
        console.error(error);
        return { name: "Unknown" };
      }
    }
  }

  const handleReset = () => {
    const payload = {
      gameId: status?.gameId,
      userId: id?.id,
      oppenentId: id?.id === status?.idPlayer1 ? status?.idPlayer2 : status?.idPlayer1,
    };
    socket!.emit("preDisconnect", payload);
    setShowGame(!showGame);
    setShowStartButton(true);
  };

  return (
    <>
      ```   <div className={`${css.globalHeader}`}>
        <div className={`${css.gameHeader}`}>
          <div className={`${css.Box}`}>
            <div className={`${css.Before}`}>
              <div className={`${css.Container}`}>
                <button className={`${css.text}`} onClick={handleReset}>
                  Stop
                </button>
              </div>
            </div>
          </div>
          <div className={`${css.Box}`}>
            <div className={`${css.Before}`}>
              <div className={`${css.Container}`}>
                <button
                  className={`${css.text}`}
                  onClick={() => setShowGrid(!showGrid)}
                >
                  {showGrid ? "Hide Grid" : "Show Grid"}
                </button>
              </div>
            </div>
          </div>
          <div className={`${css.Box}`}>
            <div className={`${css.Before}`}>
              <div className={`${css.Container}`}>
                <button
                  className={`${css.text}`}
                  onClick={() => setIsMouseControl(!isMouseControl)}
                >
                  {isMouseControl ? "Select mouse" : "Select keyboard"}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className={`${css.gameHeader}`}>
          <div className={`${css.Box}`}>
            <div className={`${css.Before}`}>
              <div className={`${css.Container}`}>
                {Player1} &nbsp;&nbsp;&nbsp; VS &nbsp;&nbsp;&nbsp; {Player2}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className={`${css.Pong}`}>
        <Pong
          playerId1={status?.idPlayer1}
          playerId2={status?.idPlayer2}
          showGrid={showGrid}
        />
        {showResult && (
          <Result
            scoreWinner={result?.scoreWinner}
            scoreLoser={result?.scoreLoser}
            setShowResult={setShowResult}
            isWinner={isWinner}
            hasQuit={hasQuit}
            Quitter={Quitter}
          />
        )}
      </div >
    </>
  );
};

export default Game;
