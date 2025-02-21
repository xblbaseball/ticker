import _ from "lodash";

export interface SettingsStore {
  /** are we using localstorage? */
  useLocalStorage: boolean;
  /** logo to show in the top left */
  leagueLogo: "XBL" | "AAA" | "AA";
  season: number;
}

export type action = {
  type: "import" | "load" | "set" | "reset";
  payload?: {
    path?: string[];
    value?: unknown;
    store?: SettingsStore;
  }
}

const STORAGE_KEY = "__XBL_TICKER_SETTINGS__";

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

function updateStorage(store: SettingsStore) {
  if (storageAvailable('localStorage')) {
    const stringified = JSON.stringify(store)
    window.localStorage.setItem(STORAGE_KEY, stringified);
  } else {
    console.info("local storage not available");
  }
}

function readStorage(): SettingsStore {
  if (storageAvailable('localStorage')) {
    const data = window.localStorage.getItem(STORAGE_KEY);
    return JSON.parse(data);
  }

  console.info("local storage not available");
  return null;
}

export const initialState: SettingsStore = {
  useLocalStorage: storageAvailable("localStorage"),
  leagueLogo: "XBL",
  season: 19,
};

export default function settingsReducer(
  store: SettingsStore,
  action: action
) {
  const updated = {};
  let newStore: SettingsStore;

  switch (action.type) {
    case "load":
      newStore = readStorage();
      if (!_.isNull(newStore)) {
        return {...initialState, ...newStore};
      }
      return store;

    case "import":
      return action.payload.store;

    case "set":
      _.set(updated, action.payload.path, action.payload.value);
      newStore = { ...store, ...updated }
      updateStorage(newStore);
      return newStore;

    case "reset":
      _.set(updated, action.payload.path, _.get(initialState, action.payload.path));
      newStore = { ...store, ...updated };
      updateStorage(newStore);
      return newStore;

    default:
      console.error(action);
      throw new Error("Unknown action for Settings Reducer: " + action.type);
  }
}
