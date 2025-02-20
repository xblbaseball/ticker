import { Oswald } from "next/font/google";

import styles from "./news-frame.module.css";

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"]
});

export default function NewsFrame() {
  return <div className={oswald.className}>
    <div className={`flex column ${styles.container} ${styles.leftBar}`}>left</div>
    <div className={`flex ${styles.container} ${styles.bottomBar}`}>bottom</div>
  </div>
}
