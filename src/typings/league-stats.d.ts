import PlayoffRecord from "./playoff-record";
import Standing from "./standing";
import TeamStat from "./team-stat";

export default interface LeagueStats {
  name: string;
  standings: Standing[];
  scoresRS: GameResults[];
  scoresPlayoffs: GameResults[];
  playoffRecords: PlayoffRecord[];
  baLeaders: TeamStat[];
  kLeaders: TeamStat[];
  hrLeaders: TeamStat[];
  showPlayoffs: boolean;
}