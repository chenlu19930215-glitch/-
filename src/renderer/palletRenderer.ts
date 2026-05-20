// ============================================================
// 托盘 3D 渲染 — 辅助类型与工具函数
// ============================================================

export interface PalletRenderConfig {
  palletDim: { length: number; width: number; height: number }
  boxOuter: { length: number; width: number; height: number }
  alongLength: number
  alongWidth: number
  layers: number
  rotated: boolean
}

export interface BoxPosition {
  x: number
  y: number
  z: number
  rotY: number
  /** 几何体 width 参数（对应 boxOuter.length） */
  boxW: number
  /** 几何体 depth 参数（对应 boxOuter.width） */
  boxD: number
  /** 几何体 height 参数（对应 boxOuter.height） */
  boxH: number
  layerIndex: number
}

/** 根据层索引返回箱子颜色 — 奇数层深绿，偶数层深灰蓝 */
export function getBoxColor(layerIndex: number): string {
  return layerIndex % 2 === 1 ? '#6B8C3A' : '#3D4A5C'
}

/**
 * 计算所有箱子的三维位置与旋转。
 * 箱子几何体始终以 [boxOuter.length, boxOuter.height, boxOuter.width]
 * 创建，当 rotated=true 时通过 mesh 绕 Y 轴旋转 90° 实现朝向切换，
 * 同时步长 stepX/stepZ 也相应交换。
 */
export function computeBoxPositions(config: PalletRenderConfig): BoxPosition[] {
  const {
    palletDim,
    boxOuter,
    alongLength,
    alongWidth,
    layers,
    rotated,
  } = config

  const positions: BoxPosition[] = []

  // 沿托盘 X／Z 轴的单箱步长（旋转后交换尺寸）
  const stepX = rotated ? boxOuter.width : boxOuter.length
  const stepZ = rotated ? boxOuter.length : boxOuter.width
  const boxH = boxOuter.height

  // 整层占用的总尺寸（居中摆放）
  const totalX = alongLength * stepX
  const totalZ = alongWidth * stepZ

  const startX = -totalX / 2 + stepX / 2
  const startZ = -totalZ / 2 + stepZ / 2

  for (let layer = 0; layer < layers; layer++) {
    const y = palletDim.height + layer * boxH + boxH / 2

    for (let i = 0; i < alongLength; i++) {
      for (let j = 0; j < alongWidth; j++) {
        positions.push({
          x: startX + i * stepX,
          y,
          z: startZ + j * stepZ,
          rotY: rotated ? Math.PI / 2 : 0,
          boxW: boxOuter.length,
          boxD: boxOuter.width,
          boxH,
          layerIndex: layer,
        })
      }
    }
  }

  return positions
}
