import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

const DEFAULT_PDF_FILENAME = '包装装载方案报告'

// ---- html2canvas oklch 补丁 -----------------------------------------------
// html2canvas 1.4.1 不支持 CSS Color Level 4 的 oklch() 函数，
// Tailwind CSS 4 默认使用 oklch 表示颜色，导致导出时抛出
// "Attempting to parse an unsupported color function 'oklch'"。
//
// 在 onclone 回调中遍历克隆文档，将 color 类属性中的 oklch 值
// 通过 Canvas 2D 强制转为 sRGB(rgb/rgba)，再设回行内样式。
// ---------------------------------------------------------------------------

function patchOklchColors(doc: Document): void {
  const canvas = doc.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  const ctx = canvas.getContext('2d')!

  const toRgb = (val: string): string => {
    try {
      ctx.fillStyle = val.trim()
      ctx.fillRect(0, 0, 1, 1)
      const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
      return a < 255
        ? `rgba(${r},${g},${b},${(a / 255).toFixed(3)})`
        : `rgb(${r},${g},${b})`
    } catch {
      return val
    }
  }

  const colorProps = [
    'background-color',
    'color',
    'border-top-color',
    'border-right-color',
    'border-bottom-color',
    'border-left-color',
    'outline-color',
    'text-decoration-color',
  ]

  doc.querySelectorAll('*').forEach((el) => {
    const style = (el as HTMLElement).style
    try {
      const cs = doc.defaultView!.getComputedStyle(el)
      for (const prop of colorProps) {
        const val = cs.getPropertyValue(prop)
        if (val && /oklch/i.test(val)) {
          style.setProperty(prop, toRgb(val))
        }
      }
    } catch {
      // cross-origin stylesheet — skip
    }
  })
}

/**
 * Export a DOM element as a PDF report.
 *
 * @param element - The DOM element to capture (the results area)
 * @param filename - Output filename (without extension)
 */
export async function exportToPdf(
  element: HTMLElement,
  filename: string = DEFAULT_PDF_FILENAME,
): Promise<void> {
  if (!element) {
    throw new Error('导出失败：未找到要导出的内容区域')
  }

  try {
    // 先捕获 WebGL 画布内容（html2canvas 无法直接读取 WebGL 缓冲区）
    const canvasSnapshots: string[] = []
    element.querySelectorAll('canvas').forEach((canvas) => {
      try {
        canvasSnapshots.push(canvas.toDataURL('image/png'))
      } catch {
        canvasSnapshots.push('')
      }
    })

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      onclone: (_clonedDoc) => {
        patchOklchColors(_clonedDoc)

        // 将 WebGL canvas 替换为静态截图
        const canvases = _clonedDoc.querySelectorAll('canvas')
        canvases.forEach((cvs, i) => {
          if (canvasSnapshots[i]) {
            const img = _clonedDoc.createElement('img')
            img.src = canvasSnapshots[i]
            img.style.width = cvs.style.width || '400px'
            img.style.height = cvs.style.height || '400px'
            cvs.parentNode?.replaceChild(img, cvs)
          }
        })
      },
    })

    const pdf = new jsPDF('p', 'mm', 'a4')

    // A4 dimensions: 210 × 297 mm
    const pageWidth = 210
    const pageHeight = 297
    const margin = 15
    const usableWidth = pageWidth - margin * 2
    const usableHeight = pageHeight - margin * 2

    const imgWidth = canvas.width
    const imgHeight = canvas.height

    // Scale image to fit within page width
    const ratio = usableWidth / imgWidth
    let renderWidth = usableWidth
    let renderHeight = imgHeight * ratio

    let yOffset = margin

    if (renderHeight <= usableHeight) {
      // Fits on one page
      pdf.addImage(
        canvas.toDataURL('image/png'),
        'PNG',
        margin,
        yOffset,
        renderWidth,
        renderHeight,
      )
    } else {
      // Split across multiple pages
      const totalHeight = renderHeight
      let srcY = 0

      while (srcY < totalHeight) {
        const pageCanvas = document.createElement('canvas')
        pageCanvas.width = canvas.width
        pageCanvas.height = Math.min(
          canvas.height * (usableHeight / renderHeight),
          canvas.height - srcY / ratio,
        )

        const ctx = pageCanvas.getContext('2d')
        if (ctx) {
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height)
          ctx.drawImage(
            canvas,
            0,
            srcY / ratio,
            canvas.width,
            pageCanvas.height,
            0,
            0,
            pageCanvas.width,
            pageCanvas.height,
          )
        }

        if (srcY > 0) {
          pdf.addPage()
        }

        pdf.addImage(
          pageCanvas.toDataURL('image/png'),
          'PNG',
          margin,
          margin,
          renderWidth,
          usableHeight,
        )

        srcY += usableHeight
      }
    }

    pdf.save(filename + '.pdf')
  } catch (err) {
    throw new Error(
      `导出 PDF 失败：${err instanceof Error ? err.message : String(err)}`,
    )
  }
}

