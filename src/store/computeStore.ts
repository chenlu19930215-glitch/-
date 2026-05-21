import { create } from 'zustand'
import type { CombinedSolution, OptimizerInput, OptimizerConfig } from '../engine/types'
import { runFullOptimization } from '../engine/optimizer'
import { DEFAULT_OPTIMIZER_CONFIG } from '../engine/types'

// ---- State interface -------------------------------------------

interface ComputeState {
  results: CombinedSolution[]
  selectedIndex: number
  isComputing: boolean
  error: string | null

  compute: (input: OptimizerInput, config?: OptimizerConfig) => void
  selectSolution: (index: number) => void
  clearResults: () => void
  restoreResults: (results: CombinedSolution[], selectedIndex: number) => void
}

// ---- Store -----------------------------------------------------

export const useComputeStore = create<ComputeState>((set) => ({
  results: [],
  selectedIndex: -1,
  isComputing: false,
  error: null,

  compute: (input, config) => {
    set({ isComputing: true, error: null })

    try {
      if (typeof Worker !== 'undefined') {
        // ---- Browser: Web Worker (non-blocking) ---------------
        const worker = new Worker(
          new URL('../workers/compute.worker.ts', import.meta.url),
          { type: 'module' },
        )

        worker.onmessage = (e: MessageEvent<{ solutions: CombinedSolution[] }>) => {
          const solutions = e.data.solutions
          set({
            results: solutions,
            selectedIndex: solutions.length > 0 ? 0 : -1,
            isComputing: false,
          })
          worker.terminate()
        }

        worker.onerror = (err) => {
          set({ error: `计算失败：${err.message}`, isComputing: false })
          worker.terminate()
        }

        worker.postMessage({ input, config: config ?? DEFAULT_OPTIMIZER_CONFIG })
      } else {
        // ---- Fallback: synchronous (Node/SSR) ----------------
        const solutions = runFullOptimization(input, config)
        set({
          results: solutions,
          selectedIndex: solutions.length > 0 ? 0 : -1,
          isComputing: false,
        })
      }
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : String(err),
        isComputing: false,
      })
    }
  },

  selectSolution: (index) => set({ selectedIndex: index }),

  clearResults: () =>
    set({ results: [], selectedIndex: -1, error: null }),

  restoreResults: (results, selectedIndex) =>
    set({ results, selectedIndex, error: null, isComputing: false }),
}))
