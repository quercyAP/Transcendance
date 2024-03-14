import React, { useEffect, useState } from "react";
import css from "../../styles/Result.module.css";
import { useNavRef } from "../../context/navContext";

interface ResultProps {
  scoreWinner: number;
  scoreLoser: number;
  setShowResult: React.Dispatch<React.SetStateAction<boolean>>;
  isWinner: boolean;
  hasQuit?: boolean;
  Quitter?: string;
}

const Result: React.FC<ResultProps> = ({
  scoreWinner,
  scoreLoser,
  setShowResult,
  isWinner,
  hasQuit,
  Quitter,
}) => {
  const { setShowGame, showStartButton, setShowStartButton } = useNavRef();

  const onclose = () => {
    setShowResult(false);
    setShowGame(false);
    setShowStartButton(true);
  };

  return (
    <div className={`${css.Box}`}>
      <div className={`${css.Before}`}></div>
      <div className={`${css.Container}`}>
        <div className={`${css.Text}`}>GAME OVER :</div>
        {hasQuit ? (
          <div className={`${css.Text}`}> 
          <p> The match has ended, </p>
          <p> {Quitter} got scared...</p>
          </div>
        ) : (
          <>
            <p className={`${css.Text}`}>{isWinner ? "You Win" : "You Lose"}</p>
            <p className={`${css.Text}`}>{`${scoreWinner} : ${scoreLoser}`}</p>
          </>
        )}
        <button className={`${css.Button}`} onClick={onclose}>Close</button>
      </div>
    </div>
  );
};

export default Result;
