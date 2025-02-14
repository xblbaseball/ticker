"""
Aggregate all the XBL stats that we can find into a clear, accessible set of high-level statistics. These statistics are at the level that you would want to put in the ticker for a sports broadcast. The script expects that you've already run scripts/get-sheets.py (or you've downloaded the same data with the same filenames some other way).

Usage:
    python stats.py --help
    python stats.py --season 18 # the season number is the current season
"""

import argparse
import json
import math
from pathlib import Path
import shutil
import traceback
from typing import List

from models import *

# TODO keep an old json around per season. lets us show last season's stats at the beginning of next season
# TODO consistency between "so" and "k"

LEAGUES = ["XBL", "AAA", "AA"]


class StatsAggNamespace(argparse.Namespace):
    season: int
    g_sheets_dir: Path
    save_dir: Path
    query: List[str]


def arg_parser():
    parser = argparse.ArgumentParser(
        description="Aggregate high-level XBL stats per-season and for careers"
    )
    parser.add_argument("-s", "--season", type=int, help="Current season")
    parser.add_argument(
        "--g-sheets-dir",
        "-g",
        type=Path,
        default=Path("public/json/raw"),
        help="Path to where JSON from Google Sheets is stored",
    )
    parser.add_argument(
        "--save-dir",
        "-S",
        type=Path,
        default=Path("public/json"),
        help="Path to where parsed JSON should be stored",
    )
    parser.add_argument(
        "--query",
        "-Q",
        nargs="+",
        type=List[str],
        default=[],
        help="Perform a query on the resulting data. Enter a list of keys to look up. The first key must be either 'career' or 'season'",
    )

    return parser


def three_digits(x: int | float | None) -> int | float:
    if x is None:
        return None
    return round(x, 3)


def maybe(row: List[str], col: int, type: callable):
    """Do our best to get the stat. But it might be missing, in which case return None"""
    ret = None
    try:
        ret = type(row[col])
    except IndexError as e:
        # print(f"Failed to get col {col} from {row}")
        pass
    return ret


def collect_team_records(
    league: str,
    standings_data: List[List[str]],
):
    """cleaned up team wins and losses for the regular season"""
    team_records: dict[str, SeasonTeamRecord] = {}

    # return a different row for AA
    get_row: int = lambda r: r + 2 if league == "AA" else r

    for row in standings_data[1:]:
        team = row[1]
        team_records[team] = {
            "team": team,
            "rank": int(row[0]),
            "ego_starting": int(row[2]) if league == "AA" else None,
            "ego_current": int(row[3]) if league == "AA" else None,
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

    team_count = len(team_records)
    games_per_team = 2 * (team_count - 1)

    for team in team_records.keys():
        # I think Ws and Ls in the spreadsheet don't account for teams who drop?
        team_records[team]["remaining"] = max(
            games_per_team
            - (team_records[team]["wins"] + team_records[team]["losses"]),
            0,
        )

    return team_records


def collect_game_results(playoffs: bool, box_score_data: List[List[str]]):
    """convert the Box%20Score and Playoffs spreadsheet tabs into structured data"""
    if playoffs:
        game_results: List[PlayoffsGameResults] = []
    else:
        game_results: List[SeasonGameResults] = []

    # regular season has errors but playoffs do not
    get_col = lambda c: c if playoffs else c + 2

    for game in box_score_data[1:]:
        away_team = game[1]
        home_team = game[4]
        away_score = int(game[2])
        home_score = int(game[3])
        innings = float(game[get_col(5)])
        results = {
            "away_team": away_team,
            "home_team": home_team,
            "away_score": away_score,
            "home_score": home_score,
            "innings": innings,
            "winner": away_team if away_score > home_score else home_team,
            "run_rule": innings <= 8.0,
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
                "away_ab": maybe(game, get_col(6), int),
                "away_r": maybe(game, get_col(7), int),
                "away_hits": maybe(game, get_col(8), int),
                "away_hr": maybe(game, get_col(9), int),
                "away_rbi": maybe(game, get_col(10), int),
                "away_bb": maybe(game, get_col(11), int),
                "away_so": maybe(game, get_col(12), int),
                "home_ab": maybe(game, get_col(13), int),
                "home_r": maybe(game, get_col(14), int),
                "home_hits": maybe(game, get_col(15), int),
                "home_hr": maybe(game, get_col(16), int),
                "home_rbi": maybe(game, get_col(17), int),
                "home_bb": maybe(game, get_col(18), int),
                "home_so": maybe(game, get_col(19), int),
            }

            results |= extra_stats

        except ValueError as e:
            # some column is wrong in the extra stats. don't collect them
            pass

        game_results.append(results)

    return game_results


def calc_stats_from_all_games(
    raw_stats: RawStats, league_era: float, team="", player=""
) -> TeamStats:
    """given everything a player/team did across all games, calculate stat lines"""
    per_9_hitting = lambda key: three_digits(
        (raw_stats[key] / raw_stats["innings_hitting"]) * 9
        if raw_stats["innings_hitting"] > 0
        else None
    )
    per_9_pitching = lambda key: three_digits(
        (raw_stats[key] / raw_stats["innings_pitching"]) * 9
        if raw_stats["innings_pitching"] > 0
        else None
    )

    stats: TeamStats = {
        "team": team,
        "player": player,
        # hitting
        "rs": raw_stats["r"],
        "rs9": per_9_hitting("r"),
        "ba": (
            three_digits(raw_stats["h"] / raw_stats["ab"])
            if raw_stats["ab"] > 0
            else None
        ),
        "ab": raw_stats["ab"],
        "ab9": per_9_hitting("ab"),
        "h": raw_stats["h"],
        "h9": per_9_hitting("h"),
        "hr": raw_stats["hr"],
        "hr9": per_9_hitting("hr"),
        "abhr": (
            three_digits(raw_stats["ab"] / raw_stats["hr"])
            if raw_stats["hr"] > 0
            else None
        ),
        "so": raw_stats["so"],
        "so9": per_9_hitting("so"),
        "bb": raw_stats["bb"],
        "bb9": per_9_hitting("bb"),
        "obp": three_digits(
            (raw_stats["h"] + raw_stats["bb"]) / (raw_stats["ab"] + raw_stats["bb"])
            if raw_stats["ab"] + raw_stats["bb"] > 0
            else None
        ),
        "rc": (
            three_digits(raw_stats["h"] / raw_stats["r"])
            if raw_stats["r"] > 0
            else None
        ),
        "babip": three_digits(
            (raw_stats["h"] - raw_stats["hr"])
            / (raw_stats["ab"] - raw_stats["so"] - raw_stats["hr"])
            if (raw_stats["ab"] - raw_stats["so"] - raw_stats["hr"]) > 0
            else None
        ),
        # pitching
        "ra": raw_stats["oppr"],
        "ra9": per_9_pitching("oppr"),
        "oppba": (
            three_digits(raw_stats["opph"] / raw_stats["oppab"])
            if raw_stats["oppab"] > 0
            else None
        ),
        "oppab9": per_9_pitching("oppab"),
        "opph": raw_stats["opph"],
        "opph9": per_9_pitching("opph"),
        "opphr": raw_stats["opphr"],
        "opphr9": per_9_pitching("opphr"),
        "oppabhr": (
            three_digits(raw_stats["ab"] / raw_stats["hr"])
            if raw_stats["hr"] > 0
            else None
        ),
        "oppk": raw_stats["oppso"],
        "oppk9": per_9_pitching("oppso"),
        "oppbb": raw_stats["oppbb"],
        "oppbb9": per_9_pitching("oppbb"),
        "whip": three_digits(
            (raw_stats["opph"] + raw_stats["oppbb"]) / raw_stats["innings_pitching"]
            if raw_stats["innings_pitching"] > 0
            else None
        ),
        "lob": three_digits(
            (raw_stats["opph"] + raw_stats["oppbb"] - raw_stats["oppr"])
            / (raw_stats["opph"] + raw_stats["oppbb"] - 1.4 * raw_stats["opphr"])
            if (raw_stats["opph"] + raw_stats["oppbb"] - 1.4 * raw_stats["opphr"]) > 0
            else None
        ),
        "e": None,
        # TODO is this right?
        "fip": three_digits(
            league_era
            - (
                (
                    raw_stats["opphr"] * 13
                    + 3 * raw_stats["oppbb"]
                    - 2 * raw_stats["oppso"]
                )
                / raw_stats["innings_pitching"]
            )
            if raw_stats["innings_pitching"] > 0
            else None
        ),
        # mixed
        "rd": raw_stats["r"] - raw_stats["oppr"],
        # TODO is this right?
        "rd9": (
            three_digits(per_9_hitting("r") - per_9_pitching("oppr"))
            if per_9_hitting("r") is not None and per_9_pitching("oppr") is not None
            else None
        ),
        "innings_played": (raw_stats["innings_hitting"] + raw_stats["innings_pitching"])
        / 2,
        "innings_game": three_digits(
            ((raw_stats["innings_hitting"] + raw_stats["innings_pitching"]) / 2)
            / raw_stats["games_played"]
            if raw_stats["games_played"] > 0
            else None
        ),
        "wins": raw_stats["wins"],
        "losses": raw_stats["losses"],
        "wins_by_run_rule": raw_stats["wins_by_run_rule"],
        "losses_by_run_rule": raw_stats["losses_by_run_rule"],
    }

    if "seasons_played" in raw_stats:
        stats["num_seasons"] = len(raw_stats["seasons_played"])

    return stats


def calc_team_team_stats(game_results: List[GameResults]):
    """do math to get stats about team performances over the games passed in to this function. we get a few stats that aren't in the spreadsheets"""

    stats_by_team: dict[str, TeamStats] = {}

    blank_team_stats_by_game: RawStats = {
        "innings_pitching": 0,
        "innings_hitting": 0,
        "wins": 0,
        "losses": 0,
        "wins_by_run_rule": 0,
        "losses_by_run_rule": 0,
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
        "opphr": 0,
        "opprbi": 0,
        "oppbb": 0,
        "oppso": 0,
        "games_played": 0,
    }

    raw_stats_by_team: dict[str, dict[str, int | float]] = {}

    league_runs = 0
    league_innings_hitting = 0

    # collect stats by team by looking at each game
    for game in game_results:
        away = game["away_team"]
        home = game["home_team"]
        if away not in raw_stats_by_team:
            raw_stats_by_team[away] = blank_team_stats_by_game.copy()
        if home not in raw_stats_by_team:
            raw_stats_by_team[home] = blank_team_stats_by_game.copy()

        if game["winner"] == away:
            raw_stats_by_team[away]["wins"] += 1
            raw_stats_by_team[home]["losses"] += 1
        else:
            raw_stats_by_team[away]["losses"] += 1
            raw_stats_by_team[home]["wins"] += 1

        if game["winner"] == away and game["run_rule"]:
            raw_stats_by_team[away]["wins_by_run_rule"] += 1
            raw_stats_by_team[home]["losses_by_run_rule"] += 1
        if game["winner"] == home and game["run_rule"]:
            raw_stats_by_team[home]["wins_by_run_rule"] += 1
            raw_stats_by_team[away]["losses_by_run_rule"] += 1

        if "away_ab" not in game or game["away_ab"] is None:
            # we're missing stats. don't count this game
            continue

        away_stats = raw_stats_by_team[away].copy()
        home_stats = raw_stats_by_team[home].copy()

        away_stats["innings_hitting"] += math.ceil(game["innings"])
        away_stats["innings_pitching"] += math.floor(game["innings"])
        home_stats["innings_hitting"] += math.floor(game["innings"])
        home_stats["innings_pitching"] += math.ceil(game["innings"])

        league_runs += game["away_r"]
        league_runs += game["home_r"]
        league_innings_hitting += away_stats["innings_hitting"]
        league_innings_hitting += home_stats["innings_hitting"]

        # capture away team stats
        away_stats["games_played"] += 1
        away_stats["ab"] += game["away_ab"]
        away_stats["r"] += game["away_r"]
        away_stats["h"] += game["away_hits"]
        away_stats["hr"] += game["away_hr"]
        away_stats["rbi"] += game["away_rbi"]
        away_stats["bb"] += game["away_bb"]
        away_stats["so"] += game["away_so"]
        away_stats["oppab"] += game["home_ab"]
        away_stats["oppr"] += game["home_r"]
        away_stats["opph"] += game["home_hits"]
        away_stats["opphr"] += game["home_hr"]
        away_stats["opprbi"] += game["home_rbi"]
        away_stats["oppbb"] += game["home_bb"]
        away_stats["oppso"] += game["home_so"]

        # capture home team stats
        home_stats["games_played"] += 1
        home_stats["ab"] += game["home_ab"]
        home_stats["r"] += game["home_r"]
        home_stats["h"] += game["home_hits"]
        home_stats["hr"] += game["home_hr"]
        home_stats["rbi"] += game["home_rbi"]
        home_stats["bb"] += game["home_bb"]
        home_stats["so"] += game["home_so"]
        home_stats["oppab"] += game["away_ab"]
        home_stats["oppr"] += game["away_r"]
        home_stats["opph"] += game["away_hits"]
        home_stats["opphr"] += game["away_hr"]
        home_stats["opprbi"] += game["away_rbi"]
        home_stats["oppbb"] += game["away_bb"]
        home_stats["oppso"] += game["away_so"]

        raw_stats_by_team[away] = away_stats
        raw_stats_by_team[home] = home_stats

    league_era = three_digits(9 * league_runs / league_innings_hitting)

    # do math to get aggregate stats
    for team in raw_stats_by_team.keys():
        raw_stats = raw_stats_by_team[team]
        stats_by_team[team] = calc_stats_from_all_games(
            raw_stats, league_era, team=team
        )

    return stats_by_team


def collect_playoffs_team_records(results: List[PlayoffsGameResults]):
    """figure out how each round of the playoffs is going for each team"""
    records_by_team: dict[str, PlayoffsTeamRecord] = {}

    default_round = {"wins": 0, "losses": 0, "remaining": 0}

    for game in results:
        away_team = game["away_team"]
        home_team = game["home_team"]
        this_round = game["round"]

        if home_team not in records_by_team:
            records_by_team[home_team] = {"team": home_team, "rounds": {}}

        if away_team not in records_by_team:
            records_by_team[away_team] = {"team": away_team, "rounds": {}}

        if this_round not in records_by_team[home_team]["rounds"]:
            records_by_team[home_team]["rounds"][this_round] = default_round | {
                "round": this_round,
                "team": home_team,
                "opponent": away_team,
            }

        if this_round not in records_by_team[away_team]["rounds"]:
            records_by_team[away_team]["rounds"][this_round] = default_round | {
                "round": this_round,
                "team": away_team,
                "opponent": home_team,
            }

        home_round_record = records_by_team[home_team]["rounds"][this_round].copy()
        away_round_record = records_by_team[away_team]["rounds"][this_round].copy()

        winner = away_team if game["away_score"] > game["home_score"] else home_team

        if winner == away_team:
            away_round_record["wins"] += 1
            home_round_record["losses"] += 1
        else:
            home_round_record["wins"] += 1
            away_round_record["losses"] += 1

        # TODO it'd be nice to have access to something that tells us how many games are in the series

        records_by_team[away_team]["rounds"][this_round] = away_round_record
        records_by_team[home_team]["rounds"][this_round] = home_round_record

    return records_by_team


def build_season_stats(league: str, g_sheets_dir: Path, season: int) -> SeasonStats:
    """parse JSONs from g sheets and collect season stats"""

    print(f"Running season {season} {league}...")
    data: SeasonStats = {
        "current_season": season,
        "season_team_records": {},
        "season_team_stats": {},
        "season_game_results": [],
        "playoffs_team_records": {},
        "playoffs_team_stats": {},
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

    season_team_records = collect_team_records(league, standings_data)
    data["season_team_records"] = season_team_records

    season_scores_data = None
    with open(g_sheets_dir.joinpath(f"{league}__Box%20Scores.json")) as f:
        raw_data = json.loads(f.read())
        season_scores_data = raw_data["values"]

    season_game_results = collect_game_results(False, season_scores_data)
    data["season_game_results"] = season_game_results
    data["season_team_stats"] = calc_team_team_stats(season_game_results)

    playoffs_scores_data = None
    with open(g_sheets_dir.joinpath(f"{league}__Playoffs.json")) as f:
        raw_data = json.loads(f.read())
        playoffs_scores_data = raw_data["values"]

    playoffs_game_results = collect_game_results(True, playoffs_scores_data)
    data["playoffs_game_results"] = playoffs_game_results
    data["playoffs_team_records"] = collect_playoffs_team_records(playoffs_game_results)

    # no spreadsheet has these. we have to run the numbers ourselves
    data["playoffs_team_stats"] = calc_team_team_stats(playoffs_game_results)

    return data


def collect_players(
    xbl_abbrev_data: List[List[str]],
    aaa_abbrev_data: List[List[str]],
    aa_abbrev_data: List[List[str]],
) -> dict[str, Player]:
    """Find everyone who ever played in any league and when they played"""
    players: dict[str, Player] = {}

    for row in xbl_abbrev_data[1:]:
        season = int(row[0])
        team_name = row[1]
        team_abbrev = row[2]
        player = row[3]

        if player not in players:
            players[player] = {"player": player, "teams": []}

        players[player]["teams"].append(
            {
                "team_name": team_name,
                "team_abbrev": team_abbrev,
                "league": "XBL",
                "season": season,
            }
        )

    for row in aaa_abbrev_data[1:]:
        season = int(row[0])
        team_name = row[1]
        team_abbrev = row[2]
        player = row[3]

        if player not in players:
            players[player] = {"player": player, "teams": []}

        players[player]["teams"].append(
            {
                "team_name": team_name,
                "team_abbrev": team_abbrev,
                "league": "AAA",
                "season": season,
            }
        )

    for row in aa_abbrev_data[1:]:
        season = int(row[0])
        team_name = row[1]
        team_abbrev = row[2]
        player = row[3]

        if player not in players:
            players[player] = {"player": player, "teams": []}

        players[player]["teams"].append(
            {
                "team_name": team_name,
                "team_abbrev": team_abbrev,
                "league": "AA",
                "season": season,
            }
        )

    # TODO we could sort each player's teams by season

    return players


def get_active_players(players: dict[str, Player], season: int):
    """get the players (usernames) who are playing this season. assumes a player is only in 1 league per season"""

    active_players: dict[str, List[str]] = {"XBL": [], "AAA": [], "AA": []}

    for player_name in players:
        for team in players[player_name]["teams"]:
            if team["season"] == season:
                active_players[team["league"]].append(player_name)
                break

    return active_players


def collect_career_performances_and_head_to_head(
    playoffs: bool,
    active_players_by_league: dict[str, List[str]],
    xbl_head_to_head_data: List[List[str]],
    aaa_head_to_head_data: List[List[str]],
    aa_head_to_head_data: List[List[str]],
) -> List[HeadToHead]:
    season_performances: dict[str, CareerSeasonPerformance] = {}
    season_head_to_head: dict[str, dict[str, HeadToHead]] = {}

    all_game_results = []

    all_active_players = [
        player
        for league in active_players_by_league
        for player in active_players_by_league[league]
    ]

    # TODO probably need to run these by season too

    for game in [
        *xbl_head_to_head_data[1:],
        *aaa_head_to_head_data[1:],
        *aa_head_to_head_data[1:],
    ]:
        away_player = game[2]
        home_player = game[7]

        if (
            away_player not in all_active_players
            and home_player not in all_active_players
        ):
            # don't care about games between two inactive players
            continue

        season = game[0]
        week_or_round = game[1]
        away_score = int(game[4])
        home_score = int(game[5])
        innings = maybe(game, 10, float)
        results = {
            "season": season,
            "away_player": away_player,
            "home_player": home_player,
            "away_score": away_score,
            "home_score": home_score,
            "innings": innings,
            "winner": away_player if away_score > home_score else home_player,
            "run_rule": True if innings is not None and innings <= 8.0 else False,
        }
        if playoffs:
            results["round"] = week_or_round
        else:
            results["week"] = int(week_or_round)

        try:
            extra_stats = {
                "away_e": None if playoffs else maybe(game, 8, int),
                "home_e": None if playoffs else maybe(game, 9, int),
                # not all of these are always recorded. missing records are probably from disconnects
                "away_ab": maybe(game, 11, int),
                "away_r": maybe(game, 12, int),
                "away_hits": maybe(game, 13, int),
                "away_hr": maybe(game, 14, int),
                "away_rbi": maybe(game, 15, int),
                "away_bb": maybe(game, 16, int),
                "away_so": maybe(game, 17, int),
                "home_ab": maybe(game, 18, int),
                "home_r": maybe(game, 19, int),
                "home_hits": maybe(game, 20, int),
                "home_hr": maybe(game, 21, int),
                "home_rbi": maybe(game, 22, int),
                "home_bb": maybe(game, 23, int),
                "home_so": maybe(game, 24, int),
            }

            results |= extra_stats

        except ValueError as e:
            # some column is wrong in the extra stats. don't collect them
            print(e)
            pass

        all_game_results.append(results)

    blank_team_stats_by_game: TeamStats = {
        "innings_pitching": 0,
        "innings_hitting": 0,
        "wins": 0,
        "losses": 0,
        "wins_by_run_rule": 0,
        "losses_by_run_rule": 0,
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
        "opphr": 0,
        "opprbi": 0,
        "oppbb": 0,
        "oppso": 0,
        "games_played": 0,
        # not in TeamStats. only used temporarily
        "seasons_played": set(),
    }

    league_runs = 0
    league_innings_hitting = 0

    raw_stats_by_player: dict[str, RawStats] = {}

    # keyed on player names in alphabetical order
    head_to_head_by_players = {}

    # add games to all-time stats and head-to-head stats in the same loop
    for game in all_game_results:
        away_player = game["away_player"]
        home_player = game["home_player"]

        away_is_active = away_player in all_active_players
        home_is_active = home_player in all_active_players
        h2h = away_is_active and home_is_active

        if away_is_active and away_player not in raw_stats_by_player:
            raw_stats_by_player[away_player] = blank_team_stats_by_game.copy()
        if home_is_active and home_player not in raw_stats_by_player:
            raw_stats_by_player[home_player] = blank_team_stats_by_game.copy()

        # alphabetical tuple of player names
        h2h_key = tuple(sorted((home_player, away_player)))
        (player_a, player_z) = h2h_key

        # use this to figure out how players in raw_stats and h2h_stats translate
        player_a_is_away = player_a == away_player

        # where we'll store h2h stats
        if h2h:
            if player_a not in head_to_head_by_players:
                head_to_head_by_players[player_a] = {}
            if player_z not in head_to_head_by_players[player_a]:
                head_to_head_by_players[player_a][player_z] = {
                    "player_a": player_a,
                    "player_z": player_z,
                    "player_a_raw_stats": blank_team_stats_by_game.copy(),
                    "player_z_raw_stats": blank_team_stats_by_game.copy(),
                }

        def add_to_player_h2h(away: bool, key: str, value: int):
            """if we need h2h for this matchup, translate home and away into player_a and player_z and record the stat"""
            if not h2h:
                return
            if (away and player_a_is_away) or (not away and not player_a_is_away):
                head_to_head_by_players[player_a][player_z]["player_a_raw_stats"][
                    key
                ] += value
            else:
                head_to_head_by_players[player_a][player_z]["player_z_raw_stats"][
                    key
                ] += value

        def add_to_away(key: str, value: int):
            """record an away team stat if the away player is currently playing"""
            if not away_is_active:
                # also means we don't care about h2h, so it's safe to bail
                return
            raw_stats_by_player[away_player][key] += value
            add_to_player_h2h(True, key, value)

        def add_to_home(key: str, value: int):
            """record a home team stat if the home player is currently playing"""
            if not home_is_active:
                # also means we don't care about h2h, so it's safe to bail
                return
            raw_stats_by_player[home_player][key] += value
            add_to_player_h2h(False, key, value)

        if game["winner"] == away_player:
            add_to_away("wins", 1)
            add_to_home("losses", 1)
        else:
            add_to_home("wins", 1)
            add_to_away("losses", 1)

        if game["run_rule"]:
            if game["winner"] == away_player:
                add_to_away("wins_by_run_rule", 1)
                add_to_home("losses_by_run_rule", 1)
            if game["winner"] == home_player:
                add_to_home("wins_by_run_rule", 1)
                add_to_away("losses_by_run_rule", 1)

        # record which seasons were played
        if home_is_active:
            raw_stats_by_player[home_player]["seasons_played"].add(game["season"])
        if away_is_active:
            raw_stats_by_player[away_player]["seasons_played"].add(game["season"])
        if h2h:
            head_to_head_by_players[player_a][player_z]["player_a_raw_stats"][
                "seasons_played"
            ].add(game["season"])
            head_to_head_by_players[player_a][player_z]["player_z_raw_stats"][
                "seasons_played"
            ].add(game["season"])

        if "away_ab" not in game or game["away_ab"] is None:
            # we're missing stats. don't count this game
            continue

        if game["innings"] is not None:
            add_to_away("innings_hitting", math.ceil(game["innings"]))
            add_to_away("innings_pitching", math.floor(game["innings"]))
            add_to_home("innings_hitting", math.floor(game["innings"]))
            add_to_home("innings_pitching", math.ceil(game["innings"]))

            # use these to calculate the league ERA
            # because we aren't using the helper methods to record them, we'll get all-time runs and hitting across EVERY XBL game from all leagues EVER
            league_runs += game["away_r"]
            league_runs += game["home_r"]
            league_innings_hitting += math.ceil(game["innings"])
            league_innings_hitting += math.floor(game["innings"])

        # capture away team stats
        add_to_away("games_played", 1)
        add_to_away("ab", game["away_ab"])
        add_to_away("r", game["away_r"])
        add_to_away("h", game["away_hits"])
        add_to_away("hr", game["away_hr"])
        add_to_away("rbi", game["away_rbi"])
        add_to_away("bb", game["away_bb"])
        add_to_away("so", game["away_so"])
        add_to_away("oppab", game["home_ab"])
        add_to_away("oppr", game["home_r"])
        add_to_away("opph", game["home_hits"])
        add_to_away("opphr", game["home_hr"])
        add_to_away("opprbi", game["home_rbi"])
        add_to_away("oppbb", game["home_bb"])
        add_to_away("oppso", game["home_so"])

        # capture home team stats
        add_to_home("games_played", 1)
        add_to_home("ab", game["home_ab"])
        add_to_home("r", game["home_r"])
        add_to_home("h", game["home_hits"])
        add_to_home("hr", game["home_hr"])
        add_to_home("rbi", game["home_rbi"])
        add_to_home("bb", game["home_bb"])
        add_to_home("so", game["home_so"])
        add_to_home("oppab", game["away_ab"])
        add_to_home("oppr", game["away_r"])
        add_to_home("opph", game["away_hits"])
        add_to_home("opphr", game["away_hr"])
        add_to_home("opprbi", game["away_rbi"])
        add_to_home("oppbb", game["away_bb"])
        add_to_home("oppso", game["away_so"])

    league_era = three_digits(9 * league_runs / league_innings_hitting)

    # do math to get career performance stats
    for player in raw_stats_by_player.keys():
        season_performances[player] = calc_stats_from_all_games(
            raw_stats_by_player[player], league_era, player=player
        )

    # do math to get head to head stats
    for player_a in head_to_head_by_players.keys():
        for player_z in head_to_head_by_players[player_a]:
            if player_a not in season_head_to_head:
                season_head_to_head[player_a] = {}

            raw_stats_a = head_to_head_by_players[player_a][player_z][
                "player_a_raw_stats"
            ]
            raw_stats_z = head_to_head_by_players[player_a][player_z][
                "player_z_raw_stats"
            ]

            try:
                season_head_to_head[player_a][player_z] = {
                    "player_a": player_a,
                    "player_z": player_z,
                    "player_a_stats": calc_stats_from_all_games(
                        raw_stats_a,
                        league_era,
                        player=player_a,
                    ),
                    "player_z_stats": calc_stats_from_all_games(
                        raw_stats_z,
                        league_era,
                        player=player_z,
                    ),
                }
            except Exception as e:
                print(player_a, player_z)
                print(e)
                traceback.print_exc()

    return season_performances, season_head_to_head


def build_career_stats(g_sheets_dir: Path, season: int):
    print(f"Running career stats...")
    data: CareerStats = {
        "players": {},
        "season_performances": {},
        "season_head_to_head": [],
        "playoffs_performances": {},
        "playoffs_head_to_head": [],
    }

    xbl_abbrev_data = None
    with open(
        g_sheets_dir.joinpath("CAREER_STATS__XBL%20Team%20Abbreviations.json")
    ) as f:
        raw_data = json.loads(f.read())
        xbl_abbrev_data = raw_data["values"]

    aaa_abbrev_data = None
    with open(
        g_sheets_dir.joinpath("CAREER_STATS__AAA%20Team%20Abbreviations.json")
    ) as f:
        raw_data = json.loads(f.read())
        aaa_abbrev_data = raw_data["values"]

    aa_abbrev_data = None
    with open(
        g_sheets_dir.joinpath(f"CAREER_STATS__AA%20Team%20Abbreviations.json")
    ) as f:
        raw_data = json.loads(f.read())
        aa_abbrev_data = raw_data["values"]

    print("Finding who played which season...")
    players = collect_players(xbl_abbrev_data, aaa_abbrev_data, aa_abbrev_data)
    data["players"] = players

    # TODO maybe we run through all results and do our stat calculations too?

    # career_stats_data = None
    # with open(
    #     g_sheets_dir.joinpath(f"CAREER_STATS__{league}%20Career%20Stats.json")
    # ) as f:
    #     raw_data = json.loads(f.read())
    #     career_stats_data = raw_data["values"]

    xbl_head_to_head_data = None
    with open(g_sheets_dir.joinpath("CAREER_STATS__XBL%20Head%20to%20Head.json")) as f:
        raw_data = json.loads(f.read())
        xbl_head_to_head_data = raw_data["values"]

    aaa_head_to_head_data = None
    with open(g_sheets_dir.joinpath("CAREER_STATS__AAA%20Head%20to%20Head.json")) as f:
        raw_data = json.loads(f.read())
        aaa_head_to_head_data = raw_data["values"]

    aa_head_to_head_data = None
    with open(g_sheets_dir.joinpath("CAREER_STATS__AA%20Head%20to%20Head.json")) as f:
        raw_data = json.loads(f.read())
        aa_head_to_head_data = raw_data["values"]

    active_players_by_league = get_active_players(players, season)

    season_peformances, season_head_to_head = (
        collect_career_performances_and_head_to_head(
            False,
            active_players_by_league,
            xbl_head_to_head_data,
            aaa_head_to_head_data,
            aa_head_to_head_data,
        )
    )

    data["season_performances"] = season_peformances
    data["season_head_to_head"] = season_head_to_head

    return data


def main(args: StatsAggNamespace):
    if not args.g_sheets_dir.exists():
        raise Exception(
            "Missing data from Google Sheets. Plesae double check `--g-sheets-dir' or run `scripts/get-sheets.py' first"
        )

    season_data = {
        league: build_season_stats(league, args.g_sheets_dir, args.season)
        for league in LEAGUES
    }

    for league in LEAGUES:
        season_json = args.save_dir.joinpath(f"{league}__s{args.season}.json")
        with open(season_json, "w") as f:
            f.write(json.dumps(season_data[league]))

        shutil.copy(season_json, args.save_dir.joinpath(f"{league}.json"))

    career_data = build_career_stats(args.g_sheets_dir, args.season)

    with open(args.save_dir.joinpath("careers.json"), "w") as f:
        f.write(json.dumps(career_data))

    if len(args.query) > 0:
        try:
            current = None
            if args.query[0] == "season":
                current = season_data
            elif args.query[0] == "career":
                current = career_data
            else:
                return f"`--query' must begin with either 'season' or 'career'"

            for part in args.query[1:]:
                current = current.get(part, {})
            return current
        except (KeyError, TypeError, IndexError) as e:
            return f"--query `{', '.join(args.query)}' cannot be found."

    return None


if __name__ == "__main__":
    parser = arg_parser()
    args: StatsAggNamespace = parser.parse_args()
    err = main(args)
    if err is not None:
        parser.error(err)
