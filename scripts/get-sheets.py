from dotenv import load_dotenv
import os
from pathlib import Path
import urllib.request

load_dotenv()

LEAGUES = {
    "XBL": "1x5vwIVqk3-vEypu6dQb9Vb3kzVl9i2tA_zTcDK4I9LU",
    "AAA": "1Dq7fLYeqsvAbwljnzcyhNQ4s2bDeaZky1pQeSJQdAps",
    "AA": "14HmPir8MqsTyQE4BF3nxZVjsJL1MFACto4RDpH9eKqQ",
}

ALL_TIME_STATS = {
    "CAREER_STATS": "1wkLJTKO6Tk49if6L4iXJywWezOmseJjKKkCRvAKs7bg",
    "PLAYOFF_STATS": "1HWs44qhq9Buit3FIMfyh9j9G26hpnD7Eptv80FOntzg",
}


def collect_league_stats(json_dir: Path, g_sheets_api_key: str):
    tabs = ["Standings", "Hitting", "Pitching", "Playoffs", "Box%20Scores"]

    for league in LEAGUES:
        for tab in tabs:
            url = f"https://sheets.googleapis.com/v4/spreadsheets/{LEAGUES[league]}/values/{tab}?key={g_sheets_api_key}"

            with urllib.request.urlopen(url) as req, open(
                json_dir.joinpath(f"{league}__{tab}.json"), "wb"
            ) as f:
                f.write(req.read())

            print(f"saved {league} {tab}")


def collect_all_time_stats(json_dir: Path, g_sheets_api_key: str):
    common_tab_suffixes = [
        ["Head", "to", "Head"],
        ["Standings", "Stats"],
        ["Hitting", "Stats"],
        ["Pitching", "Stats"],
        ["Career", "Stats"],
    ]

    tabs = [
        "%20".join([league] + tab)
        for tab in common_tab_suffixes
        for league in ["XBL", "AAA", "AA"]
    ]

    for sheet in ALL_TIME_STATS:
        for tab in tabs:
            url = f"https://sheets.googleapis.com/v4/spreadsheets/{ALL_TIME_STATS[sheet]}/values/{tab}?key={g_sheets_api_key}"

            data = {}
            with urllib.request.urlopen(url) as req, open(
                json_dir.joinpath(f"{sheet}__{tab}.json"), "wb"
            ) as f:
                f.write(req.read())

            print(f"saved {sheet} {tab}")


def main():
    g_sheets_api_key = os.getenv("G_SHEETS_API_KEY", None)
    if g_sheets_api_key is None or g_sheets_api_key == "":
        raise Exception("Missing Google Drive API key")

    # make sure the json dir exists
    json_dir = Path("public/json/raw")
    json_dir.mkdir(parents=True, exist_ok=True)

    collect_league_stats(json_dir, g_sheets_api_key)
    collect_all_time_stats(json_dir, g_sheets_api_key)


if __name__ == "__main__":
    main()
