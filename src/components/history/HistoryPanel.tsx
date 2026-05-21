import { useHistoryStore, type HistoryEntry } from '../../store/historyStore'

interface Props {
  onLoad: (entry: HistoryEntry) => void
  onClose: () => void
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function HistoryPanel({ onLoad, onClose }: Props) {
  const { entries, deleteEntry } = useHistoryStore()

  return (
    <div className="rounded-lg border border-blue-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-800">
          历史方案记录
          <span className="ml-2 text-xs font-normal text-gray-400">
            ({entries.length} 条)
          </span>
        </h3>
        <button
          onClick={onClose}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          关闭
        </button>
      </div>

      {/* List */}
      <div className="max-h-80 overflow-y-auto">
        {entries.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-400">
            暂无保存的历史方案
          </div>
        ) : (
          entries.map((entry) => {
            const sol = entry.results[entry.selectedIndex]
            return (
              <div
                key={entry.id}
                className="flex items-center gap-3 border-b border-gray-50 px-4 py-3 last:border-b-0 hover:bg-gray-50 transition-colors"
              >
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{formatTime(entry.timestamp)}</span>
                    {entry.customerName && (
                      <span className="truncate text-gray-400">| {entry.customerName}</span>
                    )}
                    {entry.productName && (
                      <span className="truncate text-gray-400">| {entry.productName}</span>
                    )}
                  </div>
                  {sol && (
                    <div className="mt-0.5 text-xs text-gray-600">
                      每箱 {sol.boxing.totalCount} 个 · 每托 {sol.palletizing.totalBoxes} 箱 · 体积利用率 {sol.palletizing.volumeUtilization.toFixed(1)}%
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => onLoad(entry)}
                    className="rounded px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    加载
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('确定删除该历史方案？')) {
                        deleteEntry(entry.id)
                      }
                    }}
                    className="rounded px-2.5 py-1 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
                  >
                    删除
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
