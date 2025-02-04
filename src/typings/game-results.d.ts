export default interface GameResults {
  awayTeam: string;
  homeTeam: string;
  awayScore: number;
  homeScore: number;
  isRegularSeason?: boolean;
  /** week of the regular season */
  week?: number;
  /** playoff round */
  round?: number;
  /** a number that isn't 9 in the case of a run rule or extra innings */
  innings?: number;
}
