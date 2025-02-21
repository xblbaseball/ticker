import { ActionDispatch, useContext } from "react";
import { ModalDispatchContext } from "@/store/modal.context";
import { action } from "@/store/modal.reducer";

export default function Settings() {
  const dispatch: ActionDispatch<[action: action]> = useContext(ModalDispatchContext);

  return <div
    style={{ width: "200px", height: "100px", backgroundColor: "white" }}
    onClick={() => dispatch({ type: "popped-modal" })}
  >
    settings
  </div>;
}
