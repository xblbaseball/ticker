import _ from "lodash";
import { League } from "@/typings/league";
import { StatCategory } from "@/typings/stats";

const season = parseInt(process.env.NEXT_PUBLIC_SEASON);

export interface SettingsStore {
  /** are we using localstorage? */
  useLocalStorage: boolean;
  /** who's in the playoffs */
  playoffs: {
    XBL: boolean;
    AAA: boolean;
    AA: boolean;
  }
  /** logo to show in the top left */
  league: League;
  season: number;
  seasonSubtext: string;
  showSeries: boolean;
  awayTeam: string;
  homeTeam: string;
  awayPlayer: string;
  homePlayer: string;
  awayAbbrev: string;
  homeAbbrev: string;
  awayWins: number;
  homeWins: number;
  seriesLeft: string;
  seriesRight: string;
  statsSameForBothTeams: boolean;
  awayStatCategories: {
    first: StatCategory,
    second: StatCategory,
    third: StatCategory,
    fourth: StatCategory,
    fifth: StatCategory,
    sixth: StatCategory,
  };
  homeStatCategories: {
    first: StatCategory,
    second: StatCategory,
    third: StatCategory,
    fourth: StatCategory,
    fifth: StatCategory,
    sixth: StatCategory,
  };
  headlines: string;
}

export const initialState: SettingsStore = {
  useLocalStorage: storageAvailable("localStorage"),
  playoffs: {
    XBL: false,
    AAA: false,
    AA: false,
  },
  league: "XBL",
  season,
  seasonSubtext: "",
  showSeries: true,
  awayTeam: "",
  homeTeam: "",
  awayPlayer: "",
  homePlayer: "",
  awayAbbrev: "",
  homeAbbrev: "",
  awayWins: 0,
  homeWins: 0,
  seriesLeft: "",
  seriesRight: "",
  statsSameForBothTeams: true,
  awayStatCategories: {
    first: {stat: "ba", timeFrame: {regularSeason: true}, season},
    second: {stat: "hr9", timeFrame: {regularSeason: true}, season},
    third: {stat: "babip", timeFrame: {regularSeason: true}, season},
    fourth: {stat: "oppba", timeFrame: {regularSeason: true}, season},
    fifth: {stat: "opphr9", timeFrame: {regularSeason: true}, season},
    sixth: {stat: "whip", timeFrame: {regularSeason: true}, season},
  },
  homeStatCategories: {
    first: {stat: "ba", timeFrame: {regularSeason: true}, season},
    second: {stat: "hr9", timeFrame: {regularSeason: true}, season},
    third: {stat: "babip", timeFrame: {regularSeason: true}, season},
    fourth: {stat: "oppba", timeFrame: {regularSeason: true}, season},
    fifth: {stat: "opphr9", timeFrame: {regularSeason: true}, season},
    sixth: {stat: "whip", timeFrame: {regularSeason: true}, season},
  },
  headlines: ""
};

export type action = {
  type: "import" | "load" | "set" | "reset" | "reset-all";
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

export default function settingsReducer(
  store: SettingsStore,
  action: action
) {
  const updated = { ...store };
  let newStore: SettingsStore;

  switch (action.type) {
    case "load":
      newStore = readStorage();
      if (!_.isNull(newStore)) {
        return {...initialState, ...newStore};
      }
      return store;

    case "import":
      updateStorage(action.payload.store);
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

    case "reset-all":
      updateStorage(initialState);
      return initialState;

    default:
      console.error(action);
      throw new Error("Unknown action for Settings Reducer: " + action.type);
  }
}
