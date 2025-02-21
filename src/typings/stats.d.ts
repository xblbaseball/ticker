import { League } from "@/typings/league";

/** a stat that can be shown on screen */
export interface StatCategory {
  stat: string;
  /** choose one option. if you choose more than one, there's no guarantee what will be shown */
  timeFrame: {
    season?: boolean;
    league?: boolean;
    career?: boolean;
    headToHead?: boolean;
  };
  season?: number;
  league?: League;
}
