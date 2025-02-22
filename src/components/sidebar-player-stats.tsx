import _ from "lodash";
import { useContext } from "react";
import TeamLogo from "@/components/team-logo";
import { SettingsContext } from "@/store/settings.context";
import { StatsContext } from "@/store/stats.context";

import styles from "./sidebar-player-stats.module.css";
import { StatCategory } from "@/typings/stats";

export default function SidebarPlayerStats({ away }: { away: boolean }) {
  const {
    awayPlayer,
    homePlayer,
    awayTeam,
    homeTeam,
    awayStatsTimeframe,
    homeStatsTimeframe,
    awayStatsSeason,
    homeStatsSeason,
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
  const statsTimeframe = away ? awayStatsTimeframe : homeStatsTimeframe;
  const statsSeason = away ? awayStatsSeason : homeStatsSeason;

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

  /** lookup a stat for the timeframe */
  const statLookup = (stat: string) => {
    let lookupPath: string[] = [];

    switch (statsTimeframe) {
      case "regularSeason":
        lookupPath = ['stats', league, 'season_team_stats', team, stat];
        break;
      case "playoffs":
        lookupPath = ['stats', league, 'playoffs_team_stats', team, stat];
        break;
      case "careerRegularSeason":
        lookupPath = ['stats', 'careers', 'season_performances', player, 'all_time', stat];
        break;
      case "careerPlayoffs":
        lookupPath = ['stats', 'careers', 'playoffs_performances', player, 'all_time', stat];
        break;
      case "leagueRegularSeason":
        lookupPath = ['stats', 'careers', 'season_performances', player, 'by_league', league, stat];
        break;
      case "leaguePlayoffs":
        lookupPath = ['stats', 'careers', 'playoffs_performances', player, 'by_league', league, stat];
        break;
      case "h2hRegularSeason":
        let [playerA, playerZ] = [homePlayer, awayPlayer].sort()
        let isPlayerA = playerA === player;
        lookupPath = ['stats', 'stats', 'careers', 'season_head_to_head', playerA, playerZ, isPlayerA ? 'player_a' : 'player_z', stat];
        break;
      case "h2hPlayoffs":
        [playerA, playerZ] = [homePlayer, awayPlayer].sort()
        isPlayerA = playerA === player;
        lookupPath = ['stats', 'stats', 'careers', 'playoffs_head_to_head', playerA, playerZ, isPlayerA ? 'player_a' : 'player_z', stat];
        break;

      default:
        console.error("I don't know how we got here");
        break;
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
        <StatCategory stat={statCategories.first} />
        <StatCategory stat={statCategories.second} />
        <StatCategory stat={statCategories.third} />
        <StatCategory stat={statCategories.fourth} />
        <StatCategory stat={statCategories.fifth} />
        <StatCategory stat={statCategories.sixth} />
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
    {/* include the timeframe too */}
  </div >;
}