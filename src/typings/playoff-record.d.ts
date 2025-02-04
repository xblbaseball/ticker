import TeamRecord from "./team-record";

/** how a team has fared in a playoff round */
export default interface PlayoffRecord extends TeamRecord {
  round: string;
  gamesRemaining?: number;
}
