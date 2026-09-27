import { gsap } from 'gsap'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'

gsap.registerPlugin(MotionPathPlugin)

/**
 * CHẠM VÀO THƯ (nhánh Nữ):
 *   nhấn (0.98) → cánh hoa bay tới đậu quanh mép phong bì → phong bì được nâng lên theo MỘT đường cong liền
 *   (sang phải-lên để thoát khỏi bó hoa rồi vòng về giữa màn, to dần) — không dừng giữa chừng
 *   → cánh hoa buông ra, chao rơi → nắp mở → THIỆP ló lên rồi nằm yên → VÉ nâng chéo từ trái lên.
 *
 * Cho mượt: cánh hoa là CON của phong bì (đi cùng phong bì, không phải đuổi theo);
 * các đoạn nối nhau có chồng lấn (không có chỗ đứng khựng); bóng phong bì không dùng filter blur.
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
  inner: HTMLElement[] // lớp của phong bì lúc nhận hạt sáng — ẩn khi mở lại
  wall: HTMLElement
  flap: HTMLElement
  ticket: HTMLElement
  letter: HTMLElement
  carry: HTMLElement[] // cánh hoa — nằm TRONG phong bì (.fem__env-carry), toạ độ tính từ tâm phong bì
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
  const baseH = o.env.offsetHeight
  // đích: giữa màn, hơi thấp (chừa chỗ cho thiệp + vé nhô lên), rộng 86% màn
  const sNew = (S.width * 0.86) / baseW
  const C = { x: S.left + S.width / 2, y: S.top + S.height * 0.6 }
  const end = { x: cur.x + (C.x - Rc.x), y: cur.y + (C.y - Rc.y) }
  // điểm giữa đường cong: sang phải + lên (thoát khỏi bó hoa bên trái) rồi mới vòng về giữa
  const mid = { x: cur.x + S.width * 0.2, y: cur.y + (end.y - cur.y) * 0.35 - S.height * 0.05 }

  // cánh hoa: điểm đậu quanh mép phong bì (toạ độ riêng của phong bì, tính từ tâm)
  const holds = [
    [-0.44, 0.5], [-0.14, 0.54], [0.18, 0.53], [0.45, 0.44],
    [-0.52, -0.08], [0.53, 0.04], [-0.3, -0.48], [0.34, -0.5],
  ]
  const tl = gsap.timeline({ onComplete: onDone })

  tl.addLabel('press', 0)
    .to(o.envFloat, { scale: 0.98, rotation: 0, y: 0, duration: 0.14, ease: 'power2.out' }, 'press')
    .to(o.envFloat, { scale: 1, duration: 0.3, ease: 'power2.out' }, 'press+=0.14')
    .to(o.cta, { autoAlpha: 0, duration: 0.3 }, 'press')
    .to(o.envSun, { autoAlpha: 0, duration: 0.25 }, 'press') // tắt lớp hoà màu trước khi phong bì chuyển động

  // ---------- cánh hoa bay tới đậu quanh mép (từ ngoài màn vào, toạ độ quy về phong bì) ----------
  tl.addLabel('gather', 'press+=0.1')
  o.carry.forEach((p, i) => {
    const fromScreen = { x: i % 2 ? S.right + 40 : S.left - 40, y: S.top + S.height * (0.2 + ((i * 37) % 60) / 100) }
    const from = { x: (fromScreen.x - Rc.x) / cur.s, y: (fromScreen.y - Rc.y) / cur.s }
    const to = { x: holds[i][0] * baseW, y: holds[i][1] * baseH }
    tl.fromTo(p,
      { x: from.x, y: from.y, xPercent: -50, yPercent: -50, rotation: i * 47, autoAlpha: 0 },
      { x: to.x, y: to.y, rotation: `+=${i % 2 ? -200 : 220}`, autoAlpha: 1, duration: 0.8, ease: 'power2.out' },
      `gather+=${i * 0.045}`)
  })

  // ---------- phong bì bay lên theo 1 đường cong liền, bắt đầu ngay khi cánh hoa vừa tới ----------
  const T = 1.7
  tl.addLabel('lift', 'gather+=0.62')
    .to(o.env, { motionPath: { path: [{ x: cur.x, y: cur.y }, mid, end], curviness: 1.1 }, duration: T, ease: 'power2.inOut' }, 'lift')
    .to(o.env, { scale: sNew, rotation: 0, duration: T, ease: 'power2.inOut' }, 'lift')
    // đã thoát khỏi bó hoa (đang ở đoạn phải của đường cong, chuyển động nhanh) → lên trên mọi thứ
    .set(o.env, { zIndex: 40 }, `lift+=${T * 0.32}`)
    .to(o.envShadow, { autoAlpha: 0.35, y: 22, scale: 1.06, duration: T * 0.5, ease: 'sine.inOut' }, 'lift')
    .to(o.envShadow, { autoAlpha: 0.5, y: 10, scale: 1, duration: T * 0.5, ease: 'sine.inOut' }, `lift+=${T * 0.5}`)

  // ---------- cánh hoa buông ra, chao rơi ----------
  tl.addLabel('release', `lift+=${T - 0.25}`)
  o.carry.forEach((p, i) => {
    const dir = i % 2 ? 1 : -1
    tl.to(p, { x: `+=${dir * (30 + i * 8)}`, y: `+=${110 + i * 12}`, rotation: `+=${dir * 150}`, autoAlpha: 0, duration: 1.4 + (i % 3) * 0.2, ease: 'sine.in' }, `release+=${i * 0.04}`)
  })

  // ---------- mở nắp (nối liền ngay khi phong bì vừa tới) ----------
  tl.addLabel('open', `lift+=${T - 0.15}`)
    .set(o.envClosed, { autoAlpha: 0 }, 'open') // nắp (có dấu sáp) còn che đúng phần này → đổi lớp không lộ
    .set(o.inner, { autoAlpha: 0 }, 'open')
    .set([o.pocket, o.wall, o.ticket, o.letter], { autoAlpha: 1 }, 'open')
    .to(o.flap, { rotationX: 0, duration: 1.0, ease: 'power2.inOut' }, 'open')
    .set(o.flap, { zIndex: 0 }, 'open+=0.5') // nắp dựng qua 90° → nằm SAU thiệp + vé

  // ---------- THIỆP ló lên (khi nắp vừa dựng) rồi nằm yên ----------
  tl.addLabel('letter', 'open+=0.6')
    .to(o.letter, { yPercent: -34, rotation: -0.5, duration: 1.3, ease: 'power2.out' }, 'letter')
  // ---------- VÉ nâng chéo từ từ từ trái lên ----------
  tl.addLabel('ticket', 'letter+=0.8')
    .fromTo(o.ticket, { xPercent: -10, yPercent: 10, rotation: 0 },
      { xPercent: 0, yPercent: -100, rotation: -16, duration: 2.1, ease: 'power2.inOut' }, 'ticket')

  return tl
}
