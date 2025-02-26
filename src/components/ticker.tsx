import { Oswald } from "next/font/google";

import LeagueLogoLoop from "@/components/league-logo-loop";
import Marquee from "@/components/marquee"
import ScoreBox from "@/components/scoreBox"

import styles from "./ticker.module.css"

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"]
});


export default function Ticker() {
  return (
    <div className={`flex ${oswald.className} ${styles.container}`}>
      <div className="border-right"><LeagueLogoLoop /></div>
      <div className="border-right"><ScoreBox /></div>
      <div><Marquee /></div>
    </div>
  );
}
