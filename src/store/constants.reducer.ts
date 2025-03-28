export interface ConstantsStore {
  allLogos: string[];
}

export const initialState: ConstantsStore = {
  /** every logo available to render */
  allLogos: [],
};
