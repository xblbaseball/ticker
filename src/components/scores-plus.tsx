/* eslint-disable @next/next/no-img-element */

import _ from "lodash";
import { useContext } from "react";
import { SettingsContext } from "@/store/settings.context";
import { StatsContext } from "@/store/stats.context";

import styles from "./scores-plus.module.css";
import {
  PlayoffsGameResults,
  PlayoffsGameResults1,
  SeasonGameResults,
  SeasonGameResults1
} from "@/typings/season";

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

function TopLine(
  { awayTeam, homeTeam, awayScore, homeScore, innings, fadeIn, fadeOut }:
    { awayTeam: string, homeTeam: string, awayScore: number, homeScore: number, innings: number, fadeIn: boolean, fadeOut: boolean }
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

/** render box scores. prefer playoff games when available */
export default function ScoresPlus() {
  const { maxBoxScores } = useContext(SettingsContext);
  const statsStore = useContext(StatsContext);

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

  const recentGames: (SeasonGameResults1 | PlayoffsGameResults1)[] = [];

  for (const path of playoffsScoresPaths) {
    const eightGames: PlayoffsGameResults = _.get(statsStore, path, []).slice(-8).reverse();
    recentGames.push(...eightGames);
  }

  if (recentGames.length < maxBoxScores) {
    // we didn't fill up on playoff games, top off with regular season
    const remaining = maxBoxScores - recentGames.length;
    const thirdRemaining = remaining / 3;

    // if the remaining games aren't divisible by three, keep the number of games even but bias to XBL and AAA
    const numXBL = -1 * _.ceil(thirdRemaining);
    const numAAA = -1 * _.round(thirdRemaining); // rounds up if thirdRemaining is .6 repeating, down if .3 repeating
    const numAA = -1 * _.floor(thirdRemaining);

    const xblGames: SeasonGameResults = _.get(statsStore, regularSeasonScoresPaths[0], []).slice(numXBL).reverse();
    const aaaGames: SeasonGameResults = _.get(statsStore, regularSeasonScoresPaths[1], []).slice(numAAA).reverse();
    const aaGames: SeasonGameResults = _.get(statsStore, regularSeasonScoresPaths[2], []).slice(numAA).reverse();

    recentGames.push(...xblGames);
    recentGames.push(...aaaGames);
    recentGames.push(...aaGames);
  }

  return <div className={`flex column space-around ${styles.container}`}>
    <div className={`flex column space-around ${styles.innerContainer}`}>
      <div className={styles.content}>
        <TopLine
          awayTeam={recentGames[0].away_team}
          homeTeam={recentGames[0].home_team}
          awayScore={recentGames[0].away_score}
          homeScore={recentGames[0].home_score}
          innings={recentGames[0].innings}
          fadeIn={false}
          fadeOut={false}
        />
      </div>
      {/* <div className={styles.content}>
        <TopLine
          awayTeam={recentGames[0].away_team}
          homeTeam={recentGames[0].home_team}
          awayScore={recentGames[0].away_score}
          homeScore={recentGames[0].home_score}
          innings={recentGames[0].innings}
          fadeIn={false}
          fadeOut={false}
        />
      </div> */}
    </div>
  </div>
}