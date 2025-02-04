import { League } from '@/typings/league';
import getLocalJson from './local-json';
import TeamStat from '@/typings/team-stat';

/** BA leaders from g sheets json */
export default function getBALeaders(league: League): TeamStat[] {
  const data = getLocalJson(league, "Hitting")

  // Row 2 of hitting = BA
  const baIndex = 2;

  const statLeaders = [];
  for (let i = 1; i < data.values.length; i++) {
    const row = data.values[i];
    statLeaders[i] = {
      team: row[1],
      value: Number.parseFloat(row[baIndex])
    }
  }

  const sortedLeaders = statLeaders
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const baLeaders = sortedLeaders.map(l => ({
    category: "BA",
    team: l.team,
    value: String(l.value.toFixed(3)).slice(String(l.value.toFixed(3)).indexOf('.'))
  }));

  return baLeaders;
}