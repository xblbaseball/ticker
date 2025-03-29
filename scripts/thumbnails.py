import argparse
import io
from pathlib import Path
from PIL import Image


def arg_parser():
    parser = argparse.ArgumentParser(
        description="Useful for making thumbnails of specific team logos"
    )
    parser.add_argument("logos", nargs="+", type=Path)
    return parser


def main(args):
    thumbnail_res = (72, 72)
    for logo in args.logos:
        thumbnail_logo_path = logo.with_stem(f"{logo.stem}-72x72")
        with open(logo, "rb") as f, open(thumbnail_logo_path, "wb") as g:
            image = Image.open(io.BytesIO(f.read()))
            image.thumbnail(size=thumbnail_res, resample=Image.Resampling.LANCZOS)
            image.save(g)

            print(f"Saved {thumbnail_logo_path}")


if __name__ == "__main__":
    parser = arg_parser()
    args = parser.parse_args()
    main(args)
