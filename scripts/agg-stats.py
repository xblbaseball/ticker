import argparse
import json
import pandas as pd
from pathlib import Path
import shutil

# TODO keep an old json around per season. lets us show last season's stats at the beginning of next season

"""
xbl_season_18.json
{
    current_season: 18,
    season_standings: [team1, team2, ...],
    season_team_records: [
        {
            team,
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


def arg_parser():
    parser = argparse.ArgumentParser(
        description="Aggregate XBL stats per-season and for careers"
    )
    parser.add_argument("-s", "--season", type=int, help="Current season")

    return parser


def build_season_stats(league: str, season: int):
    tabs = ["Standings", "Hitting", "Pitching", "Playoffs", "Box%20Scores"]

    data = {
        "current_season": season,
        "season_standings": [],
        "season_team_records": [],
        "season_team_stats": [],
        "season_game_results": [],
        "playoffs_team_records": [],
        "playoffs_team_stats": [],
        "playoffs_game_results": [],
    }

    # TODO do parsing

    return data


def main(args: MyNamespace):
    json_dir = Path("public/json")
    if not json_dir.exists():
        raise Exception("Missing data. Plesae run `scripts/get-sheets.py' first")

    # data = readjson()
    # df = pd.DataFrame(dict(zip(data[0], data[1:])))

    season_data = {
        league: build_season_stats(league, args.season) for league in LEAGUES
    }

    # write json data
    for league in LEAGUES:
        season_json = f"{league}__s{args.season}.json"
        with open(season_json, "w") as f:
            f.write(json.dumps(season_data[league]))

        shutil.copy(season_json, f"{league}.json")


if __name__ == "__main__":
    parser = arg_parser()
    args: MyNamespace = parser.parse_args()
    main(args)
