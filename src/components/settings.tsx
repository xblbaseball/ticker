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

  return <div className={`flex column ${styles.container}`}>
    <div className={`flex space-between`}>
      <div><em>Changes are saved as you make them. Your settings {settingsStore.useLocalStorage ? 'will' : 'will NOT'} be saved for the next broadcast.</em></div>

      <div>
        <button style={{ cursor: 'pointer' }} onClick={() => modalDispatch({ type: "destroyed-modals" })}>Close</button>
      </div>
    </div>

    <h3>Left Bar</h3>
    <em>Which logo do you want to show in the top left?</em>
    <Dropdown
      options={["XBL", "AAA", "AA"]}
      selected={settingsStore.leagueLogo}
      onSelect={(league) => updateSetting(["leagueLogo"], league)}
    />
    <em>Season</em>
    <Dropdown
      options={["XBL", "AAA", "AA"]}
      selected={settingsStore.leagueLogo}
      onSelect={(league) => updateSetting(["season"], league)}
    />
    {JSON.stringify(settingsStore)}
  </div>;
}
