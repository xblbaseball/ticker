import _ from 'lodash';
import { ActionDispatch, useContext } from "react";

import Dropdown from "@/components/inputs/dropdown";
import { ModalDispatchContext } from "@/store/modal.context";
import { action as modalAction } from "@/store/modal.reducer";
import { SettingsContext, SettingsDispatchContext } from "@/store/settings.context";
import { action as settingsAction } from "@/store/settings.reducer";
import { League } from '@/typings/league';

import styles from "./settings.module.css";


export default function Settings() {
  const modalDispatch: ActionDispatch<[action: modalAction]> = useContext(ModalDispatchContext);
  const settingsDispatch: ActionDispatch<[action: settingsAction]> = useContext(SettingsDispatchContext);
  const settingsStore = useContext(SettingsContext);

  const updateSetting = (path: string[], value: unknown) => {
    settingsDispatch({ type: "set", payload: { path, value } })
  }

  return <div
    className={`flex column ${styles.container}`}
  // onClick={() => modalDispatch({ type: "popped-modal" })}
  >
    Your settings {settingsStore.useLocalStorage ? 'will' : 'will NOT'} be saved for the next broadcast.

    <h3>League Logo</h3>
    <em>Which logo do you want to show in the top left</em>
    <Dropdown
      options={["XBL", "AAA", "AA"]}
      selected={settingsStore.leagueLogo}
      onSelect={(league) => updateSetting(["leagueLogo"], league)}
    />
    {JSON.stringify(settingsStore)}
  </div>;
}
