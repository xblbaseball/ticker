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
    team: str
    rank: int
    wins: int
    losses: int
    remaining: int


class TeamStats(TypedDict):
    """Stats for a team for a given season"""

    # hitting
    BA: float
    AB: int
    AB9: float
    H: int
    H9: float
    HR: int
    HR9: float
    SO: int
    SO9: float
    BB: int
    BB9: float
    OBP: float
    RC: float  # Run conversion
    BABIP: float

    # pitching
    OppBA: float
    OppAB9: float
    OppH: int
    OppH9: float
    OppHR: int
    OppHR9: float
    OppABHR: float
    OppK: int
    OppK9: float
    OppBB: int
    OppBB9: float
    WHIP: float
    LOB: float
    E: int
    FIP: float


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
    tabs = ["Standings", "Hitting", "Pitching", "Playoffs", "Box%20Scores"]

    data = {
        "current_season": season,
        "season_team_records": [],
        "season_team_stats": [],
        "season_game_results": [],
        "playoffs_team_records": [],
        "playoffs_team_stats": [],
        "playoffs_game_results": [],
    }

    standings_data = None
    with open(g_sheets_dir.joinpath(f"{league}__Standings.json")) as f:
        raw_data = json.loads(f.read())
        standings_data = raw_data["values"]

    win_col = 4 if league == "AA" else 2
    loss_col = 5 if league == "AA" else 3

    data["season_team_records"] = [
        {
            "team": value[1],
            "rank": int(value[0]),
            "wins": int(value[win_col]),
            "losses": int(value[loss_col]),
            "remaining": None,
        }
        # first row is the header
        for value in standings_data[1:]
    ]

    team_count = len(data["season_team_records"])
    games_per_team = 2 * (team_count - 1)

    for i in range(len(data["season_team_records"])):
        games_played = (
            data["season_team_records"][i]["wins"]
            + data["season_team_records"][i]["losses"]
        )
        # I think Ws and Ls in the spreadsheet don't account for teams who drop?
        data["season_team_records"][i]["remaining"] = max(
            games_per_team - games_played, 0
        )

    hitting_data = None
    with open(g_sheets_dir.joinpath(f"{league}__Hitting.json")) as f:
        raw_data = json.loads(f.read())
        hitting_data = raw_data["values"]

    pitching_data = None
    with open(g_sheets_dir.joinpath(f"{league}__Pitching.json")) as f:
        raw_data = json.loads(f.read())
        pitching_data = raw_data["values"]

    data["season_team_stats"] = [
        {
            "team": hitting_data[i][1],
            # hitting
            "BA": float(hitting_data[i][2]),
            "AB": int(hitting_data[i][3]),
            "AB9": float(hitting_data[i][4]),
            "H": int(hitting_data[i][5]),
            "H9": float(hitting_data[i][6]),
            "HR": int(hitting_data[i][7]),
            "HR9": float(hitting_data[i][8]),
            "SO": int(hitting_data[i][9]),
            "SO9": float(hitting_data[i][10]),
            "BB": int(hitting_data[i][11]),
            "BB9": float(hitting_data[i][12]),
            "OBP": float(hitting_data[i][13]),
            "RC": float(hitting_data[i][14]),
            "BABIP": float(hitting_data[i][15]),
            # pitching
            "OppBA": float(pitching_data[i][2]),
            "OppAB9": float(pitching_data[i][3]),
            "OppH": int(pitching_data[i][4]),
            "OppH9": float(pitching_data[i][5]),
            "OppHR": int(pitching_data[i][6]),
            "OppHR9": float(pitching_data[i][7]),
            "OppABHR": float(pitching_data[i][8]),
            "OppK": int(pitching_data[i][9]),
            "OppK9": float(pitching_data[i][10]),
            "OppBB": int(pitching_data[i][11]),
            "OppBB9": float(pitching_data[i][12]),
            "WHIP": float(pitching_data[i][13]),
            "LOB": float(pitching_data[i][14]),
            "E": int(pitching_data[i][15]),
            "FIP": float(pitching_data[i][16]),
        }
        for i in range(1, team_count + 1)
    ]

    season_scores_data = None
    with open(g_sheets_dir.joinpath(f"{league}__Box%20Scores.json")) as f:
        raw_data = json.loads(f.read())
        season_scores_data = raw_data["values"]

    data["season_game_results"] = [
        {
            "week": game[0],
            "away_team": game[1],
            "away_score": game[2],
            "home_score": game[3]
            "home_team": game[4]
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
    for league in LEAGUES:
        print(season_data[league])
        # season_json = args.save_dir.joinpath(f"{league}__s{args.season}.json")
        # with open(season_json, "w") as f:
        #     f.write(json.dumps(season_data[league]))

        # shutil.copy(season_json, args.save_dir.joinpath(f"{league}.json"))


if __name__ == "__main__":
    parser = arg_parser()
    args: MyNamespace = parser.parse_args()
    main(args)
