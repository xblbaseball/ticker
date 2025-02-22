import React from 'react';

const DEFAULT = "__NONE__";

export default function Dropdown(
  { optionsLabel = "Select one", options, selected, onSelect, children }:
    {
      optionsLabel?: string;
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
        <select value={selected} onChange={handleOptionClick} defaultValue={DEFAULT}>
          <option value={DEFAULT}>{optionsLabel}</option>
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
