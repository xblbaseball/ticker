/** a container that manages the basic styling to handle an element's positioning as a modal */
export default function Modal(
  props: React.PropsWithChildren & {
    /** render the modal in the middle of the page */
    centered?: boolean;
    /** for absolute positioning */
    top?: string;
    /** for absolute positioning */
    left?: string;
  }
) {
  let style: React.CSSProperties = {};
  const { centered = true, top = "", left = "" } = props;

  if (centered && top === "" && left === "") {
    style = { display: "flex", justifyContent: "center", marginTop: "96px" };
  } else {
    style = { position: "absolute", top, left };
  }

  // FYI, onclick handler prevents clicking from bubbling to the background, which automatically closes the modal
  return (
    <div style={style}>
      <div onClick={(e) => e.stopPropagation()}>{props.children}</div>
    </div>
  );
}
