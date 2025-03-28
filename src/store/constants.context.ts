/**
 * Values that cannot be changed by the user
*/

import { Context, createContext } from "react";
import { ConstantsStore } from "@/store/constants.reducer";

export const ConstantsContext: Context<ConstantsStore> = createContext({} as ConstantsStore);
