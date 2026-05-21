import { useRef, useState } from 'react'
import { useInputStore } from './store/inputStore'
import { useComputeStore } from './store/computeStore'
import { useHistoryStore } from './store/historyStore'
import { exportToPdf } from './utils/export'
import CartonInput from './components/input/CartonInput'
import PalletInput from './components/input/PalletInput'
import ConstraintInput from './components/input/ConstraintInput'
import SummaryTable from './components/results/SummaryTable'
import DimensionTable from './components/results/DimensionTable'
import CartonView from './components/visualization/CartonView'
import PalletView from './components/visualization/PalletView'
import DetailCard from './components/results/DetailCard'
import HistoryPanel from './components/history/HistoryPanel'

function App() {
  const inputState = useInputStore()
  const { results, selectedIndex, isComputing, error, compute, clearResults, restoreResults } = useComputeStore()
  const historyStore = useHistoryStore()
  const resultsRef = useRef<HTMLDivElement>(null)
  const pdfContentRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const handleExport = async () => {
    if (!pdfContentRef.current) return
    setExporting(true)
    try {
      await exportToPdf(pdfContentRef.current)
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err))
    } finally {
      setExporting(false)
    }
  }

  const handleSave = () => {
    if (selectedIndex < 0 || !results[selectedIndex]) {
      alert('请先选中一个方案')
      return
    }
    historyStore.saveEntry({
      customerName: inputState.customerName,
      productName: inputState.productName,
      input: {
        carton: inputState.carton,
        boxConstraint: inputState.boxConstraint,
        pallet: inputState.pallet,
        palletConstraint: inputState.palletConstraint,
      },
      results,
      selectedIndex,
    })
    alert('方案已保存')
  }

  const handleHistoryLoad = (entry: import('./store/historyStore').HistoryEntry) => {
    inputState.setCarton(entry.input.carton)
    inputState.setBoxConstraint(entry.input.boxConstraint)
    inputState.setPallet(entry.input.pallet)
    inputState.setPalletConstraint(entry.input.palletConstraint)
    inputState.setCustomerName(entry.customerName)
    inputState.setProductName(entry.productName)
    restoreResults(entry.results, entry.selectedIndex)
    resultsRef.current?.scrollIntoView({ behavior: 'smooth' })
    setShowHistory(false)
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
      <header className="sticky top-0 z-10 bg-gradient-to-r from-slate-900 to-slate-800 shadow-md border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-white tracking-wide">
            包装装载优化软件
          </h1>
          <span className="text-xs text-cyan-300/70">
            三维装箱码垛优化工具
          </span>
        </div>
      </header>

      {/* 客户/产品名称栏 */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-6">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-600 whitespace-nowrap">客户名称：</label>
            <input
              type="text"
              value={inputState.customerName}
              onChange={(e) => inputState.setCustomerName(e.target.value)}
              placeholder="请输入客户名称"
              className="w-48 rounded border border-gray-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-600 whitespace-nowrap">产品名称：</label>
            <input
              type="text"
              value={inputState.productName}
              onChange={(e) => inputState.setProductName(e.target.value)}
              placeholder="请输入产品名称"
              className="w-48 rounded border border-gray-300 px-3 py-1.5 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Left Panel — Inputs */}
          <aside className="w-full lg:w-80 shrink-0 space-y-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-5 border-t-[3px] border-t-cyan-500 shadow-sm">
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
                className="flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2.5 text-sm font-medium text-white hover:from-blue-500 hover:to-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
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
                  className="rounded-lg border border-cyan-400 px-4 py-2.5 text-sm font-medium text-cyan-600 hover:bg-cyan-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {exporting ? '导出中...' : '导出 PDF'}
                </button>
              )}
              {results.length > 0 && selectedIndex >= 0 && (
                <button
                  onClick={handleSave}
                  className="rounded-lg border border-emerald-400 px-4 py-2.5 text-sm font-medium text-emerald-600 hover:bg-emerald-50 transition-colors"
                >
                  保存方案
                </button>
              )}
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                  showHistory
                    ? 'border-blue-400 bg-blue-50 text-blue-600'
                    : 'border-gray-300 text-gray-500 hover:bg-gray-100'
                }`}
              >
                历史方案
              </button>
              <button
                onClick={clearResults}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors"
              >
                清空
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 border-l-[3px] border-l-red-400">
                {error}
              </div>
            )}
          </aside>

          {/* Right Panel — Results */}
          <div ref={resultsRef} className="flex-1 min-w-0 space-y-4">
            {showHistory && (
              <HistoryPanel
                onLoad={handleHistoryLoad}
                onClose={() => setShowHistory(false)}
              />
            )}
            <SummaryTable />

            <div ref={pdfContentRef} className="space-y-4">
              {/* PDF 表头：客户/产品名称 + Logo */}
              {(inputState.customerName || inputState.productName) && (
                <div className="border-b border-gray-300 pb-3 mb-1 flex justify-between items-center">
                  <div className="space-y-1">
                    {inputState.customerName && (
                      <p className="text-lg font-bold text-orange-600">客户：{inputState.customerName}</p>
                    )}
                    {inputState.productName && (
                      <p className="text-lg font-bold text-orange-600">产品：{inputState.productName}</p>
                    )}
                  </div>
                  <img src="/logo.png" alt="Logo" className="h-14 w-auto" />
                </div>
              )}

              {/* Visualization — side by side on wide screens */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <CartonView />
                <PalletView />
              </div>

              {/* 方案详情卡片 */}
              {results[selectedIndex] && <DetailCard solution={results[selectedIndex]} />}

              <DimensionTable />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
