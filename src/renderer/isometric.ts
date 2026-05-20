// ============================================================
// 等轴测投影工具函数 (30-degree isometric)
// ============================================================

export const ISO_ANGLE = Math.PI / 6 // 30 degrees
export const ISO_SIN = Math.sin(ISO_ANGLE)
export const ISO_COS = Math.cos(ISO_ANGLE)

/**
 * 将三维坐标 (x, y, z) 投影到二维屏幕坐标。
 * x 轴向右下 30°，y 轴向左下 30°，z 轴向上。
 */
export function isoProject(
  x: number,
  y: number,
  z: number,
): [number, number] {
  return [(x - y) * ISO_COS, (x + y) * ISO_SIN - z]
}

/**
 * Painter's algorithm 排序 — 按深度 (z + y + x) 降序排列，
 * 保证较远的物体先绘制，实现正确的遮挡关系。
 */
export function paintersSort<
  T extends { x: number; y: number; z: number },
>(items: T[]): T[] {
  return [...items].sort(
    (a, b) => b.x + b.y + b.z - (a.x + a.y + a.z),
  )
}
