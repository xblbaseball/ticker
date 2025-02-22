import _ from "lodash";
import { useCallback, useEffect, useReducer } from "react";
import { Oswald } from "next/font/google";

import LeagueLogo from "@/components/league-logo";
import Modal from "@/components/modal";
import Series from "@/components/series";
import Settings from "@/components/settings";
import { ModalContext, ModalDispatchContext } from "@/store/modal.context";
import modalReducer, { initialState as modalInitialState } from "@/store/modal.reducer";
import { SettingsContext, SettingsDispatchContext } from "@/store/settings.context";
import settingsReducer, { initialState as settingsInitialState } from "@/store/settings.reducer";

import styles from "./news-frame.module.css";
import SidebarPlayerStats from "./sidebar-player-stats";

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"]
});

export default function NewsFrame() {
  const [modalStore, modalDispatch] = useReducer(modalReducer, modalInitialState);
  const [settingsStore, settingsDispatch] = useReducer(settingsReducer, settingsInitialState);

  const handleBodyClick = useCallback(() => {
    if (modalStore.modals.length > 0) {
      // only ever need one settings modal
      modalDispatch({ type: "popped-modal" });
    }

    modalDispatch({
      type: "pushed-modal", payload: {
        modal: (
          <Modal centered={true}>
            <Settings />
          </Modal>
        )
      }
    });
  }, [modalStore.modals]);

  useEffect(() => {
    window.addEventListener('click', handleBodyClick);

    return () => {
      window.removeEventListener('click', handleBodyClick);
    };
  }, [handleBodyClick]);

  useEffect(() => {
    settingsDispatch({ type: "load" })
  }, []);

  return <>
    <SettingsContext.Provider value={settingsStore}>
      <SettingsDispatchContext.Provider value={settingsDispatch}>
        <ModalContext.Provider value={modalStore}>
          <ModalDispatchContext.Provider value={modalDispatch}>
            {
              modalStore.modals.length > 0 && (
                <div>
                  {modalStore.modals.map((modal, i) => (
                    <div key={`MODAL__${i}`}>
                      {modal}
                    </div>
                  ))}
                </div>
              )
            }

            <div className={oswald.className}>

              <div className={`flex column ${styles.container} ${styles.leftBar}`}>

                <div style={{ marginLeft: "4px" }}>
                  <LeagueLogo league={settingsStore.league} />
                </div>

                <div className={`flex column ${styles.title}`}>
                  <div className={styles.season}>
                    Season {settingsStore.season}
                    {!_.isEmpty(settingsStore.seasonSubtext) && <><br />{settingsStore.seasonSubtext}</>}
                  </div>
                </div>

                {settingsStore.showSeries && <Series />}

                <SidebarPlayerStats away={true} />
                <SidebarPlayerStats away={false} />

              </div>

              <div className={`flex ${styles.container} ${styles.bottomBar}`}>bottom</div>
            </div>

          </ModalDispatchContext.Provider>
        </ModalContext.Provider>
      </SettingsDispatchContext.Provider>
    </SettingsContext.Provider>
  </>
}
