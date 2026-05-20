import { create } from 'zustand'
import type { CartonDim, BoxConstraint, PalletDim, PalletConstraint } from '../engine/types'
import { DEFAULT_BOX_CONSTRAINT, DEFAULT_PALLET_CONSTRAINT } from '../engine/types'

// ---- Default values --------------------------------------------

const DEFAULT_CARTON: CartonDim = { length: 190, width: 47, height: 190 }
const DEFAULT_PALLET: PalletDim = { length: 1200, width: 1000, height: 150 }

// ---- State interface -------------------------------------------

interface InputState {
  carton: CartonDim
  boxConstraint: BoxConstraint
  pallet: PalletDim
  palletConstraint: PalletConstraint

  setCarton: (carton: Partial<CartonDim>) => void
  setBoxConstraint: (c: Partial<BoxConstraint>) => void
  setPallet: (pallet: Partial<PalletDim>) => void
  setPalletConstraint: (c: Partial<PalletConstraint>) => void
  resetAll: () => void
}

// ---- Store -----------------------------------------------------

export const useInputStore = create<InputState>((set) => ({
  carton: { ...DEFAULT_CARTON },
  boxConstraint: { ...DEFAULT_BOX_CONSTRAINT },
  pallet: { ...DEFAULT_PALLET },
  palletConstraint: { ...DEFAULT_PALLET_CONSTRAINT },

  setCarton: (partial) =>
    set((state) => ({ carton: { ...state.carton, ...partial } })),

  setBoxConstraint: (partial) =>
    set((state) => ({ boxConstraint: { ...state.boxConstraint, ...partial } })),

  setPallet: (partial) =>
    set((state) => ({ pallet: { ...state.pallet, ...partial } })),

  setPalletConstraint: (partial) =>
    set((state) => ({
      palletConstraint: { ...state.palletConstraint, ...partial },
    })),

  resetAll: () =>
    set({
      carton: { ...DEFAULT_CARTON },
      boxConstraint: { ...DEFAULT_BOX_CONSTRAINT },
      pallet: { ...DEFAULT_PALLET },
      palletConstraint: { ...DEFAULT_PALLET_CONSTRAINT },
    }),
}))
