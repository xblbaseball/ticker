/* eslint-disable @next/next/no-img-element */

import { League } from "@/typings/league";

const basePath = process.env.NEXT_PUBLIC_BASEPATH || "";

const punctuation = /[.,\/#!$%\^&\*;:{}=\-_`~()]/g;

/** render a team's logo */
export default function TeamLogo(
  { team, width = "72px", small = false, league = "XBL" }:
    {
      /** team name with proper caps and spaces. punctuation doesn't matter */
      team: string,
      /** width for img */
      width?: string,
      /** 72x72 version */
      small?: boolean,
      /** used to determine fallback logo if the team is missing */
      league?: League
    }
) {
  // no punctuation
  const cleanedName = team.replaceAll(punctuation, "");

  return <>
    <img src={`${basePath}/logos/${cleanedName}${small ? "-72x72" : ""}.png`}
      alt={`${team} logo`}
      style={{ width, height: "auto" }}
      onError={({ currentTarget }) => {
        currentTarget.onerror = null; // prevents looping
        currentTarget.src = `${basePath}/logos/${league}-72x72.png`;
      }}
    />
  </>
}
