import _ from 'lodash';
import React from 'react';
import { StatCategory } from '@/typings/stats';
import { stat } from 'node:fs/promises';
import { League } from '@/typings/league';

const STATS = [
  "rs",
  "rs9",
  "ba",
  "ab",
  "ab9",
  "h",
  "h9",
  "hr",
  "hr9",
  "abhr",
  "so",
  "so9",
  "bb",
  "bb9",
  "obp",
  "rc",
  "babip",
  "ra",
  "ra9",
  "oppba",
  "oppab9",
  "opph",
  "opph9",
  "opphr",
  "opphr9",
  "oppabhr",
  "oppk",
  "oppk9",
  "oppbb",
  "oppbb9",
  "whip",
  "lob",
  "e",
  "fip",
  "rd",
  "rd9",
  "inningsplayed",
  "inningsgame",
  "wins",
  "losses",
  "winsbyrunrule",
  "lossesbyrunrule",
  "numseasons",
  "sweepsw",
  "sweepsl",
  "splits"
]

export default function StatSelector(
  { name, statCategory, onChange, children }:
    {
      name: string;
      statCategory: StatCategory;
      onChange: (newCategory: StatCategory) => void
    } & React.PropsWithChildren
) {

  const handleTimeframeChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const newStatCategory = {
      ...{
        stat: "",
        timeFrame: {},
        season: null,
        league: null,
      }, ...statCategory
    }
    switch (e.target.value) {
      case "career":
        newStatCategory.timeFrame.career = true;
        newStatCategory.timeFrame.season = false;
        newStatCategory.timeFrame.headToHead = false;
        newStatCategory.timeFrame.league = false;
        break;
      case "season":
        newStatCategory.timeFrame.career = false;
        newStatCategory.timeFrame.season = true;
        newStatCategory.timeFrame.headToHead = false;
        newStatCategory.timeFrame.league = false;
        break;
      case "headToHead":
        newStatCategory.timeFrame.career = false;
        newStatCategory.timeFrame.season = false;
        newStatCategory.timeFrame.headToHead = true;
        newStatCategory.timeFrame.league = false;
        break;
      case "league":
        newStatCategory.timeFrame.career = false;
        newStatCategory.timeFrame.season = false;
        newStatCategory.timeFrame.headToHead = false;
        newStatCategory.timeFrame.league = true;
        break;
      case "none":
        newStatCategory.timeFrame.career = false;
        newStatCategory.timeFrame.season = false;
        newStatCategory.timeFrame.headToHead = false;
        newStatCategory.timeFrame.league = false;
        break;
      default:
        console.error("Don't now how we got here");
        break;
    }

    onChange(newStatCategory);
  };

  const handleCategoryChange: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    const newStatCategory = { ...statCategory, ...{ stat: e.target.value } }
    onChange(newStatCategory);
  };

  const handleSeasonChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const newStatCategory = { ...statCategory, ...{ season: parseInt(e.target.value) || null } }
    onChange(newStatCategory);
  }

  const handleLeagueChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const newStatCategory = { ...statCategory, ...{ league: e.target.value as League } }
    onChange(newStatCategory);
  };

  return (
    <div>
      <label>
        <div><em>{children}</em></div>
        <select
          onChange={handleCategoryChange}
          value={statCategory?.stat || null}
        >
          <option disabled={true}>Select a stat</option>
          {STATS.map(option => (
            <option key={option} value={option}>{option.toUpperCase()}</option>
          ))}
        </select>
      </label>
      <div>
        <label>Career
          <input
            value="career"
            onChange={handleTimeframeChange}
            type="radio"
            name={name}
            checked={statCategory?.timeFrame.career} />
        </label>
        <label>| League
          <input
            value="league"
            onChange={handleTimeframeChange}
            type="radio"
            name={name}
            checked={statCategory?.timeFrame.league} />
        </label>
        <label>| Season
          <input
            value="season"
            onChange={handleTimeframeChange}
            type="radio"
            name={name}
            checked={statCategory?.timeFrame.season} />
        </label>
        <label>| Head to Head
          <input
            value="headToHead"
            onChange={handleTimeframeChange}
            type="radio"
            name={name}
            checked={statCategory?.timeFrame.headToHead} />
        </label>
        <label>| None
          <input
            value="none"
            onChange={handleTimeframeChange}
            type="radio"
            name={name} />
        </label>

        {statCategory?.timeFrame.season && (
          <label>|&nbsp;&nbsp;Season: <input value={statCategory?.season || ""} onChange={handleSeasonChange} /> </label>
        )}

        {statCategory?.timeFrame.league && (
          <>|&nbsp;&nbsp;Pick League:&nbsp;
            <label>XBL
              <input
                value="XBL"
                onChange={handleLeagueChange}
                type="radio"
                name={name + "-league"} />
            </label>
            <label>AAA
              <input
                value="AAA"
                onChange={handleLeagueChange}
                type="radio"
                name={name + "-league"} />
            </label>
            <label>AA
              <input
                value="AA"
                onChange={handleLeagueChange}
                type="radio"
                name={name + "-league"} />
            </label>
          </>
        )}
      </div>
    </div>
  );
}
