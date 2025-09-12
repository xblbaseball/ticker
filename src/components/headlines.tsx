import _ from "lodash";
import { useContext, useEffect, useRef, useState } from "react";
import { SettingsContext } from "@/store/settings.context";

import styles from "./headlines.module.css";

/**
 * Get a random integer in [0,max). Function from: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random#try_it
 */
function getRandomInt(max: number) {
  return Math.floor(Math.random() * max);
}

export default function Headlines() {
  const { headlines, randomHeadlines } = useContext(SettingsContext);
  // the index of the headline currently being shown
  const [headlineIndex, setHeadlineIndex] = useState(0);
  // a list of headlines in the form of ["title", "body"]
  const [lines, setLines] = useState([[""], [""]]);
  // what actually gets rendered
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  // used to avoid repeating headlines too quickly when randomized
  const [history, setHistory] = useState([]);

  const approxMaxHeadlineCharLengthNoScroll = 100;

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

      if (newLines.length > 0) {
        const firstTitle = _.get(newLines, [headlineIndex, 0], "");
        const firstBody = _.get(newLines, [headlineIndex, 1], "");
        setTitle(firstTitle);
        setBody(firstBody);
      }
    }
  }, [headlines]);

  /** called when a headline fades out */
  const handleAnimationIteration = () => {
    let nextIndex = (headlineIndex + 1) % lines.length;

    if (randomHeadlines) {
      nextIndex = getRandomInt(lines.length);
      if (lines.length > 3) {
        // only try to avoid repeats if there are 4 or more headlines
        while (_.includes(history, nextIndex)) {
          nextIndex = getRandomInt(lines.length);
        }
      }
    }

    // track the last few headlines we showed
    const historyCopy = _.clone(history);
    historyCopy.push(nextIndex);
    if (historyCopy.length > Math.max(2, Math.floor(lines.length / 2))) {
      // keep track of a list of lines.length / 2 headlines we've shown to avoid repeats
      historyCopy.shift();
    }

    const thisTitle = _.get(lines, [nextIndex, 0], "");
    const thisBody = _.get(lines, [nextIndex, 1], "");

    setTitle(thisTitle)
    setBody(thisBody);
    setHeadlineIndex(nextIndex);
    setHistory(historyCopy);
  }

  const needToScrollText = body.length > approxMaxHeadlineCharLengthNoScroll;

  return <div className={`flex column ${styles.container}`}>
    <div className={`headlines-fade ${styles.innerContainer}`}
      onAnimationIteration={handleAnimationIteration}>
      <div className={styles.title}>{title}</div>
      <div className={needToScrollText ? styles.fade : undefined}>
        <div className={`${needToScrollText ? "headlines-scroll" : undefined} ${styles.content}`}>{body}</div>
      </div>
    </div>
  </div>
}
