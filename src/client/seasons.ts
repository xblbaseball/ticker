import { League } from '@/typings/league';
import { SeasonStats } from '@/typings/season';
import ghStats from './ghStats';

export default async function getSeason(league: League) {
  const data = await ghStats<SeasonStats>(`${league}.json`);
  return data;
}
