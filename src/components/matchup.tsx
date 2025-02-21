/* eslint-disable @next/next/no-img-element */

import _ from "lodash";
import { useContext } from "react";
import { StatsContext } from "@/store/stats.context"
import { League } from "@/typings/league";
import { PlayoffsGameResults1, PlayoffsTeamRecord, SeasonGameResults1, SeasonTeamRecord } from "@/typings/season";

import styles from "./matchup.module.css"

/** Render a team in the scorebox */
function Team(
  { league, teamName, score, winner, away }:
    { league: League, teamName: string, score: number; winner: boolean; away: boolean }
) {
  const store = useContext(StatsContext);
  const inPlayoffs = store.playoffs[league];

  let wins = 0;
  let losses = 0;

  if (inPlayoffs) {
    const record: PlayoffsTeamRecord = _.values(store.stats[league].playoffs_team_records)
      .find(teamRecord => teamRecord.team === teamName) as PlayoffsTeamRecord

    for (const round in record.rounds) {
      wins = wins + record.rounds[round].wins;
      losses = losses + record.rounds[round].losses;
    }

  } else {
    const record: SeasonTeamRecord = _.values(store.stats[league].season_team_records)
      .find(standing => standing.team === teamName) as SeasonTeamRecord;
    wins = record.wins;
    losses = record.losses;
  }

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
        <img src={`${process.env.NEXT_PUBLIC_BASEPATH}/logos/${teamName}.png`}
          alt={`${teamName} logo`}
          style={{ maxWidth: "28px" }} />
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
export default function Matchup({ league, game }: { league: League, game: SeasonGameResults1 | PlayoffsGameResults1 }) {
  return <div className="flex">
    <Team
      league={league}
      teamName={game.away_team}
      score={game.away_score}
      winner={game.away_score > game.home_score}
      away={true} />
    <Team
      league={league}
      teamName={game.home_team}
      score={game.home_score}
      winner={game.home_score > game.away_score}
      away={false} />
  </div>
}