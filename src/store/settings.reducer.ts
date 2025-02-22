import _ from "lodash";
import { League } from "@/typings/league";
import { StatCategory } from "@/typings/stats";

const season = parseInt(process.env.NEXT_PUBLIC_SEASON);

export type TimeFrame =  "regularSeason" | "playoffs" | "careerRegularSeason" | "careerPlayoffs" | "leagueRegularSeason" | "leaguePlayoffs" | "h2hRegularSeason" | "h2hPlayoffs";

export interface SettingsStore {
  /** are we using localstorage? */
  useLocalStorage: boolean;
  /** who's in the playoffs */
  playoffs: {
    XBL: boolean;
    AAA: boolean;
    AA: boolean;
  }
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
  /** games to use to pull away stats */
  awayStatsTimeFrame: TimeFrame,
  /** games to use to pull home stats */
  homeStatsTimeFrame: TimeFrame,
  /** if applicable, what season do we want to use for away stats */
  awayStatsSeason: number;
  /** if applicable, what season do we want to use for home stats */
  homeStatsSeason: number;
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
  /** marquees in the format of "AAA News | This is text I want to scroll" */
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
  statCategoriesSameForBothTeams: true,
  statTimeFramesSameForBothTeams: true,
  awayStatsTimeFrame: "regularSeason",
  homeStatsTimeFrame: "regularSeason",
  awayStatsSeason: season,
  homeStatsSeason: season,
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
