import { League } from "@/typings/league";

/** a stat that can be shown on screen */
export interface StatCategory {
  stat: string;
  /** choose one option. if you choose more than one, there's no guarantee what will be shown */
  timeFrame: {
    career?: boolean;
    careerPlayoffs?: boolean;
    regularSeason?: boolean;
    playoffs?: boolean;
    league?: boolean;
    headToHead?: boolean;
  };
  season?: number;
  league?: League;
}
