import { gsap } from 'gsap'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'

gsap.registerPlugin(MotionPathPlugin)

/**
 * CHẠM VÀO THƯ (nhánh Nữ) — phong bì được NHẤC lên như bằng tay (không có cánh hoa bay tới đỡ — Hiệp chê 29/09):
 *   nhấn (0.98) → mép xa nhấc khỏi mặt lụa trước (nghiêng 3D nhẹ, bóng tách ra, mềm + nhạt dần)
 *   → đi theo MỘT đường cong liền (sang phải-lên để thoát khỏi bó hoa rồi vòng về giữa màn, to dần = lại gần máy quay)
 *   → hạ xuống, nhún rất nhẹ → nắp mở → THIỆP ló lên → VÉ nâng chéo từ trái lên.
 * GSAP giữ transform/opacity. Vị trí đích đo bằng getBoundingClientRect. Bóng không dùng filter blur.
 */
export type OpenRefs = {
  stage: HTMLElement
  env: HTMLElement
  envFloat: HTMLElement
  envShadow: HTMLElement
  envSun: HTMLElement
  envClosed: HTMLElement
  pocket: HTMLElement
  inner: HTMLElement[] // lớp của phong bì lúc nhận hạt sáng — ẩn khi mở lại
  wall: HTMLElement
  flap: HTMLElement
  ticket: HTMLElement
  letter: HTMLElement
  cta: HTMLElement
}

const center = (r: DOMRect) => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 })

export function femaleOpenTimeline(o: OpenRefs, onDone: () => void) {
  const S = o.stage.getBoundingClientRect()
  const R = o.env.getBoundingClientRect() // phong bì đang nằm (xoay nhẹ, thu nhỏ)
  const Rc = center(R)
  const cur = {
    x: gsap.getProperty(o.env, 'x') as number,
    y: gsap.getProperty(o.env, 'y') as number,
    s: gsap.getProperty(o.env, 'scale') as number,
  }
  const baseW = o.env.offsetWidth // bề ngang gốc (chưa scale)
  // đích: giữa màn, hơi thấp (chừa chỗ cho thiệp + vé nhô lên), rộng 86% màn
  const sNew = (S.width * 0.86) / baseW
  const C = { x: S.left + S.width / 2, y: S.top + S.height * 0.6 }
  const end = { x: cur.x + (C.x - Rc.x), y: cur.y + (C.y - Rc.y) }
  // điểm giữa đường cong: sang phải + lên (thoát khỏi bó hoa bên trái) rồi mới vòng về giữa
  const mid = { x: cur.x + S.width * 0.2, y: cur.y + (end.y - cur.y) * 0.35 - S.height * 0.05 }

  const tl = gsap.timeline({ onComplete: onDone })

  tl.addLabel('press', 0)
    .to(o.envFloat, { scale: 0.98, rotation: 0, y: 0, duration: 0.14, ease: 'power2.out' }, 'press')
    .to(o.envFloat, { scale: 1, duration: 0.3, ease: 'power2.out' }, 'press+=0.14')
    .to(o.cta, { autoAlpha: 0, duration: 0.3 }, 'press')
    .to(o.envSun, { autoAlpha: 0, duration: 0.25 }, 'press') // tắt lớp hoà màu trước khi phong bì chuyển động

  // ---------- nhấc: mép xa rời mặt lụa trước (nghiêng 3D), bóng tách ra ----------
  tl.addLabel('peel', 'press+=0.2')
    .to(o.envFloat, { rotationX: 10, transformPerspective: 900, transformOrigin: '50% 100%', duration: 0.45, ease: 'power2.out' }, 'peel')
    .to(o.envShadow, { x: 6, y: 14, scale: 1.04, autoAlpha: 0.7, duration: 0.45, ease: 'power2.out' }, 'peel')

  // ---------- bay theo 1 đường cong liền tới giữa màn ----------
  const T = 1.5
  tl.addLabel('lift', 'peel+=0.25')
    .to(o.env, { motionPath: { path: [{ x: cur.x, y: cur.y }, mid, end], curviness: 1.1 }, duration: T, ease: 'power2.inOut' }, 'lift')
    .to(o.env, { scale: sNew, rotation: 0, duration: T, ease: 'power2.inOut' }, 'lift')
    // đã thoát khỏi bó hoa (đang ở đoạn phải của đường cong) → lên trên mọi thứ
    .set(o.env, { zIndex: 40 }, `lift+=${T * 0.3}`)
    // càng xa mặt bàn: bóng càng lệch xa, to, nhạt
    .to(o.envShadow, { x: 14, y: 30, scale: 1.08, autoAlpha: 0.4, duration: T * 0.55, ease: 'sine.inOut' }, 'lift')
    // gần tới: giấy nằm phẳng lại, bóng thu về sát
    .to(o.envFloat, { rotationX: 0, duration: T * 0.5, ease: 'power2.inOut' }, `lift+=${T * 0.5}`)
    .to(o.envShadow, { x: 0, y: 0, scale: 1, autoAlpha: 0.6, duration: T * 0.45, ease: 'power2.out' }, `lift+=${T * 0.55}`)
    // nhún rất nhẹ khi hạ xuống
    .to(o.envFloat, { y: 3, duration: 0.18, ease: 'power2.out' }, `lift+=${T}`)
    .to(o.envFloat, { y: 0, duration: 0.3, ease: 'power2.inOut' }, `lift+=${T + 0.18}`)

  // ---------- mở nắp (nối liền ngay khi phong bì vừa tới) ----------
  tl.addLabel('open', `lift+=${T - 0.05}`)
    .set(o.envClosed, { autoAlpha: 0 }, 'open') // nắp (có dấu sáp) còn che đúng phần này → đổi lớp không lộ
    .set(o.inner, { autoAlpha: 0 }, 'open')
    .set([o.pocket, o.wall, o.ticket, o.letter], { autoAlpha: 1 }, 'open')
    .to(o.flap, { rotationX: 0, duration: 1.0, ease: 'power2.inOut' }, 'open')
    .set(o.flap, { zIndex: 0 }, 'open+=0.5') // nắp dựng qua 90° → nằm SAU thiệp + vé

  // ---------- THIỆP ló lên (khi nắp vừa dựng) rồi nằm yên ----------
  tl.addLabel('letter', 'open+=0.6')
    // thư là cả tờ thiệp dọc (cao ~2.7 lần phong bì) → ló lên ~9% chiều cao tờ = như trước
    .to(o.letter, { yPercent: -9.5, rotation: -0.5, duration: 1.3, ease: 'power2.out' }, 'letter')
  // ---------- VÉ nâng chéo từ từ từ trái lên ----------
  tl.addLabel('ticket', 'letter+=0.8')
    .fromTo(o.ticket, { xPercent: -10, yPercent: 10, rotation: 0 },
      { xPercent: 0, yPercent: -120, rotation: -20, duration: 2.1, ease: 'power2.inOut' }, 'ticket')

  return tl
}
