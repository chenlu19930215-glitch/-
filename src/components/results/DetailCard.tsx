import type { CombinedSolution } from '../../engine/types'

interface Props {
  solution: CombinedSolution
}

/** SVG 环形进度条 */
function RingProgress({ pct, label, color }: { pct: number; color: string; label: string }) {
  const r = 28
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - pct)

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={72} height={72}>
        <circle cx={36} cy={36} r={r} fill="none" stroke="#E5E7EB" strokeWidth={5} />
        <circle
          cx={36}
          cy={36}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={5}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform="rotate(-90 36 36)"
          strokeLinecap="round"
        />
        <text x={36} y={36} textAnchor="middle" dominantBaseline="central" className="text-xs font-semibold" fill="currentColor">
          {(pct * 100).toFixed(0)}%
        </text>
      </svg>
      <span className="text-[11px] text-gray-500 whitespace-nowrap">{label}</span>
    </div>
  )
}

export default function DetailCard({ solution }: Props) {
  const { boxing, palletizing } = solution
  const od = boxing.outerDim
  const id = boxing.innerDim

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h4 className="mb-3 text-sm font-semibold text-gray-800">方案详情</h4>

      <div className="flex flex-col gap-6 sm:flex-row">
        {/* 左侧：尺寸对比表 */}
        <div className="flex-1 min-w-0">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-400 uppercase">
                <th className="py-1 text-left" />
                <th className="py-1 text-right">长度(mm)</th>
                <th className="py-1 text-right">宽度(mm)</th>
                <th className="py-1 text-right">高度(mm)</th>
                <th className="py-1 text-right">体积</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-gray-100">
                <td className="py-1.5 text-gray-600">纸盒尺寸</td>
                <td className="py-1.5 text-right">{boxing.orientation.l}</td>
                <td className="py-1.5 text-right">{boxing.orientation.w}</td>
                <td className="py-1.5 text-right">{boxing.orientation.h}</td>
                <td className="py-1.5 text-right">{(boxing.orientation.l * boxing.orientation.w * boxing.orientation.h / 1000).toFixed(1)}cm³</td>
              </tr>
              <tr className="border-t border-gray-100">
                <td className="py-1.5 text-gray-600">纸箱内尺寸</td>
                <td className="py-1.5 text-right">{id.length}</td>
                <td className="py-1.5 text-right">{id.width}</td>
                <td className="py-1.5 text-right">{id.height}</td>
                <td className="py-1.5 text-right">{(id.length * id.width * id.height / 1_000_000).toFixed(1)}L</td>
              </tr>
              <tr className="border-t border-gray-100">
                <td className="py-1.5 text-gray-600">纸箱外尺寸</td>
                <td className="py-1.5 text-right">{od.length}</td>
                <td className="py-1.5 text-right">{od.width}</td>
                <td className="py-1.5 text-right">{od.height}</td>
                <td className="py-1.5 text-right">{(od.length * od.width * od.height / 1_000_000).toFixed(1)}L</td>
              </tr>
            </tbody>
          </table>

          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500">
            <span>毛重: {boxing.grossWeight}kg</span>
            <span>每箱: {boxing.totalCount}个</span>
            <span>每托: {palletizing.totalBoxes}箱 / {palletizing.totalProducts}个</span>
            <span>层数: {palletizing.layout.layers}层</span>
          </div>
        </div>

        {/* 右侧：环形进度 */}
        <div className="flex items-center gap-4 shrink-0">
          <RingProgress pct={palletizing.layout.areaUtilization} color="#3B82F6" label="面积利用率" />
          <RingProgress pct={boxing.volumeUtilization} color="#10B981" label="体积利用率" />
        </div>
      </div>
    </div>
  )
}
