import { useCallback, useEffect, useReducer } from "react";
import { Oswald } from "next/font/google";

import Modal from "@/components/modal";
import Settings from "@/components/settings";
import { ModalContext, ModalDispatchContext } from "@/store/modal.context";
import modalReducer, { initialState } from "@/store/modal.reducer";

import styles from "./news-frame.module.css";

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"]
});

export default function NewsFrame() {
  const [store, dispatch] = useReducer(modalReducer, initialState);

  const handleBodyClick = useCallback(() => {
    if (store.modals.length > 0) {
      // only ever need one settings modal
      return;
    }

    dispatch({
      type: "pushed-modal", payload: {
        modal: (
          <Modal centered={true}>
            <Settings />
          </Modal>
        )
      }
    });
  }, [store.modals]);

  useEffect(() => {
    window.addEventListener('click', handleBodyClick);

    return () => {
      window.removeEventListener('click', handleBodyClick);
    };
  }, [handleBodyClick]);

  return <>
    <ModalContext.Provider value={store}>
      <ModalDispatchContext.Provider value={dispatch}>
        {
          store.modals.length > 0 && (
            <div>
              {store.modals.map((modal, i) => (
                <div
                  key={`MODAL__${i}`}
                  onClick={() => dispatch({ type: "popped-modal" })}
                >
                  {modal}
                </div>
              ))}
            </div>
          )
        }

        <div className={oswald.className}>
          <div className={`flex column ${styles.container} ${styles.leftBar}`}>left</div>
          <div className={`flex ${styles.container} ${styles.bottomBar}`}>bottom</div>
        </div>

      </ModalDispatchContext.Provider>
    </ModalContext.Provider>
  </>
}
