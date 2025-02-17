import { CareerStats } from "@/typings/careers";
import { SeasonStats } from "@/typings/season";

// TODO might need like a doScroll flag that controls whether or not animations are applied

/** all the data */
export interface IndexStore {
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

export const initialState: IndexStore = {
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
