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
    showStatTimeframes,
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

  const otherPlayer = away ? homePlayer : awayPlayer;

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
  const fixStyling = (stat: string) => {
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
        {fixStyling(stat)}
      </div>
    )
  }

  const RenderTimeframe = () => {
    if (statsTimeframe === "regularSeason") {
      return `Season ${statsSeason}`;
    }

    if (statsTimeframe === "playoffs") {
      return `S${statsSeason} Playoffs`
    }

    if (statsTimeframe === "careerRegularSeason") {
      return "Career"
    }

    if (statsTimeframe === "careerPlayoffs") {
      return "Career Playoffs"
    }

    if (statsTimeframe === "leagueRegularSeason") {
      return `Career ${statsLeague}`
    }

    if (statsTimeframe === "leaguePlayoffs") {
      return `${statsLeague} Playoffs`
    }

    if (statsTimeframe === "h2hRegularSeason") {
      return `vs ${otherPlayer}`;
    }

    if (statsTimeframe === "h2hPlayoffs") {
      return `vs ${otherPlayer}`;
    }
  }

  /** lookup a stat for the timeframe */
  const RenderStat = (stat: string) => {
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
      let num = `${rawValue.toFixed(3)}`;
      if (rawValue < 1) {
        // cut the leading 0 off numbers like 0.123 to make them render as .123
        num = num.slice(1);
      }
      return num;
    }
    return `${rawValue}`;
  }

  return <div className={`flex column ${styles.container} ${away && styles.first}`}>
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
        <div>{RenderStat(statCategories.first)}</div>
        <div>{RenderStat(statCategories.second)}</div>
        <div>{RenderStat(statCategories.third)}</div>
        <div>{RenderStat(statCategories.fourth)}</div>
        <div>{RenderStat(statCategories.fifth)}</div>
        <div>{RenderStat(statCategories.sixth)}</div>
      </div>
    </div>
    {showStatTimeframes && <div className={`flex space-around`}>
      <div className={styles.timeframe}><em>{RenderTimeframe()}</em></div>
    </div>}
  </div >;
}