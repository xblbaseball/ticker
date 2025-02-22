import { useContext } from "react";
import { SettingsContext } from "@/store/settings.context"

import styles from "./series.module.css";

export default function Series() {
  const settingsStore = useContext(SettingsContext);

  return <div className={styles.container}>
    <div className={`flex ${styles.scoreBoard}`}>
      <div className={`flex column ${styles.teams}`}>
        <div>{settingsStore.awayAbbrev}</div>
        <div>{settingsStore.homeAbbrev}</div>
      </div>
      <div className={`flex column ${styles.scores}`}>
        <div>{settingsStore.awayWins}</div>
        <div>{settingsStore.homeWins}</div>
      </div>
    </div>
  </div>
}
