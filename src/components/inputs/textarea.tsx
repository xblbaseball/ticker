import React from 'react';

export default function TextArea(
  { value, onChange, children, cols = 80, rows = 20 }:
    {
      value: string;
      onChange: (value: string) => void;
      cols?: number;
      rows?: number;
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
          cols={cols}
          rows={rows}
          style={{ fontSize: "20px" }}
        />
      </label>
    </div>
  );
}
