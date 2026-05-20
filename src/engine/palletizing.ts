// ============================================================
// 纸箱→托盘码垛优化引擎（Palletizing Algorithm）
// ============================================================
//
// 算法步骤：
//   Step 1 — 测试两种托盘朝向
//   Step 2 — 计算层数（高度约束 & 重量约束）
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

// ---- Main algorithm ------------------------------------------

/**
 * 搜索最优码垛方案。
 *
 * 测试两种箱体朝向，计算每层排布、可堆叠层数（高度/重量双重约束），
 * 返回所有有效方案按面积利用率降序排列。
 *
 * @param boxOuter   纸箱外尺寸 (length × width × height)
 * @param pallet     托盘尺寸
 * @param constraint 托盘码垛约束（默认值见 DEFAULT_PALLET_CONSTRAINT）
 * @param options    可选参数（单箱重量、每箱产品数等）
 * @returns          按面积利用率降序排列的所有可行方案（0、1 或 2 个）
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

  // ---- Step 1: Test two pallet orientations -------------------
  //
  //   Orientation A: box length aligns with pallet length (no rotation)
  //   Orientation B: box length aligns with pallet width  (rotated 90°)

  const orientationConfigs: Array<{
    /** Box dimension that aligns with pallet length */
    bLenOnPallet: number
    /** Box dimension that aligns with pallet width */
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

    // Overhang can be negative (safe inset) or positive (unsafe projection)
    const overhangLength = (alongLength * bLen - palletL) / 2
    const overhangWidth  = (alongWidth  * bWid - palletW) / 2

    // Filter: both overhangs must be within the allowed limit
    if (overhangLength > maxOverhang || overhangWidth > maxOverhang) continue

    const areaUtilization =
      (boxesPerLayer * boxL * boxW) / (palletL * palletW)

    // ---- Step 2: Calculate layers -----------------------------

    // Height constraint: how many whole box heights fit in the usable height
    const maxLayersByHeight = Math.max(
      0,
      Math.floor((maxHeight - palletH) / boxH),
    )

    // Weight constraint: total weight of one full layer × layers ≤ maxWeight
    const maxLayersByWeight = Math.max(
      0,
      Math.floor(maxWeight / (boxesPerLayer * singleBoxWeightKg)),
    )

    const layers = Math.min(maxLayersByHeight, maxLayersByWeight)
    if (layers < 1) continue

    const totalBoxes  = boxesPerLayer * layers
    const totalHeight = palletH + layers * boxH
    const totalProducts = totalBoxes * productsPerBox

    // ---- Step 3: Volume utilization ---------------------------
    //
    //   cargoVolume      = totalBoxes × boxL × boxW × boxH
    //   palletVolumeBase = palletL × palletW × totalLoadHeight
    //                       where totalLoadHeight = layers × boxH
    //                     (cargo height only, not including pallet base)
    //   volumeUtilization = cargoVolume / palletVolumeBase
    //
    // For simple column stacking, this simplifies to areaUtilization.

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

  // Sort by areaUtilization descending
  solutions.sort((a, b) => b.layout.areaUtilization - a.layout.areaUtilization)
  return solutions
}
