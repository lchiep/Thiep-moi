import { useEffect } from 'react'
import { gsap } from 'gsap'
import { Draggable } from 'gsap/Draggable'
import { SWIPE } from '../animations/motion'

gsap.registerPlugin(Draggable)

type Options = {
  slider: React.RefObject<HTMLElement | null>
  enabled: boolean
  onStart: () => void
  onCancel: () => void
  onAnswer: () => void
}

/**
 * Vuốt thật để nghe máy (GSAP Draggable).
 * GSAP là chủ duy nhất transform của núm + opacity của chữ trong lúc kéo.
 * - kéo có lực cản
 * - thả < 82%: bật về
 * - thả ≥ 82%: hít vào cuối + nảy nhẹ → onAnswer
 */
export function useSwipeAnswer({ slider, enabled, onStart, onCancel, onAnswer }: Options) {
  useEffect(() => {
    const root = slider.current
    if (!root || !enabled) return
    const knob = root.querySelector<HTMLElement>('[data-knob]')!
    const label = root.querySelector<HTMLElement>('.sta__label')!
    const pad = parseFloat(getComputedStyle(knob).left) || 6
    const max = () => root.clientWidth - knob.offsetWidth - pad * 2

    const setLabel = gsap.quickSetter(label, 'opacity')
    const reflect = (x: number) => setLabel(Math.max(0, 1 - (x / max()) * 1.6))

    const [drag] = Draggable.create(knob, {
      type: 'x',
      bounds: { minX: 0, maxX: max() },
      edgeResistance: 0.85,
      dragResistance: SWIPE.resistance * 0.25,
      cursor: 'grab',
      activeCursor: 'grabbing',
      onPress() {
        gsap.killTweensOf(knob) // dừng gợi ý nhích
        gsap.to(knob, { scale: 0.96, duration: 0.12, ease: 'power2.out' })
      },
      onDragStart: onStart,
      onDrag() {
        reflect(this.x)
      },
      onRelease() {
        gsap.to(knob, { scale: 1, duration: 0.2, ease: 'power2.out' })
        const progress = this.x / max()
        if (progress >= SWIPE.threshold) {
          this.disable()
          gsap
            .timeline({ onComplete: onAnswer })
            .to(knob, { x: max(), duration: 0.18, ease: 'power3.out', onUpdate: () => reflect(gsap.getProperty(knob, 'x') as number) })
            .to(knob, { x: max() - 7, duration: 0.09, ease: 'power2.out' })
            .to(knob, { x: max(), duration: 0.16, ease: 'back.out(3)' })
        } else {
          gsap.to(knob, {
            x: 0,
            duration: 0.55,
            ease: 'back.out(1.6)',
            onUpdate: () => reflect(gsap.getProperty(knob, 'x') as number),
            onComplete: onCancel,
          })
        }
      },
    })

    const onResize = () => drag.applyBounds({ minX: 0, maxX: max() })
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      drag.kill()
    }
  }, [slider, enabled, onStart, onCancel, onAnswer])
}
