import { League } from '@/typings/league';
import getLocalJson from './local-json';
import TeamStat from '@/typings/team-stat';

/** strikeout leaders from g sheets json */
export default function getKLeaders(league: League): TeamStat[] {
  const data = getLocalJson(league, "Pitching")

  // Row 9 of pitching = Ks
  const baIndex = 9;

  const statLeaders = [];
  for (let i = 1; i < data.values.length; i++) {
    const row = data.values[i];
    statLeaders[i] = {
      category: "K",
      team: row[1],
      value: Number.parseInt(row[baIndex])
    }
  }

  const sortedLeaders = statLeaders
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  return sortedLeaders;
}