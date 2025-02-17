import { CareerStats } from '@/typings/careers';
import getLocalJson from './local-json';

export default function getCareers() {
  const data: CareerStats = getLocalJson("careers.json");
  return data;
}
