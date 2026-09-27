import { gsap } from 'gsap'
import { EASE } from '../motion'

/**
 * Nghe máy xong: giao diện cuộc gọi lùi lại (mờ, thu nhỏ, nhoè nhẹ),
 * NỀN GIỮ NGUYÊN.
 */
export function callAnsweredTimeline(fadeTargets: Element[], onComplete: () => void) {
  return gsap.timeline({ onComplete }).to(fadeTargets, {
    autoAlpha: 0,
    scale: 0.96,
    filter: 'blur(6px)',
    duration: 0.55,
    ease: EASE.ui,
    stagger: 0.04,
  })
}

/**
 * Popup "mọc" ra từ chính thanh slide-to-answer:
 * khung kính bắt đầu đúng bằng vị trí + bo góc của thanh trượt (đọc bằng
 * getBoundingClientRect, không hard-code pixel) rồi nở dần thành popup.
 */
export function popupOpenTimeline(popup: HTMLElement, origin: DOMRect, onComplete: () => void) {
  const host = popup.getBoundingClientRect()
  const top = origin.top - host.top
  const left = origin.left - host.left
  const right = host.right - origin.right
  const bottom = host.bottom - origin.bottom
  const r = origin.height / 2

  const items = popup.querySelectorAll('[data-gp-item]')
  const tl = gsap.timeline({ onComplete })
  tl.addLabel('grow')
    .fromTo(
      popup,
      { clipPath: `inset(${top}px ${right}px ${bottom}px ${left}px round ${r}px)` },
      { clipPath: 'inset(0px 0px 0px 0px round 0px)', duration: 0.95, ease: EASE.cinematic },
      'grow',
    )
    .fromTo(items, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.035, ease: EASE.paper }, 'grow+=0.45')
    .set(popup, { clearProps: 'clipPath' })
  return tl
}

/**
 * Huỷ: popup THU NGƯỢC về đúng thanh slide-to-answer — phản hồi ngay lập tức:
 * nội dung mờ đi cùng lúc (không stagger), khung kính co lại bằng clip-path
 * ngay từ khung hình đầu (không chờ đảo ngược từng lớp như reverse()).
 */
export function popupCloseTimeline(popup: HTMLElement, origin: DOMRect, onComplete: () => void) {
  const host = popup.getBoundingClientRect()
  const top = origin.top - host.top
  const left = origin.left - host.left
  const right = host.right - origin.right
  const bottom = host.bottom - origin.bottom
  const r = origin.height / 2
  const items = popup.querySelectorAll('[data-gp-item]')
  return gsap
    .timeline({ onComplete })
    .to(items, { autoAlpha: 0, y: 8, duration: 0.2, ease: 'power2.in' }, 0)
    .fromTo(
      popup,
      { clipPath: 'inset(0px 0px 0px 0px round 0px)' },
      { clipPath: `inset(${top}px ${right}px ${bottom}px ${left}px round ${r}px)`, duration: 0.55, ease: 'power3.inOut' },
      0.04,
    )
}
