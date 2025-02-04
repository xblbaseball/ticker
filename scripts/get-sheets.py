from dotenv import load_dotenv
import os
from pathlib import Path
import urllib.request

load_dotenv()

G_SHEET_IDS = {
    "CAREER_STATS": "1wkLJTKO6Tk49if6L4iXJywWezOmseJjKKkCRvAKs7bg",
    "PLAYOFF_STATS": "1HWs44qhq9Buit3FIMfyh9j9G26hpnD7Eptv80FOntzg",
}

LEAGUES = {
    "XBL": "1x5vwIVqk3-vEypu6dQb9Vb3kzVl9i2tA_zTcDK4I9LU",
    "AAA": "1Dq7fLYeqsvAbwljnzcyhNQ4s2bDeaZky1pQeSJQdAps",
    "AA": "14HmPir8MqsTyQE4BF3nxZVjsJL1MFACto4RDpH9eKqQ",
}


def main():
    g_sheets_api_key = os.getenv("G_SHEETS_API_KEY", None)
    if g_sheets_api_key is None:
        raise Exception("Missing Google Drive API key")

    # make sure the json dir exists
    json_dir = Path("public/json")
    json_dir.mkdir(parents=True, exist_ok=True)

    tabs = ["Standings", "Hitting", "Pitching", "Playoffs", "Box%20Scores"]

    for league in LEAGUES:
        for tab in tabs:
            url = f"https://sheets.googleapis.com/v4/spreadsheets/{LEAGUES[league]}/values/{tab}?key={g_sheets_api_key}"

            data = {}
            with urllib.request.urlopen(url) as req, open(
                json_dir.joinpath(f"{league}__{tab}.json"), "wb"
            ) as f:
                f.write(req.read())

            print(f"saved {league} {tab}")


if __name__ == "__main__":
    main()
