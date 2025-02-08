import argparse
import json
import pandas as pd
from pathlib import Path
import shutil
from typing import List, TypedDict

# TODO keep an old json around per season. lets us show last season's stats at the beginning of next season

"""
xbl_season_18.json
{
    current_season: 18,
    season_team_records: [
        {
            team,
            rank,
            wins,
            losses,
            remaining,
        }
    ],
    season_team_stats: [
        {
            team,
            ba,
            ab,
            ab9,
            h,
            h9,
            hr,
            hr9,
            so,
            so9,
            bb,
            bb9
            obp,
            run_conv,
            babip,
            oppba,
            oppab9,
            opph,
            opph9,
            opphr,
            opphr9,
            oppabhr,
            oppk,
            oppk9,
            oppbb,
            oppbb9
            whip,
            lob,
            e,
            fip
        },
        ...
    ],
    season_game_results: [
        {
            home_team,
            away_team
            home_score,
            away_score,
            week,
            innings
        },
        ...
    ],
    playoffs_game_results: [
        {
            home_team,
            away_team
            home_score,
            away_score,
            round,
            innings
        },
        ...
    ],
    playoffs_team_records: [
        # teams will be repeated for each round
        {
            team,
            opponent,
            wins,
            losses,
            round,
            remaining
        },
        ...
    ],
    playoffs_team_stats: [
        {
            team,
            ba,
            ab,
            ab9,
            h,
            h9,
            hr,
            hr9,
            so,
            so9,
            bb,
            bb9
            obp,
            run_conv,
            babip,
            oppba,
            oppab9,
            opph,
            opph9,
            opphr,
            opphr9,
            oppabhr,
            oppk,
            oppk9,
            oppbb,
            oppbb9
            whip,
            lob,
            e,
            fip
        },
        ...
    ],
}

careers.json
{
    players: [
        {
            handle,
            teams: [
                {
                    teamName,
                    league,
                    season
                }
            ]
        }
    ],
    season_performances: [
        {
            player,
            xbl: {},
            aaa: {},
            aa: {
                ba,
                ab,
                h,
                hr,
                so,
                bb,
                ip,
                oppba,
                oppab,
                opph,
                opphr,
                oppso,
                oppbb,
            }
        }
    ],
    season_head_to_head: [ # Career Stats / Head to Head
        {
            playerA,
            playerZ,
            playerA_wins,
            playerA_runrules,
            playerA_hrs,
            playerA_runs,
            playerA_hits,
            playerA_rbi,
            playerA_bb,
            playerA_so,
            playerA_r9,
            playerZ_ ...,
        }
    ],
    playoff_performances: [
        {
            player,
            xbl: {},
            aaa: {},
            aa: {
                ba,
                ab,
                h,
                hr,
                so,
                bb,
                ip,
                oppba,
                oppab,
                opph,
                opphr,
                oppso,
                oppbb,
            }
        }
    ],
    playoff_head_to_head: [ # Playoff Stats / Head to Head. can also use Playoff Stats / Series Table
        {
            playerA,
            playerZ,
            playerA_series_wins, # not sure how to get this
            playerA_wins,
            playerA_runrules,
            playerA_hrs,
            playerA_runs,
            playerA_hits,
            playerA_rbi,
            playerA_bb,
            playerA_so,
            playerA_r9,
            playerZ_ ...,
        }
    ]
}
"""

LEAGUES = ["XBL", "AAA", "AA"]


class MyNamespace(argparse.Namespace):
    season: int
    g_sheets_dir: Path
    save_dir: Path


def arg_parser():
    parser = argparse.ArgumentParser(
        description="Aggregate XBL stats per-season and for careers"
    )
    parser.add_argument("-s", "--season", type=int, help="Current season")
    parser.add_argument(
        "-g",
        "--g-sheets-dir",
        type=Path,
        default=Path("public/json/raw"),
        help="Path to where JSON from Google Sheets is stored",
    )
    parser.add_argument(
        "-S",
        "--save-dir",
        type=Path,
        default=Path("public/json"),
        help="Path to where parsed JSON should be stored",
    )

    return parser


class TeamRecord(TypedDict):
    """How a team stacks up in a given season"""

    team: str
    rank: int
    wins: int
    losses: int
    remaining: int
    ego_starting: int
    ego_current: int
    gb: float
    win_pct: float
    win_pct_vs_500: float
    sweeps_w: int
    splits: int
    sweeps_l: int
    sos: int
    elo: int


class TeamStats(TypedDict):
    """Performance stats for a team for a given season"""

    # hitting
    hitting_rank: int
    rs: int
    rs9: float
    ba: float
    ab: int
    ab9: float
    h: int
    h9: float
    hr: int
    hr9: float
    so: int
    so9: float
    bb: int
    bb9: float
    obp: float
    rc: float  # run conversion
    babip: float

    # pitching
    pitching_rank: int
    ra: int
    ra9: float
    oppba: float
    oppab9: float
    opph: int
    opph9: float
    opphr: int
    opphr9: float
    oppabhr: float
    oppk: int
    oppk9: float
    oppbb: int
    oppbb9: float
    whip: float
    lob: float
    e: int
    fip: float

    # mixed
    rd: int
    rd9: float
    innings_played: int
    innings_game: float


def collect_team_records_and_stats(
    league: str,
    standings_data: List[List[str]],
    hitting_data: List[List[str]],
    pitching_data: List[List[str]],
):
    team_records: List[TeamRecord] = []
    team_stats: List[TeamStats] = []
    stats_by_team: dict[str, TeamStats] = {}

    # return a different row for AA
    get_row: int = lambda r: r + 2 if league == "AA" else r

    team_records = [
        {
            "ego_starting": int(row[2]) if league == "AA" else None,
            "ego_current": int(row[3]) if league == "AA" else None,
            "rank": int(row[0]),
            "team": row[1],
            "wins": int(row[get_row(2)]),
            "losses": int(row[get_row(3)]),
            "gb": 0.0 if row[get_row(4)] == "-" else float(row[get_row(4)]),
            "win_pct": float(row[get_row(5)]),
            "win_pct_vs_500": float(row[get_row(6)]),
            "sweeps_w": int(row[get_row(7)]),
            "splits": int(row[get_row(8)]),
            "sweeps_l": int(row[get_row(9)]),
            "sos": int(row[get_row(10)]),
            "elo": int(row[get_row(19)].replace(",", "")),
        }
        for row in standings_data[1:]
    ]

    team_count = len(team_records)
    games_per_team = 2 * (team_count - 1)

    for i in range(len(team_records)):
        # I think Ws and Ls in the spreadsheet don't account for teams who drop?
        team_records[i]["remaining"] = max(
            games_per_team - (team_records[i]["wins"] + team_records[i]["losses"]), 0
        )

    for row in standings_data[1:]:
        stats_by_team[row[1]] = {
            "team": row[1],
            "rs": int(row[get_row(8)]),
            "ra": int(row[get_row(9)]),
            "rd": int(row[get_row(10)]),
            "rs9": float(row[get_row(11)]),
            "ra9": float(row[get_row(12)]),
            "rd9": float(row[get_row(13)]),
            "innings_played": int(row[get_row(17)]),
            "innings_game": float(row[get_row(18)]),
        }

    for row in hitting_data[1:]:
        stats_by_team[row[1]] = stats_by_team[row[1]] | {
            "hitting_rank": int(row[0]),
            "ba": float(row[2]),
            "ab": int(row[3]),
            "ab9": float(row[4]),
            "h": int(row[5]),
            "h9": float(row[6]),
            "hr": int(row[7]),
            "hr9": float(row[8]),
            "so": int(row[9]),
            "so9": float(row[10]),
            "bb": int(row[11]),
            "bb9": float(row[12]),
            "obp": float(row[13]),
            "rc": float(row[14]),
            "babip": float(row[15]),
        }

    for row in pitching_data[1:]:
        stats_by_team[row[1]] = stats_by_team[row[1]] | {
            "pitching_rank": row[0],
            "oppba": float(row[2]),
            "oppab9": float(row[3]),
            "opph": int(row[4]),
            "opph9": float(row[5]),
            "opphr": int(row[6]),
            "opphr9": float(row[7]),
            "oppabhr": float(row[8]),
            "oppk": int(row[9]),
            "oppk9": float(row[10]),
            "oppbb": int(row[11]),
            "oppbb9": float(row[12]),
            "whip": float(row[13]),
            "lob": float(row[14]),
            "e": int(row[15]),
            "fip": float(row[16]),
        }

    team_stats = [stats_by_team[team] for team in stats_by_team.keys()]

    return (team_records, team_stats)


class GameResults(TypedDict):
    home_team: str
    away_team: str
    home_score: int
    away_score: int
    innings: int
    away_ab: int
    away_hits: int
    away_hr: int
    away_rbi: int
    away_bb: int
    away_so: int
    home_ab: int
    home_hits: int
    home_hr: int
    home_rbi: int
    home_bb: int
    home_so: int


class SeasonGameResults(GameResults):
    week: int


class PlayoffsGameResults(GameResults):
    round: str


class SeasonStats(TypedDict):
    current_season: int
    season_team_records: List[TeamRecord]
    season_team_stats: List[TeamStats]
    season_game_results: List[SeasonGameResults]
    playoff_game_results: List[PlayoffsGameResults]


def build_season_stats(league: str, g_sheets_dir: Path, season: int) -> SeasonStats:
    data = {
        "current_season": season,
        "season_team_records": [],
        "season_team_stats": [],
        "season_game_results": [],
        "playoffs_team_records": [],
        "playoffs_team_stats": [],
        "playoffs_game_results": [],
    }

    standings_data: List[List[str]] = None
    with open(g_sheets_dir.joinpath(f"{league}__Standings.json")) as f:
        raw_data = json.loads(f.read())
        standings_data = raw_data["values"]

    hitting_data = None
    with open(g_sheets_dir.joinpath(f"{league}__Hitting.json")) as f:
        raw_data = json.loads(f.read())
        hitting_data = raw_data["values"]

    pitching_data = None
    with open(g_sheets_dir.joinpath(f"{league}__Pitching.json")) as f:
        raw_data = json.loads(f.read())
        pitching_data = raw_data["values"]

    season_team_records, season_team_stats = collect_team_records_and_stats(
        league, standings_data, hitting_data, pitching_data
    )

    print(season_team_records)

    season_scores_data = None
    with open(g_sheets_dir.joinpath(f"{league}__Box%20Scores.json")) as f:
        raw_data = json.loads(f.read())
        season_scores_data = raw_data["values"]

    data["season_game_results"] = [
        {
            "week": game[0],
            "away_team": game[1],
            "away_score": game[2],
            "home_score": game[3],
            "home_team": game[4],
        }
        for game in season_scores_data[1:]
    ]

    return data


def main(args: MyNamespace):
    if not args.g_sheets_dir.exists():
        raise Exception("Missing data. Plesae run `scripts/get-sheets.py' first")

    # data = readjson()
    # df = pd.DataFrame(dict(zip(data[0], data[1:])))

    season_data = {
        league: build_season_stats(league, args.g_sheets_dir, args.season)
        for league in LEAGUES
    }

    # write json data
    # for league in LEAGUES:
    # print(season_data[league])
    # season_json = args.save_dir.joinpath(f"{league}__s{args.season}.json")
    # with open(season_json, "w") as f:
    #     f.write(json.dumps(season_data[league]))

    # shutil.copy(season_json, args.save_dir.joinpath(f"{league}.json"))


if __name__ == "__main__":
    parser = arg_parser()
    args: MyNamespace = parser.parse_args()
    main(args)
