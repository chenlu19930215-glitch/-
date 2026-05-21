import { create } from 'zustand'
import type { OptimizerInput, CombinedSolution } from '../engine/types'

// ---- Types ----------------------------------------------------

export interface HistoryEntry {
  id: string
  timestamp: number
  customerName: string
  productName: string
  input: OptimizerInput
  results: CombinedSolution[]
  selectedIndex: number
}

interface HistoryState {
  entries: HistoryEntry[]

  saveEntry: (data: Omit<HistoryEntry, 'id' | 'timestamp'>) => void
  deleteEntry: (id: string) => void
  loadEntry: (id: string) => HistoryEntry | undefined
  clearAll: () => void
}

// ---- Constants ------------------------------------------------

const STORAGE_KEY = 'packing-optimizer-history'
const MAX_ENTRIES = 200

// ---- Persistence helpers --------------------------------------

function loadFromStorage(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as HistoryEntry[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveToStorage(entries: HistoryEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch {
    // localStorage full or unavailable - silently ignore
  }
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

// ---- Store ----------------------------------------------------

export const useHistoryStore = create<HistoryState>((set, get) => ({
  entries: loadFromStorage(),

  saveEntry: (data) => {
    const entry: HistoryEntry = {
      ...data,
      id: generateId(),
      timestamp: Date.now(),
    }
    const updated = [entry, ...get().entries].slice(0, MAX_ENTRIES)
    set({ entries: updated })
    saveToStorage(updated)
  },

  deleteEntry: (id) => {
    const updated = get().entries.filter((e) => e.id !== id)
    set({ entries: updated })
    saveToStorage(updated)
  },

  loadEntry: (id) => {
    return get().entries.find((e) => e.id === id)
  },

  clearAll: () => {
    set({ entries: [] })
    saveToStorage([])
  },
}))
