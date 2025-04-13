import _ from "lodash";
import { useContext, useEffect, useState } from "react";
import { SettingsContext } from "@/store/settings.context";

import styles from "./headlines.module.css";
import useInterval from "@/utils/useInterval";

export default function Headlines() {
  const { headlines } = useContext(SettingsContext);
  const [headlineIndex, setHeadlineIndex] = useState(0);
  const [lines, setLines] = useState([[""], [""]]);

  const approxMaxHeadlineCharLength = 100;

  useEffect(() => {
    const oneOrMoreNewlines = new RegExp("\n+");

    if (_.isString(headlines) && headlines.length > 0) {
      const newLines = headlines
        .trim()
        .split(oneOrMoreNewlines)
        .map(line => line.trim().split("|")
          .map(side => side.trim())
        );

      setLines(newLines);
    }
  }, [headlines]);

  // matches the interval in styles/scrolls.css/.headlines-scroll
  const headlineSwapInterval = 30000;

  useInterval(() => {
    setHeadlineIndex((headlineIndex + 1) % lines.length);
  }, headlineSwapInterval);

  const title = _.get(lines, [headlineIndex, 0], "");
  const body = _.get(lines, [headlineIndex, 1], "");

  const needToScrollText = body.length > approxMaxHeadlineCharLength;

  return <div className={`flex column ${styles.container}`}>
    <div className={`headlines-fade ${styles.innerContainer}`}>
      <div className={styles.title}>{title}</div>
      <div className={needToScrollText ? styles.fade : undefined}>
        <div className={`${needToScrollText ? "headlines-scroll" : undefined} ${styles.content}`}>{body}</div>
      </div>
    </div>
  </div>
}
