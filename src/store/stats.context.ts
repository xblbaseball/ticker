import { Context, createContext } from "react";
import { StatsStore } from "./stats.reducer";

export const StatsContext: Context<StatsStore> = createContext({} as StatsStore);
export const StatsDispatchContext = createContext(null);
