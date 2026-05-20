import { useComputeStore } from '../../store/computeStore'
import { useInputStore } from '../../store/inputStore'
import PalletView3D from './PalletView3D'

export default function PalletView() {
  const { results, selectedIndex } = useComputeStore()
  const pallet = useInputStore((s) => s.pallet)

  const solution =
    selectedIndex >= 0 && selectedIndex < results.length
      ? results[selectedIndex]
      : null

  if (!solution) {
    return (
      <section>
        <h3 className="mb-3 text-sm font-semibold text-gray-800">托盘 3D 视图</h3>
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
      <h3 className="mb-3 text-sm font-semibold text-gray-800">托盘 3D 视图</h3>
      <PalletView3D solution={solution.palletizing} palletDims={pallet} />
    </section>
  )
}
