import { Canvas } from '@react-three/fiber'
import { OrbitControls, Text } from '@react-three/drei'
import { useMemo } from 'react'
import type { BoxingSolution } from '../../engine/types'

const CARTON_FACE_COLORS = ['#3B82F6', '#3B82F6', '#FFFFFF', '#FFFFFF', '#EF4444', '#EF4444']
const BOX_WALL_COLOR = '#C8B48A'

interface Props {
  solution: BoxingSolution
}

function CartonScene({ solution }: { solution: BoxingSolution }) {
  const { counts, innerDim } = solution
  const cartonL = solution.orientation.l / 1000
  const cartonW = solution.orientation.w / 1000
  const cartonH = solution.orientation.h / 1000

  const boxW = innerDim.length / 1000
  const boxH = innerDim.height / 1000
  const boxD = innerDim.width / 1000

  const cartons = useMemo(() => {
    const items = []
    for (let l = 0; l < counts[0]; l++) {
      for (let w = 0; w < counts[1]; w++) {
        for (let h = 0; h < counts[2]; h++) {
          items.push({
            position: [
              (l + 0.5) * cartonL - (counts[0] * cartonL) / 2,
              (h + 0.5) * cartonH - (counts[2] * cartonH) / 2,
              (w + 0.5) * cartonW - (counts[1] * cartonW) / 2,
            ] as [number, number, number],
            size: [cartonL * 0.97, cartonH * 0.97, cartonW * 0.97] as [number, number, number],
          })
        }
      }
    }
    return items
  }, [solution])

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 5, 3]} intensity={0.8} />
      <directionalLight position={[-2, 3, -2]} intensity={0.3} />

      {cartons.map((c, i) => (
        <mesh key={i} position={c.position}>
          <boxGeometry args={c.size} />
          {CARTON_FACE_COLORS.map((color, mi) => (
            <meshLambertMaterial key={mi} attach={`material-${mi}`} color={color} />
          ))}
        </mesh>
      ))}

      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[boxW, boxH, boxD]} />
        <meshLambertMaterial color={BOX_WALL_COLOR} transparent opacity={0.12} side={2} />
      </mesh>

      <Text position={[boxW / 2 + 0.03, 0, 0]} fontSize={0.035} color="#333" anchorX="left">
        L
      </Text>
      <Text position={[0, boxH / 2 + 0.03, 0]} fontSize={0.035} color="#333" anchorX="left">
        H
      </Text>
      <Text position={[0, 0, boxD / 2 + 0.03]} fontSize={0.035} color="#333" anchorX="left">
        W
      </Text>

      <OrbitControls enablePan enableZoom enableRotate />
      <gridHelper args={[2, 20, '#DDD', '#DDD']} position={[0, -boxH / 2, 0]} />
    </>
  )
}

export default function CartonView3D({ solution }: Props) {
  const boxW = solution.innerDim.length / 1000
  const boxH = solution.innerDim.height / 1000
  const boxD = solution.innerDim.width / 1000
  const maxDim = Math.max(boxW, boxH, boxD) || 1
  const camDist = maxDim * 2.2

  return (
    <div className="w-full overflow-hidden rounded border border-gray-200 bg-gray-50" style={{ height: 360 }}>
      <Canvas gl={{ preserveDrawingBuffer: true }} camera={{ position: [camDist * 0.7, camDist * 0.5, camDist * 0.7], fov: 40 }}>
        <CartonScene solution={solution} />
      </Canvas>
      <p className="py-1 text-center text-xs text-gray-400">
        拖拽旋转 · 滚轮缩放 · 右键平移
      </p>
    </div>
  )
}
