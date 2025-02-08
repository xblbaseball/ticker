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


def try_int(x: str):
    """If we can't get an int, just get a float"""
    ret: int = None

    # we def can't parse an empty string to a number
    if len(x) == 0:
        return ret

    try:
        ret = int(x)
    except ValueError as e:
        ret = float(x)
    return ret


def maybe(row: List[str], col: int, type: callable):
    ret = None
    try:
        ret = type(row[col])
    except IndexError as e:
        # print(f"Failed to get col {col} from {row}")
        pass
    return ret


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
            "ego_starting": try_int(row[2]) if league == "AA" else None,
            "ego_current": try_int(row[3]) if league == "AA" else None,
            "rank": try_int(row[0]),
            "team": row[1],
            "wins": try_int(row[get_row(2)]),
            "losses": try_int(row[get_row(3)]),
            "gb": 0.0 if row[get_row(4)] == "-" else float(row[get_row(4)]),
            "win_pct": float(row[get_row(5)]),
            "win_pct_vs_500": float(row[get_row(6)]),
            "sweeps_w": try_int(row[get_row(7)]),
            "splits": try_int(row[get_row(8)]),
            "sweeps_l": try_int(row[get_row(9)]),
            "sos": try_int(row[get_row(10)]),
            "elo": try_int(row[get_row(19)].replace(",", "")),
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
            "rs": try_int(row[get_row(11)]),
            "ra": try_int(row[get_row(12)]),
            "rd": try_int(row[get_row(13)]),
            "rs9": float(row[get_row(14)]),
            "ra9": float(row[get_row(15)]),
            "rd9": float(row[get_row(16)]),
            "innings_played": try_int(row[get_row(17)]),
            "innings_game": float(row[get_row(18)]),
        }

    for row in hitting_data[1:]:
        stats_by_team[row[1]] = stats_by_team[row[1]] | {
            "hitting_rank": try_int(row[0]),
            "ba": float(row[2]),
            "ab": try_int(row[3]),
            "ab9": float(row[4]),
            "h": try_int(row[5]),
            "h9": float(row[6]),
            "hr": try_int(row[7]),
            "hr9": float(row[8]),
            "so": try_int(row[9]),
            "so9": float(row[10]),
            "bb": try_int(row[11]),
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
            "opph": try_int(row[4]),
            "opph9": float(row[5]),
            "opphr": try_int(row[6]),
            "opphr9": float(row[7]),
            "oppabhr": float(row[8]),
            "oppk": try_int(row[9]),
            "oppk9": float(row[10]),
            "oppbb": try_int(row[11]),
            "oppbb9": float(row[12]),
            "whip": float(row[13]),
            "lob": float(row[14]),
            "e": try_int(row[15]),
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
    away_e: int
    home_ab: int
    home_hits: int
    home_hr: int
    home_rbi: int
    home_bb: int
    home_so: int
    home_e: int


class SeasonGameResults(GameResults):
    week: int


class PlayoffsGameResults(GameResults):
    round: str


def collect_game_results(playoffs: bool, box_score_data: List[List[str]]):
    if playoffs:
        game_results: List[PlayoffsGameResults] = []
    else:
        game_results: List[SeasonGameResults] = []

    # regular season has errors but playoffs do not
    get_col = lambda c: c if playoffs else c + 2

    for game in box_score_data[1:]:
        results = {
            "away_team": game[1],
            "home_team": game[4],
            "away_score": try_int(game[2]),
            "home_score": try_int(game[3]),
            "away_e": None if playoffs else try_int(game[5]),
            "home_e": None if playoffs else try_int(game[6]),
            "innings": float(game[get_col(5)]),
            "away_ab": maybe(game, get_col(6), try_int),
            # "away_r": maybe(game, get_col(7), try_int),
            "away_hits": maybe(game, get_col(8), try_int),
            "away_hr": maybe(game, get_col(9), try_int),
            "away_rbi": maybe(game, get_col(10), try_int),
            "away_bb": maybe(game, get_col(11), try_int),
            "away_so": maybe(game, get_col(12), try_int),
            "home_ab": maybe(game, get_col(13), try_int),
            # "home_r": maybe(game, get_col(14), try_int),
            "home_hits": maybe(game, get_col(15), try_int),
            "home_hr": maybe(game, get_col(16), try_int),
            "home_rbi": maybe(game, get_col(17), try_int),
            "home_bb": maybe(game, get_col(18), try_int),
            "home_so": maybe(game, get_col(19), try_int),
        }
        if playoffs:
            results["round"] = game[0]
        else:
            results["week"] = int(game[0])

        game_results.append(results)

    return game_results


def calc_playoff_team_stats(playoff_game_results: List[PlayoffsGameResults]):
    stats_by_team: dict[str, TeamStats] = {}
    df = pd.DataFrame(playoff_game_results)
    print(df.head())
    # need to separate each game by team


class SeasonStats(TypedDict):
    current_season: int
    season_team_records: List[TeamRecord]
    season_team_stats: List[TeamStats]
    season_game_results: List[SeasonGameResults]
    playoffs_game_results: List[PlayoffsGameResults]


def build_season_stats(league: str, g_sheets_dir: Path, season: int) -> SeasonStats:
    print(league)
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
    data["season_team_records"] = season_team_records
    data["season_team_stats"] = season_team_stats

    season_scores_data = None
    with open(g_sheets_dir.joinpath(f"{league}__Box%20Scores.json")) as f:
        raw_data = json.loads(f.read())
        season_scores_data = raw_data["values"]

    season_game_results = collect_game_results(False, season_scores_data)
    data["season_game_results"] = season_game_results

    playoff_scores_data = None
    with open(g_sheets_dir.joinpath(f"{league}__Playoffs.json")) as f:
        raw_data = json.loads(f.read())
        playoff_scores_data = raw_data["values"]

    playoffs_game_results = collect_game_results(True, playoff_scores_data)
    data["playoffs_game_results"] = playoffs_game_results

    calc_playoff_team_stats(playoffs_game_results)

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
