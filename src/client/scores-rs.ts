import GameResults from '@/typings/game-results';
import { League } from '@/typings/league';
import getLocalJson from './local-json';

/** regular season scores from g sheets json */
export default function getScoresRS(league: League) {
  const data = getLocalJson(league, "Box%20Scores")

  const scores: GameResults[] = [];
  let gameIndex = data.values.length - 1;
  for (let i = 0; i < 6; i++) {
    const boxScore = data.values[gameIndex];

    scores[i] = {
      isRegularSeason: true,
      week: +boxScore[0],
      awayTeam: boxScore[1],
      awayScore: +boxScore[2],
      homeScore: +boxScore[3],
      homeTeam: boxScore[4]
    };

    gameIndex--;
  }

  return scores;
}