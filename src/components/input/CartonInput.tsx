import { useInputStore } from '../../store/inputStore'

export default function CartonInput() {
  const { carton, setCarton } = useInputStore()

  return (
    <section>
      <h3 className="mb-3 text-sm font-semibold text-gray-800">纸盒尺寸</h3>
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <label className="w-24 text-sm font-medium text-gray-700">长度 (mm)</label>
          <input
            type="number"
            min={1}
            step={1}
            value={carton.length}
            onChange={(e) => setCarton({ length: Number(e.target.value) })}
            className="min-w-0 flex-1 rounded border border-gray-300 px-3 py-1.5 text-right text-sm"
          />
        </div>
        <div className="flex items-center gap-3">
          <label className="w-24 text-sm font-medium text-gray-700">宽度 (mm)</label>
          <input
            type="number"
            min={1}
            step={1}
            value={carton.width}
            onChange={(e) => setCarton({ width: Number(e.target.value) })}
            className="min-w-0 flex-1 rounded border border-gray-300 px-3 py-1.5 text-right text-sm"
          />
        </div>
        <div className="flex items-center gap-3">
          <label className="w-24 text-sm font-medium text-gray-700">高度 (mm)</label>
          <input
            type="number"
            min={1}
            step={1}
            value={carton.height}
            onChange={(e) => setCarton({ height: Number(e.target.value) })}
            className="min-w-0 flex-1 rounded border border-gray-300 px-3 py-1.5 text-right text-sm"
          />
        </div>
        <div className="flex items-center gap-3">
          <label className="w-24 text-sm font-medium text-gray-700">净重 (kg)</label>
          <input
            type="number"
            min={0}
            step={0.01}
            value={carton.netWeight ?? ''}
            placeholder="选填"
            onChange={(e) =>
              setCarton({ netWeight: e.target.value ? Number(e.target.value) : undefined })
            }
            className="min-w-0 flex-1 rounded border border-gray-300 px-3 py-1.5 text-right text-sm"
          />
        </div>
        <div className="flex items-center gap-3">
          <label className="w-24 text-sm font-medium text-gray-700">毛重 (kg)</label>
          <input
            type="number"
            min={0}
            step={0.01}
            value={carton.grossWeight ?? ''}
            placeholder="选填"
            onChange={(e) =>
              setCarton({ grossWeight: e.target.value ? Number(e.target.value) : undefined })
            }
            className="min-w-0 flex-1 rounded border border-gray-300 px-3 py-1.5 text-right text-sm"
          />
        </div>
      </div>
    </section>
  )
}
