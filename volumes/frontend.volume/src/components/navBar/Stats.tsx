"use client";
import React, { useEffect, useState } from 'react';
import css from '../../styles/Stats.module.css';
import { useNavRef } from '../../context/navContext';



const Stats: React.FC = () => {
  const { stats } = useNavRef();



  return (
    <div className={`${css.Box}`} >
      <div className={`${css.Before}`}></div>
      <div className={`${css.Container}`}>
        <div className={`${css.Stats}`}>
          <h1>Stats</h1>
          <div className={`${css.StatsBox}`}>
            <p>Victories: {stats.victories}</p>
            <p>Defeats: {stats.defeats}</p>
            <p>Win rate: {stats.winRate}%</p>
            <p>Total matches: {stats.totalMatches}</p>
          </div>
        </div>
      </div>
    </div> 
  );
};

export default Stats;
