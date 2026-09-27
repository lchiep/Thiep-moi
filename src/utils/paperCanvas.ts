/**
 * Tiện ích vẽ giấy thật lên canvas (dùng làm texture cho vé/thiệp 3D
 * và cho vé DOM sau này): nền giấy có thớ, mép hơi sậm, chữ giãn cách.
 */
export type Ctx = CanvasRenderingContext2D

export function makeCanvas(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return { canvas: c, ctx: c.getContext('2d')! }
}

let grainTile: HTMLCanvasElement | null = null
function grain() {
  if (grainTile) return grainTile
  const { canvas, ctx } = makeCanvas(256, 256)
  const img = ctx.createImageData(256, 256)
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 128 + (Math.random() - 0.5) * 70
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v
    img.data[i + 3] = 255
  }
  ctx.putImageData(img, 0, 0)
  // thớ sợi giấy: vài đường mảnh ngẫu nhiên
  ctx.globalAlpha = 0.08
  ctx.strokeStyle = '#000'
  for (let i = 0; i < 90; i++) {
    const x = Math.random() * 256
    const y = Math.random() * 256
    const a = Math.random() * Math.PI
    const l = 4 + Math.random() * 14
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l)
    ctx.stroke()
  }
  grainTile = canvas
  return canvas
}

/** Nền giấy: màu + thớ + mép sậm nhẹ. */
export function paper(ctx: Ctx, w: number, h: number, color: string, grainAlpha = 0.07) {
  ctx.save()
  ctx.fillStyle = color
  ctx.fillRect(0, 0, w, h)
  ctx.globalAlpha = grainAlpha
  ctx.globalCompositeOperation = 'multiply'
  ctx.fillStyle = ctx.createPattern(grain(), 'repeat')!
  ctx.fillRect(0, 0, w, h)
  ctx.globalCompositeOperation = 'source-over'
  ctx.globalAlpha = 1
  const v = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75)
  v.addColorStop(0, 'rgba(120,90,50,0)')
  v.addColorStop(1, 'rgba(120,90,50,0.14)')
  ctx.fillStyle = v
  ctx.fillRect(0, 0, w, h)
  ctx.restore()
}

type TextOpts = {
  font: string
  color: string
  x: number
  y: number
  align?: CanvasTextAlign
  spacing?: number // px
  maxWidth?: number
}
export function text(ctx: Ctx, s: string, o: TextOpts) {
  ctx.save()
  ctx.font = o.font
  ctx.fillStyle = o.color
  ctx.textAlign = o.align ?? 'left'
  ctx.textBaseline = 'alphabetic'
  if ('letterSpacing' in ctx) (ctx as Ctx & { letterSpacing: string }).letterSpacing = `${o.spacing ?? 0}px`
  // tự thu nhỏ nếu vượt bề rộng cho phép
  if (o.maxWidth) {
    let size = parseFloat(o.font.match(/(\d+(?:\.\d+)?)px/)?.[1] ?? '20')
    while (ctx.measureText(s).width > o.maxWidth && size > 8) {
      size -= 2
      ctx.font = o.font.replace(/\d+(?:\.\d+)?px/, `${size}px`)
    }
  }
  ctx.fillText(s, o.x, o.y)
  ctx.restore()
}

export function hairline(ctx: Ctx, x1: number, y1: number, x2: number, y2: number, color: string, width = 2) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()
  ctx.restore()
}

/** Đợi font web sẵn sàng trước khi vẽ lên canvas (không thì ra font mặc định). */
/**
 * Tải font TRƯỚC khi vẽ canvas. Google Fonts chia font thành nhiều mảnh (latin / latin-ext /
 * vietnamese); document.fonts.load(font) không kèm chữ chỉ tải mảnh latin → canvas vẽ "ằ, ệ, Đ…"
 * bằng font dự phòng (dấu lệch, xấu). Truyền kèm mẫu chữ Việt để tải đủ mọi mảnh.
 */
const VN_SAMPLE = 'AaĂăÂâĐđÊêÔôƠơƯưÁáẮắẤấẰằẦầẶặỆệỄễỪừỮữỹỳ'
export async function fontsReady(specs: string[]) {
  if (!document.fonts) return
  await Promise.all(specs.map((s) => document.fonts.load(s, VN_SAMPLE).catch(() => [])))
  await document.fonts.ready
}

export const INK = {
  cream: '#f3ead9',
  ivory: '#f8f2e6',
  burgundy: '#6e1f2a',
  charcoal: '#2a2622',
  gold: '#9c7b45',
  goldSoft: '#b8995f',
} as const
