import { League } from '@/typings/league';
import Standing from '@/typings/standing';
import getLocalJson from './local-json';

/** regular season standings in ascending order */
export default function getStandings(league: League) {
  const data = getLocalJson(league, "Standings");

  const standings: Standing[] = [];

  for (let i = 1; i < data.values.length; i++) {
    const rank = parseInt(data.values[i][0]);
    const team = data.values[i][1];
    const wins = parseInt(data.values[i][league === "AA" ? 4 : 2]);
    const losses = parseInt(data.values[i][league === "AA" ? 5 : 3]);
    standings.push({team, rank, wins, losses});
  }

  standings.sort((a, b) => a.rank - b.rank);

  return standings;
}