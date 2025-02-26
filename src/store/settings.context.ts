import { ActionDispatch, Context, createContext } from "react";
import { action, SettingsStore } from "@/store/settings.reducer";

export const SettingsContext: Context<SettingsStore> = createContext({} as SettingsStore);
export const SettingsDispatchContext = createContext(null as ActionDispatch<[action: action]>);
