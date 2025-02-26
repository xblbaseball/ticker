/* eslint-disable @next/next/no-img-element */

import styles from "./league-logo-loop.module.css";

const basePath = process.env.NEXT_PUBLIC_BASEPATH || "";

export default function LeagueLogoLoop() {
  return <div className={`${styles.leagueLogos} vertical-scroll-3`}>
    <div className={`${styles.leagueLogoContainer}`}>
      <img src={`${basePath}/logos/XBL.png`}
        alt="XBL Logo"
        className={styles.leagueLogo} />
    </div>
    <div className={`${styles.leagueLogoContainer}`}>
      <img src={`${basePath}/logos/AAA.png`}
        alt="AAA Logo"
        className={styles.leagueLogo} />
    </div>
    <div className={`${styles.leagueLogoContainer}`}>
      <img src={`${basePath}/logos/AA.png`}
        alt="AA Logo"
        className={styles.leagueLogo} />
    </div>
  </div>
}
