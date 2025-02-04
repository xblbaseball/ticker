import TeamRecord from "./team-record";

/** regular season standings */
export default interface Standing extends TeamRecord {
  rank: number;
}
