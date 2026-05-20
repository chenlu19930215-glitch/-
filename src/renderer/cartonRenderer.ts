// ============================================================
// Canvas 2D 等轴测纸箱渲染器
// ============================================================

import { isoProject, paintersSort } from './isometric'

export interface CartonRenderOptions {
  ctx: CanvasRenderingContext2D
  width: number
  height: number
  /** [沿 length, 沿 width, 沿 height] 方向纸盒数量 */
  counts: [number, number, number]
  /** 纸箱内尺寸 (mm) */
  innerDim: { length: number; width: number; height: number }
  /** 纸盒在当前方案中的朝向 (l/w/h 分别对应纸盒在纸箱 length/width/height 方向的分量) */
  cartonOrientation: { l: number; w: number; h: number }
}

// ---- 内部辅助接口 ------------------------------------------------

interface IsoBox {
  x: number
  y: number
  z: number
  sx: number
  sy: number
  sz: number
  fillColor: string
  strokeColor: string
}

// ---- 图层配色 ----------------------------------------------------

const LAYER_COLORS = [
  { fill: '#F08BA8', stroke: '#C73F62' }, // 底层 粉色
  { fill: '#7CBDE0', stroke: '#2E87B8' }, // 第二层 蓝色
]

function getLayerColors(layer: number): { fill: string; stroke: string } {
  return LAYER_COLORS[layer % LAYER_COLORS.length]
}

// ---- 等轴测多边形绘制 -------------------------------------------

function drawFace(
  ctx: CanvasRenderingContext2D,
  verts: [number, number, number][],
  fill: string | null,
  stroke: string | null,
  lineWidth: number,
  scale: number,
  ox: number,
  oy: number,
): void {
  const pts = verts.map(([x, y, z]) => {
    const [sx, sy] = isoProject(x, y, z)
    return [sx * scale + ox, sy * scale + oy] as const
  })

  ctx.beginPath()
  ctx.moveTo(pts[0][0], pts[0][1])
  for (let i = 1; i < pts.length; i++) {
    ctx.lineTo(pts[i][0], pts[i][1])
  }
  ctx.closePath()

  if (fill) {
    ctx.fillStyle = fill
    ctx.fill()
  }
  if (stroke) {
    ctx.strokeStyle = stroke
    ctx.lineWidth = lineWidth
    ctx.stroke()
  }
}

// ---- 等轴测盒子绘制（3 个可见面）----------------------------------

function drawIsoBox(
  ctx: CanvasRenderingContext2D,
  box: IsoBox,
  scale: number,
  ox: number,
  oy: number,
): void {
  const { x, y, z, sx, sy, sz, fillColor, strokeColor } = box

  // 顶面 (top)
  drawFace(
    ctx,
    [
      [x, y, z + sz],
      [x + sx, y, z + sz],
      [x + sx, y + sy, z + sz],
      [x, y + sy, z + sz],
    ],
    fillColor,
    strokeColor,
    1,
    scale,
    ox,
    oy,
  )

  // 右面 (right)
  drawFace(
    ctx,
    [
      [x, y, z],
      [x + sx, y, z],
      [x + sx, y, z + sz],
      [x, y, z + sz],
    ],
    fillColor,
    strokeColor,
    1,
    scale,
    ox,
    oy,
  )

  // 左面 (left)
  drawFace(
    ctx,
    [
      [x, y, z],
      [x, y + sy, z],
      [x, y + sy, z + sz],
      [x, y, z + sz],
    ],
    fillColor,
    strokeColor,
    1,
    scale,
    ox,
    oy,
  )
}

// ---- 标签绘制 ----------------------------------------------------

function drawAxisLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x3d: number,
  y3d: number,
  z3d: number,
  offsetX: number,
  offsetY: number,
  scale: number,
  ox: number,
  oy: number,
): void {
  const [sx, sy] = isoProject(x3d, y3d, z3d)
  const dx = sx * scale + ox + offsetX
  const dy = sy * scale + oy + offsetY

  ctx.save()
  ctx.font = 'bold 14px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#555555'
  ctx.fillText(text, dx, dy)
  ctx.restore()
}

// ---- 主渲染入口 --------------------------------------------------

export function renderCartonView(options: CartonRenderOptions): void {
  const { ctx, width, height, counts, innerDim, cartonOrientation } = options
  const [nl, nw, nh] = counts
  const { length: L, width: W, height: H } = innerDim

  // 1. 清空画布
  ctx.save()
  ctx.fillStyle = '#F8F8F8'
  ctx.fillRect(0, 0, width, height)

  // 遇到无效尺寸则提前返回
  if (L <= 0 || W <= 0 || H <= 0 || nl <= 0 || nw <= 0 || nh <= 0) {
    ctx.restore()
    return
  }

  // 2. 计算缩放与居中偏移
  const corners: [number, number, number][] = [
    [0, 0, 0],
    [L, 0, 0],
    [0, W, 0],
    [L, W, 0],
    [0, 0, H],
    [L, 0, H],
    [0, W, H],
    [L, W, H],
  ]

  const projected = corners.map(([x, y, z]) => isoProject(x, y, z))
  const xs = projected.map(([x]) => x)
  const ys = projected.map(([, y]) => y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)

  const rangeX = maxX - minX
  const rangeY = maxY - minY

  const PADDING = 40
  const scale = Math.min(
    rangeX > 0 ? (width - 2 * PADDING) / rangeX : 1,
    rangeY > 0 ? (height - 2 * PADDING) / rangeY : 1,
  )

  const centerOX = (width - (minX + maxX) * scale) / 2
  const centerOY = (height - (minY + maxY) * scale) / 2

  // 3. 内部纸盒参数
  const cl = cartonOrientation.l
  const cw = cartonOrientation.w
  const ch = cartonOrientation.h

  // 计算间隙（剩余空间均分）
  const gapL = nl > 1 ? Math.max(0, (L - nl * cl) / (nl - 1)) : 0
  const gapW = nw > 1 ? Math.max(0, (W - nw * cw) / (nw - 1)) : 0
  const gapH = nh > 1 ? Math.max(0, (H - nh * ch) / (nh - 1)) : 0

  const stepL = cl + gapL
  const stepW = cw + gapW
  const stepH = ch + gapH

  // 居中偏移（使纸盒阵列在外箱内居中）
  const totalSpanL = nl * cl + Math.max(0, nl - 1) * gapL
  const totalSpanW = nw * cw + Math.max(0, nw - 1) * gapW
  const totalSpanH = nh * ch + Math.max(0, nh - 1) * gapH
  const offsetL = Math.max(0, (L - totalSpanL) / 2)
  const offsetW = Math.max(0, (W - totalSpanW) / 2)
  const offsetH = Math.max(0, (H - totalSpanH) / 2)

  // 4. 定义外箱可见面（顶/右/左）
  const WALL_FILL = 'rgba(200, 180, 138, 0.12)'
  const WALL_STROKE = '#C8B48A'
  const WALL_LW = 2

  const outerFaces: Array<{ verts: [number, number, number][] }> = [
    // 顶面
    {
      verts: [
        [0, 0, H],
        [L, 0, H],
        [L, W, H],
        [0, W, H],
      ],
    },
    // 右面
    {
      verts: [
        [0, 0, 0],
        [L, 0, 0],
        [L, 0, H],
        [0, 0, H],
      ],
    },
    // 左面
    {
      verts: [
        [0, 0, 0],
        [0, W, 0],
        [0, W, H],
        [0, 0, H],
      ],
    },
  ]

  // 5. 半透明外箱填充（最底层）
  for (const face of outerFaces) {
    drawFace(ctx, face.verts, WALL_FILL, null, 0, scale, centerOX, centerOY)
  }

  // 6. 创建纸盒列表，按 Painter's Algorithm 排序
  const boxes: IsoBox[] = []

  for (let k = 0; k < nh; k++) {
    const { fill: fillColor, stroke: strokeColor } = getLayerColors(k)
    for (let j = 0; j < nw; j++) {
      for (let i = 0; i < nl; i++) {
        boxes.push({
          x: offsetL + i * stepL,
          y: offsetW + j * stepW,
          z: offsetH + k * stepH,
          sx: cl,
          sy: cw,
          sz: ch,
          fillColor,
          strokeColor,
        })
      }
    }
  }

  const sortedBoxes = paintersSort(boxes)

  for (const box of sortedBoxes) {
    drawIsoBox(ctx, box, scale, centerOX, centerOY)
  }

  // 7. 外箱轮廓线（最上层 — "玻璃箱"效果）
  for (const face of outerFaces) {
    drawFace(ctx, face.verts, null, WALL_STROKE, WALL_LW, scale, centerOX, centerOY)
  }

  // 8. 轴标签 L / W / H
  drawAxisLabel(ctx, 'L', L / 2, 0, 0, 0, 18, scale, centerOX, centerOY)
  drawAxisLabel(ctx, 'W', 0, W / 2, 0, 0, 18, scale, centerOX, centerOY)
  drawAxisLabel(ctx, 'H', 0, 0, H / 2, -18, 0, scale, centerOX, centerOY)

  ctx.restore()
}
