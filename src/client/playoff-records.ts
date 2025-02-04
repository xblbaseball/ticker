import { League } from "@/typings/league";
import PlayoffRecord from '@/typings/playoff-record';
import getLocalJson from './local-json';

export default function getPlayoffRecords(league: League) {
  const data = getLocalJson(league, "Playoffs");

  const _playoffRecords: { [index: string]: { [index: string]: { wins: number; losses: number } } } = {};

  const numGames = data.values.length;
  // first row is the header
  for (let g = 1; g < numGames; g++) {
    const [playoffRound, awayTeam, awayScore, homeScore, homeTeam] = data.values[g];

    const round = playoffRound.slice(1);
    const winner = +awayScore > +homeScore ? awayTeam : homeTeam;
    const awayWon = winner === awayTeam;
    const homeWon = winner === homeTeam;

    if (!(round in _playoffRecords)) {
      _playoffRecords[round] = {};
    }

    // checking each team separately helps account for the fact that AA has round robins
    if (!(awayTeam in _playoffRecords[round])) {
      _playoffRecords[round][awayTeam] = awayWon ? { wins: 1, losses: 0 } : { wins: 0, losses: 1 };
    } else {
      if (awayWon) {
        _playoffRecords[round][awayTeam].wins += 1;
      } else {
        _playoffRecords[round][awayTeam].losses += 1;
      }
    }
    if (!(homeTeam in _playoffRecords[round])) {
      _playoffRecords[round][homeTeam] = homeWon ? { wins: 1, losses: 0 } : { wins: 0, losses: 1 };
    } else {
      if (homeWon) {
        _playoffRecords[round][homeTeam].wins += 1;
      } else {
        _playoffRecords[round][homeTeam].losses += 1;
      }
    }
  }

  const playoffRecords: PlayoffRecord[] = [];

  for (const round of Object.keys(_playoffRecords)) {
    Object.keys(_playoffRecords[round]).forEach(team => {
      const { wins, losses } = _playoffRecords[round][team]
      const record: PlayoffRecord = { round, team, wins, losses }
      playoffRecords.push(record);
    });
  }

  return playoffRecords;
}