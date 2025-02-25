import io
import json
import os
from pathlib import Path
from PIL import Image
import urllib.request


def main():
    # make sure the logos dir exists
    logos_dir = Path("public/logos")
    logos_dir.mkdir(parents=True, exist_ok=True)

    # make sure the json dir exists
    json_dir = Path("public/json/raw")
    json_dir.mkdir(parents=True, exist_ok=True)

    g_sheets_api_key = os.getenv("G_SHEETS_API_KEY", None)
    if g_sheets_api_key is None:
        raise Exception("Missing Google Drive API key")
    sheets_url = f"https://sheets.googleapis.com/v4/spreadsheets/1sMuZIiKGNxOG816mBpdYCHyogIlet_XPMBzF8YWFUus/values/Sheet1?key={g_sheets_api_key}"

    data = {}
    with urllib.request.urlopen(sheets_url) as logos_req:
        res = logos_req.read().decode("utf-8")
        data = json.loads(res)

    # save the json we got from g sheets too
    with open(json_dir.joinpath("logos__Sheet1.json"), "w") as f:
        f.write(json.dumps(data))

    print("saved the json response too")

    logos_to_download = [
        ("XBL", "https://i.imgur.com/TaKg7Kt.png"),
        ("AAA", "https://i.imgur.com/xmunM5b.png"),
        ("AA", "https://i.imgur.com/6e0NYVE.png"),
    ]
    for row in data["values"][1:]:
        # not all rows have all 3 leagues. fill in the empty cols with ""
        row += ["", "", "", "", "", ""]
        row = row[:6]

        [team1, team1_url, team2, team2_url, team3, team3_url] = row

        if team1 != "":
            logos_to_download.append((team1, team1_url))
        if team2 != "":
            logos_to_download.append((team2, team2_url))
        if team3 != "":
            logos_to_download.append((team3, team3_url))

    print(f"Found {len(logos_to_download)} teams+league logos")

    thumbnail_res = (72, 72)

    for team_name, url in logos_to_download:
        suffix = Path(url).suffix
        # TODO Myst Inc. with the period at the end breaks with_suffix...
        # TODO RiseNFall is also messed up? oh it's just the pirates...
        full_size_logo_path = logos_dir.joinpath(team_name).with_suffix(suffix)
        thumbnail_logo_path = logos_dir.joinpath(
            f"{team_name}-{'x'.join(map(str, thumbnail_res))}"
        ).with_suffix(suffix)

        # pretend to be curl
        req = urllib.request.Request(url)
        req.add_header("user-agent", "curl/7.84.0")
        req.add_header("accept", "*/*")

        with urllib.request.urlopen(req) as logo_req, open(
            full_size_logo_path, "wb"
        ) as f, open(thumbnail_logo_path, "wb") as thumb_f:
            data = logo_req.read()
            image = Image.open(io.BytesIO(data))
            image.save(f)
            print(f"saved {full_size_logo_path}")

            image.thumbnail(size=thumbnail_res, resample=Image.Resampling.LANCZOS)
            image.save(thumb_f)
            print(f"saved {thumbnail_logo_path}")


if __name__ == "__main__":
    main()
