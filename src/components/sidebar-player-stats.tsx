import _ from "lodash";
import { useContext } from "react";
import TeamLogo from "@/components/team-logo";
import { SettingsContext } from "@/store/settings.context";
import { StatsContext } from "@/store/stats.context";

import styles from "./sidebar-player-stats.module.css";

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
    awayStatsLeague,
    homeStatsLeague,
    awayStatCategories,
    homeStatCategories,
    league,
    playoffs
  } = useContext(SettingsContext);
  const statsStore = useContext(StatsContext);

  const player = away ? awayPlayer : homePlayer;
  if (player === "") {
    return <div>no player selected</div>;
  }

  const team = away ? awayTeam : homeTeam;

  if (team === "") {
    return <div>no team selected</div>;
  }

  const statCategories = away ? awayStatCategories : homeStatCategories;
  const statsTimeframe = away ? awayStatsTimeframe : homeStatsTimeframe;
  const statsSeason = away ? awayStatsSeason : homeStatsSeason;
  const statsLeague = away ? awayStatsLeague : homeStatsLeague;

  const showPlayoffRecord = _.get(playoffs, [league]);
  // console.log(league, showPlayoffRecord);

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
    let isPlayerA: boolean;

    switch (statsTimeframe) {
      case "regularSeason":
        if (statsSeason === parseInt(process.env.NEXT_PUBLIC_SEASON)) {
          // not guaranteed that all current season games have been recorded in careers
          lookupPath = ['stats', league, 'season_team_stats', team, stat];
        } else {
          lookupPath = ['stats', 'careers', 'regular_season', player, 'by_season', `season_${statsSeason}`, stat]
        }
        break;
      case "playoffs":
        if (statsSeason === parseInt(process.env.NEXT_PUBLIC_SEASON)) {
          // not guaranteed that all current season games have been recorded in careers
          lookupPath = ['stats', league, 'playoffs_team_stats', team, stat];
        } else {
          lookupPath = ['stats', 'careers', 'playoffs', player, 'by_season', `season_${statsSeason}`, stat]
        }
        break;
      case "careerRegularSeason":
        lookupPath = ['stats', 'careers', 'regular_season', player, 'all_time', stat];
        break;
      case "careerPlayoffs":
        lookupPath = ['stats', 'careers', 'playoffs', player, 'all_time', stat];
        break;
      case "leagueRegularSeason":
        lookupPath = ['stats', 'careers', 'regular_season', player, 'by_league', statsLeague, stat];
        break;
      case "leaguePlayoffs":
        lookupPath = ['stats', 'careers', 'playoffs', player, 'by_league', statsLeague, stat];
        break;
      case "h2hRegularSeason":
        // can't show head to head if we don't have both teams selected
        if (awayPlayer === "" || homePlayer === "") {
          break;
        }

        const [playerA_rs, playerZ_rs] = [homePlayer, awayPlayer].sort()
        isPlayerA = playerA_rs === player;
        lookupPath = ['stats', 'careers', 'regular_season_head_to_head', playerA_rs, playerZ_rs, isPlayerA ? 'player_a_stats' : 'player_z_stats', stat];
        break;
      case "h2hPlayoffs":
        // can't show head to head if we don't have both teams selected
        if (awayPlayer === "" || homePlayer === "") {
          break;
        }

        const [playerA_p, playerZ_p] = [homePlayer, awayPlayer].sort()
        isPlayerA = playerA_p === player;
        lookupPath = ['stats', 'careers', 'playoffs_head_to_head', playerA_p, playerZ_p, isPlayerA ? 'player_a_stats' : 'player_z_stats', stat];
        break;

      default:
        console.error("I don't know how we got here");
        break;
    }

    const rawValue: number | string = _.get(statsStore, lookupPath, "-");
    if (_.isNumber(rawValue) && !Number.isInteger(rawValue)) {
      return `${rawValue.toFixed(3)}`;
    }
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