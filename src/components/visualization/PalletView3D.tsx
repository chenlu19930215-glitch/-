import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useMemo } from 'react'
import type { PalletSolution, PalletDim } from '../../engine/types'

const LAYER_COLORS = ['#6B8C3A', '#3D4A5C']
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
  color: string
}

function computeBoxes(config: {
  boxOuter: { length: number; width: number; height: number }
  alongLength: number; alongWidth: number; layers: number; rotated: boolean
  palletHeight: number
}): BoxPos[] {
  const { boxOuter, alongLength, alongWidth, layers, rotated, palletHeight } = config
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
          color: LAYER_COLORS[layer % 2],
        })
      }
    }
  }
  return items
}

function PalletScene({ solution, palletDims }: Props) {
  const palletL = palletDims.length
  const palletW = palletDims.width
  const palletH = palletDims.height

  const boxes = useMemo(() => computeBoxes({
    boxOuter: solution.boxOuter,
    alongLength: solution.layout.alongLength,
    alongWidth: solution.layout.alongWidth,
    layers: solution.layout.layers,
    rotated: solution.layout.rotated,
    palletHeight: palletH,
  }), [solution, palletDims])

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

      {/* 纸箱 */}
      {boxes.map((b, i) => (
        <mesh key={i} position={[b.x, b.y, b.z]} rotation={[0, b.rotY, 0]}>
          <boxGeometry args={[b.boxW * 0.98, b.boxH * 0.98, b.boxD * 0.98]} />
          <meshLambertMaterial color={b.color} />
        </mesh>
      ))}

      <OrbitControls enablePan enableZoom enableRotate />
      <gridHelper args={[Math.max(palletL, palletW) * 0.004, 20, '#CCC', '#CCC']} position={[0, 0, 0]} />
    </>
  )
}

export default function PalletView3D({ solution, palletDims }: Props) {
  const maxDim = Math.max(palletDims.length, palletDims.width, solution.layout.totalHeight) || 1
  const camDist = maxDim * 1.8

  return (
    <div className="w-full overflow-hidden rounded border border-gray-200 bg-gray-50" style={{ height: 400 }}>
      <Canvas camera={{ position: [camDist * 0.8, camDist * 0.6, camDist * 0.8], fov: 40 }}>
        <PalletScene solution={solution} palletDims={palletDims} />
      </Canvas>
      <p className="py-1 text-center text-xs text-gray-400">
        拖拽旋转 · 滚轮缩放 · 右键平移
      </p>
    </div>
  )
}
