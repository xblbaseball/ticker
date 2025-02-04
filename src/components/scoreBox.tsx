import { useContext } from "react";
import Matchup from "@/components/matchup";
import { IndexContext } from "@/store/index.context"
import { League } from "@/typings/league";

import styles from "./scoreBox.module.css"

export default function ScoreBox() {
   const store = useContext(IndexContext);

   const matchups = [];
   for (const league of ["XBL", "AAA", "AA"] as League[]) {
      const inPlayoffs = store[league].showPlayoffs;

      const scores = inPlayoffs ? store[league].scoresPlayoffs : store[league].scoresRS;

      // loop through scores twice
      const repreatedScores = scores.concat(scores)
      for (const g in repreatedScores) {
         const game = repreatedScores[g];
         const matchup = (
            <div key={`MATCHUP__${league}__${g}`}>
               <Matchup league={league} game={game} />
            </div>
         );
         matchups.push(matchup);
      }
   }

   return <div className={`${styles.container} vertical-scroll-${matchups.length}`}>
      {matchups}
   </div>
}
