import _ from "lodash";

export interface SettingsStore {
  /** are we using localstorage? */
  useLocalStorage: boolean;
  /** logo to show in the top left */
  leagueLogo: "XBL" | "AAA" | "AA";
}

export type action = {
  type: "set" | "reset";
  payload?: {
    path: string[];
    value?: unknown;
  }
}

/** check whether we have localStorage */
function storageAvailable(type: string) {
  // slightly modified from https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API#testing_for_availability
  let storage;
  try {
    storage = _.get(window, [type]);
    const x = "__storage_test__";
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;
  } catch (e) {
    return (
      e instanceof DOMException &&
      e.name === "QuotaExceededError" &&
      // acknowledge QuotaExceededError only if there's something already stored
      storage &&
      storage.length !== 0
    );
  }
}


export const initialState: SettingsStore = {
  useLocalStorage: storageAvailable("localStorage"),
  leagueLogo: "XBL"
};

export default function settingsReducer(
  store: SettingsStore,
  action: action
) {
  const updated = {};

  switch (action.type) {
    case "set":
      _.set(updated, action.payload.path, action.payload.value);
      return { ...store, ...updated }

    case "reset":
      _.set(updated, action.payload.path, _.get(initialState, action.payload.path));
      return { ...store, ...updated };

    default:
      console.error(action);
      throw new Error("Unknown action for Settings Reducer: " + action.type);
  }
}
