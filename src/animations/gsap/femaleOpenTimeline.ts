import { gsap } from 'gsap'
import { EASE } from '../motion'

/**
 * CHẠM VÀO THƯ (nhánh Nữ):
 *   nhấn (0.98) → cánh hoa bay tới đỡ lấy các mép phong bì → phong bì trượt ra khỏi bó hoa,
 *   được nâng lên TRƯỚC bó hoa, to ra giữa màn (nền giữ nguyên, không tối đi) → cánh hoa buông ra, chao đi
 *   → nắp mở (lật quanh nếp gấp, dấu sáp đi theo nắp) → THIỆP (viền đỏ đô) ló lên một chút rồi nằm yên
 *   → VÉ được nâng từ từ theo đường chéo từ trái lên, dừng ở thế nằm chéo trước thiệp.
 * GSAP giữ transform/opacity. Vị trí đích đo bằng getBoundingClientRect.
 */
export type OpenRefs = {
  stage: HTMLElement
  env: HTMLElement
  envFloat: HTMLElement
  envShadow: HTMLElement
  envSun: HTMLElement
  envClosed: HTMLElement
  pocket: HTMLElement
  inner: HTMLElement[] // lớp của phong bì lúc nhận hạt sáng (thân E2 có miệng túi, giấy, ánh sáng) — ẩn khi mở lại
  wall: HTMLElement
  flap: HTMLElement
  ticket: HTMLElement
  letter: HTMLElement
  carry: HTMLElement[]
  cta: HTMLElement
}

const center = (r: DOMRect) => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 })

export function femaleOpenTimeline(o: OpenRefs, onDone: () => void) {
  const S = o.stage.getBoundingClientRect()
  const R = o.env.getBoundingClientRect() // phong bì đang nằm (đã xoay nhẹ, thu nhỏ)
  const Rc = center(R)
  const cur = {
    x: gsap.getProperty(o.env, 'x') as number,
    y: gsap.getProperty(o.env, 'y') as number,
    s: gsap.getProperty(o.env, 'scale') as number,
  }
  const baseW = R.width / cur.s // bề ngang gốc (chưa scale; bỏ qua xoay rất nhỏ)
  // đích: giữa màn, hơi thấp (chừa chỗ cho vé + thiệp trồi lên), rộng 86% màn
  const sNew = (S.width * 0.86) / baseW
  const C = { x: S.left + S.width / 2, y: S.top + S.height * 0.6 }
  // bước 1: trượt ra khỏi bó hoa (sang phải + xuống nhẹ) rồi mới lên trước
  const out = { x: cur.x + S.width * 0.07, y: cur.y + S.height * 0.02 }

  // cánh hoa: 2 mép dưới, 2 góc trên, giữa 2 cạnh bên … (điểm đỡ quanh phong bì)
  const holds = [
    [-0.42, 0.52], [-0.12, 0.56], [0.2, 0.55], [0.46, 0.46],
    [-0.52, -0.1], [0.53, 0.05], [-0.3, -0.5], [0.34, -0.52],
  ]
  const at = (c: { x: number; y: number }, w: number, h: number, i: number) => ({
    x: c.x + holds[i % holds.length][0] * w - S.left,
    y: c.y + holds[i % holds.length][1] * h - S.top,
  })

  const tl = gsap.timeline({ onComplete: onDone })
  tl.addLabel('press', 0)
    .to(o.envFloat, { scale: 0.98, rotation: 0, y: 0, duration: 0.12, ease: 'power2.out' }, 'press')
    .to(o.envFloat, { scale: 1, duration: 0.25, ease: EASE.settle }, 'press+=0.12')
    .to(o.cta, { autoAlpha: 0, duration: 0.25 }, 'press')

  // ---------- cánh hoa bay tới đỡ phong bì ----------
  tl.addLabel('gather', 'press+=0.15')
  o.carry.forEach((p, i) => {
    const from = { x: (i % 2 ? S.width + 30 : -60) , y: S.height * (0.15 + ((i * 37) % 70) / 100) }
    const to = at(Rc, R.width, R.height, i)
    gsap.set(p, { x: from.x, y: from.y, xPercent: -50, yPercent: -50, rotation: i * 47, autoAlpha: 0 })
    tl.to(p, { autoAlpha: 1, duration: 0.2 }, `gather+=${i * 0.05}`)
      .to(p, { x: to.x, y: to.y, rotation: `+=${i % 2 ? -200 : 220}`, duration: 0.85, ease: 'power2.out' }, `gather+=${i * 0.05}`)
  })

  // ---------- phong bì được nâng lên trước bó hoa ----------
  tl.addLabel('lift', 'gather+=0.95')
    .to(o.envSun, { autoAlpha: 0, duration: 0.4 }, 'lift')
    .to(o.env, { x: out.x, y: out.y, rotation: 2, duration: 0.45, ease: 'power2.inOut' }, 'lift')
    .to(o.envShadow, { autoAlpha: 0.35, y: 22, scale: 1.08, duration: 0.45 }, 'lift')
    .set(o.env, { zIndex: 40 }, 'lift+=0.45') // đã ra khỏi bó hoa → nằm trên mọi thứ
    .to(o.env, { x: cur.x + (C.x - Rc.x), y: cur.y + (C.y - Rc.y), scale: sNew, rotation: 0, duration: 1.1, ease: 'power3.inOut' }, 'lift+=0.45')
  // cánh hoa đi cùng phong bì (giữ đúng điểm đỡ, to theo)
  const k = sNew / cur.s
  o.carry.forEach((p, i) => {
    const moved = at({ x: C.x, y: C.y }, R.width * k, R.height * k, i)
    tl.to(p, { x: moved.x, y: moved.y, scale: 1.25, duration: 1.1, ease: 'power3.inOut' }, 'lift+=0.45')
  })
  // buông ra: chao nghiêng rơi đi, mờ dần
  tl.addLabel('release', 'lift+=1.6')
  o.carry.forEach((p, i) => {
    const dir = i % 2 ? 1 : -1
    tl.to(p, { x: `+=${dir * (40 + i * 9)}`, y: `+=${120 + i * 14}`, rotation: `+=${dir * 160}`, autoAlpha: 0, duration: 1.5 + (i % 3) * 0.2, ease: 'power1.in' }, `release+=${i * 0.04}`)
  })

  // ---------- mở nắp ----------
  tl.addLabel('open', 'lift+=1.5')
    // nắp (mặt ngoài có dấu sáp) che đúng phần thân đã đóng → đổi sang túi mở mà mắt không thấy
    .set(o.envClosed, { autoAlpha: 0 }, 'open')
    .set(o.inner, { autoAlpha: 0 }, 'open')
    .set([o.pocket, o.wall, o.ticket, o.letter], { autoAlpha: 1 }, 'open')
    .to(o.envFloat, { scale: 0.99, duration: 0.14, ease: 'power2.out' }, 'open')
    .to(o.envFloat, { scale: 1, duration: 0.3, ease: EASE.settle }, 'open+=0.14')
    .to(o.flap, { rotationX: 0, duration: 0.9, ease: 'power2.inOut' }, 'open+=0.12')
    .set(o.flap, { zIndex: 0 }, 'open+=0.57') // nắp dựng qua 90° → nằm SAU vé + thiệp

  // ---------- THIỆP ló lên trước một chút (viền đỏ đô) — rồi nằm yên ----------
  tl.addLabel('letter', 'open+=0.8')
    // thiệp nhô lên vừa phải (≈1/3 thiệp ra khỏi miệng túi); chữ nhỏ nên vẫn đọc trọn qua miệng chữ V
    .to(o.letter, { yPercent: -50, rotation: -0.5, duration: 1.2, ease: 'power2.out' }, 'letter')
  // ---------- VÉ được nâng từ từ, chéo từ trái lên, rồi nằm chéo trước thiệp ----------
  tl.addLabel('ticket', 'letter+=1.1')
    // nằm trọn trong bề ngang phong bì (xoay -8° vẫn không chìa ra 2 bên), chỉ góc phải nhô lên khỏi miệng túi
    .fromTo(o.ticket, { xPercent: -10, yPercent: 10, rotation: 0 },
      { xPercent: 0, yPercent: -112, rotation: -20, duration: 2.1, ease: 'power2.inOut' }, 'ticket')

  return tl
}
