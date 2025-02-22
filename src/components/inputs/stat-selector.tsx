import _ from 'lodash';
import React from 'react';
import { StatCategory } from '@/typings/stats';
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

    const timeFrames = ['career', 'careerPlayoffs', 'regularSeason', 'playoffs', 'league', 'headToHead'];
    for (const timeFrame of timeFrames) {
      _.set(newStatCategory, ['timeFrame', timeFrame], timeFrame === e.target.value);
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
        <label>Career Regular Season
          <input
            value="career"
            onChange={handleTimeframeChange}
            type="radio"
            name={name}
            checked={statCategory?.timeFrame.career} />
        </label>
        <label>| Career Playoffs
          <input
            value="careerPlayoffs"
            onChange={handleTimeframeChange}
            type="radio"
            name={name}
            checked={statCategory?.timeFrame.careerPlayoffs} />
        </label>
        <label>| League
          <input
            value="league"
            onChange={handleTimeframeChange}
            type="radio"
            name={name}
            checked={statCategory?.timeFrame.league} />
        </label>
        <label>| Regular Season
          <input
            value="regularSeason"
            onChange={handleTimeframeChange}
            type="radio"
            name={name}
            checked={statCategory?.timeFrame.regularSeason} />
        </label>
        <label>| Playoffs
          <input
            value="playoffs"
            onChange={handleTimeframeChange}
            type="radio"
            name={name}
            checked={statCategory?.timeFrame.playoffs} />
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

        {(statCategory?.timeFrame.regularSeason || statCategory?.timeFrame.playoffs) && (
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
