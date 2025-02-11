/* eslint-disable @next/next/no-img-element */

import styles from "./league-logo-loop.module.css";

export default function LeagueLogoLoop() {
  return <div className={`${styles.leagueLogos} vertical-scroll-3`}>
    <div className={`${styles.leagueLogoContainer}`}>
      <img src={`${process.env.NEXT_PUBLIC_BASEPATH}/logos/XBL.png`}
        alt="XBL Logo"
        className={styles.leagueLogo} />
    </div>
    <div className={`${styles.leagueLogoContainer}`}>
      <img src={`${process.env.NEXT_PUBLIC_BASEPATH}/logos/AAA.png`}
        alt="AAA Logo"
        className={styles.leagueLogo} />
    </div>
    <div className={`${styles.leagueLogoContainer}`}>
      <img src={`${process.env.NEXT_PUBLIC_BASEPATH}/logos/AA.png`}
        alt="AA Logo"
        className={styles.leagueLogo} />
    </div>
  </div>
}
