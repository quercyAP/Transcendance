"use client";
import css from '../../styles/MatchHistory.module.css';
import { useNavRef } from '../../context/navContext';
import { Center } from '@react-three/drei';
import { PublicUser, CurrentUser } from '../../services/ApiServiceDto';
import ApiService from '../../services/ApiService';
import { useEffect, useState } from 'react';

interface MatchWithNames {
  id: number;
  createdAt: string;
  winnerId: number;
  winnerName: string; 
  loserId: number;
  loserName: string; 
  winnerScore: number;
  loserScore: number;
};


const MatchHistory: React.FC = () => {
  const { matchHistory, currentUser, clientBaseUrl } = useNavRef();
  const [matchesWithNames, setMatchesWithNames] = useState<MatchWithNames[]>([]);
  const apiService = new ApiService(clientBaseUrl);

  if (!matchHistory || matchHistory.length === 0 || !currentUser) {
    return (
      <div className={`${css.Box}`} >
      <div className={`${css.Before}`}></div>
      <div className={`${css.Container}`}>
        <div className={`${css.MatchHistory}`}>
          <p>No games yet...</p>
        </div>
      </div>
    </div>
    );
  }

  const getProperName = async (id: number) : Promise<{name: string}> => {
    if (id == currentUser.id) {
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

  useEffect(() => {
    const fetchNames = async () => {
      const matchesWithNamePromises = matchHistory.map(async (match) => {
        const winnerName = await getProperName(match.winnerId).then(res => res.name);
        const loserName = await getProperName(match.loserId).then(res => res.name);
        return { ...match, winnerName, loserName };
      });
      const matchesWithNames = await Promise.all(matchesWithNamePromises);
      setMatchesWithNames(matchesWithNames);
    };

    if (matchHistory && matchHistory.length > 0) {
      fetchNames();
    }
  }, [matchHistory]);


  return (
    <div className={`${css.Box}`} >
      <div className={`${css.Before}`}></div>
      <div className={`${css.Container}`}>
        <div className={`${css.MatchHistory}`}>
            <h1 style={{ textAlign: 'center' }}>Match History</h1>
          <div className={`${css.MatchHistoryBox}`}>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Winner</th>
                  <th>Score</th>
                  <th>Loser</th>
                </tr>
              </thead>
              <tbody>
                {matchesWithNames.map((match) => (
                  <tr key={match.id} className={match.winnerId === currentUser.id ? css.victory : css.defeat}>
                    <td>{new Date(match.createdAt).toLocaleDateString('fr-FR', { year: '2-digit', month: '2-digit', day: '2-digit' })}</td>
                    <td>{match.winnerName}</td> 
                    <td>{match.winnerScore} : {match.loserScore}</td>
                    <td>{match.loserName}</td> 
                  </tr>
                ))}
              </tbody>
            </table>
         </div> 
        </div>
          {/* <button onClick={logmatch}>Log Match</button> */}
      </div>
    </div> 
  );
};

export default MatchHistory;
