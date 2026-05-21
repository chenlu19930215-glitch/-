// ============================================================
// 纸盒→纸箱优化引擎（Boxing Algorithm）
// ============================================================
//
// 算法步骤：
//   Step 1 — 生成纸盒 6 种朝向
//   Step 2 — 枚举各方向数量组合（每方向 ≤ 15）
//   Step 3 — 过滤（外尺寸、毛重、体积利用率 ≥ 70%）
//   Step 4 — 评分（体积利用率×0.5 + 规整度×0.3 + 重量分×0.2）
//   Step 5 — 按综合分降序排列
// ============================================================

import type { CartonDim, BoxConstraint, Orientation, BoxingSolution } from './types'
import { DEFAULT_BOX_CONSTRAINT } from './types'

// ---- Options -------------------------------------------------

export interface BoxingOptions {
  /** 单个纸盒重量 (kg)，默认 0.5 */
  singleCartonWeightKg?: number
}

// ---- Constants -----------------------------------------------

const DEFAULT_SINGLE_CARTON_WEIGHT_KG = 0.5
const MAX_COUNT_PER_DIM = 15
const MAX_CARTON_LAYERS_HEIGHT = 2
const MIN_VOLUME_UTILIZATION = 0.7

// ---- Scoring weights -----------------------------------------

const SCORE_WEIGHT_VOLUME = 0.4
const SCORE_WEIGHT_REGULARITY = 0.2
const SCORE_WEIGHT_WEIGHT = 0.4

// ---- Step 1: Orientation generation ---------------------------

/**
 * 生成纸盒的 6 种朝向（长宽高的全排列）。
 */
export function generateOrientations(carton: CartonDim): Orientation[] {
  const { length, width, height } = carton

  const permutations: Array<{ dims: [number, number, number]; label: string }> = [
    { dims: [length, width, height], label: 'L×W×H (original)' },
    { dims: [length, height, width], label: 'L×H×W' },
    { dims: [width, length, height], label: 'W×L×H' },
    { dims: [width, height, length], label: 'W×H×L' },
    { dims: [height, length, width], label: 'H×L×W' },
    { dims: [height, width, length], label: 'H×W×L' },
  ]

  return permutations.map(({ dims: [l, w, h], label }) => ({ l, w, h, label }))
}

// ---- Step 2-5: Main optimization loop -------------------------

/**
 * 搜索最优装箱方案。
 *
 * @param carton     纸盒原始尺寸
 * @param constraint 纸箱约束（默认值见 DEFAULT_BOX_CONSTRAINT）
 * @param options    可选参数（单盒重量等）
 * @returns          按综合评分降序排列的所有可行方案
 */
export function findOptimalBoxing(
  carton: CartonDim,
  constraint: BoxConstraint = DEFAULT_BOX_CONSTRAINT,
  options: BoxingOptions = {},
): BoxingSolution[] {
  const singleCartonWeightKg =
    options.singleCartonWeightKg ?? DEFAULT_SINGLE_CARTON_WEIGHT_KG

  const { wallThickness, clearanceL, clearanceW, clearanceH, maxOuterDim, maxWeight } = constraint

  // 纸盒原始体积（与朝向无关）
  const cartonVolume = carton.length * carton.width * carton.height

  // 纸箱内尺寸上限 = 外尺寸上限 - 两侧壁厚
  const maxInnerDim = maxOuterDim - 2 * wallThickness

  const orientations = generateOrientations(carton)
  const solutions: BoxingSolution[] = []

  for (const orientation of orientations) {
    // 该朝向下各方向的最大数量（受外尺寸 + 15 上限双重约束）
    const maxL = Math.min(
      MAX_COUNT_PER_DIM,
      Math.floor((maxInnerDim - clearanceL) / orientation.l),
    )
    const maxW = Math.min(
      MAX_COUNT_PER_DIM,
      Math.floor((maxInnerDim - clearanceW) / orientation.w),
    )
    const maxH = Math.min(
      MAX_COUNT_PER_DIM,
      Math.floor((maxInnerDim - clearanceH) / orientation.h),
    )

    // 任一方向连 1 个纸盒都放不下 → 跳过该朝向
    if (maxL < 1 || maxW < 1 || maxH < 1) continue

    for (let nl = 1; nl <= maxL; nl++) {
      for (let nw = 1; nw <= maxW; nw++) {
        // Count along height is constrained by both maxH and weight limit.
        // Compute max height count from weight: floor(maxWeight / (nl * nw * singleCartonWeightKg))
        // This avoids iterating nh values that would always exceed the weight limit.
        const maxNHFromWeight = Math.floor(
          maxWeight / (nl * nw * singleCartonWeightKg),
        )
        const nhLimit = Math.min(maxH, maxNHFromWeight, MAX_CARTON_LAYERS_HEIGHT)

        for (let nh = 1; nh <= nhLimit; nh++) {
          const totalCount = nl * nw * nh

          // 用户指定数量模式：只接受精确匹配
          if (constraint.userBoxCount && totalCount !== constraint.userBoxCount) continue

          const grossWeight = totalCount * singleCartonWeightKg

          // ---- Filter: weight ----
          if (grossWeight > maxWeight) continue

          // ---- Compute inner dimensions ----
          // Inner = count × cartonDim + per-direction clearance
          const innerL = nl * orientation.l + clearanceL
          const innerW = nw * orientation.w + clearanceW
          const innerH = nh * orientation.h + clearanceH

          // ---- Compute volume utilization ----
          const innerVolume = innerL * innerW * innerH
          const volumeUtilization = (cartonVolume * totalCount) / innerVolume

          // ---- Filter: volume utilization >= 70% ----
          if (volumeUtilization < MIN_VOLUME_UTILIZATION) continue

          // ---- Compute outer dimensions ----
          const outerL = innerL + 2 * wallThickness
          const outerW = innerW + 2 * wallThickness
          const outerH = innerH + 2 * wallThickness

          // ---- Score ----
          // 规整度：仅看水平两维（长、宽），短边/长边，1:1 为最佳
          const regularity = Math.max(outerL, outerW) > 0
            ? Math.min(outerL, outerW) / Math.max(outerL, outerW)
            : 0

          // 重量评分：越重越高分（纸箱装得更满），不超过上限
          const weightScore = maxWeight > 0 ? grossWeight / maxWeight : 0

          const score =
            SCORE_WEIGHT_VOLUME * volumeUtilization +
            SCORE_WEIGHT_REGULARITY * regularity +
            SCORE_WEIGHT_WEIGHT * weightScore

          solutions.push({
            orientation: { ...orientation },
            counts: [nl, nw, nh],
            totalCount,
            innerDim: { length: innerL, width: innerW, height: innerH },
            outerDim: { length: outerL, width: outerW, height: outerH },
            grossWeight,
            volumeUtilization,
            regularity,
            weightScore,
            score,
          })
        }
      }
    }
  }

  // ---- Step 5: Sort by score descending ----
  solutions.sort((a, b) => b.score - a.score)
  return solutions
}
