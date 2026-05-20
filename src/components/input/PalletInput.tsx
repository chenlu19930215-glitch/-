import { useInputStore } from '../../store/inputStore'

export default function PalletInput() {
  const { pallet, palletConstraint, setPallet, setPalletConstraint } =
    useInputStore()

  return (
    <section>
      <h3 className="mb-3 text-sm font-semibold text-gray-800">托盘尺寸</h3>
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <label className="w-24 text-sm font-medium text-gray-700">长度 (mm)</label>
          <input
            type="number"
            min={1}
            step={1}
            value={pallet.length}
            onChange={(e) => setPallet({ length: Number(e.target.value) })}
            className="min-w-0 flex-1 rounded border border-gray-300 px-3 py-1.5 text-right text-sm"
          />
        </div>
        <div className="flex items-center gap-3">
          <label className="w-24 text-sm font-medium text-gray-700">宽度 (mm)</label>
          <input
            type="number"
            min={1}
            step={1}
            value={pallet.width}
            onChange={(e) => setPallet({ width: Number(e.target.value) })}
            className="min-w-0 flex-1 rounded border border-gray-300 px-3 py-1.5 text-right text-sm"
          />
        </div>
        <div className="flex items-center gap-3">
          <label className="w-24 text-sm font-medium text-gray-700">高度 (mm)</label>
          <input
            type="number"
            min={1}
            step={1}
            value={pallet.height}
            onChange={(e) => setPallet({ height: Number(e.target.value) })}
            className="min-w-0 flex-1 rounded border border-gray-300 px-3 py-1.5 text-right text-sm"
          />
        </div>
      </div>

      <h3 className="mb-3 mt-5 text-sm font-semibold text-gray-800">码垛约束</h3>
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <label className="w-24 text-sm font-medium text-gray-700">最大高度 (mm)</label>
          <input
            type="number"
            min={1}
            step={1}
            value={palletConstraint.maxHeight}
            onChange={(e) =>
              setPalletConstraint({ maxHeight: Number(e.target.value) })
            }
            className="min-w-0 flex-1 rounded border border-gray-300 px-3 py-1.5 text-right text-sm"
          />
        </div>
        <div className="flex items-center gap-3">
          <label className="w-24 text-sm font-medium text-gray-700">最大重量 (kg)</label>
          <input
            type="number"
            min={1}
            step={1}
            value={palletConstraint.maxWeight}
            onChange={(e) =>
              setPalletConstraint({ maxWeight: Number(e.target.value) })
            }
            className="min-w-0 flex-1 rounded border border-gray-300 px-3 py-1.5 text-right text-sm"
          />
        </div>
      </div>
    </section>
  )
}
