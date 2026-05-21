// ============================================================
// 纸箱→托盘码垛优化引擎（Palletizing Algorithm）
// ============================================================
//
// 算法步骤：
//   Step 1 — 测试两种托盘朝向（column 简单堆叠）
//   Step 2 — 测试交替混合层（alternating row-split）
//   Step 3 — 按面积利用率降序排列
// ============================================================

import type { PalletDim, PalletConstraint, PalletSolution } from './types'
import { DEFAULT_PALLET_CONSTRAINT } from './types'

// ---- Options -------------------------------------------------

export interface PalletizingOptions {
  /** 单箱重量 (kg)，默认 5 */
  singleBoxWeightKg?: number
  /** 每箱产品数，默认 1 */
  productsPerBox?: number
}

// ---- Constants -----------------------------------------------

const DEFAULT_SINGLE_BOX_WEIGHT_KG = 5
const DEFAULT_PRODUCTS_PER_BOX = 1

// ---- Row-split helper ----------------------------------------

/**
 * 尝试交替混合层排列（alternating row-split）。
 *
 * 同一层内分为两个正交区域：
 *   Region A: W×L 朝向（箱宽沿托盘长方向），cntA = floor(palletL / boxW)
 *   Region B: L×W 朝向（箱长沿托盘长方向），cntB = floor(palletL / boxL)
 *   条件：boxL + boxW ≤ palletW（两排宽度之和不超过托盘宽）
 *   每层总箱数：cntA + cntB
 *
 * 偶数层做 180° 水平旋转（绕 Y 轴），由 3D 视图层处理。
 */
function tryAlternatingRowSplitPattern(
  boxL: number, boxW: number, boxH: number,
  palletL: number, palletW: number, palletH: number,
  maxHeight: number, maxWeight: number,
  singleBoxWeightKg: number, productsPerBox: number,
): PalletSolution | null {
  const cntA = Math.floor(palletL / boxW)
  const cntB = Math.floor(palletL / boxL)
  if (cntA < 1 || cntB < 1) return null

  // Region A depth = boxL, Region B depth = boxW
  if (boxL + boxW > palletW) return null

  const boxesPerLayer = cntA + cntB

  // 面积利用率：所有箱底面积之和 / 托盘面积
  const areaUtilization = (boxesPerLayer * boxL * boxW) / (palletL * palletW)

  // 层数（高度约束）
  const maxLayersByHeight = Math.max(0, Math.floor((maxHeight - palletH) / boxH))
  const maxLayersByWeight = Math.max(0, Math.floor(maxWeight / (boxesPerLayer * singleBoxWeightKg)))
  const layers = Math.min(maxLayersByHeight, maxLayersByWeight)
  if (layers < 1) return null

  const totalBoxes = boxesPerLayer * layers
  const totalHeight = palletH + layers * boxH
  const totalProducts = totalBoxes * productsPerBox

  // 体积利用率
  const cargoVolume = totalBoxes * boxL * boxW * boxH
  const palletVolumeBasis = palletL * palletW * (layers * boxH)
  const volumeUtilization = cargoVolume / palletVolumeBasis

  // 悬垂量（取 A/B 两排中占满宽度的最大值）
  const spanA = cntA * boxW
  const spanB = cntB * boxL
  const maxSpan = Math.max(spanA, spanB)
  const overhangLength = (maxSpan - palletL) / 2
  const overhangWidth = (boxL + boxW - palletW) / 2

  return {
    boxOuter: { length: boxL, width: boxW, height: boxH },
    layout: {
      alongLength: Math.max(cntA, cntB),
      alongWidth: 2,
      boxesPerLayer,
      layers,
      overhangLength,
      overhangWidth,
      areaUtilization,
      totalHeight,
      rotated: false,
      pattern: 'row-split-alternating',
      rowSplitCountA: cntA,
      rowSplitCountB: cntB,
    },
    totalBoxes,
    totalProducts,
    volumeUtilization,
  }
}

// ---- Main algorithm ------------------------------------------

/**
 * 搜索最优码垛方案。
 *
 * 测试 column（简单堆叠）和 alternating row-split（交替混合层）两种模式，
 * 返回所有有效方案按面积利用率降序排列。
 *
 * @param boxOuter   纸箱外尺寸 (length × width × height)
 * @param pallet     托盘尺寸
 * @param constraint 托盘码垛约束（默认值见 DEFAULT_PALLET_CONSTRAINT）
 * @param options    可选参数（单箱重量、每箱产品数等）
 * @returns          按面积利用率降序排列的所有可行方案
 */
export function findOptimalPalletizing(
  boxOuter: { length: number; width: number; height: number },
  pallet: PalletDim,
  constraint: PalletConstraint = DEFAULT_PALLET_CONSTRAINT,
  options: PalletizingOptions = {},
): PalletSolution[] {
  const singleBoxWeightKg =
    options.singleBoxWeightKg ?? DEFAULT_SINGLE_BOX_WEIGHT_KG
  const productsPerBox = options.productsPerBox ?? DEFAULT_PRODUCTS_PER_BOX

  const { maxHeight, maxWeight, maxOverhang } = constraint
  const { length: palletL, width: palletW, height: palletH } = pallet
  const { length: boxL, width: boxW, height: boxH } = boxOuter

  const solutions: PalletSolution[] = []

  // ---- Step 1: Column stacking (two orientations) -------------

  const orientationConfigs: Array<{
    bLenOnPallet: number
    bWidOnPallet: number
    rotated: boolean
  }> = [
    { bLenOnPallet: boxL, bWidOnPallet: boxW, rotated: false },
    { bLenOnPallet: boxW, bWidOnPallet: boxL, rotated: true  },
  ]

  for (const config of orientationConfigs) {
    const bLen = config.bLenOnPallet
    const bWid = config.bWidOnPallet

    const alongLength = Math.floor(palletL / bLen)
    const alongWidth  = Math.floor(palletW / bWid)

    if (alongLength < 1 || alongWidth < 1) continue

    const boxesPerLayer = alongLength * alongWidth

    const overhangLength = (alongLength * bLen - palletL) / 2
    const overhangWidth  = (alongWidth  * bWid - palletW) / 2

    if (overhangLength > maxOverhang || overhangWidth > maxOverhang) continue

    const areaUtilization =
      (boxesPerLayer * boxL * boxW) / (palletL * palletW)

    const maxLayersByHeight = Math.max(0, Math.floor((maxHeight - palletH) / boxH))
    const maxLayersByWeight = Math.max(0, Math.floor(maxWeight / (boxesPerLayer * singleBoxWeightKg)))
    const layers = Math.min(maxLayersByHeight, maxLayersByWeight)
    if (layers < 1) continue

    const totalBoxes  = boxesPerLayer * layers
    const totalHeight = palletH + layers * boxH
    const totalProducts = totalBoxes * productsPerBox

    const totalLoadHeight = layers * boxH
    const palletVolumeBasis = palletL * palletW * totalLoadHeight
    const cargoVolume = totalBoxes * boxL * boxW * boxH
    const volumeUtilization = cargoVolume / palletVolumeBasis

    solutions.push({
      boxOuter: { length: boxL, width: boxW, height: boxH },
      layout: {
        alongLength,
        alongWidth,
        boxesPerLayer,
        layers,
        overhangLength,
        overhangWidth,
        areaUtilization,
        totalHeight,
        rotated: config.rotated,
      },
      totalBoxes,
      totalProducts,
      volumeUtilization,
    })
  }

  // ---- Step 2: Alternating row-split pattern ------------------

  const rsResult = tryAlternatingRowSplitPattern(
    boxL, boxW, boxH,
    palletL, palletW, palletH,
    maxHeight, maxWeight,
    singleBoxWeightKg, productsPerBox,
  )
  if (rsResult) solutions.push(rsResult)

  // ---- Step 3: Sort by areaUtilization descending -------------

  solutions.sort((a, b) => b.layout.areaUtilization - a.layout.areaUtilization)
  return solutions
}
