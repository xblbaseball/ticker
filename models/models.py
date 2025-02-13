from typing_extensions import TypedDict

import pydantic

from typing import List


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
    """who a team played in a round"""

    round: str
    opponent: str


class PlayoffsTeamRecord(TypedDict):
    """how a team did in each round of the playoffs"""

    team: str
    rounds: dict[str, PlayoffsRound]


class TeamStats(TypedDict):
    """Performance stats for a team for a given season/playoffs"""

    team: str
    player: str

    # hitting
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


class GameResults(TypedDict):
    """what happened in a single game"""

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
    """what happened in a regular season game"""

    week: int


class PlayoffsGameResults(GameResults):
    """what happened in a playoff game"""

    round: str


class RawStats(TypedDict):
    """Used to aggregate stats across games"""

    innings_pitching: int
    innings_hitting: int
    wins_by_run_rule: int
    losses_by_run_rule: int
    ab: int
    r: int
    h: int
    hr: int
    rbi: int
    bb: int
    so: int
    oppab: int
    oppr: int
    opph: int
    opphr: int
    opprbi: int
    oppbb: int
    oppso: int
    games_played: int


class SeasonStats(TypedDict):
    """every high-level stat you could want to know about a season"""

    current_season: int
    season_team_records: dict[str, SeasonTeamRecord]
    season_team_stats: dict[str, TeamStats]
    season_game_results: List[SeasonGameResults]
    playoffs_team_records: dict[str, PlayoffsTeamRecord]
    playoffs_team_stats: dict[str, TeamStats]
    playoffs_game_results: List[PlayoffsGameResults]


class TeamSeason(TypedDict):
    """pairing between a person and a season in XBL"""

    team_name: str
    team_abbrev: str
    league: str
    season: int


class Player(TypedDict):
    """someone who played in XBL"""

    player: str
    teams: List[TeamSeason]


class CareerPlayoffsStats(TeamStats):
    appearances: int
    wins: int
    losses: int
    series_wins: int
    series_losses: int
    championship_seasons: List[int]
    second_place_seasons: List[int]


class CareerSeasonStats(TeamStats):
    wins: int
    losses: int
    sweeps_w: int
    sweeps_l: int
    splits: int


class CareerSeasonPerformance(TypedDict):
    player: str
    by_league: dict[str, CareerSeasonStats]
    all_time: CareerSeasonStats


class CareerPlayoffsPerformance(TypedDict):
    player: str
    by_league: dict[str, CareerPlayoffsStats]
    all_time: CareerPlayoffsStats


class HeadToHead(TypedDict):
    """player_a and player_z must be in alphabetical order"""

    player_a: str
    player_z: str
    player_a_stats: TeamStats
    player_z_stats: TeamStats


class CareerStats(TypedDict):
    players: dict[str, Player]
    season_performances: dict[str, CareerSeasonPerformance]
    """look ups should look like: [player_a][player_z] = head_to_head"""
    season_head_to_head: dict[str, dict[str, HeadToHead]]
    playoffs_performances: dict[str, CareerPlayoffsPerformance]
    playoffs_head_to_head: List[HeadToHead]


def get_schemas():
    season_stats_adapter = pydantic.TypeAdapter(SeasonStats)
    career_stats_adapter = pydantic.TypeAdapter(CareerStats)

    print(season_stats_adapter.json_schema())
    print(career_stats_adapter.json_schema())


def main(args):
    get_schemas()


if __name__ == "__main__":
    main(None)
