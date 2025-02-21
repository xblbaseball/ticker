import React from 'react';

export default function Checkbox(
  { checked, onChange, children }:
    {
      checked: boolean;
      onChange: (checked: boolean) => void
    } & React.PropsWithChildren
) {
  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    onChange(e.target.checked);
  };

  return (
    <div>
      <label>
        <div><em>{children}</em></div>
        <input type="checkbox" checked={checked} onChange={handleChange} />
      </label>
    </div>
  );
}
