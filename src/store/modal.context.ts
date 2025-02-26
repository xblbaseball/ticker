import { ActionDispatch, Context, createContext } from "react";
import { action, ModalStore } from "@/store/modal.reducer";

export const ModalContext: Context<ModalStore> = createContext({} as ModalStore);
export const ModalDispatchContext = createContext(null as ActionDispatch<[action: action]>);
