import _ from 'lodash';
import { ActionDispatch, useContext } from "react";

import Dropdown from "@/components/inputs/dropdown";
import Input from "@/components/inputs/input";
import { ModalDispatchContext } from "@/store/modal.context";
import { action as modalAction } from "@/store/modal.reducer";
import { SettingsContext, SettingsDispatchContext } from "@/store/settings.context";
import { action as settingsAction, SettingsStore } from "@/store/settings.reducer";

import styles from "./settings.module.css";
import TextArea from './inputs/textarea';

function isJSON(e: unknown) {
  try {
    JSON.parse(e as string);
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}

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

    <h3>Import</h3>

    <TextArea
      onChange={(maybeJSON) => {
        if (!isJSON(maybeJSON)) {
          return;
        }

        const importedStore: SettingsStore = JSON.parse(maybeJSON);

        settingsDispatch({
          type: "import",
          payload: { store: importedStore }
        })
      }}
    >
      It might be easier to play with settings in your browser and then copy them here.
    </TextArea>

    <h3>Left Bar</h3>

    <Dropdown
      options={["XBL", "AAA", "AA"]}
      selected={settingsStore.leagueLogo}
      onSelect={(league) => updateSetting(["leagueLogo"], league)}
    >
      Which logo do you want to show in the top left?
    </Dropdown>
    <Input
      value={`${settingsStore.season || ""}`}
      onChange={(season) => updateSetting(["season"], _.parseInt(season as string))}
    >
      Season
    </Input>
    <h3>Current Settings</h3>
    <em>Copy this if you want to share your settings with someone else, or just paste them into the OBS browser.</em>
    <pre>{JSON.stringify(settingsStore)}</pre>
  </div>;
}
