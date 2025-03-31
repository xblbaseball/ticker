import _ from "lodash";
import { useContext, useState } from "react";
import { SettingsContext } from "@/store/settings.context";

import styles from "./headlines.module.css";
import useInterval from "@/utils/useInterval";

export default function Headlines() {
  const { headlines } = useContext(SettingsContext);
  const [headlineIndex, setHeadlineIndex] = useState(0);

  const approxMaxTitleCharLength = 100;

  let lines = [[""], [""]];

  if (_.isString(headlines) && headlines.length > 0) {
    lines = headlines
      .trim()
      .split("\n")
      .map(line => line.trim().split("|")
        .map(side => side.trim())
      );
  }

  // make sure the horizontal scrolling interval matches
  const headlineSwapInterval = 30000;

  useInterval(() => {
    setHeadlineIndex((headlineIndex + 1) % lines.length);
  }, headlineSwapInterval);

  const title = _.get(lines, [headlineIndex, 0], "-");
  const body = _.get(lines, [headlineIndex, 1], "-");

  const needToScrollText = body.length > approxMaxTitleCharLength;

  return <div className={`flex column headlines-fade ${styles.container}`}>
    <div className={styles.title}>{title}</div>
    <div className={needToScrollText ? styles.fade : undefined}>
      <div className={`${needToScrollText ? "headlines-scroll" : undefined} ${styles.content}`}>{body}</div>
    </div>
  </div>
}