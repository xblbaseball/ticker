/* eslint-disable @next/next/no-img-element */

const basePath = process.env.NEXT_PUBLIC_BASEPATH || "";

export default function TeamLogo(
  { team, width = "72px", small = false }:
    { team: string, width?: string, small?: boolean }
) {
  // no punctuation
  const cleanedName = team.replaceAll(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");

  return <>
    <img src={`${basePath}/logos/${cleanedName}${small ? "-72x72" : ""}.png`}
      alt={`${team} logo`}
      style={{ width, height: "auto" }}
    />
  </>
}
