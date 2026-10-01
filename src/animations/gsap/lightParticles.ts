import { gsap } from 'gsap'

/**
 * Popup tan DẦN thành hạt sáng hồng (từ trên xuống dưới) rồi từng đợt hạt xoáy bay vào miệng phong bì.
 *  - Hạt kiểu "bụi vàng lấp lánh": phần lớn là đốm sáng nhỏ, một số là SAO 4 CÁNH (tia dài mảnh) nhấp nháy.
 *  - Mỗi hạt sinh ra đúng lúc đường "tan" quét qua độ cao của nó → popup biến mất dần từ đầu xuống cuối.
 * Vẽ trên 1 canvas 2D (hoà màu 'lighter'); GSAP là chủ thời gian (1 tween, vẽ trong onUpdate, không có rAF riêng).
 */
type P = {
  x0: number; y0: number // điểm sinh
  cx: number; cy: number // điểm uốn
  x1: number; y1: number // đích (miệng phong bì)
  t0: number // lúc sinh (giây)
  dur: number // thời gian bay (giây)
  r: number // bán kính đốm
  star: boolean // sao 4 cánh
  tw: number // pha lấp lánh
  spin: number // góc sao
}

// màu HỒNG (Hiệp chọn): viền hồng phấn, tâm trắng hồng
const GOLD = '255, 138, 184'

/** Đốm sáng tròn: tâm trắng, viền vàng tan dần. */
function dotSprite() {
  const s = 32
  const c = document.createElement('canvas')
  c.width = c.height = s
  const g = c.getContext('2d')!
  const grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
  grd.addColorStop(0, 'rgba(255,242,248,1)')
  grd.addColorStop(0.22, `rgba(${GOLD},0.95)`)
  grd.addColorStop(0.55, `rgba(${GOLD},0.25)`)
  grd.addColorStop(1, `rgba(${GOLD},0)`)
  g.fillStyle = grd
  g.fillRect(0, 0, s, s)
  return c
}

/** Sao 4 cánh: 2 tia dài mảnh (ngang + dọc) + quầng tròn nhỏ ở tâm. */
function starSprite() {
  const s = 96, h = s / 2
  const c = document.createElement('canvas')
  c.width = c.height = s
  const g = c.getContext('2d')!
  g.globalCompositeOperation = 'lighter'
  const ray = (horizontal: boolean) => {
    const grd = horizontal ? g.createLinearGradient(0, h, s, h) : g.createLinearGradient(h, 0, h, s)
    grd.addColorStop(0, `rgba(${GOLD},0)`)
    grd.addColorStop(0.42, `rgba(${GOLD},0.55)`)
    grd.addColorStop(0.5, 'rgba(255,242,248,1)')
    grd.addColorStop(0.58, `rgba(${GOLD},0.55)`)
    grd.addColorStop(1, `rgba(${GOLD},0)`)
    g.fillStyle = grd
    if (horizontal) g.fillRect(0, h - 1.2, s, 2.4)
    else g.fillRect(h - 1.2, 0, 2.4, s)
  }
  ray(true)
  ray(false)
  const glow = g.createRadialGradient(h, h, 0, h, h, s * 0.18)
  glow.addColorStop(0, 'rgba(255,242,248,1)')
  glow.addColorStop(0.35, `rgba(${GOLD},0.7)`)
  glow.addColorStop(1, `rgba(${GOLD},0)`)
  g.fillStyle = glow
  g.fillRect(0, 0, s, s)
  return c
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2) // cubic in-out

export function lightParticlesTween(opts: {
  canvas: HTMLCanvasElement
  from: DOMRect // vùng popup tan ra (toạ độ màn hình)
  to: { x: number; y: number; w: number } // miệng phong bì: tâm + bề rộng
  stage: DOMRect
  sweep: number // thời gian đường "tan" quét từ đỉnh xuống đáy popup (giây)
  spawnAt?: (fy: number) => number // lúc hạt ở độ cao fy (0 = đỉnh, 1 = đáy) được sinh ra — khớp với mặt nạ tan
  count?: number
  flight?: number // thời gian bay trung bình của 1 hạt (giây)
}) {
  const { canvas, from, to, stage, sweep } = opts
  // canvas toàn màn: giữ độ phân giải ≤ 1.5x (hạt sáng mềm, không cần nét 3x) → mỗi khung xoá/vẽ ít điểm ảnh hơn hẳn
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
  canvas.width = Math.round(stage.width * dpr)
  canvas.height = Math.round(stage.height * dpr)
  const ctx = canvas.getContext('2d')!
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  const dot = dotSprite(), star = starSprite()
  const flight = opts.flight ?? 1.25

  const n = opts.count ?? 560
  const ps: P[] = []
  for (let i = 0; i < n; i++) {
    const fy = Math.random()
    const x = from.left + Math.random() * from.width - stage.left
    const y = from.top + fy * from.height - stage.top
    const tx = to.x - stage.left + (Math.random() - 0.5) * to.w * 0.75
    const ty = to.y - stage.top + (Math.random() - 0.5) * 8
    const side = x < tx ? -1 : 1
    const isStar = Math.random() < 0.1
    ps.push({
      x0: x, y0: y,
      // hạt bung nhẹ sang bên rồi mới cong về phong bì
      cx: x + side * (30 + Math.random() * 70), cy: y + (ty - y) * (0.25 + Math.random() * 0.3),
      x1: tx, y1: ty,
      t0: (opts.spawnAt ? opts.spawnAt(fy) : fy * sweep) + Math.random() * 0.06,
      dur: flight * (0.8 + Math.random() * 0.45),
      r: isStar ? 5 + Math.random() * 6 : 0.8 + Math.pow(Math.random(), 2.2) * 3.2,
      star: isStar,
      tw: Math.random() * Math.PI * 2,
      spin: Math.random() * 0.5,
    })
  }
  const total = Math.max(...ps.map((p) => p.t0 + p.dur))

  const at = (p: P, k: number) => {
    const a = 1 - k
    return { x: a * a * p.x0 + 2 * a * k * p.cx + k * k * p.x1, y: a * a * p.y0 + 2 * a * k * p.cy + k * k * p.y1 }
  }

  const state = { t: 0 }
  const draw = () => {
    ctx.clearRect(0, 0, stage.width, stage.height)
    ctx.globalCompositeOperation = 'lighter'
    for (const p of ps) {
      const local = (state.t - p.t0) / p.dur
      if (local <= 0 || local >= 1) continue
      const k = ease(local)
      const { x, y } = at(p, k)
      // bừng sáng khi vừa tách khỏi popup; gần miệng phong bì thì nhỏ lại và tắt (bị hút vào)
      const life = Math.min(1, local * 5) * (1 - Math.pow(k, 5))
      const flick = 0.6 + 0.4 * Math.sin(p.tw + state.t * (p.star ? 9 : 22))
      ctx.globalAlpha = life * flick
      if (p.star) {
        const r = p.r * (1 - 0.5 * k) * (0.75 + 0.35 * flick) * 2.2
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(p.spin + state.t * 0.6)
        ctx.drawImage(star, -r, -r, r * 2, r * 2)
        ctx.restore()
      } else {
        const r = p.r * (1 - 0.45 * k) * 2.6
        ctx.drawImage(dot, x - r, y - r, r * 2, r * 2)
      }
    }
    ctx.globalAlpha = 1
  }

  return gsap.to(state, {
    t: total,
    duration: total,
    ease: 'none',
    onUpdate: draw,
    onComplete: () => ctx.clearRect(0, 0, stage.width, stage.height),
    onReverseComplete: () => ctx.clearRect(0, 0, stage.width, stage.height),
  })
}
