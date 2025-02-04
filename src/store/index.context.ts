import { Context, createContext } from "react";
import { IndexStore } from "./index.reducer";

export const IndexContext: Context<IndexStore> = createContext({} as IndexStore);
export const IndexDispatchContext = createContext(null);
