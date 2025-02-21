import React from 'react';

export default function TextArea(
  { onChange, children }:
    {
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
        <textarea onChange={handleChange} />
      </label>
    </div>
  );
}
