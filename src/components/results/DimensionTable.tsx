import { useComputeStore } from '../../store/computeStore'
import { useInputStore } from '../../store/inputStore'

export default function DimensionTable() {
  const { results, selectedIndex } = useComputeStore()
  const { carton, boxConstraint, pallet } = useInputStore()

  const sol =
    selectedIndex >= 0 && selectedIndex < results.length
      ? results[selectedIndex]
      : null

  return (
    <section>
      <h3 className="mb-3 text-sm font-semibold text-gray-800">详细尺寸</h3>
      {!sol ? (
        <div className="rounded border border-gray-200 p-6 text-center text-sm text-gray-400">
          暂无数据
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-200">
            <thead>
              <tr className="bg-gray-50 text-xs font-medium text-gray-500 uppercase">
                <th className="border-r border-gray-200 px-3 py-2 text-left">参数</th>
                <th className="px-3 py-2 text-right">数值</th>
              </tr>
            </thead>
            <tbody>
              <Row label="纸盒尺寸" value={`${carton.length}×${carton.width}×${carton.height} mm`} />
              <Row label="纸箱内尺寸" value={`${sol.boxing.innerDim.length}×${sol.boxing.innerDim.width}×${sol.boxing.innerDim.height} mm`} />
              <Row label="纸箱外尺寸" value={`${sol.boxing.outerDim.length}×${sol.boxing.outerDim.width}×${sol.boxing.outerDim.height} mm`} />
              <Row label="纸箱壁厚" value={`${boxConstraint.wallThickness} mm`} />
              <Row label="每箱纸盒数" value={String(sol.boxing.totalCount)} />
              <Row label="纸箱毛重" value={`${sol.boxing.grossWeight.toFixed(1)} kg`} />
              <Row label="纸箱体积利用率" value={`${(sol.boxing.volumeUtilization * 100).toFixed(1)}%`} />
              <Row label="托盘尺寸" value={`${pallet.length}×${pallet.width}×${pallet.height} mm`} />
              <Row label="每层箱数" value={String(sol.palletizing.layout.boxesPerLayer)} />
              <Row label="堆叠层数" value={String(sol.palletizing.layout.layers)} />
              <Row label="每托总箱数" value={String(sol.palletizing.totalBoxes)} />
              <Row label="托盘面积利用率" value={`${(sol.palletizing.layout.areaUtilization * 100).toFixed(1)}%`} />
              <Row label="托盘体积利用率" value={`${(sol.palletizing.volumeUtilization * 100).toFixed(1)}%`} />
              <Row label="负载总高度" value={`${sol.palletizing.layout.totalHeight.toFixed(1)} mm`} />
              <Row label="悬垂量(长)" value={`${sol.palletizing.layout.overhangLength.toFixed(1)} mm`} />
              <Row label="悬垂量(宽)" value={`${sol.palletizing.layout.overhangWidth.toFixed(1)} mm`} />
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr className="border-t border-gray-200 text-sm">
      <td className="border-r border-gray-200 px-3 py-2 text-gray-500">{label}</td>
      <td className="px-3 py-2 text-right text-gray-900 whitespace-nowrap">{value}</td>
    </tr>
  )
}
