import { CareerStats } from '@/typings/careers';
import ghStats from './ghStats';

export default async function getCareers() {
  const data = await ghStats<CareerStats>("careers.json");

  // TODO maybe we cut this down to just stats we care about for active players?

  return data;
}
