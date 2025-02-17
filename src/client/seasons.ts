import { League } from '@/typings/league';
import getLocalJson from './local-json';
import { SeasonStats } from '@/typings/season';

export default function getSeason(league: League) {
  const data: SeasonStats = getLocalJson(`${league}.json`);
  return data;
}