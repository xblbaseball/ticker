import React from 'react';

export default function Dropdown(
  { options, selected, onSelect, children }:
    {
      options: string[];
      selected: string;
      onSelect: (option: string) => void
    } & React.PropsWithChildren
) {
  const handleOptionClick: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    onSelect(e.target.value);
  };

  return (
    <div>
      <label>
        <div><em>{children}</em></div>
        <select value={selected} onChange={handleOptionClick}>
          <option disabled={true}>Select a league</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
