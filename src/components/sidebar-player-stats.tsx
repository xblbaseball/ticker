import _ from "lodash";
import { useContext } from "react";
import TeamLogo from "@/components/team-logo";
import { SettingsContext } from "@/store/settings.context";
import { StatsContext } from "@/store/stats.context";
import { Rounds } from "@/typings/season";

import styles from "./sidebar-player-stats.module.css";

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

  let record = "0-0";
  if (showPlayoffRecord) {
    // we're in the playoffs
    const rounds: Rounds = _.get(statsStore, ["stats", league, "playoffs_team_records", team, 'rounds'], {})
    // console.log(rounds);
  } else {
    const { wins, losses } = _.get(
      statsStore,
      ["stats", league, "season_team_records", team],
      { wins: 0, losses: 0 }
    );
    record = `${wins}-${losses}`
    // we're in the regular season
  }

  return <div className={`flex column ${styles.container}`}>
    <div className={`flex space-around`}>
      <div style={{ width: "54px" }}>
        <TeamLogo team={team} small={true} width="54px" />
      </div>
    </div>
    <div className="flex space-around">
      <div>{record}</div>
    </div>
    {/* record (switch on playoffs?) */}
    {/* two col stat list */}
    hey
  </div >;
}