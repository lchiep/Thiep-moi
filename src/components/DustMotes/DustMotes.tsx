import { useEffect, useRef } from 'react'

/**
 * Bụi li ti bay chậm trong vệt nắng (canvas 2D, rất nhẹ).
 * Chỉ sáng khi nằm trong dải nắng xiên từ cửa sổ; ngoài dải gần như tắt.
 * Tự dừng khi tab ẩn; tắt hẳn nếu người dùng giảm chuyển động.
 */
type Mote = { x: number; y: number; r: number; vx: number; vy: number; tw: number; ph: number }

export default function DustMotes({ count = 46 }: { count?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current!
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const ctx = canvas.getContext('2d')!
    let w = 0, h = 0, raf = 0, last = performance.now()
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const resize = () => {
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const rand = (a: number, b: number) => a + Math.random() * (b - a)
    const motes: Mote[] = Array.from({ length: count }, () => ({
      x: Math.random(), y: rand(0, 0.55),
      r: rand(0.5, 1.7), vx: rand(-0.004, 0.01), vy: rand(-0.012, -0.002),
      tw: rand(0.6, 1.6), ph: Math.random() * 6.28,
    }))
    // dải nắng: từ mảng sáng trên tường (trên-trái) xiên xuống phải
    const beam = (x: number, y: number) => {
      const ax = 0.12, ay = 0.1, bx = 1.0, by = 0.46
      const t = Math.max(0, Math.min(1, ((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / ((bx - ax) ** 2 + (by - ay) ** 2)))
      const dx = x - (ax + t * (bx - ax)), dy = y - (ay + t * (by - ay))
      const d = Math.hypot(dx, dy * 1.4)
      return Math.exp(-(d * d) / (2 * 0.13 * 0.13)) * (1 - 0.45 * t)
    }

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      ctx.clearRect(0, 0, w, h)
      const t = now / 1000
      for (const m of motes) {
        m.x += (m.vx + Math.sin(t * 0.3 + m.ph) * 0.004) * dt
        m.y += (m.vy + Math.cos(t * 0.23 + m.ph) * 0.003) * dt
        if (m.y < -0.02) { m.y = 0.56; m.x = Math.random() }
        if (m.x < -0.02) m.x = 1.02
        if (m.x > 1.02) m.x = -0.02
        const a = beam(m.x, m.y) * (0.55 + 0.45 * Math.sin(t * m.tw + m.ph))
        if (a < 0.02) continue
        const px = m.x * w, py = m.y * h
        const g = ctx.createRadialGradient(px, py, 0, px, py, m.r * 2.6)
        g.addColorStop(0, `rgba(255,238,210,${0.85 * a})`)
        g.addColorStop(1, 'rgba(255,220,170,0)')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(px, py, m.r * 2.6, 0, Math.PI * 2)
        ctx.fill()
      }
      raf = requestAnimationFrame(frame)
    }
    const onVis = () => {
      cancelAnimationFrame(raf)
      if (!document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame) }
    }
    document.addEventListener('visibilitychange', onVis)
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [count])

  return <canvas ref={ref} className="dust-motes" aria-hidden />
}
