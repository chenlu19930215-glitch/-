import { useState } from 'react'
import { useInputStore } from '../../store/inputStore'

export default function ConstraintInput() {
  const { boxConstraint, setBoxConstraint } = useInputStore()
  const [showClearance, setShowClearance] = useState(false)
  const [showUserCount, setShowUserCount] = useState(false)

  return (
    <section>
      <h3 className="mb-3 text-sm font-semibold text-gray-800">纸箱约束</h3>
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <label className="w-24 text-sm font-medium text-gray-700">
            最大外尺寸 (mm)
          </label>
          <input
            type="number"
            min={1}
            step={1}
            value={boxConstraint.maxOuterDim}
            onChange={(e) =>
              setBoxConstraint({ maxOuterDim: Number(e.target.value) })
            }
            className="min-w-0 flex-1 rounded border border-gray-300 px-3 py-1.5 text-right text-sm"
          />
        </div>
        <div className="flex items-center gap-3">
          <label className="w-24 text-sm font-medium text-gray-700">
            最大重量 (kg)
          </label>
          <input
            type="number"
            min={1}
            step={0.1}
            value={boxConstraint.maxWeight}
            onChange={(e) =>
              setBoxConstraint({ maxWeight: Number(e.target.value) })
            }
            className="min-w-0 flex-1 rounded border border-gray-300 px-3 py-1.5 text-right text-sm"
          />
        </div>
        <div className="flex items-center gap-3">
          <label className="w-24 text-sm font-medium text-gray-700">
            纸箱厚度 (mm)
          </label>
          <input
            type="number"
            min={0}
            step={0.5}
            value={boxConstraint.wallThickness}
            onChange={(e) =>
              setBoxConstraint({ wallThickness: Number(e.target.value) })
            }
            className="min-w-0 flex-1 rounded border border-gray-300 px-3 py-1.5 text-right text-sm"
          />
        </div>

        {/* 装箱余量 — 可折叠 */}
        <div className="border-t border-gray-100 pt-2">
          <button
            type="button"
            onClick={() => setShowClearance(!showClearance)}
            className="flex w-full items-center justify-between text-xs font-medium text-gray-500 hover:text-gray-700"
          >
            装箱余量设置（高级）
            <span className="ml-1">{showClearance ? '▲' : '▼'}</span>
          </button>
          {showClearance && (
            <div className="mt-2 space-y-2">
              <div className="flex items-center gap-3">
                <label className="w-24 text-sm font-medium text-gray-500">
                  长度余量 (mm)
                </label>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={boxConstraint.clearanceL}
                  onChange={(e) =>
                    setBoxConstraint({ clearanceL: Number(e.target.value) })
                  }
                  className="min-w-0 flex-1 rounded border border-gray-300 px-3 py-1.5 text-right text-sm"
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="w-24 text-sm font-medium text-gray-500">
                  宽度余量 (mm)
                </label>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={boxConstraint.clearanceW}
                  onChange={(e) =>
                    setBoxConstraint({ clearanceW: Number(e.target.value) })
                  }
                  className="min-w-0 flex-1 rounded border border-gray-300 px-3 py-1.5 text-right text-sm"
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="w-24 text-sm font-medium text-gray-500">
                  高度余量 (mm)
                </label>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={boxConstraint.clearanceH}
                  onChange={(e) =>
                    setBoxConstraint({ clearanceH: Number(e.target.value) })
                  }
                  className="min-w-0 flex-1 rounded border border-gray-300 px-3 py-1.5 text-right text-sm"
                />
              </div>
            </div>
          )}
        </div>
        {/* 用户指定装箱数量 — 可折叠 */}
        <div className="border-t border-gray-100 pt-2">
          <button
            type="button"
            onClick={() => setShowUserCount(!showUserCount)}
            className="flex w-full items-center justify-between text-xs font-medium text-gray-500 hover:text-gray-700"
          >
            指定每箱数量（可选）
            <span className="ml-1">{showUserCount ? '▲' : '▼'}</span>
          </button>
          {showUserCount && (
            <div className="mt-2">
              <div className="flex items-center gap-3">
                <label className="w-24 text-sm font-medium text-gray-500">
                  每箱纸盒数
                </label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={boxConstraint.userBoxCount ?? ''}
                  placeholder="留空则自动计算"
                  onChange={(e) =>
                    setBoxConstraint({ userBoxCount: e.target.value ? Number(e.target.value) : undefined })
                  }
                  className="min-w-0 flex-1 rounded border border-gray-300 px-3 py-1.5 text-right text-sm"
                />
              </div>
              <p className="mt-1 text-[11px] text-gray-400 leading-tight">
                填写后程序将只输出该数量的装箱方案，留空则按规则自动优化。
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
