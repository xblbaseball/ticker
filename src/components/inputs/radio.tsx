import { useId } from "react";

export default function Radio(
  { selected, options, onChange, children }:
    {
      selected: string,
      /** list of [display, value] lists */
      options: string[][],
      onChange: (selected: string) => void
    } & React.PropsWithChildren
) {
  const name = useId();

  return <div>
    <div><em>{children}</em></div>
    {options.map(([display, value], i) => {
      return <div key={`RADIO__${name}__${i}`}>
        <label>
          {display}
          <input
            value={value}
            type="radio"
            name={name}
            checked={selected === value}
            onChange={(e) => onChange(e.target.value)}
          />
        </label>
      </div>
    })}
  </div>
}