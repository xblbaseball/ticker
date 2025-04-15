/**
 * User settings
*/

import _ from "lodash";
import { League } from "@/typings/league";

const currentSeason = parseInt(process.env.NEXT_PUBLIC_SEASON);

export type TimeFrame = "regularSeason" | "playoffs" | "careerRegularSeason" | "careerPlayoffs" | "leagueRegularSeason" | "leaguePlayoffs" | "h2hRegularSeason" | "h2hPlayoffs";

export interface SettingsStore {
  /** are we using localstorage? */
  useLocalStorage: boolean;
  /** who's in the playoffs */
  playoffs: {
    XBL: boolean;
    AAA: boolean;
    AA: boolean;
  };
  /** what league are the players in. controls the logo in the top left and stats */
  league: League;
  /** what season are we in */
  season: number;
  /** something to show under the season */
  seasonSubtext: string;
  /** show the box with series scores */
  showSeries: boolean;
  /** away team name */
  awayTeam: string;
  /** home team name */
  homeTeam: string;
  /** away player name */
  awayPlayer: string;
  /** home player name */
  homePlayer: string;
  /** abbreviation for away team. doesn't need to be the official one */
  awayAbbrev: string;
  /** abbreviation for home team. doesn't need to be the official one */
  homeAbbrev: string;
  /** logo to use for the away team */
  awayLogo: string;
  /** logo to use for the home team */
  homeLogo: string;
  /** wins for away player. to be shown in the series box */
  awayWins: number;
  /** wins for home player. to be shown in the series box */
  homeWins: number;
  /** left subtext under the series. maybe something like "RD2" */
  seriesLeft: string;
  /** right subtext under the series. maybe something like "BO5" */
  seriesRight: string;
  /** show same stat categories for both teams */
  statCategoriesSameForBothTeams: boolean;
  /** use the same stat time frames for both teams */
  statTimeFramesSameForBothTeams: boolean;
  /** render the timeframes under left bar stats */
  showStatTimeframes: boolean;
  /** games to use to pull away stats */
  awayStatsTimeframe: TimeFrame,
  /** games to use to pull home stats */
  homeStatsTimeframe: TimeFrame,
  /** if applicable, what season do we want to use for away stats */
  awayStatsSeason: number;
  /** if applicable, what season do we want to use for home stats */
  homeStatsSeason: number;
  /** if applicable, what league do we want to use for away stats */
  awayStatsLeague: League,
  /** if applicable, what league do we want to use for home stats */
  homeStatsLeague: League,
  awayStatCategories: {
    first: string,
    second: string,
    third: string,
    fourth: string,
    fifth: string,
    sixth: string,
  };
  homeStatCategories: {
    first: string,
    second: string,
    third: string,
    fourth: string,
    fifth: string,
    sixth: string,
  };
  /** marquees in the format of "AAA News | This is text I want to scroll" */
  headlines: string;
  /** how many games to rotate through the box scores */
  maxBoxScores: number;
}

export const initialState: SettingsStore = {
  useLocalStorage: storageAvailable("localStorage"),
  playoffs: {
    XBL: false,
    AAA: false,
    AA: false,
  },
  league: "XBL",
  season: currentSeason,
  seasonSubtext: "",
  showSeries: true,
  awayTeam: "",
  homeTeam: "",
  awayPlayer: "",
  homePlayer: "",
  awayAbbrev: "",
  homeAbbrev: "",
  awayLogo: "",
  homeLogo: "",
  awayWins: 0,
  homeWins: 0,
  seriesLeft: "",
  seriesRight: "",
  statCategoriesSameForBothTeams: true,
  statTimeFramesSameForBothTeams: true,
  showStatTimeframes: true,
  awayStatsTimeframe: "regularSeason",
  homeStatsTimeframe: "regularSeason",
  awayStatsSeason: currentSeason,
  homeStatsSeason: currentSeason,
  awayStatsLeague: "XBL",
  homeStatsLeague: "XBL",
  awayStatCategories: {
    first: "ba",
    second: "hr9",
    third: "rs9",
    fourth: "ra9",
    fifth: "lob",
    sixth: "whip",
  },
  homeStatCategories: {
    first: "ba",
    second: "hr9",
    third: "rs9",
    fourth: "ra9",
    fifth: "lob",
    sixth: "whip",
  },
  headlines: `Broadcast News | You're watching season ${currentSeason} XBL baseball!`,
  maxBoxScores: 24
};

export type action = {
  type: "import" | "load" | "set" | "reset" | "reset-all";
  payload?: {
    path?: string[];
    value?: unknown;
    store?: SettingsStore;
  }
}

/** has someone tried to a valid store? */
export function isValidStore(maybeStore: object, root: string[] = null) {
  let path: string[] = [];

  if (!_.isNull(root)) {
    path = [...root];
  }

  for (const key of _.keys(_.get(initialState, path))) {
    const fullpath = [...path, key];

    if (!_.has(maybeStore, fullpath)) {
      console.error(`Imported store is missing key ${fullpath}`)
      return false;
    }

    if (
      typeof _.get(initialState, fullpath) !== typeof _.get(maybeStore, fullpath)
    ) {
      console.error(`Imported store has wrong value for key ${key}: ${_.get(maybeStore, [key])}`)
      return false;
    }

    if (typeof _.get(initialState, fullpath) === "object") {
      if (!isValidStore(_.get(maybeStore, fullpath), fullpath)) {
        return false
      }
    }
  }

  return true;
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
        return { ...initialState, ...newStore };
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
