import React from 'react';

export default function TextArea(
  { value, onChange, children }:
    {
      value: string;
      onChange: (value: string) => void
    } & React.PropsWithChildren
) {
  const handleChange: React.ChangeEventHandler<HTMLTextAreaElement> = (e) => {
    onChange(e.target.value);
  };

  return (
    <div>
      <label>
        <div><em>{children}</em></div>
        <textarea
          value={value}
          onChange={handleChange}
          cols={80}
          rows={10}
          style={{ fontSize: "20px" }}
        />
      </label>
    </div>
  );
}
