import { useRef, useState } from 'react'
import { useInputStore } from './store/inputStore'
import { useComputeStore } from './store/computeStore'
import { exportToPdf } from './utils/export'
import CartonInput from './components/input/CartonInput'
import PalletInput from './components/input/PalletInput'
import ConstraintInput from './components/input/ConstraintInput'
import SummaryTable from './components/results/SummaryTable'
import DimensionTable from './components/results/DimensionTable'
import CartonView from './components/visualization/CartonView'
import PalletView from './components/visualization/PalletView'
import DetailCard from './components/results/DetailCard'

function App() {
  const inputState = useInputStore()
  const { results, selectedIndex, isComputing, error, compute, clearResults } = useComputeStore()
  const resultsRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    if (!resultsRef.current) return
    setExporting(true)
    try {
      await exportToPdf(resultsRef.current)
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err))
    } finally {
      setExporting(false)
    }
  }

  const handleCompute = () => {
    compute({
      carton: inputState.carton,
      boxConstraint: inputState.boxConstraint,
      pallet: inputState.pallet,
      palletConstraint: inputState.palletConstraint,
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">
            包装装载优化软件
          </h1>
          <span className="text-xs text-gray-400">
            三维装箱码垛优化工具
          </span>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Left Panel — Inputs */}
          <aside className="w-full lg:w-80 shrink-0 space-y-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-5">
              <CartonInput />
              <hr className="border-gray-100" />
              <PalletInput />
              <hr className="border-gray-100" />
              <ConstraintInput />
            </div>

            {/* Compute button */}
            <div className="flex gap-2">
              <button
                onClick={handleCompute}
                disabled={isComputing}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isComputing ? (
                  <span className="inline-flex items-center gap-1.5">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    计算中…
                  </span>
                ) : '开始计算'}
              </button>
              {results.length > 0 && (
                <button
                  onClick={handleExport}
                  disabled={exporting}
                  className="rounded-lg border border-blue-300 px-4 py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {exporting ? '导出中...' : '导出 PDF'}
                </button>
              )}
              <button
                onClick={clearResults}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                清空
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
          </aside>

          {/* Right Panel — Results */}
          <div ref={resultsRef} className="flex-1 min-w-0 space-y-4">
            <SummaryTable />

            {/* Visualization — side by side on wide screens */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <CartonView />
              <PalletView />
            </div>

            <DimensionTable />

            {/* 方案详情卡片 */}
            {results[selectedIndex] && <DetailCard solution={results[selectedIndex]} />}
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
