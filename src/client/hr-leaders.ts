import { League } from '@/typings/league';
import getLocalJson from './local-json';
import TeamStat from '@/typings/team-stat';

/** HR leaders from g sheets json */
export default function getKLeaders(league: League): TeamStat[] {
  const data = getLocalJson(league, "Hitting")

  // Row 7 of hitting = HRs
  const baIndex = 7;

  const statLeaders = [];
  for (let i = 1; i < data.values.length; i++) {
    const row = data.values[i];
    statLeaders[i] = {
      category: "HR",
      team: row[1],
      value: Number.parseInt(row[baIndex])
    }
  }

  const sortedLeaders = statLeaders
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  return sortedLeaders;
}