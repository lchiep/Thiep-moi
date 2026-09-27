import { gsap } from 'gsap'
import { Draggable } from 'gsap/Draggable'

gsap.registerPlugin(Draggable)

/**
 * Vuốt SANG PHẢI để lật sang "trang bên trái":
 * cả cảnh hiện tại (scene) trượt sang phải theo ngón tay, trang mới (page) đi vào từ bên trái.
 * Không crossfade — hai trang nằm cạnh nhau như một dải giấy.
 * Thả quá 28% bề ngang (hoặc hất nhanh) → hoàn tất; chưa đủ → bật về.
 * GSAP là chủ duy nhất x của scene + page.
 */
type Args = {
  trigger: HTMLElement
  scene: HTMLElement
  page: HTMLElement
  onProgress?: (p: number) => void
  onComplete: () => void
}

export function createPageSwipe({ trigger, scene, page, onProgress, onComplete }: Args) {
  const proxy = document.createElement('div')
  const width = () => scene.getBoundingClientRect().width
  gsap.set(page, { xPercent: -100, visibility: 'visible' })

  const render = (px: number) => {
    const w = width()
    const p = Math.max(0, Math.min(1, px / w))
    gsap.set(scene, { x: p * w })
    gsap.set(page, { xPercent: -100 + p * 100 })
    // trang cũ tối dần khi bị đẩy đi (như lật trang)
    gsap.set(scene, { filter: `brightness(${1 - p * 0.45})` })
    onProgress?.(p)
    return p
  }

  let done = false
  const finish = () => {
    done = true
    drag.disable()
    const w = width()
    gsap
      .timeline({ onComplete })
      .to(scene, { x: w, filter: 'brightness(0.55)', duration: 0.75, ease: 'power3.out' }, 0)
      .to(page, { xPercent: 0, duration: 0.75, ease: 'power3.out' }, 0)
  }
  const back = () =>
    gsap.timeline().to(scene, { x: 0, filter: 'brightness(1)', duration: 0.5, ease: 'back.out(1.4)' }, 0).to(page, { xPercent: -100, duration: 0.5, ease: 'back.out(1.4)' }, 0)

  let lastX = 0
  let lastT = 0
  let vel = 0
  const [drag] = Draggable.create(proxy, {
    trigger,
    type: 'x',
    minimumMovement: 6,
    onPress() {
      gsap.killTweensOf([scene, page])
      gsap.set(proxy, { x: 0 })
      lastX = 0
      lastT = performance.now()
    },
    onDrag() {
      // chỉ vuốt sang phải; sang trái có lực cản
      const x = this.x < 0 ? this.x * 0.15 : this.x
      render(Math.max(0, x))
      const now = performance.now()
      vel = (this.x - lastX) / Math.max(1, now - lastT)
      lastX = this.x
      lastT = now
    },
    onRelease() {
      if (done) return
      const p = Math.max(0, this.x) / width()
      if (p > 0.28 || (vel > 0.6 && p > 0.08)) finish()
      else back()
    },
  })

  return {
    /** chạm (không kéo): hé trang bên trái rồi bật về để gợi ý cử chỉ */
    nudge() {
      if (done) return
      const w = width()
      gsap
        .timeline()
        .to(scene, { x: w * 0.12, duration: 0.35, ease: 'power2.out' }, 0)
        .to(page, { xPercent: -88, duration: 0.35, ease: 'power2.out' }, 0)
        .add(back(), '>')
    },
    kill() {
      drag.kill()
      gsap.killTweensOf([scene, page])
    },
  }
}
