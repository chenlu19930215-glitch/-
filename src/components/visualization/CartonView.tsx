import { useComputeStore } from '../../store/computeStore'
import CartonView3D from './CartonView3D'

export default function CartonView() {
  const results = useComputeStore((s) => s.results)
  const selectedIndex = useComputeStore((s) => s.selectedIndex)

  const solution =
    selectedIndex >= 0 && selectedIndex < results.length
      ? results[selectedIndex]
      : null

  if (!solution) {
    return (
      <section>
        <h3 className="mb-3 text-sm font-semibold text-gray-800">纸箱 3D 视图</h3>
        <div
          className="flex items-center justify-center rounded border border-gray-200 bg-gray-50"
          style={{ height: 400 }}
        >
          <p className="text-sm text-gray-400">请先计算方案</p>
        </div>
      </section>
    )
  }

  return (
    <section>
      <h3 className="mb-3 text-sm font-semibold text-gray-800">
        纸箱 3D 视图
        <span className="ml-2 text-xs font-normal text-gray-400">
          {solution.boxing.totalCount}个/箱 &middot;{' '}
          {solution.boxing.orientation.label}
        </span>
      </h3>
      <CartonView3D solution={solution.boxing} />
    </section>
  )
}
