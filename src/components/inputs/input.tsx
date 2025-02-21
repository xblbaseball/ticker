import React from 'react';

export default function Input(
  { value, onChange, children }:
    {
      value: string | number;
      onChange: (value: string | number) => void
    } & React.PropsWithChildren
) {
  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    onChange(e.target.value);
  };

  return (
    <div>
      <label>
        <div><em>{children}</em></div>
        <input value={value} onChange={handleChange} />
      </label>
    </div>
  );
}
