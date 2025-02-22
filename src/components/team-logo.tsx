/* eslint-disable @next/next/no-img-element */

const basePath = process.env.NEXT_PUBLIC_BASEPATH || "";

export default function TeamLogo(
  { team, width = "72px", small = false }:
    { team: string, width?: string, small?: boolean }
) {
  return <>
    <img src={`${basePath}/logos/${team}${small ? "-72x72" : ""}.png`}
      alt={`${team} logo`}
      style={{ width }}
    />
  </>
}
