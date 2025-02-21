import { CareerStats } from "@/typings/careers";
import { SeasonStats } from "@/typings/season";

/** all the data */
export interface StatsStore {
  stats: {
    careers: CareerStats;
    XBL: SeasonStats;
    AAA: SeasonStats;
    AA: SeasonStats;
  }
  playoffs: {
    XBL: boolean;
    AAA: boolean;
    AA: boolean;
  }
}

export const initialState: StatsStore = {
  stats: {
    careers: {} as CareerStats,
    XBL: {} as SeasonStats,
    AAA: {} as SeasonStats,
    AA: {} as SeasonStats,
  },
  playoffs: {
    XBL: false,
    AAA: false,
    AA: false,
  }
}
