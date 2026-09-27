import { gsap } from 'gsap'

/**
 * Popup tan thành HẠT SÁNG rồi xoáy bay vào miệng phong bì.
 * Vẽ trên 1 canvas 2D (hoà màu 'lighter' → hạt chồng lên nhau sáng rực như ánh nến);
 * GSAP là chủ thời gian: 1 tween tiến độ 0→1, mỗi lần cập nhật vẽ lại 1 khung (không có vòng rAF riêng).
 */
type P = {
  x0: number; y0: number // điểm sinh (trong khung popup)
  cx: number; cy: number // điểm uốn (xoáy)
  x1: number; y1: number // đích (miệng phong bì)
  d: number // trễ riêng (0..0.45)
  r: number // bán kính
  hue: 0 // (một màu)
  tw: number // pha lấp lánh
}

// MỘT màu duy nhất: vàng ấm (Hiệp không muốn lẫn hồng/be)
const COLORS = ['255, 206, 128']

function sprite(rgb: string) {
  const s = 32
  const c = document.createElement('canvas')
  c.width = c.height = s
  const g = c.getContext('2d')!
  const grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
  grd.addColorStop(0, `rgba(255,255,255,1)`)
  grd.addColorStop(0.25, `rgba(${rgb},0.9)`)
  grd.addColorStop(1, `rgba(${rgb},0)`)
  g.fillStyle = grd
  g.fillRect(0, 0, s, s)
  return c
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2) // cubic in-out

export function lightParticlesTween(opts: {
  canvas: HTMLCanvasElement
  from: DOMRect // khung popup (toạ độ màn hình)
  to: { x: number; y: number; w: number } // miệng phong bì: tâm + bề rộng
  stage: DOMRect
  count?: number
  duration?: number
  onArrive?: () => void // hạt đầu tiên chạm miệng phong bì
}) {
  const { canvas, from, to, stage } = opts
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = Math.round(stage.width * dpr)
  canvas.height = Math.round(stage.height * dpr)
  const ctx = canvas.getContext('2d')!
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  const sprites = COLORS.map(sprite)

  // hạt sinh dày ở mép khung kính + rải đều bên trong (popup "vỡ" ra từ viền sáng)
  const n = opts.count ?? 520
  const ps: P[] = []
  for (let i = 0; i < n; i++) {
    const edge = Math.random() < 0.45
    let x = from.left + Math.random() * from.width
    let y = from.top + Math.random() * from.height
    if (edge) {
      const side = (Math.random() * 4) | 0
      if (side === 0) y = from.top
      else if (side === 1) y = from.bottom
      else if (side === 2) x = from.left
      else x = from.right
    }
    x -= stage.left
    y -= stage.top
    const tx = to.x - stage.left + (Math.random() - 0.5) * to.w * 0.7
    const ty = to.y - stage.top + (Math.random() - 0.5) * 10
    // điểm uốn lệch sang bên → đường bay cong, cả đàn hạt xoáy nhẹ theo chiều kim đồng hồ
    const side = x < tx ? -1 : 1
    ps.push({
      x0: x, y0: y,
      cx: (x + tx) / 2 + side * (60 + Math.random() * 90), cy: Math.min(y, ty) - 40 - Math.random() * 120,
      x1: tx, y1: ty,
      d: Math.pow(Math.random(), 1.4) * 0.45,
      r: 1.2 + Math.pow(Math.random(), 2.5) * 5,
      hue: 0,
      tw: Math.random() * Math.PI * 2,
    })
  }

  const at = (p: P, k: number) => {
    const a = 1 - k
    return { x: a * a * p.x0 + 2 * a * k * p.cx + k * k * p.x1, y: a * a * p.y0 + 2 * a * k * p.cy + k * k * p.y1 }
  }

  let arrived = false
  const state = { t: 0 }
  const draw = () => {
    ctx.clearRect(0, 0, stage.width, stage.height)
    ctx.globalCompositeOperation = 'lighter'
    for (const p of ps) {
      const local = Math.min(1, Math.max(0, (state.t - p.d) / (1 - 0.45)))
      if (local <= 0 || local >= 1) continue
      const k = ease(local)
      const { x, y } = at(p, k)
      // lúc mới sinh: bừng sáng; gần tới miệng phong bì: nhỏ lại và tắt dần (bị hút vào trong)
      const life = Math.min(1, local * 6) * (1 - Math.pow(k, 6))
      const flick = 0.75 + 0.25 * Math.sin(p.tw + state.t * 40)
      const r = p.r * (1 - 0.55 * k) * 3
      ctx.globalAlpha = life * flick
      // vệt đuôi ngắn (2 vị trí lùi lại)
      const t1 = at(p, Math.max(0, k - 0.03))
      ctx.drawImage(sprites[p.hue], t1.x - r * 0.6, t1.y - r * 0.6, r * 1.2, r * 1.2)
      ctx.drawImage(sprites[p.hue], x - r, y - r, r * 2, r * 2)
      if (!arrived && k > 0.97) { arrived = true; opts.onArrive?.() }
    }
    ctx.globalAlpha = 1
  }

  return gsap.to(state, {
    t: 1,
    duration: opts.duration ?? 2.2,
    ease: 'none',
    onUpdate: draw,
    onComplete: () => ctx.clearRect(0, 0, stage.width, stage.height),
    onReverseComplete: () => ctx.clearRect(0, 0, stage.width, stage.height),
  })
}
