import argparse
import json
import math
from pathlib import Path
import shutil
from typing import List, TypedDict

# TODO keep an old json around per season. lets us show last season's stats at the beginning of next season
# TODO consistency between "so" and "k"

"""
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


def maybe(row: List[str], col: int, type: callable):
    """Do our best to get the stat. But it might be missing, in which case return None"""
    ret = None
    try:
        ret = type(row[col])
    except IndexError as e:
        # print(f"Failed to get col {col} from {row}")
        pass
    return ret


class TeamRecord(TypedDict):
    """Generic performance of a team in wins and losses"""

    team: str
    wins: int
    losses: int
    remaining: int


class SeasonTeamRecord(TeamRecord):
    """How a team stacks up in a given season"""

    rank: int
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


class PlayoffsRound(TeamRecord):
    round: str
    opponent: str


class PlayoffsTeamRecord(TypedDict):
    team: str
    rounds: dict[str, PlayoffsRound]


class TeamStats(TypedDict):
    """Performance stats for a team for a given season/playoffs"""

    team: str

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
    wins_by_run_rule: int
    losses_by_run_rule: int


def collect_team_records(
    league: str,
    standings_data: List[List[str]],
):
    team_records: dict[str, SeasonTeamRecord] = []

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


class GameResults(TypedDict):
    home_team: str
    away_team: str
    home_score: int
    away_score: int
    run_rule: bool
    winner: str
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


def calc_team_team_stats(game_results: List[GameResults]):
    """do math to get stats about team performances. we get a few things that aren't in the spreadsheet"""

    playoffs_team_stats: dict[str, TeamStats] = {}

    blank_team_stats_by_game = {
        "innings_pitching": 0,
        "innings_hitting": 0,
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

    stats_by_team: dict[str, dict[str, int | float]] = {}

    league_runs = 0
    league_innings_hitting = 0

    # aggregate stats by team by looking at each game
    for game in game_results:
        away = game["away_team"]
        home = game["home_team"]
        if away not in stats_by_team:
            stats_by_team[away] = blank_team_stats_by_game.copy()
        if home not in stats_by_team:
            stats_by_team[home] = blank_team_stats_by_game.copy()

        if game["winner"] == away and game["run_rule"]:
            stats_by_team[away]["wins_by_run_rule"] += 1
            stats_by_team[home]["losses_by_run_rule"] += 1
        if game["winner"] == home and game["run_rule"]:
            stats_by_team[home]["wins_by_run_rule"] += 1
            stats_by_team[away]["losses_by_run_rule"] += 1

        if "away_ab" not in game or game["away_ab"] is None:
            # we're missing stats. don't count this game
            continue

        away_stats = stats_by_team[away].copy()
        home_stats = stats_by_team[home].copy()

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

        stats_by_team[away] = away_stats
        stats_by_team[home] = home_stats

    per_9_hitting = lambda key: three_digits(
        (raw_stats[key] / raw_stats["innings_hitting"]) * 9
    )
    per_9_pitching = lambda key: three_digits(
        (raw_stats[key] / raw_stats["innings_pitching"]) * 9
    )

    league_era = three_digits(9 * league_runs / league_innings_hitting)

    # do math to get aggregate playoffs stats
    for team in stats_by_team.keys():
        raw_stats = stats_by_team[team]

        league_runs += raw_stats["r"]
        league_innings_hitting += raw_stats["innings_hitting"]

        stats: TeamStats = {
            "team": team,
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
            "abhr": (
                three_digits(raw_stats["ab"] / raw_stats["hr"])
                if raw_stats["hr"] != 0
                else math.inf
            ),
            "so": raw_stats["so"],
            "so9": per_9_hitting("so"),
            "bb": raw_stats["bb"],
            "bb9": per_9_hitting("bb"),
            "obp": three_digits(
                (raw_stats["h"] + raw_stats["bb"]) / (raw_stats["ab"] + raw_stats["bb"])
            ),
            "rc": (
                three_digits(raw_stats["h"] / raw_stats["r"])
                if raw_stats["r"] != 0
                else math.inf
            ),
            "babip": three_digits(
                (raw_stats["h"] - raw_stats["hr"])
                / (raw_stats["ab"] - raw_stats["so"] - raw_stats["hr"])
            ),
            # pitching
            "ra": raw_stats["oppr"],
            "ra9": per_9_pitching("oppr"),
            "oppba": (
                three_digits(raw_stats["opph"] / raw_stats["oppab"])
                if raw_stats["oppab"] != 0
                else math.inf
            ),
            "oppab9": per_9_pitching("oppab"),
            "opph": raw_stats["opph"],
            "opph9": per_9_pitching("opph"),
            "opphr": raw_stats["opphr"],
            "opphr9": per_9_pitching("opphr"),
            "oppabhr": (
                three_digits(raw_stats["ab"] / raw_stats["hr"])
                if raw_stats["hr"] != 0
                else math.inf
            ),
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
                ((raw_stats["innings_hitting"] + raw_stats["innings_pitching"]) / 2)
                / raw_stats["games_played"]
            ),
            "wins_by_run_rule": raw_stats["wins_by_run_rule"],
            "losses_by_run_rule": raw_stats["losses_by_run_rule"],
        }

        playoffs_team_stats[team] = stats

    return playoffs_team_stats


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


class SeasonStats(TypedDict):
    current_season: int
    season_team_records: dict[str, SeasonTeamRecord]
    season_team_stats: dict[str, TeamStats]
    season_game_results: List[SeasonGameResults]
    playoffs_team_records: dict[str, PlayoffsTeamRecord]
    playoffs_team_stats: dict[str, TeamStats]
    playoffs_game_results: List[PlayoffsGameResults]


def build_season_stats(league: str, g_sheets_dir: Path, season: int) -> SeasonStats:
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

    season_team_records = collect_team_records(
        league, standings_data, hitting_data, pitching_data
    )
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


class TeamSeason(TypedDict):
    team_name: str
    team_abbrev: str
    league: str
    season: int


class Player(TypedDict):
    player: str
    teams: List[TeamSeason]


def collect_players(
    xbl_abbrev_data: List[List[str]],
    aaa_abbrev_data: List[List[str]],
    aa_abbrev_data: List[List[str]],
) -> dict[str, Player]:
    """Find everyone who ever played in the league and when they played"""
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

    return players


class CareerPerformance(TypedDict):
    player: str
    by_league: dict[str, TeamStats]
    all_time: TeamStats


class HeadToHead(TypedDict):
    """player_a and player_z must be in alphabetical order"""

    player_a: str
    player_z: str
    player_a_stats: TeamStats
    player_z_stats: TeamStats


class CareerStats(TypedDict):
    players: dict[str, Player]
    season_performances: dict[str, CareerPerformance]
    season_head_to_head: List[HeadToHead]
    playoffs_performances: dict[str, CareerPerformance]
    playoffs_head_to_head: List[HeadToHead]


def build_career_stats(active_teams: dict[str, List[str]], g_sheets_dir: Path):
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

    data["players"] = collect_players(xbl_abbrev_data, aaa_abbrev_data, aa_abbrev_data)

    career_stats_data = None
    with open(
        g_sheets_dir.joinpath(f"CAREER_STATS__{league}%20Career%20Stats.json")
    ) as f:
        raw_data = json.loads(f.read())
        career_stats_data = raw_data["values"]


def main(args: MyNamespace):
    if not args.g_sheets_dir.exists():
        raise Exception(
            "Missing data from Google Sheets. Plesae double check `--g-sheets-dir' or run `scripts/get-sheets.py' first"
        )

    season_data = {
        league: build_season_stats(league, args.g_sheets_dir, args.season)
        for league in LEAGUES
    }

    all_teams = {
        {league: season_data[league]["season_team_stats"].keys()} for league in LEAGUES
    }

    for league in LEAGUES:
        season_json = args.save_dir.joinpath(f"{league}__s{args.season}.json")
        with open(season_json, "w") as f:
            f.write(json.dumps(season_data[league]))

        shutil.copy(season_json, args.save_dir.joinpath(f"{league}.json"))

    career_data = build_career_stats(all_teams, args.g_sheets_dir)

    with open("careers.json", "w") as f:
        f.write(json.dumps(career_data))


if __name__ == "__main__":
    parser = arg_parser()
    args: MyNamespace = parser.parse_args()
    main(args)
