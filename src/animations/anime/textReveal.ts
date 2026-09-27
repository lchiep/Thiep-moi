import { animate, stagger, createScope, type Scope } from 'animejs'

/**
 * Chữ "nắng in lên tường" (Anime.js — chỉ chữ, không đụng khối GSAP):
 *  - tiêu đề thư pháp: vệt sáng quét trái → phải (mask), giữ nét nối của chữ viết tay
 *  - tên khách: hiện từng ký tự (mờ → rõ, nhích lên)
 */
export function wallTitleReveal(root: HTMLElement, reduce: boolean): Scope {
  return createScope({ root }).add(() => {
    const wipe = { r: reduce ? 120 : -30 }
    const title = root.querySelectorAll<HTMLElement>('[data-wipe]')
    const apply = () => title.forEach((el) => el.style.setProperty('--r', `${wipe.r}%`))
    apply()
    animate(wipe, { r: 120, duration: reduce ? 1 : 2200, ease: 'inOutSine', onUpdate: apply })
    animate('[data-char]', {
      opacity: [0, 1],
      translateY: [6, 0],
      filter: ['blur(4px)', 'blur(0px)'],
      duration: reduce ? 1 : 520,
      delay: stagger(reduce ? 0 : 55, { start: reduce ? 0 : 1300 }),
      ease: 'outCubic',
    })
    animate('[data-fade]', { opacity: [0, 1], duration: reduce ? 1 : 900, delay: reduce ? 0 : 900, ease: 'outSine' })
  })
}
