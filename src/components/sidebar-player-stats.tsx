import _ from "lodash";
import { useContext } from "react";
import TeamLogo from "@/components/team-logo";
import { SettingsContext } from "@/store/settings.context";
import { StatsContext } from "@/store/stats.context";
import { Rounds } from "@/typings/season";

import styles from "./sidebar-player-stats.module.css";
import { StatCategory } from "@/typings/stats";

export default function SidebarPlayerStats({ away }: { away: boolean }) {
  const {
    awayPlayer,
    homePlayer,
    awayTeam,
    homeTeam,
    awayStatCategories,
    homeStatCategories,
    league,
    playoffs
  } = useContext(SettingsContext);
  const statsStore = useContext(StatsContext);

  const player = away ? awayPlayer : homePlayer;
  if (player === "") {
    return <>no player</>;
  }

  const team = away ? awayTeam : homeTeam;

  if (team === "") {
    return <>no team</>
  }

  const statCategories = away ? awayStatCategories : homeStatCategories;

  const showPlayoffRecord = _.get(playoffs, [league]);
  console.log(league, showPlayoffRecord);

  let recordOrSeed = "(0-0)";
  if (showPlayoffRecord) {
    // we're in the playoffs. show seed instead of rank
    const { rank } = _.get(
      statsStore,
      ["stats", league, "season_team_records", team],
      { rank: 0 }
    );
    recordOrSeed = `${rank} Seed`
  } else {
    // we're in the regular season
    const { wins, losses } = _.get(
      statsStore,
      ["stats", league, "season_team_records", team],
      { wins: 0, losses: 0 }
    );
    recordOrSeed = `(${wins}-${losses})`
  }

  /** uppercase but make "opp" be "Opp" */
  const fixCasing = (stat: string) => {
    const opp: RegExp = /opp/i;
    return stat.toUpperCase().replace(opp, "Opp");
  }

  /** render the name of the stat */
  const StatCategory = ({ stat }: { stat: string }) => {
    const style: React.CSSProperties = {};
    if (stat.length > 5) {
      style.fontSize = "18px"
    }

    return (
      <div style={style}>
        {fixCasing(stat)}
      </div>
    )
  }

  const statLookup = (statCategory: StatCategory) => {
    const { stat, timeFrame } = statCategory;

    let lookupPath: string[] = [];
    if (timeFrame.career) {
      lookupPath = ['stats', 'careers', 'season_performances', player, 'all_time', stat];
    } else if (timeFrame.careerPlayoffs) {
      lookupPath = ['stats', 'careers', 'playoffs_performances', player, 'all_time', stat];
    } else if (timeFrame.league) {
      lookupPath = ['stats', 'careers', 'playoffs_performances', player, 'by_league', league, stat];
    } else if (timeFrame.regularSeason) {
      lookupPath = ['stats', league, 'season_team_stats', team, stat];
    } else if (timeFrame.playoffs) {
      lookupPath = ['stats', league, 'playoffs_team_stats', team, stat];
    } else if (timeFrame.headToHead) {
      const [playerA, playerZ] = [homePlayer, awayPlayer].sort()
      const isPlayerA = playerA === player;
      lookupPath = ['stats', 'stats', 'careers', 'season_head_to_head', playerA, playerZ, isPlayerA ? 'player_a' : 'player_z', stat];
    }

    const rawValue: number | string = _.get(statsStore, lookupPath, "-");
    return `${rawValue}`;
  }

  return <div className={`flex column ${styles.container}`}>
    <div className={`flex space-around`}>
      <div style={{ width: "54px" }}>
        <TeamLogo team={team} small={true} width="54px" />
      </div>
    </div>
    <div className="flex space-around">
      <div>{recordOrSeed}</div>
    </div>
    <div className="flex">
      <div className={`flex column ${styles.categories}`}>
        <StatCategory stat={statCategories.first.stat} />
        <StatCategory stat={statCategories.second.stat} />
        <StatCategory stat={statCategories.third.stat} />
        <StatCategory stat={statCategories.fourth.stat} />
        <StatCategory stat={statCategories.fifth.stat} />
        <StatCategory stat={statCategories.sixth.stat} />
      </div>
      <div className={`flex column ${styles.values}`}>
        <div>{statLookup(statCategories.first)}</div>
        <div>{statLookup(statCategories.second)}</div>
        <div>{statLookup(statCategories.third)}</div>
        <div>{statLookup(statCategories.fourth)}</div>
        <div>{statLookup(statCategories.fifth)}</div>
        <div>{statLookup(statCategories.sixth)}</div>
      </div>
    </div>
  </div >;
}