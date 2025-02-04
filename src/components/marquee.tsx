/* eslint-disable @next/next/no-img-element */

import { useContext } from "react";
import { IndexContext } from "@/store/index.context"
import { League } from "@/typings/league";

import styles from "./marquee.module.css"
import TeamRecord from "@/typings/team-record";

function Category(
  {header, children, i}:
  {
    header: string;
    /** 0-th index of the order in which this category is going to show up */
    i: number
  } & React.PropsWithChildren
) {
  return (
    <div className={`flex ${styles.category}`}>
      <div className={styles.header}>{header}</div>
      <div className={styles.scrollContainer}>
        <div className={`flex marquee-scroll-${i} ${styles.scroll}`}>{children}</div>
      </div>
    </div>
  );
}

function LeaderListEntry(
  {position, teamName, stat}:
  {position: number; teamName: string; stat: number | string}
) {
  return (
    <div className={`flex ${styles.listEntry}`}>
      <div className={`flex column flex-end ${styles.position}`}>{position}.</div>
      <div className={styles.listEntryLogo}>
        <img
          src={`/logos/${teamName}.png`}
          alt={`${teamName} logo`}
          className={styles.logo}
        />
      </div>
      <div className={styles.stat}>{stat}</div>
    </div>
  )
}

function StandingEntry(
  {position, teamName, record}:
  {position: number; teamName: string; record: string}
) {
  return (
    <div className={`flex ${styles.listEntry}`}>
      <div className={`flex column flex-end ${styles.position}`}>{position}.</div>
      <div className={styles.listEntryLogo}>
        <img
          src={`/logos/${teamName}.png`}
          alt={`${teamName} logo`}
          className={styles.logo}
        />
      </div>
      <div className={`flex column end ${styles.standing}`}><div>{record}</div></div>
    </div>
  )
}

export default function Marquee() {
  const store = useContext(IndexContext);

  const categories = [];

  // generate marquee elements. the number of marquees must be divisible by 3!
   for (const league of ["XBL", "AAA", "AA"] as League[]) {
      const inPlayoffs = store[league].showPlayoffs;

      const hrLeaders = store[league].hrLeaders;
      const kLeaders = store[league].kLeaders;
      const baLeaders = store[league].baLeaders;
      const standings: TeamRecord[] = inPlayoffs ? store[league].playoffRecords : store[league].standings;

      const hrMarquee =(
        <Category header="HR Leaders" i={0}>
          {hrLeaders.map((entry, i) => (
            <LeaderListEntry key={`HR_LEADER__${league}_${i}`}
              position={i+1}
              teamName={entry.team}
              stat={entry.value} />
            )
        )}
        </Category>
      );

      const kMarquee =(
        <Category header="K Leaders" i={1}>
          {kLeaders.map((entry, i) => (
            <LeaderListEntry key={`K_LEADER__${league}_${i}`}
              position={i+1}
              teamName={entry.team}
              stat={entry.value} />
            )
        )}
        </Category>
      );

      const baMarquee =(
        <Category header="BA Leaders" i={2}>
          {baLeaders.map((entry, i) => (
            <LeaderListEntry key={`BA_LEADER__${league}_${i}`}
              position={i+1}
              teamName={entry.team}
              stat={entry.value} />
            )
        )}
        </Category>
      );

      const standingsMarquee =(
        <Category header="Standings" i={3}>
          {standings.map((entry, i) => (
            <StandingEntry key={`STANDINGS__${league}_${i}`}
              position={i+1}
              teamName={entry.team}
              record={`(${entry.wins}-${entry.losses})`} />
            )
        )}
        </Category>
      );

      categories.push(hrMarquee, kMarquee, baMarquee, standingsMarquee);
   }

  return <div className={`${styles.container} vertical-scroll-${categories.length}`}>{categories}</div>
}
