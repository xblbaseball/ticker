import _ from "lodash";

export interface ModalStore {
  /** 1+ modal component(s) to show */
  modals: React.ReactElement[];
}

export type action = {
  type: "pushed-modal" | "popped-modal" | "destroyed-modals";
  payload?: {
    modal?: React.ReactElement;
  }
}

export const initialState: ModalStore = {
  modals: [],
};

export default function modalReducer(
  store: ModalStore,
  action: action
) {
  console.log(action)
  switch (action.type) {
    case "pushed-modal":
      const modal = _.get(action, ['payload', 'modal'], null);

      if (_.isNil(modal)) {
        throw new Error("Missing modal to push. Need action.payload")
      }

      return { ...store, modals: [...store.modals, modal] };

    case "popped-modal":
      return { ...store, modals: store.modals.slice(0, -1) };

    case "destroyed-modals":
      return { ...store, modals: [] }

    default:
      console.error(action);
      throw new Error("Unknown action for Modal Reducer: " + action.type);
  }
}
