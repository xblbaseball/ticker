import { useId } from "react";

export default function Radio(
  { selected, options, onChange, children }:
    {
      selected: string,
      /** list of [display, value] lists */
      options: string[][],
      onChange: (selcted: string) => void
    } & React.PropsWithChildren
) {
  const name = useId();

  return <div>
    <div><em>{children}</em></div>
    {options.map(([display, value], i) => {
      return <>
        <br />
        <label key={`RADIO__${value}__${i}`}>
          {display}
          <input
            value={value}
            type="radio"
            name={name}
          />
        </label>
      </>
    })}
  </div>
}