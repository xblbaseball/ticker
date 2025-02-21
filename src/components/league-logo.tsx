/* eslint-disable @next/next/no-img-element */

import { League } from "@/typings/league";

const basePath = process.env.NEXT_PUBLIC_BASEPATH || ""


export default function LeagueLogo({ league }: { league: League }) {

  return <>
    <img src={`${basePath}/logos/${league}.png`}
      alt={`${league} Logo`}
      style={{ width: "120px" }} />
  </>
}