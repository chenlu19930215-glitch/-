// ============================================================
// 纸盒→纸箱→托盘 全链路优化引擎
// ============================================================
//
// 算法步骤：
//   Step 1 — 调用 findOptimalBoxing 获取所有装箱方案
//   Step 2 — 对每个装箱方案调用 findOptimalPalletizing 获取码垛方案
//   Step 3 — 取每个装箱方案的最佳码垛方案
//   Step 4 — 计算综合评分（托盘体积利用率 + 每托产品数 + 纸箱空间利用率 + 纸箱规整度）
//   Step 5 — 按综合评分降序排列，返回 top N
// ============================================================

import type { OptimizerInput, OptimizerConfig, CombinedSolution, BoxingSolution } from './types'
import { DEFAULT_OPTIMIZER_CONFIG } from './types'
import { findOptimalBoxing } from './boxing'
import { findOptimalPalletizing } from './palletizing'

/**
 * 方案去重：将纸箱外尺寸三边排序后拼接 + totalCount 作为唯一 key，
 * 同 key 保留综合评分更高的方案。
 */
function deduplicateSolutions(solutions: BoxingSolution[]): BoxingSolution[] {
  const seen = new Map<string, BoxingSolution>()

  for (const sol of solutions) {
    const dims = [sol.outerDim.length, sol.outerDim.width, sol.outerDim.height].sort((a, b) => a - b)
    const key = `${dims[0]}_${dims[1]}_${dims[2]}_${sol.totalCount}`

    const existing = seen.get(key)
    if (!existing || sol.score > existing.score) {
      seen.set(key, sol)
    }
  }

  return Array.from(seen.values()).sort((a, b) => b.score - a.score)
}

/**
 * 全链路优化：从纸盒→纸箱→托盘，返回按综合评分降序排列的 top N 方案。
 *
 * @param input  完整输入参数（纸盒尺寸、纸箱约束、托盘尺寸、托盘约束）
 * @param config 优化器配置（权重、topN），默认值见 DEFAULT_OPTIMIZER_CONFIG
 * @returns      按综合评分降序排列的 top N CombinedSolution 数组
 */
export function runFullOptimization(
  input: OptimizerInput,
  config: OptimizerConfig = DEFAULT_OPTIMIZER_CONFIG,
): CombinedSolution[] {
  // ---- Step 1: 获取所有装箱方案并去重 --------------------------

  const boxingSolutions = deduplicateSolutions(
    findOptimalBoxing(input.carton, input.boxConstraint),
  )
  if (boxingSolutions.length === 0) return []

  // ---- Step 2-3: 对每个装箱方案找最佳码垛方案 --------------------

  const combined: CombinedSolution[] = []

  for (const boxing of boxingSolutions) {
    const palletSolutions = findOptimalPalletizing(
      boxing.outerDim,
      input.pallet,
      input.palletConstraint,
      { productsPerBox: boxing.totalCount },
    )

    if (palletSolutions.length === 0) continue

    // 取最佳码垛方案（已按面积利用率降序排列）
    combined.push({
      boxing,
      palletizing: palletSolutions[0],
      overallScore: 0, // 暂存，下一步计算
    })
  }

  if (combined.length === 0) return []

  // ---- Step 4: 计算综合评分 ------------------------------------

  const maxTotalProducts = Math.max(
    ...combined.map((s) => s.palletizing.totalProducts),
  )

  for (const solution of combined) {
    const normalizedPalletVol = solution.palletizing.volumeUtilization
    const normalizedProductCount =
      maxTotalProducts > 0
        ? solution.palletizing.totalProducts / maxTotalProducts
        : 0
    const normalizedBoxUtil = solution.boxing.volumeUtilization
    const normalizedRegularity = solution.boxing.regularity

    solution.overallScore =
      config.palletVolumeWeight * normalizedPalletVol +
      config.productCountWeight * normalizedProductCount +
      config.boxUtilWeight * normalizedBoxUtil +
      config.regularityWeight * normalizedRegularity
  }

  // ---- Step 5: 按码垛模式分组，各取 top N/2 -----------------------

  const simple: CombinedSolution[] = []
  const mixed: CombinedSolution[] = []

  for (const solution of combined) {
    if (solution.palletizing.layout.pattern === 'row-split-alternating') {
      mixed.push(solution)
    } else {
      simple.push(solution)
    }
  }

  simple.sort((a, b) => b.overallScore - a.overallScore)
  mixed.sort((a, b) => b.overallScore - a.overallScore)

  const half = Math.ceil(config.topN / 2)
  return [...simple.slice(0, half), ...mixed.slice(0, half)]
}
