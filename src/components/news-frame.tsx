import { useEffect, useCallback, useReducer } from "react";
import { Oswald } from "next/font/google";

import Modal from "@/components/modal";
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
    console.log('Clicked on the body!');
    dispatch({
      type: "pushed-modal", payload: {
        modal: (
          <Modal centered={true}>
            <div
              style={{ width: "200px", height: "100px", backgroundColor: "white" }}
              onClick={() => dispatch({ type: "popped-modal" })}
            >
              hi!
            </div>
          </Modal>
        )
      }
    })
  }, []);

  useEffect(() => {
    window.addEventListener('click', handleBodyClick);

    return () => {
      window.removeEventListener('click', handleBodyClick);
    };
  }, [handleBodyClick]);

  return <>
    <ModalContext.Provider value={store}>
      <ModalDispatchContext.Provider value={dispatch}>

        <div className={oswald.className}>
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

          <div className={`flex column ${styles.container} ${styles.leftBar}`}>left</div>
          <div className={`flex ${styles.container} ${styles.bottomBar}`}>bottom</div>
        </div>

      </ModalDispatchContext.Provider>
    </ModalContext.Provider>
  </>
}
