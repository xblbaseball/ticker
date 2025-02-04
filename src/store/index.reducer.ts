import LeagueStats from "@/typings/league-stats";

// TODO might need like a doScroll flag that controls whether or not animations are applied

export interface IndexStore {
  XBL: LeagueStats;
  AAA: LeagueStats;
  AA: LeagueStats;
}

export const initialState: IndexStore = {
  XBL: {} as LeagueStats,
  AAA: {} as LeagueStats,
  AA: {} as LeagueStats,
}

