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
    json_dir: Path


def arg_parser():
    parser = argparse.ArgumentParser(
        description="Aggregate XBL stats per-season and for careers"
    )
    parser.add_argument("-s", "--season", type=int, help="Current season")
    parser.add_argument(
        "-j",
        "--json-dir",
        type=Path,
        default=Path("public/json"),
        help="Path to where JSON is stored",
    )

    return parser


class TeamRecord(TypedDict):
    team: str
    rank: int
    wins: int
    losses: int
    remaining: int


class SeasonStats(TypedDict):
    current_season: int
    season_team_records: List[TeamRecord]


def build_season_stats(league: str, json_dir: Path, season: int) -> SeasonStats:
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
    with open(json_dir.joinpath(f"{league}__Standings.json")) as f:
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

    return data


def main(args: MyNamespace):
    if not args.json_dir.exists():
        raise Exception("Missing data. Plesae run `scripts/get-sheets.py' first")

    # data = readjson()
    # df = pd.DataFrame(dict(zip(data[0], data[1:])))

    season_data = {
        league: build_season_stats(league, args.json_dir, args.season)
        for league in LEAGUES
    }

    # write json data
    for league in LEAGUES:
        print(season_data[league])
        # season_json = args.json_dir.joinpath(f"{league}__s{args.season}.json")
        # with open(season_json, "w") as f:
        #     f.write(json.dumps(season_data[league]))

        # shutil.copy(season_json, args.json_dir.joinpath(f"{league}.json"))


if __name__ == "__main__":
    parser = arg_parser()
    args: MyNamespace = parser.parse_args()
    main(args)
