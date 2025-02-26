import _ from 'lodash';
import { useContext } from "react";
import Matchup from "@/components/matchup";
import { StatsContext } from "@/store/stats.context"
import { League } from "@/typings/league";

import styles from "./scoreBox.module.css"

export default function ScoreBox() {
   const store = useContext(StatsContext);

   const matchups = [];
   for (const league of ["XBL", "AAA", "AA"] as League[]) {
      const inPlayoffs = store.playoffs[league];

      const results = _.get(
         store.stats[league],
         [inPlayoffs ? 'playoffs_game_results' : 'season_game_results']
      );
      const scores = results.reverse().slice(6);

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
