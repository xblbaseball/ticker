/** generic high level representation of how well a team is performing in some context */
export default interface TeamRecord {
  /** capitalized name of the team */
  team: string;
  wins: number;
  losses: number;
}
