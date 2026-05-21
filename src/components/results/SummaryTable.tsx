import { useComputeStore } from '../../store/computeStore'

export default function SummaryTable() {
  const { results, selectedIndex, selectSolution } = useComputeStore()

  if (results.length === 0) {
    return (
      <section>
        <h3 className="mb-3 text-sm font-semibold text-gray-800">方案汇总</h3>
        <div className="rounded border border-gray-200 p-6 text-center text-sm text-gray-400">
          暂无方案，请调整参数后重新计算
        </div>
      </section>
    )
  }

  return (
    <section>
      <h3 className="mb-3 text-sm font-semibold text-gray-800">方案汇总</h3>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 text-xs font-medium text-gray-500 uppercase">
              <th className="px-3 py-2 text-center">方案</th>
              <th className="px-3 py-2 text-center">码垛模式</th>
              <th className="px-3 py-2 text-center">排列方式(L×W×H)</th>
              <th className="px-3 py-2 text-center">每箱数量</th>
              <th className="px-3 py-2 text-center">纸箱内尺寸</th>
              <th className="px-3 py-2 text-center">每托箱数</th>
              <th className="px-3 py-2 text-center">总产品数</th>
              <th className="px-3 py-2 text-center">体积利用率</th>
              <th className="px-3 py-2 text-center">综合评分</th>
            </tr>
          </thead>
          <tbody>
            {results.map((sol, i) => {
              const isSelected = i === selectedIndex
              return (
                <tr
                  key={i}
                  className={`cursor-pointer border-t border-gray-200 text-sm transition-colors hover:bg-blue-100 ${isSelected ? 'bg-blue-50' : ''}`}
                  onClick={() => selectSolution(i)}
                >
                  <td className="px-3 py-2 text-center font-medium text-gray-900">
                    方案 {i + 1}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      sol.palletizing.layout.pattern === 'row-split-alternating'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {sol.palletizing.layout.pattern === 'row-split-alternating' ? '混合交叠' : '简单堆叠'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center text-gray-900 whitespace-nowrap">
                    {sol.boxing.counts[0]}×{sol.boxing.counts[1]}×{sol.boxing.counts[2]}
                  </td>
                  <td className="px-3 py-2 text-center text-gray-900">
                    {sol.boxing.totalCount}
                  </td>
                  <td className="px-3 py-2 text-center text-gray-900 whitespace-nowrap">
                    {Math.max(sol.boxing.innerDim.length, sol.boxing.innerDim.width)}×{Math.min(sol.boxing.innerDim.length, sol.boxing.innerDim.width)}×{sol.boxing.innerDim.height} mm
                  </td>
                  <td className="px-3 py-2 text-center text-gray-900">
                    {sol.palletizing.totalBoxes}
                  </td>
                  <td className="px-3 py-2 text-center text-gray-900">
                    {sol.palletizing.totalProducts}
                  </td>
                  <td className="px-3 py-2 text-center text-gray-900">
                    {(sol.palletizing.volumeUtilization * 100).toFixed(1)}%
                  </td>
                  <td className="px-3 py-2 text-center text-gray-900">
                    {sol.overallScore.toFixed(2)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
