import React from 'react';

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
  { stat, onChange, children }:
    {
      stat: string;
      onChange: (newCategory: string) => void
    } & React.PropsWithChildren
) {

  const handleCategoryChange: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    onChange(e.target.value);
  };


  return (
    <div>
      <label>
        <div><em>{children}</em></div>
        <select
          onChange={handleCategoryChange}
          value={stat || null}
        >
          <option disabled={true}>Select a stat</option>
          {STATS.map(option => (
            <option key={option} value={option}>{option.toUpperCase()}</option>
          ))}
        </select>
      </label>
    </div>
  );
}
