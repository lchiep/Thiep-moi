import { gsap } from 'gsap'
import { EASE, PARALLAX_PX } from '../motion'

type CallEls = {
  root: HTMLElement
  bg: HTMLElement
  header: HTMLElement
  actions: HTMLElement
  slider: HTMLElement
}

/**
 * Màn cuộc gọi hiện lên: nền sáng dần như màn hình vừa bật,
 * chữ và nút lần lượt trồi nhẹ lên. GSAP là chủ transform/opacity của các khối này.
 */
export function callEnterTimeline(els: CallEls) {
  const headerItems = els.header.children
  const tl = gsap.timeline({ defaults: { ease: EASE.paper } })
  tl.addLabel('wake')
    .fromTo(els.bg, { scale: 1.06, filter: 'brightness(0.35)' }, { scale: 1.02, filter: 'brightness(1)', duration: 1.8, ease: 'power2.out' }, 'wake')
    .from(headerItems, { autoAlpha: 0, y: 14, duration: 0.9, stagger: 0.12 }, 'wake+=0.45')
    .from(els.actions.children, { autoAlpha: 0, y: 12, duration: 0.8, stagger: 0.1 }, 'wake+=0.8')
    .from(els.slider, { autoAlpha: 0, y: 18, duration: 0.9 }, 'wake+=0.95')
  return tl
}

/** Gợi ý vuốt: núm trượt nhích sang phải rồi lùi về, lặp lại thưa. */
export function knobHint(knob: HTMLElement) {
  return gsap
    .timeline({ repeat: -1, repeatDelay: 3.2, delay: 2.4 })
    .to(knob, { x: 26, duration: 0.45, ease: 'power2.out' })
    .to(knob, { x: 0, duration: 0.7, ease: 'back.out(2)' })
}

/** Parallax rất nhẹ cho nền theo ngón tay / chuột (4–8px, có damping). */
export function bgParallax(root: HTMLElement, bg: HTMLElement) {
  const xTo = gsap.quickTo(bg, 'x', { duration: 1.4, ease: 'power3.out' })
  const yTo = gsap.quickTo(bg, 'y', { duration: 1.4, ease: 'power3.out' })
  const onMove = (e: PointerEvent) => {
    const r = root.getBoundingClientRect()
    const nx = (e.clientX - r.left) / r.width - 0.5
    const ny = (e.clientY - r.top) / r.height - 0.5
    xTo(-nx * PARALLAX_PX.background)
    yTo(-ny * PARALLAX_PX.background)
  }
  root.addEventListener('pointermove', onMove)
  return () => root.removeEventListener('pointermove', onMove)
}
