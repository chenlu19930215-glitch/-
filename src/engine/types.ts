// ============================================================
// 包装装载优化 — 核心类型定义（单一事实来源）
// ============================================================

/** 纸盒（内装产品）原始尺寸，单位 mm */
export interface CartonDim {
  length: number
  width: number
  height: number
  /** 毛重 (kg)，可选的 */
  grossWeight?: number
}

/** 纸箱约束 */
export interface BoxConstraint {
  /** 纸箱外尺寸上限（长/宽/高任一方向），默认 600mm */
  maxOuterDim: number
  /** 单箱毛重上限，默认 15kg */
  maxWeight: number
  /** 纸箱壁厚，默认 5mm */
  wallThickness: number
  /** 长度方向余量，默认 2mm */
  clearanceL: number
  /** 宽度方向余量，默认 2mm */
  clearanceW: number
  /** 高度方向余量，默认 2mm */
  clearanceH: number
  /** 用户指定每箱纸盒数量（不指定则自动计算） */
  userBoxCount?: number
}

/** 托盘尺寸 */
export interface PalletDim {
  length: number
  width: number
  height: number
}

/** 托盘码垛约束 */
export interface PalletConstraint {
  /** 最大码垛高度（含托盘），默认 1500mm */
  maxHeight: number
  /** 最大毛重，默认 1000kg */
  maxWeight: number
  /** 允许的最大悬垂量，默认 0mm */
  maxOverhang: number
}

/** 纸盒朝向（6 种可能的旋转） */
export interface Orientation {
  /** 对应纸箱 length 方向的纸盒尺寸分量 */
  l: number
  /** 对应纸箱 width 方向的纸盒尺寸分量 */
  w: number
  /** 对应纸箱 height 方向的纸盒尺寸分量 */
  h: number
  /** 描述文字 */
  label: string
}

/** 单一装箱方案 */
export interface BoxingSolution {
  /** 纸盒朝向 */
  orientation: Orientation
  /** 各方向纸盒数量 [沿length, 沿width, 沿height] */
  counts: [number, number, number]
  /** 纸盒总数 */
  totalCount: number
  /** 纸箱内尺寸 (mm) */
  innerDim: { length: number; width: number; height: number }
  /** 纸箱外尺寸 (mm) */
  outerDim: { length: number; width: number; height: number }
  /** 毛重 (kg) */
  grossWeight: number
  /** 纸盒体积占纸箱内体积比例 */
  volumeUtilization: number
  /** 尺寸规整度 (长宽比接近1的程度) */
  regularity: number
  /** 重量评分 (越轻越高) */
  weightScore: number
  /** 综合评分 */
  score: number
}

/** 码垛排布信息 */
export interface LayerLayout {
  /** 沿托盘长度方向箱数 */
  alongLength: number
  /** 沿托盘宽度方向箱数 */
  alongWidth: number
  /** 每层箱数 */
  boxesPerLayer: number
  /** 总层数 */
  layers: number
  /** 托盘长度方向悬垂量 (mm) */
  overhangLength: number
  /** 托盘宽度方向悬垂量 (mm) */
  overhangWidth: number
  /** 面积利用率 */
  areaUtilization: number
  /** 负载总高度 (mm) */
  totalHeight: number
  /** 是否旋转90度 */
  rotated: boolean
  /** 排列模式 */
  pattern?: 'column' | 'row-split' | 'row-split-alternating'
  /** 行拆分区域A沿托盘长方向箱数 */
  rowSplitCountA?: number
  /** 行拆分区域B沿托盘长方向箱数 */
  rowSplitCountB?: number
  /** 交替层行拆分区域A沿托盘长方向箱数 */
  altRowSplitCountA?: number
  /** 交替层行拆分区域B沿托盘长方向箱数 */
  altRowSplitCountB?: number
}

/** 纸箱码垛方案 */
export interface PalletSolution {
  /** 对应纸箱外尺寸 */
  boxOuter: { length: number; width: number; height: number }
  /** 排布信息 */
  layout: LayerLayout
  /** 每托总箱数 */
  totalBoxes: number
  /** 每托总产品数 */
  totalProducts: number
  /** 托盘体积利用率 */
  volumeUtilization: number
}

/** 全链路综合方案 */
export interface CombinedSolution {
  /** 装箱方案 */
  boxing: BoxingSolution
  /** 码垛方案 */
  palletizing: PalletSolution
  /** 综合评分 */
  overallScore: number
}

/** 完整输入参数 */
export interface OptimizerInput {
  carton: CartonDim
  boxConstraint: BoxConstraint
  pallet: PalletDim
  palletConstraint: PalletConstraint
}

/** 优化器配置 */
export interface OptimizerConfig {
  /** 托盘体积利用率权重 */
  palletVolumeWeight: number
  /** 每托产品数权重 */
  productCountWeight: number
  /** 纸箱空间利用率权重 */
  boxUtilWeight: number
  /** 纸箱规整度权重 */
  regularityWeight: number
  /** 返回 top N 方案数 */
  topN: number
}

export const DEFAULT_BOX_CONSTRAINT: BoxConstraint = {
  maxOuterDim: 600,
  maxWeight: 15,
  wallThickness: 6,
  clearanceL: 10,
  clearanceW: 10,
  clearanceH: 5,
}

export const DEFAULT_PALLET_CONSTRAINT: PalletConstraint = {
  maxHeight: 1500,
  maxWeight: 1000,
  maxOverhang: 0,
}

export const DEFAULT_OPTIMIZER_CONFIG: OptimizerConfig = {
  palletVolumeWeight: 0.4,
  productCountWeight: 0.3,
  boxUtilWeight: 0.2,
  regularityWeight: 0.1,
  topN: 10,
}
