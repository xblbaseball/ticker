/* eslint-disable @next/next/no-img-element */

import { useContext } from "react";
import { IndexContext } from "@/store/index.context"
import GameResults from "@/typings/game-results";
import { League } from "@/typings/league";

import styles from "./matchup.module.css"
import TeamRecord from "@/typings/team-record";

/** Render a team in the scorebox */
function Team(
  {league, teamName, score, winner, away}:
  {league: League, teamName: string, score: number; winner: boolean; away: boolean}
) {
  const store = useContext(IndexContext);
  const inPlayoffs = store[league].showPlayoffs;
  const record: TeamRecord = inPlayoffs ?
    store[league].playoffRecords
      .find(teamRecord => teamRecord.team === teamName) as TeamRecord :
    store[league].standings
      .find(standing => standing.team === teamName) as TeamRecord;
  const {wins, losses} = record;

  const classes = ["flex", "space-between", styles.team];
  if (away) {
    classes.push("border-right");
  }
  if (winner) {
    classes.push(styles.winner);
  }

  return <div className={classes.join(" ")}>
    <div className="flex flex-start">
      <div className={styles.teamLogo}>
        <img src={`/logos/${teamName}.png`}
          alt={`${teamName} logo`}
          style={{maxWidth: "28px"}} />
      </div>
      <div className={styles.teamName}>{teamName}</div>
      <div className={`flex column flex-end ${styles.teamRecord}`}>
        <div>({wins}-{losses})</div>
      </div>
    </div>
    <div className="score">{score}</div>
  </div>
}

/** render two teams side by side */
export default function Matchup({league, game}: {league: League, game: GameResults}) {
  return <div className="flex">
    <Team
      league={league}
      teamName={game.awayTeam}
      score={game.awayScore}
      winner={game.awayScore > game.homeScore}
      away={true} />
    <Team
      league={league}
      teamName={game.homeTeam}
      score={game.homeScore}
      winner={game.homeScore > game.awayScore}
      away={false} />
  </div>
}