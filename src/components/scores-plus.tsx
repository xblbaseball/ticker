/* eslint-disable @next/next/no-img-element */

import _ from "lodash";
import { useContext, useEffect, useState } from "react";
import { SettingsContext } from "@/store/settings.context";
import { StatsContext } from "@/store/stats.context";
import useInterval from "@/utils/useInterval";
import { TeamSeason } from "@/typings/careers";
import {
  PlayoffsGameResults,
  PlayoffsGameResults1,
  SeasonGameResults,
  SeasonGameResults1,
  SeasonTeamRecord
} from "@/typings/season";

import styles from "./scores-plus.module.css";

const basePath = process.env.NEXT_PUBLIC_BASEPATH || "";

function Team(
  { teamName, score, winner }:
    { teamName: string, score: number, winner: boolean }) {

  const classes = ["flex", "space-between", styles.team];
  if (winner) {
    classes.push(styles.winner);
  }

  return <div className={classes.join(" ")}>
    <div className="flex flex-start">
      <div className={styles.teamLogo}>
        <img src={`${basePath}/logos/${teamName}.png`}
          alt={`${teamName} logo`}
          style={{ maxWidth: "28px" }} />
      </div>
      <div className={styles.teamName}>{teamName}</div>
    </div>
    <div className="score">{score}</div>
  </div>
}

/** render away away_score - home_score home | Final */
function TopLine(
  { awayTeam, homeTeam, awayScore, homeScore, innings, }:
    { awayTeam: string, homeTeam: string, awayScore: number, homeScore: number, innings: number, }
) {

  const inningsText = _.ceil(innings) !== 9 ? `F/${innings}` : "Final";

  return <div className={`flex ${styles.topLine}`}>
    <div className="border-right">
      <Team teamName={awayTeam} score={awayScore} winner={awayScore > homeScore} />
    </div>
    <div className="border-right">
      <Team teamName={homeTeam} score={homeScore} winner={homeScore > awayScore} />
    </div>
    <div className={`flex column space-around ${styles.innings}`}>
      <div className={`flex space-around`} style={{ width: "36px" }}>
        {inningsText}
      </div>
    </div>
  </div>
}

/** render the lower line in the box score */
function BottomLine(
  { awayTeam, homeTeam, week, round, league }:
    { awayTeam: string; homeTeam: string; league: string; week?: string; round?: string }
) {
  const statsStore = useContext(StatsContext);

  // look up the abbreviation, player names for the away and home teams
  // default the abbreviations to the first 4 letters of the team name
  let awayTeamAbbrev = awayTeam.slice(0, 4).toUpperCase();
  let homeTeamAbbrev = homeTeam.slice(0, 4).toUpperCase();

  const teamsForLeague: TeamSeason[] = _.get(statsStore,
    ["stats", "careers", "active_players", league],
    []
  );

  const awayTeamInfo = teamsForLeague.find(teamSeason => teamSeason.team_name === awayTeam);
  const homeTeamInfo = teamsForLeague.find(teamSeason => teamSeason.team_name === homeTeam);

  if (!_.isNil(awayTeamInfo)) {
    awayTeamAbbrev = awayTeamInfo.team_abbrev;
  }
  if (!_.isNil(homeTeamInfo)) {
    homeTeamAbbrev = homeTeamInfo.team_abbrev;
  }

  let playoffsGame = false;
  let weekOrRound = "";
  if (!_.isNil(week)) {
    weekOrRound = `Week ${week},`;
  }
  if (!_.isNil(round)) {
    playoffsGame = true;
    weekOrRound = `${league} Playoffs RD${round.slice(1, 2)},`;
  }

  let winsAndLosses = "";
  if (playoffsGame) {
    // look up the series from playoffs table
    const awayTeamRoundRecord = _.get(
      statsStore,
      ["stats", league, "playoffs_team_records", awayTeam, "rounds", round],
      null
    );
    if (!_.isNil(awayTeamRoundRecord)) {
      const awayWins = awayTeamRoundRecord.wins;
      const awayLosses = awayTeamRoundRecord.losses;
      winsAndLosses = `${awayTeamAbbrev} ${awayWins} - ${awayLosses} ${homeTeamAbbrev}.`;
    }
  } else {
    const awayTeamRecords: SeasonTeamRecord = _.get(statsStore, ["stats", league, "season_team_records", awayTeam], null);
    const homeTeamRecords: SeasonTeamRecord = _.get(statsStore, ["stats", league, "season_team_records", homeTeam], null);

    const awayTeamWins = awayTeamRecords?.wins;
    const awayTeamLosses = awayTeamRecords?.losses;
    const awayTeamRecord = !_.isNil(awayTeamWins) ? `(${awayTeamWins}-${awayTeamLosses})` : "";
    const homeTeamWins = homeTeamRecords?.wins;
    const homeTeamLosses = homeTeamRecords?.losses;
    const homeTeamRecord = !_.isNil(homeTeamWins) ? `(${homeTeamWins}-${homeTeamLosses})` : "";

    winsAndLosses = `${awayTeamAbbrev} ${awayTeamRecord} ${homeTeamAbbrev} ${homeTeamRecord}.`
  }

  const fullLine = `${league} ${weekOrRound} ${winsAndLosses}`.trim();

  return <div>{fullLine}</div>
}

/** render box scores. prefer playoff games when available */
export default function ScoresPlus() {
  const { maxBoxScores } = useContext(SettingsContext);
  const statsStore = useContext(StatsContext);

  const [gameIndex, setGameIndex] = useState(0);
  const [recentGames, setRecentGames] = useState([] as (SeasonGameResults1 | PlayoffsGameResults1)[]);

  /** update the list of recent games */
  useEffect(() => {
    const playoffsScoresPaths = [
      ['stats', 'XBL', 'playoffs_game_results'],
      ['stats', 'AAA', 'playoffs_game_results'],
      ['stats', 'AA', 'playoffs_game_results']
    ];
    const regularSeasonScoresPaths = [
      ['stats', 'XBL', 'season_game_results'],
      ['stats', 'AAA', 'season_game_results'],
      ['stats', 'AA', 'season_game_results'],
    ];

    const getRecentGames = () => {
      const ret: (SeasonGameResults1 | PlayoffsGameResults1)[] = [];

      const maxScoresPerLeague = _.floor(maxBoxScores / 3);

      for (const path of playoffsScoresPaths) {
        // slice with a negative number and reverse to get the last 8 games in descending chronological order
        const eightGames: PlayoffsGameResults = _.get(
          statsStore, path, []
        ).slice(-maxScoresPerLeague).reverse();
        ret.push(...eightGames);
      }

      if (ret.length < maxBoxScores) {
        // we didn't fill up on playoff games, top off with regular season
        const remaining = maxBoxScores - ret.length;
        const thirdRemaining = remaining / 3;

        // if the remaining games aren't divisible by three, keep the number of games even but bias to XBL and AAA
        const numXBL = -1 * _.ceil(thirdRemaining);
        const numAAA = -1 * _.round(thirdRemaining); // rounds up if thirdRemaining is .6 repeating, down if .3 repeating
        const numAA = -1 * _.floor(thirdRemaining);

        const xblGames: SeasonGameResults = _.get(
          statsStore,
          regularSeasonScoresPaths[0],
          []
        ).slice(numXBL).reverse();
        const aaaGames: SeasonGameResults = _.get(
          statsStore,
          regularSeasonScoresPaths[1],
          []
        ).slice(numAAA).reverse();
        const aaGames: SeasonGameResults = _.get(
          statsStore,
          regularSeasonScoresPaths[2],
          []
        ).slice(numAA).reverse();

        ret.push(...xblGames);
        ret.push(...aaaGames);
        ret.push(...aaGames);
      }

      return ret;
    }
    setRecentGames(getRecentGames());
    setGameIndex(0);
  }, [maxBoxScores, statsStore]);

  // matches the interval in _document.tsx/Head/style
  const delay = 15000;

  useInterval(() => {
    setGameIndex((gameIndex + 1) % recentGames.length);
  }, delay);

  // we have to keep the divs with .scores-plus-fade alive in the DOM all the time, otherwise the score box fade in/out animation and the interval above will go out of sync
  return <div
    className={`flex column space-around ${styles.container}`}
    style={{ display: recentGames.length === 0 ? "hidden" : "block" }}
  >
    <div className={`flex column space-around ${recentGames.length > 0 && styles.innerContainer}`}>
      <div className="scores-plus-fade">
        <div
          className={styles.content}
          style={{ display: recentGames.length > 0 ? 'block' : 'none' }}
        >
          <TopLine
            awayTeam={_.get(recentGames[gameIndex], ['away_team'], "")}
            homeTeam={_.get(recentGames[gameIndex], ['home_team'], "")}
            awayScore={_.get(recentGames[gameIndex], ['away_score'], 0)}
            homeScore={_.get(recentGames[gameIndex], ['home_score'], 0)}
            innings={_.get(recentGames[gameIndex], ['innings'], 0)}
          />
        </div>
      </div>
      <div className="scores-plus-fade">
        <div
          className={styles.content}
          style={{ display: recentGames.length > 0 ? 'block' : 'none' }}
        >
          <BottomLine
            awayTeam={_.get(recentGames[gameIndex], ['away_team'], "")}
            homeTeam={_.get(recentGames[gameIndex], ['home_team'], "")}
            week={_.get(recentGames[gameIndex], ['week'], null) as string}
            round={_.get(recentGames[gameIndex], ['round'], null) as string}
            league={_.get(recentGames[gameIndex], ['league'], "")}
          />
        </div>
      </div>
    </div>
  </div>
}
