import React, { useState } from 'react';

export default function Dropdown(
  { options, selected, onSelect }:
    {
      options: string[];
      selected: string;
      onSelect: (option: string) => void
    }
) {
  const handleOptionClick: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    onSelect(e.target.value);
  };

  return (
    <div className="dropdown">
      <select value={selected} onChange={handleOptionClick}>
        <option disabled={true}>Select a league</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
