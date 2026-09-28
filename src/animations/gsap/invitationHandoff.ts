import { gsap } from 'gsap'

/**
 * Thiệp (ảnh/3D) đã phủ đúng khung giấy → THIỆP DOM (InvitationScene) thay chỗ.
 * Dùng CHUNG cho nhánh Nam (thiệp 3D trong tập hồ sơ) và nhánh Nữ (tờ thiệp rút từ phong bì).
 */
const MASK_PROPS = 'webkitMaskImage,maskImage,webkitMaskSize,maskSize,webkitMaskPosition,maskPosition,webkitMaskRepeat,maskRepeat,webkitMaskComposite,maskComposite'

/** Nền nhung hiện quanh khung giấy (giấy DOM còn ẩn, thiệp 3D vẫn thấy qua lỗ khoét). */
export function velvetAround(inv: HTMLElement) {
  const bg = inv.querySelector<HTMLElement>('.inv__bg')!
  const paper = inv.querySelector<HTMLElement>('.inv__paper')!
  const fill = inv.querySelectorAll('.inv__scroll, .inv__seal')
  const hole = () => {
    const r = paper.getBoundingClientRect()
    const b = bg.getBoundingClientRect()
    const L = 'linear-gradient(#000, #000)'
    return {
      webkitMaskImage: `${L}, ${L}`, maskImage: `${L}, ${L}`,
      webkitMaskSize: `100% 100%, ${r.width}px ${r.height}px`, maskSize: `100% 100%, ${r.width}px ${r.height}px`,
      webkitMaskPosition: `0 0, ${r.left - b.left}px ${r.top - b.top}px`, maskPosition: `0 0, ${r.left - b.left}px ${r.top - b.top}px`,
      webkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
      webkitMaskComposite: 'xor', maskComposite: 'exclude',
    }
  }
  return gsap
    .timeline()
    .set(inv, { visibility: 'visible' })
    .set(paper, { autoAlpha: 0 })
    .set(fill, { autoAlpha: 0 })
    // đo lỗ khoét NGAY khi dựng timeline (thiệp DOM đã dàn trang sẵn dù đang ẩn) → .set chạy cả khi tua
    .set(bg, hole())
    .fromTo(bg, { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.2, ease: 'sine.inOut' })
}

/** Thiệp 3D đã phủ đúng khung → thiệp DOM thay chỗ (nền nhung đã hiện sẵn quanh). */
export function handoff(inv: HTMLElement) {
  const bg = inv.querySelector('.inv__bg')
  const paper = inv.querySelector('.inv__paper')
  const fill = inv.querySelectorAll('.inv__scroll, .inv__seal')
  return gsap
    .timeline()
    .set(inv, { visibility: 'visible' })
    // giấy 3D bị ánh đèn phòng làm tối hơn → giấy DOM bắt đầu cùng độ sáng rồi sáng dần lên
    .fromTo(paper, { autoAlpha: 0, filter: 'brightness(0.8)' }, { autoAlpha: 1, duration: 0.35, ease: 'power1.out' })
    .to(paper, { filter: 'brightness(1)', duration: 1.1, ease: 'sine.inOut' }, '<0.2')
    .set(paper, { clearProps: 'filter' })
    .set(bg, { autoAlpha: 1 }, 0)
    .fromTo(fill, { autoAlpha: 0, y: -6 }, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.15, ease: 'power2.out' }, 0.3)
    // giấy đã phủ kín lỗ → bỏ mặt nạ (xoay/đổi cỡ màn hình không bị hở)
    .set(bg, { clearProps: MASK_PROPS })
}
