import argparse
import json
import math
import pandas as pd
from pathlib import Path
import shutil
from typing import List, TypedDict

# TODO keep an old json around per season. lets us show last season's stats at the beginning of next season
# TODO consistency between "so" and "k"

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


def three_digits(x: int | float) -> int | float:
    return round(x, 3)


class TeamRecord(TypedDict):
    """How a team stacks up in a given season/playoffs"""

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
    """Performance stats for a team for a given season/playoffs"""

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
    abhr: float
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
            "rs": int(row[get_row(11)]),
            "ra": int(row[get_row(12)]),
            "rd": int(row[get_row(13)]),
            "rs9": float(row[get_row(14)]),
            "ra9": float(row[get_row(15)]),
            "rd9": float(row[get_row(16)]),
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
    away_r: int
    away_hits: int
    away_hr: int
    away_rbi: int
    away_bb: int
    away_so: int
    away_e: int
    home_ab: int
    home_r: int
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
            "away_score": int(game[2]),
            "home_score": int(game[3]),
            "innings": float(game[get_col(5)]),
        }
        if playoffs:
            results["round"] = game[0]
        else:
            results["week"] = int(game[0])

        try:
            extra_stats = {
                "away_e": None if playoffs else int(game[5]),
                "home_e": None if playoffs else int(game[6]),
                # not all of these are always recorded. missing records are probably from disconnects
                "away_ab": int(game[get_col(6)]),
                "away_r": int(game[get_col(7)]),
                "away_hits": int(game[get_col(8)]),
                "away_hr": int(game[get_col(9)]),
                "away_rbi": int(game[get_col(10)]),
                "away_bb": int(game[get_col(11)]),
                "away_so": int(game[get_col(12)]),
                "home_ab": int(game[get_col(13)]),
                "home_r": int(game[get_col(14)]),
                "home_hits": int(game[get_col(15)]),
                "home_hr": int(game[get_col(16)]),
                "home_rbi": int(game[get_col(17)]),
                "home_bb": int(game[get_col(18)]),
                "home_so": int(game[get_col(19)]),
            }

            results |= extra_stats

        except ValueError as e:
            # some column is wrong in the extra stats. don't collect them
            pass

        game_results.append(results)

    return game_results


def calc_playoffs_team_stats(playoffs_game_results: List[PlayoffsGameResults]):
    playoffs_team_stats: List[TeamStats] = []

    blank_stats = {
        "innings_pitching": 0,
        "innings_hitting": 0,
        "ab": 0,
        "r": 0,
        "h": 0,
        "hr": 0,
        "rbi": 0,
        "bb": 0,
        "so": 0,
        "oppab": 0,
        "oppr": 0,
        "opph": 0,
        "opprbi": 0,
        "oppbb": 0,
        "oppso": 0,
        "games_played": 0,
    }

    stats_by_team: dict[str, dict[str, int | float]] = {}

    for game in playoffs_game_results:
        away = game["away_team"]
        home = game["home_team"]
        if away not in stats_by_team:
            stats_by_team[away] = blank_stats.copy()
        if home not in stats_by_team:
            stats_by_team[home] = blank_stats.copy()

        if game["away_ab"] is None:
            # we're missing stats. don't count this game
            continue

        away_stats = stats_by_team[away].copy()
        home_stats = stats_by_team[home].copy()

        away_stats["innings_hitting"] += math.ceil(game["innings"])
        away_stats["innings_pitching"] += math.floor(game["innings"])
        home_stats["inning_hitting"] += math.floor(game["innings"])
        home_stats["inning_pitching"] += math.ceil(game["innings"])

        # capture away team stats
        away_stats["games_played"] += 1
        away_stats["ab"] += game["away_ab"]
        away_stats["r"] += game["away_r"]
        away_stats["h"] += game["away_h"]
        away_stats["hr"] += game["away_hr"]
        away_stats["rbi"] += game["away_rbi"]
        away_stats["bb"] += game["away_bb"]
        away_stats["so"] += game["away_so"]
        away_stats["oppab"] += game["home_ab"]
        away_stats["oppr"] += game["home_r"]
        away_stats["opph"] += game["home_h"]
        away_stats["opphr"] += game["home_hr"]
        away_stats["opprbi"] += game["home_rbi"]
        away_stats["oppbb"] += game["home_bb"]
        away_stats["oppso"] += game["home_so"]

        # capture home team stats
        home_stats["games_played"] += 1
        home_stats["ab"] += game["home_ab"]
        home_stats["r"] += game["home_r"]
        home_stats["h"] += game["home_h"]
        home_stats["hr"] += game["home_hr"]
        home_stats["rbi"] += game["home_rbi"]
        home_stats["bb"] += game["home_bb"]
        home_stats["so"] += game["home_so"]
        home_stats["oppab"] += game["away_ab"]
        home_stats["oppr"] += game["away_r"]
        home_stats["opph"] += game["away_h"]
        home_stats["opphr"] += game["away_hr"]
        home_stats["opprbi"] += game["away_rbi"]
        home_stats["oppbb"] += game["away_bb"]
        home_stats["oppso"] += game["away_so"]

        stats_by_team[away] = away_stats
        stats_by_team[home] = home_stats

    per_9_hitting = lambda key: three_digits(
        (raw_stats[key] / raw_stats["innings_hitting"]) * 9
    )
    per_9_pitching = lambda key: three_digits(
        (raw_stats[key] / raw_stats["innings_pitching"]) * 9
    )

    for team in stats_by_team.keys():
        raw_stats = stats_by_team[team]
        stats: TeamStats = {
            # hitting
            "rs": raw_stats["r"],
            "rs9": per_9_hitting("r"),
            "ba": three_digits(raw_stats["h"] / raw_stats["ab"]),
            "ab": raw_stats["ab"],
            "ab9": per_9_hitting("ab"),
            "h": raw_stats["h"],
            "h9": per_9_hitting("h"),
            "hr": raw_stats["hr"],
            "hr9": per_9_hitting("hr"),
            "abhr": three_digits(raw_stats["ab"] / raw_stats["hr"]),
            "so": raw_stats["so"],
            "so9": per_9_hitting("so"),
            "bb": raw_stats["bb"],
            "bb9": per_9_hitting("bb"),
            "obp": three_digits(
                (raw_stats["h"] + raw_stats["bb"]) / (raw_stats["ab"] + raw_stats["bb"])
            ),
            "rc": three_digits(raw_stats["h"] / raw_stats["r"]),
            "babip": three_digits(
                (raw_stats["h"] - raw_stats["hr"])
                / (raw_stats["ab"] - raw_stats["so"] - raw_stats["hr"])
            ),
            # pitching
            "ra": raw_stats["oppr"],
            "ra9": per_9_pitching("oppr"),
            "oppba": three_digits(raw_stats["opph"] / raw_stats["oppab"]),
            "oppab9": per_9_pitching("oppab"),
            "opph": raw_stats["opph"],
            "opph9": per_9_pitching("opph"),
            "opphr": raw_stats["opphr"],
            "opphr9": per_9_pitching("opphr"),
            "oppabhr": three_digits(raw_stats["ab"] / raw_stats["hr"]),
            "oppk": raw_stats["oppso"],
            "oppk9": per_9_pitching("oppso"),
            "oppbb": raw_stats["oppbb"],
            "oppbb9": per_9_pitching("oppbb"),
            "whip": three_digits(
                (raw_stats["opph"] + raw_stats["oppbb"]) / raw_stats["innings_pitching"]
            ),
            "lob": three_digits(
                (raw_stats["opph"] + raw_stats["oppbb"] - raw_stats["oppr"])
                / (raw_stats["opph"] + raw_stats["oppbb"] - 1.4 * raw_stats["opphr"])
            ),
            "e": None,
            # TODO missing fip constant. need league ERA
            "fip": three_digits(
                (
                    raw_stats["opphr"] * 13
                    + 3 * raw_stats["oppbb"]
                    - 2 * raw_stats["oppso"]
                )
                / raw_stats["innings_pitching"]
            ),
            # mixed
            "rd": raw_stats["r"] - raw_stats["oppr"],
            # TODO is this right?
            "rd9": three_digits(per_9_hitting("r") - per_9_pitching("oppr")),
            "innings_played": (
                raw_stats["innings_hitting"] + raw_stats["innings_pitching"]
            )
            / 2,
            "innings_game": three_digits(
                stats["innings_played"] / raw_stats["games_played"]
            ),
        }

        playoffs_team_stats.append(stats)


class SeasonStats(TypedDict):
    current_season: int
    season_team_records: List[TeamRecord]
    season_team_stats: List[TeamStats]
    season_game_results: List[SeasonGameResults]
    playoffs_team_records: List[TeamRecord]
    playoffs_game_results: List[PlayoffsGameResults]
    playoffs_team_stats: List[TeamStats]


def build_season_stats(league: str, g_sheets_dir: Path, season: int) -> SeasonStats:
    print(f"Running {league}...")
    data: SeasonStats = {
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

    playoffs_scores_data = None
    with open(g_sheets_dir.joinpath(f"{league}__Playoffs.json")) as f:
        raw_data = json.loads(f.read())
        playoffs_scores_data = raw_data["values"]

    playoffs_game_results = collect_game_results(True, playoffs_scores_data)
    data["playoffs_game_results"] = playoffs_game_results

    # no spreadsheet has these. we have to run the numbers ourselves
    playoffs_team_stats = calc_playoffs_team_stats(playoffs_game_results)

    return data


def main(args: MyNamespace):
    if not args.g_sheets_dir.exists():
        raise Exception(
            "Missing data from Google Sheets. Plesae double check `--g-sheets-dir' or run `scripts/get-sheets.py' first"
        )

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
