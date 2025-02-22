import { League } from "@/typings/league";

/** a stat that can be shown on screen */
export interface StatCategory {
  stat: string;
  /** choose one option. if you choose more than one, there's no guarantee what will be shown */
  timeFrame: {
    /** career regular season stats */
    career?: boolean;
    /** career playoff stats */
    careerPlayoffs?: boolean;
    /* regular season stats for the season (see season below) */
    regularSeason?: boolean;
    /* playoff stats for the season (see season below) */
    playoffs?: boolean;
    league?: boolean;
    headToHead?: boolean;
  };
  season?: number;
  league?: League;
}
