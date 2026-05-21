import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useMemo } from 'react'
import type { PalletSolution, PalletDim } from '../../engine/types'

const PALLET_COLOR = '#D4B854'
const PALLET_LEG_COLOR = '#B8963E'

interface Props {
  solution: PalletSolution
  palletDims: PalletDim
}

interface BoxPos {
  x: number; y: number; z: number
  boxW: number; boxH: number; boxD: number
  rotY: number
  region: 'A' | 'B'
}

function computeColumnPositions(
  boxOuter: { length: number; width: number; height: number },
  alongLength: number, alongWidth: number, layers: number,
  rotated: boolean, palletHeight: number,
): BoxPos[] {
  const items: BoxPos[] = []
  const stepX = rotated ? boxOuter.width : boxOuter.length
  const stepZ = rotated ? boxOuter.length : boxOuter.width
  const totalX = alongLength * stepX
  const totalZ = alongWidth * stepZ
  const startX = -totalX / 2 + stepX / 2
  const startZ = -totalZ / 2 + stepZ / 2

  for (let layer = 0; layer < layers; layer++) {
    const y = palletHeight + layer * boxOuter.height + boxOuter.height / 2
    for (let i = 0; i < alongLength; i++) {
      for (let j = 0; j < alongWidth; j++) {
        items.push({
          x: startX + i * stepX,
          y,
          z: startZ + j * stepZ,
          rotY: rotated ? Math.PI / 2 : 0,
          boxW: boxOuter.length,
          boxD: boxOuter.width,
          boxH: boxOuter.height,
          region: rotated ? 'A' : 'B',
        })
      }
    }
  }
  return items
}

function computeRowSplitPositions(
  boxL: number, boxW: number, boxH: number,
  layers: number, palletHeight: number,
  rowSplitCountA: number, rowSplitCountB: number,
  altCountA?: number, altCountB?: number,
): BoxPos[] {
  const items: BoxPos[] = []

  for (let layer = 0; layer < layers; layer++) {
    const useAlt = altCountA !== undefined && layer % 2 === 1
    const cntA = useAlt ? altCountA! : rowSplitCountA
    const cntB = useAlt ? altCountB! : rowSplitCountB
    const y = palletHeight + layer * boxH + boxH / 2

    // 取两排各自宽度的最大值，以较宽那排为基准两端对齐
    const spanA = cntA * boxW
    const spanB = cntB * boxL
    const maxSpan = Math.max(spanA, spanB)
    const startX = -maxSpan / 2

    // 交替层做 180° 水平旋转（绕 Y 轴）：Region A/B 前后互换
    const regionAZ = useAlt ? boxW / 2 : -boxW / 2
    const regionBZ = useAlt ? -boxL / 2 : boxL / 2

    // Region A: W×L 朝向，不旋转，boxW 沿 x 轴，boxL 沿 z 轴
    const gapA = cntA > 1 ? (maxSpan - spanA) / (cntA - 1) : 0
    for (let i = 0; i < cntA; i++) {
      items.push({
        x: startX + i * (boxW + gapA) + boxW / 2,
        y,
        z: regionAZ,
        rotY: 0,
        boxW: boxW,
        boxD: boxL,
        boxH,
        region: 'A',
      })
    }

    // Region B: L×W 朝向，不旋转，boxL 沿 x 轴，boxW 沿 z 轴
    const gapB = cntB > 1 ? (maxSpan - spanB) / (cntB - 1) : 0
    for (let i = 0; i < cntB; i++) {
      items.push({
        x: startX + i * (boxL + gapB) + boxL / 2,
        y,
        z: regionBZ,
        rotY: 0,
        boxW: boxL,
        boxD: boxW,
        boxH,
        region: 'B',
      })
    }
  }
  return items
}

function PalletScene({ solution, palletDims }: Props) {
  const palletL = palletDims.length
  const palletW = palletDims.width
  const palletH = palletDims.height

  const boxes = useMemo(() => {
    const { layout, boxOuter } = solution
    if (layout.pattern === 'row-split' || layout.pattern === 'row-split-alternating') {
      return computeRowSplitPositions(
        boxOuter.length, boxOuter.width, boxOuter.height,
        layout.layers, palletH,
        layout.rowSplitCountA!, layout.rowSplitCountB!,
        layout.altRowSplitCountA,
        layout.altRowSplitCountB,
      )
    }
    return computeColumnPositions(
      boxOuter,
      layout.alongLength, layout.alongWidth, layout.layers,
      layout.rotated, palletH,
    )
  }, [solution, palletDims])

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 6, 4]} intensity={0.9} />
      <directionalLight position={[-3, 4, -3]} intensity={0.25} />

      {/* 托盘板面 */}
      <mesh position={[0, palletH / 2, 0]}>
        <boxGeometry args={[palletL, palletH, palletW]} />
        <meshLambertMaterial color={PALLET_COLOR} />
      </mesh>

      {/* 托盘腿 3×3 */}
      {[-1, 0, 1].flatMap(xi =>
        [-1, 0, 1].map(zi => (
          <mesh key={`${xi}_${zi}`} position={[xi * palletL / 3, palletH * 0.3, zi * palletW / 3]}>
            <boxGeometry args={[palletL / 5, palletH * 0.6, palletW / 5]} />
            <meshLambertMaterial color={PALLET_LEG_COLOR} />
          </mesh>
        ))
      )}

      {/* 纸箱 — 颜色区分朝向：绿色=纸箱长度方向，灰色=纸箱宽度方向 */}
      {boxes.map((b, i) => {
        // Region A: W×L 朝向 (boxW 沿 x, boxL 沿 z → x面灰, z面绿)
        // Region B/col: L×W 朝向 (boxL 沿 x, boxW 沿 z → x面绿, z面灰)
        const faceColors = b.region === 'A'
          ? ['#93C5FD', '#93C5FD', '#FFFFFF', '#FFFFFF', '#22C55E', '#22C55E']
          : ['#22C55E', '#22C55E', '#FFFFFF', '#FFFFFF', '#93C5FD', '#93C5FD']
        return (
          <mesh key={i} position={[b.x, b.y, b.z]} rotation={[0, b.rotY, 0]}>
            <boxGeometry args={[b.boxW * 0.98, b.boxH * 0.98, b.boxD * 0.98]} />
            {faceColors.map((c, mi) => (
              <meshLambertMaterial key={mi} attach={`material-${mi}`} color={c} />
            ))}
          </mesh>
        )
      })}

      <OrbitControls enablePan enableZoom enableRotate />
      <gridHelper args={[Math.max(palletL, palletW) * 1.5, 20, '#CCC', '#CCC']} position={[0, 0, 0]} />
    </>
  )
}

export default function PalletView3D({ solution, palletDims }: Props) {
  const maxDim = Math.max(palletDims.length, palletDims.width, solution.layout.totalHeight) || 1
  const camDist = maxDim * 1.8

  return (
    <div className="w-full overflow-hidden rounded border border-gray-200 bg-gray-50" style={{ height: 400 }}>
      <Canvas gl={{ preserveDrawingBuffer: true }} camera={{ position: [camDist * 0.8, camDist * 0.6, camDist * 0.8], fov: 40, far: 10000 }}>
        <PalletScene solution={solution} palletDims={palletDims} />
      </Canvas>
      <p className="py-1 text-center text-xs text-gray-400">
        拖拽旋转 · 滚轮缩放 · 右键平移
      </p>
    </div>
  )
}
